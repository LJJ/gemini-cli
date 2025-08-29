/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { FileDiscoveryService } from '../services/fileDiscoveryService.js';
/**
 * Loads hierarchical GEMINI.md files and concatenates their content.
 * This function is intended for use by the server.
 */
export declare function loadServerHierarchicalMemory(currentWorkingDirectory: string, debugMode: boolean, fileService: FileDiscoveryService, extensionContextFilePaths?: string[]): Promise<{
    memoryContent: string;
    fileCount: number;
}>;
