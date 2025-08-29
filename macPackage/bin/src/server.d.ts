/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * API服务器 - 重构后使用ConfigFactory管理依赖（优化版）
 *
 * 重构后的特性：
 * - 使用ConfigFactory解决模块耦合问题
 * - AuthService作为全局单例管理
 * - 支持运行时重新配置workspace
 * - 保持用户认证状态
 */
export declare class APIServer {
    private serverConfig;
    private geminiService;
    private fileService;
    private commandService;
    constructor(port?: number);
    /**
     * 获取全局AuthService实例
     */
    private getAuthService;
    private setupRoutes;
    start(): Promise<void>;
    stop(): Promise<void>;
}
