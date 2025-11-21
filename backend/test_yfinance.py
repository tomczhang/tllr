import requests
import time

def get_data_with_crumb(ticker):
    # 1. 定义 Session (伪装浏览器)
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

    # --- 步骤 1: 获取 Cookie ---
    try:
        r = session.get("https://finance.yahoo.com", timeout=10)
        if r.status_code != 200:
            print(f"❌ Cookie 获取失败: {r.status_code}")
            return
    except Exception as e:
        print(f"❌ 网络错误: {e}")
        return

    # --- 步骤 2: 获取 Crumb ---
    try:
        crumb = session.get("https://query1.finance.yahoo.com/v1/test/getcrumb", timeout=10).text.strip()
        if "Invalid" in crumb:
            print("❌ Crumb 获取失败")
            return
    except Exception as e:
        print(f"❌ Crumb 请求异常: {e}")
        return

    # --- 步骤 3: 获取核心财务数据 ---
    try:
        # 请求三个关键模块
        modules = "financialData,cashflowStatementHistory,summaryDetail"
        url = f"https://query2.finance.yahoo.com/v10/finance/quoteSummary/{ticker}?modules={modules}&crumb={crumb}"
        
        resp = session.get(url, timeout=10).json()
        if not resp["quoteSummary"]["result"]:
            print("❌ 无数据")
            return
            
        data = resp["quoteSummary"]["result"][0]
        
        # ================= 数据提取与分析 =================
        
        # 1. 盈利能力 (Profitability)
        # ------------------------------------------------
        fin_data = data.get("financialData", {})
        
        # 毛利率 (Gross Margins)
        gross_margin_raw = fin_data.get("grossMargins", {}).get("raw", 0)
        gross_margin_fmt = fin_data.get("grossMargins", {}).get("fmt", "N/A")
        
        # ROE (Return on Equity)
        roe_raw = fin_data.get("returnOnEquity", {}).get("raw", 0)
        roe_fmt = fin_data.get("returnOnEquity", {}).get("fmt", "N/A")
        
        # 判定逻辑
        is_high_margin = gross_margin_raw > 0.40  # > 40%
        is_efficient = roe_raw > 0.15             # > 15%

        # 2. 安全性 (Safety) - 现金 vs 债务
        # ------------------------------------------------
        total_cash = fin_data.get("totalCash", {}).get("raw", 0)
        total_cash_fmt = fin_data.get("totalCash", {}).get("fmt", "N/A")
        
        total_debt = fin_data.get("totalDebt", {}).get("raw", 0)
        total_debt_fmt = fin_data.get("totalDebt", {}).get("fmt", "N/A")
        
        # 判定逻辑
        is_cash_safe = total_cash > total_debt

        # 3. 股东回报 (Returns) - 分红与回购
        # ------------------------------------------------
        sum_detail = data.get("summaryDetail", {})
        cash_flow = data.get("cashflowStatementHistory", {}).get("cashflowStatements", [])
        
        # 分红 (Dividend)
        div_rate = sum_detail.get("dividendRate", {}).get("raw", 0)
        div_yield = sum_detail.get("dividendYield", {}).get("fmt", "0.00%")
        
        # 回购 (Buyback) - 从最近一年的现金流量表看
        # repurchaseOfStock 通常是负数，表示现金流出
        last_year_buyback_raw = 0
        last_year_div_paid_raw = 0
        
        if cash_flow:
            latest = cash_flow[0]
            # 回购金额
            raw_buyback = latest.get("repurchaseOfStock", {}).get("raw", 0)
            last_year_buyback_raw = abs(raw_buyback)
            # 分红支付金额
            raw_div_paid = latest.get("dividendsPaid", {}).get("raw", 0)
            last_year_div_paid_raw = abs(raw_div_paid)

        has_shareholder_return = (div_rate > 0) or (last_year_buyback_raw > 0)

        # ================= 打印分析报告 =================
        
        print(f"📊 【{ticker} 深度财务体检报告】")
        print("=" * 40)
        
        print("\n1️⃣  盈利能力 (Profitability)")
        print(f"   • 毛利率: {gross_margin_fmt}\t " + ("✅ 优秀 (>40%)" if is_high_margin else "⚠️ 一般"))
        print(f"   • ROE:    {roe_fmt}\t " + ("✅ 优秀 (>15%)" if is_efficient else "⚠️ 一般"))
        
        print("\n2️⃣  财务安全 (Safety)")
        print(f"   • 总现金: {total_cash_fmt}")
        print(f"   • 总债务: {total_debt_fmt}")
        print(f"   • 结论:   " + ("✅ 现金充裕 (现金 > 债务)" if is_cash_safe else "⚠️ 负债经营 (需关注现金流)"))
        
        print("\n3️⃣  股东回报 (Returns)")
        if has_shareholder_return:
            print("   ✅ 检测到持续回报行为")
            if div_rate > 0:
                print(f"   • 分红: 派息率 {div_yield}")
            else:
                print(f"   • 分红: 无")
            
            if last_year_buyback_raw > 0:
                # 格式化回购金额 (Billion/Million)
                bb_amount = f"{last_year_buyback_raw / 1e9:.2f}B" if last_year_buyback_raw > 1e9 else f"{last_year_buyback_raw / 1e6:.2f}M"
                print(f"   • 回购: 去年回购约 ${bb_amount}")
        else:
            print("   ❌ 铁公鸡 (无分红且无回购)")

        print("\n" + "=" * 40)

    except Exception as e:
        print(f"❌ 解析异常: {e}")

if __name__ == "__main__":
    # 记得带上 export 代理命令运行
    # 试试看 AAPL (苹果), TSLA (特斯拉), KO (可口可乐)
    get_data_with_crumb("AAPL")