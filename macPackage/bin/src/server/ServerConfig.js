/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import express from 'express';
import cors from 'cors';
export class ServerConfig {
    app;
    port;
    constructor(port = 8080) {
        this.app = express();
        this.port = port;
        this.setupMiddleware();
    }
    setupMiddleware() {
        // 允许跨域请求
        this.app.use(cors());
        // 解析 JSON 请求体
        this.app.use(express.json());
        // 请求日志
        this.app.use((req, res, next) => {
            console.log(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            next();
        });
        // 认证中间件
        this.app.use((req, res, next) => {
            // 跳过认证相关的路径
            if (req.path.startsWith('/auth') || req.path === '/status') {
                return next();
            }
            // 检查认证状态
            // 这里可以添加认证检查逻辑
            next();
        });
    }
    getApp() {
        return this.app;
    }
    getPort() {
        return this.port;
    }
    addErrorHandler() {
        // 错误处理中间件
        this.app.use((err, req, res, next) => {
            console.error('API Error:', err);
            res.status(500).json({
                error: 'Internal Server Error',
                message: err.message
            });
        });
    }
}
//# sourceMappingURL=ServerConfig.js.map