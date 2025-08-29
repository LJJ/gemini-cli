/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import express from 'express';
export declare class CommandService {
    executeCommand(req: express.Request, res: express.Response): Promise<express.Response<any, Record<string, any>> | undefined>;
}
