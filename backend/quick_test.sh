#!/bin/bash
cd /Users/tomczhang/tllr/backend
source venv/bin/activate
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890

echo "====== 测试 calculator 直接调用 ======"
python3 <<EOF
from app.services.calculator import GreedyHunterCalculator

calc = GreedyHunterCalculator()
print("开始分析 AAPL...")
result = calc.analyze_stock("AAPL")

if result:
    print(f"✅ 成功！")
    print(f"  股票: {result.symbol}")
    print(f"  当前价: \${result.current_price}")
    print(f"  评分: {result.overall_score}")
    print(f"  安全价: \${result.safe_buy_price}")
else:
    print("❌ 分析失败")
EOF

