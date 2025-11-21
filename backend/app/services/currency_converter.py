"""
货币转换服务
支持港币(HKD)、人民币(CNY)转换为美元(USD)
"""

import logging
import requests
import time
from typing import Optional, Dict

logger = logging.getLogger(__name__)


class CurrencyConverter:
    """货币转换器"""
    
    def __init__(self):
        # 汇率缓存（有效期1小时）
        self.exchange_rates: Dict[str, float] = {}
        self.last_update_time = 0
        self.cache_duration = 3600  # 1小时
        
        # 备用固定汇率（API失败时使用）
        self.fallback_rates = {
            "HKD": 0.128,   # 1 HKD ≈ 0.128 USD (约7.8)
            "CNY": 0.138,   # 1 CNY ≈ 0.138 USD (约7.25)
            "USD": 1.0,
            "CNH": 0.138,   # 离岸人民币
        }
    
    def _fetch_exchange_rates(self) -> bool:
        """
        从 Yahoo Finance API 获取实时汇率
        """
        try:
            # 使用 Yahoo Finance 的汇率查询
            session = requests.Session()
            session.proxies = {
                'http': 'http://127.0.0.1:7890',
                'https': 'http://127.0.0.1:7890',
            }
            session.headers.update({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })
            
            # 查询 HKD/USD 和 CNY/USD
            symbols = ["HKDUSD=X", "CNYUSD=X"]
            
            rates = {}
            for symbol in symbols:
                try:
                    url = f"https://query2.finance.yahoo.com/v8/finance/chart/{symbol}"
                    params = {'interval': '1d', 'range': '1d'}
                    
                    response = session.get(url, params=params, timeout=10)
                    if response.status_code == 200:
                        data = response.json()
                        chart = data.get('chart', {}).get('result', [])
                        if chart:
                            quote = chart[0].get('meta', {})
                            rate = quote.get('regularMarketPrice')
                            
                            if rate:
                                currency = symbol[:3]  # HKD, CNY
                                rates[currency] = float(rate)
                                logger.info(f"✅ 获取汇率: 1 {currency} = ${rate:.4f} USD")
                    
                    time.sleep(0.5)  # 限流
                
                except Exception as e:
                    logger.warning(f"获取汇率失败 {symbol}: {e}")
            
            if rates:
                self.exchange_rates = rates
                self.exchange_rates["USD"] = 1.0
                self.last_update_time = time.time()
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"获取汇率失败: {e}")
            return False
    
    def get_exchange_rate(self, from_currency: str, to_currency: str = "USD") -> float:
        """
        获取汇率
        
        Args:
            from_currency: 源货币 (HKD, CNY, USD)
            to_currency: 目标货币 (默认USD)
        
        Returns:
            汇率（如果失败返回备用汇率）
        """
        from_currency = from_currency.upper()
        to_currency = to_currency.upper()
        
        # 如果都是USD，直接返回1
        if from_currency == to_currency:
            return 1.0
        
        # 检查缓存是否过期
        if time.time() - self.last_update_time > self.cache_duration:
            self._fetch_exchange_rates()
        
        # 尝试从缓存获取
        if from_currency in self.exchange_rates:
            rate = self.exchange_rates[from_currency]
            logger.debug(f"使用缓存汇率: 1 {from_currency} = ${rate:.4f}")
            return rate
        
        # 使用备用汇率
        if from_currency in self.fallback_rates:
            rate = self.fallback_rates[from_currency]
            logger.warning(f"使用备用汇率: 1 {from_currency} = ${rate:.4f}")
            return rate
        
        # 未知货币，假设为USD
        logger.warning(f"未知货币 {from_currency}，假设为USD")
        return 1.0
    
    def convert(self, amount: float, from_currency: str, to_currency: str = "USD") -> float:
        """
        转换金额
        
        Args:
            amount: 金额
            from_currency: 源货币
            to_currency: 目标货币（默认USD）
        
        Returns:
            转换后的金额
        """
        if not amount:
            return 0.0
        
        rate = self.get_exchange_rate(from_currency, to_currency)
        converted = amount * rate
        
        logger.debug(f"货币转换: {amount:.2f} {from_currency} = {converted:.2f} {to_currency}")
        
        return converted
    
    def convert_to_usd(self, amount: float, currency: str) -> float:
        """
        转换为美元（简化接口）
        
        Args:
            amount: 金额
            currency: 源货币
        
        Returns:
            美元金额
        """
        return self.convert(amount, currency, "USD")


# 创建全局单例
_currency_converter = None

def get_currency_converter() -> CurrencyConverter:
    """获取货币转换器单例"""
    global _currency_converter
    if _currency_converter is None:
        _currency_converter = CurrencyConverter()
    return _currency_converter

