"""
Yahoo Finance 财务数据服务
使用 yfinance 库获取：市值、现金、负债、毛利率、ROE、分红、回购等数据
"""

import yfinance as yf
from typing import Optional, Dict, Any
import logging
from datetime import datetime
import time
import random
import requests

logger = logging.getLogger(__name__)


class YahooFinancialService:
    """Yahoo Finance 财务数据服务（使用yfinance库）"""
    
    def __init__(self):
        # 创建自定义session以支持代理
        self.session = requests.Session()
        self.session.proxies = {
            'http': 'http://127.0.0.1:7890',
            'https': 'http://127.0.0.1:7890',
        }
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        self.last_request_time = 0
    
    def _rate_limit(self):
        """请求限流"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < 1.0:
            sleep_time = 1.0 - time_since_last + random.uniform(0.2, 0.5)
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    def get_financial_data(self, symbol: str) -> Dict[str, Any]:
        """
        获取财务数据（使用yfinance.info）
        
        注意：如果API失败或数据缺失，返回None值，由上层业务决定如何处理
        
        返回字段：
        - market_cap: 市值（美元）
        - total_cash: 总现金（美元）
        - total_debt: 总债务（美元）
        - gross_margins: 毛利率（小数，如0.438表示43.8%）
        - return_on_equity: ROE（小数，如1.47表示147%）
        - dividend_rate: 分红率（小数）
        - buyback_amount: 回购金额（美元，最近一年）
        - first_trade_date_epoch: 首次交易时间戳
        - listing_years: 上市年限（年）
        """
        self._rate_limit()
        
        # 默认返回空数据结构
        default_data = {
            "market_cap": None,
            "total_cash": None,
            "total_debt": None,
            "gross_margins": None,
            "return_on_equity": None,
            "dividend_rate": None,
            "buyback_amount": None,
            "first_trade_date_epoch": None,
            "listing_years": None
        }
        
        try:
            ticker = yf.Ticker(symbol, session=self.session)
            info = ticker.info
            
            if not info or len(info) < 5:
                logger.warning(f"无法获取股票财务信息: {symbol}，使用空数据")
                return default_data
            
            # 计算上市年限
            first_trade_epoch = info.get('firstTradeDateEpochUtc')
            listing_years = None
            if first_trade_epoch:
                years = (datetime.now().timestamp() - first_trade_epoch) / (365.25 * 24 * 3600)
                listing_years = int(years)
            
            # 获取回购数据（从cashflow）
            buyback = 0
            try:
                cashflow = ticker.cashflow
                if cashflow is not None and not cashflow.empty:
                    if 'Repurchase Of Stock' in cashflow.index:
                        latest_buyback = cashflow.loc['Repurchase Of Stock'].iloc[0]
                        if latest_buyback and latest_buyback < 0:
                            buyback = abs(float(latest_buyback))
            except Exception as e:
                logger.warning(f"获取回购数据失败: {symbol}, {str(e)}")
            
            return {
                "market_cap": info.get('marketCap'),
                "total_cash": info.get('totalCash'),
                "total_debt": info.get('totalDebt'),
                "gross_margins": info.get('grossMargins'),
                "return_on_equity": info.get('returnOnEquity'),
                "dividend_rate": info.get('dividendRate', 0),
                "buyback_amount": buyback if buyback > 0 else None,
                "first_trade_date_epoch": first_trade_epoch,
                "listing_years": listing_years
            }
            
        except Exception as e:
            logger.warning(f"获取财务数据失败: {symbol}, 错误: {str(e)}，返回空数据")
            return default_data
    
    def validate_required_data(self, symbol: str, financial_data: Dict[str, Any]) -> tuple[bool, list[str]]:
        """
        验证关键数据是否完整
        
        返回: (是否完整, 缺失字段列表)
        """
        required_fields = {
            'market_cap': '市值',
            'listing_years': '上市年限',
            'gross_margins': '毛利率',
            'return_on_equity': 'ROE',
            'total_cash': '现金',
            'total_debt': '负债'
        }
        
        missing = []
        for field, name in required_fields.items():
            if financial_data.get(field) is None:
                missing.append(name)
        
        is_complete = len(missing) == 0
        return is_complete, missing


# 创建全局单例
_financial_service = None

def get_financial_service() -> YahooFinancialService:
    """获取财务数据服务单例"""
    global _financial_service
    if _financial_service is None:
        _financial_service = YahooFinancialService()
    return _financial_service

