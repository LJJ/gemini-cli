/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { AuthType, createContentGeneratorConfig } from '../../core/contentGenerator.js';
import { ResponseFactory } from '../utils/responseFactory.js';
import { AuthConfigManager } from './AuthConfigManager.js';
import { OAuthManager } from './OAuthManager.js';
import { AuthValidator } from './AuthValidator.js';
import { DEFAULT_GEMINI_FLASH_MODEL } from '../../config/models.js';
import { Config, ConfigParameters } from '../../config/config.js';
import { ErrorCode, createError } from '../types/error-codes.js';
import { ConfigurableService, ServiceStatus, ServiceStatusInfo } from '../types/service-interfaces.js';
import { configFactory } from '../core/ConfigFactory.js';
import { ProjectService } from '../project/ProjectService.js';

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
export class AuthService implements ConfigurableService {
  private currentAuthType: AuthType | null = null;
  private currentApiKey: string | null = null;
  private currentGoogleCloudProject: string | null = null;
  private currentGoogleCloudLocation: string | null = null;
  private isAuthenticated = false;

  private configManager: AuthConfigManager;
  private oauthManager: OAuthManager;
  private validator: AuthValidator;
  private config: Config | null = null;
  private status: ServiceStatusInfo;

  constructor(config?: Config) {
    // 初始化状态
    this.status = {
      status: ServiceStatus.UNINITIALIZED,
      message: 'AuthService创建完成，等待配置',
      timestamp: new Date()
    };

    // 依赖注入 - 组合专职组件
    this.configManager = new AuthConfigManager();
    this.oauthManager = new OAuthManager();
    this.validator = new AuthValidator();

    // 如果提供了config，立即设置
    if (config) {
      this.setConfig(config);
    }

    // 立即尝试恢复认证状态（但不依赖config）
    this.initializeAuthState();
  }

  /**
   * 实现ConfigurableService接口 - 设置配置对象
   */
  public setConfig(config: Config): void {
    console.log('AuthService: 设置配置对象');
    this.config = config;
    
    // 更新依赖组件的配置
    this.oauthManager.setConfig(config);
    
    // 更新状态
    this.updateStatus(ServiceStatus.CONFIGURED, 'Config对象已设置');
  }

  /**
   * 实现ConfigurableService接口 - 获取配置对象
   */
  public getConfig(): Config | null {
    return this.config;
  }

  /**
   * 实现ConfigurableService接口 - 检查服务是否已配置
   */
  public isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * 运行时重新配置服务
   * @param config 新的配置对象
   */
  public async reconfigure(config: Config): Promise<void> {
    console.log('AuthService: 重新配置服务');
    this.updateStatus(ServiceStatus.CONFIGURING, '正在重新配置服务');
    
    try {
      // 设置新的配置
      this.setConfig(config);
      
      // 重新初始化认证状态
      await this.initializeAuthState();
      
      console.log('AuthService: 重新配置完成');
      this.updateStatus(ServiceStatus.CONFIGURED, '重新配置完成');
    } catch (error) {
      console.error('AuthService: 重新配置失败:', error);
      this.updateStatus(ServiceStatus.ERROR, '重新配置失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取服务状态
   */
  public getStatus(): ServiceStatusInfo {
    return { ...this.status };
  }

  /**
   * 检查用户是否已认证
   */
  public isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  /**
   * 初始化认证状态 - 在构造函数中调用（优化OAuth验证）
   */
  private async initializeAuthState(): Promise<void> {
    try {
      console.log('正在恢复认证状态...');
      this.updateStatus(ServiceStatus.INITIALIZING, '正在恢复认证状态');
      
      // 1. 首先尝试从配置文件恢复
      const savedConfig = await this.configManager.loadConfig();
      if (savedConfig) {
        console.log('从配置文件恢复认证状态:', savedConfig.authType);
        
        this.currentAuthType = savedConfig.authType;
        this.currentApiKey = savedConfig.apiKey || null;
        this.currentGoogleCloudProject = savedConfig.googleCloudProject || null;
        this.currentGoogleCloudLocation = savedConfig.googleCloudLocation || null;

        // 验证恢复的认证状态
        if (savedConfig.authType === AuthType.LOGIN_WITH_GOOGLE) {
          // OAuth需要验证凭据
          if (this.config) {
          console.log('开始验证OAuth凭据有效性...');
          this.isAuthenticated = await this.oauthManager.validateCredentials();
          console.log('OAuth凭据验证结果:', this.isAuthenticated ? '成功' : '失败');
          } else {
            // 关键修复：没有Config对象时，创建临时Config进行OAuth验证
            console.log('没有Config对象，创建临时Config验证OAuth凭据...');
            const tempConfig = this.createTemporaryConfig();
            this.oauthManager.setConfig(tempConfig);
            
            this.isAuthenticated = await this.oauthManager.validateCredentials();
            console.log('OAuth凭据验证结果:', this.isAuthenticated ? '成功' : '失败');
          
          if (!this.isAuthenticated) {
            console.log('⚠️ OAuth凭据验证失败，用户需要重新登录');
          } else {
            console.log('✅ OAuth凭据有效，认证状态已恢复');
            }
          }
        } else {
          // API Key认证直接标记为已认证
          this.isAuthenticated = true;
          console.log('✅ API Key认证状态已恢复');
        }
      } else {
        // 2. 如果没有保存的配置，尝试从环境变量加载
        console.log('没有保存的配置，尝试从环境变量加载');
        this.loadFromEnvironment();
      }

      console.log('认证状态初始化完成:', {
        authType: this.currentAuthType,
        isAuthenticated: this.isAuthenticated,
        hasApiKey: !!this.currentApiKey,
        hasGoogleCloudConfig: !!(this.currentGoogleCloudProject && this.currentGoogleCloudLocation)
      });

      this.updateStatus(ServiceStatus.INITIALIZED, '认证状态初始化完成');
    } catch (error) {
      console.error('初始化认证状态失败:', error);
      this.updateStatus(ServiceStatus.ERROR, '初始化认证状态失败', error as Error);
      // 初始化失败不应该阻止服务启动
    }
  }

  /**
   * 创建临时Config对象用于OAuth验证
   */
  private createTemporaryConfig(): Config {
    console.log('AuthService: 创建临时Config对象进行OAuth验证');
    
    const tempConfigParams: ConfigParameters = {
      sessionId: `temp-auth-${Date.now()}`,
      targetDir: process.cwd(), // 使用当前工作目录作为临时目录
      debugMode: false,
      cwd: process.cwd(),
      model: DEFAULT_GEMINI_FLASH_MODEL,
      // 不需要初始化工具注册表，因为只用于OAuth验证
    };

    return new Config(tempConfigParams);
  }

  public async handleAuthConfig(req: express.Request, res: express.Response) {
    try {
      const { authType, apiKey, googleCloudProject, googleCloudLocation } = req.body;

      if (!authType) {
        return res.status(400).json(ResponseFactory.validationError('authType', '认证类型是必需的'));
      }

      // 验证认证方法
      const validationError = this.validator.validateAuthMethod(authType, apiKey, googleCloudProject, googleCloudLocation);
      if (validationError) {
        return res.status(400).json(ResponseFactory.validationError('auth', validationError));
      }

      // 保存认证配置到内存
      this.currentAuthType = authType;
      this.currentApiKey = apiKey || null;
      this.currentGoogleCloudProject = googleCloudProject || null;
      this.currentGoogleCloudLocation = googleCloudLocation || null;

      // 持久化认证配置（修复重启问题）
      await this.configManager.saveConfig({
        authType,
        apiKey,
        googleCloudProject,
        googleCloudLocation
      });

      // 根据认证类型设置状态
      if (authType === AuthType.LOGIN_WITH_GOOGLE) {
        this.isAuthenticated = false; // 需要完成登录流程
      } else {
        this.isAuthenticated = true; // API Key 认证直接完成
      }

      res.json(ResponseFactory.authConfig('认证配置已设置'));

    } catch (error) {
      console.error('Error in handleAuthConfig:', error);
      res.status(500).json(ResponseFactory.internalError(error instanceof Error ? error.message : '设置认证配置失败'));
    }
  }

  public async handleGoogleLogin(req: express.Request, res: express.Response) {
    try {
      console.log('启动 Google 登录流程');

      if (this.currentAuthType !== AuthType.LOGIN_WITH_GOOGLE) {
        return res.status(400).json(ResponseFactory.validationError('authType', '当前认证类型不是 Google 登录'));
      }

      // 检查是否有Config对象，如果没有则创建临时Config
      if (!this.config) {
        console.log('没有Config对象，创建临时Config进行Google登录');
        const tempConfig = this.createTemporaryConfig();
        this.oauthManager.setConfig(tempConfig);
      }

      try {
        await this.oauthManager.initializeOAuthClient();
        this.isAuthenticated = true;
        
        res.json(ResponseFactory.authConfig('Google 登录成功'));
      } catch (oauthError) {
        console.error('Google OAuth 错误:', oauthError);
        
        if (oauthError instanceof Error && this.oauthManager.isNetworkError(oauthError)) {
          res.status(500).json(ResponseFactory.errorWithCode(
            ErrorCode.NETWORK_ERROR, 
            '网络连接超时或缓存凭据过期，已自动清理缓存。请检查网络连接后重试。'
          ));
        } else {
          res.status(500).json(ResponseFactory.errorWithCode(
            ErrorCode.AUTH_CONFIG_FAILED, 
            'Google 登录失败，请检查网络连接或尝试使用 API Key 认证方式'
          ));
        }
      }

    } catch (error) {
      console.error('Error in handleGoogleLogin:', error);
      res.status(500).json(ResponseFactory.internalError(
        error instanceof Error ? error.message : '启动 Google 登录失败'
      ));
    }
  }

  public async handleGoogleAuthUrl(req: express.Request, res: express.Response) {
    try {
      console.log('生成 Google 授权 URL');

      if (this.currentAuthType !== AuthType.LOGIN_WITH_GOOGLE) {
        return res.status(400).json(ResponseFactory.validationError('authType', '当前认证类型不是 Google 登录'));
      }

      // 检查是否有Config对象，如果没有则创建临时Config
      if (!this.config) {
        console.log('没有Config对象，创建临时Config进行Google登录');
        const tempConfig = this.createTemporaryConfig();
        this.oauthManager.setConfig(tempConfig);
      }

      try {
        const authUrl = await this.oauthManager.generateAuthUrl();
        
        res.json(ResponseFactory.success({
          authUrl: authUrl
        }, '授权 URL 生成成功'));
      } catch (oauthError) {
        console.error('生成授权 URL 错误:', oauthError);
        res.status(500).json(ResponseFactory.errorWithCode(
          ErrorCode.AUTH_CONFIG_FAILED, 
          '生成授权 URL 失败'
        ));
      }

    } catch (error) {
      console.error('Error in handleGoogleAuthUrl:', error);
      res.status(500).json(ResponseFactory.internalError(
        error instanceof Error ? error.message : '生成授权 URL 失败'
      ));
    }
  }

  public async handleGoogleAuthCode(req: express.Request, res: express.Response) {
    try {
      console.log('处理 Google 授权码');
      console.log('请求体:', req.body);

      if (this.currentAuthType !== AuthType.LOGIN_WITH_GOOGLE) {
        console.log('当前认证类型不是 Google 登录:', this.currentAuthType);
        return res.status(400).json(ResponseFactory.validationError('authType', '当前认证类型不是 Google 登录'));
      }

      const { code } = req.body;
      console.log('收到授权码:', code ? '有效' : '无效');
      
      if (!code) {
        console.log('授权码为空');
        return res.status(400).json(ResponseFactory.validationError('code', '授权码不能为空'));
      }

      // 检查是否有Config对象，如果没有则创建临时Config
      if (!this.config) {
        console.log('没有Config对象，创建临时Config进行Google登录');
        const tempConfig = this.createTemporaryConfig();
        this.oauthManager.setConfig(tempConfig);
      }

      try {
        console.log('开始交换授权码...');
        await this.oauthManager.exchangeCodeForTokens(code);
        console.log('授权码交换成功');
        
        this.isAuthenticated = true;
        console.log('设置认证状态为已认证');
        
        const response = ResponseFactory.authConfig('Google 登录成功');
        console.log('返回响应:', response);
        
        res.json(response);
      } catch (oauthError) {
        console.error('Google OAuth 错误:', oauthError);
        console.error('错误类型:', typeof oauthError);
        console.error('错误消息:', oauthError instanceof Error ? oauthError.message : 'Unknown error');
        
        if (oauthError instanceof Error && this.oauthManager.isNetworkError(oauthError)) {
          res.status(500).json(ResponseFactory.errorWithCode(
            ErrorCode.NETWORK_ERROR, 
            '网络连接超时，请检查网络连接后重试。'
          ));
        } else {
          res.status(500).json(ResponseFactory.errorWithCode(
            ErrorCode.AUTH_CONFIG_FAILED, 
            'Google 登录失败，请检查授权码是否正确'
          ));
        }
      }

    } catch (error) {
      console.error('Error in handleGoogleAuthCode:', error);
      res.status(500).json(ResponseFactory.internalError(
        error instanceof Error ? error.message : '处理授权码失败'
      ));
    }
  }

  public async handleAuthStatus(req: express.Request, res: express.Response) {
    try {
      // 如果当前没有认证状态，触发初始化（确保状态最新）
      if (this.currentAuthType === null) {
        await this.initializeAuthState();
      }

      res.json(ResponseFactory.authStatus({
        isAuthenticated: this.isAuthenticated,
        authType: this.currentAuthType,
        hasApiKey: !!this.currentApiKey,
        hasGoogleCloudConfig: !!(this.currentGoogleCloudProject && this.currentGoogleCloudLocation)
      }));
    } catch (error) {
      console.error('Error in handleAuthStatus:', error);
      res.status(500).json(ResponseFactory.internalError(error instanceof Error ? error.message : '查询认证状态失败'));
    }
  }

  public async handleLogout(req: express.Request, res: express.Response) {
    try {
      console.log('用户登出，清除所有认证凭据和聊天服务');
      
      // 清除内存中的认证信息
      this.clearAuthState();
      
      // 清除持久化的配置
      await this.configManager.clearConfig();
      
      // 清除 OAuth 凭据（类似 clear-auth.sh 脚本）
      await this.clearAllAuthCredentials();
      
      // 清除聊天相关服务状态
      await this.cleanupChatServices();
      
      res.json(ResponseFactory.authConfig('登出成功，所有认证凭据和聊天服务已清除'));
    } catch (error) {
      console.error('Error in handleLogout:', error);
      res.status(500).json(ResponseFactory.internalError(error instanceof Error ? error.message : '登出失败'));
    }
  }

  /**
   * 清除聊天相关服务状态
   * 确保登出后下次登录时的用户状态一致
   */
  private async cleanupChatServices() {
    try {
      console.log('开始清除聊天服务状态...');
      
      // 1. 清除 ConfigFactory 及其管理的所有工作区容器
      await configFactory.cleanup();
      console.log('ConfigFactory 清理完成');
      
      // 2. 清除项目服务缓存的配置
      ProjectService.clearConfig();
      console.log('ProjectService 配置清理完成');
      
      // 3. 禁用配置缓存，确保下次登录时重新初始化
      configFactory.setConfigCacheEnabled(false);
      console.log('配置缓存已禁用');
      
      console.log('聊天服务状态清理完成');
    } catch (error) {
      console.error('清除聊天服务状态时出错:', error);
      // 不抛出错误，避免影响登出流程
    }
  }

  public async handleClearAuth(req: express.Request, res: express.Response) {
    try {
      console.log('清除认证配置，准备切换认证方式');
      
      // 清除内存中的认证信息
      this.clearAuthState();
      
      // 清除持久化的配置
      await this.configManager.clearConfig();
      
      // 清除 OAuth 凭据
      await this.clearAllAuthCredentials();
      
      res.json(ResponseFactory.authConfig('认证配置已清除，可以重新设置认证方式'));
    } catch (error) {
      console.error('Error in handleClearAuth:', error);
      res.status(500).json(ResponseFactory.internalError(error instanceof Error ? error.message : '清除认证配置失败'));
    }
  }

  public async getContentGeneratorConfig(disableCodeAssist: boolean = false) {
    if (!this.currentAuthType) {
      throw createError(ErrorCode.AUTH_NOT_SET);
    }

    // 确保有 Config 对象，如果没有则创建临时配置
    if (!this.config) {
      console.log('没有 Config 对象，创建临时配置');
      this.config = this.createTemporaryConfig();
    }
    
    console.log('AuthService: 创建 ContentGeneratorConfig', { 
      currentModel: this.config.getModel(), 
      authType: this.currentAuthType,
      disableCodeAssist 
    });

    const config = await createContentGeneratorConfig(
      this.config,
      this.currentAuthType
    );

    // 将创建的配置设置到 Config 对象中，确保模型切换生效
    if (this.config) {
      this.config.setContentGeneratorConfig(config);
    }

    // 如果禁用 CodeAssist，移除相关配置
    if (disableCodeAssist) {
      console.log('禁用 CodeAssist 配置');
      return {
        ...config,
        codeAssist: undefined
      };
    }

    return config;
  }

  /**
   * 从环境变量加载认证配置
   */
  private loadFromEnvironment(): void {
    const envConfig = this.validator.loadFromEnvironment();
    
    if (envConfig.authType) {
      this.currentAuthType = envConfig.authType;
      this.currentApiKey = envConfig.apiKey;
      this.currentGoogleCloudProject = envConfig.googleCloudProject;
      this.currentGoogleCloudLocation = envConfig.googleCloudLocation;
      this.isAuthenticated = true;
    }
  }

  /**
   * 清除认证状态
   */
  private clearAuthState(): void {
    this.currentAuthType = null;
    this.currentApiKey = null;
    this.currentGoogleCloudProject = null;
    this.currentGoogleCloudLocation = null;
    this.isAuthenticated = false;
  }

  /**
   * 清除所有认证凭据文件（类似 clear-auth.sh 脚本）
   */
  private async clearAllAuthCredentials(): Promise<void> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');
      
      const geminiDir = path.join(os.homedir(), '.gemini');
      console.log(`清除认证凭据目录: ${geminiDir}`);
      
      // 检查目录是否存在
      if (!fs.existsSync(geminiDir)) {
        console.log('✅ Gemini 配置目录不存在，无需清除');
        return;
      }
      
      // 需要清除的文件列表（与 clear-auth.sh 保持一致）
      const filesToClear = [
        'oauth_creds.json',
        'auth_config.json',
        'google_accounts.json'
      ];
      
      // 清除每个文件
      for (const file of filesToClear) {
        const filePath = path.join(geminiDir, file);
        try {
          if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
            console.log(`🗑️  已删除文件: ${file}`);
          } else {
            console.log(`ℹ️  文件不存在: ${file}`);
          }
        } catch (error) {
          console.warn(`⚠️  删除文件失败 ${file}:`, error);
        }
      }
      
      // 检查是否还有其他 JSON 文件
      try {
        const files = await fs.promises.readdir(geminiDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        if (jsonFiles.length > 0) {
          console.log(`⚠️  发现其他 JSON 文件: ${jsonFiles.join(', ')}`);
        } else {
          console.log('✅ 所有认证相关文件已清除');
        }
        
        // 检查目录是否为空，如果为空则删除
        const remainingFiles = await fs.promises.readdir(geminiDir);
        if (remainingFiles.length === 0) {
          await fs.promises.rmdir(geminiDir);
          console.log('🗑️  已删除空的 .gemini 目录');
        } else {
          console.log('📁 .gemini 目录中还有其他文件，保留目录');
        }
      } catch (error) {
        console.warn('检查剩余文件时出错:', error);
      }
      
      console.log('🎉 认证凭据清除完成！');
    } catch (error) {
      console.error('清除认证凭据时出错:', error);
      throw error;
    }
  }

  /**
   * 更新服务状态
   */
  private updateStatus(status: ServiceStatus, message?: string, error?: Error): void {
    this.status = {
      status,
      message,
      error,
      timestamp: new Date()
    };
  }
} 