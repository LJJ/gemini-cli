/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType, ContentGeneratorConfig } from '../core/contentGenerator.js';
import { UserTierId } from '../code_assist/types.js';
import { ToolRegistry } from '../tools/tool-registry.js';
import { GeminiClient } from '../core/client.js';
import { FileDiscoveryService } from '../services/fileDiscoveryService.js';
import { GitService } from '../services/gitService.js';
import { TelemetryTarget } from '../telemetry/index.js';
import { DEFAULT_GEMINI_FLASH_MODEL } from './models.js';
export declare enum ApprovalMode {
    DEFAULT = "default",
    AUTO_EDIT = "autoEdit",
    YOLO = "yolo"
}
export interface AccessibilitySettings {
    disableLoadingPhrases?: boolean;
}
export interface BugCommandSettings {
    urlTemplate: string;
}
export interface TelemetrySettings {
    enabled?: boolean;
    target?: TelemetryTarget;
    otlpEndpoint?: string;
    logPrompts?: boolean;
}
export interface ActiveExtension {
    name: string;
    version: string;
}
export declare class MCPServerConfig {
    readonly command?: string | undefined;
    readonly args?: string[] | undefined;
    readonly env?: Record<string, string> | undefined;
    readonly cwd?: string | undefined;
    readonly url?: string | undefined;
    readonly httpUrl?: string | undefined;
    readonly headers?: Record<string, string> | undefined;
    readonly tcp?: string | undefined;
    readonly timeout?: number | undefined;
    readonly trust?: boolean | undefined;
    readonly description?: string | undefined;
    readonly includeTools?: string[] | undefined;
    readonly excludeTools?: string[] | undefined;
    constructor(command?: string | undefined, args?: string[] | undefined, env?: Record<string, string> | undefined, cwd?: string | undefined, url?: string | undefined, httpUrl?: string | undefined, headers?: Record<string, string> | undefined, tcp?: string | undefined, timeout?: number | undefined, trust?: boolean | undefined, description?: string | undefined, includeTools?: string[] | undefined, excludeTools?: string[] | undefined);
}
export interface SandboxConfig {
    command: 'docker' | 'podman' | 'sandbox-exec';
    image: string;
}
export type FlashFallbackHandler = (currentModel: string, fallbackModel: string, error?: unknown) => Promise<boolean | string | null>;
export interface ConfigParameters {
    sessionId: string;
    embeddingModel?: string;
    sandbox?: SandboxConfig;
    targetDir: string;
    debugMode: boolean;
    question?: string;
    fullContext?: boolean;
    coreTools?: string[];
    excludeTools?: string[];
    toolDiscoveryCommand?: string;
    toolCallCommand?: string;
    mcpServerCommand?: string;
    mcpServers?: Record<string, MCPServerConfig>;
    userMemory?: string;
    geminiMdFileCount?: number;
    approvalMode?: ApprovalMode;
    showMemoryUsage?: boolean;
    contextFileName?: string | string[];
    accessibility?: AccessibilitySettings;
    telemetry?: TelemetrySettings;
    usageStatisticsEnabled?: boolean;
    fileFiltering?: {
        respectGitIgnore?: boolean;
        enableRecursiveFileSearch?: boolean;
    };
    checkpointing?: boolean;
    proxy?: string;
    cwd: string;
    fileDiscoveryService?: FileDiscoveryService;
    bugCommand?: BugCommandSettings;
    model: string;
    extensionContextFilePaths?: string[];
    maxSessionTurns?: number;
    listExtensions?: boolean;
    activeExtensions?: ActiveExtension[];
    noBrowser?: boolean;
}
export declare class Config {
    private toolRegistry;
    private readonly sessionId;
    private contentGeneratorConfig;
    private readonly embeddingModel;
    private readonly sandbox;
    private readonly targetDir;
    private readonly debugMode;
    private readonly question;
    private readonly fullContext;
    private readonly coreTools;
    private readonly excludeTools;
    private readonly toolDiscoveryCommand;
    private readonly toolCallCommand;
    private readonly mcpServerCommand;
    private readonly mcpServers;
    private userMemory;
    private geminiMdFileCount;
    private approvalMode;
    private readonly showMemoryUsage;
    private readonly accessibility;
    private readonly telemetrySettings;
    private readonly usageStatisticsEnabled;
    private geminiClient;
    private readonly fileFiltering;
    private fileDiscoveryService;
    private gitService;
    private readonly checkpointing;
    private readonly proxy;
    private readonly cwd;
    private readonly bugCommand;
    private readonly model;
    private readonly extensionContextFilePaths;
    private readonly noBrowser;
    private modelSwitchedDuringSession;
    private readonly maxSessionTurns;
    private readonly listExtensions;
    private readonly _activeExtensions;
    flashFallbackHandler?: FlashFallbackHandler;
    private quotaErrorOccurred;
    constructor(params: ConfigParameters);
    initialize(): Promise<void>;
    refreshAuth(authMethod: AuthType): Promise<void>;
    getSessionId(): string;
    getContentGeneratorConfig(): ContentGeneratorConfig;
    getModel(): string;
    setModel(newModel: string): void;
    /**
     * 设置 ContentGeneratorConfig
     */
    setContentGeneratorConfig(config: ContentGeneratorConfig): void;
    isModelSwitchedDuringSession(): boolean;
    resetModelToDefault(): void;
    setFlashFallbackHandler(handler: FlashFallbackHandler): void;
    getMaxSessionTurns(): number;
    setQuotaErrorOccurred(value: boolean): void;
    getQuotaErrorOccurred(): boolean;
    getUserTier(): Promise<UserTierId | undefined>;
    getEmbeddingModel(): string;
    getSandbox(): SandboxConfig | undefined;
    getTargetDir(): string;
    getProjectRoot(): string;
    getToolRegistry(): Promise<ToolRegistry>;
    getDebugMode(): boolean;
    getQuestion(): string | undefined;
    getFullContext(): boolean;
    getCoreTools(): string[] | undefined;
    getExcludeTools(): string[] | undefined;
    getToolDiscoveryCommand(): string | undefined;
    getToolCallCommand(): string | undefined;
    getMcpServerCommand(): string | undefined;
    getMcpServers(): Record<string, MCPServerConfig> | undefined;
    getUserMemory(): string;
    setUserMemory(newUserMemory: string): void;
    getGeminiMdFileCount(): number;
    setGeminiMdFileCount(count: number): void;
    getApprovalMode(): ApprovalMode;
    setApprovalMode(mode: ApprovalMode): void;
    getShowMemoryUsage(): boolean;
    getAccessibility(): AccessibilitySettings;
    getTelemetryEnabled(): boolean;
    getTelemetryLogPromptsEnabled(): boolean;
    getTelemetryOtlpEndpoint(): string;
    getTelemetryTarget(): TelemetryTarget;
    getGeminiClient(): GeminiClient;
    getGeminiDir(): string;
    getProjectTempDir(): string;
    getEnableRecursiveFileSearch(): boolean;
    getFileFilteringRespectGitIgnore(): boolean;
    getCheckpointingEnabled(): boolean;
    getProxy(): string | undefined;
    getWorkingDir(): string;
    getBugCommand(): BugCommandSettings | undefined;
    getFileService(): FileDiscoveryService;
    getUsageStatisticsEnabled(): boolean;
    getExtensionContextFilePaths(): string[];
    getListExtensions(): boolean;
    getActiveExtensions(): ActiveExtension[];
    getNoBrowser(): boolean;
    getGitService(): Promise<GitService>;
    refreshMemory(): Promise<{
        memoryContent: string;
        fileCount: number;
    }>;
    createToolRegistry(): Promise<ToolRegistry>;
}
export { DEFAULT_GEMINI_FLASH_MODEL };
export declare function createToolRegistry(config: Config): Promise<ToolRegistry>;
