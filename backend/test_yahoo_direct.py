"""测试直接调用 Yahoo Finance API 的服务"""
import sys
sys.path.append('.')

from app.services.yahoo_direct import get_yahoo_service

print("===== 测试 YahooDirectAPI (绕过 yfinance) =====\n")

service = get_yahoo_service()

print("测试1: 获取 AAPL 股票信息")
print("-" * 50)
info = service.get_stock_info("AAPL")
if info:
    print(f"✅ 成功！")
    print(f"  公司: {info['company_name']}")
    print(f"  价格: ${info['current_price']}")
    print(f"  行业: {info.get('sector', 'N/A')}")
else:
    print("❌ 失败")

print("\n测试2: 获取 TSLA 股票信息")
print("-" * 50)
info2 = service.get_stock_info("TSLA")
if info2:
    print(f"✅ 成功！")
    print(f"  公司: {info2['company_name']}")
    print(f"  价格: ${info2['current_price']}")
else:
    print("❌ 失败")

print("\n测试3: 获取10年历史数据")
print("-" * 50)
hist = service.get_historical_data("AAPL", period="10y")
if hist is not None and not hist.empty:
    print(f"✅ 成功！获取了 {len(hist)} 条数据")
    print(f"  日期范围: {hist['Date'].min()} 到 {hist['Date'].max()}")
    print(f"  最新收盘价: ${hist['Close'].iloc[-1]:.2f}")
else:
    print("❌ 失败")

print("\n测试4: 计算最大回撤")
print("-" * 50)
if hist is not None:
    mdd = service.calculate_max_drawdown(hist)
    print(f"✅ 最大回撤: {mdd['max_drawdown_percent']:.2f}%")
    print(f"  发生日期: {mdd['date']}")

