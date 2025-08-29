/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export type EditorType = 'vscode' | 'vscodium' | 'windsurf' | 'cursor' | 'vim' | 'neovim' | 'zed';
interface DiffCommand {
    command: string;
    args: string[];
}
export declare function checkHasEditorType(editor: EditorType): boolean;
export declare function allowEditorTypeInSandbox(editor: EditorType): boolean;
/**
 * Check if the editor is valid and can be used.
 * Returns false if preferred editor is not set / invalid / not available / not allowed in sandbox.
 */
export declare function isEditorAvailable(editor: string | undefined): boolean;
/**
 * Get the diff command for a specific editor.
 */
export declare function getDiffCommand(oldPath: string, newPath: string, editor: EditorType): DiffCommand | null;
/**
 * Opens a diff tool to compare two files.
 * Terminal-based editors by default blocks parent process until the editor exits.
 * GUI-based editors require args such as "--wait" to block parent process.
 */
export declare function openDiff(oldPath: string, newPath: string, editor: EditorType): Promise<void>;
export {};
