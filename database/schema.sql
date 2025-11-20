-- 贪婪猎人投资平台数据库结构
-- 数据库：PostgreSQL (Supabase)
-- 注意：在 Supabase 中执行此脚本

-- 1. 用户资料表（扩展 Supabase Auth）
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  username TEXT,
  email TEXT NOT NULL,
  risk_preference TEXT DEFAULT 'moderate', -- 风险偏好 (conservative/moderate/aggressive)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能访问自己的数据
CREATE POLICY "用户可以查看自己的资料" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的资料" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. 股票信息缓存表
CREATE TABLE IF NOT EXISTS public.stocks (
  symbol TEXT PRIMARY KEY,
  company_name TEXT,
  sector TEXT,
  market_cap BIGINT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 交易记录表
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
  price NUMERIC(12, 2) NOT NULL,
  quantity NUMERIC(12, 4) NOT NULL,
  trade_date TIMESTAMP WITH TIME ZONE NOT NULL,
  note_id UUID, -- 关联的笔记ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_symbol ON public.transactions(symbol);
CREATE INDEX idx_transactions_trade_date ON public.transactions(trade_date DESC);

-- 启用 RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可以查看自己的交易" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的交易" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. 投资笔记表
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT, -- 关联的股票代码（可为空）
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  -- embedding VECTOR(1536), -- Phase 2: 向量数据（需要先启用 pgvector 扩展）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_notes_symbol ON public.notes(symbol);
CREATE INDEX idx_notes_created_at ON public.notes(created_at DESC);

-- 启用 RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可以查看自己的笔记" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的笔记" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的笔记" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的笔记" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);

-- 5. 函数：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 profiles 和 notes 添加触发器
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Phase 2: 启用 pgvector 扩展（用于笔记向量搜索）
-- 注意：需要在 Supabase 控制台中启用此扩展
-- CREATE EXTENSION IF NOT EXISTS vector;

-- 为 embedding 创建索引（Phase 2）
-- CREATE INDEX ON public.notes USING ivfflat (embedding vector_cosine_ops);

-- 7. 初始化函数：用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

