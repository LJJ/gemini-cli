/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';
import { isGitRepository } from './gitUtils.js';
export class GitIgnoreParser {
    projectRoot;
    ig = ignore();
    patterns = [];
    constructor(projectRoot) {
        this.projectRoot = path.resolve(projectRoot);
    }
    loadGitRepoPatterns() {
        if (!isGitRepository(this.projectRoot))
            return;
        // Always ignore .git directory regardless of .gitignore content
        this.addPatterns(['.git']);
        const patternFiles = ['.gitignore', path.join('.git', 'info', 'exclude')];
        for (const pf of patternFiles) {
            this.loadPatterns(pf);
        }
    }
    loadPatterns(patternsFileName) {
        const patternsFilePath = path.join(this.projectRoot, patternsFileName);
        let content;
        try {
            content = fs.readFileSync(patternsFilePath, 'utf-8');
        }
        catch (_error) {
            // ignore file not found
            return;
        }
        const patterns = (content ?? '')
            .split('\n')
            .map((p) => p.trim())
            .filter((p) => p !== '' && !p.startsWith('#'));
        this.addPatterns(patterns);
    }
    addPatterns(patterns) {
        this.ig.add(patterns);
        this.patterns.push(...patterns);
    }
    isIgnored(filePath) {
        const relativePath = path.isAbsolute(filePath)
            ? path.relative(this.projectRoot, filePath)
            : filePath;
        if (relativePath === '' || relativePath.startsWith('..')) {
            return false;
        }
        let normalizedPath = relativePath.replace(/\\/g, '/');
        if (normalizedPath.startsWith('./')) {
            normalizedPath = normalizedPath.substring(2);
        }
        return this.ig.ignores(normalizedPath);
    }
    getPatterns() {
        return this.patterns;
    }
}
//# sourceMappingURL=gitIgnoreParser.js.map