"""笔记相关的 Pydantic Schema"""

from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime


class NoteBase(BaseModel):
    """笔记基础"""
    content: str
    symbol: Optional[str] = None  # 关联的股票代码
    tags: Optional[List[str]] = []


class NoteCreate(NoteBase):
    """创建笔记"""
    pass


class NoteUpdate(BaseModel):
    """更新笔记"""
    content: Optional[str] = None
    symbol: Optional[str] = None
    tags: Optional[List[str]] = None


class Note(NoteBase):
    """笔记"""
    id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class NoteSearchRequest(BaseModel):
    """笔记搜索请求（Phase 2 - RAG）"""
    query: str
    limit: int = 10


class NoteSearchResult(BaseModel):
    """笔记搜索结果（Phase 2 - RAG）"""
    note: Note
    similarity_score: float
    relevant_excerpt: str

