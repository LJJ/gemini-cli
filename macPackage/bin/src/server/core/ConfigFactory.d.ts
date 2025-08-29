/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Config } from '../../config/config.js';
import { AuthService } from '../../server/auth/AuthService.js';
import { GeminiClient } from '../../core/client.js';
/**
 * 工作区相关的服务容器 - 只包含与workspace相关的服务
 */
export interface WorkspaceServiceContainer {
    config: Config;
    geminiClient: GeminiClient | null;
}
/**
 * 工厂配置参数
 */
export interface FactoryConfigParams {
    sessionId?: string;
    targetDir: string;
    debugMode?: boolean;
    model?: string;
    proxy?: string;
    cwd?: string;
}
/**
 * ConfigFactory - 配置和服务的中央工厂（优化版）
 *
 * 架构优化：
 * 1. AuthService作为全局单例，不随workspace变化
 * 2. 只有workspace相关的服务（Config、GeminiClient）才重新创建
 * 3. 避免因workspace变更导致的认证状态丢失
 * 4. 保持认证状态的持久性
 */
export declare class ConfigFactory {
    private currentContainer;
    private globalAuthService;
    private isInitialized;
    private enableConfigCache;
    /**
     * 获取或创建全局AuthService（单例模式）
     * @returns AuthService实例
     */
    getOrCreateAuthService(): AuthService;
    /**
     * 创建或重新创建工作区服务容器
     * @param params 工厂配置参数
     * @returns 工作区服务容器
     */
    createWorkspaceContainer(params: FactoryConfigParams): Promise<WorkspaceServiceContainer>;
    /**
     * 重新配置现有容器（用于workspace改变等场景）
     * @param params 新的配置参数
     * @returns 更新后的工作区服务容器
     */
    reconfigureWorkspaceContainer(params: FactoryConfigParams): Promise<WorkspaceServiceContainer>;
    /**
     * 获取当前的工作区服务容器
     * @returns 工作区服务容器，如果未初始化则抛出错误
     */
    getCurrentWorkspaceContainer(): WorkspaceServiceContainer;
    /**
     * 获取全局AuthService
     * @returns AuthService实例
     */
    getAuthService(): AuthService;
    /**
     * 初始化或重新初始化GeminiClient
     * @param disableCodeAssist 是否禁用CodeAssist
     * @returns GeminiClient实例
     */
    initializeGeminiClient(disableCodeAssist?: boolean): Promise<GeminiClient>;
    /**
     * 检查工厂是否已初始化
     */
    isFactoryInitialized(): boolean;
    /**
     * 清理当前容器
     */
    cleanup(): Promise<void>;
    /**
     * 启用或禁用配置缓存
     * @param enabled 是否启用缓存
     */
    setConfigCacheEnabled(enabled: boolean): void;
    /**
     * 清除特定工作区的缓存
     * @param workspacePath 工作区路径
     */
    clearWorkspaceCache(workspacePath: string): void;
    /**
     * 获取所有缓存的工作区
     * @returns 工作区路径数组
     */
    getCachedWorkspaces(): string[];
    /**
     * 只清理工作区相关的容器（保留AuthService）
     */
    cleanupWorkspaceContainer(): Promise<void>;
    /**
     * 创建并完整初始化Config对象（遵循原始逻辑，支持缓存）
     */
    private createAndInitializeConfig;
    /**
     * 检查是否需要重新创建工作区容器
     */
    private needsWorkspaceRecreation;
    /**
     * 使用降级逻辑初始化GeminiClient
     */
    private initializeWithFallback;
}
export declare const configFactory: ConfigFactory;
