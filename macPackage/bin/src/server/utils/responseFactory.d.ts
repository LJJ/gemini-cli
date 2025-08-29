/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseResponse, ErrorResponse } from '../types/api-types.js';
import { ErrorCode } from '../types/error-codes.js';
/**
 * 响应工厂类 - 确保所有API响应都遵循标准格式
 */
export declare class ResponseFactory {
    /**
     * 创建成功响应
     */
    static success<T extends Record<string, any>>(data: T, message?: string): {
        code: number;
        message: string;
        data: T;
        timestamp: string;
    };
    /**
     * 创建错误响应
     */
    static error(message: string, statusCode?: number): {
        code: number;
        message: string;
        timestamp: string;
    };
    /**
     * 根据错误代码创建错误响应
     */
    static errorWithCode(errorCode: ErrorCode, customMessage?: string): {
        code: number;
        message: string;
        timestamp: string;
    };
    /**
     * 创建认证配置响应
     */
    static authConfig(message: string): {
        code: number;
        message: string;
        data: {
            message: string;
        };
        timestamp: string;
    };
    /**
     * 创建认证状态响应
     */
    static authStatus(data: {
        isAuthenticated: boolean;
        authType: string | null;
        hasApiKey: boolean;
        hasGoogleCloudConfig: boolean;
    }): {
        code: number;
        message: string;
        data: {
            message: string;
            data: {
                isAuthenticated: boolean;
                authType: string | null;
                hasApiKey: boolean;
                hasGoogleCloudConfig: boolean;
            };
        };
        timestamp: string;
    };
    /**
     * 创建聊天响应
     */
    static chat(response: string, hasToolCalls?: boolean, toolCalls?: any[]): {
        code: number;
        message: string;
        data: {
            toolCalls?: any[] | undefined;
            response: string;
            hasToolCalls: boolean;
        };
        timestamp: string;
    };
    /**
     * 创建工具确认响应
     */
    static toolConfirmation(message: string): {
        code: number;
        message: string;
        data: {
            message: string;
        };
        timestamp: string;
    };
    /**
     * 创建目录列表响应
     */
    static listDirectory(path: string, items: any[]): {
        code: number;
        message: string;
        data: {
            path: string;
            items: any[];
        };
        timestamp: string;
    };
    /**
     * 创建文件读取响应
     */
    static readFile(path: string, content: string | null, success: boolean, message?: string): {
        code: number;
        message: string;
        data: {
            message?: string | undefined;
            path: string;
            content: string | null;
            success: boolean;
        };
        timestamp: string;
    };
    /**
     * 创建文件写入响应
     */
    static writeFile(path: string, content: string, success: boolean, message?: string): {
        code: number;
        message: string;
        data: {
            message?: string | undefined;
            path: string;
            content: string;
            success: boolean;
        };
        timestamp: string;
    };
    /**
     * 创建命令执行响应
     */
    static executeCommand(command: string, output: string, stderr: string | null, exitCode: number): {
        code: number;
        message: string;
        data: {
            command: string;
            output: string;
            stderr: string | null;
            exitCode: number;
        };
        timestamp: string;
    };
    /**
     * 创建健康检查响应
     */
    static status(version: string): {
        code: number;
        message: string;
        data: {
            status: "ok";
            version: string;
        };
        timestamp: string;
    };
    /**
     * 创建模型状态响应
     */
    static modelStatus(data: {
        currentModel: string;
        supportedModels: string[];
        modelStatuses: Array<{
            name: string;
            available: boolean;
            status: 'available' | 'unavailable' | 'unknown';
            message: string;
        }>;
    }): {
        code: number;
        message: string;
        data: {
            currentModel: string;
            supportedModels: string[];
            modelStatuses: Array<{
                name: string;
                available: boolean;
                status: "available" | "unavailable" | "unknown";
                message: string;
            }>;
        };
        timestamp: string;
    };
    /**
     * 创建模型切换响应
     */
    static modelSwitch(model: {
        name: string;
        previousModel: string;
        switched: boolean;
        available?: boolean;
        status?: 'available' | 'unavailable' | 'unknown';
        availabilityMessage?: string;
    }, message: string): {
        code: number;
        message: string;
        data: {
            model: {
                name: string;
                previousModel: string;
                switched: boolean;
                available?: boolean;
                status?: "available" | "unavailable" | "unknown";
                availabilityMessage?: string;
            };
        };
        timestamp: string;
    };
    /**
     * 创建参数验证错误响应
     */
    static validationError(field: string, message: string): {
        code: number;
        message: string;
        timestamp: string;
    };
    /**
     * 创建认证错误响应
     */
    static authError(message: string): {
        code: number;
        message: string;
        timestamp: string;
    };
    /**
     * 创建资源未找到错误响应
     */
    static notFoundError(resource: string): {
        code: number;
        message: string;
        timestamp: string;
    };
    /**
     * 创建服务器内部错误响应
     */
    static internalError(message: string): {
        code: number;
        message: string;
        timestamp: string;
    };
}
/**
 * 响应验证器 - 验证响应是否符合标准格式
 */
export declare class ResponseValidator {
    /**
     * 验证响应是否包含必需的基础字段
     */
    static validateBaseResponse(response: any): response is BaseResponse;
    /**
     * 验证错误响应格式
     */
    static validateErrorResponse(response: any): response is ErrorResponse;
    /**
     * 验证成功响应格式
     */
    static validateSuccessResponse(response: any): response is BaseResponse;
    /**
     * 强制标准化响应格式
     */
    static normalizeResponse(response: any): BaseResponse;
}
/**
 * 中间件 - 自动标准化所有响应
 */
export declare function responseStandardizationMiddleware(req: any, res: any, next: any): void;
/**
 * 装饰器 - 用于类方法自动标准化响应
 */
export declare function standardizeResponse(target: any, propertyName: string, descriptor: PropertyDescriptor): PropertyDescriptor;
