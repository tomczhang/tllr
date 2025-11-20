"""股票分析相关的 Pydantic Schema"""

from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime


class StockInfo(BaseModel):
    """股票基础信息"""
    symbol: str
    company_name: Optional[str] = None
    sector: Optional[str] = None
    market_cap: Optional[float] = None
    current_price: float


class ScoreDetail(BaseModel):
    """评分详情"""
    score: str  # S/A/B/C
    reason: str
    points: float


class PyramidLevel(BaseModel):
    """金字塔网格策略的一层"""
    level: int
    price: float
    percentage: float  # 资金占比
    description: str


class AnalysisResult(BaseModel):
    """建仓分析结果"""
    symbol: str
    stock_info: StockInfo
    current_price: float
    
    # 评分信息
    overall_score: str  # S/A/B/C
    score_details: List[ScoreDetail]
    
    # 10年回撤分析
    max_drawdown: float
    max_drawdown_date: str
    
    # 安全买入价
    safe_buy_price: float
    discount_rate: float
    
    # 金字塔网格策略
    pyramid_strategy: List[PyramidLevel]
    
    # 建议
    recommendation: str
    risk_warning: str


class StockSearchRequest(BaseModel):
    """股票搜索请求"""
    symbol: str


class StockHistoryData(BaseModel):
    """历史价格数据"""
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int

