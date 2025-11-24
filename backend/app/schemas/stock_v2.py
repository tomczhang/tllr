"""
新8分制评分系统的 Schema 定义
基于价值投资理念的质量评分体系
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


# ==================== 请求相关 ====================

class UserConfirmations(BaseModel):
    """用户确认的指标"""
    # 半自动化指标（可选，None表示使用系统预判）
    gross_margin: Optional[bool] = Field(None, description="毛利率是否满足要求")
    roe: Optional[bool] = Field(None, description="ROE是否满足要求")
    financial_safety: Optional[bool] = Field(None, description="财务安全（现金>负债）")
    shareholder_returns: Optional[bool] = Field(None, description="是否有分红或回购")
    
    # 完全人工指标（必填）
    industry_dominance: bool = Field(..., description="是否行业老大/双寡头")
    moat: bool = Field(..., description="是否有高转换成本/护城河")


class StockAnalysisRequestV2(BaseModel):
    """股票分析请求（新版）"""
    symbol: str = Field(..., description="股票代码")
    intrinsic_value: float = Field(..., gt=0, description="用户输入的内在估值价格")
    user_confirmations: UserConfirmations = Field(..., description="用户确认的评分指标")


# ==================== 响应相关 ====================

class HardMetric(BaseModel):
    """完全自动化指标"""
    name: str = Field(..., description="指标名称")
    key: str = Field(..., description="指标键名")
    value: Optional[float] = Field(None, description="原始数值")
    value_display: str = Field(..., description="显示文本")
    threshold: str = Field(..., description="阈值标准")
    passed: bool = Field(..., description="是否通过")
    points: int = Field(..., description="得分（0或1）")
    auto: bool = Field(True, description="是否自动计算")


class AssistedMetric(BaseModel):
    """半自动化指标"""
    name: str = Field(..., description="指标名称")
    key: str = Field(..., description="指标键名")
    value: Optional[float] = Field(None, description="原始数值")
    value_display: str = Field(..., description="显示文本")
    threshold: str = Field(..., description="阈值标准")
    raw_data: Optional[Dict[str, Any]] = Field(None, description="原始数据（供用户参考）")
    system_suggestion: bool = Field(..., description="系统建议是否通过")
    user_confirmed: bool = Field(..., description="用户最终确认结果")
    passed: bool = Field(..., description="是否通过（取user_confirmed）")
    points: int = Field(..., description="得分（0或1）")


class SoftMetric(BaseModel):
    """完全人工指标"""
    name: str = Field(..., description="指标名称")
    key: str = Field(..., description="指标键名")
    description: str = Field(..., description="指标说明")
    user_confirmed: bool = Field(..., description="用户确认结果")
    passed: bool = Field(..., description="是否通过")
    points: int = Field(..., description="得分（0或1）")


class QualityAssessment(BaseModel):
    """质量评估结果"""
    hard_metrics: List[HardMetric] = Field(..., description="完全自动化指标（2项）")
    assisted_metrics: List[AssistedMetric] = Field(..., description="半自动化指标（4项）")
    soft_metrics: List[SoftMetric] = Field(..., description="完全人工指标（2项）")
    total_score: int = Field(..., ge=0, le=8, description="总分（0-8）")
    tier: str = Field(..., description="评级（S/A/B/C）")
    tier_description: str = Field(..., description="评级描述")
    quality_coefficient: float = Field(..., description="品质系数（0.50/0.70/0.85/0.95）")


class MarketAnalysis(BaseModel):
    """市场分析"""
    market: str = Field(..., description="市场（US/A/HK）")
    is_hk_s_tier: bool = Field(False, description="是否港股S级（享受特殊豁免）")
    market_discount: float = Field(..., description="市场折扣系数")
    market_discount_reason: str = Field(..., description="折扣原因说明")


class PricingAnalysis(BaseModel):
    """定价分析"""
    intrinsic_value: float = Field(..., description="内在估值价格（用户输入）")
    quality_coefficient: float = Field(..., description="品质系数")
    market_discount: float = Field(..., description="市场折扣")
    safe_buy_price: float = Field(..., description="安全建仓价")
    current_price: float = Field(..., description="当前价格")
    price_gap_percent: float = Field(..., description="价格偏离百分比")
    verdict: str = Field(..., description="价格判断")


class ReverseDCFCheck(BaseModel):
    """反向DCF估值预检 - 双重校验机制"""
    # 第一重校验：市场体检（当前股价）
    current_price: float = Field(..., description="当前股价")
    current_price_implied_growth: Optional[float] = Field(None, description="当前股价隐含增长率（%）")
    
    # 第二重校验：用户估值检查（风控核心）
    user_intrinsic_value: float = Field(..., description="用户输入的内在估值")
    user_value_implied_growth: Optional[float] = Field(None, description="用户估值隐含增长率（%）")
    
    # 共享数据
    eps_ttm: Optional[float] = Field(None, description="过去12个月EPS")
    historical_growth_rate: Optional[float] = Field(None, description="历史平均增长率（%）")
    
    # 市场体检结果（展示信息）
    market_status: str = Field(..., description="市场状态：高估/合理/低估")
    market_message: Optional[str] = Field(None, description="市场分析信息")
    
    # 用户估值风控结果（拦截逻辑）
    user_valuation_status: str = Field(..., description="用户估值状态：合理/乐观/极度乐观")
    user_valuation_warning: Optional[str] = Field(None, description="用户估值警告信息")
    valuation_risk_level: str = Field(..., description="风险等级：low/medium/high/critical")
    
    check_passed: bool = Field(True, description="是否通过预检（可能为False阻止用户）")
    error_message: Optional[str] = Field(None, description="错误信息（如无法获取数据）")


class TechnicalAnalysis(BaseModel):
    """技术分析（保留用于辅助判断）"""
    ma50: float = Field(..., description="50日均线")
    ma200: float = Field(..., description="200日均线")
    high_120d: float = Field(..., description="120日最高价")
    high_120d_date: Optional[str] = Field(None, description="120日最高价日期")
    trading_side: str = Field(..., description="左侧/右侧交易")
    trading_description: str = Field(..., description="交易方式说明")
    max_drawdown: float = Field(..., description="最大回撤")
    max_drawdown_date: str = Field(..., description="最大回撤日期")
    max_drawdown_warning: str = Field(..., description="回撤警示")
    max_drawdown_peak_date: Optional[str] = Field(None, description="最大回撤峰值日期")
    max_drawdown_peak_price: Optional[float] = Field(None, description="最大回撤峰值价格")
    max_drawdown_valley_date: Optional[str] = Field(None, description="最大回撤谷底日期")
    max_drawdown_valley_price: Optional[float] = Field(None, description="最大回撤谷底价格")


class PyramidLevel(BaseModel):
    """金字塔网格策略层级"""
    level: int = Field(..., description="第几步")
    price: float = Field(..., description="买入价格")
    percentage: float = Field(..., description="仓位占比")
    description: str = Field(..., description="状态描述")


class GridTierInfo(BaseModel):
    """金字塔网格档位信息"""
    tier_name: str = Field(..., description="档位名称")
    gap_rate: float = Field(..., description="加仓间隔比例")
    tier_description: str = Field(..., description="档位描述")
    judgment_reason: str = Field(..., description="判定原因")


class StockInfoV2(BaseModel):
    """股票基础信息"""
    symbol: str
    company_name: str
    sector: Optional[str] = None
    market_cap: Optional[float] = None
    current_price: float
    currency: str = "USD"


# ==================== BIAS 乖离率分析 ====================

class BiasDataPoint(BaseModel):
    """BIAS历史数据点"""
    date: str = Field(..., description="日期 YYYY-MM-DD")
    bias: float = Field(..., description="乖离率（小数形式，如-0.185表示-18.5%）")
    price: float = Field(..., description="收盘价")
    ma_200: Optional[float] = Field(None, description="200日均线")


class BiasTierConfig(BaseModel):
    """BIAS档位配置"""
    overheat: float = Field(..., description="贪婪线阈值（正数，如0.15表示+15%）")
    opportunity: float = Field(..., description="机会线阈值（负数，如-0.15表示-15%）")
    diamond: float = Field(..., description="钻石底阈值（负数，如-0.25表示-25%）")


class BiasAnalysis(BaseModel):
    """BIAS乖离率分析结果"""
    current_value: Optional[float] = Field(None, description="当前BIAS值（小数形式）")
    current_value_pct: Optional[str] = Field(None, description="当前BIAS百分比显示（如'-18.5%'）")
    percentile_rank: Optional[float] = Field(None, description="历史分位（0-1，如0.042表示处于4.2%低位）")
    percentile_description: Optional[str] = Field(None, description="历史分位描述文案")
    
    tier_config: BiasTierConfig = Field(..., description="当前股票适用的阈值配置")
    status: str = Field(..., description="状态枚举: OVERHEAT/NEUTRAL/OPPORTUNITY/DIAMOND")
    status_display: str = Field(..., description="状态显示文本")
    status_color: str = Field(..., description="状态颜色（用于前端）")
    
    can_buy: bool = Field(True, description="是否允许开仓")
    warning_message: Optional[str] = Field(None, description="警告信息（防追高锁）")
    suggestion_message: Optional[str] = Field(None, description="建议信息（左侧起跑枪）")
    
    chart_data: List[BiasDataPoint] = Field(default_factory=list, description="图表数据（过去3年）")
    ma_200_current: Optional[float] = Field(None, description="当前200日均线值")
    
    error_message: Optional[str] = Field(None, description="错误信息（如果计算失败）")


class AnalysisResultV2(BaseModel):
    """完整的分析结果（新版）"""
    symbol: str = Field(..., description="股票代码")
    stock_info: StockInfoV2 = Field(..., description="股票基础信息")
    current_price: float = Field(..., description="当前价格")
    
    reverse_dcf_check: Optional[ReverseDCFCheck] = Field(None, description="反向DCF估值预检")
    quality_assessment: QualityAssessment = Field(..., description="质量评估")
    market_analysis: MarketAnalysis = Field(..., description="市场分析")
    pricing: PricingAnalysis = Field(..., description="定价分析")
    technical_analysis: TechnicalAnalysis = Field(..., description="技术分析")
    
    grid_tier_info: GridTierInfo = Field(..., description="金字塔网格档位信息")
    pyramid_strategy: List[PyramidLevel] = Field(..., description="金字塔网格策略")
    recommendation: str = Field(..., description="投资建议")
    risk_warning: str = Field(..., description="风险警示")
    
    bias_analysis: Optional[BiasAnalysis] = Field(None, description="BIAS乖离率分析")
    
    analysis_timestamp: datetime = Field(default_factory=datetime.now, description="分析时间")

