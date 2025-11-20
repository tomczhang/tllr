"""
持仓管理相关 API
交易记录、持仓概览、盈亏分析
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.schemas.portfolio import (
    TransactionCreate, 
    Transaction, 
    PortfolioOverview,
    PositionSummary
)
from app.services.supabase_srv import SupabaseService
from app.services.portfolio_srv import PortfolioService
from app.api.deps import get_current_user

router = APIRouter()
supabase_service = SupabaseService()
portfolio_service = PortfolioService()


@router.post("/transactions", response_model=Transaction, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction: TransactionCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    记录一笔交易
    支持买入(BUY)和卖出(SELL)
    """
    user_id = current_user["id"]
    
    # 验证交易类型
    if transaction.type not in ["BUY", "SELL"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="交易类型必须是 BUY 或 SELL"
        )
    
    # 创建交易记录
    transaction_data = transaction.model_dump()
    
    # 如果有笔记内容，先创建笔记
    note_id = None
    if transaction.note_content:
        note_data = {
            "content": transaction.note_content,
            "symbol": transaction.symbol,
            "tags": ["交易笔记"]
        }
        note = supabase_service.create_note(user_id, note_data)
        note_id = note["id"]
        transaction_data["note_id"] = note_id
    
    # 移除 note_content（数据库中没有这个字段）
    transaction_data.pop("note_content", None)
    
    result = supabase_service.create_transaction(user_id, transaction_data)
    
    return Transaction(**result)


@router.get("/transactions", response_model=List[Transaction])
async def get_transactions(current_user: dict = Depends(get_current_user)):
    """
    获取用户所有交易记录
    """
    user_id = current_user["id"]
    transactions = supabase_service.get_user_transactions(user_id)
    
    return [Transaction(**t) for t in transactions]


@router.get("/transactions/{symbol}", response_model=List[Transaction])
async def get_transactions_by_symbol(
    symbol: str,
    current_user: dict = Depends(get_current_user)
):
    """
    获取特定股票的交易记录
    """
    user_id = current_user["id"]
    symbol = symbol.upper()
    
    transactions = supabase_service.get_transactions_by_symbol(user_id, symbol)
    
    return [Transaction(**t) for t in transactions]


@router.get("/positions", response_model=List[PositionSummary])
async def get_positions(current_user: dict = Depends(get_current_user)):
    """
    获取当前持仓列表
    包含成本、市值、盈亏等信息
    """
    user_id = current_user["id"]
    
    positions = portfolio_service.calculate_positions(user_id)
    
    return positions


@router.get("/overview", response_model=PortfolioOverview)
async def get_portfolio_overview(current_user: dict = Depends(get_current_user)):
    """
    获取投资组合概览
    包含总资产、盈亏、持仓分布等
    """
    user_id = current_user["id"]
    
    overview = portfolio_service.get_portfolio_overview(user_id)
    
    return overview

