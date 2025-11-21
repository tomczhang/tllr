"""
测试更新后的 YFinanceService
验证自动握手和数据获取功能
"""
import sys
sys.path.append('.')

from app.services.yfinance_srv import get_yfinance_service

print("=" * 60)
print("测试 YFinanceService - 自动握手版本")
print("=" * 60)

service = get_yfinance_service()

# 测试1: 获取股票基础信息
print("\n📊 测试1: 获取 AAPL 基础信息")
print("-" * 60)
info = service.get_stock_info("AAPL")
if info:
    print("✅ 获取成功！")
    print(f"公司名称: {info['company_name']}")
    print(f"行业: {info.get('sector', 'N/A')}")
    print(f"市值: ${info.get('market_cap', 0):,.0f}" if info.get('market_cap') else "市值: N/A")
    print(f"当前价格: ${info['current_price']:.2f}")
else:
    print("❌ 获取失败")

# 测试2: 获取历史数据
print("\n📈 测试2: 获取 AAPL 10年历史数据")
print("-" * 60)
hist = service.get_historical_data("AAPL", period="10y")
if hist is not None and not hist.empty:
    print(f"✅ 获取成功！共 {len(hist)} 条数据")
    print(f"最早日期: {hist['Date'].iloc[0]}")
    print(f"最新日期: {hist['Date'].iloc[-1]}")
    print(f"最新收盘价: ${hist['Close'].iloc[-1]:.2f}")
    
    # 测试3: 计算最大回撤
    print("\n📉 测试3: 计算最大回撤")
    print("-" * 60)
    mdd = service.calculate_max_drawdown(hist)
    print(f"✅ 最大回撤: {mdd['max_drawdown']*100:.2f}%")
    print(f"发生日期: {mdd['date']}")
else:
    print("❌ 获取失败")

# 测试4: 获取当前价格
print("\n💰 测试4: 获取当前价格")
print("-" * 60)
price = service.get_current_price("AAPL")
if price:
    print(f"✅ 当前价格: ${price:.2f}")
else:
    print("❌ 获取失败")

# 测试5: 获取摘要
print("\n📋 测试5: 获取数据摘要")
print("-" * 60)
summary = service.get_stock_data_summary("AAPL")
if summary:
    print("✅ 获取成功！")
    print(f"当前价格: ${summary['current_price']:.2f}")
    print(f"年度最高: ${summary['year_high']:.2f}")
    print(f"年度最低: ${summary['year_low']:.2f}")
    print(f"距离最高: {summary['from_high_percent']:.1f}%")
    print(f"距离最低: {summary['from_low_percent']:.1f}%")
else:
    print("❌ 获取失败")

print("\n" + "=" * 60)
print("测试完成！")
print("=" * 60)

