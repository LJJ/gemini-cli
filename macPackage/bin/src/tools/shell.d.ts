/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Config } from '../config/config.js';
import { BaseTool, ToolResult, ToolCallConfirmationDetails } from './tools.js';
export interface ShellToolParams {
    command: string;
    description?: string;
    directory?: string;
}
export declare class ShellTool extends BaseTool<ShellToolParams, ToolResult> {
    private readonly config;
    static Name: string;
    private whitelist;
    constructor(config: Config);
    getDescription(params: ShellToolParams): string;
    /**
     * Extracts the root command from a given shell command string.
     * This is used to identify the base command for permission checks.
     *
     * @param command The shell command string to parse
     * @returns The root command name, or undefined if it cannot be determined
     * @example getCommandRoot("ls -la /tmp") returns "ls"
     * @example getCommandRoot("git status && npm test") returns "git"
     */
    getCommandRoot(command: string): string | undefined;
    /**
     * Determines whether a given shell command is allowed to execute based on
     * the tool's configuration including allowlists and blocklists.
     *
     * @param command The shell command string to validate
     * @returns An object with 'allowed' boolean and optional 'reason' string if not allowed
     */
    isCommandAllowed(command: string): {
        allowed: boolean;
        reason?: string;
    };
    validateToolParams(params: ShellToolParams): string | null;
    shouldConfirmExecute(params: ShellToolParams, _abortSignal: AbortSignal): Promise<ToolCallConfirmationDetails | false>;
    execute(params: ShellToolParams, abortSignal: AbortSignal, updateOutput?: (chunk: string) => void): Promise<ToolResult>;
}
