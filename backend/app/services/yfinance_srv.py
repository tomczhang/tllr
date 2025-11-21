"""
yfinance 数据服务封装 - 防爬虫优化版本
包含请求延迟、重试机制、完整的反爬虫措施
"""

from typing import Optional, Dict, Any
import yfinance as yf
import pandas as pd
import requests
import logging
import time
import random
from functools import wraps

# 配置日志
logger = logging.getLogger(__name__)


def retry_on_error(max_retries=3, delay=2):
    """装饰器：失败时自动重试"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    result = func(*args, **kwargs)
                    if result is not None:
                        return result
                    # 如果返回 None，等待后重试
                    if attempt < max_retries - 1:
                        wait_time = delay * (attempt + 1) + random.uniform(0.5, 1.5)
                        logger.info(f"第 {attempt + 1} 次尝试失败，等待 {wait_time:.1f}秒后重试...")
                        time.sleep(wait_time)
                except Exception as e:
                    if attempt < max_retries - 1:
                        wait_time = delay * (attempt + 1) + random.uniform(0.5, 1.5)
                        logger.warning(f"第 {attempt + 1} 次尝试出错: {e}，等待 {wait_time:.1f}秒后重试...")
                        time.sleep(wait_time)
                    else:
                        logger.error(f"重试 {max_retries} 次后仍然失败: {e}")
                        raise
            return None
        return wrapper
    return decorator

class YFinanceService:
    """Yahoo Finance 数据服务 - 防爬虫优化版"""
    
    def __init__(self):
        # 1. 创建持久化 Session
        self.session = requests.Session()
        
        # 2. 完整的浏览器请求头（关键！）
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
        })
        
        # 3. 配置代理
        self.session.proxies = {
            'http': 'http://127.0.0.1:7890',
            'https': 'http://127.0.0.1:7890',
        }
        
        # 4. 请求计数器（用于限流）
        self.request_count = 0
        self.last_request_time = 0

    def _rate_limit(self):
        """请求限流：确保请求间隔至少 1-2 秒"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < 1.5:
            sleep_time = 1.5 - time_since_last + random.uniform(0.2, 0.8)
            logger.debug(f"限流：等待 {sleep_time:.2f} 秒")
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
        self.request_count += 1
    
    @retry_on_error(max_retries=3, delay=2)
    def get_stock_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        获取股票基础信息
        支持 A股(.SS/.SZ)、美股、港股(.HK)
        """
        self._rate_limit()
        
        try:
            # 把 session 传给 Ticker
            stock = yf.Ticker(symbol, session=self.session)
            
            # 先获取历史数据（更可靠）
            hist = stock.history(period="5d")
            if hist.empty:
                logger.warning(f"无法获取 {symbol} 的历史数据")
                return None
            
            current_price = float(hist['Close'].iloc[-1])
            
            # 尝试获取详细信息（可能失败）
            try:
                info = stock.info
                company_name = info.get("longName") or info.get("shortName") or symbol
                sector = info.get("sector")
                industry = info.get("industry")
                market_cap = info.get("marketCap")
                currency = info.get("currency", "USD")
            except:
                # 如果详细信息失败，使用基础信息
                logger.warning(f"无法获取 {symbol} 的详细信息，使用基础数据")
                company_name = symbol
                sector = None
                industry = None
                market_cap = None
                currency = "USD"
            
            return {
                "symbol": symbol,
                "company_name": company_name,
                "sector": sector,
                "industry": industry,
                "market_cap": market_cap,
                "current_price": current_price,
                "currency": currency,
            }
        except Exception as e:
            logger.error(f"获取股票信息失败: {symbol}, 错误: {str(e)}")
            return None

    def get_current_price(self, symbol: str) -> Optional[float]:
        """获取当前价格"""
        try:
            hist = self.get_historical_data(symbol, period="1d")
            if hist is not None and not hist.empty:
                return float(hist['Close'].iloc[-1])
            return None
        except Exception as e:
            logger.error(f"获取价格失败: {symbol}, 错误: {str(e)}")
            return None
    
    @retry_on_error(max_retries=3, delay=2)
    def get_historical_data(
        self,
        symbol: str,
        period: str = "10y",
        interval: str = "1d"
    ) -> Optional[pd.DataFrame]:
        """
        获取历史数据
        period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
        interval: 1d, 1wk, 1mo
        """
        self._rate_limit()
        
        try:
            stock = yf.Ticker(symbol, session=self.session)
            hist = stock.history(period=period, interval=interval)
            
            if hist.empty:
                logger.warning(f"{symbol}: 无数据 (period={period})")
                return None
            
            # 重置索引，将日期变为列
            hist = hist.reset_index()
            return hist
        except Exception as e:
            logger.error(f"获取历史数据失败: {symbol}, 错误: {str(e)}")
            return None
    
    @staticmethod
    def calculate_max_drawdown(df: pd.DataFrame) -> Dict[str, Any]:
        """
        计算最大回撤 (MDD)
        返回：最大回撤比例和日期
        """
        if df is None or df.empty:
            return {"max_drawdown": 0, "date": None}
        
        # 计算累计最高价
        df['cummax'] = df['Close'].cummax()
        
        # 计算回撤
        df['drawdown'] = (df['Close'] - df['cummax']) / df['cummax']
        
        # 找到最大回撤
        max_dd_idx = df['drawdown'].idxmin()
        max_drawdown = df.loc[max_dd_idx, 'drawdown']
        max_dd_date = df.loc[max_dd_idx, 'Date']
        
        return {
            "max_drawdown": abs(float(max_drawdown)),
            "max_drawdown_percent": abs(float(max_drawdown)) * 100,
            "date": max_dd_date.strftime("%Y-%m-%d") if hasattr(max_dd_date, 'strftime') else str(max_dd_date)
        }
    
    @retry_on_error(max_retries=3, delay=2)
    def get_stock_data_summary(self, symbol: str) -> Optional[Dict[str, Any]]:
        """获取股票数据摘要（用于快速展示）"""
        self._rate_limit()
        
        try:
            stock = yf.Ticker(symbol, session=self.session)
            hist = stock.history(period="1y")
            
            if hist.empty:
                return None
            
            year_high = float(hist['High'].max())
            year_low = float(hist['Low'].min())
            current_price = float(hist['Close'].iloc[-1])
            
            return {
                "symbol": symbol,
                "current_price": current_price,
                "year_high": year_high,
                "year_low": year_low,
                "from_high_percent": ((current_price - year_high) / year_high) * 100,
                "from_low_percent": ((current_price - year_low) / year_low) * 100,
            }
        except Exception as e:
            logger.error(f"获取股票摘要失败: {symbol}, 错误: {str(e)}")
            return None


# 创建全局单例
_service_instance = None

def get_yfinance_service() -> YFinanceService:
    """获取 YFinanceService 单例"""
    global _service_instance
    if _service_instance is None:
        _service_instance = YFinanceService()
    return _service_instance