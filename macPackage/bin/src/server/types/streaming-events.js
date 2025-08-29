/**
 * 标准化的流式事件类型定义
 * 供前后端共同使用，确保数据格式一致性
 */
// 事件工厂函数
export class StreamingEventFactory {
    static createContentEvent(text, isPartial = true) {
        return {
            type: 'content',
            data: { text, isPartial },
            timestamp: new Date().toISOString()
        };
    }
    static createThoughtEvent(subject, description) {
        return {
            type: 'thought',
            data: { subject, description },
            timestamp: new Date().toISOString()
        };
    }
    static createToolCallEvent(callId, name, displayName, description, args, requiresConfirmation = true) {
        return {
            type: 'tool_call',
            data: { callId, name, displayName, description, args, requiresConfirmation },
            timestamp: new Date().toISOString()
        };
    }
    static createToolExecutionEvent(callId, status, message) {
        return {
            type: 'tool_execution',
            data: { callId, status, message },
            timestamp: new Date().toISOString()
        };
    }
    static createToolResultEvent(callId, name, result, displayResult, success, error) {
        return {
            type: 'tool_result',
            data: { callId, name, result, displayResult, success, error },
            timestamp: new Date().toISOString()
        };
    }
    static createToolConfirmationEvent(callId, name, displayName, description, prompt, command, args) {
        return {
            type: 'tool_confirmation',
            data: { callId, name, displayName, description, prompt, command, args },
            timestamp: new Date().toISOString()
        };
    }
    static createCompleteEvent(success, message) {
        return {
            type: 'complete',
            data: { success, message },
            timestamp: new Date().toISOString()
        };
    }
    static createErrorEvent(message, code, details) {
        return {
            type: 'error',
            data: { message, code, details },
            timestamp: new Date().toISOString()
        };
    }
}
// 事件验证函数
export function isValidStreamingEvent(event) {
    return (typeof event === 'object' &&
        event !== null &&
        typeof event.type === 'string' &&
        typeof event.data === 'object' &&
        typeof event.timestamp === 'string');
}
// 事件类型守卫函数
export function isContentEvent(event) {
    return event.type === 'content';
}
export function isThoughtEvent(event) {
    return event.type === 'thought';
}
export function isToolCallEvent(event) {
    return event.type === 'tool_call';
}
export function isToolExecutionEvent(event) {
    return event.type === 'tool_execution';
}
export function isToolResultEvent(event) {
    return event.type === 'tool_result';
}
export function isToolConfirmationEvent(event) {
    return event.type === 'tool_confirmation';
}
export function isCompleteEvent(event) {
    return event.type === 'complete';
}
export function isErrorEvent(event) {
    return event.type === 'error';
}
//# sourceMappingURL=streaming-events.js.map