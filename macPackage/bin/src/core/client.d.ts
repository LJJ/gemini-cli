/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { GenerateContentConfig, SchemaUnion, PartListUnion, Content, GenerateContentResponse } from '@google/genai';
import { Turn, ServerGeminiStreamEvent, ChatCompressionInfo } from './turn.js';
import { Config } from '../config/config.js';
import { GeminiChat } from './geminiChat.js';
import { ContentGenerator, ContentGeneratorConfig } from './contentGenerator.js';
/**
 * Returns the index of the content after the fraction of the total characters in the history.
 *
 * Exported for testing purposes.
 */
export declare function findIndexAfterFraction(history: Content[], fraction: number): number;
export declare class GeminiClient {
    private config;
    private chat?;
    private contentGenerator?;
    private embeddingModel;
    private generateContentConfig;
    private sessionTurnCount;
    private readonly MAX_TURNS;
    /**
     * Threshold for compression token count as a fraction of the model's token limit.
     * If the chat history exceeds this threshold, it will be compressed.
     */
    private readonly COMPRESSION_TOKEN_THRESHOLD;
    /**
     * The fraction of the latest chat history to keep. A value of 0.3
     * means that only the last 30% of the chat history will be kept after compression.
     */
    private readonly COMPRESSION_PRESERVE_THRESHOLD;
    constructor(config: Config);
    initialize(contentGeneratorConfig: ContentGeneratorConfig): Promise<void>;
    getContentGenerator(): ContentGenerator;
    addHistory(content: Content): Promise<void>;
    getChat(): GeminiChat;
    isInitialized(): boolean;
    getHistory(): Content[];
    setHistory(history: Content[]): void;
    resetChat(): Promise<void>;
    private getEnvironment;
    private startChat;
    sendMessageStream(request: PartListUnion, signal: AbortSignal, prompt_id: string, turns?: number, originalModel?: string): AsyncGenerator<ServerGeminiStreamEvent, Turn>;
    generateJson(contents: Content[], schema: SchemaUnion, abortSignal: AbortSignal, model?: string, config?: GenerateContentConfig): Promise<Record<string, unknown>>;
    generateContent(contents: Content[], generationConfig: GenerateContentConfig, abortSignal: AbortSignal, model?: string): Promise<GenerateContentResponse>;
    generateEmbedding(texts: string[]): Promise<number[][]>;
    tryCompressChat(prompt_id: string, force?: boolean): Promise<ChatCompressionInfo | null>;
    /**
     * Handles fallback to Flash model when persistent 429 errors occur for OAuth users.
     * Uses a fallback handler if provided by the config, otherwise returns null.
     */
    private handleFlashFallback;
}
