/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { vi, describe, it, expect, beforeEach, afterEach, } from 'vitest';
import { modifyWithEditor, isModifiableTool, } from './modifiable-tool.js';
import fs from 'fs';
import os from 'os';
import * as path from 'path';
// Mock dependencies
const mockOpenDiff = vi.hoisted(() => vi.fn());
const mockCreatePatch = vi.hoisted(() => vi.fn());
vi.mock('../utils/editor.js', () => ({
    openDiff: mockOpenDiff,
}));
vi.mock('diff', () => ({
    createPatch: mockCreatePatch,
}));
vi.mock('fs');
vi.mock('os');
describe('modifyWithEditor', () => {
    let tempDir;
    let mockModifyContext;
    let mockParams;
    let currentContent;
    let proposedContent;
    let modifiedContent;
    let abortSignal;
    beforeEach(() => {
        vi.resetAllMocks();
        tempDir = '/tmp/test-dir';
        abortSignal = new AbortController().signal;
        currentContent = 'original content\nline 2\nline 3';
        proposedContent = 'modified content\nline 2\nline 3';
        modifiedContent = 'user modified content\nline 2\nline 3\nnew line';
        mockParams = {
            filePath: path.join(tempDir, 'test.txt'),
            someOtherParam: 'value',
        };
        mockModifyContext = {
            getFilePath: vi.fn().mockReturnValue(mockParams.filePath),
            getCurrentContent: vi.fn().mockResolvedValue(currentContent),
            getProposedContent: vi.fn().mockResolvedValue(proposedContent),
            createUpdatedParams: vi
                .fn()
                .mockImplementation((oldContent, modifiedContent, originalParams) => ({
                ...originalParams,
                modifiedContent,
                oldContent,
            })),
        };
        os.tmpdir.mockReturnValue(tempDir);
        fs.existsSync.mockReturnValue(true);
        fs.mkdirSync.mockImplementation(() => undefined);
        fs.writeFileSync.mockImplementation(() => { });
        fs.unlinkSync.mockImplementation(() => { });
        fs.readFileSync.mockImplementation((filePath) => {
            if (filePath.includes('-new-')) {
                return modifiedContent;
            }
            return currentContent;
        });
        mockCreatePatch.mockReturnValue('mock diff content');
        mockOpenDiff.mockResolvedValue(undefined);
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    describe('successful modification', () => {
        it('should successfully modify content with VSCode editor', async () => {
            const result = await modifyWithEditor(mockParams, mockModifyContext, 'vscode', abortSignal);
            expect(mockModifyContext.getCurrentContent).toHaveBeenCalledWith(mockParams);
            expect(mockModifyContext.getProposedContent).toHaveBeenCalledWith(mockParams);
            expect(mockModifyContext.getFilePath).toHaveBeenCalledWith(mockParams);
            expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
            expect(fs.writeFileSync).toHaveBeenNthCalledWith(1, expect.stringContaining(path.join(tempDir, 'gemini-cli-tool-modify-diffs')), currentContent, 'utf8');
            expect(fs.writeFileSync).toHaveBeenNthCalledWith(2, expect.stringContaining(path.join(tempDir, 'gemini-cli-tool-modify-diffs')), proposedContent, 'utf8');
            expect(mockOpenDiff).toHaveBeenCalledWith(expect.stringContaining('-old-'), expect.stringContaining('-new-'), 'vscode');
            expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('-old-'), 'utf8');
            expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('-new-'), 'utf8');
            expect(mockModifyContext.createUpdatedParams).toHaveBeenCalledWith(currentContent, modifiedContent, mockParams);
            expect(mockCreatePatch).toHaveBeenCalledWith(path.basename(mockParams.filePath), currentContent, modifiedContent, 'Current', 'Proposed', expect.objectContaining({
                context: 3,
                ignoreWhitespace: true,
            }));
            expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
            expect(fs.unlinkSync).toHaveBeenNthCalledWith(1, expect.stringContaining('-old-'));
            expect(fs.unlinkSync).toHaveBeenNthCalledWith(2, expect.stringContaining('-new-'));
            expect(result).toEqual({
                updatedParams: {
                    ...mockParams,
                    modifiedContent,
                    oldContent: currentContent,
                },
                updatedDiff: 'mock diff content',
            });
        });
        it('should create temp directory if it does not exist', async () => {
            fs.existsSync.mockReturnValue(false);
            await modifyWithEditor(mockParams, mockModifyContext, 'vscode', abortSignal);
            expect(fs.mkdirSync).toHaveBeenCalledWith(path.join(tempDir, 'gemini-cli-tool-modify-diffs'), { recursive: true });
        });
        it('should not create temp directory if it already exists', async () => {
            fs.existsSync.mockReturnValue(true);
            await modifyWithEditor(mockParams, mockModifyContext, 'vscode', abortSignal);
            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });
    });
    it('should handle missing old temp file gracefully', async () => {
        fs.readFileSync.mockImplementation((filePath) => {
            if (filePath.includes('-old-')) {
                const error = new Error('ENOENT: no such file or directory');
                error.code = 'ENOENT';
                throw error;
            }
            return modifiedContent;
        });
        const result = await modifyWithEditor(mockParams, mockModifyContext, 'vscode', abortSignal);
        expect(mockCreatePatch).toHaveBeenCalledWith(path.basename(mockParams.filePath), '', modifiedContent, 'Current', 'Proposed', expect.objectContaining({
            context: 3,
            ignoreWhitespace: true,
        }));
        expect(result.updatedParams).toBeDefined();
        expect(result.updatedDiff).toBe('mock diff content');
    });
    it('should handle missing new temp file gracefully', async () => {
        fs.readFileSync.mockImplementation((filePath) => {
            if (filePath.includes('-new-')) {
                const error = new Error('ENOENT: no such file or directory');
                error.code = 'ENOENT';
                throw error;
            }
            return currentContent;
        });
        const result = await modifyWithEditor(mockParams, mockModifyContext, 'vscode', abortSignal);
        expect(mockCreatePatch).toHaveBeenCalledWith(path.basename(mockParams.filePath), currentContent, '', 'Current', 'Proposed', expect.objectContaining({
            context: 3,
            ignoreWhitespace: true,
        }));
        expect(result.updatedParams).toBeDefined();
        expect(result.updatedDiff).toBe('mock diff content');
    });
    it('should clean up temp files even if editor fails', async () => {
        const editorError = new Error('Editor failed to open');
        mockOpenDiff.mockRejectedValue(editorError);
        await expect(modifyWithEditor(mockParams, mockModifyContext, 'vscode', abortSignal)).rejects.toThrow('Editor failed to open');
        expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
    });
    it('should handle temp file cleanup errors gracefully', async () => {
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => { });
        fs.unlinkSync.mockImplementation((_filePath) => {
            throw new Error('Failed to delete file');
        });
        await modifyWithEditor(mockParams, mockModifyContext, 'vscode', abortSignal);
        expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error deleting temp diff file:'));
        consoleErrorSpy.mockRestore();
    });
    it('should create temp files with correct naming with extension', async () => {
        const testFilePath = path.join(tempDir, 'subfolder', 'test-file.txt');
        mockModifyContext.getFilePath = vi.fn().mockReturnValue(testFilePath);
        await modifyWithEditor(mockParams, mockModifyContext, 'vscode', abortSignal);
        const writeFileCalls = fs.writeFileSync.mock.calls;
        expect(writeFileCalls).toHaveLength(2);
        const oldFilePath = writeFileCalls[0][0];
        const newFilePath = writeFileCalls[1][0];
        expect(oldFilePath).toMatch(/gemini-cli-modify-test-file-old-\d+\.txt$/);
        expect(newFilePath).toMatch(/gemini-cli-modify-test-file-new-\d+\.txt$/);
        expect(oldFilePath).toContain(`${tempDir}/gemini-cli-tool-modify-diffs/`);
        expect(newFilePath).toContain(`${tempDir}/gemini-cli-tool-modify-diffs/`);
    });
    it('should create temp files with correct naming without extension', async () => {
        const testFilePath = path.join(tempDir, 'subfolder', 'test-file');
        mockModifyContext.getFilePath = vi.fn().mockReturnValue(testFilePath);
        await modifyWithEditor(mockParams, mockModifyContext, 'vscode', abortSignal);
        const writeFileCalls = fs.writeFileSync.mock.calls;
        expect(writeFileCalls).toHaveLength(2);
        const oldFilePath = writeFileCalls[0][0];
        const newFilePath = writeFileCalls[1][0];
        expect(oldFilePath).toMatch(/gemini-cli-modify-test-file-old-\d+$/);
        expect(newFilePath).toMatch(/gemini-cli-modify-test-file-new-\d+$/);
        expect(oldFilePath).toContain(`${tempDir}/gemini-cli-tool-modify-diffs/`);
        expect(newFilePath).toContain(`${tempDir}/gemini-cli-tool-modify-diffs/`);
    });
});
describe('isModifiableTool', () => {
    it('should return true for objects with getModifyContext method', () => {
        const mockTool = {
            name: 'test-tool',
            getModifyContext: vi.fn(),
        };
        expect(isModifiableTool(mockTool)).toBe(true);
    });
    it('should return false for objects without getModifyContext method', () => {
        const mockTool = {
            name: 'test-tool',
        };
        expect(isModifiableTool(mockTool)).toBe(false);
    });
});
//# sourceMappingURL=modifiable-tool.test.js.map