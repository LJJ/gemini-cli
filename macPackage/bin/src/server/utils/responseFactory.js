/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ErrorCode, ERROR_TO_HTTP_STATUS, ERROR_DESCRIPTIONS } from '../types/error-codes.js';
/**
 * 响应工厂类 - 确保所有API响应都遵循标准格式
 */
export class ResponseFactory {
    /**
     * 创建成功响应
     */
    static success(data, message = '操作成功') {
        return {
            code: 200,
            message,
            data,
            timestamp: new Date().toISOString()
        };
    }
    /**
     * 创建错误响应
     */
    static error(message, statusCode = 500) {
        return {
            code: statusCode,
            message,
            timestamp: new Date().toISOString()
        };
    }
    /**
     * 根据错误代码创建错误响应
     */
    static errorWithCode(errorCode, customMessage) {
        return {
            code: ERROR_TO_HTTP_STATUS[errorCode],
            message: customMessage || ERROR_DESCRIPTIONS[errorCode],
            timestamp: new Date().toISOString()
        };
    }
    /**
     * 创建认证配置响应
     */
    static authConfig(message) {
        return this.success({ message });
    }
    /**
     * 创建认证状态响应
     */
    static authStatus(data) {
        return this.success({
            message: '认证状态查询成功',
            data
        });
    }
    /**
     * 创建聊天响应
     */
    static chat(response, hasToolCalls = false, toolCalls) {
        return this.success({
            response,
            hasToolCalls,
            ...(toolCalls && { toolCalls })
        });
    }
    /**
     * 创建工具确认响应
     */
    static toolConfirmation(message) {
        return this.success({ message });
    }
    /**
     * 创建目录列表响应
     */
    static listDirectory(path, items) {
        return this.success({ path, items });
    }
    /**
     * 创建文件读取响应
     */
    static readFile(path, content, success, message) {
        return this.success({ path, content, success, ...(message && { message }) });
    }
    /**
     * 创建文件写入响应
     */
    static writeFile(path, content, success, message) {
        return this.success({ path, content, success, ...(message && { message }) });
    }
    /**
     * 创建命令执行响应
     */
    static executeCommand(command, output, stderr, exitCode) {
        return this.success({ command, output, stderr, exitCode });
    }
    /**
     * 创建健康检查响应
     */
    static status(version) {
        return this.success({
            status: 'ok',
            version
        });
    }
    /**
     * 创建模型状态响应
     */
    static modelStatus(data) {
        return this.success(data, '模型状态查询成功');
    }
    /**
     * 创建模型切换响应
     */
    static modelSwitch(model, message) {
        return this.success({ model }, message);
    }
    /**
     * 创建参数验证错误响应
     */
    static validationError(field, message) {
        return this.errorWithCode(ErrorCode.VALIDATION_ERROR, `${field}: ${message}`);
    }
    /**
     * 创建认证错误响应
     */
    static authError(message) {
        return this.errorWithCode(ErrorCode.AUTH_REQUIRED, message);
    }
    /**
     * 创建资源未找到错误响应
     */
    static notFoundError(resource) {
        return this.error(`${resource} not found`, 404);
    }
    /**
     * 创建服务器内部错误响应
     */
    static internalError(message) {
        return this.errorWithCode(ErrorCode.INTERNAL_ERROR, message);
    }
}
/**
 * 响应验证器 - 验证响应是否符合标准格式
 */
export class ResponseValidator {
    /**
     * 验证响应是否包含必需的基础字段
     */
    static validateBaseResponse(response) {
        return (typeof response === 'object' &&
            response !== null &&
            typeof response.code === 'number' &&
            typeof response.message === 'string' &&
            typeof response.timestamp === 'string');
    }
    /**
     * 验证错误响应格式
     */
    static validateErrorResponse(response) {
        return (this.validateBaseResponse(response) &&
            response.code !== 200 &&
            typeof response.message === 'string');
    }
    /**
     * 验证成功响应格式
     */
    static validateSuccessResponse(response) {
        return (this.validateBaseResponse(response) &&
            response.code === 200);
    }
    /**
     * 强制标准化响应格式
     */
    static normalizeResponse(response) {
        if (this.validateBaseResponse(response)) {
            return response;
        }
        // 如果不是标准格式，尝试转换
        if (typeof response === 'string') {
            return ResponseFactory.success({ response });
        }
        if (typeof response === 'object' && response !== null) {
            // 尝试从现有对象中提取有用信息
            const { message, error, ...rest } = response;
            return ResponseFactory.success({
                ...rest,
                ...(message && { message }),
                ...(error && { error })
            });
        }
        // 最后的兜底方案
        return ResponseFactory.internalError('Invalid response format');
    }
}
/**
 * 中间件 - 自动标准化所有响应
 */
export function responseStandardizationMiddleware(req, res, next) {
    const originalJson = res.json;
    res.json = function (data) {
        // 自动标准化响应格式
        const normalizedData = ResponseValidator.normalizeResponse(data);
        return originalJson.call(this, normalizedData);
    };
    next();
}
/**
 * 装饰器 - 用于类方法自动标准化响应
 */
export function standardizeResponse(target, propertyName, descriptor) {
    const method = descriptor.value;
    descriptor.value = async function (...args) {
        try {
            const result = await method.apply(this, args);
            // 如果方法返回了响应对象，自动标准化
            if (result && typeof result === 'object' && 'code' in result) {
                return ResponseValidator.normalizeResponse(result);
            }
            return result;
        }
        catch (error) {
            // 自动处理错误并返回标准错误响应
            return ResponseFactory.internalError(error instanceof Error ? error.message : 'Unknown error');
        }
    };
    return descriptor;
}
//# sourceMappingURL=responseFactory.js.map