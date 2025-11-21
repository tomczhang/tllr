"""测试 Yahoo Financial 服务"""
import sys
sys.path.append('.')

from app.services.yahoo_financial import get_financial_service

print("===== 测试 Yahoo Financial Service =====\n")

service = get_financial_service()

# 测试 AAPL
print("测试: AAPL")
print("-" * 60)
data = service.get_financial_data("AAPL")

if data:
    print("✅ 成功获取数据！\n")
    print(f"市值: ${data['market_cap']:,.0f}" if data['market_cap'] else "市值: 无数据")
    print(f"总现金: ${data['total_cash']:,.0f}" if data['total_cash'] else "总现金: 无数据")
    print(f"总负债: ${data['total_debt']:,.0f}" if data['total_debt'] else "总负债: 无数据")
    print(f"净现金: ${(data['total_cash'] or 0) - (data['total_debt'] or 0):,.0f}")
    print(f"毛利率: {data['gross_margins']*100:.1f}%" if data['gross_margins'] else "毛利率: 无数据")
    print(f"ROE: {data['return_on_equity']*100:.1f}%" if data['return_on_equity'] else "ROE: 无数据")
    print(f"分红率: {data['dividend_rate']*100:.2f}%" if data['dividend_rate'] else "分红率: 0%")
    print(f"回购金额: ${data['buyback_amount']:,.0f}" if data['buyback_amount'] else "回购金额: $0")
    print(f"上市年限: {data['listing_years']}年" if data['listing_years'] else "上市年限: 无数据")
    
    # 验证数据完整性
    is_complete, missing = service.validate_required_data("AAPL", data)
    print(f"\n数据完整性: {'✅ 完整' if is_complete else f'❌ 缺失: {missing}'}")
else:
    print("❌ 获取失败")

