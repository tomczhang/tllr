这份文档是为您准备的\*\*“AI Coding 提示词工程文档”\*\*。

您可以直接将此 Markdown 内容复制给 Cursor、GitHub Copilot 或 ChatGPT，让它为您生成 Python 脚本或 Web 应用代码。

-----

# 贪婪猎人 (Greedy Hunter) 建仓系统 - 技术规格说明书 (v2.0)

## 1\. 系统概述

本系统旨在构建一个**左侧价值投资辅助工具**。核心逻辑是通过“反向DCF估值”判断价格安全度，结合“VIX恐慌指数”与“波动率分档”动态生成金字塔建仓计划，并强制执行资金管理风控。

-----

## 2\. 数据需求 (Data Requirements)

系统需调用外部 API (如 Yahoo Finance `yfinance`) 获取以下数据：

  * **基础数据**: 当前价格 (`price`), 市值 (`market_cap`), 过去12个月EPS (`eps_ttm`).
  * **历史数据**: 过去10年历史股价 (用于计算 `max_drawdown`), 过去5-10年营收增长率 (`revenue_growth`).
  * **宏观数据**: 标普500波动率指数 (`VIX`).

-----

## 3\. 核心模块逻辑

### 模块 A: 估值测谎仪 (Reverse DCF Check)

**目标**: 不依赖用户主观输入，计算当前股价隐含的未来增长率，并进行风险判定。

#### 算法逻辑 (Binary Search):

1.  **公式**: $Price = \sum \frac{EPS \times (1+g)^n}{(1+r)^n} + \frac{TerminalValue}{(1+r)^{10}}$
2.  **常量设定**:
      * 折现率 (`r`): **10%** (0.10)
      * 终值市盈率 (`Terminal_PE`): **15**
      * 预测年限: **10年**
3.  **计算目标**: 解出变量 `g` (隐含增长率)。
4.  **风险判定规则**:
      * 获取公司历史5年/10年平均营收增速 (`hist_g_avg`)。
      * `if implied_g > hist_g_avg`: **高估** (Overvalued) -\> 警告用户，建议观望。
      * `if implied_g < hist_g_avg * 0.5`: **极度低估** (Undervalued) -\> 贪婪时刻。
      * `else`: **合理** (Fair)。

-----

### 模块 B: 动态安全边际 (Dynamic Safety Margin)

**目标**: 计算首仓建议买入价格 (`target_entry_price`)。

#### 计算公式:

$$TargetPrice = IntrinsicValue \times Q_{coeff} \times M_{coeff} \times VIX_{factor}$$

#### 1\. 质量系数 ($Q_{coeff}$) - 手动或根据 ROE/Moat 判定

  * **S级 (王者)**: `0.95` (茅台, MSFT)
  * **A级 (卓越)**: `0.85` (Meta, Google)
  * **B级 (普通)**: `0.60` (吉利, 小米 - *需深度打折*)
  * **C级 (垃圾)**: `0.0` (禁止交易)

#### 2\. 市场系数 ($M_{coeff}$) - 基于所属市场

  * **US (美股)**: `1.0`
  * **CN (A股)**: `0.9`
  * **HK (港股)**: `0.8` (*流动性折价*)

#### 3\. 恐慌调节因子 ($VIX_{factor}$) - 基于 VIX 指数

  * `VIX < 15`: **0.9** (市场贪婪，强制压价)
  * `15 <= VIX <= 30`: **1.0** (正常)
  * `VIX > 30`: **1.1** (市场恐慌，允许溢价买入防踏空)
  * `VIX > 40`: **1.2** (极端恐慌，抢筹模式)

-----

### 模块 C: 金字塔网格生成器 (Pyramid Grid Engine)

**目标**: 根据标的波动特性，自动匹配 6 档建仓间隔。

#### 1\. 档位自动分类算法

  * **输入**: 市值 (`cap`), 近10年最大回撤 (`max_dd`).
  * **逻辑**:
    ```python
    def get_tier(ticker, cap, max_dd):
        if ticker in ["SPY", "QQQ", "BRK-B", "BRK-A"]:
            return "ROBUST"  # 稳健档
        if cap < 2000_000_000_000: # < 2000亿
            return "DEVIL"   # 魔鬼档 (一票否决)
        if max_dd > 0.50:      # 回撤 > 50%
            return "AGGRESSIVE" # 激进档
        return "STANDARD"    # 标准档
    ```

#### 2\. 档位参数配置

| 档位 | 加仓间隔 (Gap) | 首仓回撤阈值 (Pullback) |
| :--- | :--- | :--- |
| **ROBUST (稳健)** | **4.0%** |距前高跌 **5%** |
| **STANDARD (标准)** | **7.5%** |距前高跌 **15%** |
| **AGGRESSIVE (激进)** | **10.0%** |距前高跌 **20%** |
| **DEVIL (魔鬼)** | **15.0%** |距前高跌 **30%** |

*注意：若 `VIX > 30`，上述“首仓回撤阈值”可自动减半（例如标准档变为跌 7.5% 即可启动）。*

-----

### 模块 D: 资金管理与风控 (Portfolio Guardrails)

**目标**: 防止满仓死扛，保留战略火种。

#### 1\. 30% 熔断锁

  * **逻辑**:
    ```python
    total_assets = cash + market_value_of_stocks
    safe_reserve_ratio = cash / total_assets

    if safe_reserve_ratio < 0.30:
        status = "LOCKED"
        msg = "🛑 战略资金不足30%！仅允许卖出，禁止买入任何新标的。"
    else:
        status = "ACTIVE"
    ```

#### 2\. 解锁“救命钱”的唯一条件 (Override Rules)

即使 `status == LOCKED`，若满足以下任一条件，允许动用储备金：

1.  **个股极端值**: 目标标的股价跌破 **第 6 档** 价格。
2.  **系统性崩盘**: `VIX >= 40`。

-----

## 4\. UI 展示建议 (Frontend Specs)

### 区域 1: 仪表盘

  * 显示当前 **VIX 指数** (如: 18.5 - 🔴贪婪 / 🟢恐慌)。
  * 显示 **安全垫比例** (如: 10% ⚠️ 警告 / 30% ✅ 安全)。

### 区域 2: 估值测谎结果

  * 显示: `当前股价 $580` -\> `隐含增长率 18.5%`。
  * 对比: `历史平均 20%` -\> `评级: 合理`。

### 区域 3: 网格交易表 (Grid Table)

  * **列定义**:
    1.  **档位**: (1-6)
    2.  **挂单价格**: (计算得出)
    3.  **跌幅**: (-0%, -7.5%, -15%...)
    4.  **累计回撤**: (当前价距前高跌幅)
    5.  **战术指标**: "📉 回撤 -34% | 🎯 反弹 12% 回本"
    6.  **状态**: (未成交 / 已成交 / **建议挂单**)

-----

## 5\. 伪代码示例 (Python)

```python
class GreedyHunter:
    def analyze(self, ticker, manual_quality_score, market_type):
        # 1. 获取数据
        data = self.fetch_data(ticker)
        
        # 2. 估值测谎
        implied_g = self.calc_reverse_dcf(data.price, data.eps)
        valuation_status = self.judge_valuation(implied_g, data.hist_growth)
        
        # 3. 确定档位 (Tier)
        tier = self.determine_tier(ticker, data.cap, data.max_dd)
        gap = self.TIER_CONFIG[tier]['gap']
        
        # 4. 计算安全买入价 (基于折扣)
        q_coeff = self.get_quality_coeff(manual_quality_score) # e.g. S=0.95
        m_coeff = self.get_market_coeff(market_type)           # e.g. HK=0.8
        vix_factor = self.get_vix_factor(data.vix)
        
        target_entry = data.intrinsic_value * q_coeff * m_coeff * vix_factor
        
        # 5. 生成网格
        grid = []
        price = target_entry
        for i in range(6):
            grid.append({
                "level": i + 1,
                "price": price,
                "drawdown_from_top": (data.recent_high - price) / data.recent_high,
                "action": "BUY"
            })
            price = price * (1 - gap) # 下一档
            
        return grid
```