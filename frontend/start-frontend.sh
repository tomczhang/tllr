#!/bin/bash

# 贪婪猎人 - 前端启动脚本

echo "🚀 启动贪婪猎人前端服务..."
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在 frontend 目录下运行此脚本"
    echo "   正确用法: cd frontend && ./start-frontend.sh"
    exit 1
fi

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "📝 创建 .env 文件..."
    cat > .env << 'EOF'
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=贪婪猎人投资平台
EOF
    echo "✅ .env 文件已创建"
fi

# 检查后端是否运行
echo "🔍 检查后端服务..."
curl -s http://localhost:8000/health > /dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  警告：后端服务未运行"
    echo "   请先在另一个终端启动后端："
    echo "   cd backend && ./start-backend.sh"
    echo ""
    read -p "继续启动前端？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ 后端服务正常"
fi

# 检查端口占用
echo "🔍 检查端口 5173..."
PORT_PID=$(lsof -ti :5173)
if [ ! -z "$PORT_PID" ]; then
    echo "⚠️  端口 5173 已被占用 (PID: $PORT_PID)"
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
echo "✨ 启动前端开发服务器..."
echo "🌐 访问地址: http://localhost:5173"
echo ""
echo "按 Ctrl+C 停止服务"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

npm run dev

