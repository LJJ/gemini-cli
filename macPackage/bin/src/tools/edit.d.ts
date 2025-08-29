/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseTool, ToolCallConfirmationDetails, ToolResult } from './tools.js';
import { Config } from '../config/config.js';
import { ModifiableTool, ModifyContext } from './modifiable-tool.js';
/**
 * Parameters for the Edit tool
 */
export interface EditToolParams {
    /**
     * The absolute path to the file to modify
     */
    file_path: string;
    /**
     * The text to replace
     */
    old_string: string;
    /**
     * The text to replace it with
     */
    new_string: string;
    /**
     * Number of replacements expected. Defaults to 1 if not specified.
     * Use when you want to replace multiple occurrences.
     */
    expected_replacements?: number;
    /**
     * Whether the edit was modified manually by the user.
     */
    modified_by_user?: boolean;
}
/**
 * Implementation of the Edit tool logic
 */
export declare class EditTool extends BaseTool<EditToolParams, ToolResult> implements ModifiableTool<EditToolParams> {
    private readonly config;
    static readonly Name = "replace";
    private readonly rootDirectory;
    /**
     * Creates a new instance of the EditLogic
     * @param rootDirectory Root directory to ground this tool in.
     */
    constructor(config: Config);
    /**
     * Checks if a path is within the root directory.
     * @param pathToCheck The absolute path to check.
     * @returns True if the path is within the root directory, false otherwise.
     */
    private isWithinRoot;
    /**
     * Validates the parameters for the Edit tool
     * @param params Parameters to validate
     * @returns Error message string or null if valid
     */
    validateToolParams(params: EditToolParams): string | null;
    private _applyReplacement;
    /**
     * Calculates the potential outcome of an edit operation.
     * @param params Parameters for the edit operation
     * @returns An object describing the potential edit outcome
     * @throws File system errors if reading the file fails unexpectedly (e.g., permissions)
     */
    private calculateEdit;
    /**
     * Handles the confirmation prompt for the Edit tool in the CLI.
     * It needs to calculate the diff to show the user.
     */
    shouldConfirmExecute(params: EditToolParams, abortSignal: AbortSignal): Promise<ToolCallConfirmationDetails | false>;
    getDescription(params: EditToolParams): string;
    /**
     * Executes the edit operation with the given parameters.
     * @param params Parameters for the edit operation
     * @returns Result of the edit operation
     */
    execute(params: EditToolParams, signal: AbortSignal): Promise<ToolResult>;
    /**
     * Creates parent directories if they don't exist
     */
    private ensureParentDirectoriesExist;
    getModifyContext(_: AbortSignal): ModifyContext<EditToolParams>;
}
