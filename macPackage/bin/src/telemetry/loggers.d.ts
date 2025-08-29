/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Config } from '../config/config.js';
import { ApiErrorEvent, ApiRequestEvent, ApiResponseEvent, StartSessionEvent, ToolCallEvent, UserPromptEvent, FlashFallbackEvent } from './types.js';
export declare function logCliConfiguration(config: Config, event: StartSessionEvent): void;
export declare function logUserPrompt(config: Config, event: UserPromptEvent): void;
export declare function logToolCall(config: Config, event: ToolCallEvent): void;
export declare function logApiRequest(config: Config, event: ApiRequestEvent): void;
export declare function logFlashFallback(config: Config, event: FlashFallbackEvent): void;
export declare function logApiError(config: Config, event: ApiErrorEvent): void;
export declare function logApiResponse(config: Config, event: ApiResponseEvent): void;
