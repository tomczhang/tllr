# 数据库设计文档

## 概述

使用 **Supabase (PostgreSQL)** 作为数据库，支持关系型数据和向量搜索（Phase 2）。

## 表结构

### 1. profiles - 用户资料表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键，关联 auth.users |
| username | TEXT | 用户名 |
| email | TEXT | 邮箱 |
| risk_preference | TEXT | 风险偏好：conservative/moderate/aggressive |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**索引:**
- PRIMARY KEY (id)

**RLS 策略:**
- 用户只能查看和更新自己的资料

---

### 2. stocks - 股票信息缓存表

| 字段 | 类型 | 说明 |
|------|------|------|
| symbol | TEXT | 股票代码（主键） |
| company_name | TEXT | 公司名称 |
| sector | TEXT | 行业 |
| market_cap | BIGINT | 市值 |
| last_updated | TIMESTAMP | 最后更新时间 |

**用途:** 缓存股票基础信息，减少 yfinance 调用次数

---

### 3. transactions - 交易记录表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户ID（外键 -> profiles.id） |
| symbol | TEXT | 股票代码 |
| type | TEXT | 交易类型：BUY/SELL |
| price | NUMERIC(12,2) | 交易价格 |
| quantity | NUMERIC(12,4) | 交易数量 |
| trade_date | TIMESTAMP | 交易日期 |
| note_id | UUID | 关联的笔记ID（可选） |
| created_at | TIMESTAMP | 记录创建时间 |

**索引:**
- user_id
- symbol
- trade_date (DESC)

**RLS 策略:**
- 用户只能查看和创建自己的交易记录

---

### 4. notes - 投资笔记表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户ID（外键 -> profiles.id） |
| symbol | TEXT | 关联股票代码（可选） |
| content | TEXT | 笔记内容 |
| tags | TEXT[] | 标签数组 |
| embedding | VECTOR(1536) | 文本向量（Phase 2，需 pgvector） |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**索引:**
- user_id
- symbol
- created_at (DESC)
- embedding (ivfflat, Phase 2)

**RLS 策略:**
- 用户可以 CRUD 自己的笔记

---

## 关系图

```
auth.users (Supabase Auth)
    ↓
profiles ←─── transactions
    ↓             ↓
    └──────→ notes
                ↑
          (关联 symbol)
```

## Phase 2 扩展

### 启用 pgvector

在 Supabase 控制台执行：

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- 为笔记添加向量索引
CREATE INDEX ON public.notes 
USING ivfflat (embedding vector_cosine_ops);
```

### 向量搜索示例

```sql
-- 查找语义相似的笔记
SELECT 
  id, 
  content, 
  1 - (embedding <=> query_embedding) AS similarity
FROM notes
WHERE user_id = 'user-uuid'
ORDER BY embedding <=> query_embedding
LIMIT 10;
```

## 备份策略

Supabase 自动每日备份，也可以手动导出：

```bash
# 导出数据
supabase db dump -f backup.sql

# 恢复数据
psql -h db.xxx.supabase.co -U postgres -f backup.sql
```

## 性能优化建议

1. **定期清理 stocks 缓存**：删除超过 7 天未更新的记录
2. **分区 transactions 表**：如果数据量大，按年份分区
3. **向量索引调优**（Phase 2）：根据数据量调整 ivfflat 列表数量

