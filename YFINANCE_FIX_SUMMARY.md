# 🔧 Yahoo Finance 爬虫问题解决方案

## 问题现象

调用 `/api/v1/stocks/analyze` 时返回：
```
429 Too Many Requests - Yahoo Finance 把我们当成爬虫了
```

或者 `yfinance` 返回：
```
Expecting value: line 1 column 1 (char 0)
AAPL: No price data found, symbol may be delisted
```

## 根本原因

`yfinance` 库在某些网络环境下被 Yahoo Finance 限流或拦截。

## ✅ 解决方案

**创建了 `yahoo_direct.py` 直接调用 Yahoo Finance API**，绕过 `yfinance` 库。

### 核心改动

1. **新文件**: `backend/app/services/yahoo_direct.py`
   - 直接调用 Yahoo Finance REST API
   - 不依赖 `yfinance` 库
   - 包含请求限流、代理配置、完整请求头

2. **修改**: `backend/app/services/calculator.py`
   ```python
   # 从
   from app.services.yfinance_srv import YFinanceService
   self.yf_service = YFinanceService()
   
   # 改为
   from app.services.yahoo_direct import get_yahoo_service
   self.yf_service = get_yahoo_service()
   ```

### 测试结果

```bash
# 测试直接 API 调用
cd backend
source venv/bin/activate
python3 test_yahoo_direct.py
```

**输出**：
```
✅ 成功！获取 AAPL 信息
  公司: AAPL
  价格: $266.25

✅ 成功！获取10年历史数据
  获取了 2514 条数据

✅ 最大回撤: 38.73%
```

## 🚀 启动方式

**方式一：使用脚本（推荐）**
```bash
cd backend
./start-backend.sh
```

**方式二：手动启动**
```bash
cd backend
source venv/bin/activate
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🧪 测试接口

```bash
# 测试分析接口
curl -X POST http://localhost:8000/api/v1/stocks/analyze \
  -H "Content-Type: application/json" \
  -d '{"symbol":"TSLA"}'
```

## 📋 关键配置

### 1. 代理配置（必需）

`yahoo_direct.py` 中：
```python
self.session.proxies = {
    'http': 'http://127.0.0.1:7890',
    'https': 'http://127.0.0.1:7890',
}
```

### 2. 请求头（防爬虫）

```python
self.session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
})
```

### 3. 请求限流

```python
def _rate_limit(self):
    """确保请求间隔至少 1 秒"""
    # 避免被 Yahoo 限流
    time.sleep(1.0 + random.uniform(0.2, 0.5))
```

## 对比

| 方案 | yfinance | yahoo_direct |
|------|----------|--------------|
| 依赖库 | `yfinance` | `requests` |
| 成功率 | ❌ 被限流 | ✅ 稳定 |
| 速度 | 快（被限后慢） | 稳定 |
| 维护性 | 依赖第三方 | 自主可控 |

## 📝 注意事项

1. **代理必须开启**：确保 `http://127.0.0.1:7890` 可访问
2. **请求间隔**：内置限流机制，避免被封
3. **数据格式兼容**：`yahoo_direct` 返回的数据结构与 `yfinance` 一致

## 🔄 回退方案

如果需要回退到 `yfinance`，修改 `calculator.py`：
```python
from app.services.yfinance_srv import get_yfinance_service
self.yf_service = get_yfinance_service()
```

---

**状态**: ✅ 已解决  
**更新时间**: 2025-11-20

