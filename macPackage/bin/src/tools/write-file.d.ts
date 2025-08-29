/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Config } from '../config/config.js';
import { BaseTool, ToolResult, ToolCallConfirmationDetails } from './tools.js';
import { ModifiableTool, ModifyContext } from './modifiable-tool.js';
/**
 * Parameters for the WriteFile tool
 */
export interface WriteFileToolParams {
    /**
     * The absolute path to the file to write to
     */
    file_path: string;
    /**
     * The content to write to the file
     */
    content: string;
    /**
     * Whether the proposed content was modified by the user.
     */
    modified_by_user?: boolean;
}
/**
 * Implementation of the WriteFile tool logic
 */
export declare class WriteFileTool extends BaseTool<WriteFileToolParams, ToolResult> implements ModifiableTool<WriteFileToolParams> {
    private readonly config;
    static readonly Name: string;
    constructor(config: Config);
    /**
     * Checks if a given path is within the root directory bounds.
     * This security check prevents writing files outside the designated root directory.
     *
     * @param pathToCheck The absolute path to validate
     * @returns True if the path is within the root directory, false otherwise
     */
    private isWithinRoot;
    validateToolParams(params: WriteFileToolParams): string | null;
    getDescription(params: WriteFileToolParams): string;
    /**
     * Handles the confirmation prompt for the WriteFile tool.
     */
    shouldConfirmExecute(params: WriteFileToolParams, abortSignal: AbortSignal): Promise<ToolCallConfirmationDetails | false>;
    execute(params: WriteFileToolParams, abortSignal: AbortSignal): Promise<ToolResult>;
    private _getCorrectedFileContent;
    getModifyContext(abortSignal: AbortSignal): ModifyContext<WriteFileToolParams>;
}
