# macOS 应用打包与分发计划

**目标:** 创建一个统一的安装包，将 `GeminiForMac` UI 应用和后端的 `gemini-server` 服务一同分发给用户。用户安装后，后端服务应作为后台进程自动启动，且不受 macOS 沙盒机制的限制，以保证其完整的 CLI 功能。

---

## 核心架构：Launch Agent 方案

为了绕开 App 沙盒对后端服务文件系统和 shell 访问权限的限制，我们采用 **UI 与服务分离** 的架构。

-   **`GeminiForMac.app` (UI 层)**: 一个标准的、**沙盒化**的 SwiftUI 应用。它只负责图形界面和与后台服务的通信。
-   **`gemini-server` (服务层)**: 一个由 Node.js 打包的**非沙盒化**的独立可执行文件。它拥有完整的系统访问权限，负责执行所有核心 `gemini-cli` 逻辑。
-   **`launchd` (系统服务管理器)**: 我们将使用 macOS 的 `launchd` 系统服务来管理 `gemini-server` 的生命周期，通过一个 `Launch Agent` 的 `plist` 配置文件来实现用户登录时自动启动和进程守护。
-   **通信机制**: UI 与服务之间通过本地回环网络地址 (`http://localhost:8080`) 进行通信。

---

## 实施步骤

### ✅ 1. 打包 Node.js 服务端

-   **任务**: 将 `packages/core` 目录下的 Node.js 项目（包括所有 `node_modules` 依赖）打包成一个单一的、无需 Node.js 环境的二进制可执行文件。
-   **工具**: 使用 `pkg` 库。
-   **产物**: 一个名为 `gemini-server` 的可执行文件。
-   **状态**: ✅ 已完成配置，添加了 `pkg` 依赖和 `package` 脚本。

### ✅ 2. 创建 Launch Agent 配置文件

-   **任务**: 创建一个 `.plist` 文件来告诉 `launchd` 如何管理我们的服务。
-   **文件名**: `com.gemini.cli.server.plist`
-   **核心配置**:
    -   `Label`: 服务的唯一标识符 (`com.gemini.cli.server`)。
    -   `ProgramArguments`: `gemini-server` 可执行文件的绝对路径。
    -   `RunAtLoad`: `true`，确保用户登录时服务自动启动。
    -   `KeepAlive`: `true`，确保服务在意外崩溃后能自动重启。
    -   `StandardOutPath` / `StandardErrorPath`: 指定日志文件的输出路径，便于调试。
    -   `EnvironmentVariables`: 设置 `PORT=8080` 和 `NODE_ENV=production`。
-   **状态**: ✅ 已完成配置文件创建。

### ✅ 3. 创建安装与卸载程序

-   **任务**: 创建一个用户友好的安装器 (`.pkg` 或带脚本的 `.dmg`) 和一个卸载脚本。
-   **安装器职责**:
    1.  将 `GeminiForMac.app` 复制到 `/Applications/`。
    2.  创建 `~/.gemini-cli/bin` 和 `~/.gemini-cli/logs` 目录。
    3.  将 `gemini-server` 可执行文件复制到 `~/.gemini-cli/bin/`。
    4.  将 `com.gemini.cli.server.plist` 文件复制到 `~/Library/LaunchAgents/`。
    5.  使用 `launchctl load` 命令加载并启动服务。
-   **卸载脚本职责**:
    1.  使用 `launchctl unload` 停止并卸载服务。
    2.  删除 `~/Library/LaunchAgents/com.gemini.cli.server.plist`。
    3.  删除 `/Applications/GeminiForMac.app`。
    4.  删除 `~/.gemini-cli` 整个目录。
-   **状态**: ✅ 已完成安装脚本 (`scripts/install.sh`) 和卸载脚本 (`scripts/uninstall.sh`) 创建。

### ✅ 4. 修改 `GeminiForMac` 应用

-   **任务**: 调整 Swift 代码以适应新的架构。
-   **具体修改**:
    1.  **移除**所有直接通过 `Process` API 启动或管理 `gemini-server` 进程的代码。
    2.  将网络请求的目标地址**硬编码**为本地服务的地址（`http://localhost:8080`）。
    3.  **增加健壮性逻辑**:
        -   在 App 启动时检查与后台服务的连接状态。
        -   如果连接失败，在 UI 上向用户显示明确的提示信息（例如："后台服务未运行，请尝试重启应用或重新安装"）。
        -   (可选) 提供一个"重启服务"的按钮，该按钮尝试执行 `launchctl stop com.gemini.cli.server && launchctl start com.gemini.cli.server`。
-   **状态**: ✅ 已完成配置更新，统一使用 8080 端口。

### ✅ 5. 创建打包脚本

-   **任务**: 创建一个完整的打包脚本，自动化整个构建和打包流程。
-   **功能**:
    - 检查依赖工具（Node.js、npm、Xcode）
    - 构建 Node.js 服务
    - 构建 macOS 应用
    - 准备安装文件
    - 创建 DMG 文件（可选）
-   **状态**: ✅ 已完成打包脚本 (`scripts/package-macos.sh`) 创建。

---

## 下一步行动

现在可以开始执行打包流程：

1. **运行打包脚本**：
   ```bash
   chmod +x scripts/package-macos.sh
   ./scripts/package-macos.sh
   ```

2. **测试安装**：
   ```bash
   cd dist/installer
   ./install.sh
   ```

3. **验证功能**：
   - 启动 GeminiForMac 应用
   - 检查服务是否正常运行
   - 测试基本功能

4. **创建发布包**：
   - 使用 `create-dmg` 创建 DMG 文件
   - 或直接分发 `dist/installer` 目录
   - 或创建 PKG 安装包（推荐）

---

## 分发选项

### 选项一：PKG 安装包（推荐）

**用户获得：** 1 个 `.pkg` 文件

**用户体验：**
- 双击 `.pkg` 文件即可安装
- 标准的 macOS 安装界面
- 自动处理所有依赖和服务配置
- 支持卸载和升级

**创建命令：**
```bash
# 完整打包（包含 PKG）
./scripts/package-macos.sh

# 或只创建 PKG
./scripts/package-macos.sh --pkg-only
```

### 选项二：DMG 文件

**用户获得：** 1 个 `.dmg` 文件

**用户体验：**
- 双击打开 DMG 文件
- 将应用拖拽到 Applications 文件夹
- 需要手动运行安装脚本

**创建命令：**
```bash
# 完整打包（包含 DMG）
./scripts/package-macos.sh

# 或只创建 DMG
./scripts/package-macos.sh --dmg-only
```

### 选项三：安装包目录

**用户获得：** 包含多个文件的目录

**用户体验：**
- 可以看到所有安装文件
- 需要手动运行安装脚本
- 更透明，但操作稍复杂

---

## 技术细节

### 端口配置
- **统一端口**: 8080
- **配置位置**: 
  - `GeminiForMac/GeminiForMac/Config/APIConfig.swift`
  - `scripts/com.gemini.cli.server.plist`
  - `scripts/install.sh`

### 文件结构
```
dist/
├── GeminiForMac.app
├── GeminiForMac.pkg          # PKG 安装包（推荐）
├── GeminiForMac.dmg          # DMG 文件
└── installer/                # 安装包目录
    ├── GeminiForMac.app
    ├── bin/
    │   └── gemini-server
    ├── install.sh
    ├── uninstall.sh
    ├── com.gemini.cli.server.plist
    └── README.md
```

### 服务管理
- **服务名称**: `com.gemini.cli.server`
- **日志位置**: `~/Library/Application Support/GeminiForMac/logs/`
- **可执行文件**: `~/Library/Application Support/GeminiForMac/bin/gemini-server`

### PKG 安装包特性
- **自动安装**: 双击即可安装
- **服务自启**: 安装完成后自动启动后台服务
- **权限管理**: 自动处理文件权限和目录创建
- **卸载支持**: 提供卸载脚本
- **升级支持**: 支持覆盖安装升级
