/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseTool, ToolResult } from './tools.js';
export declare const GEMINI_CONFIG_DIR = ".gemini";
export declare const DEFAULT_CONTEXT_FILENAME = "GEMINI.md";
export declare const MEMORY_SECTION_HEADER = "## Gemini Added Memories";
export declare function setGeminiMdFilename(newFilename: string | string[]): void;
export declare function getCurrentGeminiMdFilename(): string;
export declare function getAllGeminiMdFilenames(): string[];
interface SaveMemoryParams {
    fact: string;
}
export declare class MemoryTool extends BaseTool<SaveMemoryParams, ToolResult> {
    static readonly Name: string;
    constructor();
    static performAddMemoryEntry(text: string, memoryFilePath: string, fsAdapter: {
        readFile: (path: string, encoding: 'utf-8') => Promise<string>;
        writeFile: (path: string, data: string, encoding: 'utf-8') => Promise<void>;
        mkdir: (path: string, options: {
            recursive: boolean;
        }) => Promise<string | undefined>;
    }): Promise<void>;
    execute(params: SaveMemoryParams, _signal: AbortSignal): Promise<ToolResult>;
}
export {};
