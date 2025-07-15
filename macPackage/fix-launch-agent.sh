#!/bin/bash

echo "=== GeminiForMac Launch Agent 修复工具 ==="

# 检查服务器文件
SERVER_DIR=~/Library/Application\ Support/GeminiForMac
if [ ! -d "$SERVER_DIR" ]; then
    echo "❌ 服务器目录不存在: $SERVER_DIR"
    exit 1
fi

if [ ! -f "$SERVER_DIR/start-service.sh" ]; then
    echo "❌ 启动脚本不存在: $SERVER_DIR/start-service.sh"
    exit 1
fi

echo "✅ 服务器文件检查通过"

# 检查 Launch Agent 文件
PLIST_FILE=~/Library/LaunchAgents/com.gemini.cli.server.plist
if [ ! -f "$PLIST_FILE" ]; then
    echo "❌ Launch Agent 文件不存在: $PLIST_FILE"
    exit 1
fi

echo "✅ Launch Agent 文件存在"

# 停止现有服务
echo "🛑 停止现有服务..."
launchctl unload "$PLIST_FILE" 2>/dev/null || true
launchctl remove com.gemini.cli.server 2>/dev/null || true

# 确保日志目录存在
mkdir -p ~/Library/Logs/GeminiForMac

# 检查权限
echo "🔧 检查和修复权限..."
chmod +x "$SERVER_DIR/start-service.sh"
chmod +x "$SERVER_DIR/node20-macos-arm64"

# 重新加载服务
echo "🚀 重新加载 Launch Agent..."
launchctl load "$PLIST_FILE"

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 3

# 检查服务状态
echo "🔍 检查服务状态..."
if launchctl list | grep -q com.gemini.cli.server; then
    STATUS=$(launchctl list | grep com.gemini.cli.server)
    echo "✅ 服务已加载: $STATUS"
    
    # 检查服务是否响应
    if curl -s http://localhost:18080 > /dev/null 2>&1; then
        echo "✅ 服务运行正常，端口 18080 可访问"
    else
        echo "⚠️  服务已加载但端口 18080 无响应，查看错误日志:"
        echo "   tail -n 20 ~/Library/Logs/GeminiForMac/gemini-server-error.log"
    fi
else
    echo "❌ 服务未加载，查看错误日志:"
    echo "   tail -n 20 ~/Library/Logs/GeminiForMac/gemini-server-error.log"
fi

echo ""
echo "=== 常用命令 ==="
echo "查看服务状态: launchctl list | grep gemini"
echo "手动启动服务: launchctl start com.gemini.cli.server"
echo "手动停止服务: launchctl stop com.gemini.cli.server"
echo "重新加载服务: launchctl unload ~/Library/LaunchAgents/com.gemini.cli.server.plist && launchctl load ~/Library/LaunchAgents/com.gemini.cli.server.plist"
echo "查看错误日志: tail -f ~/Library/Logs/GeminiForMac/gemini-server-error.log"
echo "测试服务接口: curl http://localhost:18080"