/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const GEMINI_DIR = ".gemini";
export declare const GOOGLE_ACCOUNTS_FILENAME = "google_accounts.json";
/**
 * Replaces the home directory with a tilde.
 * @param path - The path to tildeify.
 * @returns The tildeified path.
 */
export declare function tildeifyPath(path: string): string;
/**
 * Shortens a path string if it exceeds maxLen, prioritizing the start and end segments.
 * Example: /path/to/a/very/long/file.txt -> /path/.../long/file.txt
 */
export declare function shortenPath(filePath: string, maxLen?: number): string;
/**
 * Calculates the relative path from a root directory to a target path.
 * Ensures both paths are resolved before calculating.
 * Returns '.' if the target path is the same as the root directory.
 *
 * @param targetPath The absolute or relative path to make relative.
 * @param rootDirectory The absolute path of the directory to make the target path relative to.
 * @returns The relative path from rootDirectory to targetPath.
 */
export declare function makeRelative(targetPath: string, rootDirectory: string): string;
/**
 * Escapes spaces in a file path.
 */
export declare function escapePath(filePath: string): string;
/**
 * Unescapes spaces in a file path.
 */
export declare function unescapePath(filePath: string): string;
/**
 * Generates a unique hash for a project based on its root path.
 * @param projectRoot The absolute path to the project's root directory.
 * @returns A SHA256 hash of the project root path.
 */
export declare function getProjectHash(projectRoot: string): string;
/**
 * Generates a unique temporary directory path for a project.
 * @param projectRoot The absolute path to the project's root directory.
 * @returns The path to the project's temporary directory.
 */
export declare function getProjectTempDir(projectRoot: string): string;
