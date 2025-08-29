/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as path from 'node:path';
import process from 'node:process';
import { createContentGeneratorConfig, } from '../core/contentGenerator.js';
import { ToolRegistry } from '../tools/tool-registry.js';
import { LSTool } from '../tools/ls.js';
import { ReadFileTool } from '../tools/read-file.js';
import { GrepTool } from '../tools/grep.js';
import { GlobTool } from '../tools/glob.js';
import { EditTool } from '../tools/edit.js';
import { ShellTool } from '../tools/shell.js';
import { WriteFileTool } from '../tools/write-file.js';
import { WebFetchTool } from '../tools/web-fetch.js';
import { ReadManyFilesTool } from '../tools/read-many-files.js';
import { MemoryTool, setGeminiMdFilename, GEMINI_CONFIG_DIR as GEMINI_DIR, } from '../tools/memoryTool.js';
import { WebSearchTool } from '../tools/web-search.js';
import { GeminiClient } from '../core/client.js';
import { FileDiscoveryService } from '../services/fileDiscoveryService.js';
import { GitService } from '../services/gitService.js';
import { loadServerHierarchicalMemory } from '../utils/memoryDiscovery.js';
import { getProjectTempDir } from '../utils/paths.js';
import { initializeTelemetry, DEFAULT_TELEMETRY_TARGET, DEFAULT_OTLP_ENDPOINT, StartSessionEvent, } from '../telemetry/index.js';
import { DEFAULT_GEMINI_EMBEDDING_MODEL, DEFAULT_GEMINI_FLASH_MODEL, } from './models.js';
import { ClearcutLogger } from '../telemetry/clearcut-logger/clearcut-logger.js';
export var ApprovalMode;
(function (ApprovalMode) {
    ApprovalMode["DEFAULT"] = "default";
    ApprovalMode["AUTO_EDIT"] = "autoEdit";
    ApprovalMode["YOLO"] = "yolo";
})(ApprovalMode || (ApprovalMode = {}));
export class MCPServerConfig {
    command;
    args;
    env;
    cwd;
    url;
    httpUrl;
    headers;
    tcp;
    timeout;
    trust;
    description;
    includeTools;
    excludeTools;
    constructor(
    // For stdio transport
    command, args, env, cwd, 
    // For sse transport
    url, 
    // For streamable http transport
    httpUrl, headers, 
    // For websocket transport
    tcp, 
    // Common
    timeout, trust, 
    // Metadata
    description, includeTools, excludeTools) {
        this.command = command;
        this.args = args;
        this.env = env;
        this.cwd = cwd;
        this.url = url;
        this.httpUrl = httpUrl;
        this.headers = headers;
        this.tcp = tcp;
        this.timeout = timeout;
        this.trust = trust;
        this.description = description;
        this.includeTools = includeTools;
        this.excludeTools = excludeTools;
    }
}
export class Config {
    toolRegistry;
    sessionId;
    contentGeneratorConfig;
    embeddingModel;
    sandbox;
    targetDir;
    debugMode;
    question;
    fullContext;
    coreTools;
    excludeTools;
    toolDiscoveryCommand;
    toolCallCommand;
    mcpServerCommand;
    mcpServers;
    userMemory;
    geminiMdFileCount;
    approvalMode;
    showMemoryUsage;
    accessibility;
    telemetrySettings;
    usageStatisticsEnabled;
    geminiClient;
    fileFiltering;
    fileDiscoveryService = null;
    gitService = undefined;
    checkpointing;
    proxy;
    cwd;
    bugCommand;
    model;
    extensionContextFilePaths;
    noBrowser;
    modelSwitchedDuringSession = false;
    maxSessionTurns;
    listExtensions;
    _activeExtensions;
    flashFallbackHandler;
    quotaErrorOccurred = false;
    constructor(params) {
        this.sessionId = params.sessionId;
        this.embeddingModel =
            params.embeddingModel ?? DEFAULT_GEMINI_EMBEDDING_MODEL;
        this.sandbox = params.sandbox;
        this.targetDir = path.resolve(params.targetDir);
        this.debugMode = params.debugMode;
        this.question = params.question;
        this.fullContext = params.fullContext ?? false;
        this.coreTools = params.coreTools;
        this.excludeTools = params.excludeTools;
        this.toolDiscoveryCommand = params.toolDiscoveryCommand;
        this.toolCallCommand = params.toolCallCommand;
        this.mcpServerCommand = params.mcpServerCommand;
        this.mcpServers = params.mcpServers;
        this.userMemory = params.userMemory ?? '';
        this.geminiMdFileCount = params.geminiMdFileCount ?? 0;
        this.approvalMode = params.approvalMode ?? ApprovalMode.DEFAULT;
        this.showMemoryUsage = params.showMemoryUsage ?? false;
        this.accessibility = params.accessibility ?? {};
        this.telemetrySettings = {
            enabled: params.telemetry?.enabled ?? false,
            target: params.telemetry?.target ?? DEFAULT_TELEMETRY_TARGET,
            otlpEndpoint: params.telemetry?.otlpEndpoint ?? DEFAULT_OTLP_ENDPOINT,
            logPrompts: params.telemetry?.logPrompts ?? true,
        };
        this.usageStatisticsEnabled = params.usageStatisticsEnabled ?? true;
        this.fileFiltering = {
            respectGitIgnore: params.fileFiltering?.respectGitIgnore ?? true,
            enableRecursiveFileSearch: params.fileFiltering?.enableRecursiveFileSearch ?? true,
        };
        this.checkpointing = params.checkpointing ?? false;
        this.proxy = params.proxy;
        this.cwd = params.cwd ?? process.cwd();
        this.fileDiscoveryService = params.fileDiscoveryService ?? null;
        this.bugCommand = params.bugCommand;
        this.model = params.model;
        this.extensionContextFilePaths = params.extensionContextFilePaths ?? [];
        this.maxSessionTurns = params.maxSessionTurns ?? -1;
        this.listExtensions = params.listExtensions ?? false;
        this._activeExtensions = params.activeExtensions ?? [];
        this.noBrowser = params.noBrowser ?? false;
        if (params.contextFileName) {
            setGeminiMdFilename(params.contextFileName);
        }
        if (this.telemetrySettings.enabled) {
            initializeTelemetry(this);
        }
        if (this.getUsageStatisticsEnabled()) {
            ClearcutLogger.getInstance(this)?.logStartSessionEvent(new StartSessionEvent(this));
        }
        else {
            console.log('Data collection is disabled.');
        }
    }
    async initialize() {
        // Initialize centralized FileDiscoveryService
        this.getFileService();
        if (this.getCheckpointingEnabled()) {
            try {
                await this.getGitService();
            }
            catch {
                // For now swallow the error, later log it.
            }
        }
        this.toolRegistry = await this.createToolRegistry();
    }
    async refreshAuth(authMethod) {
        this.contentGeneratorConfig = await createContentGeneratorConfig(this.model, authMethod);
        this.geminiClient = new GeminiClient(this);
        await this.geminiClient.initialize(this.contentGeneratorConfig);
        // Reset the session flag since we're explicitly changing auth and using default model
        this.modelSwitchedDuringSession = false;
    }
    getSessionId() {
        return this.sessionId;
    }
    getContentGeneratorConfig() {
        return this.contentGeneratorConfig;
    }
    getModel() {
        return this.contentGeneratorConfig?.model || this.model;
    }
    setModel(newModel) {
        // 如果 contentGeneratorConfig 存在，直接更新它
        if (this.contentGeneratorConfig) {
            this.contentGeneratorConfig.model = newModel;
            this.modelSwitchedDuringSession = true;
            console.log('Config: 模型已切换到', newModel);
        }
        else {
            // 如果 contentGeneratorConfig 不存在，标记需要重新初始化
            console.log('Config: contentGeneratorConfig 不存在，模型切换将在下次初始化时生效');
            this.modelSwitchedDuringSession = true;
        }
    }
    /**
     * 设置 ContentGeneratorConfig
     */
    setContentGeneratorConfig(config) {
        this.contentGeneratorConfig = config;
        console.log('Config: ContentGeneratorConfig 已设置', { model: config.model });
    }
    isModelSwitchedDuringSession() {
        return this.modelSwitchedDuringSession;
    }
    resetModelToDefault() {
        if (this.contentGeneratorConfig) {
            this.contentGeneratorConfig.model = this.model; // Reset to the original default model
            this.modelSwitchedDuringSession = false;
        }
    }
    setFlashFallbackHandler(handler) {
        this.flashFallbackHandler = handler;
    }
    getMaxSessionTurns() {
        return this.maxSessionTurns;
    }
    setQuotaErrorOccurred(value) {
        this.quotaErrorOccurred = value;
    }
    getQuotaErrorOccurred() {
        return this.quotaErrorOccurred;
    }
    async getUserTier() {
        if (!this.geminiClient) {
            return undefined;
        }
        const generator = this.geminiClient.getContentGenerator();
        return await generator.getTier?.();
    }
    getEmbeddingModel() {
        return this.embeddingModel;
    }
    getSandbox() {
        return this.sandbox;
    }
    getTargetDir() {
        return this.targetDir;
    }
    getProjectRoot() {
        return this.targetDir;
    }
    getToolRegistry() {
        return Promise.resolve(this.toolRegistry);
    }
    getDebugMode() {
        return this.debugMode;
    }
    getQuestion() {
        return this.question;
    }
    getFullContext() {
        return this.fullContext;
    }
    getCoreTools() {
        return this.coreTools;
    }
    getExcludeTools() {
        return this.excludeTools;
    }
    getToolDiscoveryCommand() {
        return this.toolDiscoveryCommand;
    }
    getToolCallCommand() {
        return this.toolCallCommand;
    }
    getMcpServerCommand() {
        return this.mcpServerCommand;
    }
    getMcpServers() {
        return this.mcpServers;
    }
    getUserMemory() {
        return this.userMemory;
    }
    setUserMemory(newUserMemory) {
        this.userMemory = newUserMemory;
    }
    getGeminiMdFileCount() {
        return this.geminiMdFileCount;
    }
    setGeminiMdFileCount(count) {
        this.geminiMdFileCount = count;
    }
    getApprovalMode() {
        return this.approvalMode;
    }
    setApprovalMode(mode) {
        this.approvalMode = mode;
    }
    getShowMemoryUsage() {
        return this.showMemoryUsage;
    }
    getAccessibility() {
        return this.accessibility;
    }
    getTelemetryEnabled() {
        return this.telemetrySettings.enabled ?? false;
    }
    getTelemetryLogPromptsEnabled() {
        return this.telemetrySettings.logPrompts ?? true;
    }
    getTelemetryOtlpEndpoint() {
        return this.telemetrySettings.otlpEndpoint ?? DEFAULT_OTLP_ENDPOINT;
    }
    getTelemetryTarget() {
        return this.telemetrySettings.target ?? DEFAULT_TELEMETRY_TARGET;
    }
    getGeminiClient() {
        return this.geminiClient;
    }
    getGeminiDir() {
        return path.join(this.targetDir, GEMINI_DIR);
    }
    getProjectTempDir() {
        return getProjectTempDir(this.getProjectRoot());
    }
    getEnableRecursiveFileSearch() {
        return this.fileFiltering.enableRecursiveFileSearch;
    }
    getFileFilteringRespectGitIgnore() {
        return this.fileFiltering.respectGitIgnore;
    }
    getCheckpointingEnabled() {
        return this.checkpointing;
    }
    getProxy() {
        return this.proxy;
    }
    getWorkingDir() {
        return this.cwd;
    }
    getBugCommand() {
        return this.bugCommand;
    }
    getFileService() {
        if (!this.fileDiscoveryService) {
            this.fileDiscoveryService = new FileDiscoveryService(this.targetDir);
        }
        return this.fileDiscoveryService;
    }
    getUsageStatisticsEnabled() {
        return this.usageStatisticsEnabled;
    }
    getExtensionContextFilePaths() {
        return this.extensionContextFilePaths;
    }
    getListExtensions() {
        return this.listExtensions;
    }
    getActiveExtensions() {
        return this._activeExtensions;
    }
    getNoBrowser() {
        return this.noBrowser;
    }
    async getGitService() {
        if (!this.gitService) {
            this.gitService = new GitService(this.targetDir);
            await this.gitService.initialize();
        }
        return this.gitService;
    }
    async refreshMemory() {
        const { memoryContent, fileCount } = await loadServerHierarchicalMemory(this.getWorkingDir(), this.getDebugMode(), this.getFileService(), this.getExtensionContextFilePaths());
        this.setUserMemory(memoryContent);
        this.setGeminiMdFileCount(fileCount);
        return { memoryContent, fileCount };
    }
    async createToolRegistry() {
        const registry = new ToolRegistry(this);
        const targetDir = this.getTargetDir();
        // helper to create & register core tools that are enabled
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const registerCoreTool = (ToolClass, ...args) => {
            const className = ToolClass.name;
            const toolName = ToolClass.Name || className;
            const coreTools = this.getCoreTools();
            const excludeTools = this.getExcludeTools();
            let isEnabled = false;
            if (coreTools === undefined) {
                isEnabled = true;
            }
            else {
                isEnabled = coreTools.some((tool) => tool === className ||
                    tool === toolName ||
                    tool.startsWith(`${className}(`) ||
                    tool.startsWith(`${toolName}(`));
            }
            if (excludeTools?.includes(className) ||
                excludeTools?.includes(toolName)) {
                isEnabled = false;
            }
            if (isEnabled) {
                registry.registerTool(new ToolClass(...args));
            }
        };
        registerCoreTool(LSTool, targetDir, this);
        registerCoreTool(ReadFileTool, targetDir, this);
        registerCoreTool(GrepTool, targetDir);
        registerCoreTool(GlobTool, targetDir, this);
        registerCoreTool(EditTool, this);
        registerCoreTool(WriteFileTool, this);
        registerCoreTool(WebFetchTool, this);
        registerCoreTool(ReadManyFilesTool, targetDir, this);
        registerCoreTool(ShellTool, this);
        registerCoreTool(MemoryTool);
        registerCoreTool(WebSearchTool, this);
        await registry.discoverTools();
        return registry;
    }
}
// Export model constants for use in CLI
export { DEFAULT_GEMINI_FLASH_MODEL };
// Export createToolRegistry function for use in other modules
export async function createToolRegistry(config) {
    return config.createToolRegistry();
}
//# sourceMappingURL=config.js.map