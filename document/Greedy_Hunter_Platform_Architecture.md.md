“贪婪猎人” (Greedy Hunter) 投资平台架构与路线图

版本： 1.0
目标： 构建一个基于“价值投资 + 波动率网格”策略的现代化投资辅助平台。

1. 项目全景图

核心理念

平台不仅仅是一个记账工具，更是一个**“理性的外挂大脑”**。它通过严格的计算公式（S/A/B 级评分、双重折扣、10年回撤分析）来约束用户的感性操作，并通过 AI 长期跟踪用户的决策质量。

阶段划分

Phase 1 (MVP): 工具属性。解决“怎么买”、“买多少”以及“现在持仓怎么样”的问题。

Phase 2 (AI Coach): 私教属性。解决“为什么要买”、“我当初想得对不对”以及“如何改进”的问题。

2. 技术栈选型 (Tech Stack)

为了保证开发效率与性能，我们采用 前后端分离 + 容器化 的现代架构。

领域

选型

理由

前端 (Frontend)

React + Vite

生态最丰富，构建速度快。

UI 组件库

ShadcnUI + TailwindCSS

极其适合构建 Dashboard 类应用，美观且可定制性强。

状态管理/请求

Zustand + TanStack Query

TanStack Query 处理服务端数据缓存（如股价、持仓）是神器。

图表库

Recharts

配合 React 渲染 K 线、网格策略表和资产曲线。

后端 (Backend)

Python FastAPI

高性能，原生支持异步，完美衔接 Pandas 金融计算和 AI 库。

数据源

yfinance (MVP)

免费、易用。后期可接入付费 API (如 AlphaVantage) 提高稳定性。

数据库 & Auth

Supabase (PostgreSQL)

MVP 神器。这就搞定了：



1. Auth: 注册/登陆/JWT。



2. DB: 关系型数据存储。



3. Vector: 二期直接用 pgvector 存笔记向量。

部署 (DevOps)

Docker + Docker Compose

一键启动前后端，方便部署到任何云服务器。

3. Phase 1: MVP 核心功能设计 (The Foundation)

MVP 的核心任务是把我们之前的 Streamlit 脚本逻辑服务化，并加上用户系统。

A. 用户模块 (Identity)

功能： 邮箱注册、登陆、密码找回。

实现： 直接使用 Supabase Auth。前端使用 Supabase JS Client，后端 FastAPI 通过 JWT 验证用户身份。

数据表： profiles (关联 Supabase auth.users)。

B. 投资建仓分析器 (The Calculator)

这是平台的灵魂，将之前的 Python 脚本逻辑 API 化。

功能：

用户输入股票代码。

后端抓取实时价格 + 10年历史数据。

计算引擎：

执行“8分制体检表”评分 (S/A/B 级)。

计算 10年最大回撤 (MDD)。

计算安全买入价 (双重折扣公式)。

生成 6步金字塔网格策略表 (Pyramid Strategy)。

输出： 给前端返回一个 JSON，包含评分详情、建议买入价、网格挂单列表。

C. 用户仓位管理 (Portfolio)

功能： 记录用户的实际持仓。

操作：

Add Trade (记一笔): 买入/卖出，输入代码、价格、数量、日期。

Dashboard (看板): 显示总资产、个股盈亏、当前持仓占比。

亮点逻辑：

偏离度提醒： 对比“实际持仓成本”和计算器算出的“安全买入价”，如果偏差过大，UI 显示警告（如“你的成本过高，偏离安全线 30%”）。

4. Phase 2: AI 教练功能设计 (The Brain)

二期核心是引入 “笔记系统 + LLM”，让数据活起来。

A. 投资笔记系统 (Investment Journal)

工具： 前端集成 Tiptap 编辑器 (无头富文本编辑器，完美适配 ShadcnUI 风格)。

场景：

交易时强制弹窗： 用户在录入交易时，系统弹窗询问：“你为什么买入？核心逻辑是什么？”（强制理性思考）。

随意记录： 对某只股票的调研随笔。

后台处理：

笔记保存时，FastAPI 调用 Embedding 模型（如 OpenAI text-embedding-3-small），将文本转化为向量，存入 Supabase 的 notes 表（开启 pgvector 插件）。

B. 定时回顾与 AI 分析 (The Reviewer)

机制： 后端设置 Celery 定时任务（或简单的 APScheduler）。

功能：

每周回顾： 每周五收盘后，AI 拉取用户本周操作 + 笔记，结合本周股价走势，生成简报。

决策打分： AI 分析：“你在 3 个月前记录看好腾讯是因为‘游戏版号恢复’，现在版号已发，股价涨了 20%，你的逻辑验证成功。”

Chat with Portfolio (RAG): 用户可以问：“我过去一年在什么情况下亏损最多？” AI 检索历史笔记和交易记录回答：“你通常在笔记中表现出‘怕踏空’情绪时（如追高英伟达）亏损最多。”

5. 数据库模型设计 (Schema Draft)

这是基于 PostgreSQL 的核心表结构设计：

-- 1. 用户表 (扩展 Supabase Auth)
create table public.profiles (
  id uuid references auth.users not null,
  username text,
  risk_preference text, -- 风险偏好 (保守/激进)
  primary key (id)
);

-- 2. 股票基础信息缓存 (减少 yfinance 调用)
create table public.stocks (
  symbol text primary key,
  company_name text,
  sector text,
  market_cap bigint,
  last_updated timestamp
);

-- 3. 交易记录表
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  symbol text references public.stocks(symbol),
  type text check (type in ('BUY', 'SELL')),
  price numeric,
  quantity numeric,
  trade_date timestamp,
  note_id uuid -- 关联当时的笔记
);

-- 4. 投资笔记表 (AI 核心)
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  symbol text, -- 可为空，如果是通用市场笔记
  content text, -- 笔记原文
  tags text[],
  embedding vector(1536), -- [Phase 2] 向量数据
  created_at timestamp default now()
);


6. 开发路线图 (Roadmap)

Sprint 1: 基础架构搭建 (Week 1)

[ ] 初始化 Docker 环境 (FastAPI + Postgres/Supabase)。

[ ] 搭建 React + ShadcnUI 前端脚手架。

[ ] 配置 Supabase Auth，打通前后端登陆流程。

Sprint 2: 核心计算器移植 (Week 2)

[ ] 将 Streamlit 中的 Python 算法移植到 FastAPI 的 Service 层。

[ ] 实现 GET /api/analyze/{ticker} 接口，返回评分和网格策略。

[ ] 前端实现股票搜索和分析结果展示页（K线图 + 表格）。

Sprint 3: 仓位管理 MVP (Week 3)

[ ] 实现交易录入接口 (CRUD)。

[ ] 实现简单的持仓看板 (Dashboard)。

[ ] 里程碑：MVP 上线，邀请种子用户（自己）使用。

Sprint 4: 笔记与 AI (Phase 2 起步)

[ ] 引入 Tiptap 编辑器，实现笔记增删改查。

[ ] 接入 OpenAI/Gemini API。

[ ] 实现“AI 每日行情点评”小功能（热身）。

7. 总结

这个架构最强的地方在于**“进可攻，退可守”**：

MVP 阶段非常轻量，FastAPI 直接调 yfinance，Supabase 托管数据库，没有任何复杂的运维负担。

二期阶段无需重构，Postgres 原生支持向量搜索，FastAPI 天然适合做 AI 中间件，平滑过渡到智能投顾平台。

建议立即行动： 从 Docker Compose 跑通 Hello World 开始！