# 🚀 贪婪猎人 - 快速启动指南

## 项目已创建完成 ✅

所有核心文件已生成，现在可以开始使用了！

## 📋 环境准备

### 前置要求

确保已安装以下软件：

```bash
# 检查 Python 版本（需要 3.9+）
python3 --version

# 检查 Node.js 版本（需要 16+）
node --version

# 检查 npm 版本
npm --version
```

如果未安装：
- **Python 3.9+**: 访问 https://www.python.org/downloads/
- **Node.js 16+**: 访问 https://nodejs.org/ 或使用 `brew install node`

---

## 📋 下一步操作清单

### 1. 配置 Supabase (必需)

1. 访问 https://supabase.com 注册并创建新项目
2. 在项目设置中获取：
   - Project URL
   - Anon Key
   - Service Key
3. 在 Supabase SQL Editor 中执行 `database/schema.sql`
   - ⚠️ MVP 版本不包含向量字段，可以直接执行
   - Phase 2 时再执行 `database/migration_phase2_vector.sql`
4. 将配置信息填入 `.env` 文件

### 2. 配置环境变量

```bash
# 创建 .env 文件
cp .env.example .env

# 编辑 .env，填入配置
# vim .env 或使用你喜欢的编辑器
```

必填项：
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# 注意：不再需要 SECRET_KEY！
# JWT 现在完全由 Supabase 管理
```

详细配置指南见：`ENV_SETUP.md`

### 3. 启动项目

#### 方式一：本地开发（推荐快速开始）

**启动后端：**

```bash
cd /Users/tomczhang/tllr/backend

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 确保已创建 .env 文件（参考 ENV_SETUP.md）

# 启动后端
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**启动前端（新开一个终端）：**

```bash
cd /Users/tomczhang/tllr/frontend

# 安装依赖
npm install

# 创建 .env 文件
cat > .env << 'EOF'
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=贪婪猎人投资平台
EOF

# 启动前端
npm run dev
```

#### 方式二：使用 Docker

```bash
# 使用新版 Docker Compose 命令
docker compose up --build

# 后台运行
docker compose up -d --build

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

> ⚠️ **注意**：如果提示 `docker-compose: command not found`，请使用 `docker compose`（空格）而不是 `docker-compose`（连字符）

### 4. 访问应用

- 🌐 **前端**: http://localhost:5173
- 🚀 **后端**: http://localhost:8000
- 📖 **API文档**: http://localhost:8000/docs
- 🔍 **健康检查**: http://localhost:8000/health

### 5. 验证服务正常

**后端验证：**
```bash
# 访问健康检查接口
curl http://localhost:8000/health

# 应该返回：{"status":"healthy"}
```

**前端验证：**
```bash
# 检查前端是否启动
curl http://localhost:5173

# 或直接在浏览器打开
open http://localhost:5173
```

## 🎯 完整启动流程示例

### 第一次启动（完整步骤）

```bash
# 1️⃣ 克隆项目（如果还没有）
cd /Users/tomczhang/tllr

# 2️⃣ 配置 Supabase（在 Supabase Dashboard 完成）
# - 创建项目
# - 执行 database/schema.sql
# - 获取配置信息

# 3️⃣ 配置后端
cd /Users/tomczhang/tllr/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 创建 .env 文件并填入 Supabase 配置
cat > .env << 'EOF'
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
ENVIRONMENT=development
DEBUG=True
BACKEND_CORS_ORIGINS=["http://localhost:5173"]
EOF

# 编辑 .env 填入真实配置
open -e .env

# 启动后端（在当前终端）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 4️⃣ 配置前端（新开一个终端）
cd /Users/tomczhang/tllr/frontend
npm install

# 创建 .env
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env

# 启动前端
npm run dev

# ✅ 完成！访问 http://localhost:5173
```

### 后续启动（已配置好的情况）

#### 方法 A：使用启动脚本（推荐）

**终端 1 - 后端：**
```bash
cd /Users/tomczhang/tllr/backend
./start-backend.sh
```

**终端 2 - 前端：**
```bash
cd /Users/tomczhang/tllr/frontend
./start-frontend.sh
```

#### 方法 B：手动启动

**终端 1 - 后端：**
```bash
cd /Users/tomczhang/tllr/backend
source venv/bin/activate
uvicorn app.main:app --reload
```

**终端 2 - 前端：**
```bash
cd /Users/tomczhang/tllr/frontend
npm run dev
```

---

## 🎯 功能测试流程

### 1. 注册账号
访问 http://localhost:5173/register

### 2. 使用建仓计算器
- 前往"建仓计算器"
- 输入股票代码测试：
  - 美股：`AAPL`, `MSFT`, `TSLA`
  - A股：`600519.SS` (茅台), `000001.SZ` (平安)
  - 港股：`0700.HK` (腾讯)

### 3. 记录交易
- 前往"我的持仓"
- 点击"记录交易"添加买入记录

### 4. 写投资笔记
- 前往"投资笔记"
- 记录你的投资想法

## 📁 项目结构说明

```
tllr/
├── backend/              # Python FastAPI 后端
│   ├── app/
│   │   ├── api/         # API 路由（认证、股票、持仓、笔记）
│   │   ├── services/    # 核心算法（计算器、yfinance、Supabase）
│   │   ├── schemas/     # 数据模型
│   │   └── core/        # 配置和安全
│   └── requirements.txt
│
├── frontend/             # React + TypeScript 前端
│   ├── src/
│   │   ├── pages/       # 页面（登录、注册、计算器、持仓、笔记）
│   │   ├── hooks/       # React Query Hooks
│   │   ├── stores/      # Zustand 状态管理
│   │   └── lib/         # API 客户端、工具函数
│   └── package.json
│
├── database/             # 数据库脚本
├── docs/                 # 详细文档
├── docker-compose.yml    # Docker 配置
└── README.md
```

## 🔧 常见问题

### Q: 依赖安装冲突？
A: 
```bash
# 升级 pip
pip install --upgrade pip

# 清理缓存重新安装
pip cache purge
pip install -r requirements.txt
```

### Q: 虚拟环境如何退出和重新进入？
A:
```bash
# 退出虚拟环境
deactivate

# 重新进入虚拟环境
cd /Users/tomczhang/tllr/backend
source venv/bin/activate
```

### Q: yfinance 获取数据失败？
A: 
- 检查网络连接
- 某些地区可能需要代理
- 确认股票代码格式正确
- 示例：美股 `AAPL`，A股 `600519.SS`，港股 `0700.HK`

### Q: Supabase 认证失败？
A: 
- 确认 `backend/.env` 配置正确
- 检查 Supabase 项目是否正常运行
- 确认数据库表已创建（执行 `database/schema.sql`）
- 验证配置：`cd backend && python -c "from app.core.config import settings; print(settings.SUPABASE_URL)"`

### Q: 前端无法连接后端？
A: 
- 确认后端在 8000 端口运行
- 确认 `frontend/.env` 中 `VITE_API_URL=http://localhost:8000/api/v1`
- 检查 CORS 配置
- 查看浏览器控制台错误

### Q: Docker 相关问题？
A: 
- `docker-compose: command not found` → 使用 `docker compose`（空格）
- 构建很慢 → 使用本地开发模式
- 需要安装 Docker Desktop → 访问 https://www.docker.com/products/docker-desktop

### Q: 端口被占用？
A:
```bash
# 方法 1：使用停止脚本（推荐）
cd /Users/tomczhang/tllr
./stop-all.sh

# 方法 2：手动停止
# 查看 8000 端口占用
lsof -i :8000
# 停止进程
kill -9 <PID>

# 查看 5173 端口占用
lsof -i :5173
# 停止进程
kill -9 <PID>

# 方法 3：使用其他端口
uvicorn app.main:app --reload --port 8001
```

**注意**：新版启动脚本会自动检测端口占用并提示清理！

## 📚 深入学习

- **API 文档**: `docs/API.md` - 完整的 API 接口说明
- **数据库设计**: `docs/DATABASE.md` - 表结构和关系
- **部署指南**: `docs/SETUP.md` - 生产环境部署

## 🎨 技术亮点

1. **核心算法**: 
   - 8分制评分系统（S/A/B/C）
   - 10年最大回撤分析
   - 双重折扣公式
   - 6步金字塔网格策略

2. **现代化架构**:
   - 前后端分离
   - Docker 容器化
   - RESTful API
   - React Hooks + TypeScript

3. **数据安全**:
   - JWT 认证
   - Supabase RLS (行级安全)
   - HTTPS 支持

## 🚀 下一步开发建议

### Phase 2 功能：

1. **AI 增强**:
   - 启用 pgvector 扩展
   - 接入 OpenAI API
   - 实现笔记向量化和 RAG 检索

2. **实时数据**:
   - WebSocket 推送实时价格
   - 设置价格提醒

3. **数据可视化**:
   - K线图（使用 recharts）
   - 资产曲线图
   - 行业分布饼图

4. **社交功能**:
   - 分享投资策略
   - 用户关注
   - 热门股票排行

## 🎁 便捷启动脚本

项目包含了自动化启动脚本，自动处理环境配置和依赖检查：

### 后端启动脚本

```bash
cd /Users/tomczhang/tllr/backend
./start-backend.sh
```

**功能：**
- ✅ 自动检查和创建虚拟环境
- ✅ 自动激活虚拟环境
- ✅ 自动安装依赖
- ✅ 验证配置文件
- ✅ **自动检查端口占用并清理**
- ✅ 启动 FastAPI 服务

### 前端启动脚本

```bash
cd /Users/tomczhang/tllr/frontend
./start-frontend.sh
```

**功能：**
- ✅ 自动检查和安装依赖
- ✅ 自动创建 .env 文件
- ✅ 检查后端服务状态
- ✅ **自动检查端口占用并清理**
- ✅ 启动前端开发服务器

### 停止所有服务

```bash
cd /Users/tomczhang/tllr
./stop-all.sh
```

**功能：**
- ✅ 一键停止前后端所有服务
- ✅ 自动检测并停止 8000 和 5173 端口的进程

---

## 💡 实用命令参考

### 日常开发命令

```bash
# 后端相关
cd /Users/tomczhang/tllr/backend
source venv/bin/activate              # 激活虚拟环境
deactivate                            # 退出虚拟环境
pip list                              # 查看已安装的包
pip install --upgrade <package>       # 升级某个包

# 前端相关
cd /Users/tomczhang/tllr/frontend
npm run dev                           # 启动开发服务器
npm run build                         # 构建生产版本
npm run preview                       # 预览生产构建

# 数据库相关
# 在 Supabase SQL Editor 中执行
psql -h db.xxx.supabase.co -U postgres  # 连接数据库（可选）

# 项目管理
git status                            # 查看修改状态
git add .                             # 添加所有修改
git commit -m "描述"                  # 提交修改
```

### 调试技巧

```bash
# 查看后端日志（如果后台运行）
tail -f backend/logs/app.log

# 测试 API 接口
curl http://localhost:8000/health
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 检查端口占用
lsof -i :8000    # 后端端口
lsof -i :5173    # 前端端口

# 清理 Python 缓存
find . -type d -name "__pycache__" -exec rm -r {} +

# 清理 Node 模块重新安装
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### shadcn/ui 组件添加

```bash
cd frontend
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add table
npx shadcn-ui@latest add card
```

## 💡 开发提示

- **后端 API 文档**：访问 http://localhost:8000/docs 可以直接测试 API
- **热重载**：后端和前端都支持热重载，修改代码后自动刷新
- **代码规范**：所有代码都遵循了单文件不超过 500 行的原则
- **日志查看**：后端使用 `print()` 的内容会显示在终端
- **数据库查询**：可以在 Supabase Dashboard 的 Table Editor 中直接查看和编辑数据

## 🔍 故障排除清单

启动失败？按以下顺序检查：

### ✅ 后端检查清单

- [ ] Python 版本 >= 3.9：`python3 --version`
- [ ] 虚拟环境已激活：提示符显示 `(venv)`
- [ ] 依赖已安装：`pip list | grep fastapi`
- [ ] .env 文件存在：`ls backend/.env`
- [ ] Supabase 配置正确：`python -c "from app.core.config import settings; print(settings.SUPABASE_URL)"`
- [ ] 数据库表已创建：在 Supabase Table Editor 查看
- [ ] 端口 8000 未被占用：`lsof -i :8000`

### ✅ 前端检查清单

- [ ] Node.js 版本 >= 16：`node --version`
- [ ] 依赖已安装：`ls frontend/node_modules`
- [ ] .env 文件存在：`ls frontend/.env`
- [ ] API URL 配置正确：`cat frontend/.env`
- [ ] 后端服务正常：`curl http://localhost:8000/health`
- [ ] 端口 5173 未被占用：`lsof -i :5173`

### 🆘 仍然有问题？

1. **查看详细文档**：
   - `ENV_SETUP.md` - 环境变量配置
   - `docs/AUTH_ARCHITECTURE.md` - 认证架构
   - `docs/API.md` - API 文档

2. **查看日志**：
   - 后端终端的错误信息
   - 前端浏览器控制台
   - Supabase Dashboard 的日志

3. **重置环境**：
   ```bash
   # 清理后端
   cd backend
   deactivate
   rm -rf venv
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   
   # 清理前端
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## 🎉 开始你的投资之旅吧！

有任何问题请查看文档或提交 Issue。

祝你投资顺利！🎯

