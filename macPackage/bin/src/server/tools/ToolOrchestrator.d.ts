/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Config } from '../../index.js';
import { CompletedToolCall } from '../../core/coreToolScheduler.js';
import { ToolCallRequestInfo } from '../../core/turn.js';
import { ToolConfirmationOutcome } from '../../tools/tools.js';
import express from 'express';
import { StreamingEventService } from '../chat/StreamingEventService.js';
/**
 * 工具协调器 - 负责工具调用的调度和状态管理
 *
 * 职责：
 * - 工具调度管理
 * - 工具确认处理
 * - 工具状态更新
 * - 与前端事件同步
 */
export declare class ToolOrchestrator {
    private streamingEventService;
    private toolScheduler;
    private currentResponse;
    private toolCompletionCallback;
    private sentConfirmationEvents;
    constructor(streamingEventService: StreamingEventService);
    initializeScheduler(config: Config): Promise<void>;
    setToolCompletionCallback(callback: (completedCalls: CompletedToolCall[]) => Promise<void>): void;
    scheduleToolCall(request: ToolCallRequestInfo, abortSignal: AbortSignal, response: express.Response): Promise<void>;
    scheduleToolCalls(requests: ToolCallRequestInfo[], abortSignal: AbortSignal, response: express.Response): Promise<void>;
    handleToolConfirmation(callId: string, outcome: ToolConfirmationOutcome, abortSignal: AbortSignal): Promise<void>;
    clearCurrentResponse(): void;
    cancelAllOperations(): void;
    private handleAllToolCallsComplete;
    private handleToolCallsUpdate;
    private handleOutputUpdate;
}
