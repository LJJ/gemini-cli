/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Meter } from '@opentelemetry/api';
import { Config } from '../config/config.js';
export declare enum FileOperation {
    CREATE = "create",
    READ = "read",
    UPDATE = "update"
}
export declare function getMeter(): Meter | undefined;
export declare function initializeMetrics(config: Config): void;
export declare function recordToolCallMetrics(config: Config, functionName: string, durationMs: number, success: boolean, decision?: 'accept' | 'reject' | 'modify'): void;
export declare function recordTokenUsageMetrics(config: Config, model: string, tokenCount: number, type: 'input' | 'output' | 'thought' | 'cache' | 'tool'): void;
export declare function recordApiResponseMetrics(config: Config, model: string, durationMs: number, statusCode?: number | string, error?: string): void;
export declare function recordApiErrorMetrics(config: Config, model: string, durationMs: number, statusCode?: number | string, errorType?: string): void;
export declare function recordFileOperationMetric(config: Config, operation: FileOperation, lines?: number, mimetype?: string, extension?: string): void;
