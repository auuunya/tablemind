#!/bin/bash

echo "🚀 TableMind - 启动脚本"
echo "=================================="
echo ""

# 检查并关闭占用5000端口的进程
echo "📋 检查端口5000..."
if lsof -ti:5000 > /dev/null 2>&1; then
    echo "⚠️  端口5000已被占用，正在清理..."
    lsof -ti:5000 | xargs kill -9 2>/dev/null
    sleep 2
    echo "✅ 端口已清理"
else
    echo "✅ 端口5000可用"
fi

echo ""
echo "🔧 启动开发服务器..."
echo ""

npm run dev
