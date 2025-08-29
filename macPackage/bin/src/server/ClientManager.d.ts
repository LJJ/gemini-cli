/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Config, GeminiClient } from '../index.js';
import { AuthService } from './AuthService.js';
/**
 * 客户端管理器 - 负责 Gemini 客户端的初始化和管理
 *
 * 职责：
 * - Gemini 客户端初始化
 * - 配置管理
 * - 认证处理
 * - CodeAssist 降级逻辑
 */
export declare class ClientManager {
    private geminiClient;
    private config;
    private authService;
    constructor(authService?: AuthService);
    initializeClient(workspacePath?: string): Promise<GeminiClient>;
    getClient(): GeminiClient | null;
    getConfig(): Config | null;
    private initializeWithFallback;
    private getDefaultWorkspace;
    private getProxyConfig;
}
