# 🎯 贪婪猎人投资平台 (Greedy Hunter)

一个基于**价值投资 + 波动率网格策略**的现代化投资辅助平台。

## 核心功能

### Phase 1 (MVP) ✅

- ✅ **用户系统**：邮箱注册登录（Supabase Auth）
- ✅ **建仓计算器**：
  - S/A/B/C 评级体系
  - 10年最大回撤分析
  - 双重折扣安全买入价
  - 6步金字塔网格策略
- ✅ **持仓管理**：
  - 交易记录
  - 持仓概览
  - 盈亏分析
  - 偏离度提醒（对比安全买入价）
- ✅ **投资笔记**：记录每日投资想法

### Phase 2 (AI Coach) 🚧

- 🚧 **笔记向量化**：使用 pgvector + OpenAI Embeddings
- 🚧 **RAG 检索**：基于历史笔记的智能问答
- 🚧 **定时回顾**：AI 分析交易决策质量
- 🚧 **Chat with Portfolio**：与你的投资组合对话

## 技术栈

### 后端
- **FastAPI** - 高性能 API 框架
- **Supabase (PostgreSQL)** - 数据库 + 认证
- **yfinance** - 股票数据获取
- **LangChain + OpenAI** (Phase 2) - AI 能力

### 前端
- **React 18 + TypeScript** - 现代化前端框架
- **Vite** - 极速构建工具
- **shadcn/ui + TailwindCSS** - 精美 UI 组件
- **TanStack Query** - 数据状态管理
- **Zustand** - 全局状态管理

### DevOps
- **Docker + Docker Compose** - 容器化部署
- **Nginx** - 生产环境前端服务器

## 快速开始

### 前置要求

- Docker & Docker Compose
- Supabase 账号

### 1. 克隆项目

```bash
git clone <repository-url>
cd tllr
```

### 2. 配置环境

```bash
# 手动创建 .env 文件（详见 ENV_SETUP.md）
# 填入你的 Supabase 配置：
# SUPABASE_URL=https://xxx.supabase.co
# SUPABASE_KEY=your-anon-key
# SUPABASE_SERVICE_KEY=your-service-key

# 注意：现在使用 Supabase JWT，不需要 SECRET_KEY
```

### 3. 初始化数据库

1. 访问 [Supabase](https://supabase.com) 创建项目
2. 在 SQL Editor 中执行 `database/schema.sql`

### 4. 启动服务

**方式一：使用启动脚本（最简单）**

```bash
# 终端 1 - 启动后端
cd backend && ./start-backend.sh

# 终端 2 - 启动前端
cd frontend && ./start-frontend.sh
```

**方式二：使用 Docker**

```bash
# 使用新版 Docker Compose 命令
docker compose up --build

# 后台运行
docker compose up -d
```

**方式三：手动启动**

```bash
# 后端
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# 前端（新终端）
cd frontend
npm install
npm run dev
```

### 5. 访问应用

- 前端：http://localhost:5173
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

## 项目结构

```
tllr/
├── backend/              # FastAPI 后端
│   ├── app/
│   │   ├── api/         # API 路由
│   │   ├── core/        # 核心配置
│   │   ├── models/      # 数据模型
│   │   ├── schemas/     # Pydantic Schemas
│   │   ├── services/    # 业务逻辑
│   │   └── main.py      # 应用入口
│   └── requirements.txt
│
├── frontend/             # React 前端
│   ├── src/
│   │   ├── components/  # UI 组件
│   │   ├── pages/       # 页面
│   │   ├── hooks/       # 自定义 Hooks
│   │   ├── lib/         # 工具库
│   │   ├── stores/      # 状态管理
│   │   └── types/       # TypeScript 类型
│   └── package.json
│
├── database/             # 数据库脚本
│   └── schema.sql
│
├── docs/                 # 文档
│   ├── SETUP.md         # 部署指南
│   ├── API.md           # API 文档
│   └── DATABASE.md      # 数据库设计
│
├── docker-compose.yml    # Docker 编排
└── README.md
```

## 使用示例

### 1. 分析股票

在"建仓计算器"输入股票代码（如 `AAPL`、`600519.SS`），系统会：

1. 获取10年历史数据
2. 计算 S/A/B/C 评级
3. 分析最大回撤
4. 给出安全买入价
5. 生成6步金字塔建仓策略

### 2. 记录交易

在"我的持仓"添加交易记录：

- 买入/卖出
- 价格、数量、日期
- 可选：添加交易笔记

系统会自动计算：
- 持仓成本
- 当前市值
- 盈亏情况
- 与安全价的偏离度

### 3. 写投资日记

在"投资笔记"记录你的想法：

- 可以关联特定股票
- 支持标签分类
- Phase 2 可被 AI 消费和检索

## API 示例

### 分析股票

```bash
curl -X POST http://localhost:8000/api/v1/stocks/analyze \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL"}'
```

### 获取持仓

```bash
curl http://localhost:8000/api/v1/portfolio/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

详细文档见 [docs/API.md](docs/API.md)

## 开发指南

### 本地开发（不使用 Docker）

**后端:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**前端:**
```bash
cd frontend
npm install
npm run dev
```

### 技术文档

- [部署指南](docs/SETUP.md)
- [API 文档](docs/API.md)
- [数据库设计](docs/DATABASE.md)

## 常见问题

### 股票代码格式

- 美股：`AAPL`, `TSLA`
- A股（上海）：`600519.SS`
- A股（深圳）：`000001.SZ`
- 港股：`0700.HK`

### 数据来源

使用 yfinance，数据免费但有延迟。生产环境建议接入付费数据源。

### 性能优化

- 股票信息会缓存到数据库
- 前端使用 TanStack Query 自动缓存
- 图表数据按需加载

## 贡献

欢迎提交 Issue 和 Pull Request！

## License

MIT

---

**从理性决策开始，成为更好的投资者 🎯**
