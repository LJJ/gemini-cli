/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'fs';
import path from 'path';
import express from 'express';
import { ResponseFactory } from '../utils/responseFactory.js';
import { glob } from 'glob';

export class FileService {
  public async listDirectory(req: express.Request, res: express.Response) {
    try {
      const dirPath = req.query['path'] as string || '.';
      const fullPath = path.resolve(dirPath);
      const items = await fs.readdir(fullPath, { withFileTypes: true });
      const directoryItems = items.map(item => ({
        name: item.name,
        type: item.isDirectory() ? 'directory' : 'file',
        path: path.join(fullPath, item.name)
      }));
      return res.json(ResponseFactory.listDirectory(fullPath, directoryItems));
    } catch (error) {
      return res.status(500).json(ResponseFactory.internalError(error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  public async searchFiles(req: express.Request, res: express.Response) {
    try {
      const { query, currentPath, searchType = 'all', maxResults = 100 } = req.body;
      
      if (!query) {
        return res.status(400).json(ResponseFactory.validationError('query', 'Search query is required'));
      }

      const searchPath = path.resolve(currentPath || '.');
      
      // 构建搜索模式
      let patterns: string[] = [];
      
      if (searchType === 'all' || searchType === 'file') {
        patterns.push(`**/*${query}*`);
      }
      if (searchType === 'all' || searchType === 'directory') {
        patterns.push(`**/*${query}*/`);
      }

      // 使用 glob 进行搜索
      const entries = await glob(patterns, {
        cwd: searchPath,
        absolute: true,
        nocase: true,
        dot: false,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
      });

      // 转换为统一的目录项格式
      const items = await Promise.all(
        entries.slice(0, maxResults).map(async (fullPath) => {
          try {
            const stats = await fs.stat(fullPath);
            const relativePath = path.relative(searchPath, fullPath);
            
            return {
              name: path.basename(fullPath),
              type: stats.isDirectory() ? 'directory' : 'file',
              path: fullPath,
              // 添加额外信息用于搜索结果显示
              relativePath: relativePath,
              matchType: 'name' // 暂时只支持文件名匹配
            };
          } catch (err) {
            // 忽略无法访问的文件
            return null;
          }
        })
      );

      // 过滤掉无效的项目
      const validItems = items.filter(item => item !== null);

      // 按类型和名称排序：目录在前，文件在后
      validItems.sort((a, b) => {
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });

      // 使用现有的 ResponseFactory.listDirectory 方法
      return res.json(ResponseFactory.listDirectory(searchPath, validItems));
      
    } catch (error) {
      return res.status(500).json(ResponseFactory.internalError(error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  public async readFile(req: express.Request, res: express.Response) {
    try {
      const { path: filePath } = req.body;
      if (!filePath) {
        return res.status(400).json(ResponseFactory.validationError('path', 'File path is required'));
      }
      const content = await fs.readFile(filePath, 'utf-8');
      return res.json(ResponseFactory.readFile(filePath, content, true));
    } catch (error) {
      return res.status(500).json(ResponseFactory.readFile(req.body.path, null, false, error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  public async writeFile(req: express.Request, res: express.Response) {
    try {
      const { path: filePath, content } = req.body;
      if (!filePath || content === undefined) {
        return res.status(400).json(ResponseFactory.validationError('path/content', 'File path and content are required'));
      }
      await fs.writeFile(filePath, content, 'utf-8');
      return res.json(ResponseFactory.writeFile(filePath, content, true));
    } catch (error) {
      return res.status(500).json(ResponseFactory.writeFile(req.body.path, req.body.content, false, error instanceof Error ? error.message : 'Unknown error'));
    }
  }
} 