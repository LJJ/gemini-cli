/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseTool, ToolResult, ToolCallConfirmationDetails } from './tools.js';
import { CallableTool, Schema } from '@google/genai';
type ToolParams = Record<string, unknown>;
export declare class DiscoveredMCPTool extends BaseTool<ToolParams, ToolResult> {
    private readonly mcpTool;
    readonly serverName: string;
    readonly name: string;
    readonly description: string;
    readonly parameterSchema: Schema;
    readonly serverToolName: string;
    readonly timeout?: number | undefined;
    readonly trust?: boolean | undefined;
    private static readonly allowlist;
    constructor(mcpTool: CallableTool, serverName: string, name: string, description: string, parameterSchema: Schema, serverToolName: string, timeout?: number | undefined, trust?: boolean | undefined);
    shouldConfirmExecute(_params: ToolParams, _abortSignal: AbortSignal): Promise<ToolCallConfirmationDetails | false>;
    execute(params: ToolParams): Promise<ToolResult>;
}
export {};
