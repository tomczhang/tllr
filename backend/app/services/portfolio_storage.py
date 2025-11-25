"""
持仓数据存储服务 (基于JSON文件)
用于本地开发，不依赖数据库
"""
import json
import os
from typing import Dict, List, Optional
from pathlib import Path
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class PortfolioStorage:
    """持仓数据存储服务"""
    
    def __init__(self, data_dir: str = "data"):
        """
        初始化存储服务
        
        Args:
            data_dir: 数据目录路径（相对于项目根目录）
        """
        # 获取项目根目录
        project_root = Path(__file__).parent.parent.parent.parent
        self.data_dir = project_root / data_dir
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        self.holdings_file = self.data_dir / "holdings.json"
        
        # 初始化文件
        self._init_files()
        
        logger.info(f"持仓数据存储已初始化: {self.holdings_file}")
    
    def _init_files(self):
        """初始化JSON文件"""
        if not self.holdings_file.exists():
            default_data = {
                "last_updated": datetime.now().isoformat(),
                "cash": 0.0,
                "holdings": []
            }
            self._save_json(self.holdings_file, default_data)
            logger.info(f"创建默认持仓文件: {self.holdings_file}")
    
    def _load_json(self, file_path: Path) -> dict:
        """加载JSON文件"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"加载JSON文件失败 {file_path}: {str(e)}")
            return {}
    
    def _save_json(self, file_path: Path, data: dict):
        """保存JSON文件"""
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            logger.info(f"保存JSON文件成功: {file_path}")
        except Exception as e:
            logger.error(f"保存JSON文件失败 {file_path}: {str(e)}")
            raise
    
    def get_holdings(self) -> Dict:
        """
        获取持仓数据
        
        Returns:
            Dict: 持仓数据 {cash, holdings, last_updated}
        """
        data = self._load_json(self.holdings_file)
        logger.info(f"获取持仓数据: {len(data.get('holdings', []))} 个持仓")
        return data
    
    def save_holdings(self, cash: float, holdings: List[Dict]) -> Dict:
        """
        保存持仓数据
        
        Args:
            cash: 现金金额
            holdings: 持仓列表 [{ticker, market_value, quantity, avg_cost}, ...]
        
        Returns:
            Dict: 保存后的数据
        """
        data = {
            "last_updated": datetime.now().isoformat(),
            "cash": cash,
            "holdings": holdings
        }
        
        self._save_json(self.holdings_file, data)
        logger.info(f"保存持仓数据: {len(holdings)} 个持仓, 现金 ${cash:,.2f}")
        
        return data
    
    def add_holding(self, ticker: str, market_value: float, quantity: Optional[float] = None, avg_cost: Optional[float] = None) -> Dict:
        """
        添加单个持仓
        
        Args:
            ticker: 股票代码
            market_value: 市值
            quantity: 持仓数量
            avg_cost: 平均成本
        
        Returns:
            Dict: 更新后的持仓数据
        """
        data = self.get_holdings()
        holdings = data.get("holdings", [])
        
        # 检查是否已存在
        existing = next((h for h in holdings if h["ticker"] == ticker), None)
        
        if existing:
            # 更新现有持仓
            existing["market_value"] = market_value
            if quantity is not None:
                existing["quantity"] = quantity
            if avg_cost is not None:
                existing["avg_cost"] = avg_cost
            existing["updated_at"] = datetime.now().isoformat()
            logger.info(f"更新持仓: {ticker}")
        else:
            # 添加新持仓
            new_holding = {
                "ticker": ticker,
                "market_value": market_value,
                "quantity": quantity,
                "avg_cost": avg_cost,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            holdings.append(new_holding)
            logger.info(f"添加新持仓: {ticker}")
        
        return self.save_holdings(data.get("cash", 0.0), holdings)
    
    def remove_holding(self, ticker: str) -> Dict:
        """
        删除持仓
        
        Args:
            ticker: 股票代码
        
        Returns:
            Dict: 更新后的持仓数据
        """
        data = self.get_holdings()
        holdings = data.get("holdings", [])
        
        # 过滤掉要删除的持仓
        holdings = [h for h in holdings if h["ticker"] != ticker]
        
        logger.info(f"删除持仓: {ticker}")
        return self.save_holdings(data.get("cash", 0.0), holdings)
    
    def update_cash(self, cash: float) -> Dict:
        """
        更新现金金额
        
        Args:
            cash: 现金金额
        
        Returns:
            Dict: 更新后的持仓数据
        """
        data = self.get_holdings()
        holdings = data.get("holdings", [])
        
        logger.info(f"更新现金: ${cash:,.2f}")
        return self.save_holdings(cash, holdings)
    
    def clear_all(self) -> Dict:
        """
        清空所有持仓
        
        Returns:
            Dict: 清空后的数据
        """
        logger.info("清空所有持仓")
        return self.save_holdings(0.0, [])


# 测试代码
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    storage = PortfolioStorage()
    
    # 测试添加持仓
    print("\n=== 测试添加持仓 ===")
    storage.add_holding("SGOV", 30000, 300, 100)
    storage.add_holding("QQQ", 21000, 50, 420)
    storage.add_holding("VOO", 14000, 30, 466.67)
    
    # 测试获取持仓
    print("\n=== 测试获取持仓 ===")
    data = storage.get_holdings()
    print(f"现金: ${data['cash']:,.2f}")
    print(f"持仓数量: {len(data['holdings'])}")
    for h in data['holdings']:
        print(f"  {h['ticker']}: ${h['market_value']:,.2f}")
    
    # 测试更新现金
    print("\n=== 测试更新现金 ===")
    storage.update_cash(5000)
    
    # 测试删除持仓
    print("\n=== 测试删除持仓 ===")
    storage.remove_holding("VOO")
    
    # 最终状态
    print("\n=== 最终状态 ===")
    data = storage.get_holdings()
    print(json.dumps(data, indent=2, ensure_ascii=False))

