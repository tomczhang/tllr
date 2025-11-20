#!/bin/bash

# 贪婪猎人 - 后端启动脚本

echo "🚀 启动贪婪猎人后端服务..."
echo ""

# 检查是否在正确的目录
if [ ! -f "requirements.txt" ]; then
    echo "❌ 错误：请在 backend 目录下运行此脚本"
    echo "   正确用法: cd backend && ./start-backend.sh"
    exit 1
fi

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "🔄 激活虚拟环境..."
source venv/bin/activate

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "⚠️  警告：.env 文件不存在"
    echo "   请先创建 .env 文件并配置 Supabase"
    echo "   参考 ENV_SETUP.md 文档"
    exit 1
fi

# 安装/更新依赖
echo "📦 检查依赖..."
pip install -q -r requirements.txt

# 检查配置
echo "🔍 验证配置..."
python -c "from app.core.config import settings; print('✅ Supabase URL:', settings.SUPABASE_URL)" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ 配置验证失败，请检查 .env 文件"
    exit 1
fi

# 检查端口占用
echo "🔍 检查端口 8000..."
PORT_PID=$(lsof -ti :8000)
if [ ! -z "$PORT_PID" ]; then
    echo "⚠️  端口 8000 已被占用 (PID: $PORT_PID)"
    read -p "是否停止现有进程并重启？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 停止现有进程..."
        kill -9 $PORT_PID 2>/dev/null
        sleep 1
        echo "✅ 已停止"
    else
        echo "❌ 取消启动"
        exit 1
    fi
fi

# 启动服务
echo ""
echo "✨ 启动 FastAPI 服务..."
echo "📖 API 文档: http://localhost:8000/docs"
echo "🔍 健康检查: http://localhost:8000/health"
echo ""
echo "按 Ctrl+C 停止服务"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

