/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const SERVICE_NAME = "gemini-cli";
export declare const EVENT_USER_PROMPT = "gemini_cli.user_prompt";
export declare const EVENT_TOOL_CALL = "gemini_cli.tool_call";
export declare const EVENT_API_REQUEST = "gemini_cli.api_request";
export declare const EVENT_API_ERROR = "gemini_cli.api_error";
export declare const EVENT_API_RESPONSE = "gemini_cli.api_response";
export declare const EVENT_CLI_CONFIG = "gemini_cli.config";
export declare const EVENT_FLASH_FALLBACK = "gemini_cli.flash_fallback";
export declare const METRIC_TOOL_CALL_COUNT = "gemini_cli.tool.call.count";
export declare const METRIC_TOOL_CALL_LATENCY = "gemini_cli.tool.call.latency";
export declare const METRIC_API_REQUEST_COUNT = "gemini_cli.api.request.count";
export declare const METRIC_API_REQUEST_LATENCY = "gemini_cli.api.request.latency";
export declare const METRIC_TOKEN_USAGE = "gemini_cli.token.usage";
export declare const METRIC_SESSION_COUNT = "gemini_cli.session.count";
export declare const METRIC_FILE_OPERATION_COUNT = "gemini_cli.file.operation.count";
