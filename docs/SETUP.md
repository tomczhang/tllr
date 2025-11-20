# 贪婪猎人投资平台 - 部署指南

## 环境要求

- Docker & Docker Compose
- Node.js 20+ (本地开发可选)
- Python 3.11+ (本地开发可选)
- Supabase 账号

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd tllr
```

### 2. 配置 Supabase

1. 访问 [Supabase](https://supabase.com) 创建新项目
2. 在 Supabase 控制台中执行 `database/schema.sql` 中的 SQL 脚本
3. 获取项目的 URL 和 API Keys

### 3. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的配置：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
SECRET_KEY=your-secret-key-change-this
OPENAI_API_KEY=your-openai-api-key  # Phase 2 需要
```

### 4. 启动项目（Docker）

```bash
# 构建并启动所有服务
docker-compose up --build

# 后台运行
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 5. 访问应用

- **前端**: http://localhost:5173
- **后端 API**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs

## 本地开发（不使用 Docker）

### 后端开发

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入配置

# 启动服务
uvicorn app.main:app --reload --port 8000
```

### 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入配置

# 启动开发服务器
npm run dev
```

## 生产环境部署

### 构建生产镜像

```bash
# 构建后端
cd backend
docker build -t greedy-hunter-backend:latest .

# 构建前端
cd frontend
docker build -t greedy-hunter-frontend:latest .
```

### 使用 Nginx 反向代理（推荐）

前端 `nginx.conf` 已配置好反向代理，可以直接使用。

### 环境变量

生产环境请务必修改：
- `SECRET_KEY`: 使用强随机密钥
- `DEBUG`: 设为 `False`
- `BACKEND_CORS_ORIGINS`: 配置实际的前端域名

## 故障排查

### 后端启动失败

1. 检查 Supabase 配置是否正确
2. 确认数据库表已创建
3. 查看日志: `docker-compose logs backend`

### 前端无法连接后端

1. 检查 `VITE_API_URL` 环境变量
2. 确认后端服务正常运行
3. 检查 CORS 配置

### 股票数据获取失败

1. yfinance 依赖网络环境，可能需要代理
2. 股票代码格式：
   - 美股：`AAPL`
   - A股：`600519.SS`（上交所）, `000001.SZ`（深交所）
   - 港股：`0700.HK`

## 下一步

- 参考 `docs/API.md` 查看完整 API 文档
- 参考 `docs/DATABASE.md` 了解数据库设计
- 开始使用建仓计算器分析股票！

