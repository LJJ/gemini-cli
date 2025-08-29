/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { StreamingEventFactory } from '../types/streaming-events.js';
import type { StreamingEvent } from '../types/streaming-events.js';
import type { CompletedToolCall } from '../../core/coreToolScheduler.js';

/**
 * 流式事件服务 - 负责结构化事件的创建和发送
 * 
 * 职责：
 * - 结构化事件创建
 * - 流式响应发送
 * - 事件格式化
 * - 响应头设置
 * - 心跳保活
 */
export class StreamingEventService {
  private heartBeatIntervals: Map<express.Response, NodeJS.Timeout> = new Map();
  
  public setupStreamingResponse(res: express.Response): void {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // 禁用 Nginx 缓冲
    });
  }

  public sendContentEvent(res: express.Response, text: string, isPartial: boolean = true): void {
    const event = StreamingEventFactory.createContentEvent(text, isPartial);
    this.writeEvent(res, event);
  }

  public sendThoughtEvent(res: express.Response, subject: string, description: string): void {
    const event = StreamingEventFactory.createThoughtEvent(subject, description);
    this.writeEvent(res, event);
  }

  public sendToolCallEvent(
    res: express.Response,
    callId: string,
    name: string,
    args: any,
    requiresConfirmation: boolean = true
  ): void {
    const event = StreamingEventFactory.createToolCallEvent(
      callId,
      name,
      name, // displayName
      `执行工具: ${name}`,
      args,
      requiresConfirmation
    );
    this.writeEvent(res, event);
  }

  public sendToolConfirmationEvent(
    res: express.Response,
    callId: string,
    name: string,
    command?: string,
    args?: Record<string, any>
  ): void {
    const event = StreamingEventFactory.createToolConfirmationEvent(
      callId,
      name,
      name, // displayName
      `需要确认工具调用: ${name}`,
      `是否执行工具调用: ${name}`,
      command || undefined,
      args
    );
    this.writeEvent(res, event);
  }

  public sendToolExecutionEvent(
    res: express.Response,
    callId: string,
    status: 'pending' | 'executing' | 'completed' | 'failed',
    message: string
  ): void {
    const event = StreamingEventFactory.createToolExecutionEvent(callId, status, message);
    this.writeEvent(res, event);
  }

  public sendToolResultEvent(
    res: express.Response,
    completedCall: CompletedToolCall
  ): void {
    const event = StreamingEventFactory.createToolResultEvent(
      completedCall.request.callId,
      completedCall.request.name,
      this.formatToolResult(completedCall),
      this.formatToolResult(completedCall),
      completedCall.status === 'success',
      completedCall.status === 'error' ? completedCall.response?.error?.message : undefined
    );
    this.writeEvent(res, event);
  }

  public sendHeartBeatEvent(res: express.Response): void {
    const event = StreamingEventFactory.createHeartBeatEvent();
    this.writeEvent(res, event);
  }

  public startHeartBeat(res: express.Response): void {
    // 清理已存在的定时器
    this.stopHeartBeat(res);
    
    // 创建新的心跳定时器，每6秒发送一次
    const interval = setInterval(() => {
      this.sendHeartBeatEvent(res);
    }, 6000);
    
    // 存储定时器引用
    this.heartBeatIntervals.set(res, interval);
    
    // 监听响应结束事件，自动清理定时器
    res.on('close', () => {
      this.stopHeartBeat(res);
    });
    
    res.on('finish', () => {
      this.stopHeartBeat(res);
    });
  }

  public stopHeartBeat(res: express.Response): void {
    const interval = this.heartBeatIntervals.get(res);
    if (interval) {
      clearInterval(interval);
      this.heartBeatIntervals.delete(res);
    }
  }

  public sendCompleteEvent(res: express.Response, success: boolean = true, message: string = '对话完成'): void {
    // 停止心跳
    this.stopHeartBeat(res);
    
    // 检查响应是否已经结束
    if (res.writableEnded || res.destroyed) {
      console.warn('响应流已关闭，跳过发送完成事件');
      return;
    }
    
    const event = StreamingEventFactory.createCompleteEvent(success, message);
    this.writeEvent(res, event);
    
    // 安全地结束响应流
    if (!res.writableEnded) {
      res.end();
    }
  }

  public sendErrorEvent(res: express.Response, message: string, code: string, details?: string): void {
    // 停止心跳
    this.stopHeartBeat(res);
    
    // 检查响应是否已经结束
    if (res.writableEnded || res.destroyed) {
      console.warn('响应流已关闭，跳过发送错误事件');
      return;
    }
    
    const event = StreamingEventFactory.createErrorEvent(message, code, details);
    this.writeEvent(res, event);
    
    // 安全地结束响应流
    if (!res.writableEnded) {
      res.end();
    }
  }

  public sendWorkspaceEvent(res: express.Response, workspacePath: string, currentPath: string, description?: string): void {
    const event = StreamingEventFactory.createWorkspaceEvent(workspacePath, currentPath, description);
    this.writeEvent(res, event);
  }

  public sendTokenUsageEvent(res: express.Response, tokenInfo: {
    currentTokenCount: number;
    tokenLimit: number;
    remainingPercentage: number;
    remainingTokens: number;
    model: string;
  }): void {
    console.log('发送token_usage事件:', tokenInfo);
    const event = StreamingEventFactory.createTokenUsageEvent(
      tokenInfo.currentTokenCount,
      tokenInfo.tokenLimit,
      tokenInfo.remainingPercentage,
      tokenInfo.remainingTokens,
      tokenInfo.model
    );
    this.writeEvent(res, event);
  }

  private writeEvent(res: express.Response, event: StreamingEvent): void {
    // 检查响应是否已经结束，避免 ERR_STREAM_WRITE_AFTER_END 错误
    if (res.writableEnded || res.destroyed) {
      console.warn('尝试向已关闭的响应流写入数据，忽略此次写入');
      return;
    }
    
    try {
      const eventJson = JSON.stringify(event) + '\n';
      res.write(eventJson);
    } catch (error) {
      console.error('写入响应流时发生错误:', error);
    }
  }

  private formatToolResult(completedCall: CompletedToolCall): string {
    if (!completedCall.response) {
      return '工具执行失败';
    }
    
    const toolName = completedCall.request.name;
    
    // 根据工具名称格式化输出
    switch (toolName) {
      case 'read_file':
        return '📄 文件内容已读取';
      case 'list_directory':
        return '📁 目录列表已获取';
      case 'write_file':
        return '✏️ 文件已写入';
      case 'execute_command':
        return '⚡ 命令执行完成';
      default:
        return `🔧 ${toolName} 执行完成`;
    }
  }
} 