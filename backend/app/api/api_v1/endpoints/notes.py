"""
投资笔记相关 API
记录、查询、搜索投资想法
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.schemas.note import Note, NoteCreate, NoteUpdate
from app.services.supabase_srv import SupabaseService
from app.api.deps import get_current_user

router = APIRouter()
supabase_service = SupabaseService()


@router.post("/", response_model=Note, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_data: NoteCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    创建投资笔记
    可以关联股票代码，也可以是独立的投资日记
    """
    user_id = current_user["id"]
    
    note_dict = note_data.model_dump()
    result = supabase_service.create_note(user_id, note_dict)
    
    return Note(**result)


@router.get("/", response_model=List[Note])
async def get_notes(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """
    获取用户的所有笔记
    按创建时间倒序排列
    """
    user_id = current_user["id"]
    
    notes = supabase_service.get_user_notes(user_id, limit=limit)
    
    return [Note(**n) for n in notes]


@router.get("/{note_id}", response_model=Note)
async def get_note(
    note_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    获取单条笔记详情
    """
    note = supabase_service.get_note_by_id(note_id)
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="笔记不存在"
        )
    
    # 验证笔记所有权
    if note["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问此笔记"
        )
    
    return Note(**note)


@router.put("/{note_id}", response_model=Note)
async def update_note(
    note_id: str,
    note_data: NoteUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    更新笔记
    """
    # 检查笔记是否存在且属于当前用户
    note = supabase_service.get_note_by_id(note_id)
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="笔记不存在"
        )
    
    if note["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权修改此笔记"
        )
    
    # 更新笔记
    update_dict = note_data.model_dump(exclude_unset=True)
    result = supabase_service.update_note(note_id, update_dict)
    
    return Note(**result)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    删除笔记
    """
    # 检查笔记是否存在且属于当前用户
    note = supabase_service.get_note_by_id(note_id)
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="笔记不存在"
        )
    
    if note["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权删除此笔记"
        )
    
    supabase_service.delete_note(note_id)
    
    return None

