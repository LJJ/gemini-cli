/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface FilterFilesOptions {
    respectGitIgnore?: boolean;
    respectGeminiIgnore?: boolean;
}
export declare class FileDiscoveryService {
    private gitIgnoreFilter;
    private geminiIgnoreFilter;
    private projectRoot;
    constructor(projectRoot: string);
    /**
     * Filters a list of file paths based on git ignore rules
     */
    filterFiles(filePaths: string[], options?: FilterFilesOptions): string[];
    /**
     * Checks if a single file should be git-ignored
     */
    shouldGitIgnoreFile(filePath: string): boolean;
    /**
     * Checks if a single file should be gemini-ignored
     */
    shouldGeminiIgnoreFile(filePath: string): boolean;
    /**
     * Unified method to check if a file should be ignored based on filtering options
     */
    shouldIgnoreFile(filePath: string, options?: FilterFilesOptions): boolean;
    /**
     * Returns loaded patterns from .geminiignore
     */
    getGeminiIgnorePatterns(): string[];
}
