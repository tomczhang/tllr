"""直接测试 Yahoo Finance API（绕过 yfinance 库）"""
import requests

session = requests.Session()
session.proxies = {
    'http': 'http://127.0.0.1:7890',
    'https': 'http://127.0.0.1:7890',
}
session.headers.update({
    'User-Agent': 'Mozilla/5.0'
})

print("测试直接调用 Yahoo Finance API...")
url = "https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d&range=5d"

try:
    response = session.get(url, timeout=10)
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        if data.get('chart') and data['chart'].get('result'):
            result = data['chart']['result'][0]
            meta = result['meta']
            print(f"✅ 成功！")
            print(f"  股票: {meta['symbol']}")
            print(f"  货币: {meta['currency']}")
            print(f"  当前价: ${meta.get('regularMarketPrice', 'N/A')}")
        else:
            print("❌ 返回数据格式错误")
    else:
        print(f"❌ HTTP 错误: {response.text[:200]}")
except Exception as e:
    print(f"❌ 异常: {e}")

