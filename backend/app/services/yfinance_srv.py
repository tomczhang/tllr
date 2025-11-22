"""
Yahoo Finance 数据服务 - 自动握手版本
实现 Cookie + Crumb 自动获取，直接调用 Yahoo Finance API
"""

from typing import Optional, Dict, Any
import pandas as pd
import requests
import logging
import time
import random
from functools import wraps
from datetime import datetime

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
                        return None
            return None
        return wrapper
    return decorator


class YFinanceService:
    """Yahoo Finance 数据服务 - 自动握手版"""
    
    def __init__(self):
        # 1. 创建持久化 Session
        self.session = requests.Session()
        
        # 2. 完整的浏览器请求头
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        })
        
        # 3. 配置代理（不使用代理）
        self.session.proxies = {}
        
        # 4. Crumb缓存
        self.crumb = None
        self.crumb_timestamp = 0
        
        # 5. 请求计数器
        self.request_count = 0
        self.last_request_time = 0

    def _rate_limit(self):
        """请求限流：确保请求间隔至少 1-2 秒"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < 1.5:
            sleep_time = 1.5 - time_since_last + random.uniform(0.2, 0.8)
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
        self.request_count += 1
    
    def _get_crumb(self) -> Optional[str]:
        """
        获取 Yahoo Finance Crumb（自动握手）
        Crumb有效期约30分钟，缓存后复用
        """
        # 如果有缓存且未过期（30分钟），直接返回
        if self.crumb and (time.time() - self.crumb_timestamp) < 1800:
            return self.crumb
        
        try:
            # 步骤1: 访问首页获取Cookie
            logger.info("🔄 正在获取 Yahoo Finance Cookie...")
            r = self.session.get("https://finance.yahoo.com", timeout=10)
            if r.status_code != 200:
                logger.error(f"Cookie 获取失败: {r.status_code}")
                return None
            
            # 步骤2: 获取Crumb
            logger.info("🔄 正在获取 Crumb...")
            crumb_response = self.session.get(
                "https://query1.finance.yahoo.com/v1/test/getcrumb",
                timeout=10
            )
            
            if crumb_response.status_code != 200:
                logger.error(f"Crumb 获取失败: {crumb_response.status_code}")
                return None
            
            crumb = crumb_response.text.strip()
            
            if "Invalid" in crumb or len(crumb) == 0:
                logger.error("Crumb 无效")
                return None
            
            # 缓存Crumb
            self.crumb = crumb
            self.crumb_timestamp = time.time()
            logger.info(f"✅ Crumb 获取成功: {crumb[:10]}...")
            
            return crumb
            
        except Exception as e:
            logger.error(f"获取 Crumb 失败: {e}")
            return None
    
    @retry_on_error(max_retries=3, delay=2)
    def get_stock_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        获取股票基础信息和财务数据
        使用 quoteSummary API
        """
        self._rate_limit()
        
        crumb = self._get_crumb()
        if not crumb:
            logger.error(f"无法获取 Crumb，跳过 {symbol}")
            return None
        
        try:
            # 请求财务数据和基本信息
            modules = "price,summaryDetail,defaultKeyStatistics,financialData"
            url = f"https://query2.finance.yahoo.com/v10/finance/quoteSummary/{symbol}"
            params = {
                "modules": modules,
                "crumb": crumb
            }
            
            response = self.session.get(url, params=params, timeout=15)
            
            if response.status_code != 200:
                logger.error(f"quoteSummary API 返回错误: {response.status_code}")
                return None
            
            data = response.json()
            result = data.get("quoteSummary", {}).get("result")
            
            if not result or len(result) == 0:
                logger.error(f"无数据: {symbol}")
                return None
            
            quote_data = result[0]
            
            # 提取数据
            price_data = quote_data.get("price", {})
            summary = quote_data.get("summaryDetail", {})
            
            def safe_get(data_dict, default=None):
                """安全获取 raw 值"""
                if isinstance(data_dict, dict):
                    return data_dict.get("raw", default)
                return data_dict if data_dict is not None else default
            
            return {
                "symbol": symbol,
                "company_name": price_data.get("longName") or price_data.get("shortName") or symbol,
                "sector": safe_get(price_data.get("sector")),
                "industry": safe_get(price_data.get("industry")),
                "market_cap": safe_get(price_data.get("marketCap")),
                "current_price": safe_get(price_data.get("regularMarketPrice")),
                "currency": price_data.get("currency", "USD"),
            }
            
        except Exception as e:
            logger.error(f"获取股票信息失败: {symbol}, 错误: {str(e)}")
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
        使用 chart API（不需要crumb）
        """
        self._rate_limit()
        
        try:
            # 转换period为时间范围
            period_map = {
                "1d": 1,
                "5d": 5,
                "1mo": 30,
                "3mo": 90,
                "6mo": 180,
                "1y": 365,
                "2y": 730,
                "5y": 1825,
                "10y": 3650,
                "max": 36500
            }
            
            days = period_map.get(period, 3650)
            period2 = int(time.time())
            period1 = period2 - (days * 24 * 60 * 60)
            
            # 使用 chart API
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
            params = {
                "period1": period1,
                "period2": period2,
                "interval": interval,
                "events": "div,splits"
            }
            
            response = self.session.get(url, params=params, timeout=15)
            
            if response.status_code != 200:
                logger.error(f"chart API 返回错误: {response.status_code}")
                return None
            
            data = response.json()
            chart = data.get("chart", {}).get("result")
            
            if not chart or len(chart) == 0:
                logger.error(f"无历史数据: {symbol}")
                return None
            
            result = chart[0]
            timestamps = result.get("timestamp", [])
            quotes = result.get("indicators", {}).get("quote", [{}])[0]
            
            # 构建DataFrame
            df = pd.DataFrame({
                "Date": [datetime.fromtimestamp(ts) for ts in timestamps],
                "Open": quotes.get("open", []),
                "High": quotes.get("high", []),
                "Low": quotes.get("low", []),
                "Close": quotes.get("close", []),
                "Volume": quotes.get("volume", []),
            })
            
            # 清理NaN
            df = df.dropna()
            
            if df.empty:
                logger.warning(f"{symbol}: 历史数据为空 (period={period})")
                return None
            
            return df
            
        except Exception as e:
            logger.error(f"获取历史数据失败: {symbol}, 错误: {str(e)}")
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
            hist = self.get_historical_data(symbol, period="1y")
            
            if hist is None or hist.empty:
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
