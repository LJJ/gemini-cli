/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseTool, ToolConfirmationOutcome, } from './tools.js';
export class DiscoveredMCPTool extends BaseTool {
    mcpTool;
    serverName;
    name;
    description;
    parameterSchema;
    serverToolName;
    timeout;
    trust;
    static allowlist = new Set();
    constructor(mcpTool, serverName, name, description, parameterSchema, serverToolName, timeout, trust) {
        super(name, `${serverToolName} (${serverName} MCP Server)`, description, parameterSchema, true, // isOutputMarkdown
        false);
        this.mcpTool = mcpTool;
        this.serverName = serverName;
        this.name = name;
        this.description = description;
        this.parameterSchema = parameterSchema;
        this.serverToolName = serverToolName;
        this.timeout = timeout;
        this.trust = trust;
    }
    async shouldConfirmExecute(_params, _abortSignal) {
        const serverAllowListKey = this.serverName;
        const toolAllowListKey = `${this.serverName}.${this.serverToolName}`;
        if (this.trust) {
            return false; // server is trusted, no confirmation needed
        }
        if (DiscoveredMCPTool.allowlist.has(serverAllowListKey) ||
            DiscoveredMCPTool.allowlist.has(toolAllowListKey)) {
            return false; // server and/or tool already allow listed
        }
        const confirmationDetails = {
            type: 'mcp',
            title: 'Confirm MCP Tool Execution',
            serverName: this.serverName,
            toolName: this.serverToolName, // Display original tool name in confirmation
            toolDisplayName: this.name, // Display global registry name exposed to model and user
            onConfirm: async (outcome) => {
                if (outcome === ToolConfirmationOutcome.ProceedAlwaysServer) {
                    DiscoveredMCPTool.allowlist.add(serverAllowListKey);
                }
                else if (outcome === ToolConfirmationOutcome.ProceedAlwaysTool) {
                    DiscoveredMCPTool.allowlist.add(toolAllowListKey);
                }
            },
        };
        return confirmationDetails;
    }
    async execute(params) {
        const functionCalls = [
            {
                name: this.serverToolName,
                args: params,
            },
        ];
        const responseParts = await this.mcpTool.callTool(functionCalls);
        return {
            llmContent: responseParts,
            returnDisplay: getStringifiedResultForDisplay(responseParts),
        };
    }
}
/**
 * Processes an array of `Part` objects, primarily from a tool's execution result,
 * to generate a user-friendly string representation, typically for display in a CLI.
 *
 * The `result` array can contain various types of `Part` objects:
 * 1. `FunctionResponse` parts:
 *    - If the `response.content` of a `FunctionResponse` is an array consisting solely
 *      of `TextPart` objects, their text content is concatenated into a single string.
 *      This is to present simple textual outputs directly.
 *    - If `response.content` is an array but contains other types of `Part` objects (or a mix),
 *      the `content` array itself is preserved. This handles structured data like JSON objects or arrays
 *      returned by a tool.
 *    - If `response.content` is not an array or is missing, the entire `functionResponse`
 *      object is preserved.
 * 2. Other `Part` types (e.g., `TextPart` directly in the `result` array):
 *    - These are preserved as is.
 *
 * All processed parts are then collected into an array, which is JSON.stringify-ed
 * with indentation and wrapped in a markdown JSON code block.
 */
function getStringifiedResultForDisplay(result) {
    if (!result || result.length === 0) {
        return '```json\n[]\n```';
    }
    const processFunctionResponse = (part) => {
        if (part.functionResponse) {
            const responseContent = part.functionResponse.response?.content;
            if (responseContent && Array.isArray(responseContent)) {
                // Check if all parts in responseContent are simple TextParts
                const allTextParts = responseContent.every((p) => p.text !== undefined);
                if (allTextParts) {
                    return responseContent.map((p) => p.text).join('');
                }
                // If not all simple text parts, return the array of these content parts for JSON stringification
                return responseContent;
            }
            // If no content, or not an array, or not a functionResponse, stringify the whole functionResponse part for inspection
            return part.functionResponse;
        }
        return part; // Fallback for unexpected structure or non-FunctionResponsePart
    };
    const processedResults = result.length === 1
        ? processFunctionResponse(result[0])
        : result.map(processFunctionResponse);
    if (typeof processedResults === 'string') {
        return processedResults;
    }
    return '```json\n' + JSON.stringify(processedResults, null, 2) + '\n```';
}
//# sourceMappingURL=mcp-tool.js.map