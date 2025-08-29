/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ToolConfirmationOutcome, ApprovalMode, logToolCall, ToolCallEvent, } from '../index.js';
import { getResponseTextFromParts } from '../utils/generateContentResponseUtilities.js';
import { isModifiableTool, modifyWithEditor, } from '../tools/modifiable-tool.js';
import * as Diff from 'diff';
/**
 * Formats tool output for a Gemini FunctionResponse.
 */
function createFunctionResponsePart(callId, toolName, output) {
    return {
        functionResponse: {
            id: callId,
            name: toolName,
            response: { output },
        },
    };
}
export function convertToFunctionResponse(toolName, callId, llmContent) {
    const contentToProcess = Array.isArray(llmContent) && llmContent.length === 1
        ? llmContent[0]
        : llmContent;
    if (typeof contentToProcess === 'string') {
        return createFunctionResponsePart(callId, toolName, contentToProcess);
    }
    if (Array.isArray(contentToProcess)) {
        const functionResponse = createFunctionResponsePart(callId, toolName, 'Tool execution succeeded.');
        return [functionResponse, ...contentToProcess];
    }
    // After this point, contentToProcess is a single Part object.
    if (contentToProcess.functionResponse) {
        if (contentToProcess.functionResponse.response?.content) {
            const stringifiedOutput = getResponseTextFromParts(contentToProcess.functionResponse.response.content) || '';
            return createFunctionResponsePart(callId, toolName, stringifiedOutput);
        }
        // It's a functionResponse that we should pass through as is.
        return contentToProcess;
    }
    if (contentToProcess.inlineData || contentToProcess.fileData) {
        const mimeType = contentToProcess.inlineData?.mimeType ||
            contentToProcess.fileData?.mimeType ||
            'unknown';
        const functionResponse = createFunctionResponsePart(callId, toolName, `Binary content of type ${mimeType} was processed.`);
        return [functionResponse, contentToProcess];
    }
    if (contentToProcess.text !== undefined) {
        return createFunctionResponsePart(callId, toolName, contentToProcess.text);
    }
    // Default case for other kinds of parts.
    return createFunctionResponsePart(callId, toolName, 'Tool execution succeeded.');
}
const createErrorResponse = (request, error) => ({
    callId: request.callId,
    error,
    responseParts: {
        functionResponse: {
            id: request.callId,
            name: request.name,
            response: { error: error.message },
        },
    },
    resultDisplay: error.message,
});
export class CoreToolScheduler {
    toolRegistry;
    toolCalls = [];
    outputUpdateHandler;
    onAllToolCallsComplete;
    onToolCallsUpdate;
    approvalMode;
    getPreferredEditor;
    config;
    constructor(options) {
        this.config = options.config;
        this.toolRegistry = options.toolRegistry;
        this.outputUpdateHandler = options.outputUpdateHandler;
        this.onAllToolCallsComplete = options.onAllToolCallsComplete;
        this.onToolCallsUpdate = options.onToolCallsUpdate;
        this.approvalMode = options.approvalMode ?? ApprovalMode.DEFAULT;
        this.getPreferredEditor = options.getPreferredEditor;
    }
    setStatusInternal(targetCallId, newStatus, auxiliaryData) {
        this.toolCalls = this.toolCalls.map((currentCall) => {
            if (currentCall.request.callId !== targetCallId ||
                currentCall.status === 'success' ||
                currentCall.status === 'error' ||
                currentCall.status === 'cancelled') {
                return currentCall;
            }
            // currentCall is a non-terminal state here and should have startTime and tool.
            const existingStartTime = currentCall.startTime;
            const toolInstance = currentCall.tool;
            const outcome = currentCall.outcome;
            switch (newStatus) {
                case 'success': {
                    const durationMs = existingStartTime
                        ? Date.now() - existingStartTime
                        : undefined;
                    return {
                        request: currentCall.request,
                        tool: toolInstance,
                        status: 'success',
                        response: auxiliaryData,
                        durationMs,
                        outcome,
                    };
                }
                case 'error': {
                    const durationMs = existingStartTime
                        ? Date.now() - existingStartTime
                        : undefined;
                    return {
                        request: currentCall.request,
                        status: 'error',
                        response: auxiliaryData,
                        durationMs,
                        outcome,
                    };
                }
                case 'awaiting_approval':
                    return {
                        request: currentCall.request,
                        tool: toolInstance,
                        status: 'awaiting_approval',
                        confirmationDetails: auxiliaryData,
                        startTime: existingStartTime,
                        outcome,
                    };
                case 'scheduled':
                    return {
                        request: currentCall.request,
                        tool: toolInstance,
                        status: 'scheduled',
                        startTime: existingStartTime,
                        outcome,
                    };
                case 'cancelled': {
                    const durationMs = existingStartTime
                        ? Date.now() - existingStartTime
                        : undefined;
                    return {
                        request: currentCall.request,
                        tool: toolInstance,
                        status: 'cancelled',
                        response: {
                            callId: currentCall.request.callId,
                            responseParts: {
                                functionResponse: {
                                    id: currentCall.request.callId,
                                    name: currentCall.request.name,
                                    response: {
                                        error: `[Operation Cancelled] Reason: ${auxiliaryData}`,
                                    },
                                },
                            },
                            resultDisplay: undefined,
                            error: undefined,
                        },
                        durationMs,
                        outcome,
                    };
                }
                case 'validating':
                    return {
                        request: currentCall.request,
                        tool: toolInstance,
                        status: 'validating',
                        startTime: existingStartTime,
                        outcome,
                    };
                case 'executing':
                    return {
                        request: currentCall.request,
                        tool: toolInstance,
                        status: 'executing',
                        startTime: existingStartTime,
                        outcome,
                    };
                default: {
                    const exhaustiveCheck = newStatus;
                    return exhaustiveCheck;
                }
            }
        });
        this.notifyToolCallsUpdate();
        this.checkAndNotifyCompletion();
    }
    setArgsInternal(targetCallId, args) {
        this.toolCalls = this.toolCalls.map((call) => {
            if (call.request.callId !== targetCallId)
                return call;
            return {
                ...call,
                request: { ...call.request, args: args },
            };
        });
    }
    isRunning() {
        return this.toolCalls.some((call) => call.status === 'executing' || call.status === 'awaiting_approval');
    }
    async schedule(request, signal) {
        if (this.isRunning()) {
            throw new Error('Cannot schedule new tool calls while other tool calls are actively running (executing or awaiting approval).');
        }
        const requestsToProcess = Array.isArray(request) ? request : [request];
        const toolRegistry = await this.toolRegistry;
        const newToolCalls = requestsToProcess.map((reqInfo) => {
            const toolInstance = toolRegistry.getTool(reqInfo.name);
            if (!toolInstance) {
                return {
                    status: 'error',
                    request: reqInfo,
                    response: createErrorResponse(reqInfo, new Error(`Tool "${reqInfo.name}" not found in registry.`)),
                    durationMs: 0,
                };
            }
            return {
                status: 'validating',
                request: reqInfo,
                tool: toolInstance,
                startTime: Date.now(),
            };
        });
        this.toolCalls = this.toolCalls.concat(newToolCalls);
        this.notifyToolCallsUpdate();
        for (const toolCall of newToolCalls) {
            if (toolCall.status !== 'validating') {
                continue;
            }
            const { request: reqInfo, tool: toolInstance } = toolCall;
            try {
                if (this.approvalMode === ApprovalMode.YOLO) {
                    this.setStatusInternal(reqInfo.callId, 'scheduled');
                }
                else {
                    const confirmationDetails = await toolInstance.shouldConfirmExecute(reqInfo.args, signal);
                    if (confirmationDetails) {
                        const originalOnConfirm = confirmationDetails.onConfirm;
                        const wrappedConfirmationDetails = {
                            ...confirmationDetails,
                            onConfirm: (outcome, payload) => this.handleConfirmationResponse(reqInfo.callId, originalOnConfirm, outcome, signal, payload),
                        };
                        this.setStatusInternal(reqInfo.callId, 'awaiting_approval', wrappedConfirmationDetails);
                    }
                    else {
                        this.setStatusInternal(reqInfo.callId, 'scheduled');
                    }
                }
            }
            catch (error) {
                this.setStatusInternal(reqInfo.callId, 'error', createErrorResponse(reqInfo, error instanceof Error ? error : new Error(String(error))));
            }
        }
        this.attemptExecutionOfScheduledCalls(signal);
        this.checkAndNotifyCompletion();
    }
    async handleConfirmationResponse(callId, originalOnConfirm, outcome, signal, payload) {
        const toolCall = this.toolCalls.find((c) => c.request.callId === callId && c.status === 'awaiting_approval');
        if (toolCall && toolCall.status === 'awaiting_approval') {
            await originalOnConfirm(outcome);
        }
        this.toolCalls = this.toolCalls.map((call) => {
            if (call.request.callId !== callId)
                return call;
            return {
                ...call,
                outcome,
            };
        });
        if (outcome === ToolConfirmationOutcome.Cancel || signal.aborted) {
            this.setStatusInternal(callId, 'cancelled', 'User did not allow tool call');
        }
        else if (outcome === ToolConfirmationOutcome.ModifyWithEditor) {
            const waitingToolCall = toolCall;
            if (isModifiableTool(waitingToolCall.tool)) {
                const modifyContext = waitingToolCall.tool.getModifyContext(signal);
                const editorType = this.getPreferredEditor();
                if (!editorType) {
                    return;
                }
                this.setStatusInternal(callId, 'awaiting_approval', {
                    ...waitingToolCall.confirmationDetails,
                    isModifying: true,
                });
                const { updatedParams, updatedDiff } = await modifyWithEditor(waitingToolCall.request.args, modifyContext, editorType, signal);
                this.setArgsInternal(callId, updatedParams);
                this.setStatusInternal(callId, 'awaiting_approval', {
                    ...waitingToolCall.confirmationDetails,
                    fileDiff: updatedDiff,
                    isModifying: false,
                });
            }
        }
        else {
            // If the client provided new content, apply it before scheduling.
            if (payload?.newContent && toolCall) {
                await this._applyInlineModify(toolCall, payload, signal);
            }
            this.setStatusInternal(callId, 'scheduled');
        }
        this.attemptExecutionOfScheduledCalls(signal);
    }
    /**
     * Applies user-provided content changes to a tool call that is awaiting confirmation.
     * This method updates the tool's arguments and refreshes the confirmation prompt with a new diff
     * before the tool is scheduled for execution.
     * @private
     */
    async _applyInlineModify(toolCall, payload, signal) {
        if (toolCall.confirmationDetails.type !== 'edit' ||
            !isModifiableTool(toolCall.tool)) {
            return;
        }
        const modifyContext = toolCall.tool.getModifyContext(signal);
        const currentContent = await modifyContext.getCurrentContent(toolCall.request.args);
        const updatedParams = modifyContext.createUpdatedParams(currentContent, payload.newContent, toolCall.request.args);
        const updatedDiff = Diff.createPatch(modifyContext.getFilePath(toolCall.request.args), currentContent, payload.newContent, 'Current', 'Proposed');
        this.setArgsInternal(toolCall.request.callId, updatedParams);
        this.setStatusInternal(toolCall.request.callId, 'awaiting_approval', {
            ...toolCall.confirmationDetails,
            fileDiff: updatedDiff,
        });
    }
    attemptExecutionOfScheduledCalls(signal) {
        const allCallsFinalOrScheduled = this.toolCalls.every((call) => call.status === 'scheduled' ||
            call.status === 'cancelled' ||
            call.status === 'success' ||
            call.status === 'error');
        if (allCallsFinalOrScheduled) {
            const callsToExecute = this.toolCalls.filter((call) => call.status === 'scheduled');
            callsToExecute.forEach((toolCall) => {
                if (toolCall.status !== 'scheduled')
                    return;
                const scheduledCall = toolCall;
                const { callId, name: toolName } = scheduledCall.request;
                this.setStatusInternal(callId, 'executing');
                const liveOutputCallback = scheduledCall.tool.canUpdateOutput && this.outputUpdateHandler
                    ? (outputChunk) => {
                        if (this.outputUpdateHandler) {
                            this.outputUpdateHandler(callId, outputChunk);
                        }
                        this.toolCalls = this.toolCalls.map((tc) => tc.request.callId === callId && tc.status === 'executing'
                            ? { ...tc, liveOutput: outputChunk }
                            : tc);
                        this.notifyToolCallsUpdate();
                    }
                    : undefined;
                scheduledCall.tool
                    .execute(scheduledCall.request.args, signal, liveOutputCallback)
                    .then(async (toolResult) => {
                    if (signal.aborted) {
                        this.setStatusInternal(callId, 'cancelled', 'User cancelled tool execution.');
                        return;
                    }
                    const response = convertToFunctionResponse(toolName, callId, toolResult.llmContent);
                    const successResponse = {
                        callId,
                        responseParts: response,
                        resultDisplay: toolResult.returnDisplay,
                        error: undefined,
                    };
                    this.setStatusInternal(callId, 'success', successResponse);
                })
                    .catch((executionError) => {
                    this.setStatusInternal(callId, 'error', createErrorResponse(scheduledCall.request, executionError instanceof Error
                        ? executionError
                        : new Error(String(executionError))));
                });
            });
        }
    }
    checkAndNotifyCompletion() {
        const allCallsAreTerminal = this.toolCalls.every((call) => call.status === 'success' ||
            call.status === 'error' ||
            call.status === 'cancelled');
        if (this.toolCalls.length > 0 && allCallsAreTerminal) {
            const completedCalls = [...this.toolCalls];
            this.toolCalls = [];
            for (const call of completedCalls) {
                logToolCall(this.config, new ToolCallEvent(call));
            }
            if (this.onAllToolCallsComplete) {
                this.onAllToolCallsComplete(completedCalls);
            }
            this.notifyToolCallsUpdate();
        }
    }
    notifyToolCallsUpdate() {
        if (this.onToolCallsUpdate) {
            this.onToolCallsUpdate([...this.toolCalls]);
        }
    }
}
//# sourceMappingURL=coreToolScheduler.js.map