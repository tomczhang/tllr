"""用户相关的 Pydantic Schema"""

from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserBase(BaseModel):
    """用户基础信息"""
    email: EmailStr
    username: Optional[str] = None


class UserCreate(UserBase):
    """用户注册"""
    password: str


class UserLogin(BaseModel):
    """用户登录"""
    email: EmailStr
    password: str


class UserProfile(UserBase):
    """用户资料"""
    id: str
    risk_preference: Optional[str] = None  # 保守/激进
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Token 响应"""
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

