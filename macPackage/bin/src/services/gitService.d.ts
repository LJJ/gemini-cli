/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare class GitService {
    private projectRoot;
    constructor(projectRoot: string);
    private getHistoryDir;
    initialize(): Promise<void>;
    verifyGitAvailability(): Promise<boolean>;
    /**
     * Creates a hidden git repository in the project root.
     * The Git repository is used to support checkpointing.
     */
    setupShadowGitRepository(): Promise<void>;
    private get shadowGitRepository();
    getCurrentCommitHash(): Promise<string>;
    createFileSnapshot(message: string): Promise<string>;
    restoreProjectFromSnapshot(commitHash: string): Promise<void>;
}
