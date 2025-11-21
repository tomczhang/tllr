"""
贪婪猎人核心算法
包括：S/A/B 评级、双重折扣、10年回撤分析、金字塔网格策略
"""

from typing import Dict, List, Any, Optional
import pandas as pd
from app.services.yahoo_direct import get_yahoo_service
from app.schemas.stock import (
    AnalysisResult, 
    StockInfo, 
    ScoreDetail, 
    PyramidLevel
)


class GreedyHunterCalculator:
    """贪婪猎人建仓计算器"""
    
    def __init__(self):
        # 使用直接调用 Yahoo API 的服务（绕过 yfinance 限制）
        self.yf_service = get_yahoo_service()
    
    def analyze_stock(self, symbol: str) -> Optional[AnalysisResult]:
        """
        完整的股票分析流程
        返回：评分、安全价格、网格策略
        """
        # 1. 获取股票信息
        stock_info_raw = self.yf_service.get_stock_info(symbol)
        if not stock_info_raw:
            return None
        
        current_price = stock_info_raw.get("current_price")
        if not current_price:
            return None
        
        stock_info = StockInfo(**stock_info_raw)
        
        # 2. 获取10年历史数据
        hist_data = self.yf_service.get_historical_data(symbol, period="10y")
        if hist_data is None or hist_data.empty:
            return None
        
        # 3. 计算最大回撤
        mdd_result = self.yf_service.calculate_max_drawdown(hist_data)
        max_drawdown = mdd_result["max_drawdown"]
        max_drawdown_date = mdd_result["date"]
        
        # 4. 执行8分制评分
        score_details = self._calculate_score(
            hist_data, 
            current_price, 
            max_drawdown
        )
        overall_score = self._get_overall_score(score_details)
        
        # 5. 计算安全买入价（双重折扣）
        safe_price_result = self._calculate_safe_buy_price(
            current_price, 
            max_drawdown,
            overall_score
        )
        
        # 6. 生成金字塔网格策略
        pyramid_strategy = self._generate_pyramid_strategy(
            safe_price_result["safe_buy_price"],
            current_price
        )
        
        # 7. 生成建议
        recommendation = self._generate_recommendation(
            overall_score, 
            current_price,
            safe_price_result["safe_buy_price"]
        )
        
        risk_warning = self._generate_risk_warning(max_drawdown, overall_score)
        
        return AnalysisResult(
            symbol=symbol,
            stock_info=stock_info,
            current_price=current_price,
            overall_score=overall_score,
            score_details=score_details,
            max_drawdown=max_drawdown,
            max_drawdown_date=max_drawdown_date,
            safe_buy_price=safe_price_result["safe_buy_price"],
            discount_rate=safe_price_result["discount_rate"],
            pyramid_strategy=pyramid_strategy,
            recommendation=recommendation,
            risk_warning=risk_warning
        )
    
    def _calculate_score(
        self, 
        hist_data: pd.DataFrame, 
        current_price: float,
        max_drawdown: float
    ) -> List[ScoreDetail]:
        """
        8分制评分体检表
        根据多个维度评估股票质量
        """
        scores = []
        
        # 1. 价格位置（距离52周高低点）
        year_high = hist_data['High'].tail(252).max()
        year_low = hist_data['Low'].tail(252).min()
        price_position = (current_price - year_low) / (year_high - year_low)
        
        if price_position < 0.3:
            scores.append(ScoreDetail(
                score="S",
                reason="价格接近年度低点（底部区域）",
                points=10
            ))
        elif price_position < 0.5:
            scores.append(ScoreDetail(
                score="A",
                reason="价格处于中低位",
                points=8
            ))
        else:
            scores.append(ScoreDetail(
                score="B",
                reason="价格相对较高",
                points=6
            ))
        
        # 2. 波动率评估
        if max_drawdown > 0.5:
            scores.append(ScoreDetail(
                score="B",
                reason=f"历史最大回撤 {max_drawdown*100:.1f}%（高波动）",
                points=6
            ))
        elif max_drawdown > 0.3:
            scores.append(ScoreDetail(
                score="A",
                reason=f"历史最大回撤 {max_drawdown*100:.1f}%（中等波动）",
                points=8
            ))
        else:
            scores.append(ScoreDetail(
                score="S",
                reason=f"历史最大回撤 {max_drawdown*100:.1f}%（低波动）",
                points=10
            ))
        
        # 3. 趋势评估（简化版：比较近期均线）
        if len(hist_data) >= 200:
            ma50 = hist_data['Close'].tail(50).mean()
            ma200 = hist_data['Close'].tail(200).mean()
            
            if ma50 > ma200 and current_price > ma50:
                scores.append(ScoreDetail(
                    score="A",
                    reason="短期趋势向上",
                    points=8
                ))
            elif current_price > ma200:
                scores.append(ScoreDetail(
                    score="B",
                    reason="长期趋势尚可",
                    points=7
                ))
            else:
                scores.append(ScoreDetail(
                    score="C",
                    reason="趋势偏弱",
                    points=5
                ))
        
        return scores
    
    def _get_overall_score(self, score_details: List[ScoreDetail]) -> str:
        """计算综合评分"""
        avg_points = sum(s.points for s in score_details) / len(score_details)
        
        if avg_points >= 9:
            return "S"
        elif avg_points >= 7.5:
            return "A"
        elif avg_points >= 6:
            return "B"
        else:
            return "C"
    
    def _calculate_safe_buy_price(
        self, 
        current_price: float,
        max_drawdown: float,
        overall_score: str
    ) -> Dict[str, float]:
        """
        双重折扣公式计算安全买入价
        公式：安全价 = 当前价 × (1 - MDD折扣) × (1 - 评级折扣)
        """
        # MDD 折扣：按最大回撤的一半作为安全边际
        mdd_discount = max_drawdown * 0.5
        
        # 评级折扣
        score_discount_map = {
            "S": 0.05,  # S级只需5%折扣
            "A": 0.10,  # A级需10%折扣
            "B": 0.15,  # B级需15%折扣
            "C": 0.20   # C级需20%折扣
        }
        score_discount = score_discount_map.get(overall_score, 0.15)
        
        # 计算安全买入价
        safe_price = current_price * (1 - mdd_discount) * (1 - score_discount)
        total_discount = 1 - (1 - mdd_discount) * (1 - score_discount)
        
        return {
            "safe_buy_price": round(safe_price, 2),
            "discount_rate": round(total_discount, 4)
        }
    
    def _generate_pyramid_strategy(
        self, 
        safe_buy_price: float,
        current_price: float
    ) -> List[PyramidLevel]:
        """
        生成6步金字塔网格策略
        资金分配：5% -> 10% -> 15% -> 20% -> 25% -> 25%
        """
        # 价格梯度：从安全价向下每层递减3%
        price_step = 0.03
        fund_allocation = [0.05, 0.10, 0.15, 0.20, 0.25, 0.25]
        
        pyramid = []
        for i, allocation in enumerate(fund_allocation, 1):
            level_price = safe_buy_price * (1 - price_step * (i - 1))
            
            # 判断该档位与当前价的关系
            if level_price >= current_price:
                desc = "✅ 已达成（可以买入）"
            else:
                desc = f"等待价格回调 {((level_price / current_price - 1) * 100):.1f}%"
            
            pyramid.append(PyramidLevel(
                level=i,
                price=round(level_price, 2),
                percentage=allocation * 100,
                description=desc
            ))
        
        return pyramid
    
    def _generate_recommendation(
        self, 
        overall_score: str,
        current_price: float,
        safe_buy_price: float
    ) -> str:
        """生成投资建议"""
        price_gap = (current_price - safe_buy_price) / safe_buy_price
        
        if overall_score == "S":
            if price_gap < 0.05:
                return "🟢 强烈推荐：S级标的且价格已接近安全买入价，可以开始建仓"
            else:
                return f"🟡 S级标的，但当前价格偏高 {price_gap*100:.1f}%，建议等待回调"
        elif overall_score == "A":
            if price_gap < 0.1:
                return "🟢 推荐：A级标的，价格合理，可以考虑建仓"
            else:
                return f"🟡 A级标的，但当前价格偏高 {price_gap*100:.1f}%，建议等待"
        elif overall_score == "B":
            return "🟡 一般：B级标的，建议观察，只在价格显著回调时考虑"
        else:
            return "🔴 不建议：C级标的，质量一般，建议寻找更好的标的"
    
    def _generate_risk_warning(self, max_drawdown: float, overall_score: str) -> str:
        """生成风险警示"""
        if max_drawdown > 0.6:
            return f"⚠️ 高风险：该标的历史最大回撤达 {max_drawdown*100:.1f}%，波动极大，需做好心理准备"
        elif max_drawdown > 0.4:
            return f"⚠️ 中等风险：该标的历史最大回撤 {max_drawdown*100:.1f}%，波动较大"
        elif overall_score == "C":
            return "⚠️ 质量风险：该标的综合评分较低，基本面可能存在问题"
        else:
            return "✅ 风险可控：该标的历史波动相对温和"

