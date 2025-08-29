# GeminiForMac 项目上下文

## 项目概述
基于 gemini-cli 的 macOS 桌面客户端项目，为 Google Gemini AI 提供原生图形界面。

## 核心原则
**关键约束**: 只修改 `GeminiForMac/` 和 `packages/core/src/server/` 目录的代码，其他代码为原始 gemini-cli 代码，不做任何修改以保持与上游仓库同步。

## 架构组成

### 1. macOS 客户端 (`GeminiForMac/`)
- **技术栈**: SwiftUI + Swift 
- **主要模块**:
  - `MainView.swift`: 主界面容器
  - `Modules/Input/`: 消息输入组件
  - `Modules/FileExplorer/`: 文件浏览器
  - `Modules/Login/`: 认证登录
  - `Modules/Proxy/`: 代理设置
  - `Services/`: 网络服务和数据管理
  - `Models/`: 数据模型定义

### 2. 后台服务器 (`packages/core/src/server/`)
- **技术栈**: Node.js + TypeScript
- **核心服务**:
  - `core/GeminiService.ts`: Gemini API 集成
  - `auth/AuthService.ts`: 身份验证管理
  - `chat/ChatHandler.ts`: 聊天处理
  - `files/FileService.ts`: 文件操作
  - `project/ProjectService.ts`: 项目管理
  - `utils/ProxyConfigManager.ts`: 代理配置
  - `tools/ToolOrchestrator.ts`: 工具编排

### 3. 通信协议
- **HTTP API**: 基础操作的 REST 接口
- **WebSocket**: 实时聊天和流式响应
- **端口**: 默认使用 18080
- **数据流**: 客户端 → 服务器 → Gemini API → 流式返回

## 开发规范

### 架构模式
- **客户端**: MVVM + Factory DI 依赖注入
- **服务端**: 模块化服务架构
- **响应格式**: `{code, message, data}` 三字段结构

### 项目管理
- **日志**: `~/Library/Logs/GeminiForMac/`
- **配置**: `~/.gemini-server/`
- **服务**: Launch Agent 管理后台服务
- **打包**: PKG 安装包形式分发

### 开发约束
- 只修改客户端和服务端代码
- 保持与原始 gemini-cli 核心功能的兼容
- 中英文本地化支持
- 单元测试采用 TDD 开发模式

## 技术要点
- 代理支持（自动检测 127.0.0.1:7890）
- 文件管理集成
- Markdown 渲染
- 流式响应处理
- 项目切换管理

## 项目文档
- **合并日志**: `merge_logs/` - 记录每次与upstream合并的详细过程和问题解决方案
