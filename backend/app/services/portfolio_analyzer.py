"""
持仓健康度分析器 (Portfolio Health Analyzer)
基于核心-卫星资产配置模型计算合规评分
"""
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class AssetCategory(str, Enum):
    """资产类别枚举"""
    SGOV = "SGOV"  # 防御性资产（短期国债）
    QQQ = "QQQ"    # 纳指100（科技）
    VOO = "VOO"    # 标普500
    BRK_B = "BRK.B"  # 伯克希尔（价值）
    AGGRESSIVE = "AGGRESSIVE"  # 激进资产（成长股、中概股等）


@dataclass
class TargetAllocation:
    """目标配置权重"""
    category: AssetCategory
    global_weight: float  # 全局权重（百分比，如 21.0 表示 21%）
    description: str
    segment: str  # "Conservative" or "Aggressive"


@dataclass
class AssetScore:
    """单个资产类别的评分"""
    category: AssetCategory
    target_weight: float  # 目标权重 (%)
    target_value: float   # 目标金额
    actual_value: float   # 实际持仓金额
    actual_weight: float  # 实际权重 (%)
    score: float          # 得分 (0-100)
    status: str           # "达标" / "不足" / "超配"
    gap_value: float      # 缺口金额（负数表示超配）
    gap_weight: float     # 缺口权重 (%)


@dataclass
class PortfolioHealthReport:
    """持仓健康度报告"""
    total_value: float                    # 总资产
    compliance_score: float               # 合规评分 (0-100)
    grade: str                            # 评级 (S/A/B/C/D)
    asset_scores: List[AssetScore]        # 各资产评分
    conservative_actual: float            # 实际保守仓位 (%)
    conservative_target: float            # 目标保守仓位 (%)
    aggressive_actual: float              # 实际激进仓位 (%)
    aggressive_target: float              # 目标激进仓位 (%)
    recommendations: List[str]            # 调仓建议


class PortfolioHealthAnalyzer:
    """
    持仓健康度分析器
    
    基于核心-卫星配置模型：
    - 保守仓位 (70%): SGOV 30%, QQQ 30%, VOO 20%, BRK.B 20%
    - 激进仓位 (30%): SGOV 30%, 激进股票 70%
    
    全局目标权重：
    - SGOV: 30% (21% + 9%)
    - QQQ: 21%
    - VOO: 14%
    - BRK.B: 14%
    - 激进资产: 21%
    """
    
    # 全局目标配置（必须总和为 100%）
    TARGET_ALLOCATIONS = [
        TargetAllocation(AssetCategory.SGOV, 30.0, "防御性资产（短期国债）", "Conservative+Aggressive"),
        TargetAllocation(AssetCategory.QQQ, 21.0, "纳指100（科技龙头）", "Conservative"),
        TargetAllocation(AssetCategory.VOO, 14.0, "标普500（大盘）", "Conservative"),
        TargetAllocation(AssetCategory.BRK_B, 14.0, "伯克希尔（价值投资）", "Conservative"),
        TargetAllocation(AssetCategory.AGGRESSIVE, 21.0, "激进资产（成长股）", "Aggressive"),
    ]
    
    # 保守资产列表（用于分类）
    CONSERVATIVE_TICKERS = {"SGOV", "QQQ", "VOO", "BRK.B", "BRK-B", "SPY", "IVV"}
    
    # 已知激进资产映射（可扩展）
    AGGRESSIVE_TICKERS = {
        "POPMART": "泡泡玛特",
        "9992.HK": "泡泡玛特",
        "GEELY": "吉利汽车",
        "0175.HK": "吉利汽车",
        "BABA": "阿里巴巴",
        "9988.HK": "阿里巴巴",
        "TCEHY": "腾讯",
        "0700.HK": "腾讯",
        "JD": "京东",
        "9618.HK": "京东",
        "BIDU": "百度",
        "NIO": "蔚来",
        "XPEV": "小鹏",
        "LI": "理想",
        "PDD": "拼多多",
        "BILI": "哔哩哔哩",
        "META": "Meta",
        "NVDA": "英伟达",
        "TSLA": "特斯拉",
        "COIN": "Coinbase",
        "SQ": "Block",
        "SHOP": "Shopify",
    }
    
    def __init__(self):
        """初始化分析器"""
        # 验证目标配置总和为 100%
        total_weight = sum(t.global_weight for t in self.TARGET_ALLOCATIONS)
        if abs(total_weight - 100.0) > 0.01:
            raise ValueError(f"目标配置权重总和必须为100%，当前为{total_weight}%")
        
        logger.info("持仓健康度分析器已初始化")
    
    def classify_ticker(self, ticker: str) -> AssetCategory:
        """
        分类股票代码到资产类别
        
        Args:
            ticker: 股票代码（如 "QQQ", "POPMART", "9992.HK"）
        
        Returns:
            AssetCategory: 资产类别
        """
        ticker_upper = ticker.upper().replace("-", ".")
        
        # 1. 检查是否是保守资产
        if ticker_upper in self.CONSERVATIVE_TICKERS:
            if ticker_upper == "SGOV":
                return AssetCategory.SGOV
            elif ticker_upper == "QQQ":
                return AssetCategory.QQQ
            elif ticker_upper in {"VOO", "SPY", "IVV"}:
                return AssetCategory.VOO
            elif ticker_upper in {"BRK.B", "BRK-B"}:
                return AssetCategory.BRK_B
        
        # 2. 检查是否是已知激进资产
        if ticker_upper in self.AGGRESSIVE_TICKERS:
            return AssetCategory.AGGRESSIVE
        
        # 3. 默认归类为激进资产（未知的股票）
        logger.warning(f"未知股票代码 {ticker}，默认归类为激进资产")
        return AssetCategory.AGGRESSIVE
    
    def analyze(
        self,
        holdings: Dict[str, float],
        cash: float = 0.0
    ) -> PortfolioHealthReport:
        """
        分析持仓健康度
        
        Args:
            holdings: 持仓字典 {ticker: market_value}
            cash: 现金（归类为 SGOV）
        
        Returns:
            PortfolioHealthReport: 健康度报告
        """
        # 1. 计算总资产
        total_value = sum(holdings.values()) + cash
        
        if total_value <= 0:
            logger.error("总资产必须大于0")
            raise ValueError("总资产必须大于0")
        
        logger.info(f"开始分析持仓，总资产: ${total_value:,.2f}")
        
        # 2. 将持仓按资产类别聚合
        category_values = {cat: 0.0 for cat in AssetCategory}
        
        # 现金归类为 SGOV
        if cash > 0:
            category_values[AssetCategory.SGOV] += cash
        
        # 聚合各股票
        for ticker, value in holdings.items():
            if value <= 0:
                continue
            category = self.classify_ticker(ticker)
            category_values[category] += value
            logger.debug(f"{ticker} (${value:,.2f}) -> {category.value}")
        
        # 3. 计算各资产类别的评分
        asset_scores = []
        total_score = 0.0
        
        for target in self.TARGET_ALLOCATIONS:
            category = target.category
            target_weight = target.global_weight
            target_value = total_value * (target_weight / 100.0)
            actual_value = category_values[category]
            actual_weight = (actual_value / total_value) * 100.0
            
            # 计算得分（桶填充算法：超配不加分）
            filled_value = min(actual_value, target_value)
            score = (filled_value / total_value) * 100.0
            
            # 计算缺口
            gap_value = target_value - actual_value
            gap_weight = target_weight - actual_weight
            
            # 判断状态
            if abs(gap_weight) < 1.0:  # 允许 ±1% 的误差
                status = "✅ 达标"
            elif gap_weight > 0:
                status = "⚠️ 不足"
            else:
                status = "📈 超配"
            
            asset_score = AssetScore(
                category=category,
                target_weight=target_weight,
                target_value=target_value,
                actual_value=actual_value,
                actual_weight=actual_weight,
                score=score,
                status=status,
                gap_value=gap_value,
                gap_weight=gap_weight
            )
            
            asset_scores.append(asset_score)
            total_score += score
            
            logger.info(
                f"{category.value}: 目标{target_weight:.1f}% (${target_value:,.0f}), "
                f"实际{actual_weight:.1f}% (${actual_value:,.0f}), "
                f"得分{score:.1f}, {status}"
            )
        
        # 4. 计算保守/激进仓位占比
        conservative_value = (
            category_values[AssetCategory.SGOV] * 0.7 +  # 70% 的 SGOV 属于保守仓位
            category_values[AssetCategory.QQQ] +
            category_values[AssetCategory.VOO] +
            category_values[AssetCategory.BRK_B]
        )
        aggressive_value = (
            category_values[AssetCategory.SGOV] * 0.3 +  # 30% 的 SGOV 属于激进仓位
            category_values[AssetCategory.AGGRESSIVE]
        )
        
        conservative_actual = (conservative_value / total_value) * 100.0
        aggressive_actual = (aggressive_value / total_value) * 100.0
        
        # 5. 评级
        grade = self._calculate_grade(total_score)
        
        # 6. 生成调仓建议
        recommendations = self._generate_recommendations(asset_scores, total_value)
        
        # 7. 生成报告
        report = PortfolioHealthReport(
            total_value=total_value,
            compliance_score=total_score,
            grade=grade,
            asset_scores=asset_scores,
            conservative_actual=conservative_actual,
            conservative_target=70.0,
            aggressive_actual=aggressive_actual,
            aggressive_target=30.0,
            recommendations=recommendations
        )
        
        logger.info(f"分析完成: 合规评分={total_score:.1f}, 评级={grade}")
        
        return report
    
    def _calculate_grade(self, score: float) -> str:
        """
        根据评分计算评级
        
        Args:
            score: 合规评分 (0-100)
        
        Returns:
            str: 评级 (S/A/B/C/D)
        """
        if score >= 95:
            return "S"
        elif score >= 85:
            return "A"
        elif score >= 70:
            return "B"
        elif score >= 50:
            return "C"
        else:
            return "D"
    
    def _generate_recommendations(
        self,
        asset_scores: List[AssetScore],
        total_value: float
    ) -> List[str]:
        """
        生成调仓建议
        
        Args:
            asset_scores: 各资产评分
            total_value: 总资产
        
        Returns:
            List[str]: 建议列表
        """
        recommendations = []
        
        # 按缺口大小排序（绝对值）
        sorted_scores = sorted(
            asset_scores,
            key=lambda x: abs(x.gap_value),
            reverse=True
        )
        
        # 生成前3个最大缺口的建议
        for score in sorted_scores[:3]:
            if abs(score.gap_weight) < 1.0:
                continue  # 跳过已达标的
            
            if score.gap_value > 0:
                # 不足：建议买入
                recommendations.append(
                    f"建议增持 {score.category.value}：当前 {score.actual_weight:.1f}%，"
                    f"目标 {score.target_weight:.1f}%，缺口 ${abs(score.gap_value):,.0f}"
                )
            else:
                # 超配：建议减持
                recommendations.append(
                    f"建议减持 {score.category.value}：当前 {score.actual_weight:.1f}%，"
                    f"目标 {score.target_weight:.1f}%，超配 ${abs(score.gap_value):,.0f}"
                )
        
        if not recommendations:
            recommendations.append("✅ 当前配置接近目标，保持现状即可")
        
        return recommendations


# 测试代码
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    analyzer = PortfolioHealthAnalyzer()
    
    # 测试案例1：完美配置
    print("\n" + "="*80)
    print("测试案例1：完美配置")
    print("="*80)
    holdings1 = {
        "SGOV": 30000,
        "QQQ": 21000,
        "VOO": 14000,
        "BRK.B": 14000,
        "POPMART": 21000,
    }
    report1 = analyzer.analyze(holdings1)
    print(f"\n总资产: ${report1.total_value:,.2f}")
    print(f"合规评分: {report1.compliance_score:.1f}")
    print(f"评级: {report1.grade}")
    print(f"\n保守仓位: {report1.conservative_actual:.1f}% (目标 {report1.conservative_target:.1f}%)")
    print(f"激进仓位: {report1.aggressive_actual:.1f}% (目标 {report1.aggressive_target:.1f}%)")
    print("\n各资产评分:")
    for score in report1.asset_scores:
        print(f"  {score.category.value}: {score.status} (得分 {score.score:.1f})")
    
    # 测试案例2：不平衡配置
    print("\n" + "="*80)
    print("测试案例2：不平衡配置")
    print("="*80)
    holdings2 = {
        "SGOV": 10000,
        "QQQ": 0,
        "VOO": 14000,
        "BRK.B": 14000,
        "POPMART": 10000,
        "GEELY": 11000,
    }
    report2 = analyzer.analyze(holdings2, cash=5000)
    print(f"\n总资产: ${report2.total_value:,.2f}")
    print(f"合规评分: {report2.compliance_score:.1f}")
    print(f"评级: {report2.grade}")
    print("\n调仓建议:")
    for rec in report2.recommendations:
        print(f"  • {rec}")

