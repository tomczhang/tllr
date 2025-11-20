"""持仓管理相关的 Pydantic Schema"""

from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal


class TransactionBase(BaseModel):
    """交易记录基础"""
    symbol: str
    type: str  # BUY or SELL
    price: Decimal
    quantity: Decimal
    trade_date: datetime
    note_content: Optional[str] = None  # 交易时的想法


class TransactionCreate(TransactionBase):
    """创建交易记录"""
    pass


class Transaction(TransactionBase):
    """交易记录"""
    id: str
    user_id: str
    note_id: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class PositionSummary(BaseModel):
    """单只股票的持仓汇总"""
    symbol: str
    company_name: Optional[str] = None
    total_quantity: Decimal
    avg_cost: Decimal
    current_price: float
    market_value: float
    unrealized_pnl: float  # 浮动盈亏
    unrealized_pnl_percent: float
    
    # 偏离度提醒
    safe_buy_price: Optional[float] = None
    deviation_percent: Optional[float] = None
    warning_message: Optional[str] = None


class PortfolioOverview(BaseModel):
    """投资组合概览"""
    total_positions: int
    total_market_value: float
    total_cost: float
    total_pnl: float
    total_pnl_percent: float
    positions: List[PositionSummary]
    
    # 资产分布
    sector_allocation: dict  # 行业分布
    top_holdings: List[PositionSummary]  # Top 5 持仓

