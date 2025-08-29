/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare function cacheGoogleAccount(email: string): Promise<void>;
export declare function getCachedGoogleAccount(): string | null;
export declare function getLifetimeGoogleAccounts(): number;
export declare function clearCachedGoogleAccount(): Promise<void>;
