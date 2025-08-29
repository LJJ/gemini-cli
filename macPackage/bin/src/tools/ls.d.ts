/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseTool, ToolResult } from './tools.js';
import { Config } from '../config/config.js';
/**
 * Parameters for the LS tool
 */
export interface LSToolParams {
    /**
     * The absolute path to the directory to list
     */
    path: string;
    /**
     * Array of glob patterns to ignore (optional)
     */
    ignore?: string[];
    /**
     * Whether to respect .gitignore patterns (optional, defaults to true)
     */
    respect_git_ignore?: boolean;
}
/**
 * File entry returned by LS tool
 */
export interface FileEntry {
    /**
     * Name of the file or directory
     */
    name: string;
    /**
     * Absolute path to the file or directory
     */
    path: string;
    /**
     * Whether this entry is a directory
     */
    isDirectory: boolean;
    /**
     * Size of the file in bytes (0 for directories)
     */
    size: number;
    /**
     * Last modified timestamp
     */
    modifiedTime: Date;
}
/**
 * Implementation of the LS tool logic
 */
export declare class LSTool extends BaseTool<LSToolParams, ToolResult> {
    private rootDirectory;
    private config;
    static readonly Name = "list_directory";
    /**
     * Creates a new instance of the LSLogic
     * @param rootDirectory Root directory to ground this tool in. All operations will be restricted to this directory.
     */
    constructor(rootDirectory: string, config: Config);
    /**
     * Checks if a path is within the root directory
     * @param dirpath The path to check
     * @returns True if the path is within the root directory, false otherwise
     */
    private isWithinRoot;
    /**
     * Validates the parameters for the tool
     * @param params Parameters to validate
     * @returns An error message string if invalid, null otherwise
     */
    validateToolParams(params: LSToolParams): string | null;
    /**
     * Checks if a filename matches any of the ignore patterns
     * @param filename Filename to check
     * @param patterns Array of glob patterns to check against
     * @returns True if the filename should be ignored
     */
    private shouldIgnore;
    /**
     * Gets a description of the file reading operation
     * @param params Parameters for the file reading
     * @returns A string describing the file being read
     */
    getDescription(params: LSToolParams): string;
    private errorResult;
    /**
     * Executes the LS operation with the given parameters
     * @param params Parameters for the LS operation
     * @returns Result of the LS operation
     */
    execute(params: LSToolParams, _signal: AbortSignal): Promise<ToolResult>;
}
