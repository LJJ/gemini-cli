/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { PartListUnion, GenerateContentResponse, FunctionDeclaration } from '@google/genai';
import { ToolCallConfirmationDetails, ToolResult, ToolResultDisplay } from '../tools/tools.js';
import { GeminiChat } from './geminiChat.js';
export interface ServerTool {
    name: string;
    schema: FunctionDeclaration;
    execute(params: Record<string, unknown>, signal?: AbortSignal): Promise<ToolResult>;
    shouldConfirmExecute(params: Record<string, unknown>, abortSignal: AbortSignal): Promise<ToolCallConfirmationDetails | false>;
}
export declare enum GeminiEventType {
    Content = "content",
    ToolCallRequest = "tool_call_request",
    ToolCallResponse = "tool_call_response",
    ToolCallConfirmation = "tool_call_confirmation",
    UserCancelled = "user_cancelled",
    Error = "error",
    ChatCompressed = "chat_compressed",
    Thought = "thought",
    MaxSessionTurns = "max_session_turns"
}
export interface StructuredError {
    message: string;
    status?: number;
}
export interface GeminiErrorEventValue {
    error: StructuredError;
}
export interface ToolCallRequestInfo {
    callId: string;
    name: string;
    args: Record<string, unknown>;
    isClientInitiated: boolean;
    prompt_id: string;
}
export interface ToolCallResponseInfo {
    callId: string;
    responseParts: PartListUnion;
    resultDisplay: ToolResultDisplay | undefined;
    error: Error | undefined;
}
export interface ServerToolCallConfirmationDetails {
    request: ToolCallRequestInfo;
    details: ToolCallConfirmationDetails;
}
export type ThoughtSummary = {
    subject: string;
    description: string;
};
export type ServerGeminiContentEvent = {
    type: GeminiEventType.Content;
    value: string;
};
export type ServerGeminiThoughtEvent = {
    type: GeminiEventType.Thought;
    value: ThoughtSummary;
};
export type ServerGeminiToolCallRequestEvent = {
    type: GeminiEventType.ToolCallRequest;
    value: ToolCallRequestInfo;
};
export type ServerGeminiToolCallResponseEvent = {
    type: GeminiEventType.ToolCallResponse;
    value: ToolCallResponseInfo;
};
export type ServerGeminiToolCallConfirmationEvent = {
    type: GeminiEventType.ToolCallConfirmation;
    value: ServerToolCallConfirmationDetails;
};
export type ServerGeminiUserCancelledEvent = {
    type: GeminiEventType.UserCancelled;
};
export type ServerGeminiErrorEvent = {
    type: GeminiEventType.Error;
    value: GeminiErrorEventValue;
};
export interface ChatCompressionInfo {
    originalTokenCount: number;
    newTokenCount: number;
}
export type ServerGeminiChatCompressedEvent = {
    type: GeminiEventType.ChatCompressed;
    value: ChatCompressionInfo | null;
};
export type ServerGeminiMaxSessionTurnsEvent = {
    type: GeminiEventType.MaxSessionTurns;
};
export type ServerGeminiStreamEvent = ServerGeminiContentEvent | ServerGeminiToolCallRequestEvent | ServerGeminiToolCallResponseEvent | ServerGeminiToolCallConfirmationEvent | ServerGeminiUserCancelledEvent | ServerGeminiErrorEvent | ServerGeminiChatCompressedEvent | ServerGeminiThoughtEvent | ServerGeminiMaxSessionTurnsEvent;
export declare class Turn {
    private readonly chat;
    private readonly prompt_id;
    readonly pendingToolCalls: ToolCallRequestInfo[];
    private debugResponses;
    constructor(chat: GeminiChat, prompt_id: string);
    run(req: PartListUnion, signal: AbortSignal): AsyncGenerator<ServerGeminiStreamEvent>;
    private handlePendingFunctionCall;
    getDebugResponses(): GenerateContentResponse[];
}
