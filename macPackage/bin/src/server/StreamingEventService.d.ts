/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import express from 'express';
import { CompletedToolCall } from '../core/coreToolScheduler.js';
/**
 * 流式事件服务 - 负责结构化事件的创建和发送
 *
 * 职责：
 * - 结构化事件创建
 * - 流式响应发送
 * - 事件格式化
 * - 响应头设置
 */
export declare class StreamingEventService {
    setupStreamingResponse(res: express.Response): void;
    sendContentEvent(res: express.Response, text: string, isPartial?: boolean): void;
    sendThoughtEvent(res: express.Response, subject: string, description: string): void;
    sendToolCallEvent(res: express.Response, callId: string, name: string, args: any, requiresConfirmation?: boolean): void;
    sendToolConfirmationEvent(res: express.Response, callId: string, name: string, command?: string): void;
    sendToolExecutionEvent(res: express.Response, callId: string, status: 'pending' | 'executing' | 'completed' | 'failed', message: string): void;
    sendToolResultEvent(res: express.Response, completedCall: CompletedToolCall): void;
    sendCompleteEvent(res: express.Response, success?: boolean, message?: string): void;
    sendErrorEvent(res: express.Response, message: string, code?: string, details?: string): void;
    private writeEvent;
    private formatToolResult;
}
