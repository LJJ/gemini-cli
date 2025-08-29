/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { MCPServerConfig } from '../config/config.js';
import { ToolRegistry } from './tool-registry.js';
export declare const MCP_DEFAULT_TIMEOUT_MSEC: number;
/**
 * Enum representing the connection status of an MCP server
 */
export declare enum MCPServerStatus {
    /** Server is disconnected or experiencing errors */
    DISCONNECTED = "disconnected",
    /** Server is in the process of connecting */
    CONNECTING = "connecting",
    /** Server is connected and ready to use */
    CONNECTED = "connected"
}
/**
 * Enum representing the overall MCP discovery state
 */
export declare enum MCPDiscoveryState {
    /** Discovery has not started yet */
    NOT_STARTED = "not_started",
    /** Discovery is currently in progress */
    IN_PROGRESS = "in_progress",
    /** Discovery has completed (with or without errors) */
    COMPLETED = "completed"
}
/**
 * Event listeners for MCP server status changes
 */
type StatusChangeListener = (serverName: string, status: MCPServerStatus) => void;
/**
 * Add a listener for MCP server status changes
 */
export declare function addMCPStatusChangeListener(listener: StatusChangeListener): void;
/**
 * Remove a listener for MCP server status changes
 */
export declare function removeMCPStatusChangeListener(listener: StatusChangeListener): void;
/**
 * Get the current status of an MCP server
 */
export declare function getMCPServerStatus(serverName: string): MCPServerStatus;
/**
 * Get all MCP server statuses
 */
export declare function getAllMCPServerStatuses(): Map<string, MCPServerStatus>;
/**
 * Get the current MCP discovery state
 */
export declare function getMCPDiscoveryState(): MCPDiscoveryState;
export declare function discoverMcpTools(mcpServers: Record<string, MCPServerConfig>, mcpServerCommand: string | undefined, toolRegistry: ToolRegistry, debugMode: boolean): Promise<void>;
export {};
