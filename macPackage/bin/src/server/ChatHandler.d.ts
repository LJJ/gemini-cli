/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import express from 'express';
import { StreamingEventService } from './StreamingEventService.js';
import { ToolOrchestrator } from './ToolOrchestrator.js';
import { ClientManager } from './ClientManager.js';
/**
 * 聊天处理器 - 负责聊天消息的处理和流式响应
 *
 * 职责：
 * - 聊天消息处理
 * - 流式响应管理
 * - 事件分发
 * - Turn 生命周期管理
 */
export declare class ChatHandler {
    private clientManager;
    private streamingEventService;
    private toolOrchestrator;
    private currentTurn;
    private abortController;
    constructor(clientManager: ClientManager, streamingEventService: StreamingEventService, toolOrchestrator: ToolOrchestrator);
    handleStreamingChat(message: string, filePaths: string[] | undefined, res: express.Response): Promise<void>;
    private processStreamEvents;
    private handleToolCallRequest;
    private buildFullMessage;
}
