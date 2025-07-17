/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 错误代码枚举 - 基于当前实际使用的错误场景
 */
export enum ErrorCode {
  // 验证错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // 认证相关错误
  AUTH_NOT_SET = 'AUTH_NOT_SET',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_CONFIG_FAILED = 'AUTH_CONFIG_FAILED',
  OAUTH_INIT_FAILED = 'OAUTH_INIT_FAILED',
  
  // 网络连接错误
  NETWORK_CONNECTIVITY_FAILED = 'NETWORK_CONNECTIVITY_FAILED',
  
  // 客户端初始化错误
  CLIENT_NOT_INITIALIZED = 'CLIENT_NOT_INITIALIZED',
  
  // 流式处理错误
  STREAM_ERROR = 'STREAM_ERROR',
  TURN_NOT_INITIALIZED = 'TURN_NOT_INITIALIZED',
  ABORT_CONTROLLER_NOT_INITIALIZED = 'ABORT_CONTROLLER_NOT_INITIALIZED',
  
  // Gemini API 错误
  GEMINI_ERROR = 'GEMINI_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // 工具相关错误
  TOOL_SCHEDULER_NOT_INITIALIZED = 'TOOL_SCHEDULER_NOT_INITIALIZED',
  TOOL_CALL_NOT_FOUND = 'TOOL_CALL_NOT_FOUND',
  TOOL_INVALID_OUTCOME = 'TOOL_INVALID_OUTCOME',
  
  // 通用错误
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * 错误代码描述映射
 */
export const ERROR_DESCRIPTIONS: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_ERROR]: 'Validation error',
  [ErrorCode.AUTH_NOT_SET]: 'Authentication not set',
  [ErrorCode.AUTH_REQUIRED]: 'Authentication required',
  [ErrorCode.AUTH_CONFIG_FAILED]: 'Authentication configuration failed',
  [ErrorCode.QUOTA_EXCEEDED]: 'API quota exceeded',
  [ErrorCode.OAUTH_INIT_FAILED]: 'OAuth initialization failed',
  [ErrorCode.NETWORK_CONNECTIVITY_FAILED]: 'Network connectivity to Google services failed',
  [ErrorCode.CLIENT_NOT_INITIALIZED]: 'Gemini client not initialized',
  [ErrorCode.STREAM_ERROR]: 'Stream processing error',
  [ErrorCode.TURN_NOT_INITIALIZED]: 'Turn or AbortController not initialized',
  [ErrorCode.ABORT_CONTROLLER_NOT_INITIALIZED]: 'AbortController not initialized',
  [ErrorCode.GEMINI_ERROR]: 'Gemini API error',
  [ErrorCode.TOOL_SCHEDULER_NOT_INITIALIZED]: 'Tool scheduler not initialized',
  [ErrorCode.TOOL_CALL_NOT_FOUND]: 'Tool call not found or not in waiting confirmation status',
  [ErrorCode.TOOL_INVALID_OUTCOME]: 'Invalid tool call outcome',
  [ErrorCode.INTERNAL_ERROR]: 'Internal server error',
  [ErrorCode.NETWORK_ERROR]: 'Network connection error',
  [ErrorCode.UNKNOWN_ERROR]: 'Unknown error'
};

/**
 * 错误代码到HTTP状态码的映射
 */
export const ERROR_TO_HTTP_STATUS: Record<ErrorCode, number> = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.AUTH_NOT_SET]: 401,
  [ErrorCode.AUTH_REQUIRED]: 401,
  [ErrorCode.AUTH_CONFIG_FAILED]: 500,
  [ErrorCode.OAUTH_INIT_FAILED]: 500,
  [ErrorCode.NETWORK_CONNECTIVITY_FAILED]: 503,
  [ErrorCode.CLIENT_NOT_INITIALIZED]: 400,
  [ErrorCode.STREAM_ERROR]: 500,
  [ErrorCode.TURN_NOT_INITIALIZED]: 500,
  [ErrorCode.ABORT_CONTROLLER_NOT_INITIALIZED]: 500,
  [ErrorCode.GEMINI_ERROR]: 500,
  [ErrorCode.QUOTA_EXCEEDED]: 429,
  [ErrorCode.TOOL_SCHEDULER_NOT_INITIALIZED]: 500,
  [ErrorCode.TOOL_CALL_NOT_FOUND]: 404,
  [ErrorCode.TOOL_INVALID_OUTCOME]: 400,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.NETWORK_ERROR]: 503,
  [ErrorCode.UNKNOWN_ERROR]: 500
};

/**
 * 创建带错误代码的错误对象
 * 优先使用传入的自定义消息，如果没有则使用错误代码作为默认消息
 */
export function createError(code: ErrorCode, customMessage?: string): Error {
  const error = new Error(customMessage || `message: ${ERROR_DESCRIPTIONS[code]}`);
  (error as any).code = code;
  return error;
}

/**
 * 从错误代码创建标准化的错误响应
 * 优先使用传入的自定义消息，如果没有则使用错误代码作为默认消息
 */
export function createErrorResponse(errorCode: ErrorCode, customMessage?: string) {
  return {
    code: ERROR_TO_HTTP_STATUS[errorCode],
    message: customMessage || `Error: ${errorCode}`,
    timestamp: new Date().toISOString()
  };
} 