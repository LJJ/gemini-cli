/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * 错误代码枚举 - 基于当前实际使用的错误场景
 */
export declare enum ErrorCode {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    AUTH_NOT_SET = "AUTH_NOT_SET",
    AUTH_REQUIRED = "AUTH_REQUIRED",
    AUTH_CONFIG_FAILED = "AUTH_CONFIG_FAILED",
    OAUTH_INIT_FAILED = "OAUTH_INIT_FAILED",
    CLIENT_NOT_INITIALIZED = "CLIENT_NOT_INITIALIZED",
    CLIENT_INIT_FAILED = "CLIENT_INIT_FAILED",
    STREAM_ERROR = "STREAM_ERROR",
    TURN_NOT_INITIALIZED = "TURN_NOT_INITIALIZED",
    ABORT_CONTROLLER_NOT_INITIALIZED = "ABORT_CONTROLLER_NOT_INITIALIZED",
    GEMINI_ERROR = "GEMINI_ERROR",
    TOOL_SCHEDULER_NOT_INITIALIZED = "TOOL_SCHEDULER_NOT_INITIALIZED",
    TOOL_CALL_NOT_FOUND = "TOOL_CALL_NOT_FOUND",
    TOOL_INVALID_OUTCOME = "TOOL_INVALID_OUTCOME",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
/**
 * 错误代码描述映射
 */
export declare const ERROR_DESCRIPTIONS: Record<ErrorCode, string>;
/**
 * 错误代码到HTTP状态码的映射
 */
export declare const ERROR_TO_HTTP_STATUS: Record<ErrorCode, number>;
/**
 * 创建带错误代码的错误对象
 */
export declare function createError(code: ErrorCode, customMessage?: string): Error;
/**
 * 从错误代码创建标准化的错误响应
 */
export declare function createErrorResponse(errorCode: ErrorCode, customMessage?: string): {
    code: number;
    message: string;
    timestamp: string;
};
