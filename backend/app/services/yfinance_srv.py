"""
yfinance 数据服务封装
获取股票行情数据和历史数据
"""

from typing import Optional, Dict, Any
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta


class YFinanceService:
    """Yahoo Finance 数据服务"""
    
    @staticmethod
    def get_stock_info(symbol: str) -> Optional[Dict[str, Any]]:
        """
        获取股票基础信息
        支持 A股(.SS/.SZ)、美股、港股(.HK)
        """
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            return {
                "symbol": symbol,
                "company_name": info.get("longName") or info.get("shortName"),
                "sector": info.get("sector"),
                "industry": info.get("industry"),
                "market_cap": info.get("marketCap"),
                "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
                "currency": info.get("currency", "USD"),
            }
        except Exception as e:
            print(f"获取股票信息失败: {symbol}, 错误: {str(e)}")
            return None
    
    @staticmethod
    def get_current_price(symbol: str) -> Optional[float]:
        """获取当前价格"""
        try:
            ticker = yf.Ticker(symbol)
            data = ticker.history(period="1d")
            if not data.empty:
                return float(data['Close'].iloc[-1])
            return None
        except Exception as e:
            print(f"获取价格失败: {symbol}, 错误: {str(e)}")
            return None
    
    @staticmethod
    def get_historical_data(
        symbol: str, 
        period: str = "10y",
        interval: str = "1d"
    ) -> Optional[pd.DataFrame]:
        """
        获取历史数据
        period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
        interval: 1d, 1wk, 1mo
        """
        try:
            ticker = yf.Ticker(symbol)
            data = ticker.history(period=period, interval=interval)
            
            if data.empty:
                return None
            
            # 重置索引，将日期变为列
            data = data.reset_index()
            return data
        except Exception as e:
            print(f"获取历史数据失败: {symbol}, 错误: {str(e)}")
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
    
    @staticmethod
    def get_stock_data_summary(symbol: str) -> Optional[Dict[str, Any]]:
        """
        获取股票数据摘要（用于快速展示）
        """
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            hist = ticker.history(period="1y")
            
            if hist.empty:
                return None
            
            # 计算一些基础指标
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
            print(f"获取股票摘要失败: {symbol}, 错误: {str(e)}")
            return None

