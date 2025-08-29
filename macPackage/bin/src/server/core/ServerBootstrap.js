/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { configFactory } from './ConfigFactory.js';
import { ConfigCache } from './ConfigCache.js';
import { DEFAULT_GEMINI_FLASH_MODEL } from '../../config/models.js';
import * as process from 'node:process';
/**
 * 服务器启动引导器 - 负责预初始化服务
 *
 * 在服务器启动时执行以下初始化：
 * 1. 清理过期缓存
 * 2. 尝试从缓存加载最近使用的工作区配置
 * 3. 预初始化 ConfigFactory
 * 4. 设置默认工作区（如果有缓存）
 */
export class ServerBootstrap {
    initialized = false;
    defaultWorkspace = null;
    /**
     * 执行服务器预初始化
     */
    async initialize() {
        if (this.initialized) {
            console.log('ServerBootstrap: 已经初始化过，跳过');
            return;
        }
        console.log('🔧 ServerBootstrap: 开始服务器预初始化...');
        try {
            // 1. 清理过期缓存
            this.cleanupExpiredCache();
            // 2. 尝试预加载最近使用的工作区
            await this.preloadRecentWorkspace();
            // 3. 验证初始化状态
            this.verifyInitialization();
            this.initialized = true;
            console.log('✅ ServerBootstrap: 服务器预初始化完成');
        }
        catch (error) {
            console.warn('⚠️ ServerBootstrap: 预初始化部分失败，服务器仍可正常启动', error);
            // 即使预初始化失败，服务器仍然可以启动，只是没有预加载的优势
        }
    }
    /**
     * 获取预加载的默认工作区
     */
    getDefaultWorkspace() {
        return this.defaultWorkspace;
    }
    /**
     * 检查是否已初始化
     */
    isInitialized() {
        return this.initialized;
    }
    /**
     * 清理过期缓存
     */
    cleanupExpiredCache() {
        try {
            console.log('🧹 ServerBootstrap: 清理过期配置缓存...');
            ConfigCache.cleanupExpiredCache();
        }
        catch (error) {
            console.warn('ServerBootstrap: 清理过期缓存失败', error);
        }
    }
    /**
     * 预加载最近使用的工作区
     */
    async preloadRecentWorkspace() {
        try {
            // 获取所有缓存的工作区
            const cachedWorkspaces = ConfigCache.getCachedWorkspaces();
            if (cachedWorkspaces.length === 0) {
                console.log('ServerBootstrap: 没有找到缓存的工作区，使用当前目录作为默认工作区');
                await this.initializeDefaultWorkspace(process.cwd());
                return;
            }
            // 选择最近使用的工作区（这里选择第一个，也可以根据时间戳选择）
            const recentWorkspace = cachedWorkspaces[0];
            console.log(`🔄 ServerBootstrap: 预加载最近使用的工作区: ${recentWorkspace}`);
            // 验证工作区路径是否仍然存在
            const fs = await import('node:fs');
            if (!fs.existsSync(recentWorkspace)) {
                console.warn(`ServerBootstrap: 缓存的工作区路径不存在: ${recentWorkspace}`);
                // 删除无效的缓存
                ConfigCache.removeCachedConfig(recentWorkspace);
                // 使用当前目录作为默认工作区
                await this.initializeDefaultWorkspace(process.cwd());
                return;
            }
            // 预初始化这个工作区
            await this.initializeDefaultWorkspace(recentWorkspace);
        }
        catch (error) {
            console.warn('ServerBootstrap: 预加载工作区失败，使用当前目录', error);
            await this.initializeDefaultWorkspace(process.cwd());
        }
    }
    /**
     * 初始化默认工作区
     */
    async initializeDefaultWorkspace(workspacePath) {
        try {
            console.log(`🏗️ ServerBootstrap: 初始化默认工作区: ${workspacePath}`);
            // 创建工作区容器
            await configFactory.createWorkspaceContainer({
                targetDir: workspacePath,
                debugMode: false,
                model: DEFAULT_GEMINI_FLASH_MODEL,
                cwd: workspacePath
            });
            this.defaultWorkspace = workspacePath;
            console.log(`✅ ServerBootstrap: 默认工作区初始化完成: ${workspacePath}`);
        }
        catch (error) {
            console.warn(`ServerBootstrap: 初始化工作区失败: ${workspacePath}`, error);
            // 不抛出错误，让服务器继续启动
        }
    }
    /**
     * 验证初始化状态
     */
    verifyInitialization() {
        const isFactoryInitialized = configFactory.isFactoryInitialized();
        const authService = configFactory.getAuthService();
        console.log('🔍 ServerBootstrap: 验证初始化状态');
        console.log(`  - ConfigFactory: ${isFactoryInitialized ? '✅ 已初始化' : '❌ 未初始化'}`);
        console.log(`  - AuthService: ${authService.isConfigured() ? '✅ 已配置' : '⚠️ 未配置'}`);
        console.log(`  - 默认工作区: ${this.defaultWorkspace || '❌ 未设置'}`);
    }
    /**
     * 重置初始化状态（用于测试）
     */
    reset() {
        this.initialized = false;
        this.defaultWorkspace = null;
    }
}
// 导出单例实例
export const serverBootstrap = new ServerBootstrap();
//# sourceMappingURL=ServerBootstrap.js.map