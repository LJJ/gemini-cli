/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseTool, ToolResult } from './tools.js';
import { Config } from '../config/config.js';
/**
 * Parameters for the ReadManyFilesTool.
 */
export interface ReadManyFilesParams {
    /**
     * An array of file paths or directory paths to search within.
     * Paths are relative to the tool's configured target directory.
     * Glob patterns can be used directly in these paths.
     */
    paths: string[];
    /**
     * Optional. Glob patterns for files to include.
     * These are effectively combined with the `paths`.
     * Example: ["*.ts", "src/** /*.md"]
     */
    include?: string[];
    /**
     * Optional. Glob patterns for files/directories to exclude.
     * Applied as ignore patterns.
     * Example: ["*.log", "dist/**"]
     */
    exclude?: string[];
    /**
     * Optional. Search directories recursively.
     * This is generally controlled by glob patterns (e.g., `**`).
     * The glob implementation is recursive by default for `**`.
     * For simplicity, we'll rely on `**` for recursion.
     */
    recursive?: boolean;
    /**
     * Optional. Apply default exclusion patterns. Defaults to true.
     */
    useDefaultExcludes?: boolean;
    /**
     * Optional. Whether to respect .gitignore patterns. Defaults to true.
     */
    respect_git_ignore?: boolean;
}
/**
 * Tool implementation for finding and reading multiple text files from the local filesystem
 * within a specified target directory. The content is concatenated.
 * It is intended to run in an environment with access to the local file system (e.g., a Node.js backend).
 */
export declare class ReadManyFilesTool extends BaseTool<ReadManyFilesParams, ToolResult> {
    readonly targetDir: string;
    private config;
    static readonly Name: string;
    private readonly geminiIgnorePatterns;
    /**
     * Creates an instance of ReadManyFilesTool.
     * @param targetDir The absolute root directory within which this tool is allowed to operate.
     * All paths provided in `params` will be resolved relative to this directory.
     */
    constructor(targetDir: string, config: Config);
    validateParams(params: ReadManyFilesParams): string | null;
    getDescription(params: ReadManyFilesParams): string;
    execute(params: ReadManyFilesParams, signal: AbortSignal): Promise<ToolResult>;
}
