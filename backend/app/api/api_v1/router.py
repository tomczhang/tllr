"""
API v1 主路由
汇总所有子路由
"""

from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, stocks, portfolio, notes

api_router = APIRouter()

# 注册各个模块的路由
api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(stocks.router, prefix="/stocks", tags=["股票分析"])
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["持仓管理"])
api_router.include_router(notes.router, prefix="/notes", tags=["投资笔记"])

