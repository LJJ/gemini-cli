/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { GenerateContentResponseUsageMetadata } from '@google/genai';
import { Config } from '../config/config.js';
import { CompletedToolCall } from '../core/coreToolScheduler.js';
import { ToolConfirmationOutcome } from '../tools/tools.js';
export declare enum ToolCallDecision {
    ACCEPT = "accept",
    REJECT = "reject",
    MODIFY = "modify"
}
export declare function getDecisionFromOutcome(outcome: ToolConfirmationOutcome): ToolCallDecision;
export declare class StartSessionEvent {
    'event.name': 'cli_config';
    'event.timestamp': string;
    model: string;
    embedding_model: string;
    sandbox_enabled: boolean;
    core_tools_enabled: string;
    approval_mode: string;
    api_key_enabled: boolean;
    vertex_ai_enabled: boolean;
    debug_enabled: boolean;
    mcp_servers: string;
    telemetry_enabled: boolean;
    telemetry_log_user_prompts_enabled: boolean;
    file_filtering_respect_git_ignore: boolean;
    constructor(config: Config);
}
export declare class EndSessionEvent {
    'event.name': 'end_session';
    'event.timestamp': string;
    session_id?: string;
    constructor(config?: Config);
}
export declare class UserPromptEvent {
    'event.name': 'user_prompt';
    'event.timestamp': string;
    prompt_length: number;
    prompt_id: string;
    auth_type?: string;
    prompt?: string;
    constructor(prompt_length: number, prompt_Id: string, auth_type?: string, prompt?: string);
}
export declare class ToolCallEvent {
    'event.name': 'tool_call';
    'event.timestamp': string;
    function_name: string;
    function_args: Record<string, unknown>;
    duration_ms: number;
    success: boolean;
    decision?: ToolCallDecision;
    error?: string;
    error_type?: string;
    prompt_id: string;
    constructor(call: CompletedToolCall);
}
export declare class ApiRequestEvent {
    'event.name': 'api_request';
    'event.timestamp': string;
    model: string;
    prompt_id: string;
    request_text?: string;
    constructor(model: string, prompt_id: string, request_text?: string);
}
export declare class ApiErrorEvent {
    'event.name': 'api_error';
    'event.timestamp': string;
    model: string;
    error: string;
    error_type?: string;
    status_code?: number | string;
    duration_ms: number;
    prompt_id: string;
    auth_type?: string;
    constructor(model: string, error: string, duration_ms: number, prompt_id: string, auth_type?: string, error_type?: string, status_code?: number | string);
}
export declare class ApiResponseEvent {
    'event.name': 'api_response';
    'event.timestamp': string;
    model: string;
    status_code?: number | string;
    duration_ms: number;
    error?: string;
    input_token_count: number;
    output_token_count: number;
    cached_content_token_count: number;
    thoughts_token_count: number;
    tool_token_count: number;
    total_token_count: number;
    response_text?: string;
    prompt_id: string;
    auth_type?: string;
    constructor(model: string, duration_ms: number, prompt_id: string, auth_type?: string, usage_data?: GenerateContentResponseUsageMetadata, response_text?: string, error?: string);
}
export declare class FlashFallbackEvent {
    'event.name': 'flash_fallback';
    'event.timestamp': string;
    auth_type: string;
    constructor(auth_type: string);
}
export type TelemetryEvent = StartSessionEvent | EndSessionEvent | UserPromptEvent | ToolCallEvent | ApiRequestEvent | ApiErrorEvent | ApiResponseEvent | FlashFallbackEvent;
