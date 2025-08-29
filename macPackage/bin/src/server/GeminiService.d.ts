/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import express from 'express';
import { AuthService } from './AuthService.js';
/**
 * Gemini 服务 - 主要协调器
 *
 * 职责：
 * - 服务组合和协调
 * - HTTP 请求处理
 * - 依赖注入管理
 * - 高级别错误处理
 */
export declare class GeminiService {
    private clientManager;
    private streamingEventService;
    private toolOrchestrator;
    private chatHandler;
    constructor(authService?: AuthService);
    handleChat(req: express.Request, res: express.Response): Promise<express.Response<any, Record<string, any>> | undefined>;
    handleToolConfirmation(req: express.Request, res: express.Response): Promise<express.Response<any, Record<string, any>> | undefined>;
    getGeminiClient(): import("../index.js").GeminiClient | null;
}
