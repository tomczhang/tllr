"""
直接调用 Yahoo Finance API（不使用 yfinance 库）
解决 yfinance 在部分网络环境下被限流的问题
"""

from typing import Optional, Dict, Any
import requests
import pandas as pd
from datetime import datetime
import time
import random
import logging
from app.services.currency_converter import get_currency_converter

logger = logging.getLogger(__name__)


class YahooDirectAPI:
    """直接调用 Yahoo Finance API"""
    
    def __init__(self):
        self.session = requests.Session()
        # 不使用代理，直接连接
        self.session.proxies = {}
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        self.base_url = "https://query1.finance.yahoo.com"
        self.last_request_time = 0
        self.currency_converter = get_currency_converter()  # 货币转换器
    
    def _rate_limit(self):
        """请求限流"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < 1.0:
            sleep_time = 1.0 - time_since_last + random.uniform(0.2, 0.5)
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    def get_stock_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """获取股票基础信息"""
        self._rate_limit()
        
        try:
            # 获取5天数据
            hist = self.get_historical_data(symbol, period="5d")
            if hist is None or hist.empty:
                logger.error(f"无法获取 {symbol} 的数据")
                return None
            
            current_price = float(hist['Close'].iloc[-1])
            
            # 尝试获取详细信息
            try:
                quote_url = f"{self.base_url}/v7/finance/quote?symbols={symbol}"
                response = self.session.get(quote_url, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('quoteResponse') and data['quoteResponse'].get('result'):
                        quote = data['quoteResponse']['result'][0]
                        
                        # 获取货币和市值
                        currency = quote.get("currency", "USD")
                        market_cap = quote.get("marketCap")
                        
                        # 如果市值不是USD，转换为USD
                        market_cap_usd = market_cap
                        if market_cap and currency != "USD":
                            try:
                                market_cap_usd = self.currency_converter.convert_to_usd(market_cap, currency)
                                logger.info(f"✅ 市值转换: {market_cap:,.0f} {currency} → ${market_cap_usd:,.0f} USD")
                            except Exception as e:
                                logger.warning(f"市值转换失败 {symbol}: {e}，使用原始值")
                        
                        return {
                            "symbol": symbol,
                            "company_name": quote.get("longName") or quote.get("shortName") or symbol,
                            "sector": quote.get("sector"),
                            "industry": quote.get("industry"),
                            "market_cap": market_cap_usd,  # 统一为USD
                            "market_cap_original": market_cap,  # 保留原始值
                            "current_price": current_price,
                            "currency": currency,  # 保留原始货币信息
                        }
            except Exception as e:
                logger.warning(f"无法获取 {symbol} 详细信息: {e}")
            
            # 返回基础信息
            return {
                "symbol": symbol,
                "company_name": symbol,
                "sector": None,
                "industry": None,
                "market_cap": None,
                "current_price": current_price,
                "currency": "USD",
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
    
    def get_historical_data(
        self,
        symbol: str,
        period: str = "10y"
    ) -> Optional[pd.DataFrame]:
        """
        获取历史数据
        period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, max
        """
        self._rate_limit()
        
        try:
            url = f"{self.base_url}/v8/finance/chart/{symbol}"
            params = {
                'interval': '1d',
                'range': period
            }
            
            response = self.session.get(url, params=params, timeout=30)
            
            if response.status_code != 200:
                logger.error(f"API 返回错误: {response.status_code}")
                return None
            
            data = response.json()
            
            if not data.get('chart') or not data['chart'].get('result'):
                logger.error(f"无效的响应数据: {symbol}")
                return None
            
            result = data['chart']['result'][0]
            
            # 提取时间戳和价格数据
            timestamps = result['timestamp']
            quotes = result['indicators']['quote'][0]
            
            # 转换为 DataFrame
            df = pd.DataFrame({
                'Date': [datetime.fromtimestamp(ts) for ts in timestamps],
                'Open': quotes.get('open', []),
                'High': quotes.get('high', []),
                'Low': quotes.get('low', []),
                'Close': quotes.get('close', []),
                'Volume': quotes.get('volume', [])
            })
            
            # 清理 None 值
            df = df.dropna()
            
            if df.empty:
                logger.error(f"数据为空: {symbol}")
                return None
            
            return df
            
        except Exception as e:
            logger.error(f"获取历史数据失败: {symbol}, 错误: {str(e)}")
            return None
    
    @staticmethod
    def calculate_max_drawdown(df: pd.DataFrame) -> Dict[str, Any]:
        """计算最大回撤"""
        if df is None or df.empty:
            return {"max_drawdown": 0, "date": None}
        
        df['cummax'] = df['Close'].cummax()
        df['drawdown'] = (df['Close'] - df['cummax']) / df['cummax']
        
        max_dd_idx = df['drawdown'].idxmin()
        max_drawdown = df.loc[max_dd_idx, 'drawdown']
        max_dd_date = df.loc[max_dd_idx, 'Date']
        
        return {
            "max_drawdown": abs(float(max_drawdown)),
            "max_drawdown_percent": abs(float(max_drawdown)) * 100,
            "date": max_dd_date.strftime("%Y-%m-%d") if hasattr(max_dd_date, 'strftime') else str(max_dd_date)
        }
    
    def get_stock_data_summary(self, symbol: str) -> Optional[Dict[str, Any]]:
        """获取股票数据摘要"""
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

def get_yahoo_service() -> YahooDirectAPI:
    """获取 YahooDirectAPI 单例"""
    global _service_instance
    if _service_instance is None:
        _service_instance = YahooDirectAPI()
    return _service_instance

