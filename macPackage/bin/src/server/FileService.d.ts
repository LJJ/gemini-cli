/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import express from 'express';
export declare class FileService {
    listDirectory(req: express.Request, res: express.Response): Promise<void>;
    readFile(req: express.Request, res: express.Response): Promise<express.Response<any, Record<string, any>> | undefined>;
    writeFile(req: express.Request, res: express.Response): Promise<express.Response<any, Record<string, any>> | undefined>;
}
