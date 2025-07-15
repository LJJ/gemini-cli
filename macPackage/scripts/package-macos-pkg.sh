#!/bin/bash

# GeminiForMac 简化 PKG 打包脚本
# 采用更简单的权限模型，避免复杂的用户目录操作

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# PKG 内容验证函数
validate_pkg_contents() {
    log_info "验证 PKG 内容结构..."
    
    # 检查应用包
    if [ -d "$APP_DIR/GeminiForMac.app" ]; then
        log_info "✅ GeminiForMac.app 存在"
    else
        log_error "❌ GeminiForMac.app 不存在"
        return 1
    fi
    
    # 检查服务器模板
    if [ -d "$APP_DIR/GeminiForMac.app/Contents/Resources/server-template" ]; then
        log_info "✅ 服务器模板存在"
        
        # 检查模板内容
        local template_dir="$APP_DIR/GeminiForMac.app/Contents/Resources/server-template"
        local template_files=("start-server.js" "start-service.sh" "node20-macos-arm64")
        
        for file in "${template_files[@]}"; do
            if [ -f "$template_dir/$file" ]; then
                log_info "✅ 模板文件 $file 存在"
            else
                log_error "❌ 模板文件 $file 不存在"
                return 1
            fi
        done
        
        # 检查模板依赖
        if [ -d "$template_dir/node_modules" ]; then
            log_info "✅ 模板 node_modules 存在"
            
            # 检查关键依赖
            for dep in "${REQUIRED_DEPS[@]}"; do
                if [ -d "$template_dir/node_modules/$dep" ]; then
                    log_info "✅ 模板依赖 $dep 存在"
                else
                    log_error "❌ 模板依赖 $dep 不存在"
                    return 1
                fi
            done
        else
            log_error "❌ 模板 node_modules 不存在"
            return 1
        fi
    else
        log_error "❌ 服务器模板不存在"
        return 1
    fi
    
    # 检查 Launch Agent 模板
    if [ -f "$APP_DIR/GeminiForMac.app/Contents/Resources/launch-agent/com.gemini.cli.server.plist.template" ]; then
        log_info "✅ Launch Agent 模板存在"
    else
        log_error "❌ Launch Agent 模板不存在"
        return 1
    fi
    
    log_success "PKG 内容验证通过"
    return 0
}

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MAC_PACKAGE_DIR="$PROJECT_ROOT/macPackage"
DIST_DIR="$MAC_PACKAGE_DIR/dist"

log_info "开始创建简化 PKG 安装包..."

# 0. 构建 macOS 应用
log_info "构建 macOS 应用..."
cd "$PROJECT_ROOT/GeminiForMac"

# 检查 Xcode 是否可用
if ! command -v xcodebuild &> /dev/null; then
    log_error "找不到 xcodebuild，请确保已安装 Xcode Command Line Tools"
    exit 1
fi

# 清理并构建应用
log_info "清理旧的构建文件..."
xcodebuild clean -project GeminiForMac.xcodeproj -scheme GeminiForMac -configuration Release

# 强制清理构建目录，确保全新构建
log_info "强制清理构建目录..."
rm -rf "$PROJECT_ROOT/GeminiForMac/build"
rm -rf "$PROJECT_ROOT/GeminiForMac/DerivedData"

log_info "构建 Release 版本应用..."
xcodebuild build -project GeminiForMac.xcodeproj -scheme GeminiForMac -configuration Release

if [ $? -ne 0 ]; then
    log_error "应用构建失败"
    exit 1
fi

log_success "macOS 应用构建完成"

# 清理旧的构建
rm -rf "$DIST_DIR/pkg_build"
mkdir -p "$DIST_DIR/pkg_build"

# 1. 创建安装目录结构
APP_DIR="$DIST_DIR/pkg_build/Applications"
mkdir -p "$APP_DIR"
log_info "服务器将由 postinstall 脚本安装到 ~/.gemini-server/"

# 复制应用 - 使用最新构建的应用
log_info "查找最新构建的应用..."

# 查找最新的构建产物
log_info "搜索构建产物..."

# 首先尝试在 Xcode DerivedData 中查找
LATEST_APP=""
LATEST_TIME=0

# 查找所有可能的构建路径
while IFS= read -r -d '' found_path; do
    if [ -d "$found_path" ]; then
        # 获取应用的修改时间
        app_time=$(stat -f "%m" "$found_path" 2>/dev/null || echo "0")
        if [ "$app_time" -gt "$LATEST_TIME" ]; then
            LATEST_TIME=$app_time
            LATEST_APP="$found_path"
        fi
    fi
done < <(find "$HOME/Library/Developer/Xcode/DerivedData" -name "GeminiForMac.app" -path "*/Build/Products/Release/*" -type d -print0 2>/dev/null)

# 如果没找到，尝试项目目录下的路径
if [ -z "$LATEST_APP" ]; then
    log_info "在 Xcode DerivedData 中未找到应用，尝试项目目录..."
    PROJECT_PATHS=(
        "$PROJECT_ROOT/GeminiForMac/build/DerivedData/Build/Products/Release/GeminiForMac.app"
        "$PROJECT_ROOT/GeminiForMac/build/Release/GeminiForMac.app"
        "$PROJECT_ROOT/GeminiForMac/DerivedData/Build/Products/Release/GeminiForMac.app"
    )
    
    for path in "${PROJECT_PATHS[@]}"; do
        if [ -d "$path" ]; then
            app_time=$(stat -f "%m" "$path" 2>/dev/null || echo "0")
            if [ "$app_time" -gt "$LATEST_TIME" ]; then
                LATEST_TIME=$app_time
                LATEST_APP="$path"
            fi
        fi
    done
fi

if [ -n "$LATEST_APP" ]; then
    log_info "复制最新应用: $LATEST_APP"
    cp -R "$LATEST_APP" "$APP_DIR/"
    
    # 验证复制是否成功
    if [ -d "$APP_DIR/GeminiForMac.app" ]; then
        log_success "应用复制成功"
        # 显示应用信息
        app_size=$(du -sh "$APP_DIR/GeminiForMac.app" | cut -f1)
        app_time=$(stat -f "%Sm" "$APP_DIR/GeminiForMac.app" 2>/dev/null || echo "未知时间")
        log_info "应用大小: $app_size, 修改时间: $app_time"
    else
        log_error "应用复制失败"
        exit 1
    fi
else
    log_error "找不到构建好的 macOS 应用"
    log_error "请确保已成功构建应用"
    exit 1
fi

# 2. 将服务文件准备到应用包中（用于 postinstall 复制）
APP_RESOURCES="$APP_DIR/GeminiForMac.app/Contents/Resources"
SERVER_TEMPLATE_DIR="$APP_RESOURCES/server-template"
mkdir -p "$SERVER_TEMPLATE_DIR"

# 复制完整的核心包构建产物
cp -R "$PROJECT_ROOT/packages/core/dist/"* "$SERVER_TEMPLATE_DIR/"

# 复制 node_modules 依赖（优先使用根目录的 node_modules）
if [ -d "$PROJECT_ROOT/node_modules" ]; then
    log_info "复制根目录 node_modules 依赖..."
    cp -R "$PROJECT_ROOT/node_modules" "$SERVER_TEMPLATE_DIR/"
elif [ -d "$PROJECT_ROOT/packages/core/node_modules" ]; then
    log_info "复制核心包 node_modules 依赖..."
    cp -R "$PROJECT_ROOT/packages/core/node_modules" "$SERVER_TEMPLATE_DIR/"
else
    log_error "找不到 node_modules，请先运行 npm install"
    exit 1
fi

# 验证关键文件是否存在
log_info "验证构建产物..."
if [ ! -f "$SERVER_TEMPLATE_DIR/start-server.js" ]; then
    log_error "缺少关键文件: start-server.js"
    exit 1
fi

if [ ! -f "$SERVER_TEMPLATE_DIR/src/server.js" ]; then
    log_error "缺少关键文件: src/server.js"
    exit 1
fi

if [ ! -d "$SERVER_TEMPLATE_DIR/src/server" ]; then
    log_error "缺少关键目录: src/server"
    exit 1
fi

log_success "构建产物验证通过"

# 验证关键依赖
log_info "验证关键依赖..."
REQUIRED_DEPS=("express" "ws" "@google/genai" "simple-git")
MISSING_DEPS=()

for dep in "${REQUIRED_DEPS[@]}"; do
    if [ -d "$SERVER_TEMPLATE_DIR/node_modules/$dep" ]; then
        log_info "✅ 依赖 $dep 存在"
    else
        log_error "❌ 缺少依赖 $dep"
        MISSING_DEPS+=("$dep")
    fi
done

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    log_error "缺少关键依赖: ${MISSING_DEPS[*]}"
    log_error "请检查 node_modules 安装情况"
    exit 1
fi

log_success "所有关键依赖验证通过"

# 复制 Node.js 可执行文件
if [ -f "$MAC_PACKAGE_DIR/bin/node20-macos-arm64" ]; then
    cp "$MAC_PACKAGE_DIR/bin/node20-macos-arm64" "$SERVER_TEMPLATE_DIR/"
    chmod +x "$SERVER_TEMPLATE_DIR/node20-macos-arm64"
else
    log_error "找不到 Node.js 可执行文件"
    exit 1
fi

# 3. 创建启动脚本
cat > "$SERVER_TEMPLATE_DIR/start-service.sh" << 'EOF'
#!/bin/bash
# GeminiForMac 服务启动脚本

SERVICE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_BIN="$SERVICE_DIR/node20-macos-arm64"
SERVER_JS="$SERVICE_DIR/start-server.js"

export PORT=8080
export NODE_ENV=production

cd "$SERVICE_DIR"
exec "$NODE_BIN" "$SERVER_JS"
EOF

chmod +x "$SERVER_TEMPLATE_DIR/start-service.sh"

# 4. 创建 Launch Agent 模板
mkdir -p "$APP_RESOURCES/launch-agent"
cat > "$APP_RESOURCES/launch-agent/com.gemini.cli.server.plist.template" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.gemini.cli.server</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>$HOME/.gemini-server/start-service.sh</string>
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
    <string>$HOME/.gemini-server</string>
</dict>
</plist>
EOF

# 5. 创建简单的后安装脚本
SCRIPTS_DIR="$DIST_DIR/pkg_build_scripts"
mkdir -p "$SCRIPTS_DIR"
cat > "$SCRIPTS_DIR/postinstall" << 'EOF'
#!/bin/bash
# GeminiForMac 后安装脚本

echo "设置 GeminiForMac 服务..."

# 获取当前用户信息
CURRENT_USER="${USER:-$(whoami)}"
USER_HOME=$(eval echo "~$CURRENT_USER")
LAUNCH_AGENTS_DIR="$USER_HOME/Library/LaunchAgents"
LOGS_DIR="$USER_HOME/Library/Logs/GeminiForMac"
SERVER_DIR="$USER_HOME/.gemini-server"

# 确保必要目录存在
mkdir -p "$LAUNCH_AGENTS_DIR"
mkdir -p "$LOGS_DIR"
mkdir -p "$SERVER_DIR"

# 设置正确的目录所有者和权限
chown -R "$CURRENT_USER:staff" "$LOGS_DIR" 2>/dev/null || true
chmod 755 "$LOGS_DIR" 2>/dev/null || true

# 复制服务器文件到用户目录
SERVER_TEMPLATE="/Applications/GeminiForMac.app/Contents/Resources/server-template"
if [ -d "$SERVER_TEMPLATE" ]; then
    echo "复制服务器文件到 $SERVER_DIR..."
    cp -R "$SERVER_TEMPLATE/"* "$SERVER_DIR/"
    
    # 设置正确的所有者和权限
    chown -R "$CURRENT_USER:staff" "$SERVER_DIR" 2>/dev/null || true
    chmod +x "$SERVER_DIR/start-service.sh" 2>/dev/null || true
    chmod +x "$SERVER_DIR/node20-macos-arm64" 2>/dev/null || true
    
    echo "✅ 服务器文件安装完成"
else
    echo "❌ 错误: 找不到服务器模板文件"
    exit 1
fi

# 复制 Launch Agent 配置并展开变量
PLIST_TEMPLATE="/Applications/GeminiForMac.app/Contents/Resources/launch-agent/com.gemini.cli.server.plist.template"
PLIST_TARGET="$LAUNCH_AGENTS_DIR/com.gemini.cli.server.plist"

if [ -f "$PLIST_TEMPLATE" ]; then
    # 展开 $HOME 变量
    sed "s|\$HOME|$USER_HOME|g" "$PLIST_TEMPLATE" > "$PLIST_TARGET"
    
    # 设置正确的所有者
    chown "$CURRENT_USER:staff" "$PLIST_TARGET" 2>/dev/null || true
    
    echo "✅ Launch Agent 配置完成"
else
    echo "❌ 警告: 找不到服务配置模板"
fi

# 不自动启动服务，由用户手动控制
echo "✅ GeminiForMac 安装完成"
echo "服务器安装位置: $SERVER_DIR"
echo "请启动 GeminiForMac 应用并在菜单中启用服务"

exit 0
EOF

chmod +x "$SCRIPTS_DIR/postinstall"

# 6. 创建预安装脚本（清理旧版本）
cat > "$SCRIPTS_DIR/preinstall" << 'EOF'
#!/bin/bash
# GeminiForMac 预安装脚本

echo "准备安装 GeminiForMac..."

# 获取当前用户信息
CURRENT_USER="${USER:-$(whoami)}"
USER_HOME=$(eval echo "~$CURRENT_USER")
PLIST_FILE="$USER_HOME/Library/LaunchAgents/com.gemini.cli.server.plist"

# 停止现有服务
if [ -f "$PLIST_FILE" ]; then
    echo "停止现有服务..."
    sudo -u "$CURRENT_USER" launchctl unload "$PLIST_FILE" 2>/dev/null || true
fi

# 移除旧版本应用
if [ -d "/Applications/GeminiForMac.app" ]; then
    echo "移除旧版本应用..."
    rm -rf "/Applications/GeminiForMac.app"
fi

# 清理旧的服务器文件
USER_HOME=$(eval echo "~$CURRENT_USER")
OLD_SERVER_DIR="$USER_HOME/.gemini-server"
if [ -d "$OLD_SERVER_DIR" ]; then
    echo "清理旧的服务器文件..."
    rm -rf "$OLD_SERVER_DIR"
fi

# 清理旧的日志文件
rm -f /tmp/gemini-server*.log 2>/dev/null || true
rm -rf "$USER_HOME/Library/Logs/GeminiForMac" 2>/dev/null || true

exit 0
EOF

chmod +x "$SCRIPTS_DIR/preinstall"

# 7. 验证 PKG 内容结构
log_info "验证 PKG 内容结构..."
validate_pkg_contents

# 8. 创建 PKG
log_info "创建 PKG 安装包..."
PKG_NAME="GeminiForMac-Simple-$(date +%Y%m%d-%H%M%S).pkg"
PKG_PATH="$DIST_DIR/$PKG_NAME"

pkgbuild --root "$DIST_DIR/pkg_build" \
         --identifier "com.gemini.cli.macos.simple" \
         --version "1.0.0" \
         --scripts "$SCRIPTS_DIR" \
         --install-location "/" \
         "$PKG_PATH"

# 清理临时文件
rm -rf "$DIST_DIR/pkg_build"
rm -rf "$SCRIPTS_DIR"

# 创建符号链接
ln -sf "$PKG_NAME" "$DIST_DIR/GeminiForMac-Simple.pkg"

# PKG 内容验证已在创建前完成

# 创建验证报告
log_info "生成验证报告..."
cat > "$DIST_DIR/build-report.txt" << EOF
=== GeminiForMac PKG 构建报告 ===
构建时间: $(date)
PKG 文件: $PKG_NAME
PKG 大小: $(du -h "$PKG_PATH" | cut -f1)

=== 构建流程 ===
✅ 强制清理旧构建文件
✅ 自动构建 macOS 应用 (xcodebuild)
✅ 查找并复制最新构建的应用
✅ 验证应用包完整性
✅ 打包服务器组件
✅ 创建安装脚本
✅ 生成 PKG 安装包

=== 已验证组件 ===
✅ GeminiForMac.app 应用 (Release 版本)
✅ Node.js 运行时 (node20-macos-arm64)
✅ 服务器源码 (start-server.js)
✅ 启动脚本 (start-service.sh)
✅ Launch Agent 模板
✅ 关键依赖: ${REQUIRED_DEPS[*]}

=== 安装路径 ===
应用: /Applications/GeminiForMac.app
服务器: ~/.gemini-server/
Launch Agent: ~/Library/LaunchAgents/com.gemini.cli.server.plist
日志: ~/Library/Logs/GeminiForMac/

=== 安装步骤 ===
1. 双击 PKG 文件进行安装
2. 启动 GeminiForMac 应用
3. 手动启动服务: launchctl load ~/Library/LaunchAgents/com.gemini.cli.server.plist
4. 验证服务: curl http://localhost:8080
EOF

log_success "🎉 简化 PKG 安装包创建完成！"
log_info "构建流程：自动构建应用 → 打包组件 → 生成 PKG"
log_info "输出文件: $PKG_PATH"
log_info "符号链接: $DIST_DIR/GeminiForMac-Simple.pkg"
log_info "验证报告: $DIST_DIR/build-report.txt"
log_info ""
log_info "安装方式："
log_info "1. 双击 PKG 文件进行安装"
log_info "2. 启动 GeminiForMac 应用"
log_info "3. 手动启动服务: launchctl load ~/Library/LaunchAgents/com.gemini.cli.server.plist"