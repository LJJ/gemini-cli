#!/bin/bash

# 清除 Gemini CLI 认证凭证脚本
# 此脚本会清除所有保存的认证信息，包括 OAuth 凭据、认证配置和用户账户缓存

echo "🧹 开始清除 Gemini CLI 认证凭证..."

# 获取用户主目录
HOME_DIR="$HOME"
GEMINI_DIR="$HOME_DIR/.gemini"

echo "📁 检查 Gemini 配置目录: $GEMINI_DIR"

# 检查目录是否存在
if [ ! -d "$GEMINI_DIR" ]; then
    echo "✅ Gemini 配置目录不存在，无需清除"
    exit 0
fi

# 清除的文件列表
FILES_TO_CLEAR=(
    "oauth_creds.json"
    "auth_config.json"
    "google_accounts.json"
)

# 清除每个文件
for file in "${FILES_TO_CLEAR[@]}"; do
    file_path="$GEMINI_DIR/$file"
    if [ -f "$file_path" ]; then
        echo "🗑️  删除文件: $file"
        rm "$file_path"
    else
        echo "ℹ️  文件不存在: $file"
    fi
done

# 检查是否还有其他文件
remaining_files=$(find "$GEMINI_DIR" -type f -name "*.json" 2>/dev/null | wc -l)
if [ "$remaining_files" -gt 0 ]; then
    echo "⚠️  发现其他 JSON 文件，列出所有剩余文件:"
    find "$GEMINI_DIR" -type f -name "*.json" 2>/dev/null
else
    echo "✅ 所有认证相关文件已清除"
fi

# 检查目录是否为空
if [ -z "$(ls -A "$GEMINI_DIR" 2>/dev/null)" ]; then
    echo "🗑️  删除空的 .gemini 目录"
    rmdir "$GEMINI_DIR"
else
    echo "📁 .gemini 目录中还有其他文件，保留目录"
fi

echo "🎉 认证凭证清除完成！"
echo ""
echo "💡 提示："
echo "   - 下次启动 Gemini CLI 时，您需要重新进行认证"
echo "   - 如果使用 Google 登录，需要重新授权"
echo "   - 如果使用 API Key，需要重新输入" 