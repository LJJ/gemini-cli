/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { StreamingEventFactory } from '../types/streaming-events.js';
/**
 * 流式事件服务 - 负责结构化事件的创建和发送
 *
 * 职责：
 * - 结构化事件创建
 * - 流式响应发送
 * - 事件格式化
 * - 响应头设置
 */
export class StreamingEventService {
    setupStreamingResponse(res) {
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
    sendContentEvent(res, text, isPartial = true) {
        const event = StreamingEventFactory.createContentEvent(text, isPartial);
        this.writeEvent(res, event);
    }
    sendThoughtEvent(res, subject, description) {
        const event = StreamingEventFactory.createThoughtEvent(subject, description);
        this.writeEvent(res, event);
    }
    sendToolCallEvent(res, callId, name, args, requiresConfirmation = true) {
        const event = StreamingEventFactory.createToolCallEvent(callId, name, name, // displayName
        `执行工具: ${name}`, args, requiresConfirmation);
        this.writeEvent(res, event);
    }
    sendToolConfirmationEvent(res, callId, name, command, args) {
        const event = StreamingEventFactory.createToolConfirmationEvent(callId, name, name, // displayName
        `需要确认工具调用: ${name}`, `是否执行工具调用: ${name}`, command || undefined, args);
        this.writeEvent(res, event);
    }
    sendToolExecutionEvent(res, callId, status, message) {
        const event = StreamingEventFactory.createToolExecutionEvent(callId, status, message);
        this.writeEvent(res, event);
    }
    sendToolResultEvent(res, completedCall) {
        const event = StreamingEventFactory.createToolResultEvent(completedCall.request.callId, completedCall.request.name, this.formatToolResult(completedCall), this.formatToolResult(completedCall), completedCall.status === 'success', completedCall.status === 'error' ? completedCall.response?.error?.message : undefined);
        this.writeEvent(res, event);
    }
    sendCompleteEvent(res, success = true, message = '对话完成') {
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
    sendErrorEvent(res, message, code, details) {
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
    writeEvent(res, event) {
        // 检查响应是否已经结束，避免 ERR_STREAM_WRITE_AFTER_END 错误
        if (res.writableEnded || res.destroyed) {
            console.warn('尝试向已关闭的响应流写入数据，忽略此次写入');
            return;
        }
        try {
            const eventJson = JSON.stringify(event) + '\n';
            res.write(eventJson);
        }
        catch (error) {
            console.error('写入响应流时发生错误:', error);
        }
    }
    formatToolResult(completedCall) {
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
//# sourceMappingURL=StreamingEventService.js.map