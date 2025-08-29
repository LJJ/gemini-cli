/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as readline from 'readline';
import { fromCountTokenResponse, fromGenerateContentResponse, toCountTokenRequest, toGenerateContentRequest, } from './converter.js';
import { Readable } from 'node:stream';
export const CODE_ASSIST_ENDPOINT = 'https://cloudcode-pa.googleapis.com';
export const CODE_ASSIST_API_VERSION = 'v1internal';
export class CodeAssistServer {
    client;
    projectId;
    httpOptions;
    sessionId;
    userTier = undefined;
    constructor(client, projectId, httpOptions = {}, sessionId) {
        this.client = client;
        this.projectId = projectId;
        this.httpOptions = httpOptions;
        this.sessionId = sessionId;
    }
    async generateContentStream(req) {
        const resps = await this.requestStreamingPost('streamGenerateContent', toGenerateContentRequest(req, this.projectId, this.sessionId), req.config?.abortSignal);
        return (async function* () {
            for await (const resp of resps) {
                yield fromGenerateContentResponse(resp);
            }
        })();
    }
    async generateContent(req) {
        const resp = await this.requestPost('generateContent', toGenerateContentRequest(req, this.projectId, this.sessionId), req.config?.abortSignal);
        return fromGenerateContentResponse(resp);
    }
    async onboardUser(req) {
        return await this.requestPost('onboardUser', req);
    }
    async loadCodeAssist(req) {
        return await this.requestPost('loadCodeAssist', req);
    }
    async getCodeAssistGlobalUserSetting() {
        return await this.requestGet('getCodeAssistGlobalUserSetting');
    }
    async setCodeAssistGlobalUserSetting(req) {
        return await this.requestPost('setCodeAssistGlobalUserSetting', req);
    }
    async countTokens(req) {
        const resp = await this.requestPost('countTokens', toCountTokenRequest(req));
        return fromCountTokenResponse(resp);
    }
    async embedContent(_req) {
        throw Error();
    }
    async requestPost(method, req, signal) {
        const res = await this.client.request({
            url: this.getMethodUrl(method),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.httpOptions.headers,
            },
            responseType: 'json',
            body: JSON.stringify(req),
            signal,
        });
        return res.data;
    }
    async requestGet(method, signal) {
        const res = await this.client.request({
            url: this.getMethodUrl(method),
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...this.httpOptions.headers,
            },
            responseType: 'json',
            signal,
        });
        return res.data;
    }
    async requestStreamingPost(method, req, signal) {
        const res = await this.client.request({
            url: this.getMethodUrl(method),
            method: 'POST',
            params: {
                alt: 'sse',
            },
            headers: {
                'Content-Type': 'application/json',
                ...this.httpOptions.headers,
            },
            responseType: 'stream',
            body: JSON.stringify(req),
            signal,
        });
        return (async function* () {
            // Convert ReadableStream to Node.js stream if needed
            let nodeStream;
            if (res.data instanceof ReadableStream) {
                // Convert Web ReadableStream to Node.js Readable stream
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                nodeStream = Readable.fromWeb(res.data);
            }
            else if (res.data &&
                typeof res.data.on === 'function') {
                // Already a Node.js stream
                nodeStream = res.data;
            }
            else {
                // If res.data is not a stream, it might be an error response
                // Try to extract error information from the response
                let errorMessage = 'Response data is not a readable stream. This may indicate a server error or quota issue.';
                if (res.data && typeof res.data === 'object') {
                    // Check if this is an error response with error details
                    const errorData = res.data;
                    if (errorData.error?.message) {
                        errorMessage = errorData.error.message;
                    }
                    else if (typeof errorData === 'string') {
                        errorMessage = errorData;
                    }
                }
                // Create an error that looks like a quota error if it contains quota information
                const error = new Error(errorMessage);
                // Add status and response properties so it can be properly handled by retry logic
                error.status = res.status;
                error.response = res;
                throw error;
            }
            const rl = readline.createInterface({
                input: nodeStream,
                crlfDelay: Infinity, // Recognizes '\r\n' and '\n' as line breaks
            });
            let bufferedLines = [];
            for await (const line of rl) {
                // blank lines are used to separate JSON objects in the stream
                if (line === '') {
                    if (bufferedLines.length === 0) {
                        continue; // no data to yield
                    }
                    yield JSON.parse(bufferedLines.join('\n'));
                    bufferedLines = []; // Reset the buffer after yielding
                }
                else if (line.startsWith('data: ')) {
                    bufferedLines.push(line.slice(6).trim());
                }
                else {
                    throw new Error(`Unexpected line format in response: ${line}`);
                }
            }
        })();
    }
    async getTier() {
        if (this.userTier === undefined) {
            await this.detectUserTier();
        }
        return this.userTier;
    }
    async detectUserTier() {
        try {
            // Reset user tier when detection runs
            this.userTier = undefined;
            // Only attempt tier detection if we have a project ID
            if (this.projectId) {
                const loadRes = await this.loadCodeAssist({
                    cloudaicompanionProject: this.projectId,
                    metadata: {
                        ideType: 'IDE_UNSPECIFIED',
                        platform: 'PLATFORM_UNSPECIFIED',
                        pluginType: 'GEMINI',
                        duetProject: this.projectId,
                    },
                });
                if (loadRes.currentTier) {
                    this.userTier = loadRes.currentTier.id;
                }
            }
        }
        catch (error) {
            // Silently fail - this is not critical functionality
            // We'll default to FREE tier behavior if tier detection fails
            console.debug('User tier detection failed:', error);
        }
    }
    getMethodUrl(method) {
        const endpoint = process.env.CODE_ASSIST_ENDPOINT ?? CODE_ASSIST_ENDPOINT;
        return `${endpoint}/${CODE_ASSIST_API_VERSION}:${method}`;
    }
}
//# sourceMappingURL=server.js.map