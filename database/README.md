# 数据库迁移指南

## MVP 阶段（现在）

### 1. 执行基础 Schema

在 Supabase SQL Editor 中执行：

```bash
database/schema.sql
```

这会创建所有必需的表：
- ✅ profiles（用户资料）
- ✅ stocks（股票缓存）
- ✅ transactions（交易记录）
- ✅ notes（投资笔记，**不含** embedding 字段）

### 常见问题

**Q: 执行时出现 "type vector does not exist" 错误？**

A: 说明你使用了旧版本的 `schema.sql`。最新版本已经注释掉了 `embedding` 字段。请使用更新后的脚本。

**Q: RLS 策略创建失败？**

A: 确保：
1. 在 Supabase 项目中执行
2. 有足够的权限
3. auth.users 表存在

---

## Phase 2 阶段（未来）

当你准备实施 AI 功能时：

### 1. 启用 pgvector 扩展

在 Supabase Dashboard 中：
1. 进入 **Database** → **Extensions**
2. 搜索 **vector**
3. 点击启用

或在 SQL Editor 中执行：
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. 执行 Phase 2 迁移

```bash
database/migration_phase2_vector.sql
```

这会：
- ✅ 添加 `embedding` 字段到 notes 表
- ✅ 创建向量索引
- ✅ 创建向量搜索函数

---

## 验证数据库

执行以下查询验证表是否创建成功：

```sql
-- 查看所有表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 查看 notes 表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notes';

-- 测试创建用户资料
SELECT * FROM public.profiles LIMIT 1;
```

---

## 回滚

如果需要重置数据库：

```sql
-- 警告：这会删除所有数据！
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.stocks CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();
```

---

## 数据迁移路径

```
MVP (现在)
├── schema.sql ✅
│
Phase 2 (未来)
├── migration_phase2_vector.sql
│
Phase 3 (未来可能)
├── migration_phase3_websocket.sql
└── migration_phase3_notifications.sql
```

