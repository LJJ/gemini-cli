/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { GenerateContentResponse, } from '@google/genai';
export function toCountTokenRequest(req) {
    return {
        request: {
            model: 'models/' + req.model,
            contents: toContents(req.contents),
        },
    };
}
export function fromCountTokenResponse(res) {
    return {
        totalTokens: res.totalTokens,
    };
}
export function toGenerateContentRequest(req, project, sessionId) {
    return {
        model: req.model,
        project,
        request: toVertexGenerateContentRequest(req, sessionId),
    };
}
export function fromGenerateContentResponse(res) {
    const inres = res.response;
    const out = new GenerateContentResponse();
    out.candidates = inres.candidates;
    out.automaticFunctionCallingHistory = inres.automaticFunctionCallingHistory;
    out.promptFeedback = inres.promptFeedback;
    out.usageMetadata = inres.usageMetadata;
    return out;
}
function toVertexGenerateContentRequest(req, sessionId) {
    return {
        contents: toContents(req.contents),
        systemInstruction: maybeToContent(req.config?.systemInstruction),
        cachedContent: req.config?.cachedContent,
        tools: req.config?.tools,
        toolConfig: req.config?.toolConfig,
        labels: req.config?.labels,
        safetySettings: req.config?.safetySettings,
        generationConfig: toVertexGenerationConfig(req.config),
        session_id: sessionId,
    };
}
function toContents(contents) {
    if (Array.isArray(contents)) {
        // it's a Content[] or a PartsUnion[]
        return contents.map(toContent);
    }
    // it's a Content or a PartsUnion
    return [toContent(contents)];
}
function maybeToContent(content) {
    if (!content) {
        return undefined;
    }
    return toContent(content);
}
function toContent(content) {
    if (Array.isArray(content)) {
        // it's a PartsUnion[]
        return {
            role: 'user',
            parts: toParts(content),
        };
    }
    if (typeof content === 'string') {
        // it's a string
        return {
            role: 'user',
            parts: [{ text: content }],
        };
    }
    if ('parts' in content) {
        // it's a Content
        return content;
    }
    // it's a Part
    return {
        role: 'user',
        parts: [content],
    };
}
function toParts(parts) {
    return parts.map(toPart);
}
function toPart(part) {
    if (typeof part === 'string') {
        // it's a string
        return { text: part };
    }
    return part;
}
function toVertexGenerationConfig(config) {
    if (!config) {
        return undefined;
    }
    return {
        temperature: config.temperature,
        topP: config.topP,
        topK: config.topK,
        candidateCount: config.candidateCount,
        maxOutputTokens: config.maxOutputTokens,
        stopSequences: config.stopSequences,
        responseLogprobs: config.responseLogprobs,
        logprobs: config.logprobs,
        presencePenalty: config.presencePenalty,
        frequencyPenalty: config.frequencyPenalty,
        seed: config.seed,
        responseMimeType: config.responseMimeType,
        responseSchema: config.responseSchema,
        routingConfig: config.routingConfig,
        modelSelectionConfig: config.modelSelectionConfig,
        responseModalities: config.responseModalities,
        mediaResolution: config.mediaResolution,
        speechConfig: config.speechConfig,
        audioTimestamp: config.audioTimestamp,
        thinkingConfig: config.thinkingConfig,
    };
}
//# sourceMappingURL=converter.js.map