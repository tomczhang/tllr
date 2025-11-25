
# 持仓健康度分析器 (Portfolio Health Analyzer)

## 📊 功能概述

基于"核心-卫星"资产配置模型，计算持仓的合规评分（0-100分），帮助投资者评估当前资产配置是否符合目标模型。

## 🎯 目标配置模型

### 全局目标权重（总和 100%）

| 资产类别 | 目标权重 | 说明 |
|---------|---------|------|
| **SGOV (防御性资产)** | 30% | 短期国债，21%来自保守仓位 + 9%来自激进仓位 |
| **QQQ (纳指100)** | 21% | 科技龙头，保守仓位 |
| **VOO (标普500)** | 14% | 大盘指数，保守仓位 |
| **BRK.B (伯克希尔)** | 14% | 价值投资，保守仓位 |
| **激进资产** | 21% | 成长股、中概股等 |

### 仓位分配

- **保守仓位 (70%)**:
  - SGOV: 30% (21%全局)
  - QQQ: 30% (21%全局)
  - VOO: 20% (14%全局)
  - BRK.B: 20% (14%全局)

- **激进仓位 (30%)**:
  - SGOV: 30% (9%全局)
  - 激进股票: 70% (21%全局)

## 🧮 评分算法："桶填充"逻辑

### 核心规则

**超配不加分**：每个资产类别的得分上限为其目标权重。

### 计算公式

对于每个资产类别 $i$:

1. **目标金额** = 总资产 × 目标权重
2. **实际金额** = 用户持仓金额
3. **得分** = min(实际金额, 目标金额) / 总资产 × 100

### 示例

假设 QQQ 目标权重为 21%（最高 21 分）：

- **情况A**: 持有 0 → 得分 0
- **情况B**: 持有目标金额 → 得分 21
- **情况C**: 持有 2 倍目标金额 → 得分 21（封顶）

**最终评分** = 所有资产类别得分之和（最高 100 分）

## 📈 评级体系

| 评级 | 分数范围 | 说明 | 颜色 |
|------|---------|------|------|
| **S** | 95-100 | 完美配置，高度符合目标模型 | 紫色 |
| **A** | 85-94 | 优秀配置，基本符合目标模型 | 绿色 |
| **B** | 70-84 | 良好配置，部分资产需调整 | 蓝色 |
| **C** | 50-69 | 一般配置，建议尽快调整 | 橙色 |
| **D** | 0-49 | 配置失衡，强烈建议重新平衡 | 红色 |

## 🔍 资产分类规则

### 保守资产
- `SGOV`: 短期国债
- `QQQ`: 纳指100
- `VOO`, `SPY`, `IVV`: 标普500
- `BRK.B`, `BRK-B`: 伯克希尔

### 激进资产（自动识别）
- **已知激进资产**: POPMART, GEELY, BABA, TCEHY, JD, BIDU, NIO, XPEV, LI, PDD, BILI, META, NVDA, TSLA, COIN, SQ, SHOP 等
- **未知股票**: 默认归类为激进资产

## 🚀 API 接口

### 1. 获取目标配置

```bash
GET /api/v1/portfolio/health/target
```

**响应示例**:
```json
{
  "target_allocations": [
    {
      "category": "SGOV",
      "category_display": "防御性资产 (SGOV)",
      "global_weight": 30.0,
      "description": "防御性资产（短期国债）",
      "segment": "Conservative+Aggressive"
    },
    ...
  ],
  "conservative_weight": 70.0,
  "aggressive_weight": 30.0,
  "description": "基于核心-卫星配置模型，70%保守仓位 + 30%激进仓位"
}
```

### 2. 分析持仓健康度

```bash
POST /api/v1/portfolio/health/analyze
Content-Type: application/json

{
  "holdings": [
    {"ticker": "SGOV", "market_value": 30000},
    {"ticker": "QQQ", "market_value": 21000},
    {"ticker": "VOO", "market_value": 14000},
    {"ticker": "BRK.B", "market_value": 14000},
    {"ticker": "POPMART", "market_value": 21000}
  ],
  "cash": 0
}
```

**响应示例**:
```json
{
  "total_value": 100000.0,
  "compliance_score": 100.0,
  "grade": "S",
  "grade_color": "#a855f7",
  "grade_description": "完美配置，资产配置高度符合目标模型",
  "asset_scores": [
    {
      "category": "SGOV",
      "category_display": "防御性资产 (SGOV)",
      "target_weight": 30.0,
      "target_value": 30000.0,
      "actual_value": 30000.0,
      "actual_weight": 30.0,
      "score": 30.0,
      "status": "✅ 达标",
      "status_color": "emerald",
      "gap_value": 0.0,
      "gap_weight": 0.0
    },
    ...
  ],
  "conservative_actual": 70.0,
  "conservative_target": 70.0,
  "aggressive_actual": 30.0,
  "aggressive_target": 30.0,
  "recommendations": [
    "✅ 当前配置接近目标，保持现状即可"
  ],
  "chart_data": {
    "target": [...],
    "actual": [...],
    "scores": [...]
  }
}
```

### 3. 分类股票代码

```bash
GET /api/v1/portfolio/health/classify/{ticker}
```

**响应示例**:
```json
{
  "ticker": "POPMART",
  "category": "AGGRESSIVE",
  "category_display": "激进资产",
  "is_conservative": false
}
```

## 📝 测试案例

### 案例1：完美配置

**输入**:
- SGOV: $30,000
- QQQ: $21,000
- VOO: $14,000
- BRK.B: $14,000
- POPMART: $21,000

**结果**:
- 总资产: $100,000
- 合规评分: **100.0**
- 评级: **S**
- 保守仓位: 70.0% ✅
- 激进仓位: 30.0% ✅

### 案例2：不平衡配置

**输入**:
- SGOV: $10,000
- 现金: $5,000
- QQQ: $0
- VOO: $14,000
- BRK.B: $14,000
- POPMART: $10,000
- GEELY: $11,000

**结果**:
- 总资产: $64,000
- 合规评分: **72.4**
- 评级: **B**
- 调仓建议:
  - 建议增持 QQQ：当前 0.0%，目标 21.0%，缺口 $13,440
  - 建议减持 激进资产：当前 32.8%，目标 21.0%，超配 $7,560
  - 建议减持 VOO：当前 21.9%，目标 14.0%，超配 $5,040

## 🛠️ 技术实现

### 后端文件结构

```
backend/
├── app/
│   ├── services/
│   │   └── portfolio_analyzer.py      # 核心分析逻辑
│   ├── schemas/
│   │   └── portfolio.py                # Pydantic Schema
│   └── api/
│       └── api_v1/
│           └── endpoints/
│               └── portfolio.py        # API 路由
```

### 核心类

#### `PortfolioHealthAnalyzer`

**主要方法**:
- `analyze(holdings, cash)`: 分析持仓健康度
- `classify_ticker(ticker)`: 分类股票代码
- `_calculate_grade(score)`: 计算评级
- `_generate_recommendations(asset_scores, total_value)`: 生成调仓建议

**核心算法**:
```python
# 桶填充算法
filled_value = min(actual_value, target_value)
score = (filled_value / total_value) * 100.0

# 计算缺口
gap_value = target_value - actual_value
gap_weight = target_weight - actual_weight

# 判断状态
if abs(gap_weight) < 1.0:
    status = "✅ 达标"
elif gap_weight > 0:
    status = "⚠️ 不足"
else:
    status = "📈 超配"
```

## 🎨 前端集成建议

### 1. 持仓目标展示

显示目标配置的饼图或条形图，标注各资产类别的目标权重。

### 2. 健康度仪表盘

- **评分圆环**: 显示合规评分（0-100），中心显示评级（S/A/B/C/D）
- **仓位对比**: 保守 vs 激进仓位的实际值与目标值对比
- **资产评分卡**: 每个资产类别的达标状态、得分、缺口

### 3. 调仓建议

列表形式展示前3个最大缺口的调仓建议，包括：
- 增持/减持建议
- 当前权重 vs 目标权重
- 缺口金额

### 4. 可视化图表

使用 `chart_data` 字段生成：
- **目标 vs 实际对比图**: 堆叠条形图
- **评分雷达图**: 展示各资产类别的得分
- **缺口分析图**: 展示各资产的超配/不足情况

## ✅ 功能特性

1. **自动分类**: 智能识别股票代码，自动归类到保守/激进资产
2. **桶填充算法**: 超配不加分，鼓励平衡配置
3. **动态建议**: 根据缺口大小自动生成调仓建议
4. **评级体系**: S/A/B/C/D 五级评级，直观反映配置质量
5. **灵活扩展**: 支持添加新的激进资产映射

## 📚 使用场景

1. **定期检查**: 每月/每季度检查持仓是否偏离目标
2. **再平衡**: 根据建议进行资产再平衡
3. **新资金配置**: 决定新资金应该买入哪些资产
4. **风险控制**: 确保激进仓位不超过30%

## 🔮 未来扩展

1. **自定义目标**: 允许用户自定义目标配置权重
2. **历史追踪**: 记录历史评分，展示趋势变化
3. **自动再平衡**: 根据当前价格自动生成交易计划
4. **税收优化**: 考虑税收影响的再平衡建议
5. **多币种支持**: 支持非美元资产的汇率转换

