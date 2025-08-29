/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import express from 'express';
import { StreamingEventService } from './StreamingEventService.js';
import { ToolOrchestrator } from '../tools/ToolOrchestrator.js';
import { ClientManager } from '../core/ClientManager.js';
/**
 * 聊天处理器 - 负责聊天消息的处理和流式响应（优化版）
 *
 * 职责：
 * - 聊天消息处理
 * - 流式响应管理
 * - 事件分发
 * - Turn 生命周期管理
 * - 工具调用结果处理
 *
 * 优化后的特性：
 * - 使用ConfigFactory获取client和config
 * - 适应新的工作区管理模式
 */
export declare class ChatHandler {
    private clientManager;
    private streamingEventService;
    private toolOrchestrator;
    private currentTurn;
    private abortController;
    private pendingToolCalls;
    private completedToolCalls;
    private waitingForToolCompletion;
    constructor(clientManager: ClientManager, streamingEventService: StreamingEventService, toolOrchestrator: ToolOrchestrator);
    cancelCurrentChat(): void;
    handleStreamingChat(message: string, filePaths: string[] | undefined, res: express.Response): Promise<void>;
    private processConversationWithTools;
    private processToolCallResults;
    private processStreamEvents;
    private handleBatchToolCallRequests;
    private handleToolCallsComplete;
    private waitForToolCompletion;
    private processToolResults;
    private resetState;
    private buildFullMessage;
}
