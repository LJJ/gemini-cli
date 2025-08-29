/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { GroundingMetadata } from '@google/genai';
import { BaseTool, ToolResult } from './tools.js';
import { Config } from '../config/config.js';
interface GroundingChunkWeb {
    uri?: string;
    title?: string;
}
interface GroundingChunkItem {
    web?: GroundingChunkWeb;
}
/**
 * Parameters for the WebSearchTool.
 */
export interface WebSearchToolParams {
    /**
     * The search query.
     */
    query: string;
}
/**
 * Extends ToolResult to include sources for web search.
 */
export interface WebSearchToolResult extends ToolResult {
    sources?: GroundingMetadata extends {
        groundingChunks: GroundingChunkItem[];
    } ? GroundingMetadata['groundingChunks'] : GroundingChunkItem[];
}
/**
 * A tool to perform web searches using Google Search via the Gemini API.
 */
export declare class WebSearchTool extends BaseTool<WebSearchToolParams, WebSearchToolResult> {
    private readonly config;
    static readonly Name: string;
    constructor(config: Config);
    /**
     * Validates the parameters for the WebSearchTool.
     * @param params The parameters to validate
     * @returns An error message string if validation fails, null if valid
     */
    validateParams(params: WebSearchToolParams): string | null;
    getDescription(params: WebSearchToolParams): string;
    execute(params: WebSearchToolParams, signal: AbortSignal): Promise<WebSearchToolResult>;
}
export {};
