/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseTool, ToolResult } from './tools.js';
/**
 * Parameters for the GrepTool
 */
export interface GrepToolParams {
    /**
     * The regular expression pattern to search for in file contents
     */
    pattern: string;
    /**
     * The directory to search in (optional, defaults to current directory relative to root)
     */
    path?: string;
    /**
     * File pattern to include in the search (e.g. "*.js", "*.{ts,tsx}")
     */
    include?: string;
}
/**
 * Implementation of the Grep tool logic (moved from CLI)
 */
export declare class GrepTool extends BaseTool<GrepToolParams, ToolResult> {
    private rootDirectory;
    static readonly Name = "search_file_content";
    /**
     * Creates a new instance of the GrepLogic
     * @param rootDirectory Root directory to ground this tool in. All operations will be restricted to this directory.
     */
    constructor(rootDirectory: string);
    /**
     * Checks if a path is within the root directory and resolves it.
     * @param relativePath Path relative to the root directory (or undefined for root).
     * @returns The absolute path if valid and exists.
     * @throws {Error} If path is outside root, doesn't exist, or isn't a directory.
     */
    private resolveAndValidatePath;
    /**
     * Validates the parameters for the tool
     * @param params Parameters to validate
     * @returns An error message string if invalid, null otherwise
     */
    validateToolParams(params: GrepToolParams): string | null;
    /**
     * Executes the grep search with the given parameters
     * @param params Parameters for the grep search
     * @returns Result of the grep search
     */
    execute(params: GrepToolParams, signal: AbortSignal): Promise<ToolResult>;
    /**
     * Checks if a command is available in the system's PATH.
     * @param {string} command The command name (e.g., 'git', 'grep').
     * @returns {Promise<boolean>} True if the command is available, false otherwise.
     */
    private isCommandAvailable;
    /**
     * Parses the standard output of grep-like commands (git grep, system grep).
     * Expects format: filePath:lineNumber:lineContent
     * Handles colons within file paths and line content correctly.
     * @param {string} output The raw stdout string.
     * @param {string} basePath The absolute directory the search was run from, for relative paths.
     * @returns {GrepMatch[]} Array of match objects.
     */
    private parseGrepOutput;
    /**
     * Gets a description of the grep operation
     * @param params Parameters for the grep operation
     * @returns A string describing the grep
     */
    getDescription(params: GrepToolParams): string;
    /**
     * Performs the actual search using the prioritized strategies.
     * @param options Search options including pattern, absolute path, and include glob.
     * @returns A promise resolving to an array of match objects.
     */
    private performGrepSearch;
}
