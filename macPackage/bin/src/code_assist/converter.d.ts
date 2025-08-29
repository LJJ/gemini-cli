/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Content, GenerateContentParameters, CountTokensParameters, CountTokensResponse, GenerateContentResponse, GenerationConfigRoutingConfig, MediaResolution, Candidate, ModelSelectionConfig, GenerateContentResponsePromptFeedback, GenerateContentResponseUsageMetadata, SafetySetting, SchemaUnion, SpeechConfigUnion, ThinkingConfig, ToolListUnion, ToolConfig } from '@google/genai';
export interface CAGenerateContentRequest {
    model: string;
    project?: string;
    request: VertexGenerateContentRequest;
}
interface VertexGenerateContentRequest {
    contents: Content[];
    systemInstruction?: Content;
    cachedContent?: string;
    tools?: ToolListUnion;
    toolConfig?: ToolConfig;
    labels?: Record<string, string>;
    safetySettings?: SafetySetting[];
    generationConfig?: VertexGenerationConfig;
    session_id?: string;
}
interface VertexGenerationConfig {
    temperature?: number;
    topP?: number;
    topK?: number;
    candidateCount?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
    responseLogprobs?: boolean;
    logprobs?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
    seed?: number;
    responseMimeType?: string;
    responseSchema?: SchemaUnion;
    routingConfig?: GenerationConfigRoutingConfig;
    modelSelectionConfig?: ModelSelectionConfig;
    responseModalities?: string[];
    mediaResolution?: MediaResolution;
    speechConfig?: SpeechConfigUnion;
    audioTimestamp?: boolean;
    thinkingConfig?: ThinkingConfig;
}
export interface CaGenerateContentResponse {
    response: VertexGenerateContentResponse;
}
interface VertexGenerateContentResponse {
    candidates: Candidate[];
    automaticFunctionCallingHistory?: Content[];
    promptFeedback?: GenerateContentResponsePromptFeedback;
    usageMetadata?: GenerateContentResponseUsageMetadata;
}
export interface CaCountTokenRequest {
    request: VertexCountTokenRequest;
}
interface VertexCountTokenRequest {
    model: string;
    contents: Content[];
}
export interface CaCountTokenResponse {
    totalTokens: number;
}
export declare function toCountTokenRequest(req: CountTokensParameters): CaCountTokenRequest;
export declare function fromCountTokenResponse(res: CaCountTokenResponse): CountTokensResponse;
export declare function toGenerateContentRequest(req: GenerateContentParameters, project?: string, sessionId?: string): CAGenerateContentRequest;
export declare function fromGenerateContentResponse(res: CaGenerateContentResponse): GenerateContentResponse;
export {};
