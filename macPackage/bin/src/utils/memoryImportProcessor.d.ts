/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Interface for tracking import processing state to prevent circular imports
 */
interface ImportState {
    processedFiles: Set<string>;
    maxDepth: number;
    currentDepth: number;
    currentFile?: string;
}
/**
 * Processes import statements in GEMINI.md content
 * Supports @path/to/file.md syntax for importing content from other files
 *
 * @param content - The content to process for imports
 * @param basePath - The directory path where the current file is located
 * @param debugMode - Whether to enable debug logging
 * @param importState - State tracking for circular import prevention
 * @returns Processed content with imports resolved
 */
export declare function processImports(content: string, basePath: string, debugMode?: boolean, importState?: ImportState): Promise<string>;
/**
 * Validates import paths to ensure they are safe and within allowed directories
 *
 * @param importPath - The import path to validate
 * @param basePath - The base directory for resolving relative paths
 * @param allowedDirectories - Array of allowed directory paths
 * @returns Whether the import path is valid
 */
export declare function validateImportPath(importPath: string, basePath: string, allowedDirectories: string[]): boolean;
export {};
