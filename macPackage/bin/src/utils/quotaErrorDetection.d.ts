/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface ApiError {
    error: {
        code: number;
        message: string;
        status: string;
        details: unknown[];
    };
}
interface StructuredError {
    message: string;
    status?: number;
}
export declare function isApiError(error: unknown): error is ApiError;
export declare function isStructuredError(error: unknown): error is StructuredError;
export declare function isProQuotaExceededError(error: unknown): boolean;
export declare function isGenericQuotaExceededError(error: unknown): boolean;
export {};
