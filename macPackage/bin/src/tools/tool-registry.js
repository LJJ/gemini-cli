/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Type } from '@google/genai';
import { BaseTool } from './tools.js';
import { spawn } from 'node:child_process';
import { StringDecoder } from 'node:string_decoder';
import { discoverMcpTools } from './mcp-client.js';
import { DiscoveredMCPTool } from './mcp-tool.js';
import { parse } from 'shell-quote';
export class DiscoveredTool extends BaseTool {
    config;
    name;
    description;
    parameterSchema;
    constructor(config, name, description, parameterSchema) {
        const discoveryCmd = config.getToolDiscoveryCommand();
        const callCommand = config.getToolCallCommand();
        description += `

This tool was discovered from the project by executing the command \`${discoveryCmd}\` on project root.
When called, this tool will execute the command \`${callCommand} ${name}\` on project root.
Tool discovery and call commands can be configured in project or user settings.

When called, the tool call command is executed as a subprocess.
On success, tool output is returned as a json string.
Otherwise, the following information is returned:

Stdout: Output on stdout stream. Can be \`(empty)\` or partial.
Stderr: Output on stderr stream. Can be \`(empty)\` or partial.
Error: Error or \`(none)\` if no error was reported for the subprocess.
Exit Code: Exit code or \`(none)\` if terminated by signal.
Signal: Signal number or \`(none)\` if no signal was received.
`;
        super(name, name, description, parameterSchema, false, // isOutputMarkdown
        false);
        this.config = config;
        this.name = name;
        this.description = description;
        this.parameterSchema = parameterSchema;
    }
    async execute(params) {
        const callCommand = this.config.getToolCallCommand();
        const child = spawn(callCommand, [this.name]);
        child.stdin.write(JSON.stringify(params));
        child.stdin.end();
        let stdout = '';
        let stderr = '';
        let error = null;
        let code = null;
        let signal = null;
        await new Promise((resolve) => {
            const onStdout = (data) => {
                stdout += data?.toString();
            };
            const onStderr = (data) => {
                stderr += data?.toString();
            };
            const onError = (err) => {
                error = err;
            };
            const onClose = (_code, _signal) => {
                code = _code;
                signal = _signal;
                cleanup();
                resolve();
            };
            const cleanup = () => {
                child.stdout.removeListener('data', onStdout);
                child.stderr.removeListener('data', onStderr);
                child.removeListener('error', onError);
                child.removeListener('close', onClose);
                if (child.connected) {
                    child.disconnect();
                }
            };
            child.stdout.on('data', onStdout);
            child.stderr.on('data', onStderr);
            child.on('error', onError);
            child.on('close', onClose);
        });
        // if there is any error, non-zero exit code, signal, or stderr, return error details instead of stdout
        if (error || code !== 0 || signal || stderr) {
            const llmContent = [
                `Stdout: ${stdout || '(empty)'}`,
                `Stderr: ${stderr || '(empty)'}`,
                `Error: ${error ?? '(none)'}`,
                `Exit Code: ${code ?? '(none)'}`,
                `Signal: ${signal ?? '(none)'}`,
            ].join('\n');
            return {
                llmContent,
                returnDisplay: llmContent,
            };
        }
        return {
            llmContent: stdout,
            returnDisplay: stdout,
        };
    }
}
export class ToolRegistry {
    tools = new Map();
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Registers a tool definition.
     * @param tool - The tool object containing schema and execution logic.
     */
    registerTool(tool) {
        if (this.tools.has(tool.name)) {
            // Decide on behavior: throw error, log warning, or allow overwrite
            console.warn(`Tool with name "${tool.name}" is already registered. Overwriting.`);
        }
        this.tools.set(tool.name, tool);
    }
    /**
     * Discovers tools from project (if available and configured).
     * Can be called multiple times to update discovered tools.
     */
    async discoverTools() {
        // remove any previously discovered tools
        for (const tool of this.tools.values()) {
            if (tool instanceof DiscoveredTool || tool instanceof DiscoveredMCPTool) {
                this.tools.delete(tool.name);
            }
        }
        await this.discoverAndRegisterToolsFromCommand();
        // discover tools using MCP servers, if configured
        await discoverMcpTools(this.config.getMcpServers() ?? {}, this.config.getMcpServerCommand(), this, this.config.getDebugMode());
    }
    async discoverAndRegisterToolsFromCommand() {
        const discoveryCmd = this.config.getToolDiscoveryCommand();
        if (!discoveryCmd) {
            return;
        }
        try {
            const cmdParts = parse(discoveryCmd);
            if (cmdParts.length === 0) {
                throw new Error('Tool discovery command is empty or contains only whitespace.');
            }
            const proc = spawn(cmdParts[0], cmdParts.slice(1));
            let stdout = '';
            const stdoutDecoder = new StringDecoder('utf8');
            let stderr = '';
            const stderrDecoder = new StringDecoder('utf8');
            let sizeLimitExceeded = false;
            const MAX_STDOUT_SIZE = 10 * 1024 * 1024; // 10MB limit
            const MAX_STDERR_SIZE = 10 * 1024 * 1024; // 10MB limit
            let stdoutByteLength = 0;
            let stderrByteLength = 0;
            proc.stdout.on('data', (data) => {
                if (sizeLimitExceeded)
                    return;
                if (stdoutByteLength + data.length > MAX_STDOUT_SIZE) {
                    sizeLimitExceeded = true;
                    proc.kill();
                    return;
                }
                stdoutByteLength += data.length;
                stdout += stdoutDecoder.write(data);
            });
            proc.stderr.on('data', (data) => {
                if (sizeLimitExceeded)
                    return;
                if (stderrByteLength + data.length > MAX_STDERR_SIZE) {
                    sizeLimitExceeded = true;
                    proc.kill();
                    return;
                }
                stderrByteLength += data.length;
                stderr += stderrDecoder.write(data);
            });
            await new Promise((resolve, reject) => {
                proc.on('error', reject);
                proc.on('close', (code) => {
                    stdout += stdoutDecoder.end();
                    stderr += stderrDecoder.end();
                    if (sizeLimitExceeded) {
                        return reject(new Error(`Tool discovery command output exceeded size limit of ${MAX_STDOUT_SIZE} bytes.`));
                    }
                    if (code !== 0) {
                        console.error(`Command failed with code ${code}`);
                        console.error(stderr);
                        return reject(new Error(`Tool discovery command failed with exit code ${code}`));
                    }
                    resolve();
                });
            });
            // execute discovery command and extract function declarations (w/ or w/o "tool" wrappers)
            const functions = [];
            const discoveredItems = JSON.parse(stdout.trim());
            if (!discoveredItems || !Array.isArray(discoveredItems)) {
                throw new Error('Tool discovery command did not return a JSON array of tools.');
            }
            for (const tool of discoveredItems) {
                if (tool && typeof tool === 'object') {
                    if (Array.isArray(tool['function_declarations'])) {
                        functions.push(...tool['function_declarations']);
                    }
                    else if (Array.isArray(tool['functionDeclarations'])) {
                        functions.push(...tool['functionDeclarations']);
                    }
                    else if (tool['name']) {
                        functions.push(tool);
                    }
                }
            }
            // register each function as a tool
            for (const func of functions) {
                if (!func.name) {
                    console.warn('Discovered a tool with no name. Skipping.');
                    continue;
                }
                // Sanitize the parameters before registering the tool.
                const parameters = func.parameters &&
                    typeof func.parameters === 'object' &&
                    !Array.isArray(func.parameters)
                    ? func.parameters
                    : {};
                sanitizeParameters(parameters);
                this.registerTool(new DiscoveredTool(this.config, func.name, func.description ?? '', parameters));
            }
        }
        catch (e) {
            console.error(`Tool discovery command "${discoveryCmd}" failed:`, e);
            throw e;
        }
    }
    /**
     * Retrieves the list of tool schemas (FunctionDeclaration array).
     * Extracts the declarations from the ToolListUnion structure.
     * Includes discovered (vs registered) tools if configured.
     * @returns An array of FunctionDeclarations.
     */
    getFunctionDeclarations() {
        const declarations = [];
        this.tools.forEach((tool) => {
            declarations.push(tool.schema);
        });
        return declarations;
    }
    /**
     * Returns an array of all registered and discovered tool instances.
     */
    getAllTools() {
        return Array.from(this.tools.values());
    }
    /**
     * Returns an array of tools registered from a specific MCP server.
     */
    getToolsByServer(serverName) {
        const serverTools = [];
        for (const tool of this.tools.values()) {
            if (tool?.serverName === serverName) {
                serverTools.push(tool);
            }
        }
        return serverTools;
    }
    /**
     * Get the definition of a specific tool.
     */
    getTool(name) {
        return this.tools.get(name);
    }
}
/**
 * Sanitizes a schema object in-place to ensure compatibility with the Gemini API.
 *
 * NOTE: This function mutates the passed schema object.
 *
 * It performs the following actions:
 * - Removes the `default` property when `anyOf` is present.
 * - Removes unsupported `format` values from string properties, keeping only 'enum' and 'date-time'.
 * - Recursively sanitizes nested schemas within `anyOf`, `items`, and `properties`.
 * - Handles circular references within the schema to prevent infinite loops.
 *
 * @param schema The schema object to sanitize. It will be modified directly.
 */
export function sanitizeParameters(schema) {
    _sanitizeParameters(schema, new Set());
}
/**
 * Internal recursive implementation for sanitizeParameters.
 * @param schema The schema object to sanitize.
 * @param visited A set used to track visited schema objects during recursion.
 */
function _sanitizeParameters(schema, visited) {
    if (!schema || visited.has(schema)) {
        return;
    }
    visited.add(schema);
    if (schema.anyOf) {
        // Vertex AI gets confused if both anyOf and default are set.
        schema.default = undefined;
        for (const item of schema.anyOf) {
            if (typeof item !== 'boolean') {
                _sanitizeParameters(item, visited);
            }
        }
    }
    if (schema.items && typeof schema.items !== 'boolean') {
        _sanitizeParameters(schema.items, visited);
    }
    if (schema.properties) {
        for (const item of Object.values(schema.properties)) {
            if (typeof item !== 'boolean') {
                _sanitizeParameters(item, visited);
            }
        }
    }
    // Vertex AI only supports 'enum' and 'date-time' for STRING format.
    if (schema.type === Type.STRING) {
        if (schema.format &&
            schema.format !== 'enum' &&
            schema.format !== 'date-time') {
            schema.format = undefined;
        }
    }
}
//# sourceMappingURL=tool-registry.js.map