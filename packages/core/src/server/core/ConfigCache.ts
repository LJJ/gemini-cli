/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { Config } from '../../config/config.js';
import type { ConfigParameters } from '../../config/config.js';

/**
 * 可序列化的配置参数（用于缓存）
 */
export interface CacheableConfig {
  sessionId: string;
  targetDir: string;
  debugMode: boolean;
  model: string;
  proxy?: string;
  cwd: string;
  timestamp: number; // 缓存时间戳
}

/**
 * 配置缓存管理器
 * 负责将Config对象的参数持久化到本地文件系统
 */
export class ConfigCache {
  private static readonly CACHE_DIR = path.join(os.homedir(), '.gemini-cli', 'cache');
  private static readonly CONFIG_CACHE_FILE = path.join(ConfigCache.CACHE_DIR, 'config-cache.json');
  private static readonly CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24小时过期

  /**
   * 确保缓存目录存在
   */
  private static ensureCacheDir(): void {
    if (!fs.existsSync(ConfigCache.CACHE_DIR)) {
      fs.mkdirSync(ConfigCache.CACHE_DIR, { recursive: true });
    }
  }

  /**
   * 将Config对象的关键参数保存到缓存
   * @param config 要缓存的Config对象
   * @param workspaceKey 工作区标识符（通常是targetDir的路径）
   */
  public static saveConfigToCache(config: Config, workspaceKey: string): void {
    try {
      ConfigCache.ensureCacheDir();

      const cacheableConfig: CacheableConfig = {
        sessionId: config.getSessionId(),
        targetDir: config.getTargetDir(),
        debugMode: config.getDebugMode(),
        model: config.getModel(),
        proxy: config.getProxy(),
        cwd: config.getWorkingDir(),
        timestamp: Date.now()
      };

      // 读取现有缓存或创建新的
      let cacheData: Record<string, CacheableConfig> = {};
      if (fs.existsSync(ConfigCache.CONFIG_CACHE_FILE)) {
        try {
          const existingData = fs.readFileSync(ConfigCache.CONFIG_CACHE_FILE, 'utf-8');
          cacheData = JSON.parse(existingData);
        } catch (error) {
          console.warn('ConfigCache: 读取现有缓存失败，创建新缓存', error);
        }
      }

      // 更新缓存数据
      cacheData[workspaceKey] = cacheableConfig;

      // 写入缓存文件
      fs.writeFileSync(ConfigCache.CONFIG_CACHE_FILE, JSON.stringify(cacheData, null, 2));
      console.log(`ConfigCache: 配置已缓存到 ${workspaceKey}`);

    } catch (error) {
      console.error('ConfigCache: 保存配置缓存失败', error);
    }
  }

  /**
   * 从缓存中恢复Config参数
   * @param workspaceKey 工作区标识符
   * @returns 缓存的配置参数，如果不存在或已过期则返回null
   */
  public static loadConfigFromCache(workspaceKey: string): CacheableConfig | null {
    try {
      if (!fs.existsSync(ConfigCache.CONFIG_CACHE_FILE)) {
        console.log('ConfigCache: 缓存文件不存在');
        return null;
      }

      const cacheData = JSON.parse(fs.readFileSync(ConfigCache.CONFIG_CACHE_FILE, 'utf-8'));
      const cachedConfig = cacheData[workspaceKey];

      if (!cachedConfig) {
        console.log(`ConfigCache: 工作区 ${workspaceKey} 没有缓存配置`);
        return null;
      }

      // 检查缓存是否过期
      const now = Date.now();
      if (now - cachedConfig.timestamp > ConfigCache.CACHE_EXPIRY_MS) {
        console.log(`ConfigCache: 工作区 ${workspaceKey} 的缓存已过期`);
        ConfigCache.removeCachedConfig(workspaceKey);
        return null;
      }

      console.log(`ConfigCache: 从缓存恢复工作区 ${workspaceKey} 的配置`);
      return cachedConfig;

    } catch (error) {
      console.error('ConfigCache: 加载配置缓存失败', error);
      return null;
    }
  }

  /**
   * 将缓存的配置参数转换为ConfigParameters
   * @param cachedConfig 缓存的配置
   * @param overrides 可选的覆盖参数
   * @returns ConfigParameters对象
   */
  public static toConfigParameters(
    cachedConfig: CacheableConfig, 
    overrides: Partial<ConfigParameters> = {}
  ): ConfigParameters {
    return {
      sessionId: overrides.sessionId || `restored-${Date.now()}`, // 使用新的sessionId
      targetDir: overrides.targetDir || cachedConfig.targetDir,
      debugMode: overrides.debugMode ?? cachedConfig.debugMode,
      model: overrides.model || cachedConfig.model,
      proxy: overrides.proxy || cachedConfig.proxy,
      cwd: overrides.cwd || cachedConfig.cwd,
    };
  }

  /**
   * 删除特定工作区的缓存配置
   * @param workspaceKey 工作区标识符
   */
  public static removeCachedConfig(workspaceKey: string): void {
    try {
      if (!fs.existsSync(ConfigCache.CONFIG_CACHE_FILE)) {
        return;
      }

      const cacheData = JSON.parse(fs.readFileSync(ConfigCache.CONFIG_CACHE_FILE, 'utf-8'));
      delete cacheData[workspaceKey];

      fs.writeFileSync(ConfigCache.CONFIG_CACHE_FILE, JSON.stringify(cacheData, null, 2));
      console.log(`ConfigCache: 已删除工作区 ${workspaceKey} 的缓存配置`);

    } catch (error) {
      console.error('ConfigCache: 删除配置缓存失败', error);
    }
  }

  /**
   * 清理所有过期的缓存
   */
  public static cleanupExpiredCache(): void {
    try {
      if (!fs.existsSync(ConfigCache.CONFIG_CACHE_FILE)) {
        return;
      }

      const cacheData = JSON.parse(fs.readFileSync(ConfigCache.CONFIG_CACHE_FILE, 'utf-8'));
      const now = Date.now();
      let hasChanges = false;

      for (const [workspaceKey, cachedConfig] of Object.entries(cacheData)) {
        if (now - (cachedConfig as CacheableConfig).timestamp > ConfigCache.CACHE_EXPIRY_MS) {
          delete cacheData[workspaceKey];
          hasChanges = true;
          console.log(`ConfigCache: 清理过期缓存 ${workspaceKey}`);
        }
      }

      if (hasChanges) {
        fs.writeFileSync(ConfigCache.CONFIG_CACHE_FILE, JSON.stringify(cacheData, null, 2));
        console.log('ConfigCache: 过期缓存清理完成');
      }

    } catch (error) {
      console.error('ConfigCache: 清理过期缓存失败', error);
    }
  }

  /**
   * 获取所有缓存的工作区列表
   * @returns 工作区键名数组
   */
  public static getCachedWorkspaces(): string[] {
    try {
      if (!fs.existsSync(ConfigCache.CONFIG_CACHE_FILE)) {
        return [];
      }

      const cacheData = JSON.parse(fs.readFileSync(ConfigCache.CONFIG_CACHE_FILE, 'utf-8'));
      return Object.keys(cacheData);

    } catch (error) {
      console.error('ConfigCache: 获取缓存工作区列表失败', error);
      return [];
    }
  }
}