# 📊 股票分析接口逻辑详解

## 接口地址
```
POST /api/v1/stocks/analyze
```

## 请求参数
```json
{
  "symbol": "AAPL"  // 股票代码（美股/A股/港股）
}
```

---

## 🔄 完整工作流程

### 1️⃣ **API 路由层** (`stocks.py`)

```python
@router.post("/analyze", response_model=AnalysisResult)
async def analyze_stock(request: StockSearchRequest):
    """接收请求，调用核心计算器"""
    symbol = request.symbol.upper()  # 统一转大写
    result = calculator.analyze_stock(symbol)  # 调用核心算法
    return result
```

**作用**：接收前端请求，参数验证，调用核心算法

---

### 2️⃣ **核心算法层** (`calculator.py`)

#### 完整分析流程（7个步骤）

```python
def analyze_stock(symbol: str) -> AnalysisResult:
    """贪婪猎人核心分析引擎"""
```

##### **步骤 1: 获取股票基础信息** 📋

```python
stock_info = yf_service.get_stock_info(symbol)
# 返回：公司名称、行业、市值、当前价格等
```

**数据来源**: Yahoo Finance API  
**获取字段**:
- `company_name` - 公司名称
- `sector` - 所属行业
- `market_cap` - 市值
- `current_price` - 当前价格 ⭐
- `currency` - 货币单位

---

##### **步骤 2: 获取10年历史数据** 📈

```python
hist_data = yf_service.get_historical_data(symbol, period="10y")
# 返回：每日的 开盘/收盘/最高/最低/成交量
```

**数据结构**:
```python
DataFrame:
  Date | Open | High | Low | Close | Volume
  ---- | ---- | ---- | --- | ----- | ------
  2014-01-01 | 100 | 105 | 98 | 102 | 1000000
  ...
```

**用途**: 
- 计算最大回撤
- 分析价格趋势
- 评估波动率

---

##### **步骤 3: 计算最大回撤 (MDD)** 📉

```python
mdd_result = yf_service.calculate_max_drawdown(hist_data)
# max_drawdown: 0.35 (表示35%的最大回撤)
# date: "2020-03-23" (发生日期)
```

**算法逻辑**:
```python
# 1. 计算每日的历史最高价
cummax = df['Close'].cummax()

# 2. 计算相对历史最高的回撤
drawdown = (Close - cummax) / cummax

# 3. 找到最大回撤点
max_drawdown = abs(drawdown.min())
```

**示例**:
- 如果股票从 $100 跌到 $65，最大回撤 = 35%
- 这个值越大，说明历史波动越剧烈

---

##### **步骤 4: 执行8分制评分** 🎯

```python
score_details = self._calculate_score(hist_data, current_price, max_drawdown)
overall_score = self._get_overall_score(score_details)
```

**评分维度**（3个维度）:

**① 价格位置评分** 📍
```python
# 计算当前价格在年度区间的位置
year_high = hist_data['High'].tail(252).max()  # 52周最高
year_low = hist_data['Low'].tail(252).min()    # 52周最低
price_position = (current_price - year_low) / (year_high - year_low)

# 评分逻辑
if price_position < 0.3:   # 底部区域
    score = "S" (10分)
elif price_position < 0.5: # 中低位
    score = "A" (8分)
else:                       # 相对高位
    score = "B" (6分)
```

**② 波动率评分** 📊
```python
# 基于最大回撤判断风险
if max_drawdown > 0.5:      # >50% 高波动
    score = "B" (6分)
elif max_drawdown > 0.3:    # 30-50% 中等波动
    score = "A" (8分)
else:                       # <30% 低波动
    score = "S" (10分)
```

**③ 趋势评分** 📈
```python
# 基于均线判断趋势
ma50 = hist_data['Close'].tail(50).mean()    # 50日均线
ma200 = hist_data['Close'].tail(200).mean()  # 200日均线

if ma50 > ma200 and current_price > ma50:  # 多头趋势
    score = "A" (8分)
elif current_price > ma200:                 # 长期向好
    score = "B" (7分)
else:                                       # 趋势偏弱
    score = "C" (5分)
```

**综合评分计算**:
```python
avg_points = sum(所有维度得分) / 维度数量

if avg_points >= 9:   综合评分 = "S"
elif avg_points >= 7.5: 综合评分 = "A"
elif avg_points >= 6:   综合评分 = "B"
else:                   综合评分 = "C"
```

---

##### **步骤 5: 计算安全买入价（双重折扣）** 💰

```python
safe_price_result = self._calculate_safe_buy_price(
    current_price, max_drawdown, overall_score
)
```

**核心公式**:
```python
安全买入价 = 当前价格 × (1 - MDD折扣) × (1 - 评级折扣)
```

**折扣设计**:

| 折扣类型 | 计算方式 | 示例 |
|---------|---------|------|
| **MDD折扣** | `max_drawdown × 0.5` | 若MDD=40%，则折扣=20% |
| **评级折扣** | 根据评级确定 | S级=5%, A级=10%, B级=15%, C级=20% |

**实际案例**:
```python
# 苹果股票 (AAPL)
current_price = $150
max_drawdown = 0.40 (40%)
overall_score = "A"

# 计算过程
mdd_discount = 0.40 × 0.5 = 0.20 (20%)
score_discount = 0.10 (A级固定10%)

safe_buy_price = 150 × (1 - 0.20) × (1 - 0.10)
               = 150 × 0.80 × 0.90
               = $108

total_discount = 28% (需要价格回调28%才到安全区)
```

**设计理念**:
- MDD折扣：保护你免受历史级别的暴跌
- 评级折扣：质量越差，要求的安全边际越大

---

##### **步骤 6: 生成金字塔网格策略** 🏔️

```python
pyramid_strategy = self._generate_pyramid_strategy(
    safe_buy_price, current_price
)
```

**6步金字塔建仓法**:

| 档位 | 价格梯度 | 资金分配 | 说明 |
|------|---------|---------|------|
| 第1步 | 安全价 × 100% | 5% | 试探性建仓 |
| 第2步 | 安全价 × 97% | 10% | 首次加仓 |
| 第3步 | 安全价 × 94% | 15% | 持续建仓 |
| 第4步 | 安全价 × 91% | 20% | 重点建仓 |
| 第5步 | 安全价 × 88% | 25% | 大力加仓 |
| 第6步 | 安全价 × 85% | 25% | 最后一击 |

**策略逻辑**:
```python
price_step = 0.03  # 每层递减3%
fund_allocation = [0.05, 0.10, 0.15, 0.20, 0.25, 0.25]

for i in range(1, 7):
    level_price = safe_buy_price × (1 - 0.03 × (i - 1))
    percentage = fund_allocation[i-1] × 100
```

**实际案例**:
```python
# 假设安全买入价 = $100
Level 1: $100 (5%)  ✅ 当前价格 $120，未达成
Level 2: $97  (10%) ✅ 等待
Level 3: $94  (15%) ✅ 等待
Level 4: $91  (20%) ✅ 等待
Level 5: $88  (25%) ✅ 等待
Level 6: $85  (25%) ✅ 等待
```

**优势**:
- 价格越低，买入越多（降低平均成本）
- 分散风险，避免一次性重仓
- 纪律化操作，克服贪婪与恐惧

---

##### **步骤 7: 生成投资建议** 💡

```python
recommendation = self._generate_recommendation(
    overall_score, current_price, safe_buy_price
)
risk_warning = self._generate_risk_warning(max_drawdown, overall_score)
```

**建议逻辑**:

```python
price_gap = (current_price - safe_buy_price) / safe_buy_price

# S级标的
if overall_score == "S":
    if price_gap < 0.05:  # 溢价<5%
        "🟢 强烈推荐：S级标的且价格已接近安全买入价，可以开始建仓"
    else:
        "🟡 S级标的，但当前价格偏高，建议等待回调"

# A级标的
elif overall_score == "A":
    if price_gap < 0.1:  # 溢价<10%
        "🟢 推荐：A级标的，价格合理，可以考虑建仓"
    else:
        "🟡 A级标的，但当前价格偏高，建议等待"

# B级标的
elif overall_score == "B":
    "🟡 一般：B级标的，建议观察，只在价格显著回调时考虑"

# C级标的
else:
    "🔴 不建议：C级标的，质量一般，建议寻找更好的标的"
```

**风险警示**:
```python
if max_drawdown > 0.6:
    "⚠️ 高风险：历史最大回撤达60%+，波动极大"
elif max_drawdown > 0.4:
    "⚠️ 中等风险：历史最大回撤40%+，波动较大"
elif overall_score == "C":
    "⚠️ 质量风险：综合评分较低，基本面可能存在问题"
else:
    "✅ 风险可控：历史波动相对温和"
```

---

## 📤 返回结果示例

```json
{
  "symbol": "AAPL",
  "stock_info": {
    "company_name": "Apple Inc.",
    "sector": "Technology",
    "market_cap": 2800000000000,
    "current_price": 150.25
  },
  "current_price": 150.25,
  "overall_score": "A",
  "score_details": [
    {
      "score": "A",
      "reason": "价格处于中低位",
      "points": 8
    },
    {
      "score": "A",
      "reason": "历史最大回撤 35.2%（中等波动）",
      "points": 8
    },
    {
      "score": "A",
      "reason": "短期趋势向上",
      "points": 8
    }
  ],
  "max_drawdown": 0.352,
  "max_drawdown_date": "2020-03-23",
  "safe_buy_price": 108.15,
  "discount_rate": 0.28,
  "pyramid_strategy": [
    {
      "level": 1,
      "price": 108.15,
      "percentage": 5,
      "description": "等待价格回调 -28.0%"
    },
    {
      "level": 2,
      "price": 104.91,
      "percentage": 10,
      "description": "等待价格回调 -30.2%"
    },
    // ... 共6步
  ],
  "recommendation": "🟢 推荐：A级标的，但当前价格偏高 38.9%，建议等待回调",
  "risk_warning": "⚠️ 中等风险：该标的历史最大回撤 35.2%，波动较大"
}
```

---

## 🔧 技术细节

### 数据来源
- **Yahoo Finance API** (通过 `yfinance` 库)
- 免费，但有延迟（通常15-20分钟）
- 支持全球主要市场

### 股票代码格式
- **美股**: `AAPL`, `TSLA`, `MSFT`
- **A股上海**: `600519.SS` (茅台)
- **A股深圳**: `000001.SZ` (平安银行)
- **港股**: `0700.HK` (腾讯)

### 性能优化
- 历史数据会在分析时实时获取
- 后续可以加入缓存机制（Redis）
- 单次分析耗时约 2-5 秒

---

## 🎯 核心设计思想

### 1. **双重折扣安全边际**
- 综合历史风险（MDD）和当前质量（评级）
- 确保买入价格有足够安全空间

### 2. **金字塔建仓纪律**
- 强制分批买入，避免追高
- 越跌越买，降低平均成本

### 3. **数据驱动决策**
- 不依赖主观判断
- 基于10年历史数据的客观分析

### 4. **风险分级管理**
- S/A/B/C 四级评分
- 不同质量要求不同安全边际

---

## 📚 相关文件

- **API 路由**: `backend/app/api/api_v1/endpoints/stocks.py`
- **核心算法**: `backend/app/services/calculator.py`
- **数据服务**: `backend/app/services/yfinance_srv.py`
- **数据模型**: `backend/app/schemas/stock.py`

---

**版本**: v1.0  
**作者**: 贪婪猎人团队  
**更新日期**: 2025-11-20

