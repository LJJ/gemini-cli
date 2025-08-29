/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileOperation } from './metrics.js';
const mockCounterAddFn = vi.fn();
const mockHistogramRecordFn = vi.fn();
const mockCreateCounterFn = vi.fn();
const mockCreateHistogramFn = vi.fn();
const mockCounterInstance = {
    add: mockCounterAddFn,
};
const mockHistogramInstance = {
    record: mockHistogramRecordFn,
};
const mockMeterInstance = {
    createCounter: mockCreateCounterFn.mockReturnValue(mockCounterInstance),
    createHistogram: mockCreateHistogramFn.mockReturnValue(mockHistogramInstance),
};
function originalOtelMockFactory() {
    return {
        metrics: {
            getMeter: vi.fn(),
        },
        ValueType: {
            INT: 1,
        },
    };
}
vi.mock('@opentelemetry/api', originalOtelMockFactory);
describe('Telemetry Metrics', () => {
    let initializeMetricsModule;
    let recordTokenUsageMetricsModule;
    let recordFileOperationMetricModule;
    beforeEach(async () => {
        vi.resetModules();
        vi.doMock('@opentelemetry/api', () => {
            const actualApi = originalOtelMockFactory();
            actualApi.metrics.getMeter.mockReturnValue(mockMeterInstance);
            return actualApi;
        });
        const metricsJsModule = await import('./metrics.js');
        initializeMetricsModule = metricsJsModule.initializeMetrics;
        recordTokenUsageMetricsModule = metricsJsModule.recordTokenUsageMetrics;
        recordFileOperationMetricModule = metricsJsModule.recordFileOperationMetric;
        const otelApiModule = await import('@opentelemetry/api');
        mockCounterAddFn.mockClear();
        mockCreateCounterFn.mockClear();
        mockCreateHistogramFn.mockClear();
        mockHistogramRecordFn.mockClear();
        otelApiModule.metrics.getMeter.mockClear();
        otelApiModule.metrics.getMeter.mockReturnValue(mockMeterInstance);
        mockCreateCounterFn.mockReturnValue(mockCounterInstance);
        mockCreateHistogramFn.mockReturnValue(mockHistogramInstance);
    });
    describe('recordTokenUsageMetrics', () => {
        const mockConfig = {
            getSessionId: () => 'test-session-id',
        };
        it('should not record metrics if not initialized', () => {
            recordTokenUsageMetricsModule(mockConfig, 'gemini-pro', 100, 'input');
            expect(mockCounterAddFn).not.toHaveBeenCalled();
        });
        it('should record token usage with the correct attributes', () => {
            initializeMetricsModule(mockConfig);
            recordTokenUsageMetricsModule(mockConfig, 'gemini-pro', 100, 'input');
            expect(mockCounterAddFn).toHaveBeenCalledTimes(2);
            expect(mockCounterAddFn).toHaveBeenNthCalledWith(1, 1, {
                'session.id': 'test-session-id',
            });
            expect(mockCounterAddFn).toHaveBeenNthCalledWith(2, 100, {
                'session.id': 'test-session-id',
                model: 'gemini-pro',
                type: 'input',
            });
        });
        it('should record token usage for different types', () => {
            initializeMetricsModule(mockConfig);
            mockCounterAddFn.mockClear();
            recordTokenUsageMetricsModule(mockConfig, 'gemini-pro', 50, 'output');
            expect(mockCounterAddFn).toHaveBeenCalledWith(50, {
                'session.id': 'test-session-id',
                model: 'gemini-pro',
                type: 'output',
            });
            recordTokenUsageMetricsModule(mockConfig, 'gemini-pro', 25, 'thought');
            expect(mockCounterAddFn).toHaveBeenCalledWith(25, {
                'session.id': 'test-session-id',
                model: 'gemini-pro',
                type: 'thought',
            });
            recordTokenUsageMetricsModule(mockConfig, 'gemini-pro', 75, 'cache');
            expect(mockCounterAddFn).toHaveBeenCalledWith(75, {
                'session.id': 'test-session-id',
                model: 'gemini-pro',
                type: 'cache',
            });
            recordTokenUsageMetricsModule(mockConfig, 'gemini-pro', 125, 'tool');
            expect(mockCounterAddFn).toHaveBeenCalledWith(125, {
                'session.id': 'test-session-id',
                model: 'gemini-pro',
                type: 'tool',
            });
        });
        it('should handle different models', () => {
            initializeMetricsModule(mockConfig);
            mockCounterAddFn.mockClear();
            recordTokenUsageMetricsModule(mockConfig, 'gemini-ultra', 200, 'input');
            expect(mockCounterAddFn).toHaveBeenCalledWith(200, {
                'session.id': 'test-session-id',
                model: 'gemini-ultra',
                type: 'input',
            });
        });
    });
    describe('recordFileOperationMetric', () => {
        const mockConfig = {
            getSessionId: () => 'test-session-id',
        };
        it('should not record metrics if not initialized', () => {
            recordFileOperationMetricModule(mockConfig, FileOperation.CREATE, 10, 'text/plain', 'txt');
            expect(mockCounterAddFn).not.toHaveBeenCalled();
        });
        it('should record file creation with all attributes', () => {
            initializeMetricsModule(mockConfig);
            recordFileOperationMetricModule(mockConfig, FileOperation.CREATE, 10, 'text/plain', 'txt');
            expect(mockCounterAddFn).toHaveBeenCalledTimes(2);
            expect(mockCounterAddFn).toHaveBeenNthCalledWith(1, 1, {
                'session.id': 'test-session-id',
            });
            expect(mockCounterAddFn).toHaveBeenNthCalledWith(2, 1, {
                'session.id': 'test-session-id',
                operation: FileOperation.CREATE,
                lines: 10,
                mimetype: 'text/plain',
                extension: 'txt',
            });
        });
        it('should record file read with minimal attributes', () => {
            initializeMetricsModule(mockConfig);
            mockCounterAddFn.mockClear();
            recordFileOperationMetricModule(mockConfig, FileOperation.READ);
            expect(mockCounterAddFn).toHaveBeenCalledWith(1, {
                'session.id': 'test-session-id',
                operation: FileOperation.READ,
            });
        });
        it('should record file update with some attributes', () => {
            initializeMetricsModule(mockConfig);
            mockCounterAddFn.mockClear();
            recordFileOperationMetricModule(mockConfig, FileOperation.UPDATE, undefined, 'application/javascript');
            expect(mockCounterAddFn).toHaveBeenCalledWith(1, {
                'session.id': 'test-session-id',
                operation: FileOperation.UPDATE,
                mimetype: 'application/javascript',
            });
        });
    });
});
//# sourceMappingURL=metrics.test.js.map