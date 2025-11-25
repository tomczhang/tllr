"""持仓管理相关的 Pydantic Schema"""

from typing import List, Optional, Dict
from pydantic import BaseModel, Field
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


# ==================== 持仓健康度分析相关 Schema ====================

class HoldingInput(BaseModel):
    """持仓输入"""
    ticker: str = Field(..., description="股票代码")
    market_value: float = Field(..., gt=0, description="市值（美元）")
    quantity: Optional[float] = Field(None, description="持仓数量")
    avg_cost: Optional[float] = Field(None, description="平均成本")


class PortfolioAnalysisRequest(BaseModel):
    """持仓分析请求"""
    holdings: List[HoldingInput] = Field(..., description="持仓列表")
    cash: float = Field(default=0.0, ge=0, description="现金（美元）")


class AssetScoreResponse(BaseModel):
    """资产评分响应"""
    category: str = Field(..., description="资产类别")
    category_display: str = Field(..., description="资产类别显示名称")
    target_weight: float = Field(..., description="目标权重 (%)")
    target_value: float = Field(..., description="目标金额")
    actual_value: float = Field(..., description="实际持仓金额")
    actual_weight: float = Field(..., description="实际权重 (%)")
    score: float = Field(..., description="得分 (0-100)")
    status: str = Field(..., description="状态（达标/不足/超配）")
    status_color: str = Field(..., description="状态颜色（用于前端显示）")
    gap_value: float = Field(..., description="缺口金额（负数表示超配）")
    gap_weight: float = Field(..., description="缺口权重 (%)")


class PortfolioHealthResponse(BaseModel):
    """持仓健康度响应"""
    total_value: float = Field(..., description="总资产")
    compliance_score: float = Field(..., description="合规评分 (0-100)")
    grade: str = Field(..., description="评级 (S/A/B/C/D)")
    grade_color: str = Field(..., description="评级颜色")
    grade_description: str = Field(..., description="评级描述")
    
    asset_scores: List[AssetScoreResponse] = Field(..., description="各资产评分")
    
    conservative_actual: float = Field(..., description="实际保守仓位 (%)")
    conservative_target: float = Field(..., description="目标保守仓位 (%)")
    aggressive_actual: float = Field(..., description="实际激进仓位 (%)")
    aggressive_target: float = Field(..., description="目标激进仓位 (%)")
    
    recommendations: List[str] = Field(..., description="调仓建议")
    
    # 额外的可视化数据
    chart_data: Dict = Field(..., description="图表数据（用于前端可视化）")


class TargetAllocationInfo(BaseModel):
    """目标配置信息"""
    category: str = Field(..., description="资产类别")
    category_display: str = Field(..., description="资产类别显示名称")
    global_weight: float = Field(..., description="全局权重 (%)")
    description: str = Field(..., description="描述")
    segment: str = Field(..., description="所属板块（Conservative/Aggressive）")


class PortfolioTargetResponse(BaseModel):
    """持仓目标配置响应"""
    target_allocations: List[TargetAllocationInfo] = Field(..., description="目标配置列表")
    conservative_weight: float = Field(default=70.0, description="保守仓位权重 (%)")
    aggressive_weight: float = Field(default=30.0, description="激进仓位权重 (%)")
    description: str = Field(..., description="配置说明")

