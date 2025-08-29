/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * 服务器启动引导器 - 负责预初始化服务
 *
 * 在服务器启动时执行以下初始化：
 * 1. 清理过期缓存
 * 2. 尝试从缓存加载最近使用的工作区配置
 * 3. 预初始化 ConfigFactory
 * 4. 设置默认工作区（如果有缓存）
 */
export declare class ServerBootstrap {
    private initialized;
    private defaultWorkspace;
    /**
     * 执行服务器预初始化
     */
    initialize(): Promise<void>;
    /**
     * 获取预加载的默认工作区
     */
    getDefaultWorkspace(): string | null;
    /**
     * 检查是否已初始化
     */
    isInitialized(): boolean;
    /**
     * 清理过期缓存
     */
    private cleanupExpiredCache;
    /**
     * 预加载最近使用的工作区
     */
    private preloadRecentWorkspace;
    /**
     * 初始化默认工作区
     */
    private initializeDefaultWorkspace;
    /**
     * 验证初始化状态
     */
    private verifyInitialization;
    /**
     * 重置初始化状态（用于测试）
     */
    reset(): void;
}
export declare const serverBootstrap: ServerBootstrap;
