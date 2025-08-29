/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { GeminiClient } from '../../core/client.js';
import { AuthService } from '../auth/AuthService.js';
import { WorkspaceAwareService } from '../types/service-interfaces.js';
/**
 * 客户端管理器 - 负责 Gemini 客户端的初始化和管理（优化版）
 *
 * 职责：
 * - 工作区相关的客户端初始化
 * - 工作目录管理
 * - ConfigFactory 集成
 * - 认证服务访问
 *
 * 优化后的特性：
 * - AuthService作为全局单例，不随workspace变化
 * - 只重新创建workspace相关的服务
 * - 保持用户认证状态
 * - 智能子路径检查（恢复原始逻辑）
 */
export declare class ClientManager implements WorkspaceAwareService {
    private currentWorkspacePath;
    private currentContainer;
    private currentModel;
    constructor();
    /**
     * 设置当前模型
     * @param model 模型名称
     */
    setCurrentModel(model: string): void;
    /**
     * 获取当前模型
     * @returns 当前模型名称
     */
    getCurrentModel(): string;
    /**
     * 获取或创建Gemini客户端
     * @param workspacePath 工作目录路径
     * @param disableCodeAssist 是否禁用CodeAssist
     * @returns GeminiClient实例
     */
    getOrCreateClient(workspacePath: string, disableCodeAssist?: boolean): Promise<GeminiClient>;
    /**
     * 获取AuthService实例（全局单例）
     * @returns AuthService实例
     */
    getAuthService(): AuthService;
    /**
     * 检查是否有活跃的客户端
     * @returns 是否有活跃客户端
     */
    hasActiveClient(): boolean;
    /**
     * 实现WorkspaceAwareService接口 - 当工作区改变时调用
     */
    onWorkspaceChanged(newWorkspacePath: string): Promise<void>;
    /**
     * 实现WorkspaceAwareService接口 - 获取当前工作区路径
     */
    getCurrentWorkspace(): string | null;
    /**
     * 清理当前客户端（只清理工作区相关服务）
     */
    cleanup(): Promise<void>;
    /**
     * 获取代理配置
     */
    getProxyConfig(): string | undefined;
    /**
     * 检查新路径是否为当前workspace的子路径（恢复原始逻辑）
     */
    private isSubPath;
    /**
     * 检查是否需要重新初始化工作区（恢复子路径检查逻辑）
     */
    private needsWorkspaceReinitialization;
    /**
     * 初始化工作区
     */
    private initializeWorkspace;
}
