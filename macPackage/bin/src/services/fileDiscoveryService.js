/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { GitIgnoreParser } from '../utils/gitIgnoreParser.js';
import { isGitRepository } from '../utils/gitUtils.js';
import * as path from 'path';
const GEMINI_IGNORE_FILE_NAME = '.geminiignore';
export class FileDiscoveryService {
    gitIgnoreFilter = null;
    geminiIgnoreFilter = null;
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = path.resolve(projectRoot);
        if (isGitRepository(this.projectRoot)) {
            const parser = new GitIgnoreParser(this.projectRoot);
            try {
                parser.loadGitRepoPatterns();
            }
            catch (_error) {
                // ignore file not found
            }
            this.gitIgnoreFilter = parser;
        }
        const gParser = new GitIgnoreParser(this.projectRoot);
        try {
            gParser.loadPatterns(GEMINI_IGNORE_FILE_NAME);
        }
        catch (_error) {
            // ignore file not found
        }
        this.geminiIgnoreFilter = gParser;
    }
    /**
     * Filters a list of file paths based on git ignore rules
     */
    filterFiles(filePaths, options = {
        respectGitIgnore: true,
        respectGeminiIgnore: true,
    }) {
        return filePaths.filter((filePath) => {
            if (options.respectGitIgnore && this.shouldGitIgnoreFile(filePath)) {
                return false;
            }
            if (options.respectGeminiIgnore &&
                this.shouldGeminiIgnoreFile(filePath)) {
                return false;
            }
            return true;
        });
    }
    /**
     * Checks if a single file should be git-ignored
     */
    shouldGitIgnoreFile(filePath) {
        if (this.gitIgnoreFilter) {
            return this.gitIgnoreFilter.isIgnored(filePath);
        }
        return false;
    }
    /**
     * Checks if a single file should be gemini-ignored
     */
    shouldGeminiIgnoreFile(filePath) {
        if (this.geminiIgnoreFilter) {
            return this.geminiIgnoreFilter.isIgnored(filePath);
        }
        return false;
    }
    /**
     * Unified method to check if a file should be ignored based on filtering options
     */
    shouldIgnoreFile(filePath, options = {}) {
        const { respectGitIgnore = true, respectGeminiIgnore = true } = options;
        if (respectGitIgnore && this.shouldGitIgnoreFile(filePath)) {
            return true;
        }
        if (respectGeminiIgnore && this.shouldGeminiIgnoreFile(filePath)) {
            return true;
        }
        return false;
    }
    /**
     * Returns loaded patterns from .geminiignore
     */
    getGeminiIgnorePatterns() {
        return this.geminiIgnoreFilter?.getPatterns() ?? [];
    }
}
//# sourceMappingURL=fileDiscoveryService.js.map