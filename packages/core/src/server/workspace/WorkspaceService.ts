/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { ResponseFactory } from '../utils/responseFactory.js';
import { ClientManager } from '../core/ClientManager.js';
import { ErrorCode } from '../types/error-codes.js';

/**
 * 工作区服务 - 专门处理工作区相关逻辑
 * 
 * 职责：
 * - 工作区路径解析
 * - 工作区初始化
 * - 工作区状态管理
 * - 工作区切换
 */
export class WorkspaceService {
  private clientManager: ClientManager;

  constructor(clientManager: ClientManager) {
    this.clientManager = clientManager;
  }

  /**
   * 处理工作区初始化请求
   */
  public async handleWorkspaceInitialization(req: express.Request, res: express.Response) {
    try {
      const { workspacePath } = req.body;
      
      // 解析有效的工作区路径
      const effectiveWorkspacePath = await this.resolveWorkspacePath(workspacePath);
      
      console.log('Processing workspace initialization request', { 
        requestedWorkspace: workspacePath || '(默认)',
        effectiveWorkspace: effectiveWorkspacePath,
        currentWorkspace: this.clientManager.getCurrentWorkspace()
      });

      // 使用ClientManager获取或创建客户端（会自动处理ConfigFactory）
      try {
        await this.clientManager.getOrCreateClient(effectiveWorkspacePath);
        
        return res.json(ResponseFactory.success({
          workspacePath: effectiveWorkspacePath,
          initialized: true
        }, '工作区初始化成功'));
        
      } catch (clientError) {
        // 检查是否是 GOOGLE_CLOUD_PROJECT 错误
        const errorCode = clientError instanceof Error && (clientError as any).code ? (clientError as any).code : ErrorCode.INTERNAL_ERROR;
        const errorMessage = clientError instanceof Error ? clientError.message : 'Unknown error';
        
        return res.status(500).json(ResponseFactory.errorWithCode(errorCode, errorMessage));
      }
      
    } catch (error) {
      console.error('Error in handleWorkspaceInitialization:', error);
      
      const errorCode = error instanceof Error && (error as any).code ? (error as any).code : ErrorCode.INTERNAL_ERROR;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return res.status(500).json(ResponseFactory.errorWithCode(errorCode, errorMessage));
    }
  }

  /**
   * 处理工作区状态查询请求
   */
  public async handleWorkspaceStatus(req: express.Request, res: express.Response) {
    try {
      const currentWorkspace = this.clientManager.getCurrentWorkspace();
      const hasActiveClient = this.clientManager.hasActiveClient();
      
      return res.json(ResponseFactory.success({
        currentWorkspace,
        hasActiveClient,
        initialized: hasActiveClient
      }, '工作区状态查询成功'));
      
    } catch (error) {
      console.error('Error in handleWorkspaceStatus:', error);
      
      const errorCode = error instanceof Error && (error as any).code ? (error as any).code : ErrorCode.INTERNAL_ERROR;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return res.status(500).json(ResponseFactory.errorWithCode(errorCode, errorMessage));
    }
  }

  /**
   * 处理工作区切换请求
   */
  public async handleWorkspaceSwitch(req: express.Request, res: express.Response) {
    try {
      const { workspacePath } = req.body;
      
      if (!workspacePath) {
        return res.status(400).json(ResponseFactory.validationError('workspacePath', 'Workspace path is required'));
      }
      
      const currentWorkspace = this.clientManager.getCurrentWorkspace();
      const effectiveWorkspacePath = await this.resolveWorkspacePath(workspacePath);
      
      // 如果是相同的工作区，不需要切换
      if (currentWorkspace === effectiveWorkspacePath) {
        return res.json(ResponseFactory.success({
          workspacePath: effectiveWorkspacePath,
          switched: false,
          previousWorkspace: currentWorkspace
        }, `已在工作区: ${effectiveWorkspacePath}`));
      }
      
      console.log('Processing workspace switch request', { 
        requestedWorkspace: workspacePath,
        effectiveWorkspace: effectiveWorkspacePath,
        currentWorkspace
      });

      // 切换到新的工作区
      try {
        await this.clientManager.getOrCreateClient(effectiveWorkspacePath);
        
        return res.json(ResponseFactory.success({
          workspacePath: effectiveWorkspacePath,
          switched: true,
          previousWorkspace: currentWorkspace
        }, `工作区切换成功: ${currentWorkspace || 'none'} -> ${effectiveWorkspacePath}`));
        
      } catch (clientError) {
        // 检查是否是 GOOGLE_CLOUD_PROJECT 错误
        const errorCode = clientError instanceof Error && (clientError as any).code ? (clientError as any).code : ErrorCode.INTERNAL_ERROR;
        const errorMessage = clientError instanceof Error ? clientError.message : 'Unknown error';
        
        return res.status(500).json(ResponseFactory.errorWithCode(errorCode, errorMessage));
      }
      
    } catch (error) {
      console.error('Error in handleWorkspaceSwitch:', error);
      
      const errorCode = error instanceof Error && (error as any).code ? (error as any).code : ErrorCode.INTERNAL_ERROR;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return res.status(500).json(ResponseFactory.errorWithCode(errorCode, errorMessage));
    }
  }

  /**
   * 解析有效的工作区路径
   */
  public async resolveWorkspacePath(workspacePath?: string): Promise<string> {
    // workspacePath 现在是可选的，如果没有提供，使用预初始化的默认工作区
    let effectiveWorkspacePath = workspacePath;
    
    if (!effectiveWorkspacePath) {
      // 尝试使用预初始化的默认工作区
      const { serverBootstrap } = await import('../core/ServerBootstrap.js');
      effectiveWorkspacePath = serverBootstrap.getDefaultWorkspace() ?? process.cwd();;
    }
    
    return effectiveWorkspacePath;
  }

  /**
   * 确保工作区已初始化
   */
  public async ensureWorkspaceInitialized(workspacePath?: string): Promise<string> {
    const effectiveWorkspacePath = await this.resolveWorkspacePath(workspacePath);
    
    // 如果当前工作区已经是目标工作区，直接返回
    if (this.clientManager.getCurrentWorkspace() === effectiveWorkspacePath) {
      await this.clientManager.getOrCreateClient(effectiveWorkspacePath);
      return effectiveWorkspacePath;
    }
    
    // 初始化工作区
    await this.clientManager.getOrCreateClient(effectiveWorkspacePath);
    return effectiveWorkspacePath;
  }

  /**
   * 获取当前工作区状态
   */
  public getWorkspaceStatus() {
    return {
      currentWorkspace: this.clientManager.getCurrentWorkspace(),
      hasActiveClient: this.clientManager.hasActiveClient(),
      initialized: this.clientManager.hasActiveClient()
    };
  }
}