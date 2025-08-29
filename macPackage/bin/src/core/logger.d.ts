/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Content } from '@google/genai';
export declare enum MessageSenderType {
    USER = "user"
}
export interface LogEntry {
    sessionId: string;
    messageId: number;
    timestamp: string;
    type: MessageSenderType;
    message: string;
}
export declare class Logger {
    private geminiDir;
    private logFilePath;
    private sessionId;
    private messageId;
    private initialized;
    private logs;
    constructor(sessionId: string);
    private _readLogFile;
    private _backupCorruptedLogFile;
    initialize(): Promise<void>;
    private _updateLogFile;
    getPreviousUserMessages(): Promise<string[]>;
    logMessage(type: MessageSenderType, message: string): Promise<void>;
    _checkpointPath(tag: string): string;
    saveCheckpoint(conversation: Content[], tag: string): Promise<void>;
    loadCheckpoint(tag: string): Promise<Content[]>;
    close(): void;
}
