/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ServerConfig } from './server/core/ServerConfig.js';
import { GeminiService } from './server/core/GeminiService.js';
import { FileService } from './server/files/FileService.js';
import { CommandService } from './server/tools/CommandService.js';
import { AuthService } from './server/auth/AuthService.js';
import { configFactory } from './server/core/ConfigFactory.js';
import { serverBootstrap } from './server/core/ServerBootstrap.js';

/**
 * API服务器 - 重构后使用ConfigFactory管理依赖（优化版）
 * 
 * 重构后的特性：
 * - 使用ConfigFactory解决模块耦合问题
 * - AuthService作为全局单例管理
 * - 支持运行时重新配置workspace
 * - 保持用户认证状态
 */
export class APIServer {
  private serverConfig: ServerConfig;
  private geminiService: GeminiService;
  private fileService: FileService;
  private commandService: CommandService;

  constructor(port: number = 18080) {
    console.log('APIServer: 初始化服务器');
    
    this.serverConfig = new ServerConfig(port);
    this.fileService = new FileService();
    this.commandService = new CommandService();
    
    // GeminiService不需要直接传入AuthService，它会从ConfigFactory获取
    this.geminiService = new GeminiService();
    
    this.setupRoutes();
    this.serverConfig.addErrorHandler();
  }

  /**
   * 获取全局AuthService实例
   */
  private getAuthService(): AuthService {
    return configFactory.getAuthService();
  }

  private setupRoutes() {
    const app = this.serverConfig.getApp();

    // 健康检查
    app.get('/status', (req, res) => {
      const authService = this.getAuthService();
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '0.1.9',
        configFactory: configFactory.isFactoryInitialized() ? 'initialized' : 'uninitialized',
        bootstrap: {
          initialized: serverBootstrap.isInitialized(),
          defaultWorkspace: serverBootstrap.getDefaultWorkspace()
        },
        authService: {
          configured: authService.isConfigured(),
          authenticated: authService.isUserAuthenticated()
        }
      });
    });

    // 认证功能 - 直接使用全局AuthService
    app.post('/auth/config', async (req, res) => {
      try {
        const authService = this.getAuthService();
        await authService.handleAuthConfig(req, res);
      } catch (error) {
        console.error('Error in /auth/config:', error);
        res.status(500).json({
          success: false,
          message: '认证配置失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    app.post('/auth/google-login', async (req, res) => {
      try {
        const authService = this.getAuthService();
        await authService.handleGoogleLogin(req, res);
      } catch (error) {
        console.error('Error in /auth/google-login:', error);
        res.status(500).json({
          success: false,
          message: 'Google登录失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    app.get('/auth/status', async (req, res) => {
      try {
        const authService = this.getAuthService();
        await authService.handleAuthStatus(req, res);
      } catch (error) {
        console.error('Error in /auth/status:', error);
        res.status(500).json({
          success: false,
          message: '查询认证状态失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    app.post('/auth/logout', async (req, res) => {
      try {
        const authService = this.getAuthService();
        await authService.handleLogout(req, res);
      } catch (error) {
        console.error('Error in /auth/logout:', error);
        res.status(500).json({
          success: false,
          message: '登出失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    app.post('/auth/clear', async (req, res) => {
      try {
        const authService = this.getAuthService();
        await authService.handleClearAuth(req, res);
      } catch (error) {
        console.error('Error in /auth/clear:', error);
        res.status(500).json({
          success: false,
          message: '清除认证配置失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    // 聊天功能 - 连接到真实的 Gemini 服务
    app.post('/chat', (req, res) => {
      this.geminiService.handleChat(req, res);
    });
    
    // 取消聊天功能 - 新增
    app.post('/cancelChat', async (req, res) => {
      await this.geminiService.handleCancelChat(res);
    });
    
    // 工具确认功能
    app.post('/tool-confirmation', (req, res) => {
      this.geminiService.handleToolConfirmation(req, res);
    });
    
    // 文件操作
    app.get('/list-directory', (req, res) => {
      this.fileService.listDirectory(req, res);
    });
    app.post('/read-file', (req, res) => {
      this.fileService.readFile(req, res);
    });
    app.post('/write-file', (req, res) => {
      this.fileService.writeFile(req, res);
    });
    
    // 命令执行
    app.post('/execute-command', (req, res) => {
      this.commandService.executeCommand(req, res);
    });

    // 模型管理
    app.get('/model/status', (req, res) => {
      this.geminiService.handleModelStatus(req, res);
    });
    app.post('/model/switch', (req, res) => {
      this.geminiService.handleModelSwitch(req, res);
    });
  }

  public async start() {
    // 在启动HTTP服务器之前执行预初始化
    await serverBootstrap.initialize();
    
    const app = this.serverConfig.getApp();
    const port = this.serverConfig.getPort();
    
    app.listen(port, () => {
      console.log(`🚀 Gemini CLI API Server is running on port ${port}`);
      console.log(`📡 Health check: http://localhost:${port}/status`);
      console.log(`🔐 Auth endpoints: http://localhost:${port}/auth/*`);
      console.log(`💬 Chat endpoint: http://localhost:${port}/chat`);
      console.log(`📂 File operations: http://localhost:${port}/list-directory`);
      console.log(`⚡ Command execution: http://localhost:${port}/execute-command`);
      console.log(`🤖 Model management: http://localhost:${port}/model/status | http://localhost:${port}/model/switch`);
      console.log(`🏭 ConfigFactory: ${configFactory.isFactoryInitialized() ? 'initialized' : 'uninitialized'}`);
      console.log(`🔧 Bootstrap: ${serverBootstrap.isInitialized() ? 'completed' : 'failed'}`);
      
      const defaultWorkspace = serverBootstrap.getDefaultWorkspace();
      if (defaultWorkspace) {
        console.log(`📁 Default workspace: ${defaultWorkspace}`);
      }
      
      // 初始化全局AuthService
      const authService = this.getAuthService();
      console.log(`🔐 AuthService: ${authService.isConfigured() ? 'configured' : 'not configured'}`);
    });
  }

  public async stop() {
    console.log('🛑 Stopping Gemini CLI API Server...');
    
    // 清理ConfigFactory（包括AuthService）
    try {
      await configFactory.cleanup();
      console.log('✅ ConfigFactory cleanup completed');
    } catch (error) {
      console.error('❌ Error during ConfigFactory cleanup:', error);
    }
    
    process.exit(0);
  }
}

// 如果直接运行此文件，启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parseInt(process.env.PORT || '18080', 10);
  const server = new APIServer(port);
  
  // 使用async立即执行函数来处理异步启动
  (async () => {
    try {
      await server.start();
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  })();

  // 处理优雅关闭
  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    server.stop();
  });

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    server.stop();
  });
} 