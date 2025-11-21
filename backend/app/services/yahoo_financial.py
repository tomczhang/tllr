"""
Yahoo Finance 财务数据服务
使用自动握手机制（Cookie + Crumb）获取：市值、现金、负债、毛利率、ROE、分红、回购等数据
"""

from typing import Optional, Dict, Any
import logging
from datetime import datetime
import time
import random
import requests

logger = logging.getLogger(__name__)


class YahooFinancialService:
    """Yahoo Finance 财务数据服务（自动握手版）"""
    
    def __init__(self):
        # 创建自定义session以支持代理
        self.session = requests.Session()
        self.session.proxies = {
            'http': 'http://127.0.0.1:7890',
            'https': 'http://127.0.0.1:7890',
        }
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Connection": "keep-alive",
        })
        
        # Crumb缓存
        self.crumb = None
        self.crumb_timestamp = 0
        
        self.last_request_time = 0
    
    def _rate_limit(self):
        """请求限流"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < 1.5:
            sleep_time = 1.5 - time_since_last + random.uniform(0.2, 0.5)
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
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
            r = self.session.get("https://finance.yahoo.com", timeout=10)
            if r.status_code != 200:
                logger.error(f"Cookie 获取失败: {r.status_code}")
                return None
            
            # 步骤2: 获取Crumb
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
            logger.info(f"✅ Financial Crumb 获取成功")
            
            return crumb
            
        except Exception as e:
            logger.error(f"获取 Crumb 失败: {e}")
            return None
    
    def get_financial_data(self, symbol: str) -> Dict[str, Any]:
        """
        获取财务数据（使用quoteSummary API + Crumb）
        
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
        
        crumb = self._get_crumb()
        if not crumb:
            logger.warning(f"无法获取 Crumb，返回空数据: {symbol}")
            return default_data
        
        try:
            # 请求三个关键模块
            modules = "financialData,cashflowStatementHistory,summaryDetail,defaultKeyStatistics"
            url = f"https://query2.finance.yahoo.com/v10/finance/quoteSummary/{symbol}"
            params = {
                "modules": modules,
                "crumb": crumb
            }
            
            response = self.session.get(url, params=params, timeout=15)
            
            if response.status_code != 200:
                logger.warning(f"quoteSummary API 返回错误: {response.status_code}，返回空数据")
                return default_data
            
            data = response.json()
            result = data.get("quoteSummary", {}).get("result")
            
            if not result or len(result) == 0:
                logger.warning(f"无财务数据: {symbol}，返回空数据")
                return default_data
            
            quote_data = result[0]
            
            # 提取各个模块的数据
            fin_data = quote_data.get("financialData", {})
            sum_detail = quote_data.get("summaryDetail", {})
            key_stats = quote_data.get("defaultKeyStatistics", {})
            cash_flow = quote_data.get("cashflowStatementHistory", {}).get("cashflowStatements", [])
            
            # 安全获取数值
            def safe_get(data_dict, default=None):
                """安全获取 Yahoo Finance 的 raw 值"""
                if isinstance(data_dict, dict):
                    return data_dict.get("raw", default)
                return data_dict if data_dict is not None else default
            
            # 计算上市年限
            first_trade_epoch = safe_get(key_stats.get("firstTradeDateEpochUtc"))
            listing_years = None
            if first_trade_epoch:
                years = (datetime.now().timestamp() - first_trade_epoch) / (365.25 * 24 * 3600)
                listing_years = int(years)
            
            # 处理回购数据（取最近一年的数据）
            buyback = 0
            if cash_flow:
                latest_cf = cash_flow[0]
                repurchase = latest_cf.get("repurchaseOfStock", {})
                if repurchase and isinstance(repurchase, dict):
                    buyback_raw = repurchase.get("raw", 0)
                    if buyback_raw and buyback_raw < 0:
                        buyback = abs(buyback_raw)
            
            return {
                "market_cap": safe_get(sum_detail.get("marketCap")),
                "total_cash": safe_get(fin_data.get("totalCash")),
                "total_debt": safe_get(fin_data.get("totalDebt")),
                "gross_margins": safe_get(fin_data.get("grossMargins")),
                "return_on_equity": safe_get(fin_data.get("returnOnEquity")),
                "dividend_rate": safe_get(sum_detail.get("dividendYield"), 0),  # 使用 dividendYield（百分比）
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

