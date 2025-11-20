#!/bin/bash

# 贪婪猎人 - 停止所有服务脚本

echo "🛑 停止贪婪猎人所有服务..."
echo ""

# 停止后端 (8000 端口)
BACKEND_PID=$(lsof -ti :8000)
if [ ! -z "$BACKEND_PID" ]; then
    echo "🔄 停止后端服务 (PID: $BACKEND_PID)..."
    kill -9 $BACKEND_PID 2>/dev/null
    echo "✅ 后端已停止"
else
    echo "ℹ️  后端未运行"
fi

# 停止前端 (5173 端口)
FRONTEND_PID=$(lsof -ti :5173)
if [ ! -z "$FRONTEND_PID" ]; then
    echo "🔄 停止前端服务 (PID: $FRONTEND_PID)..."
    kill -9 $FRONTEND_PID 2>/dev/null
    echo "✅ 前端已停止"
else
    echo "ℹ️  前端未运行"
fi

echo ""
echo "🎉 所有服务已停止"

