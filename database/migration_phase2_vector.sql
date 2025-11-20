-- Phase 2: 添加向量搜索支持
-- 在准备好实施 Phase 2 时执行此脚本

-- 1. 启用 pgvector 扩展
-- 注意：在 Supabase 中，需要在 Dashboard -> Database -> Extensions 中先启用 vector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 为 notes 表添加 embedding 字段
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS embedding VECTOR(1536);

-- 3. 为 embedding 创建索引（提高向量搜索性能）
-- 使用 ivfflat 索引，适合大规模向量搜索
-- lists 参数根据数据量调整：建议设为 rows/1000
CREATE INDEX IF NOT EXISTS idx_notes_embedding 
ON public.notes 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 4. 创建向量搜索函数（示例）
CREATE OR REPLACE FUNCTION search_similar_notes(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  user_id_filter UUID
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  symbol TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    notes.id,
    notes.content,
    notes.symbol,
    1 - (notes.embedding <=> query_embedding) AS similarity
  FROM public.notes
  WHERE 
    notes.user_id = user_id_filter
    AND notes.embedding IS NOT NULL
    AND 1 - (notes.embedding <=> query_embedding) > match_threshold
  ORDER BY notes.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 5. 使用示例
-- SELECT * FROM search_similar_notes(
--   '[0.1, 0.2, ...]'::vector(1536),  -- 查询向量
--   0.7,                                -- 相似度阈值
--   10,                                 -- 返回数量
--   'user-uuid'                         -- 用户ID
-- );

