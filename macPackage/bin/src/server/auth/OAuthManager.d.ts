/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Config } from '../../config/config.js';
/**
 * OAuth管理器 - 负责OAuth凭据的验证和管理
 *
 * 职责：
 * - OAuth凭据验证
 * - 过期凭据清理
 * - OAuth客户端管理
 */
export declare class OAuthManager {
    private readonly oauthCredsPath;
    private config;
    constructor(config?: Config);
    /**
     * 设置配置对象
     */
    setConfig(config: Config): void;
    /**
     * 检查是否有配置对象
     */
    hasConfig(): boolean;
    /**
     * 获取配置对象
     */
    getConfig(): Config | null;
    /**
     * 验证OAuth凭据是否有效
     *
     * 让OAuth2Client自动处理令牌刷新，我们只需要检查基本的文件完整性
     */
    validateCredentials(): Promise<boolean>;
    /**
     * 初始化OAuth客户端（用于登录流程）
     */
    initializeOAuthClient(timeoutMs?: number): Promise<void>;
    /**
     * 检查并清理过期的OAuth缓存凭据（仅用于登录流程）
     */
    private checkAndCleanExpiredCredentials;
    /**
     * 判断凭据是否损坏（只检查基本格式）
     */
    private isCredentialsCorrupted;
    /**
     * 判断错误是否为认证错误（需要清理凭据）
     */
    private isAuthenticationError;
    /**
     * 清理过期凭据
     */
    private cleanExpiredCredentials;
    /**
     * 检查错误是否为网络相关错误
     */
    isNetworkError(error: Error): boolean;
}
