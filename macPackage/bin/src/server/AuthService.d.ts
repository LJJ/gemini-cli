/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import express from 'express';
import { AuthType } from '../core/contentGenerator.js';
/**
 * 认证服务 - 主要协调器
 *
 * 职责：
 * - 认证流程协调
 * - HTTP请求处理
 * - 认证状态管理
 * - 组件协调
 */
export declare class AuthService {
    private currentAuthType;
    private currentApiKey;
    private currentGoogleCloudProject;
    private currentGoogleCloudLocation;
    private isAuthenticated;
    private configManager;
    private oauthManager;
    private validator;
    constructor();
    /**
     * 初始化认证状态 - 在构造函数中立即调用
     */
    private initializeAuthState;
    handleAuthConfig(req: express.Request, res: express.Response): Promise<express.Response<any, Record<string, any>> | undefined>;
    handleGoogleLogin(req: express.Request, res: express.Response): Promise<express.Response<any, Record<string, any>> | undefined>;
    handleAuthStatus(req: express.Request, res: express.Response): Promise<void>;
    handleLogout(req: express.Request, res: express.Response): Promise<void>;
    handleClearAuth(req: express.Request, res: express.Response): Promise<void>;
    getContentGeneratorConfig(disableCodeAssist?: boolean): Promise<import("../core/contentGenerator.js").ContentGeneratorConfig | {
        codeAssist: undefined;
        model: string;
        apiKey?: string;
        vertexai?: boolean;
        authType?: AuthType | undefined;
    }>;
    isUserAuthenticated(): boolean;
    getCurrentAuthType(): AuthType | null;
    /**
     * 从环境变量加载认证配置
     */
    private loadFromEnvironment;
    /**
     * 清除认证状态
     */
    private clearAuthState;
}
