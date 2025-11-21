"""验证修正后的财务数据"""
import sys
sys.path.append('.')

from app.services.yahoo_financial import get_financial_service

print("=" * 60)
print("验证 AAPL 财务数据（修正版）")
print("=" * 60)

service = get_financial_service()
data = service.get_financial_data("AAPL")

if data:
    print("\n✅ 财务数据获取成功\n")
    
    # 盈利能力
    print("1️⃣  盈利能力 (Profitability)")
    gross_margin = data.get('gross_margins')
    roe = data.get('return_on_equity')
    print(f"   • 毛利率: {gross_margin*100:.2f}%" if gross_margin else "   • 毛利率: 无数据")
    print(f"   • ROE:    {roe*100:.2f}%" if roe else "   • ROE: 无数据")
    
    # 财务安全
    print("\n2️⃣  财务安全 (Safety)")
    cash = data.get('total_cash')
    debt = data.get('total_debt')
    print(f"   • 总现金: ${cash/1e9:.1f}B" if cash else "   • 总现金: 无数据")
    print(f"   • 总债务: ${debt/1e9:.2f}B" if debt else "   • 总债务: 无数据")
    
    # 股东回报
    print("\n3️⃣  股东回报 (Returns)")
    div_yield = data.get('dividend_rate')  # 现在是 dividendYield
    buyback = data.get('buyback_amount')
    print(f"   • 分红收益率: {div_yield*100:.2f}%" if div_yield else "   • 分红收益率: 无")
    print(f"   • 回购金额: ${buyback/1e9:.2f}B" if buyback else "   • 回购金额: 无")
    
    print("\n" + "=" * 60)
    print("对比用户数据：")
    print("   毛利率: 46.90% ✅" if gross_margin and abs(gross_margin - 0.469) < 0.001 else "   毛利率: ❌")
    print("   ROE: 171.42% ✅" if roe and abs(roe - 1.7142) < 0.01 else "   ROE: ❌")
    print("   分红收益率: ~0.39% ✅" if div_yield and abs(div_yield - 0.0039) < 0.001 else f"   分红收益率: ❌ (实际: {div_yield*100:.2f}%)")
    print("=" * 60)
else:
    print("❌ 获取失败")

