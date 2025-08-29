#!/usr/bin/env node

import { APIServer } from './src/server.js';

const port = parseInt(process.env.PORT || '8080', 10);
const server = new APIServer(port);

// 使用async立即执行函数来处理异步启动
(async () => {
    try {
        await server.start();
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
})();

// 处理优雅关闭
process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    server.stop();
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    server.stop();
}); 