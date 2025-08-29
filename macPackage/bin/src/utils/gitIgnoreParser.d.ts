/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface GitIgnoreFilter {
    isIgnored(filePath: string): boolean;
    getPatterns(): string[];
}
export declare class GitIgnoreParser implements GitIgnoreFilter {
    private projectRoot;
    private ig;
    private patterns;
    constructor(projectRoot: string);
    loadGitRepoPatterns(): void;
    loadPatterns(patternsFileName: string): void;
    private addPatterns;
    isIgnored(filePath: string): boolean;
    getPatterns(): string[];
}
