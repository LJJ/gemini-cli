#!/bin/bash

echo "=== 测试服务器依赖 ==="

SERVER_DIR=~/Library/Application\ Support/GeminiForMac

if [ ! -d "$SERVER_DIR" ]; then
    echo "❌ 服务器目录不存在，请先安装 PKG"
    exit 1
fi

echo "📁 服务器目录: $SERVER_DIR"

# 检查关键文件
echo "🔍 检查关键文件..."
files=("start-server.js" "start-service.sh" "node20-macos-arm64")
for file in "${files[@]}"; do
    if [ -f "$SERVER_DIR/$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file"
    fi
done

# 检查 node_modules
echo "🔍 检查 node_modules..."
if [ -d "$SERVER_DIR/node_modules" ]; then
    echo "  ✅ node_modules 目录存在"
    
    # 检查关键依赖
    deps=("express" "ws" "@google/genai")
    for dep in "${deps[@]}"; do
        if [ -d "$SERVER_DIR/node_modules/$dep" ]; then
            echo "  ✅ $dep"
        else
            echo "  ❌ $dep"
        fi
    done
else
    echo "  ❌ node_modules 目录不存在"
fi

# 尝试启动服务器
echo "🚀 尝试启动服务器..."
cd "$SERVER_DIR"
timeout 5 ./start-service.sh &
PID=$!
sleep 2

# 检查服务器是否启动
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "  ✅ 服务器启动成功"
    kill $PID 2>/dev/null
else
    echo "  ❌ 服务器启动失败"
fi

echo "=== 测试完成 ==="