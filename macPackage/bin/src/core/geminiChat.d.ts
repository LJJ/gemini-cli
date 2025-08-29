/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { GenerateContentResponse, Content, GenerateContentConfig, SendMessageParameters, GenerateContentResponseUsageMetadata } from '@google/genai';
import { ContentGenerator } from './contentGenerator.js';
import { Config } from '../config/config.js';
/**
 * Chat session that enables sending messages to the model with previous
 * conversation context.
 *
 * @remarks
 * The session maintains all the turns between user and model.
 */
export declare class GeminiChat {
    private readonly config;
    private readonly contentGenerator;
    private readonly generationConfig;
    private history;
    private sendPromise;
    constructor(config: Config, contentGenerator: ContentGenerator, generationConfig?: GenerateContentConfig, history?: Content[]);
    private _getRequestTextFromContents;
    private _logApiRequest;
    private _logApiResponse;
    private _logApiError;
    /**
     * Handles fallback to Flash model when persistent 429 errors occur for OAuth users.
     * Uses a fallback handler if provided by the config, otherwise returns null.
     */
    private handleFlashFallback;
    /**
     * Sends a message to the model and returns the response.
     *
     * @remarks
     * This method will wait for the previous message to be processed before
     * sending the next message.
     *
     * @see {@link Chat#sendMessageStream} for streaming method.
     * @param params - parameters for sending messages within a chat session.
     * @returns The model's response.
     *
     * @example
     * ```ts
     * const chat = ai.chats.create({model: 'gemini-2.0-flash'});
     * const response = await chat.sendMessage({
     *   message: 'Why is the sky blue?'
     * });
     * console.log(response.text);
     * ```
     */
    sendMessage(params: SendMessageParameters, prompt_id: string): Promise<GenerateContentResponse>;
    /**
     * Sends a message to the model and returns the response in chunks.
     *
     * @remarks
     * This method will wait for the previous message to be processed before
     * sending the next message.
     *
     * @see {@link Chat#sendMessage} for non-streaming method.
     * @param params - parameters for sending the message.
     * @return The model's response.
     *
     * @example
     * ```ts
     * const chat = ai.chats.create({model: 'gemini-2.0-flash'});
     * const response = await chat.sendMessageStream({
     *   message: 'Why is the sky blue?'
     * });
     * for await (const chunk of response) {
     *   console.log(chunk.text);
     * }
     * ```
     */
    sendMessageStream(params: SendMessageParameters, prompt_id: string): Promise<AsyncGenerator<GenerateContentResponse>>;
    /**
     * Returns the chat history.
     *
     * @remarks
     * The history is a list of contents alternating between user and model.
     *
     * There are two types of history:
     * - The `curated history` contains only the valid turns between user and
     * model, which will be included in the subsequent requests sent to the model.
     * - The `comprehensive history` contains all turns, including invalid or
     *   empty model outputs, providing a complete record of the history.
     *
     * The history is updated after receiving the response from the model,
     * for streaming response, it means receiving the last chunk of the response.
     *
     * The `comprehensive history` is returned by default. To get the `curated
     * history`, set the `curated` parameter to `true`.
     *
     * @param curated - whether to return the curated history or the comprehensive
     *     history.
     * @return History contents alternating between user and model for the entire
     *     chat session.
     */
    getHistory(curated?: boolean): Content[];
    /**
     * Clears the chat history.
     */
    clearHistory(): void;
    /**
     * Adds a new entry to the chat history.
     *
     * @param content - The content to add to the history.
     */
    addHistory(content: Content): void;
    setHistory(history: Content[]): void;
    getFinalUsageMetadata(chunks: GenerateContentResponse[]): GenerateContentResponseUsageMetadata | undefined;
    private processStreamResponse;
    private recordHistory;
    private isTextContent;
    private isThoughtContent;
}
