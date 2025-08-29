/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import express from 'express';
export declare class ServerConfig {
    private app;
    private port;
    constructor(port?: number);
    private setupMiddleware;
    getApp(): express.Application;
    getPort(): number;
    addErrorHandler(): void;
}
