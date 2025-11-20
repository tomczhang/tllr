Greedy Hunter Project Structure

这是一个标准的现代全栈应用结构，采用了前后端分离的设计。

根目录概览

greedy-hunter/
├── backend/                 # Python FastAPI 后端
├── frontend/                # React + Vite 前端
├── docker-compose.yml       # 容器编排配置
├── .env                     # 全局环境变量 (API Keys, DB URL)
├── .gitignore
└── README.md


1. 后端结构 (Backend - FastAPI)

后端采用了典型的分层架构（Layered Architecture），将业务逻辑（Service）、路由（Router）和数据模型（Schema）分离。

backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 入口文件 (初始化 App, CORS, 中间件)
│   │
│   ├── api/                 # 路由层 (Controller)
│   │   ├── __init__.py
│   │   ├── api_v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py    # 汇总所有路由
│   │   │   └── endpoints/   # 具体业务的接口
│   │   │       ├── auth.py       # 用户认证 (Supabase Auth)
│   │   │       ├── stocks.py     # 股票查询、计算器接口
│   │   │       ├── portfolio.py  # 持仓管理 CRUD
│   │   │       └── notes.py      # (二期) 笔记相关
│   │
│   ├── core/                # 核心配置
│   │   ├── config.py        # 环境变量读取 (Pydantic Settings)
│   │   └── security.py      # JWT 验证逻辑
│   │
│   ├── schemas/             # Pydantic 模型 (数据验证 & 序列化)
│   │   ├── stock.py         # 定义股票分析的输入/输出格式
│   │   ├── portfolio.py
│   │   └── user.py
│   │
│   ├── services/            # 业务逻辑层 (核心算法都在这！)
│   │   ├── calculator.py    # ★ 贪婪猎人核心算法 (S/A/B评级, 价格计算)
│   │   ├── yfinance_srv.py  # yfinance 数据抓取封装
│   │   ├── supabase_srv.py  # Supabase DB 操作封装
│   │   └── ai_coach.py      # (二期) LLM 调用逻辑
│   │
│   └── utils/               # 工具函数
│       └── math_utils.py    # 计算回撤等数学公式
│
├── tests/                   # 单元测试
├── Dockerfile               # 后端镜像构建文件
├── requirements.txt         # 依赖列表 (fastapi, uvicorn, yfinance, supabase)
└── run.sh                   # 启动脚本


关键文件说明：

app/services/calculator.py: 这是你的“核武器”。把之前 calculate_safe_buy_price、S/A/B 评级逻辑、10年回撤 计算全部封装成 Class 或函数放在这里。不要写在 api/ 里。

app/api/api_v1/endpoints/stocks.py: 这里只负责接收 HTTP 请求，调用 services.calculator 算出结果，然后返回 JSON。

2. 前端结构 (Frontend - React + Vite)

前端使用 Feature-based（基于功能）或 Domain-based（基于领域）的混合结构，配合 ShadcnUI 的组件管理方式。

frontend/
├── public/
├── src/
│   ├── assets/              # 静态资源
│   │
│   ├── components/          # UI 组件库
│   │   ├── ui/              # ★ ShadcnUI 自动生成的组件 (Button, Card, Input...)
│   │   ├── layout/          # 布局组件 (Header, Sidebar, Layout)
│   │   └── shared/          # 自定义通用组件 (StockCard, MetricBadge)
│   │
│   ├── features/            # ★ 按业务功能划分 (推荐)
│   │   ├── auth/            # 登录/注册页面及逻辑
│   │   ├── calculator/      # 建仓计算器相关
│   │   │   ├── components/  # 计算器专用组件 (GridTable, ScoreCard)
│   │   │   └── CalculatorPage.tsx
│   │   ├── portfolio/       # 持仓管理相关
│   │   │   ├── components/  # (PortfolioTable, AddTradeModal)
│   │   │   └── PortfolioPage.tsx
│   │   └── notes/           # (二期) 笔记编辑器
│   │
│   ├── hooks/               # 自定义 Hooks
│   │   ├── use-stock-data.ts
│   │   └── use-auth.ts
│   │
│   ├── lib/                 # 库配置
│   │   ├── api.ts           # Axios/Fetch 封装
│   │   ├── supabase.ts      # Supabase Client 初始化
│   │   └── utils.ts         # ShadcnUI 的工具函数 (cn)
│   │
│   ├── store/               # 状态管理 (Zustand)
│   │   └── use-user-store.ts
│   │
│   ├── types/               # TypeScript 类型定义
│   │   └── api.ts           # 后端接口返回的数据类型
│   │
│   ├── App.tsx              # 路由配置
│   └── main.tsx             # 入口
│
├── Dockerfile               # 前端镜像构建文件 (Nginx 托管或 Node 运行)
├── package.json
├── tailwind.config.js
└── vite.config.ts


3. 基础设施 (Docker)

在根目录下，使用 docker-compose.yml 一键启动整个环境。

docker-compose.yml 示例：

version: '3.8'

services:
  # 1. 后端服务
  backend:
    build: ./backend
    container_name: greedy_backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app       # 开发模式挂载，改代码自动热重载
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  # 2. 前端服务 (开发环境)
  frontend:
    build: ./frontend
    container_name: greedy_frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules    # 避免覆盖容器内的依赖
    environment:
      - VITE_API_URL=http://localhost:8000/api/v1
    depends_on:
      - backend
    # 开发模式下直接用 vite 启动
    command: npm run dev -- --host


4. 开发流程建议

初始化：

先创建 backend 和 frontend 文件夹。

在 backend 里 pip install fastapi uvicorn yfinance supabase 并生成 requirements.txt。

在 frontend 里 npm create vite@latest .。

先写核心逻辑 (Service Layer)：

在 backend/app/services/calculator.py 里，把我们在 AI Studio 里跑通的 Python 代码粘贴进去，改造成 Class 或函数。

再写接口 (API Layer)：

在 backend/app/api/ 里写一个简单的 API，接受股票代码，调用上面的 Service，返回 JSON。

最后写界面 (UI Layer)：

在前端用 ShadcnUI 画一个输入框，调用 API，把返回的 JSON 展示出来。

这个结构既清晰又足以支撑你未来的 AI 功能扩展（比如在 services 下加一个 ai_agent.py）。