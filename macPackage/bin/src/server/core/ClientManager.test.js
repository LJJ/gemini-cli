/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClientManager } from './ClientManager.js';
import * as path from 'path';
// Mock dependencies
vi.mock('../../index.js', () => ({
    Config: vi.fn().mockImplementation(() => ({
        getWorkingDir: vi.fn(() => '/test/workspace'),
        getTargetDir: vi.fn(() => '/test/workspace'),
    })),
    GeminiClient: vi.fn().mockImplementation(() => ({
        initialize: vi.fn(),
        getChat: vi.fn(() => ({
            clearHistory: vi.fn(),
        })),
    })),
}));
vi.mock('../../config/config.js', () => ({
    createToolRegistry: vi.fn().mockResolvedValue({}),
}));
describe('ClientManager', () => {
    let clientManager;
    let mockAuthService;
    beforeEach(() => {
        mockAuthService = {
            isUserAuthenticated: vi.fn(() => true),
            getContentGeneratorConfig: vi.fn().mockResolvedValue({ model: 'test' }),
        };
        clientManager = new ClientManager(mockAuthService);
    });
    describe('智能工作目录管理', () => {
        it('应该在首次初始化时设置工作目录', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
            await clientManager.initializeClient('/test/workspace');
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('首次初始化客户端'));
            expect(clientManager.getCurrentWorkspace()).toBe('/test/workspace');
            consoleSpy.mockRestore();
        });
        it('应该在相同工作目录时复用现有客户端', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
            // 首次初始化
            await clientManager.initializeClient('/test/workspace');
            // 相同路径再次初始化
            await clientManager.initializeClient('/test/workspace');
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('使用现有客户端'));
            consoleSpy.mockRestore();
        });
        it('应该检测子路径并复用现有客户端', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
            // 初始化到父目录
            await clientManager.initializeClient('/test/workspace');
            // 切换到子目录
            await clientManager.initializeClient('/test/workspace/subfolder');
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('使用现有客户端'));
            consoleSpy.mockRestore();
        });
        it('应该在工作目录真正变化时重新初始化', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
            // 初始化到第一个目录
            await clientManager.initializeClient('/test/workspace1');
            // 切换到不同的目录
            await clientManager.initializeClient('/test/workspace2');
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('工作目录变化'));
            expect(clientManager.getCurrentWorkspace()).toBe('/test/workspace2');
            consoleSpy.mockRestore();
        });
    });
    describe('子路径检测', () => {
        it('应该正确识别子路径', () => {
            const clientManagerAny = clientManager;
            expect(clientManagerAny.isSubPath('/test/workspace/sub', '/test/workspace')).toBe(true);
            expect(clientManagerAny.isSubPath('/test/workspace/sub/deep', '/test/workspace')).toBe(true);
            expect(clientManagerAny.isSubPath('/test/workspace', '/test/workspace')).toBe(true);
            expect(clientManagerAny.isSubPath('/test/other', '/test/workspace')).toBe(false);
            expect(clientManagerAny.isSubPath('/other/workspace', '/test/workspace')).toBe(false);
        });
        it('应该处理相对路径', () => {
            const clientManagerAny = clientManager;
            const resolved1 = path.resolve('/test/workspace/sub');
            const resolved2 = path.resolve('/test/workspace');
            expect(clientManagerAny.isSubPath(resolved1, resolved2)).toBe(true);
        });
    });
    describe('工作目录状态', () => {
        it('应该正确报告初始化状态', () => {
            expect(clientManager.isInitialized()).toBe(false);
            expect(clientManager.getCurrentWorkspace()).toBe(null);
        });
        it('应该在初始化后正确报告状态', async () => {
            await clientManager.initializeClient('/test/workspace');
            expect(clientManager.isInitialized()).toBe(true);
            expect(clientManager.getCurrentWorkspace()).toBe('/test/workspace');
            expect(clientManager.getClient()).toBeTruthy();
            expect(clientManager.getConfig()).toBeTruthy();
        });
    });
});
//# sourceMappingURL=ClientManager.test.js.map