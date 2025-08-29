/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { getResponseText } from '../utils/generateContentResponseUtilities.js';
import { reportError } from '../utils/errorReporting.js';
import { getErrorMessage, UnauthorizedError, toFriendlyError, } from '../utils/errors.js';
export var GeminiEventType;
(function (GeminiEventType) {
    GeminiEventType["Content"] = "content";
    GeminiEventType["ToolCallRequest"] = "tool_call_request";
    GeminiEventType["ToolCallResponse"] = "tool_call_response";
    GeminiEventType["ToolCallConfirmation"] = "tool_call_confirmation";
    GeminiEventType["UserCancelled"] = "user_cancelled";
    GeminiEventType["Error"] = "error";
    GeminiEventType["ChatCompressed"] = "chat_compressed";
    GeminiEventType["Thought"] = "thought";
    GeminiEventType["MaxSessionTurns"] = "max_session_turns";
})(GeminiEventType || (GeminiEventType = {}));
// A turn manages the agentic loop turn within the server context.
export class Turn {
    chat;
    prompt_id;
    pendingToolCalls;
    debugResponses;
    constructor(chat, prompt_id) {
        this.chat = chat;
        this.prompt_id = prompt_id;
        this.pendingToolCalls = [];
        this.debugResponses = [];
    }
    // The run method yields simpler events suitable for server logic
    async *run(req, signal) {
        try {
            const responseStream = await this.chat.sendMessageStream({
                message: req,
                config: {
                    abortSignal: signal,
                },
            }, this.prompt_id);
            for await (const resp of responseStream) {
                if (signal?.aborted) {
                    yield { type: GeminiEventType.UserCancelled };
                    // Do not add resp to debugResponses if aborted before processing
                    return;
                }
                this.debugResponses.push(resp);
                const thoughtPart = resp.candidates?.[0]?.content?.parts?.[0];
                if (thoughtPart?.thought) {
                    // Thought always has a bold "subject" part enclosed in double asterisks
                    // (e.g., **Subject**). The rest of the string is considered the description.
                    const rawText = thoughtPart.text ?? '';
                    const subjectStringMatches = rawText.match(/\*\*(.*?)\*\*/s);
                    const subject = subjectStringMatches
                        ? subjectStringMatches[1].trim()
                        : '';
                    const description = rawText.replace(/\*\*(.*?)\*\*/s, '').trim();
                    const thought = {
                        subject,
                        description,
                    };
                    yield {
                        type: GeminiEventType.Thought,
                        value: thought,
                    };
                    continue;
                }
                const text = getResponseText(resp);
                if (text) {
                    yield { type: GeminiEventType.Content, value: text };
                }
                // Handle function calls (requesting tool execution)
                const functionCalls = resp.functionCalls ?? [];
                for (const fnCall of functionCalls) {
                    const event = this.handlePendingFunctionCall(fnCall);
                    if (event) {
                        yield event;
                    }
                }
            }
        }
        catch (e) {
            const error = toFriendlyError(e);
            if (error instanceof UnauthorizedError) {
                throw error;
            }
            if (signal.aborted) {
                yield { type: GeminiEventType.UserCancelled };
                // Regular cancellation error, fail gracefully.
                return;
            }
            const contextForReport = [...this.chat.getHistory(/*curated*/ true), req];
            await reportError(error, 'Error when talking to Gemini API', contextForReport, 'Turn.run-sendMessageStream');
            const status = typeof error === 'object' &&
                error !== null &&
                'status' in error &&
                typeof error.status === 'number'
                ? error.status
                : undefined;
            const structuredError = {
                message: getErrorMessage(error),
                status,
            };
            yield { type: GeminiEventType.Error, value: { error: structuredError } };
            return;
        }
    }
    handlePendingFunctionCall(fnCall) {
        const callId = fnCall.id ??
            `${fnCall.name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const name = fnCall.name || 'undefined_tool_name';
        const args = (fnCall.args || {});
        const toolCallRequest = {
            callId,
            name,
            args,
            isClientInitiated: false,
            prompt_id: this.prompt_id,
        };
        this.pendingToolCalls.push(toolCallRequest);
        // Yield a request for the tool call, not the pending/confirming status
        return { type: GeminiEventType.ToolCallRequest, value: toolCallRequest };
    }
    getDebugResponses() {
        return this.debugResponses;
    }
}
//# sourceMappingURL=turn.js.map