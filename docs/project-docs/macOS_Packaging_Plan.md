# macOS PKG 打包方案

**目标:** 创建一个 PKG 安装包，将 `GeminiForMac` UI 应用和后端的 `gemini-server` 服务一同分发给用户。用户双击安装后，应用自动安装到 `/Applications/`，后端服务作为 Launch Agent 自动启动。

---

## 架构设计

-   **`GeminiForMac.app`**: SwiftUI 应用，负责图形界面
-   **嵌入式服务**: 所有服务文件嵌入到应用包的 `Contents/Resources/gemini-server/` 目录
-   **Launch Agent**: 通过 `launchd` 管理服务生命周期，用户登录时自动启动
-   **通信机制**: UI 与服务通过 `http://localhost:8080` 通信

---

## PKG 构建步骤

### 1. 准备构建环境
```bash
# 构建 Node.js 服务
npm run build

# 构建 macOS 应用
cd GeminiForMac
xcodebuild -scheme GeminiForMac -configuration Release -derivedDataPath build/DerivedData build
```

### 2. 执行打包脚本
```bash
# 创建 PKG 安装包（唯一支持的打包方式）
./macPackage/scripts/package-macos-pkg.sh
```

### 3. 验证构建结果
- 输出文件: `macPackage/dist/GeminiForMac-Simple-YYYYMMDD-HHMMSS.pkg`
- 符号链接: `macPackage/dist/GeminiForMac-Simple.pkg`

---

## 文件结构

### 应用包结构
```
/Applications/GeminiForMac.app/
├── Contents/
│   ├── MacOS/
│   │   └── GeminiForMac         # 主应用
│   └── Resources/
│       ├── gemini-server/       # 嵌入的服务文件
│       │   ├── src/            # 完整的源代码
│       │   ├── node20-macos-arm64  # Node.js 运行时
│       │   ├── start-server.js     # 服务入口
│       │   └── start-service.sh    # 启动脚本
│       └── launch-agent/
│           └── com.gemini.cli.server.plist.template
```

### Launch Agent 配置
```
~/Library/LaunchAgents/
└── com.gemini.cli.server.plist  # 用户的 Launch Agent 配置
```

### 服务日志
```
~/Library/Logs/GeminiForMac/
├── gemini-server.log            # 服务日志
└── gemini-server-error.log      # 错误日志
```

---

## Launch Agent 配置

### plist 配置文件
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.gemini.cli.server</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/Applications/GeminiForMac.app/Contents/Resources/gemini-server/start-service.sh</string>
    </array>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/GeminiForMac/gemini-server.log</string>
    
    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/GeminiForMac/gemini-server-error.log</string>
    
    <key>WorkingDirectory</key>
    <string>/Applications/GeminiForMac.app/Contents/Resources/gemini-server</string>
</dict>
</plist>
```

### 启动脚本 (start-service.sh)
```bash
#!/bin/bash
SERVICE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_BIN="$SERVICE_DIR/node20-macos-arm64"
SERVER_JS="$SERVICE_DIR/start-server.js"

export PORT=8080
export NODE_ENV=production

cd "$SERVICE_DIR"
exec "$NODE_BIN" "$SERVER_JS"
```

---

## PKG 安装脚本

### preinstall 脚本
- 停止现有服务: `launchctl unload ~/Library/LaunchAgents/com.gemini.cli.server.plist`
- 删除旧版本应用: `rm -rf /Applications/GeminiForMac.app`

### postinstall 脚本 (改进版本)
- 创建日志目录 `~/Library/Logs/GeminiForMac/` 并设置正确的用户所有权
- 复制 Launch Agent 配置到用户目录并**立即启动服务**
- 设置正确的文件权限和所有者
- 执行 `launchctl load ~/Library/LaunchAgents/com.gemini.cli.server.plist` 启动服务
- 验证服务启动成功（检查端口 8080）
- 遵循 macOS 后台服务最佳实践

---

## 用户安装流程

### 安装步骤 (改进版本)
1. 双击 `GeminiForMac-Simple.pkg` 文件
2. 按照安装向导完成安装
3. **安装完成即可使用** - 服务已在后台自动启动
4. 启动 GeminiForMac 应用即可连接到已运行的服务
5. 无需手动启动任何服务

### 服务管理策略 (改进版本)
- **系统启动时**：Launch Agent 自动启动 gemini 服务器服务
- **后台持续运行**：服务独立于应用运行，用户登录即可用
- **应用连接时**：UI 应用连接到已运行的服务
- **崩溃自动重启**：`KeepAlive=true` 确保服务高可用性
- **手动管理**：可通过应用菜单或命令行控制服务

### 验证安装
```bash
# 检查服务状态
launchctl list | grep gemini

# 检查服务连接
curl http://localhost:8080/status

# 查看日志
tail -f ~/Library/Logs/GeminiForMac/gemini-server.log
```

---

## 卸载流程

### 完整卸载步骤
```bash
# 停止服务
launchctl unload ~/Library/LaunchAgents/com.gemini.cli.server.plist

# 删除文件
rm -rf /Applications/GeminiForMac.app
rm ~/Library/LaunchAgents/com.gemini.cli.server.plist
rm -rf ~/Library/Logs/GeminiForMac/
```

---

## 故障排除

### 服务无法启动
```bash
# 检查错误日志
cat ~/Library/Logs/GeminiForMac/gemini-server-error.log

# 手动启动服务测试
/Applications/GeminiForMac.app/Contents/Resources/gemini-server/start-service.sh
```

### 权限问题
```bash
# 确保启动脚本有执行权限
chmod +x /Applications/GeminiForMac.app/Contents/Resources/gemini-server/start-service.sh
```

### 端口冲突
```bash
# 检查端口占用
lsof -i :8080

# 手动停止服务
launchctl stop com.gemini.cli.server
```

### 服务重启方法

#### 1. 自动重启（已内置）
- **崩溃自动重启**：`KeepAlive=true` 确保进程崩溃时自动重启
- **响应时间**：通常在 1-2 秒内完成重启
- **无需人工干预**：由 macOS `launchd` 自动处理

#### 2. 手动重启命令
```bash
# 方法一：重启服务（推荐）
launchctl kickstart -k gui/$(id -u)/com.gemini.cli.server

# 方法二：停止后自动重启
launchctl stop com.gemini.cli.server  # KeepAlive 会自动重启

# 方法三：完整重新加载
launchctl unload ~/Library/LaunchAgents/com.gemini.cli.server.plist
launchctl load ~/Library/LaunchAgents/com.gemini.cli.server.plist
```

#### 3. 应用内重启功能
```swift
// 在 macOS 应用中添加菜单项
func restartServer() {
    let task = Process()
    task.launchPath = "/bin/launchctl"
    task.arguments = ["kickstart", "-k", "gui/\(getuid())/com.gemini.cli.server"]
    task.launch()
}
```

#### 4. 验证重启成功
```bash
# 检查服务状态
launchctl list | grep com.gemini.cli.server

# 测试服务连接
curl -s http://localhost:8080/status

# 查看重启日志
tail -f ~/Library/Logs/GeminiForMac/gemini-server.log
```

### 日志权限问题
```bash
# 检查日志目录权限
ls -la ~/Library/Logs/GeminiForMac/

# 如果权限不正确，手动修复
sudo chown -R $(whoami):staff ~/Library/Logs/GeminiForMac/
chmod 755 ~/Library/Logs/GeminiForMac/

# 检查服务日志
tail -f ~/Library/Logs/GeminiForMac/gemini-server.log
tail -f ~/Library/Logs/GeminiForMac/gemini-server-error.log
```

---

## 开发者备注

### 关键文件
- 打包脚本: `macPackage/scripts/package-macos-pkg.sh` （唯一支持的打包脚本）
- Node.js 运行时: `macPackage/bin/node20-macos-arm64`
- 服务源码: `packages/core/dist/`
- 服务入口: `packages/core/dist/start-server.js`
- 服务核心: `packages/core/dist/src/server.js`
- 服务依赖: `packages/core/node_modules/`

### 构建要求
- Node.js 20+
- Xcode 命令行工具
- 已构建的 macOS 应用

### 测试建议
1. 在新的 macOS 系统上测试安装
2. 验证构建产物包含所有必要文件
3. 检查应用与服务的通信
4. 验证日志文件写入正确位置
5. 测试卸载流程的完整性

---

## 改进实现方案

### 关键改进点
1. **真正的自动启动**：安装后立即启动服务，无需用户干预
2. **独立服务生命周期**：服务与应用解耦，后台持续运行
3. **用户友好体验**：安装即用，应用随时可连接服务

### 修改的安装脚本
```bash
# postinstall 脚本关键部分
#!/bin/bash

# 获取当前用户
CURRENT_USER=$(stat -f "%Su" /dev/console)
USER_HOME=$(eval echo ~$CURRENT_USER)

# 创建 Launch Agent 配置
cp "/Applications/GeminiForMac.app/Contents/Resources/launch-agent/com.gemini.cli.server.plist.template" \
   "$USER_HOME/Library/LaunchAgents/com.gemini.cli.server.plist"

# 设置权限
chown $CURRENT_USER:staff "$USER_HOME/Library/LaunchAgents/com.gemini.cli.server.plist"

# 立即启动服务
sudo -u $CURRENT_USER launchctl load "$USER_HOME/Library/LaunchAgents/com.gemini.cli.server.plist"

# 验证服务启动
sleep 2
if curl -s http://localhost:8080/status > /dev/null; then
    echo "Gemini 服务启动成功"
else
    echo "警告：Gemini 服务可能未正常启动"
fi
```

### 用户体验优势
- ✅ **零配置启动**：安装后服务自动运行
- ✅ **随时可用**：应用可随时启动并连接服务
- ✅ **系统集成**：遵循 macOS Launch Agent 最佳实践
- ✅ **高可用性**：服务崩溃自动重启
- ✅ **资源优化**：应用关闭不影响服务运行