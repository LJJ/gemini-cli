/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare function isNodeError(error: unknown): error is NodeJS.ErrnoException;
export declare function getErrorMessage(error: unknown): string;
export declare class ForbiddenError extends Error {
}
export declare class UnauthorizedError extends Error {
}
export declare class BadRequestError extends Error {
}
export declare function toFriendlyError(error: unknown): unknown;
