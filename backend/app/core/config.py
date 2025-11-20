"""
应用配置管理
使用 Pydantic Settings 管理环境变量
"""

from typing import List
from pydantic_settings import BaseSettings
from pydantic import validator


class Settings(BaseSettings):
    """应用配置"""
    
    # 基础配置
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Supabase 配置
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str
    
    # CORS 配置
    BACKEND_CORS_ORIGINS: List[str] = []
    
    # 注意：不再需要 SECRET_KEY、ALGORITHM、ACCESS_TOKEN_EXPIRE_MINUTES
    # JWT 现在完全由 Supabase 管理
    
    # OpenAI 配置 (Phase 2)
    OPENAI_API_KEY: str = ""
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

