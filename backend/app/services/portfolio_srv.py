"""
持仓管理服务
计算用户的持仓、盈亏、偏离度等
"""

from typing import List, Dict, Any
from decimal import Decimal
from collections import defaultdict
from app.services.supabase_srv import SupabaseService
from app.services.yfinance_srv import YFinanceService
from app.services.calculator import GreedyHunterCalculator
from app.schemas.portfolio import PositionSummary, PortfolioOverview


class PortfolioService:
    """持仓管理服务"""
    
    def __init__(self):
        self.supabase = SupabaseService()
        self.yf_service = YFinanceService()
        self.calculator = GreedyHunterCalculator()
    
    def calculate_positions(self, user_id: str) -> List[PositionSummary]:
        """
        计算用户的持仓汇总
        从交易记录计算每只股票的持仓量和成本
        """
        # 获取所有交易记录
        transactions = self.supabase.get_user_transactions(user_id)
        
        # 按股票代码分组统计
        positions_dict = defaultdict(lambda: {
            "total_quantity": Decimal("0"),
            "total_cost": Decimal("0"),
            "transactions": []
        })
        
        for trans in transactions:
            symbol = trans["symbol"]
            quantity = Decimal(str(trans["quantity"]))
            price = Decimal(str(trans["price"]))
            
            if trans["type"] == "BUY":
                positions_dict[symbol]["total_quantity"] += quantity
                positions_dict[symbol]["total_cost"] += quantity * price
            elif trans["type"] == "SELL":
                positions_dict[symbol]["total_quantity"] -= quantity
                # 卖出时按平均成本减少总成本
                if positions_dict[symbol]["total_quantity"] > 0:
                    avg_cost = positions_dict[symbol]["total_cost"] / (
                        positions_dict[symbol]["total_quantity"] + quantity
                    )
                    positions_dict[symbol]["total_cost"] -= quantity * avg_cost
            
            positions_dict[symbol]["transactions"].append(trans)
        
        # 构建持仓摘要
        position_summaries = []
        
        for symbol, data in positions_dict.items():
            quantity = data["total_quantity"]
            
            # 过滤已清仓的股票
            if quantity <= 0:
                continue
            
            # 计算平均成本
            avg_cost = data["total_cost"] / quantity
            
            # 获取当前价格
            current_price = self.yf_service.get_current_price(symbol)
            if not current_price:
                current_price = float(avg_cost)  # 如果获取失败，用成本价
            
            # 计算市值和盈亏
            market_value = float(quantity) * current_price
            unrealized_pnl = market_value - float(data["total_cost"])
            unrealized_pnl_percent = (unrealized_pnl / float(data["total_cost"])) * 100
            
            # 获取股票信息
            stock_info = self.yf_service.get_stock_info(symbol)
            company_name = stock_info.get("company_name") if stock_info else None
            
            # 计算偏离度（与安全买入价比较）
            deviation_info = self._calculate_deviation(symbol, float(avg_cost))
            
            position_summaries.append(PositionSummary(
                symbol=symbol,
                company_name=company_name,
                total_quantity=quantity,
                avg_cost=avg_cost,
                current_price=current_price,
                market_value=market_value,
                unrealized_pnl=unrealized_pnl,
                unrealized_pnl_percent=unrealized_pnl_percent,
                safe_buy_price=deviation_info.get("safe_buy_price"),
                deviation_percent=deviation_info.get("deviation_percent"),
                warning_message=deviation_info.get("warning_message")
            ))
        
        return position_summaries
    
    def get_portfolio_overview(self, user_id: str) -> PortfolioOverview:
        """获取投资组合概览"""
        positions = self.calculate_positions(user_id)
        
        if not positions:
            return PortfolioOverview(
                total_positions=0,
                total_market_value=0,
                total_cost=0,
                total_pnl=0,
                total_pnl_percent=0,
                positions=[],
                sector_allocation={},
                top_holdings=[]
            )
        
        # 计算总体数据
        total_market_value = sum(p.market_value for p in positions)
        total_cost = sum(float(p.avg_cost) * float(p.total_quantity) for p in positions)
        total_pnl = sum(p.unrealized_pnl for p in positions)
        total_pnl_percent = (total_pnl / total_cost) * 100 if total_cost > 0 else 0
        
        # 行业分布（简化版）
        sector_allocation = self._calculate_sector_allocation(positions)
        
        # Top 5 持仓（按市值排序）
        top_holdings = sorted(
            positions, 
            key=lambda x: x.market_value, 
            reverse=True
        )[:5]
        
        return PortfolioOverview(
            total_positions=len(positions),
            total_market_value=total_market_value,
            total_cost=total_cost,
            total_pnl=total_pnl,
            total_pnl_percent=total_pnl_percent,
            positions=positions,
            sector_allocation=sector_allocation,
            top_holdings=top_holdings
        )
    
    def _calculate_deviation(self, symbol: str, avg_cost: float) -> Dict[str, Any]:
        """
        计算持仓成本与安全买入价的偏离度
        """
        try:
            # 获取该股票的分析结果
            analysis = self.calculator.analyze_stock(symbol)
            if not analysis:
                return {}
            
            safe_buy_price = analysis.safe_buy_price
            deviation = ((avg_cost - safe_buy_price) / safe_buy_price) * 100
            
            # 生成警告消息
            warning = None
            if deviation > 30:
                warning = f"⚠️ 成本过高！偏离安全线 {deviation:.1f}%，建议谨慎加仓"
            elif deviation > 15:
                warning = f"⚠️ 成本偏高，偏离安全线 {deviation:.1f}%"
            elif deviation < -10:
                warning = f"✅ 成本优秀！低于安全线 {abs(deviation):.1f}%"
            
            return {
                "safe_buy_price": safe_buy_price,
                "deviation_percent": deviation,
                "warning_message": warning
            }
        except Exception as e:
            print(f"计算偏离度失败: {symbol}, {str(e)}")
            return {}
    
    def _calculate_sector_allocation(self, positions: List[PositionSummary]) -> Dict[str, float]:
        """
        计算行业分布
        （简化版，Phase 2 可以增强）
        """
        total_value = sum(p.market_value for p in positions)
        
        allocation = {}
        for pos in positions:
            # 简化处理：按股票代码后缀判断市场
            if pos.symbol.endswith('.SS') or pos.symbol.endswith('.SZ'):
                market = "A股"
            elif pos.symbol.endswith('.HK'):
                market = "港股"
            else:
                market = "美股"
            
            if market not in allocation:
                allocation[market] = 0
            allocation[market] += pos.market_value
        
        # 转换为百分比
        for market in allocation:
            allocation[market] = round((allocation[market] / total_value) * 100, 2)
        
        return allocation

