#!/bin/bash

echo "测试服务启动..."

# 停止现有服务
launchctl unload ~/Library/LaunchAgents/com.gemini.cli.server.plist 2>/dev/null || true

# 确保日志目录存在
mkdir -p ~/Library/Logs/GeminiForMac/

# 重新加载服务
launchctl load ~/Library/LaunchAgents/com.gemini.cli.server.plist

# 等待服务启动
sleep 3

# 检查服务状态
echo "服务状态："
launchctl list | grep gemini || echo "服务未运行"

# 测试服务端口
echo "测试服务端口："
curl -s http://localhost:18080/health 2>/dev/null || echo "服务未响应"

# 显示错误日志
echo "错误日志："
cat ~/Library/Logs/GeminiForMac/gemini-server-error.log 2>/dev/null || echo "无错误日志"