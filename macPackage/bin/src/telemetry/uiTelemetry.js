/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'events';
import { EVENT_API_ERROR, EVENT_API_RESPONSE, EVENT_TOOL_CALL, } from './constants.js';
import { ToolCallDecision, } from './types.js';
const createInitialModelMetrics = () => ({
    api: {
        totalRequests: 0,
        totalErrors: 0,
        totalLatencyMs: 0,
    },
    tokens: {
        prompt: 0,
        candidates: 0,
        total: 0,
        cached: 0,
        thoughts: 0,
        tool: 0,
    },
});
const createInitialMetrics = () => ({
    models: {},
    tools: {
        totalCalls: 0,
        totalSuccess: 0,
        totalFail: 0,
        totalDurationMs: 0,
        totalDecisions: {
            [ToolCallDecision.ACCEPT]: 0,
            [ToolCallDecision.REJECT]: 0,
            [ToolCallDecision.MODIFY]: 0,
        },
        byName: {},
    },
});
export class UiTelemetryService extends EventEmitter {
    #metrics = createInitialMetrics();
    #lastPromptTokenCount = 0;
    addEvent(event) {
        switch (event['event.name']) {
            case EVENT_API_RESPONSE:
                this.processApiResponse(event);
                break;
            case EVENT_API_ERROR:
                this.processApiError(event);
                break;
            case EVENT_TOOL_CALL:
                this.processToolCall(event);
                break;
            default:
                // We should not emit update for any other event metric.
                return;
        }
        this.emit('update', {
            metrics: this.#metrics,
            lastPromptTokenCount: this.#lastPromptTokenCount,
        });
    }
    getMetrics() {
        return this.#metrics;
    }
    getLastPromptTokenCount() {
        return this.#lastPromptTokenCount;
    }
    getOrCreateModelMetrics(modelName) {
        if (!this.#metrics.models[modelName]) {
            this.#metrics.models[modelName] = createInitialModelMetrics();
        }
        return this.#metrics.models[modelName];
    }
    processApiResponse(event) {
        const modelMetrics = this.getOrCreateModelMetrics(event.model);
        modelMetrics.api.totalRequests++;
        modelMetrics.api.totalLatencyMs += event.duration_ms;
        modelMetrics.tokens.prompt += event.input_token_count;
        modelMetrics.tokens.candidates += event.output_token_count;
        modelMetrics.tokens.total += event.total_token_count;
        modelMetrics.tokens.cached += event.cached_content_token_count;
        modelMetrics.tokens.thoughts += event.thoughts_token_count;
        modelMetrics.tokens.tool += event.tool_token_count;
        this.#lastPromptTokenCount = event.input_token_count;
    }
    processApiError(event) {
        const modelMetrics = this.getOrCreateModelMetrics(event.model);
        modelMetrics.api.totalRequests++;
        modelMetrics.api.totalErrors++;
        modelMetrics.api.totalLatencyMs += event.duration_ms;
    }
    processToolCall(event) {
        const { tools } = this.#metrics;
        tools.totalCalls++;
        tools.totalDurationMs += event.duration_ms;
        if (event.success) {
            tools.totalSuccess++;
        }
        else {
            tools.totalFail++;
        }
        if (!tools.byName[event.function_name]) {
            tools.byName[event.function_name] = {
                count: 0,
                success: 0,
                fail: 0,
                durationMs: 0,
                decisions: {
                    [ToolCallDecision.ACCEPT]: 0,
                    [ToolCallDecision.REJECT]: 0,
                    [ToolCallDecision.MODIFY]: 0,
                },
            };
        }
        const toolStats = tools.byName[event.function_name];
        toolStats.count++;
        toolStats.durationMs += event.duration_ms;
        if (event.success) {
            toolStats.success++;
        }
        else {
            toolStats.fail++;
        }
        if (event.decision) {
            tools.totalDecisions[event.decision]++;
            toolStats.decisions[event.decision]++;
        }
    }
}
export const uiTelemetryService = new UiTelemetryService();
//# sourceMappingURL=uiTelemetry.js.map