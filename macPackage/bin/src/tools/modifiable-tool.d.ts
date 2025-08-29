/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EditorType } from '../utils/editor.js';
import { Tool } from './tools.js';
/**
 * A tool that supports a modify operation.
 */
export interface ModifiableTool<ToolParams> extends Tool<ToolParams> {
    getModifyContext(abortSignal: AbortSignal): ModifyContext<ToolParams>;
}
export interface ModifyContext<ToolParams> {
    getFilePath: (params: ToolParams) => string;
    getCurrentContent: (params: ToolParams) => Promise<string>;
    getProposedContent: (params: ToolParams) => Promise<string>;
    createUpdatedParams: (oldContent: string, modifiedProposedContent: string, originalParams: ToolParams) => ToolParams;
}
export interface ModifyResult<ToolParams> {
    updatedParams: ToolParams;
    updatedDiff: string;
}
export declare function isModifiableTool<TParams>(tool: Tool<TParams>): tool is ModifiableTool<TParams>;
/**
 * Triggers an external editor for the user to modify the proposed content,
 * and returns the updated tool parameters and the diff after the user has modified the proposed content.
 */
export declare function modifyWithEditor<ToolParams>(originalParams: ToolParams, modifyContext: ModifyContext<ToolParams>, editorType: EditorType, _abortSignal: AbortSignal): Promise<ModifyResult<ToolParams>>;
