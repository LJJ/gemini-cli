/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseTool, ToolResult } from './tools.js';
import { Config } from '../config/config.js';
/**
 * Parameters for the ReadFile tool
 */
export interface ReadFileToolParams {
    /**
     * The absolute path to the file to read
     */
    absolute_path: string;
    /**
     * The line number to start reading from (optional)
     */
    offset?: number;
    /**
     * The number of lines to read (optional)
     */
    limit?: number;
}
/**
 * Implementation of the ReadFile tool logic
 */
export declare class ReadFileTool extends BaseTool<ReadFileToolParams, ToolResult> {
    private rootDirectory;
    private config;
    static readonly Name: string;
    constructor(rootDirectory: string, config: Config);
    validateToolParams(params: ReadFileToolParams): string | null;
    getDescription(params: ReadFileToolParams): string;
    execute(params: ReadFileToolParams, _signal: AbortSignal): Promise<ToolResult>;
}
