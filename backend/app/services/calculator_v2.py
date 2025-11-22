"""
贪婪猎人核心算法 V2 - 8点质量评分体系
完全自动化（2项）+ 半自动化（4项）+ 完全人工（2项）
"""

from typing import Dict, List, Any, Optional
import pandas as pd
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

from app.services.yahoo_direct import get_yahoo_service
from app.services.yahoo_financial import get_financial_service
from app.schemas.stock_v2 import (
    AnalysisResultV2,
    StockInfoV2,
    QualityAssessment,
    HardMetric,
    AssistedMetric,
    SoftMetric,
    MarketAnalysis,
    PricingAnalysis,
    TechnicalAnalysis,
    PyramidLevel,
    UserConfirmations
)


class GreedyHunterCalculatorV2:
    """贪婪猎人建仓计算器 V2"""
    
    # 评级映射
    TIER_MAPPING = {
        (7, 8): ("S", "皇冠明珠", 0.95),
        (5, 6): ("A", "优质蓝筹", 0.85),
        (3, 4): ("B", "平庸/成长", 0.70),
        (0, 2): ("C", "垃圾/高危", 0.50)
    }
    
    # 市场折扣系数
    MARKET_DISCOUNT = {
        "US": 1.0,
        "A": 0.85,
        "HK": 0.7
    }
    
    def __init__(self):
        self.yf_service = get_yahoo_service()
        self.financial_service = get_financial_service()
    
    def analyze_stock(
        self, 
        symbol: str,
        intrinsic_value: float,
        user_confirmations: UserConfirmations
    ) -> Optional[AnalysisResultV2]:
        """
        完整的股票分析流程（新版8分制）
        """
        # 1. 获取股票基础信息
        stock_info_raw = self.yf_service.get_stock_info(symbol)
        if not stock_info_raw:
            return None
        
        current_price = stock_info_raw.get("current_price")
        if not current_price:
            return None
        
        stock_info = StockInfoV2(
            symbol=symbol,
            company_name=stock_info_raw.get("company_name", symbol),
            sector=stock_info_raw.get("sector"),
            market_cap=stock_info_raw.get("market_cap"),
            current_price=current_price,
            currency=stock_info_raw.get("currency", "USD")
        )
        
        # 2. 获取历史数据（用于MA计算和MDD）
        hist_data = self.yf_service.get_historical_data(symbol, period="10y")
        if hist_data is None or hist_data.empty:
            return None
        
        # 3. 计算技术指标（MA50/MA200, MDD）
        technical_analysis = self._calculate_technical_analysis(hist_data, current_price)
        
        # 4. 获取财务数据
        financial_data = self.financial_service.get_financial_data(symbol)
        
        # 🔧 修复：如果 stock_info 没有市值，用 financial_data 的市值补充
        if not stock_info.market_cap and financial_data.get("market_cap"):
            stock_info.market_cap = financial_data.get("market_cap")
            logger.info(f"✅ 使用 financial_data 补充市值: ${stock_info.market_cap/1e9:.1f}B")
        
        # 5. 执行8分制质量评估
        quality_assessment = self._calculate_quality_assessment(
            symbol=symbol,
            financial_data=financial_data,
            user_confirmations=user_confirmations
        )
        
        # 6. 市场分析（判断市场，应用折扣）
        market_analysis = self._analyze_market(symbol, quality_assessment.tier)
        
        # 7. 定价分析（安全建仓价）
        pricing = self._calculate_pricing(
            intrinsic_value=intrinsic_value,
            quality_coefficient=quality_assessment.quality_coefficient,
            market_discount=market_analysis.market_discount,
            current_price=current_price
        )
        
        # 8. 生成金字塔策略
        pyramid_strategy = self._generate_pyramid_strategy(
            pricing.safe_buy_price,
            current_price
        )
        
        # 9. 生成建议
        recommendation = self._generate_recommendation(
            quality_assessment.tier,
            pricing.verdict,
            technical_analysis.trading_side
        )
        
        risk_warning = self._generate_risk_warning(
            technical_analysis.max_drawdown,
            quality_assessment.tier
        )
        
        return AnalysisResultV2(
            symbol=symbol,
            stock_info=stock_info,
            current_price=current_price,
            quality_assessment=quality_assessment,
            market_analysis=market_analysis,
            pricing=pricing,
            technical_analysis=technical_analysis,
            pyramid_strategy=pyramid_strategy,
            recommendation=recommendation,
            risk_warning=risk_warning,
            analysis_timestamp=datetime.now()
        )
    
    def _calculate_quality_assessment(
        self,
        symbol: str,
        financial_data: Dict[str, Any],
        user_confirmations: UserConfirmations
    ) -> QualityAssessment:
        """
        8分制质量评估
        """
        hard_metrics = []
        assisted_metrics = []
        soft_metrics = []
        
        # ========== 完全自动化指标（2项）==========
        
        # 1. 市值规模
        market_cap = financial_data.get("market_cap")
        market_cap_passed = market_cap is not None and market_cap > 200_000_000_000
        hard_metrics.append(HardMetric(
            name="市值规模",
            key="market_cap",
            value=market_cap,
            value_display=f"${market_cap/1e9:.1f}B" if market_cap else "无数据",
            threshold=">2000亿美元",
            passed=market_cap_passed,
            points=1 if market_cap_passed else 0
        ))
        
        # 2. 上市年限
        listing_years = financial_data.get("listing_years")
        listing_years_passed = listing_years is not None and listing_years > 10
        hard_metrics.append(HardMetric(
            name="上市年限",
            key="listing_years",
            value=listing_years,
            value_display=f"{listing_years}年" if listing_years else "无数据",
            threshold=">10年",
            passed=listing_years_passed,
            points=1 if listing_years_passed else 0
        ))
        
        # ========== 半自动化指标（4项）==========
        
        # 3. 毛利率
        gross_margins = financial_data.get("gross_margins")
        gm_suggestion = gross_margins is not None and gross_margins > 0.4
        gm_user_confirmed = user_confirmations.gross_margin if user_confirmations.gross_margin is not None else gm_suggestion
        assisted_metrics.append(AssistedMetric(
            name="毛利率",
            key="gross_margin",
            value=gross_margins,
            value_display=f"{gross_margins*100:.1f}%" if gross_margins else "无数据",
            threshold=">40%",
            raw_data={"gross_margins": gross_margins},
            system_suggestion=gm_suggestion,
            user_confirmed=gm_user_confirmed,
            passed=gm_user_confirmed,
            points=1 if gm_user_confirmed else 0
        ))
        
        # 4. ROE
        roe = financial_data.get("return_on_equity")
        roe_suggestion = roe is not None and roe > 0.15
        roe_user_confirmed = user_confirmations.roe if user_confirmations.roe is not None else roe_suggestion
        assisted_metrics.append(AssistedMetric(
            name="净资产收益率",
            key="roe",
            value=roe,
            value_display=f"{roe*100:.1f}%" if roe else "无数据",
            threshold=">15%",
            raw_data={"return_on_equity": roe},
            system_suggestion=roe_suggestion,
            user_confirmed=roe_user_confirmed,
            passed=roe_user_confirmed,
            points=1 if roe_user_confirmed else 0
        ))
        
        # 5. 财务安全
        total_cash = financial_data.get("total_cash")
        total_debt = financial_data.get("total_debt")
        net_cash = (total_cash or 0) - (total_debt or 0)
        fs_suggestion = total_cash is not None and total_debt is not None and total_cash > total_debt
        fs_user_confirmed = user_confirmations.financial_safety if user_confirmations.financial_safety is not None else fs_suggestion
        
        cash_display = f"${total_cash/1e9:.1f}B" if total_cash else "无数据"
        debt_display = f"${total_debt/1e9:.1f}B" if total_debt else "无数据"
        
        assisted_metrics.append(AssistedMetric(
            name="财务安全",
            key="financial_safety",
            value=net_cash if (total_cash and total_debt) else None,
            value_display=f"现金{cash_display} vs 负债{debt_display}",
            threshold="现金>负债",
            raw_data={"total_cash": total_cash, "total_debt": total_debt, "net_cash": net_cash},
            system_suggestion=fs_suggestion,
            user_confirmed=fs_user_confirmed,
            passed=fs_user_confirmed,
            points=1 if fs_user_confirmed else 0
        ))
        
        # 6. 股东回报
        dividend_rate = financial_data.get("dividend_rate") or 0
        buyback_amount = financial_data.get("buyback_amount") or 0
        has_returns = dividend_rate > 0 or buyback_amount > 0
        sr_user_confirmed = user_confirmations.shareholder_returns if user_confirmations.shareholder_returns is not None else has_returns
        
        returns_display = []
        if dividend_rate > 0:
            returns_display.append(f"分红率{dividend_rate*100:.2f}%")
        if buyback_amount > 0:
            returns_display.append(f"回购${buyback_amount/1e9:.1f}B")
        
        assisted_metrics.append(AssistedMetric(
            name="股东回报",
            key="shareholder_returns",
            value=dividend_rate + buyback_amount,
            value_display="，".join(returns_display) if returns_display else "无分红和回购",
            threshold="有分红或回购",
            raw_data={"dividend_rate": dividend_rate, "buyback_amount": buyback_amount},
            system_suggestion=has_returns,
            user_confirmed=sr_user_confirmed,
            passed=sr_user_confirmed,
            points=1 if sr_user_confirmed else 0
        ))
        
        # ========== 完全人工指标（2项）==========
        
        # 7. 行业地位
        soft_metrics.append(SoftMetric(
            name="行业地位",
            key="industry_dominance",
            description="是否行业老大或双寡头",
            user_confirmed=user_confirmations.industry_dominance,
            passed=user_confirmations.industry_dominance,
            points=1 if user_confirmations.industry_dominance else 0
        ))
        
        # 8. 护城河
        soft_metrics.append(SoftMetric(
            name="护城河",
            key="moat",
            description="是否有高转换成本",
            user_confirmed=user_confirmations.moat,
            passed=user_confirmations.moat,
            points=1 if user_confirmations.moat else 0
        ))
        
        # ========== 汇总评分 ==========
        total_score = sum(m.points for m in hard_metrics + assisted_metrics + soft_metrics)
        
        # 确定评级
        tier, tier_desc, quality_coeff = self._get_tier_by_score(total_score)
        
        return QualityAssessment(
            hard_metrics=hard_metrics,
            assisted_metrics=assisted_metrics,
            soft_metrics=soft_metrics,
            total_score=total_score,
            tier=tier,
            tier_description=tier_desc,
            quality_coefficient=quality_coeff
        )
    
    def _get_tier_by_score(self, score: int) -> tuple[str, str, float]:
        """根据分数获取评级"""
        for (min_score, max_score), (tier, desc, coeff) in self.TIER_MAPPING.items():
            if min_score <= score <= max_score:
                return tier, desc, coeff
        return "C", "垃圾/高危", 0.50
    
    def _analyze_market(self, symbol: str, tier: str) -> MarketAnalysis:
        """市场分析（判断市场，应用折扣系数）"""
        # 判断市场
        if ".HK" in symbol.upper():
            market = "HK"
        elif ".SS" in symbol.upper() or ".SZ" in symbol.upper():
            market = "A"
        else:
            market = "US"
        
        # 获取基础折扣
        discount = self.MARKET_DISCOUNT.get(market, 1.0)
        
        # 港股S级豁免
        is_hk_s_tier = (market == "HK" and tier == "S")
        if is_hk_s_tier:
            discount = 0.85
            reason = "港股S级享受流动性豁免，折扣上调至0.85"
        else:
            reason = f"{market}市场标准折扣"
        
        return MarketAnalysis(
            market=market,
            is_hk_s_tier=is_hk_s_tier,
            market_discount=discount,
            market_discount_reason=reason
        )
    
    def _calculate_pricing(
        self,
        intrinsic_value: float,
        quality_coefficient: float,
        market_discount: float,
        current_price: float
    ) -> PricingAnalysis:
        """定价分析：安全建仓价 = 内在估值 × 品质系数 × 市场折扣"""
        safe_buy_price = intrinsic_value * quality_coefficient * market_discount
        price_gap_percent = ((current_price - safe_buy_price) / safe_buy_price) * 100
        
        # 判断
        if current_price <= safe_buy_price:
            verdict = f"✅ 当前价格低于安全价{abs(price_gap_percent):.1f}%，可以建仓"
        elif price_gap_percent <= 10:
            verdict = f"⚠️ 当前价格略高于安全价{price_gap_percent:.1f}%，可小仓试探"
        else:
            verdict = f"❌ 当前价格高于安全价{price_gap_percent:.1f}%，等待回调"
        
        return PricingAnalysis(
            intrinsic_value=intrinsic_value,
            quality_coefficient=quality_coefficient,
            market_discount=market_discount,
            safe_buy_price=safe_buy_price,
            current_price=current_price,
            price_gap_percent=price_gap_percent,
            verdict=verdict
        )
    
    def _calculate_technical_analysis(
        self,
        hist_data: pd.DataFrame,
        current_price: float
    ) -> TechnicalAnalysis:
        """技术分析：MA50/MA200 + MDD"""
        # MA计算
        ma50 = hist_data['Close'].tail(50).mean() if len(hist_data) >= 50 else current_price
        ma200 = hist_data['Close'].tail(200).mean() if len(hist_data) >= 200 else current_price
        
        # 判断左右侧
        if current_price > ma50 and current_price > ma200:
            trading_side = "右侧交易"
            trading_desc = "价格在均线上方，顺势而为"
        else:
            trading_side = "左侧交易"
            trading_desc = "价格在均线下方，逆向布局"
        
        # MDD
        mdd_result = self.yf_service.calculate_max_drawdown(hist_data)
        max_drawdown = mdd_result["max_drawdown"]
        max_drawdown_date = mdd_result["date"]
        
        # 回撤警示
        if max_drawdown > 0.5:
            mdd_warning = f"⚠️ 历史最大回撤{max_drawdown*100:.1f}%，极端风险"
        elif max_drawdown > 0.3:
            mdd_warning = f"⚠️ 历史最大回撤{max_drawdown*100:.1f}%，波动较大"
        else:
            mdd_warning = f"✅ 历史最大回撤{max_drawdown*100:.1f}%，相对稳健"
        
        return TechnicalAnalysis(
            ma50=ma50,
            ma200=ma200,
            trading_side=trading_side,
            trading_description=trading_desc,
            max_drawdown=max_drawdown,
            max_drawdown_date=max_drawdown_date,
            max_drawdown_warning=mdd_warning,
            max_drawdown_peak_date=mdd_result.get("peak_date"),
            max_drawdown_peak_price=mdd_result.get("peak_price"),
            max_drawdown_valley_date=mdd_result.get("valley_date"),
            max_drawdown_valley_price=mdd_result.get("valley_price")
        )
    
    def _generate_pyramid_strategy(
        self,
        safe_buy_price: float,
        current_price: float
    ) -> List[PyramidLevel]:
        """生成金字塔网格策略（6步）"""
        steps = [
            (0.05, "第1步：试探性建仓"),
            (0.10, "第2步：确认趋势"),
            (0.15, "第3步：加大仓位"),
            (0.25, "第4步：重仓布局"),
            (0.25, "第5步：极度低估"),
            (0.20, "第6步：底部抄底")
        ]
        
        pyramid = []
        for i, (percentage, desc) in enumerate(steps, 1):
            # 每一步在安全价基础上再打折
            discount_factor = 1 - (i - 1) * 0.05
            level_price = safe_buy_price * discount_factor
            
            # 判断状态
            if current_price <= level_price:
                status_desc = f"✅ {desc}（已触发）"
            else:
                gap = ((current_price - level_price) / level_price) * 100
                status_desc = f"⏳ {desc}（需下跌{gap:.1f}%）"
            
            pyramid.append(PyramidLevel(
                level=i,
                price=level_price,
                percentage=percentage,
                description=status_desc
            ))
        
        return pyramid
    
    def _generate_recommendation(
        self,
        tier: str,
        pricing_verdict: str,
        trading_side: str
    ) -> str:
        """生成投资建议"""
        tier_comments = {
            "S": "🏆 皇冠明珠级资产，长期持有首选",
            "A": "💎 优质蓝筹，值得配置",
            "B": "⚡ 平庸或成长型，需密切跟踪",
            "C": "⚠️ 高危资产，谨慎参与"
        }
        
        tier_comment = tier_comments.get(tier, "")
        
        return f"""
{tier_comment}

【价格研判】
{pricing_verdict}

【技术形态】
{trading_side}

【操作建议】
建议严格按照金字塔网格策略分批建仓，切勿一次性满仓。
        """.strip()
    
    def _generate_risk_warning(self, max_drawdown: float, tier: str) -> str:
        """生成风险警示"""
        warnings = []
        
        if max_drawdown > 0.5:
            warnings.append(f"⚠️ 历史最大回撤达{max_drawdown*100:.1f}%，波动极大")
        
        if tier in ["B", "C"]:
            warnings.append(f"⚠️ 公司品质评级为{tier}级，基本面存在瑕疵")
        
        if not warnings:
            warnings.append("✅ 风险可控，但仍需关注市场变化")
        
        return "\n".join(warnings)


# 创建全局单例
_calculator_v2_instance = None

def get_calculator_v2() -> GreedyHunterCalculatorV2:
    """获取V2计算器单例"""
    global _calculator_v2_instance
    if _calculator_v2_instance is None:
        _calculator_v2_instance = GreedyHunterCalculatorV2()
    return _calculator_v2_instance

