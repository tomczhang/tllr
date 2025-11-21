"""测试 yfinance 服务 - 防爬虫版本"""
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.yfinance_srv import get_yfinance_service

def test_service():
    print("===== 测试防爬虫优化后的 YFinanceService =====\n")
    
    service = get_yfinance_service()
    
    print("测试1: 获取 AAPL 股票信息（带重试机制）")
    print("-" * 50)
    info = service.get_stock_info("AAPL")
    if info:
        print(f"✅ 成功！")
        print(f"  公司: {info.get('company_name')}")
        print(f"  价格: ${info.get('current_price')}")
        print(f"  行业: {info.get('sector')}")
    else:
        print("❌ 失败")
    
    print("\n测试2: 获取 TSLA 股票信息")
    print("-" * 50)
    info2 = service.get_stock_info("TSLA")
    if info2:
        print(f"✅ 成功！")
        print(f"  公司: {info2.get('company_name')}")
        print(f"  价格: ${info2.get('current_price')}")
    else:
        print("❌ 失败")
    
    print("\n测试3: 获取10年历史数据")
    print("-" * 50)
    hist = service.get_historical_data("AAPL", period="10y")
    if hist is not None and not hist.empty:
        print(f"✅ 成功！获取了 {len(hist)} 条数据")
        print(f"  日期范围: {hist['Date'].min()} 到 {hist['Date'].max()}")
    else:
        print("❌ 失败")

if __name__ == "__main__":
    test_service()