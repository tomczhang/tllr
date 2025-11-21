/**
 * 建仓计算器 V2 - 8分制质量评分系统
 */

import { useState } from 'react'
import { Search, TrendingUp, AlertTriangle, Target, BarChart3, HelpCircle } from 'lucide-react'
import axios from 'axios'

// 定义类型
interface UserConfirmations {
  gross_margin?: boolean | null
  roe?: boolean | null
  financial_safety?: boolean | null
  shareholder_returns?: boolean | null
  industry_dominance: boolean
  moat: boolean
}

interface AnalysisRequestV2 {
  symbol: string
  intrinsic_value: number
  user_confirmations: UserConfirmations
}

export default function CalculatorPageV2() {
  const [symbol, setSymbol] = useState('')
  const [intrinsicValue, setIntrinsicValue] = useState<number>(100)
  const [confirmations, setConfirmations] = useState<UserConfirmations>({
    gross_margin: null,  // 自动判断
    roe: null,           // 自动判断
    financial_safety: null,  // 自动判断
    shareholder_returns: null,  // 自动判断
    industry_dominance: false,  // 必填
    moat: false  // 必填
  })
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!symbol || intrinsicValue <= 0) {
      setError('请输入股票代码和内在估值')
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      const response = await axios.post('/api/v1/stocks/analyze/v2', {
        symbol: symbol.toUpperCase(),
        intrinsic_value: intrinsicValue,
        user_confirmations: confirmations
      })
      setResult(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || '分析失败，请稍后重试')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold text-white">建仓计算器</h2>
          <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
            8分制
          </span>
        </div>
      </div>

      {/* 输入表单 - 分组布局 */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* 左侧：基本信息 */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-300 mb-2">股票代码</div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">股票代码</label>
              <div className="relative">
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="如: 1810.HK, AAPL"
                  className="w-full pl-8 pr-3 py-2 text-sm bg-slate-900 border border-slate-600 rounded text-white placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-500"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">内在价值估算</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-mono">$</span>
                <input
                  type="number"
                  value={intrinsicValue}
                  onChange={(e) => setIntrinsicValue(Number(e.target.value))}
                  placeholder="50"
                  className="w-full pl-7 pr-3 py-2 text-sm bg-slate-900 border border-slate-600 rounded text-white placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* 右侧：品质检查 */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-300 mb-2">质量检查（用户确认）</div>
            <label className="flex items-center space-x-2 p-3 bg-slate-900/50 rounded border border-slate-700 cursor-pointer hover:border-emerald-500/50 transition-colors">
              <input
                type="checkbox"
                checked={confirmations.industry_dominance}
                onChange={(e) => setConfirmations({...confirmations, industry_dominance: e.target.checked})}
                className="w-4 h-4 rounded border-slate-600 text-emerald-600 focus:ring-1 focus:ring-emerald-500"
              />
              <div className="flex-1">
                <div className="text-sm text-white font-medium">行业地位</div>
                <div className="text-xs text-slate-400">龙头或双寡头</div>
              </div>
            </label>
            <label className="flex items-center space-x-2 p-3 bg-slate-900/50 rounded border border-slate-700 cursor-pointer hover:border-emerald-500/50 transition-colors">
              <input
                type="checkbox"
                checked={confirmations.moat}
                onChange={(e) => setConfirmations({...confirmations, moat: e.target.checked})}
                className="w-4 h-4 rounded border-slate-600 text-emerald-600 focus:ring-1 focus:ring-emerald-500"
              />
              <div className="flex-1">
                <div className="text-sm text-white font-medium">护城河</div>
                <div className="text-xs text-slate-400">转换成本高</div>
              </div>
            </label>
          </div>
        </div>

        {/* 分析按钮 */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full mt-4 px-4 py-3 bg-emerald-600 text-white text-sm font-medium rounded shadow-lg hover:shadow-glow-emerald disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          {isAnalyzing ? '分析中...' : '开始分析'}
        </button>
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
          <p className="text-red-400 text-sm flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {error}
          </p>
        </div>
      )}

      {/* 分析结果 */}
      {result && (
        <div className="space-y-4">
          {/* 1. 公司概览 - 顶部 */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">{result.stock_info.company_name || result.symbol}</h2>
                <div className="flex items-center space-x-4 text-sm text-slate-400">
                  <span>{result.symbol}</span>
                  {result.stock_info.sector && <span>• {result.stock_info.sector}</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 mb-1">当前价格</div>
                <div className="text-3xl font-mono font-bold text-white">
                  ${result.current_price.toFixed(2)}
                </div>
              </div>
            </div>

            {/* 关键指标横向展示 */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700">
              <div>
                <div className="text-xs text-slate-400 mb-1">总市值</div>
                <div className="text-lg font-mono font-bold text-white">
                  {result.stock_info.market_cap 
                    ? `$${(result.stock_info.market_cap / 1e9).toFixed(1)}B`
                    : '无数据'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">10年最大回撤</div>
                <div className="text-lg font-mono font-bold text-red-400">
                  {(result.technical_analysis.max_drawdown * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">总评分</div>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-2xl font-bold ${getTierColor(result.quality_assessment.tier)}`}>
                    {result.quality_assessment.tier}
                  </span>
                  <span className="text-sm text-slate-400">
                    {result.quality_assessment.total_score}/8
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 分析报告 - 明确建议 */}
          <div className={`rounded-lg border-2 p-4 ${
            result.pricing.price_gap_percent <= 0 
              ? 'bg-emerald-500/10 border-emerald-500/50' 
              : 'bg-red-500/10 border-red-500/50'
          }`}>
            <div className="flex items-start space-x-3">
              {result.pricing.price_gap_percent <= 0 ? (
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-emerald-400" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
              )}
              <div className="flex-1">
                <div className="text-xs text-slate-400 mb-1">分析报告</div>
                <div className={`text-2xl font-bold mb-2 ${
                  result.pricing.price_gap_percent <= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {result.pricing.price_gap_percent <= 0 ? '可以建仓' : '太贵了'}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-baseline space-x-2">
                    <span className={result.pricing.price_gap_percent <= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      当前溢价: {result.pricing.price_gap_percent > 0 ? '+' : ''}{result.pricing.price_gap_percent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2 text-slate-300">
                    <span className="text-slate-500">需下跌</span>
                    <span className={result.pricing.price_gap_percent <= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {result.pricing.price_gap_percent > 0 
                        ? `${((result.current_price - result.pricing.safe_buy_price) / result.current_price * 100).toFixed(1)}%`
                        : '已达标'}
                    </span>
                    <span className="text-slate-500">
                      (${(result.current_price - result.pricing.safe_buy_price).toFixed(2)})
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 mb-1">安全建仓价</div>
                <div className="text-3xl font-mono font-bold text-emerald-400">
                  ${result.pricing.safe_buy_price.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <div className="text-xs text-slate-400 leading-relaxed">
                💡 溢价 {result.pricing.price_gap_percent.toFixed(1)}%。
                安全价 = 内在估值 {result.pricing.intrinsic_value} × 品质系数 {result.pricing.quality_coefficient} × 市场折扣 {result.pricing.market_discount}。
              </div>
            </div>
          </div>

          {/* 3. 8点质量评分详情 */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center">
                <BarChart3 className="w-4 h-4 mr-1.5 text-emerald-400" />
                8点质量评分
              </h3>
              <div className="text-xs text-slate-400">
                总分 {result.quality_assessment.total_score}/8 • 
                <span className={`ml-1 ${getTierColor(result.quality_assessment.tier)}`}>
                  {result.quality_assessment.tier}级
                </span>
              </div>
            </div>

            {/* 横向3列布局 */}
            <div className="grid grid-cols-3 gap-3">
              {/* 左列：完全自动化 */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center">
                  完全自动化 (2项)
                  <span className="ml-1.5 text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">自动</span>
                </h4>
                <div className="space-y-1.5">
                  {result.quality_assessment.hard_metrics.map((m: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/30 rounded border border-slate-700">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{m.name}</div>
                        <div className="text-xs text-slate-500 truncate">{m.value_display}</div>
                      </div>
                      <div className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${m.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {m.points}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 中列：半自动化 */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center">
                  半自动化 (4项)
                  <span className="ml-1.5 text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">AI判断</span>
                </h4>
                <div className="space-y-1.5">
                  {result.quality_assessment.assisted_metrics.map((m: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/30 rounded border border-slate-700">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{m.name}</div>
                        <div className="text-xs text-slate-500 truncate">{m.value_display}</div>
                      </div>
                      <div className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${m.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {m.points}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 右列：完全人工 + 技术分析 */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center">
                  完全人工 (2项)
                  <span className="ml-1.5 text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">用户</span>
                </h4>
                <div className="space-y-1.5">
                  {result.quality_assessment.soft_metrics.map((m: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/30 rounded border border-slate-700">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{m.name}</div>
                        <div className="text-xs text-slate-500 truncate">{m.description}</div>
                      </div>
                      <div className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${m.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {m.points}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 技术分析嵌入 */}
                <div className="mt-3 p-2 bg-slate-900/30 rounded border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1.5">技术形态</div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div>
                      <span className="text-slate-500">MA50:</span>
                      <span className="text-white ml-1 font-mono">${result.technical_analysis.ma50.toFixed(0)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">MA200:</span>
                      <span className="text-white ml-1 font-mono">${result.technical_analysis.ma200.toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="mt-1.5 text-xs">
                    <span className="text-blue-400">{result.technical_analysis.trading_side}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    MDD: {(result.technical_analysis.max_drawdown * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. 定价分析 */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1.5 text-blue-400" />
              性格波动分析（标准成长）
            </h3>
            <div className="flex items-center space-x-3 text-sm">
              <div className="flex items-baseline space-x-1">
                <span className="text-slate-400">Price =</span>
                <span className="font-mono text-blue-400">{result.pricing.intrinsic_value}</span>
              </div>
              <span className="text-slate-600">×</span>
              <div className="flex items-baseline space-x-1">
                <span className="font-mono text-emerald-400">{result.pricing.quality_coefficient}</span>
                <span className="text-xs text-slate-500">(Mkt)</span>
              </div>
              <span className="text-slate-600">×</span>
              <div className="flex items-baseline space-x-1">
                <span className="font-mono text-purple-400">{result.pricing.market_discount}</span>
                <span className="text-xs text-slate-500">(Qual)</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              {result.market_analysis.is_hk_s_tier && (
                <span className="text-emerald-400">港股S级享受流动性豁免，市场折扣上调至0.85。</span>
              )}
              中波动（标准成长）: 10年最大回撤 {(result.technical_analysis.max_drawdown * 100).toFixed(1)}%。
              {result.technical_analysis.trading_side}。
            </div>
          </div>

          {/* 5. 金字塔网格策略 - 表格样式 */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center">
                <span className="w-5 h-5 bg-emerald-500/20 rounded flex items-center justify-center mr-2">
                  📊
                </span>
                金字塔网格策略
              </h3>
              <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
                中波动（标准成长）
              </span>
            </div>

            {/* 表格 */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-xs font-medium text-slate-400 pb-2">网格价格</th>
                    <th className="text-left text-xs font-medium text-slate-400 pb-2">跌幅（VS上级）</th>
                    <th className="text-left text-xs font-medium text-slate-400 pb-2">买入份数</th>
                    <th className="text-left text-xs font-medium text-slate-400 pb-2">操作建议</th>
                    <th className="text-right text-xs font-medium text-slate-400 pb-2">累计仓位</th>
                  </tr>
                </thead>
                <tbody>
                  {result.pyramid_strategy.map((level: any, idx: number) => {
                    const isTriggered = level.description.includes('已触发')
                    const prevPrice = idx === 0 ? result.pricing.safe_buy_price : result.pyramid_strategy[idx - 1].price
                    const dropPercent = ((prevPrice - level.price) / prevPrice * 100).toFixed(0)
                    
                    // 计算累计仓位
                    let cumulativePosition = 0
                    for (let i = 0; i <= idx; i++) {
                      cumulativePosition += result.pyramid_strategy[i].percentage * 100
                    }
                    
                    return (
                      <tr key={idx} className={`border-b border-slate-700/50 ${
                        isTriggered ? 'bg-emerald-500/5' : ''
                      }`}>
                        <td className="py-2 font-mono text-white">
                          ${level.price.toFixed(2)}
                        </td>
                        <td className="py-2">
                          <span className={idx === 0 ? 'text-slate-500' : 'text-red-400'}>
                            {idx === 0 ? '-' : `-${dropPercent}%`}
                          </span>
                        </td>
                        <td className="py-2 font-mono text-white">
                          {((level.percentage * 10) / 0.1).toFixed(1)}
                        </td>
                        <td className="py-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            isTriggered 
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-700 text-slate-400'
                          }`}>
                            {idx === 0 ? '首次建仓' : `加仓`}
                          </span>
                        </td>
                        <td className="py-2 text-right font-mono text-white">
                          {cumulativePosition.toFixed(0)}%
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="border-t-2 border-slate-600">
                    <td className="py-2 text-slate-400">总计</td>
                    <td></td>
                    <td className="py-2 font-mono font-bold text-emerald-400">10 Units</td>
                    <td className="py-2 text-slate-400">总仓位</td>
                    <td className="py-2 text-right font-mono font-bold text-emerald-400">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-xs text-slate-500 leading-relaxed">
              * 金字塔网格逻辑：网格价格 = 上级价格 × (1 - 跌幅率)。单位仓量: 10份。
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// === 辅助组件 ===


function getTierColor(tier: string) {
  const colors: any = {
    'S': 'text-purple-400',
    'A': 'text-emerald-400',
    'B': 'text-blue-400',
    'C': 'text-red-400'
  }
  return colors[tier] || 'text-slate-400'
}

