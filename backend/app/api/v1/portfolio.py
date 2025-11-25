"""
持仓管理 API 路由
"""
from fastapi import APIRouter, HTTPException
from typing import Dict
import logging

from app.schemas.portfolio import (
    PortfolioAnalysisRequest,
    PortfolioHealthResponse,
    AssetScoreResponse,
    PortfolioTargetResponse,
    TargetAllocationInfo
)
from app.services.portfolio_analyzer import (
    PortfolioHealthAnalyzer,
    AssetCategory
)

logger = logging.getLogger(__name__)
router = APIRouter()

# 初始化分析器
analyzer = PortfolioHealthAnalyzer()


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


@router.get("/target", response_model=PortfolioTargetResponse)
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
            for target in analyzer.TARGET_ALLOCATIONS
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


@router.post("/analyze", response_model=PortfolioHealthResponse)
async def analyze_portfolio(request: PortfolioAnalysisRequest):
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
        report = analyzer.analyze(holdings, request.cash)
        
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


@router.post("/classify")
async def classify_ticker(ticker: str):
    """
    分类股票代码到资产类别
    
    Args:
        ticker: 股票代码
    
    Returns:
        Dict: 分类结果
    """
    try:
        category = analyzer.classify_ticker(ticker)
        
        return {
            "ticker": ticker,
            "category": category.value,
            "category_display": CATEGORY_DISPLAY_NAMES[category],
            "is_conservative": category != AssetCategory.AGGRESSIVE
        }
    
    except Exception as e:
        logger.error(f"分类股票失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"分类股票失败: {str(e)}")

