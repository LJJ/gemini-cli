/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseTool, ToolResult } from './tools.js';
import { Config } from '../config/config.js';
export interface GlobPath {
    fullpath(): string;
    mtimeMs?: number;
}
/**
 * Sorts file entries based on recency and then alphabetically.
 * Recent files (modified within recencyThresholdMs) are listed first, newest to oldest.
 * Older files are listed after recent ones, sorted alphabetically by path.
 */
export declare function sortFileEntries(entries: GlobPath[], nowTimestamp: number, recencyThresholdMs: number): GlobPath[];
/**
 * Parameters for the GlobTool
 */
export interface GlobToolParams {
    /**
     * The glob pattern to match files against
     */
    pattern: string;
    /**
     * The directory to search in (optional, defaults to current directory)
     */
    path?: string;
    /**
     * Whether the search should be case-sensitive (optional, defaults to false)
     */
    case_sensitive?: boolean;
    /**
     * Whether to respect .gitignore patterns (optional, defaults to true)
     */
    respect_git_ignore?: boolean;
}
/**
 * Implementation of the Glob tool logic
 */
export declare class GlobTool extends BaseTool<GlobToolParams, ToolResult> {
    private rootDirectory;
    private config;
    static readonly Name = "glob";
    /**
     * Creates a new instance of the GlobLogic
     * @param rootDirectory Root directory to ground this tool in.
     */
    constructor(rootDirectory: string, config: Config);
    /**
     * Checks if a given path is within the root directory bounds.
     * This security check prevents accessing files outside the designated root directory.
     *
     * @param pathToCheck The absolute path to validate
     * @returns True if the path is within the root directory, false otherwise
     */
    private isWithinRoot;
    /**
     * Validates the parameters for the tool.
     */
    validateToolParams(params: GlobToolParams): string | null;
    /**
     * Gets a description of the glob operation.
     */
    getDescription(params: GlobToolParams): string;
    /**
     * Executes the glob search with the given parameters
     */
    execute(params: GlobToolParams, signal: AbortSignal): Promise<ToolResult>;
}
