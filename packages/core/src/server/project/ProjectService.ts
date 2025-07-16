/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { ResponseFactory } from '../utils/responseFactory.js';
import { ErrorCode } from '../types/error-codes.js';

/**
 * 项目配置服务
 * 负责管理Google Cloud Project ID的配置
 */
export class ProjectService {
  private static projectId: string | null = null;
  private static lastUpdated: number = 0;

  /**
   * 获取项目配置
   */
  public static handleGetConfig(req: express.Request, res: express.Response) {
    try {
      const config = {
        projectId: this.projectId,
        lastUpdated: this.lastUpdated,
        isConfigured: this.projectId !== null
      };

      res.json(ResponseFactory.success(config));
    } catch (error) {
      console.error('Error in handleGetConfig:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json(ResponseFactory.internalError(errorMessage));
    }
  }

  /**
   * 设置项目配置
   */
  public static async handleSetConfig(req: express.Request, res: express.Response) {
    try {
      const { projectId } = req.body;

      if (!projectId || typeof projectId !== 'string') {
        return res.status(400).json(ResponseFactory.validationError('projectId', 'Project ID is required'));
      }

      const trimmedProjectId = projectId.trim();
      if (trimmedProjectId.length === 0) {
        return res.status(400).json(ResponseFactory.validationError('projectId', 'Project ID cannot be empty'));
      }

      // 保存项目ID
      this.projectId = trimmedProjectId;
      this.lastUpdated = Date.now();

      // 设置环境变量
      process.env.GOOGLE_CLOUD_PROJECT = trimmedProjectId;

      console.log('ProjectService: Project ID set to:', trimmedProjectId);

      // 触发服务器重新初始化
      await this.reinitializeServices();

      const response = {
        success: true,
        projectId: trimmedProjectId,
        message: 'Project ID configured successfully'
      };

      res.json(ResponseFactory.success(response));
    } catch (error) {
      console.error('Error in handleSetConfig:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json(ResponseFactory.internalError(errorMessage));
    }
  }

  /**
   * 获取当前项目ID
   */
  public static getCurrentProjectId(): string | null {
    return this.projectId || process.env.GOOGLE_CLOUD_PROJECT || null;
  }

  /**
   * 检查项目是否已配置
   */
  public static isConfigured(): boolean {
    return this.getCurrentProjectId() !== null;
  }

  /**
   * 清除项目配置
   */
  public static clearConfig(): void {
    this.projectId = null;
    this.lastUpdated = 0;
    delete process.env.GOOGLE_CLOUD_PROJECT;
  }

  /**
   * 重新初始化服务
   * 在设置项目ID后，清理现有的GeminiClient让下次请求重新初始化
   */
  private static async reinitializeServices(): Promise<void> {
    try {
      console.log('ProjectService: 开始重新初始化服务...');
      
      // 动态导入以避免循环依赖
      const { configFactory } = await import('../core/ConfigFactory.js');
      
      // 如果ConfigFactory已经初始化，只需要清理GeminiClient
      // 下次chat请求会自动重新初始化（复用现有逻辑）
      if (configFactory.isFactoryInitialized()) {
        console.log('ProjectService: 清理GeminiClient，下次请求会自动重新初始化...');
        
        // 只清理GeminiClient，保留Config和AuthService
        const container = configFactory.getCurrentWorkspaceContainer();
        if (container.geminiClient) {
          container.geminiClient = null;
          console.log('ProjectService: GeminiClient已清理');
        }
      }
      
      console.log('ProjectService: 服务重新初始化完成');
    } catch (error) {
      console.error('ProjectService: 重新初始化服务失败:', error);
      // 不抛出错误，让项目ID设置仍然成功
    }
  }
}