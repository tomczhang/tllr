"""
持仓管理相关 API
交易记录、持仓概览、盈亏分析、健康度分析
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict
import logging
from app.schemas.portfolio import (
    TransactionCreate, 
    Transaction, 
    PortfolioOverview,
    PositionSummary,
    PortfolioAnalysisRequest,
    PortfolioHealthResponse,
    AssetScoreResponse,
    PortfolioTargetResponse,
    TargetAllocationInfo
)
from app.services.supabase_srv import SupabaseService
from app.services.portfolio_srv import PortfolioService
from app.services.portfolio_analyzer import (
    PortfolioHealthAnalyzer,
    AssetCategory
)
from app.services.portfolio_storage import PortfolioStorage
from app.api.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()
supabase_service = SupabaseService()
portfolio_service = PortfolioService()
health_analyzer = PortfolioHealthAnalyzer()
portfolio_storage = PortfolioStorage()

# 资产类别显示名称映射
CATEGORY_DISPLAY_NAMES = {
    AssetCategory.SGOV: "防御性资产 (SGOV)",
    AssetCategory.QQQ: "纳指100 (QQQ)",
    AssetCategory.VOO: "标普500 (VOO)",
    AssetCategory.BRK_B: "伯克希尔 (BRK.B)",
    AssetCategory.AGGRESSIVE: "激进资产"
}

# 评级颜色映射
GRADE_COLORS = {
    "S": "#a855f7",  # purple-500
    "A": "#10b981",  # emerald-500
    "B": "#3b82f6",  # blue-500
    "C": "#f59e0b",  # amber-500
    "D": "#ef4444"   # red-500
}

# 评级描述
GRADE_DESCRIPTIONS = {
    "S": "完美配置，资产配置高度符合目标模型",
    "A": "优秀配置，资产配置基本符合目标模型",
    "B": "良好配置，部分资产需要调整",
    "C": "一般配置，建议尽快调整资产配置",
    "D": "配置失衡，强烈建议重新平衡资产"
}

# 状态颜色映射
STATUS_COLORS = {
    "✅ 达标": "emerald",
    "⚠️ 不足": "amber",
    "📈 超配": "blue"
}


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


# ==================== 持仓健康度分析 ====================

@router.get("/health/target", response_model=PortfolioTargetResponse)
async def get_target_allocation():
    """
    获取目标资产配置
    
    Returns:
        PortfolioTargetResponse: 目标配置信息
    """
    try:
        target_allocations = [
            TargetAllocationInfo(
                category=target.category.value,
                category_display=CATEGORY_DISPLAY_NAMES[target.category],
                global_weight=target.global_weight,
                description=target.description,
                segment=target.segment
            )
            for target in health_analyzer.TARGET_ALLOCATIONS
        ]
        
        return PortfolioTargetResponse(
            target_allocations=target_allocations,
            conservative_weight=70.0,
            aggressive_weight=30.0,
            description="基于核心-卫星配置模型，70%保守仓位 + 30%激进仓位"
        )
    
    except Exception as e:
        logger.error(f"获取目标配置失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取目标配置失败: {str(e)}")


@router.post("/health/analyze", response_model=PortfolioHealthResponse)
async def analyze_portfolio_health(request: PortfolioAnalysisRequest):
    """
    分析持仓健康度
    
    Args:
        request: 持仓分析请求
    
    Returns:
        PortfolioHealthResponse: 持仓健康度报告
    """
    try:
        # 转换持仓格式
        holdings = {
            holding.ticker: holding.market_value
            for holding in request.holdings
        }
        
        logger.info(f"开始分析持仓: {len(holdings)} 个持仓, 现金 ${request.cash:,.2f}")
        
        # 执行分析
        report = health_analyzer.analyze(holdings, request.cash)
        
        # 转换资产评分
        asset_scores = [
            AssetScoreResponse(
                category=score.category.value,
                category_display=CATEGORY_DISPLAY_NAMES[score.category],
                target_weight=score.target_weight,
                target_value=score.target_value,
                actual_value=score.actual_value,
                actual_weight=score.actual_weight,
                score=score.score,
                status=score.status,
                status_color=STATUS_COLORS.get(score.status, "slate"),
                gap_value=score.gap_value,
                gap_weight=score.gap_weight
            )
            for score in report.asset_scores
        ]
        
        # 准备图表数据
        chart_data = {
            "target": [
                {
                    "category": score.category_display,
                    "value": score.target_weight
                }
                for score in asset_scores
            ],
            "actual": [
                {
                    "category": score.category_display,
                    "value": score.actual_weight
                }
                for score in asset_scores
            ],
            "scores": [
                {
                    "category": score.category_display,
                    "score": score.score,
                    "target": score.target_weight
                }
                for score in asset_scores
            ]
        }
        
        return PortfolioHealthResponse(
            total_value=report.total_value,
            compliance_score=report.compliance_score,
            grade=report.grade,
            grade_color=GRADE_COLORS[report.grade],
            grade_description=GRADE_DESCRIPTIONS[report.grade],
            asset_scores=asset_scores,
            conservative_actual=report.conservative_actual,
            conservative_target=report.conservative_target,
            aggressive_actual=report.aggressive_actual,
            aggressive_target=report.aggressive_target,
            recommendations=report.recommendations,
            chart_data=chart_data
        )
    
    except ValueError as e:
        logger.error(f"输入数据验证失败: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        logger.error(f"分析持仓失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"分析持仓失败: {str(e)}")


@router.get("/health/classify/{ticker}")
async def classify_ticker(ticker: str):
    """
    分类股票代码到资产类别
    
    Args:
        ticker: 股票代码
    
    Returns:
        Dict: 分类结果
    """
    try:
        category = health_analyzer.classify_ticker(ticker)
        
        return {
            "ticker": ticker,
            "category": category.value,
            "category_display": CATEGORY_DISPLAY_NAMES[category],
            "is_conservative": category != AssetCategory.AGGRESSIVE
        }
    
    except Exception as e:
        logger.error(f"分类股票失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"分类股票失败: {str(e)}")


# ==================== 持仓数据管理 (JSON存储) ====================

@router.get("/holdings")
async def get_holdings():
    """
    获取当前持仓数据
    
    Returns:
        Dict: 持仓数据 {cash, holdings, last_updated}
    """
    try:
        data = portfolio_storage.get_holdings()
        return data
    except Exception as e:
        logger.error(f"获取持仓数据失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取持仓数据失败: {str(e)}")


@router.post("/holdings")
async def save_holdings(request: PortfolioAnalysisRequest):
    """
    保存持仓数据
    
    Args:
        request: 持仓数据
    
    Returns:
        Dict: 保存后的数据
    """
    try:
        holdings = [
            {
                "ticker": h.ticker,
                "market_value": h.market_value,
                "quantity": h.quantity,
                "avg_cost": h.avg_cost
            }
            for h in request.holdings
        ]
        
        data = portfolio_storage.save_holdings(request.cash, holdings)
        logger.info(f"保存持仓成功: {len(holdings)} 个持仓")
        
        return data
    except Exception as e:
        logger.error(f"保存持仓数据失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"保存持仓数据失败: {str(e)}")


@router.put("/holdings/cash")
async def update_cash(cash: float):
    """
    更新现金金额
    
    Args:
        cash: 现金金额
    
    Returns:
        Dict: 更新后的数据
    """
    try:
        data = portfolio_storage.update_cash(cash)
        return data
    except Exception as e:
        logger.error(f"更新现金失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"更新现金失败: {str(e)}")


@router.delete("/holdings")
async def clear_holdings():
    """
    清空所有持仓
    
    Returns:
        Dict: 清空后的数据
    """
    try:
        data = portfolio_storage.clear_all()
        logger.info("清空所有持仓成功")
        return data
    except Exception as e:
        logger.error(f"清空持仓失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"清空持仓失败: {str(e)}")

