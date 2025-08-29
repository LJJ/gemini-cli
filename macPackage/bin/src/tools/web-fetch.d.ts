/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseTool, ToolResult, ToolCallConfirmationDetails } from './tools.js';
import { Config } from '../config/config.js';
/**
 * Parameters for the WebFetch tool
 */
export interface WebFetchToolParams {
    /**
     * The prompt containing URL(s) (up to 20) and instructions for processing their content.
     */
    prompt: string;
}
/**
 * Implementation of the WebFetch tool logic
 */
export declare class WebFetchTool extends BaseTool<WebFetchToolParams, ToolResult> {
    private readonly config;
    static readonly Name: string;
    constructor(config: Config);
    private executeFallback;
    validateParams(params: WebFetchToolParams): string | null;
    getDescription(params: WebFetchToolParams): string;
    shouldConfirmExecute(params: WebFetchToolParams): Promise<ToolCallConfirmationDetails | false>;
    execute(params: WebFetchToolParams, signal: AbortSignal): Promise<ToolResult>;
}
