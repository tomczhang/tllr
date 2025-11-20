"""
FastAPI 应用主入口
配置 CORS、中间件、路由等
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api_v1.router import api_router

app = FastAPI(
    title="贪婪猎人投资平台 API",
    description="基于价值投资+波动率网格策略的投资辅助平台",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """健康检查端点"""
    return {
        "message": "欢迎使用贪婪猎人投资平台 API",
        "version": "1.0.0",
        "status": "运行中"
    }


@app.get("/health")
async def health_check():
    """服务健康检查"""
    return {"status": "healthy"}

