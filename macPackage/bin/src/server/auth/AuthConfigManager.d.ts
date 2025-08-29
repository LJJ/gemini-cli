/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType } from '../../core/contentGenerator.js';
interface AuthConfig {
    authType: AuthType;
    apiKey?: string;
    googleCloudProject?: string;
    googleCloudLocation?: string;
    timestamp: string;
}
/**
 * 认证配置管理器 - 负责认证配置的持久化存储
 *
 * 职责：
 * - 认证配置的保存和加载
 * - 文件系统操作
 * - 配置验证
 */
export declare class AuthConfigManager {
    private readonly configPath;
    constructor();
    /**
     * 保存认证配置到本地文件
     */
    saveConfig(config: Omit<AuthConfig, 'timestamp'>): Promise<void>;
    /**
     * 从本地文件加载认证配置
     */
    loadConfig(): Promise<AuthConfig | null>;
    /**
     * 清除保存的认证配置
     */
    clearConfig(): Promise<void>;
    /**
     * 验证配置格式是否有效
     */
    private isValidConfig;
}
export {};
