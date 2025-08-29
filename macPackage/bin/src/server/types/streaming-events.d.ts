/**
 * 标准化的流式事件类型定义
 * 供前后端共同使用，确保数据格式一致性
 */
export interface StreamingEvent {
    type: EventType;
    data: EventData;
    timestamp: string;
}
export type EventType = 'content' | 'thought' | 'tool_call' | 'tool_execution' | 'tool_result' | 'tool_confirmation' | 'complete' | 'error';
export type EventData = ContentEventData | ThoughtEventData | ToolCallEventData | ToolExecutionEventData | ToolResultEventData | ToolConfirmationEventData | CompleteEventData | ErrorEventData;
export interface ContentEventData {
    text: string;
    isPartial: boolean;
}
export interface ThoughtEventData {
    subject: string;
    description: string;
}
export interface ToolCallEventData {
    callId: string;
    name: string;
    displayName: string;
    description: string;
    args: Record<string, any>;
    requiresConfirmation: boolean;
}
export interface ToolExecutionEventData {
    callId: string;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    message: string;
}
export interface ToolResultEventData {
    callId: string;
    name: string;
    result: string;
    displayResult: string;
    success: boolean;
    error?: string;
}
export interface ToolConfirmationEventData {
    callId: string;
    name: string;
    displayName: string;
    description: string;
    prompt: string;
    command?: string;
    args?: Record<string, any>;
}
export interface CompleteEventData {
    success: boolean;
    message?: string;
}
export interface ErrorEventData {
    message: string;
    code: string;
    details?: string;
}
export declare class StreamingEventFactory {
    static createContentEvent(text: string, isPartial?: boolean): StreamingEvent;
    static createThoughtEvent(subject: string, description: string): StreamingEvent;
    static createToolCallEvent(callId: string, name: string, displayName: string, description: string, args: Record<string, any>, requiresConfirmation?: boolean): StreamingEvent;
    static createToolExecutionEvent(callId: string, status: ToolExecutionEventData['status'], message: string): StreamingEvent;
    static createToolResultEvent(callId: string, name: string, result: string, displayResult: string, success: boolean, error?: string): StreamingEvent;
    static createToolConfirmationEvent(callId: string, name: string, displayName: string, description: string, prompt: string, command?: string, args?: Record<string, any>): StreamingEvent;
    static createCompleteEvent(success: boolean, message?: string): StreamingEvent;
    static createErrorEvent(message: string, code: string, details?: string): StreamingEvent;
}
export declare function isValidStreamingEvent(event: any): event is StreamingEvent;
export declare function isContentEvent(event: StreamingEvent): event is StreamingEvent & {
    data: ContentEventData;
};
export declare function isThoughtEvent(event: StreamingEvent): event is StreamingEvent & {
    data: ThoughtEventData;
};
export declare function isToolCallEvent(event: StreamingEvent): event is StreamingEvent & {
    data: ToolCallEventData;
};
export declare function isToolExecutionEvent(event: StreamingEvent): event is StreamingEvent & {
    data: ToolExecutionEventData;
};
export declare function isToolResultEvent(event: StreamingEvent): event is StreamingEvent & {
    data: ToolResultEventData;
};
export declare function isToolConfirmationEvent(event: StreamingEvent): event is StreamingEvent & {
    data: ToolConfirmationEventData;
};
export declare function isCompleteEvent(event: StreamingEvent): event is StreamingEvent & {
    data: CompleteEventData;
};
export declare function isErrorEvent(event: StreamingEvent): event is StreamingEvent & {
    data: ErrorEventData;
};
