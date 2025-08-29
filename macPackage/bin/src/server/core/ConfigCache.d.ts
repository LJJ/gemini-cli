/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Config, ConfigParameters } from '../../config/config.js';
/**
 * 可序列化的配置参数（用于缓存）
 */
export interface CacheableConfig {
    sessionId: string;
    targetDir: string;
    debugMode: boolean;
    model: string;
    proxy?: string;
    cwd: string;
    timestamp: number;
}
/**
 * 配置缓存管理器
 * 负责将Config对象的参数持久化到本地文件系统
 */
export declare class ConfigCache {
    private static readonly CACHE_DIR;
    private static readonly CONFIG_CACHE_FILE;
    private static readonly CACHE_EXPIRY_MS;
    /**
     * 确保缓存目录存在
     */
    private static ensureCacheDir;
    /**
     * 将Config对象的关键参数保存到缓存
     * @param config 要缓存的Config对象
     * @param workspaceKey 工作区标识符（通常是targetDir的路径）
     */
    static saveConfigToCache(config: Config, workspaceKey: string): void;
    /**
     * 从缓存中恢复Config参数
     * @param workspaceKey 工作区标识符
     * @returns 缓存的配置参数，如果不存在或已过期则返回null
     */
    static loadConfigFromCache(workspaceKey: string): CacheableConfig | null;
    /**
     * 将缓存的配置参数转换为ConfigParameters
     * @param cachedConfig 缓存的配置
     * @param overrides 可选的覆盖参数
     * @returns ConfigParameters对象
     */
    static toConfigParameters(cachedConfig: CacheableConfig, overrides?: Partial<ConfigParameters>): ConfigParameters;
    /**
     * 删除特定工作区的缓存配置
     * @param workspaceKey 工作区标识符
     */
    static removeCachedConfig(workspaceKey: string): void;
    /**
     * 清理所有过期的缓存
     */
    static cleanupExpiredCache(): void;
    /**
     * 获取所有缓存的工作区列表
     * @returns 工作区键名数组
     */
    static getCachedWorkspaces(): string[];
}
