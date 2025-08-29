/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import express from 'express';
import { AuthType } from '../../core/contentGenerator.js';
import { Config } from '../../config/config.js';
import { ConfigurableService, ServiceStatusInfo } from '../types/service-interfaces.js';
/**
 * 认证服务 - 主要协调器
 *
 * 职责：
 * - 认证流程协调
 * - HTTP请求处理
 * - 认证状态管理
 * - 组件协调
 *
 * 重构后的特性：
 * - 支持运行时重新配置
 * - 实现ConfigurableService接口
 * - 解耦Config依赖
 * - 启动时自动验证OAuth凭据
 */
export declare class AuthService implements ConfigurableService {
    private currentAuthType;
    private currentApiKey;
    private currentGoogleCloudProject;
    private currentGoogleCloudLocation;
    private isAuthenticated;
    private configManager;
    private oauthManager;
    private validator;
    private config;
    private status;
    constructor(config?: Config);
    /**
     * 实现ConfigurableService接口 - 设置配置对象
     */
    setConfig(config: Config): void;
    /**
     * 实现ConfigurableService接口 - 获取配置对象
     */
    getConfig(): Config | null;
    /**
     * 实现ConfigurableService接口 - 检查服务是否已配置
     */
    isConfigured(): boolean;
    /**
     * 运行时重新配置服务
     * @param config 新的配置对象
     */
    reconfigure(config: Config): Promise<void>;
    /**
     * 获取服务状态
     */
    getStatus(): ServiceStatusInfo;
    /**
     * 检查用户是否已认证
     */
    isUserAuthenticated(): boolean;
    /**
     * 初始化认证状态 - 在构造函数中调用（优化OAuth验证）
     */
    private initializeAuthState;
    /**
     * 创建临时Config对象用于OAuth验证
     */
    private createTemporaryConfig;
    handleAuthConfig(req: express.Request, res: express.Response): Promise<express.Response<any, Record<string, any>> | undefined>;
    handleGoogleLogin(req: express.Request, res: express.Response): Promise<express.Response<any, Record<string, any>> | undefined>;
    handleAuthStatus(req: express.Request, res: express.Response): Promise<void>;
    handleLogout(req: express.Request, res: express.Response): Promise<void>;
    handleClearAuth(req: express.Request, res: express.Response): Promise<void>;
    getContentGeneratorConfig(disableCodeAssist?: boolean): Promise<import("../../core/contentGenerator.js").ContentGeneratorConfig | {
        codeAssist: undefined;
        model: string;
        apiKey?: string;
        vertexai?: boolean;
        authType?: AuthType | undefined;
    }>;
    /**
     * 从环境变量加载认证配置
     */
    private loadFromEnvironment;
    /**
     * 清除认证状态
     */
    private clearAuthState;
    /**
     * 更新服务状态
     */
    private updateStatus;
}
