/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ToolCallRequestInfo, ToolCallResponseInfo, ToolConfirmationOutcome, Tool, ToolCallConfirmationDetails, ToolRegistry, ApprovalMode, EditorType, Config, ToolConfirmationPayload } from '../index.js';
import { PartListUnion } from '@google/genai';
export type ValidatingToolCall = {
    status: 'validating';
    request: ToolCallRequestInfo;
    tool: Tool;
    startTime?: number;
    outcome?: ToolConfirmationOutcome;
};
export type ScheduledToolCall = {
    status: 'scheduled';
    request: ToolCallRequestInfo;
    tool: Tool;
    startTime?: number;
    outcome?: ToolConfirmationOutcome;
};
export type ErroredToolCall = {
    status: 'error';
    request: ToolCallRequestInfo;
    response: ToolCallResponseInfo;
    durationMs?: number;
    outcome?: ToolConfirmationOutcome;
};
export type SuccessfulToolCall = {
    status: 'success';
    request: ToolCallRequestInfo;
    tool: Tool;
    response: ToolCallResponseInfo;
    durationMs?: number;
    outcome?: ToolConfirmationOutcome;
};
export type ExecutingToolCall = {
    status: 'executing';
    request: ToolCallRequestInfo;
    tool: Tool;
    liveOutput?: string;
    startTime?: number;
    outcome?: ToolConfirmationOutcome;
};
export type CancelledToolCall = {
    status: 'cancelled';
    request: ToolCallRequestInfo;
    response: ToolCallResponseInfo;
    tool: Tool;
    durationMs?: number;
    outcome?: ToolConfirmationOutcome;
};
export type WaitingToolCall = {
    status: 'awaiting_approval';
    request: ToolCallRequestInfo;
    tool: Tool;
    confirmationDetails: ToolCallConfirmationDetails;
    startTime?: number;
    outcome?: ToolConfirmationOutcome;
};
export type Status = ToolCall['status'];
export type ToolCall = ValidatingToolCall | ScheduledToolCall | ErroredToolCall | SuccessfulToolCall | ExecutingToolCall | CancelledToolCall | WaitingToolCall;
export type CompletedToolCall = SuccessfulToolCall | CancelledToolCall | ErroredToolCall;
export type ConfirmHandler = (toolCall: WaitingToolCall) => Promise<ToolConfirmationOutcome>;
export type OutputUpdateHandler = (toolCallId: string, outputChunk: string) => void;
export type AllToolCallsCompleteHandler = (completedToolCalls: CompletedToolCall[]) => void;
export type ToolCallsUpdateHandler = (toolCalls: ToolCall[]) => void;
export declare function convertToFunctionResponse(toolName: string, callId: string, llmContent: PartListUnion): PartListUnion;
interface CoreToolSchedulerOptions {
    toolRegistry: Promise<ToolRegistry>;
    outputUpdateHandler?: OutputUpdateHandler;
    onAllToolCallsComplete?: AllToolCallsCompleteHandler;
    onToolCallsUpdate?: ToolCallsUpdateHandler;
    approvalMode?: ApprovalMode;
    getPreferredEditor: () => EditorType | undefined;
    config: Config;
}
export declare class CoreToolScheduler {
    private toolRegistry;
    private toolCalls;
    private outputUpdateHandler?;
    private onAllToolCallsComplete?;
    private onToolCallsUpdate?;
    private approvalMode;
    private getPreferredEditor;
    private config;
    constructor(options: CoreToolSchedulerOptions);
    private setStatusInternal;
    private setArgsInternal;
    private isRunning;
    schedule(request: ToolCallRequestInfo | ToolCallRequestInfo[], signal: AbortSignal): Promise<void>;
    handleConfirmationResponse(callId: string, originalOnConfirm: (outcome: ToolConfirmationOutcome) => Promise<void>, outcome: ToolConfirmationOutcome, signal: AbortSignal, payload?: ToolConfirmationPayload): Promise<void>;
    /**
     * Applies user-provided content changes to a tool call that is awaiting confirmation.
     * This method updates the tool's arguments and refreshes the confirmation prompt with a new diff
     * before the tool is scheduled for execution.
     * @private
     */
    private _applyInlineModify;
    private attemptExecutionOfScheduledCalls;
    private checkAndNotifyCompletion;
    private notifyToolCallsUpdate;
}
export {};
