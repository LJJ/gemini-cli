/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import express from 'express';
/**
 * Gemini 服务 - 主要协调器（优化版）
 *
 * 职责：
 * - 服务组合和协调
 * - HTTP 请求处理
 * - 依赖注入管理
 * - 高级别错误处理
 * - 智能工作目录管理
 *
 * 优化后的特性：
 * - 使用ConfigFactory管理依赖
 * - AuthService作为全局单例
 * - 简化的依赖管理
 */
export declare class GeminiService {
    private clientManager;
    private streamingEventService;
    private toolOrchestrator;
    private chatHandler;
    constructor();
    handleChat(req: express.Request, res: express.Response): Promise<void>;
    handleToolConfirmation(req: express.Request, res: express.Response): Promise<express.Response<any, Record<string, any>> | undefined>;
    /**
     * 获取系统状态
     */
    getSystemStatus(): {
        configFactory: boolean;
        clientManager: boolean;
        currentWorkspace: string | null;
        authService: {
            configured: boolean;
            authenticated: boolean;
        };
    };
    /**
     * 取消当前聊天
     */
    handleCancelChat(res: express.Response): Promise<void>;
    /**
     * 处理模型状态查询
     */
    handleModelStatus(req: express.Request, res: express.Response): Promise<express.Response<any, Record<string, any>> | undefined>;
    /**
     * 处理模型切换
     */
    handleModelSwitch(req: express.Request, res: express.Response): Promise<express.Response<any, Record<string, any>> | undefined>;
    /**
     * 检查模型可用性
     */
    private checkModelAvailability;
}
