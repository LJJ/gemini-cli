/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType } from '../../core/contentGenerator.js';
/**
 * 认证验证器 - 负责认证方法和参数的验证
 *
 * 职责：
 * - 认证类型验证
 * - 认证参数验证
 * - 环境变量验证
 */
export declare class AuthValidator {
    /**
     * 验证认证方法和参数
     */
    validateAuthMethod(authType: AuthType, apiKey?: string, googleCloudProject?: string, googleCloudLocation?: string): string | null;
    /**
     * 从环境变量加载认证配置
     */
    loadFromEnvironment(): {
        authType: AuthType | null;
        apiKey: string | null;
        googleCloudProject: string | null;
        googleCloudLocation: string | null;
    };
}
