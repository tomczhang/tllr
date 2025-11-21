import requests
import time
from datetime import datetime

def safe_extract(data_dict, key):
    """
    🛡️ 防御性提取函数
    Yahoo API 极其不稳定，有时候返回 {"raw": 123, "fmt": "123"}，有时候直接返回 123。
    这个函数能同时处理这两种情况。
    """
    if not isinstance(data_dict, dict):
        return 0
    
    value = data_dict.get(key)
    
    # 情况 1: 它是 None
    if value is None:
        return 0
    
    # 情况 2: 它是一个字典 (标准情况)，取里面的 raw
    if isinstance(value, dict):
        return value.get("raw", 0)
    
    # 情况 3: 它直接就是个数字 (非标情况，导致你报错的原因)
    if isinstance(value, (int, float)):
        return value
        
    return 0

def get_data_with_crumb(ticker):
    session = requests.Session()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }
    session.headers.update(headers)

    print(f"🚀 开始分析股票: {ticker}")
    print("-" * 40)

    # 1. 获取 Cookie
    try:
        r = session.get("https://finance.yahoo.com", timeout=10)
        if r.status_code != 200:
            print(f"❌ Cookie 获取失败: {r.status_code}")
            return
    except Exception as e:
        print(f"❌ Cookie 网络错误: {e}")
        return

    # 2. 获取 Crumb
    try:
        crumb = session.get("https://query1.finance.yahoo.com/v1/test/getcrumb", timeout=10).text.strip()
        if "Invalid" in crumb:
            print("❌ Crumb 获取失败 (Invalid)")
            return
    except Exception as e:
        print(f"❌ Crumb 请求异常: {e}")
        return

    # 3. 获取数据
    try:
        modules = "financialData,cashflowStatementHistory,summaryDetail,defaultKeyStatistics,quoteType"
        url = f"https://query2.finance.yahoo.com/v10/finance/quoteSummary/{ticker}?modules={modules}&crumb={crumb}"
        
        resp = session.get(url, timeout=10).json()
        if not resp.get("quoteSummary", {}).get("result"):
            print("❌ API 返回空数据")
            return

        data = resp["quoteSummary"]["result"][0]
        
        # === 解析上市年限 (使用 safe_extract 防御) ===
        quote_type = data.get("quoteType", {})
        key_stats = data.get("defaultKeyStatistics", {})
        
        # 优先查 quoteType，没有再查 key_stats
        first_trade_epoch = safe_extract(quote_type, "firstTradeDateEpochUtc")
        if not first_trade_epoch:
            first_trade_epoch = safe_extract(key_stats, "firstTradeDateEpochUtc")
        
        listing_info = "未知"
        is_veteran = False
        
        if first_trade_epoch:
            first_date = datetime.fromtimestamp(first_trade_epoch)
            date_str = first_date.strftime('%Y-%m-%d')
            years = (time.time() - first_trade_epoch) / (365.25 * 24 * 3600)
            listing_info = f"{years:.1f} 年 (IPO: {date_str})"
            is_veteran = years > 10

        # === 解析财务数据 (全部换用 safe_extract) ===
        fin = data.get("financialData", {})
        sum_detail = data.get("summaryDetail", {})
        
        # 市值
        market_cap = safe_extract(sum_detail, "marketCap")
        
        # 盈利
        gross_margin = safe_extract(fin, "grossMargins")
        roe = safe_extract(fin, "returnOnEquity")
        
        # 安全性
        total_cash = safe_extract(fin, "totalCash")
        total_debt = safe_extract(fin, "totalDebt")
        
        # 打印结果
        print(f"📊 【{ticker} 深度分析报告】")
        print("=" * 40)
        print(f"📅 上市年限: {listing_info}")
        print(f"🏢 市值: ${market_cap / 1e9:.2f}B")
        print(f"📈 毛利率: {gross_margin:.2%}")
        print(f"💎 ROE: {roe:.2%}")
        print(f"💰 现金/债务: ${total_cash/1e9:.2f}B / ${total_debt/1e9:.2f}B")
        print("=" * 40)

    except Exception as e:
        print(f"❌ 解析异常: {e}")
        # 打印详细错误栈以便排查
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    get_data_with_crumb("AAPL")