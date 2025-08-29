/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { metrics, ValueType, } from '@opentelemetry/api';
import { SERVICE_NAME, METRIC_TOOL_CALL_COUNT, METRIC_TOOL_CALL_LATENCY, METRIC_API_REQUEST_COUNT, METRIC_API_REQUEST_LATENCY, METRIC_TOKEN_USAGE, METRIC_SESSION_COUNT, METRIC_FILE_OPERATION_COUNT, } from './constants.js';
export var FileOperation;
(function (FileOperation) {
    FileOperation["CREATE"] = "create";
    FileOperation["READ"] = "read";
    FileOperation["UPDATE"] = "update";
})(FileOperation || (FileOperation = {}));
let cliMeter;
let toolCallCounter;
let toolCallLatencyHistogram;
let apiRequestCounter;
let apiRequestLatencyHistogram;
let tokenUsageCounter;
let fileOperationCounter;
let isMetricsInitialized = false;
function getCommonAttributes(config) {
    return {
        'session.id': config.getSessionId(),
    };
}
export function getMeter() {
    if (!cliMeter) {
        cliMeter = metrics.getMeter(SERVICE_NAME);
    }
    return cliMeter;
}
export function initializeMetrics(config) {
    if (isMetricsInitialized)
        return;
    const meter = getMeter();
    if (!meter)
        return;
    toolCallCounter = meter.createCounter(METRIC_TOOL_CALL_COUNT, {
        description: 'Counts tool calls, tagged by function name and success.',
        valueType: ValueType.INT,
    });
    toolCallLatencyHistogram = meter.createHistogram(METRIC_TOOL_CALL_LATENCY, {
        description: 'Latency of tool calls in milliseconds.',
        unit: 'ms',
        valueType: ValueType.INT,
    });
    apiRequestCounter = meter.createCounter(METRIC_API_REQUEST_COUNT, {
        description: 'Counts API requests, tagged by model and status.',
        valueType: ValueType.INT,
    });
    apiRequestLatencyHistogram = meter.createHistogram(METRIC_API_REQUEST_LATENCY, {
        description: 'Latency of API requests in milliseconds.',
        unit: 'ms',
        valueType: ValueType.INT,
    });
    tokenUsageCounter = meter.createCounter(METRIC_TOKEN_USAGE, {
        description: 'Counts the total number of tokens used.',
        valueType: ValueType.INT,
    });
    fileOperationCounter = meter.createCounter(METRIC_FILE_OPERATION_COUNT, {
        description: 'Counts file operations (create, read, update).',
        valueType: ValueType.INT,
    });
    const sessionCounter = meter.createCounter(METRIC_SESSION_COUNT, {
        description: 'Count of CLI sessions started.',
        valueType: ValueType.INT,
    });
    sessionCounter.add(1, getCommonAttributes(config));
    isMetricsInitialized = true;
}
export function recordToolCallMetrics(config, functionName, durationMs, success, decision) {
    if (!toolCallCounter || !toolCallLatencyHistogram || !isMetricsInitialized)
        return;
    const metricAttributes = {
        ...getCommonAttributes(config),
        function_name: functionName,
        success,
        decision,
    };
    toolCallCounter.add(1, metricAttributes);
    toolCallLatencyHistogram.record(durationMs, {
        ...getCommonAttributes(config),
        function_name: functionName,
    });
}
export function recordTokenUsageMetrics(config, model, tokenCount, type) {
    if (!tokenUsageCounter || !isMetricsInitialized)
        return;
    tokenUsageCounter.add(tokenCount, {
        ...getCommonAttributes(config),
        model,
        type,
    });
}
export function recordApiResponseMetrics(config, model, durationMs, statusCode, error) {
    if (!apiRequestCounter ||
        !apiRequestLatencyHistogram ||
        !isMetricsInitialized)
        return;
    const metricAttributes = {
        ...getCommonAttributes(config),
        model,
        status_code: statusCode ?? (error ? 'error' : 'ok'),
    };
    apiRequestCounter.add(1, metricAttributes);
    apiRequestLatencyHistogram.record(durationMs, {
        ...getCommonAttributes(config),
        model,
    });
}
export function recordApiErrorMetrics(config, model, durationMs, statusCode, errorType) {
    if (!apiRequestCounter ||
        !apiRequestLatencyHistogram ||
        !isMetricsInitialized)
        return;
    const metricAttributes = {
        ...getCommonAttributes(config),
        model,
        status_code: statusCode ?? 'error',
        error_type: errorType ?? 'unknown',
    };
    apiRequestCounter.add(1, metricAttributes);
    apiRequestLatencyHistogram.record(durationMs, {
        ...getCommonAttributes(config),
        model,
    });
}
export function recordFileOperationMetric(config, operation, lines, mimetype, extension) {
    if (!fileOperationCounter || !isMetricsInitialized)
        return;
    const attributes = {
        ...getCommonAttributes(config),
        operation,
    };
    if (lines !== undefined)
        attributes.lines = lines;
    if (mimetype !== undefined)
        attributes.mimetype = mimetype;
    if (extension !== undefined)
        attributes.extension = extension;
    fileOperationCounter.add(1, attributes);
}
//# sourceMappingURL=metrics.js.map