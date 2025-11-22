/**
 * 建仓计算器 V2 - 8分制质量评分系统
 */

import { useState, useEffect } from 'react'
import { Search, AlertTriangle, Target, BarChart3, Sparkles, RefreshCw, ArrowUpRight, Activity, TrendingDown, Info } from 'lucide-react'
import axios from 'axios'

// 定义类型
interface UserConfirmations {
  gross_margin?: boolean | null
  roe?: boolean | null
  financial_safety: boolean
  shareholder_returns: boolean
  industry_dominance: boolean
  moat: boolean
}

export default function CalculatorPage() {
  const [symbol, setSymbol] = useState('')
  const [intrinsicValue, setIntrinsicValue] = useState<number>(100)
  const [confirmations, setConfirmations] = useState<UserConfirmations>({
    gross_margin: null,
    roe: null,
    financial_safety: false,
    shareholder_returns: false,
    industry_dominance: false,
    moat: false
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
    <div className="min-h-screen bg-slate-900 font-sans text-slate-300">
      <div className="mx-auto space-y-8">
        {/* Header & Wisdom Module */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">建仓计算器</h2>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mt-0.5">
                结合公司内在估值和所属市场，<span className="text-emerald-400">智能</span>计算<span className="text-emerald-400">安全</span>建仓点
              </p>
            </div>
          </div>

          {/* Investment Wisdom Module */}
          <div className="flex-1 md:max-w-xl">
            <WisdomModule />
          </div>
        </div>

        {/* Input Section - Two Rows */}
        <div className="card-glass p-5 space-y-4">
          {/* Row 1: Basic Inputs */}
          <div className="flex flex-col md:flex-row items-end gap-4">
            {/* Stock Symbol */}
            <div className="flex-1 w-full md:w-auto min-w-[140px]">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">股票代码</label>
              <div className="relative group">
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="0700.HK/META/1810.SZ"
                  className="w-full bg-slate-900/80 border border-slate-600 rounded-lg px-3 py-2.5 pl-9 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all uppercase font-mono"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
            </div>

            {/* Intrinsic Value */}
            <div className="flex-1 w-full md:w-auto min-w-[140px]">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">
                <div className="group relative inline-block cursor-help border-b border-dashed border-slate-500/50 hover:border-emerald-400/50 transition-colors">
                  内在价值
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-xs text-slate-300 rounded-lg border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    企业在剩余生命中可以产生的现金流的折现值
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45"></div>
                  </div>
                </div>
              </label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm group-hover:text-emerald-400 transition-colors">$</span>
                <input
                  type="number"
                  value={intrinsicValue}
                  onChange={(e) => setIntrinsicValue(Number(e.target.value))}
                  placeholder="50"
                  className="w-full bg-slate-900/80 border border-slate-600 rounded-lg px-3 py-2.5 pl-8 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="h-[42px] px-6 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center min-w-[120px]"
            >
              {isAnalyzing ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  分析
                  <BarChart3 className="w-3.5 h-3.5 ml-1.5" />
                </>
              )}
            </button>
          </div>

          {/* Row 2: Quality Checks with Prompt */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-slate-400">以下指标请根据公司实际情况自行确认</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
              {/* 1. Industry Dominance */}
              <label className={`cursor-pointer px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-2 select-none ${confirmations.industry_dominance
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300 border border-transparent'
                }`}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={confirmations.industry_dominance}
                  onChange={(e) => setConfirmations({ ...confirmations, industry_dominance: e.target.checked })}
                />
                <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${confirmations.industry_dominance ? 'border-emerald-500 bg-emerald-500' : 'border-slate-500'
                  }`}>
                  {confirmations.industry_dominance && <div className="w-1 h-1 bg-slate-900 rounded-full" />}
                </div>
                <div className="group relative ml-1 cursor-help border-b border-dashed border-slate-500/50 hover:border-emerald-400/50 transition-colors">
                  行业地位
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-xs text-slate-300 rounded-lg border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    行业龙头或双寡头：赢家通吃，拒绝行业老三、老四
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45"></div>
                  </div>
                </div>
              </label>

              {/* 2. Moat */}
              <label className={`cursor-pointer px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-2 select-none ${confirmations.moat
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300 border border-transparent'
                }`}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={confirmations.moat}
                  onChange={(e) => setConfirmations({ ...confirmations, moat: e.target.checked })}
                />
                <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${confirmations.moat ? 'border-emerald-500 bg-emerald-500' : 'border-slate-500'
                  }`}>
                  {confirmations.moat && <div className="w-1 h-1 bg-slate-900 rounded-full" />}
                </div>
                <div className="group relative ml-1 cursor-help border-b border-dashed border-slate-500/50 hover:border-emerald-400/50 transition-colors">
                  护城河
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-xs text-slate-300 rounded-lg border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    拥有高转换成本，用户难以离开（如生态、成瘾性）
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45"></div>
                  </div>
                </div>
              </label>

              {/* 3. Financial Safety */}
              <label className={`cursor-pointer px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-2 select-none ${confirmations.financial_safety
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300 border border-transparent'
                }`}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={confirmations.financial_safety}
                  onChange={(e) => setConfirmations({ ...confirmations, financial_safety: e.target.checked })}
                />
                <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${confirmations.financial_safety ? 'border-emerald-500 bg-emerald-500' : 'border-slate-500'
                  }`}>
                  {confirmations.financial_safety && <div className="w-1 h-1 bg-slate-900 rounded-full" />}
                </div>
                <div className="group relative ml-1 cursor-help border-b border-dashed border-slate-500/50 hover:border-emerald-400/50 transition-colors">
                  财务安全
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-xs text-slate-300 rounded-lg border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    现金储备充足，无偿债风险（现金 &gt; 有息负债）
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45"></div>
                  </div>
                </div>
              </label>

              {/* 4. Shareholder Returns */}
              <label className={`cursor-pointer px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-2 select-none ${confirmations.shareholder_returns
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300 border border-transparent'
                }`}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={confirmations.shareholder_returns}
                  onChange={(e) => setConfirmations({ ...confirmations, shareholder_returns: e.target.checked })}
                />
                <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${confirmations.shareholder_returns ? 'border-emerald-500 bg-emerald-500' : 'border-slate-500'
                  }`}>
                  {confirmations.shareholder_returns && <div className="w-1 h-1 bg-slate-900 rounded-full" />}
                </div>
                <div className="group relative ml-1 cursor-help border-b border-dashed border-slate-500/50 hover:border-emerald-400/50 transition-colors">
                  股东回报
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-xs text-slate-300 rounded-lg border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    注重股东回报，有稳定的分红或回购计划
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45"></div>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center animate-pulse">
            <AlertTriangle className="w-5 h-5 text-red-400 mr-3" />
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Analysis Result */}
        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 1. Analysis Report */}
            <div className={`card-glass p-6 border-l-4 ${result.pricing.price_gap_percent <= 0
              ? 'border-l-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.05)]'
              : 'border-l-red-500 shadow-[0_0_20px_rgba(248,113,113,0.05)]'
              }`}>

              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Dynamic Icon (Left) */}
                <div className={`relative w-24 h-24 rounded-full flex items-center justify-center border-4 flex-shrink-0 ${result.pricing.price_gap_percent <= 0
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : 'border-red-500/20 bg-red-500/5'
                  }`}>
                  {result.pricing.price_gap_percent <= 0 ? (
                    <Target className="w-10 h-10 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                  )}
                  {/* Pulse Ring */}
                  <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${result.pricing.price_gap_percent <= 0 ? 'bg-emerald-500' : 'bg-red-500'
                    }`}></div>
                </div>

                {/* Right Content */}
                <div className="flex-1 w-full text-center md:text-left">
                  {/* Conclusion Title */}
                  <h2 className={`text-4xl font-bold mb-1 ${result.pricing.price_gap_percent <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.pricing.price_gap_percent <= 0 ? '贪婪时刻' : '太贵了'}
                  </h2>
                  <p className="text-slate-400 text-sm mb-4">
                    {result.pricing.price_gap_percent <= 0
                      ? '股价已进入安全边际范围，投资性价比较高'
                      : '股价偏离安全边际，建议耐心等待更好的击球点'}
                  </p>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-3 gap-4 bg-slate-900/40 rounded-xl p-4 border border-slate-700/30">
                    <div>
                      <div className="text-slate-500 text-xs mb-1">当前溢价率</div>
                      <div className={`text-xl font-bold font-mono ${result.pricing.price_gap_percent <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {result.pricing.price_gap_percent > 0 ? '+' : ''}{result.pricing.price_gap_percent.toFixed(1)}%
                      </div>
                    </div>

                    <div className="border-l border-slate-700/50 pl-4">
                      <div className="text-slate-500 text-xs mb-1">安全建仓价</div>
                      <div className="text-xl font-bold font-mono text-white">
                        ${result.pricing.safe_buy_price.toFixed(2)}
                      </div>
                    </div>

                    <div className="border-l border-slate-700/50 pl-4">
                      <div className="text-slate-500 text-xs mb-1">
                        {result.current_price - result.pricing.safe_buy_price < 0 ? '安全边际空间' : '还需耐心等待'}
                      </div>
                      <div className={`text-xl font-bold font-mono ${
                        result.current_price - result.pricing.safe_buy_price < 0 
                          ? 'text-emerald-400' 
                          : 'text-red-400'
                      }`}>
                        ${Math.abs(result.current_price - result.pricing.safe_buy_price).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formula Explanation */}
              <div className="mt-4 flex items-center justify-center md:justify-start gap-2 text-xs text-slate-500">
                <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                <span>安全价 = 内在估值 ${result.pricing.intrinsic_value} × 品质系数 {result.pricing.quality_coefficient} × 市场折扣系数 {result.pricing.market_discount}</span>
              </div>
              
              {/* 120日前高跌幅警告 - 重要风险提示 */}
              {(() => {
                const high120d = result.technical_analysis.high_120d;
                const high120dDate = result.technical_analysis.high_120d_date;
                const current = result.current_price;
                const dropPercent = ((high120d - current) / high120d * 100);
                
                if (dropPercent < 15 && dropPercent >= 0) {
                  return (
                    <div className="mt-4 p-4 bg-red-500/10 border-l-4 border-l-red-500 rounded-r-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-bold text-red-400 mb-1">
                            ⚠️ 重要风险提示：距120日前高仅跌{dropPercent.toFixed(1)}%
                          </div>
                          <div className="text-xs text-red-300/80 space-y-1">
                            <div>
                              120日前高：<span className="font-mono font-semibold">${high120d.toFixed(2)}</span>
                              {high120dDate && <span className="ml-2 text-red-300/60">({high120dDate})</span>}
                            </div>
                            <div>不符合首仓安全阈值（需跌幅≥15%）。建议等待更大回撤空间，避免追高风险。</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* 2. Company Overview */}
            <div className="card-glass p-6 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>

              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 relative z-10">
                <div>
                  <a
                    href={`https://finance.yahoo.com/quote/${result.symbol}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/link flex items-center gap-2 text-3xl font-bold text-white tracking-tight hover:text-emerald-400 transition-colors mb-2 w-fit"
                  >
                    {result.stock_info.company_name || result.symbol}
                    <ArrowUpRight className="w-6 h-6 text-slate-600 group-hover/link:text-emerald-400 transition-colors" />
                  </a>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Symbol Tag */}
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                      {result.symbol}
                    </span>

                    {/* Tier Tag */}
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${result.quality_assessment.tier === 'S' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      result.quality_assessment.tier === 'A' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                      {result.quality_assessment.tier} 级
                    </span>

                    {/* Sector Tag */}
                    {result.stock_info.sector && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800/50 text-slate-400 border border-slate-700/50">
                        {result.stock_info.sector}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">当前股价</div>
                  <div className="text-4xl font-mono font-bold text-white tracking-tight">
                    ${result.current_price.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-700/50">
                <div>
                  <div className="text-xs text-slate-500 mb-1">总市值</div>
                  <div className="text-lg font-mono font-bold text-slate-200">
                    {result.stock_info.market_cap
                      ? result.stock_info.market_cap >= 1e12
                        ? `${(result.stock_info.market_cap / 1e12).toFixed(2)}万亿美元`
                        : `${(result.stock_info.market_cap / 1e8).toFixed(0)}亿美元`
                      : 'N/A'}
                  </div>
                </div>
                <div className="relative group cursor-help">
                  <div className="text-xs text-slate-500 mb-1 border-b border-dashed border-slate-500/30 inline-block">近10年最大回撤</div>
                  <div className="text-lg font-mono font-bold text-red-400">
                    {(result.technical_analysis.max_drawdown * 100).toFixed(1)}%
                  </div>

                  {/* Max Drawdown Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-slate-800 text-xs text-slate-300 rounded-lg border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 min-w-[200px]">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-700">
                      <span className="font-bold text-white">近10年最大回撤详情</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                      <span className="text-slate-500">高点:</span>
                      <span className="font-mono text-left">
                        {result.technical_analysis.max_drawdown_peak_date} <span className="text-slate-200">${result.technical_analysis.max_drawdown_peak_price?.toFixed(2)}</span>
                      </span>

                      <span className="text-slate-500">低点:</span>
                      <span className="font-mono text-left">
                        {result.technical_analysis.max_drawdown_valley_date} <span className="text-slate-200">${result.technical_analysis.max_drawdown_valley_price?.toFixed(2)}</span>
                      </span>
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45"></div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">公司质量评分</div>
                  <div className="flex items-baseline space-x-1">
                    <span className={`text-xl font-bold ${getTierColor(result.quality_assessment.tier)}`}>
                      {result.quality_assessment.total_score}
                    </span>
                    <span className="text-sm font-bold text-slate-500">/ 8</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">估算内在价值</div>
                  <div className="text-lg font-mono font-bold text-blue-400">
                    ${result.pricing.intrinsic_value}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Quality Score */}
              <div className="card-glass p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="section-title mb-0 text-base font-bold text-white">
                    <div className="w-1.5 h-5 bg-emerald-500 rounded-full mr-2"></div>
                    8点质量评分
                  </h3>
                  
                  {/* 等级徽章 - 带hover提示 */}
                  <div className="group relative inline-block cursor-help">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${result.quality_assessment.tier === 'S' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      result.quality_assessment.tier === 'A' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                      {result.quality_assessment.tier}级 • {result.quality_assessment.total_score}/8分
                    </span>
                    
                    {/* Hover Tooltip */}
                    <div className="absolute bottom-full right-0 mb-2 px-4 py-3 bg-slate-800 rounded-lg border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 min-w-[280px]">
                      <div className="text-xs font-bold text-white mb-2 border-b border-slate-700 pb-2">质量评分等级与品质系数</div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-purple-300">S级 (7-8分)</span>
                          <span className="font-mono text-slate-300">× 0.95 <span className="text-slate-500 ml-1">皇冠明珠</span></span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-300">A级 (5-6分)</span>
                          <span className="font-mono text-slate-300">× 0.85 <span className="text-slate-500 ml-1">优质蓝筹</span></span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-300">B级 (3-4分)</span>
                          <span className="font-mono text-slate-300">× 0.70 <span className="text-slate-500 ml-1">平庸/成长</span></span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-red-300">C级 (0-2分)</span>
                          <span className="font-mono text-slate-300">× 0.50 <span className="text-slate-500 ml-1">高风险</span></span>
                        </div>
                      </div>
                      <div className="absolute -bottom-1 right-4 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45"></div>
                    </div>
                  </div>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Automated Metrics */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 flex items-center uppercase tracking-wider">
                    自动化分析 (4项)
                  </h4>
                  <div className="space-y-2">
                    {result.quality_assessment.hard_metrics.map((m: any, idx: number) => (
                      <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        m.passed 
                          ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50' 
                          : 'bg-red-500/5 border-red-500/30 hover:border-red-500/50'
                      }`}>
                        <div className="flex-1 min-w-0 mr-2">
                          <div className={`text-sm font-medium truncate`}>
                            {m.name}
                          </div>
                          <div className={`text-xs font-mono mt-0.5 flex items-center gap-2 ${m.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                            <span className="truncate">{m.value_display}</span>
                            <span className="text-slate-500 flex-shrink-0">要求: {m.threshold}</span>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-bold ${
                          m.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {m.passed ? '✓' : '✗'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Manual Metrics */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 flex items-center uppercase tracking-wider">
                    认知判断 (4项)
                  </h4>
                  <div className="space-y-2">
                    {/* 财务安全和股东回报（现在属于人工判断） */}
                    {result.quality_assessment.assisted_metrics.map((m: any, idx: number) => (
                      <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        m.passed 
                          ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50' 
                          : 'bg-red-500/5 border-red-500/30 hover:border-red-500/50'
                      }`}>
                        <div className="flex-1 min-w-0 mr-2">
                          <div className={`text-sm font-medium truncate`}>
                            {m.name}
                          </div>
                          <div className={`text-xs font-mono mt-0.5 flex items-center gap-2 ${m.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                            <span className="truncate">{m.value_display}</span>
                            <span className="text-slate-500 flex-shrink-0">
                              要求: {m.threshold}
                            </span>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-bold ${
                          m.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {m.passed ? '✓' : '✗'}
                        </div>
                      </div>
                    ))}
                    
                    {/* 行业地位和护城河 */}
                    {result.quality_assessment.soft_metrics.map((m: any, idx: number) => (
                      <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        m.passed 
                          ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50' 
                          : 'bg-red-500/5 border-red-500/30 hover:border-red-500/50'
                      }`}>
                        <div className="flex-1 min-w-0 mr-2">
                          <div className="text-sm font-medium truncate">{m.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            要求: 用户自行判断
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-bold ${
                          m.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {m.passed ? '✓' : '✗'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Analysis - 独立部分 */}
            <div className="card-glass p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="section-title mb-0 text-base font-bold text-white">
                  <div className="w-1.5 h-5 bg-blue-500 rounded-full mr-2"></div>
                  技术分析
                </h3>
                <span className={`text-xs px-3 py-1 rounded-full font-medium border ${
                  result.technical_analysis.trading_side === '左侧交易' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>
                  {result.technical_analysis.trading_side}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* MA50 */}
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">50日均线</span>
                    <Activity className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-mono font-bold text-white mb-1">
                    ${result.technical_analysis.ma50.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500">
                    当前价格{result.current_price > result.technical_analysis.ma50 ? '高于' : '低于'}MA50
                  </div>
                </div>

                {/* MA200 */}
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">200日均线</span>
                    <Activity className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-mono font-bold text-white mb-1">
                    ${result.technical_analysis.ma200.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500">
                    当前价格{result.current_price > result.technical_analysis.ma200 ? '高于' : '低于'}MA200
                  </div>
                </div>

                {/* 最大回撤 */}
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">近10年最大回撤</span>
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  </div>
                  <div className={`text-2xl font-mono font-bold mb-1 ${
                    result.technical_analysis.max_drawdown > 0.5 ? 'text-red-400' : 
                    result.technical_analysis.max_drawdown > 0.3 ? 'text-yellow-400' : 
                    'text-emerald-400'
                  }`}>
                    {(result.technical_analysis.max_drawdown * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-500">
                    {result.technical_analysis.max_drawdown > 0.5 ? '高波动股票' : 
                     result.technical_analysis.max_drawdown > 0.3 ? '中等波动' : 
                     '低波动'}
                  </div>
                </div>
              </div>

              {/* 交易说明 */}
              <div className="mt-4 p-4 bg-blue-500/5 rounded-lg border border-blue-500/10">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-slate-300">
                    {result.technical_analysis.trading_description}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Pricing Analysis */}
            <div className="card-glass p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="section-title mb-0 text-base font-bold text-white">
                  <div className="w-1.5 h-5 bg-purple-500 rounded-full mr-2"></div>
                  安全建仓价分析
                </h3>
                <span className={`text-xs px-2 py-1 rounded border ${
                  (() => {
                    const mdd = result.technical_analysis.max_drawdown;
                    
                    // 根据波动性返回颜色
                    if (mdd > 0.5) return 'text-red-400 bg-red-500/10 border-red-500/20';
                    if (mdd > 0.3) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
                    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                  })()
                }`}>
                  {(() => {
                    const mdd = result.technical_analysis.max_drawdown;
                    const tier = result.quality_assessment.tier;
                    
                    // 波动性描述
                    const volatility = mdd > 0.5 ? '高波动' : mdd > 0.3 ? '中波动' : '低波动';
                    
                    // 质量描述
                    let qualityDesc = '';
                    if (tier === 'S') qualityDesc = '皇冠明珠';
                    else if (tier === 'A') qualityDesc = '优质蓝筹';
                    else if (tier === 'B') qualityDesc = '平庸/成长型';
                    else if (tier === 'C') qualityDesc = '高风险';
                    
                    return `${volatility}（${qualityDesc}）`;
                  })()}
                </span>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-sm">
                <div className="text-center">
                  <div className="text-slate-400 mb-1">内在估值价格</div>
                  <div className="text-xl font-mono font-bold text-blue-400">${result.pricing.intrinsic_value}</div>
                </div>
                <div className="text-slate-600 font-bold text-lg">×</div>
                <div className="text-center">
                  <div className="text-slate-400 mb-1">公司品质系数</div>
                  <div className="text-xl font-mono font-bold text-emerald-400">{result.pricing.quality_coefficient}</div>
                </div>
                <div className="text-slate-600 font-bold text-lg">×</div>
                <div className="text-center">
                  <div className="text-slate-400 mb-1">市场折扣系数</div>
                  <div className="text-xl font-mono font-bold text-purple-400">{result.pricing.market_discount}</div>
                </div>
                <div className="text-slate-600 font-bold text-lg">=</div>
                <div className="text-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <div className="text-emerald-400 text-xs mb-1 uppercase tracking-wider">安全建仓价</div>
                  <div className="text-2xl font-mono font-bold text-white">${result.pricing.safe_buy_price.toFixed(2)}</div>
                </div>
              </div>

              <div className="mt-4 text-xs text-slate-500 text-center">
                {result.market_analysis.is_hk_s_tier && (
                  <span className="text-emerald-400 mr-2">✨ 港股S级享受流动性豁免 (0.85)</span>
                )}
              </div>
            </div>

            {/* 5. Pyramid Strategy */}
            <div className="card-glass p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="section-title mb-0 text-base font-bold text-white">
                  <div className="w-1.5 h-5 bg-emerald-500 rounded-full mr-2"></div>
                  金字塔网格策略
                </h3>

                {/* 档位信息 - 右上角 */}
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <div className="relative group">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold cursor-help ${result.grid_tier_info.tier_name === '稳健策略' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        result.grid_tier_info.tier_name === '标准策略' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          result.grid_tier_info.tier_name === '波动策略' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                            'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                        {result.grid_tier_info.tier_name}
                      </span>
                      
                      {/* Hover Tooltip - 档位说明 */}
                      <div className="absolute bottom-full right-0 mb-2 px-4 py-3 bg-slate-800 rounded-lg border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 min-w-[320px]">
                        <div className="text-xs font-bold text-white mb-2 border-b border-slate-700 pb-2">金字塔网格建仓策略分级</div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-blue-300 font-medium">稳健策略</span>
                              <span className="text-slate-500 text-[10px] ml-1">（间隔4%）</span>
                            </div>
                            <span className="text-slate-400 text-[10px] ml-2">宽基指数/顶级控股</span>
                          </div>
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-emerald-300 font-medium">标准策略</span>
                              <span className="text-slate-500 text-[10px] ml-1">（间隔7.5%）</span>
                            </div>
                            <span className="text-slate-400 text-[10px] ml-2">市值&gt;2000亿 且 最大回撤&lt;50%</span>
                          </div>
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-orange-300 font-medium">波动策略</span>
                              <span className="text-slate-500 text-[10px] ml-1">（间隔10%）</span>
                            </div>
                            <span className="text-slate-400 text-[10px] ml-2">市值&gt;2000亿 且 最大回撤&gt;50%</span>
                          </div>
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-red-300 font-medium">魔鬼策略</span>
                              <span className="text-slate-500 text-[10px] ml-1">（间隔15%）</span>
                            </div>
                            <span className="text-slate-400 text-[10px] ml-2">市值&lt;2000亿（一票否决）</span>
                          </div>
                        </div>
                        <div className="absolute -bottom-1 right-4 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-700/50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-slate-700">
                      <th className="text-left text-xs font-medium text-slate-400 py-3 px-4">网格价格</th>
                      <th className="text-left text-xs font-medium text-slate-400 py-3 px-4">跌幅</th>
                      <th className="text-left text-xs font-medium text-slate-400 py-3 px-4">买入份数</th>
                      <th className="text-left text-xs font-medium text-slate-400 py-3 px-4">战术指标</th>
                      <th className="text-right text-xs font-medium text-slate-400 py-3 px-4">累计仓位</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {result.pyramid_strategy.map((level: any, idx: number) => {
                      const isTriggered = level.description.includes('已触发')
                      const prevPrice = idx === 0 ? result.pricing.safe_buy_price : result.pyramid_strategy[idx - 1].price
                      const dropPercent = ((prevPrice - level.price) / prevPrice * 100).toFixed(0)

                      let cumulativePosition = 0
                      for (let i = 0; i <= idx; i++) {
                        cumulativePosition += result.pyramid_strategy[i].percentage * 100
                      }

                      // 计算累计回撤百分比（相对于安全建仓价）
                      const cumulativeDrawdown = ((result.pricing.safe_buy_price - level.price) / result.pricing.safe_buy_price * 100).toFixed(1)
                      
                      // 计算均价拉低百分比
                      let weightedSum = 0
                      let totalShares = 0
                      for (let i = 0; i <= idx; i++) {
                        const shares = result.pyramid_strategy[i].percentage * 10 / 0.1
                        weightedSum += result.pyramid_strategy[i].price * shares
                        totalShares += shares
                      }
                      const avgCost = totalShares > 0 ? weightedSum / totalShares : level.price
                      const avgCostReduction = ((result.pricing.safe_buy_price - avgCost) / result.pricing.safe_buy_price * 100).toFixed(1)
                      
                      // 计算回本所需反弹幅（从当前网格价反弹到平均成本需要的涨幅）
                      const breakEvenReboundPercent = ((avgCost - level.price) / level.price * 100).toFixed(1)

                      return (
                        <tr key={idx} className={`hover:bg-slate-800/30 transition-colors ${isTriggered ? 'bg-emerald-500/5' : ''
                          }`}>
                          <td className="py-3 px-4 font-mono text-white">
                            ${level.price.toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${idx === 0 ? 'text-slate-500' : 'bg-red-500/10 text-red-400'
                              }`}>
                              {idx === 0 ? '-' : `-${dropPercent}%`}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-white">
                            {((level.percentage * 10) / 0.1).toFixed(1)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-slate-400">
                                累计回撤: <span className="text-red-400 font-mono">-{cumulativeDrawdown}%</span>
                              </span>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-400">
                                成本拉低: <span className="text-emerald-400 font-mono">-{avgCostReduction}%</span>
                              </span>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-400">
                                回本所需反弹: <span className="text-blue-400 font-mono">+{breakEvenReboundPercent}%</span>
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${cumulativePosition}%` }}
                                ></div>
                              </div>
                              <span className="font-mono text-white w-8">{cumulativePosition.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-xs text-slate-500 flex items-center">
                <div className="w-1 h-1 bg-slate-500 rounded-full mr-2"></div>
                金字塔网格逻辑：网格价格 = 上级价格 × (1 - 跌幅率)
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  )
}

// === 辅助组件 ===

const INVESTMENT_QUOTES = [
  "别人贪婪我恐惧，别人恐惧我贪婪",
  "90%的投资问题来自于建仓",
  "买入价格越低，安全边际越高",
  "耐心是投资中最昂贵的品质",
  "在最悲观的时候买入，在最乐观的时候卖出",
  "市场短期是投票机，长期是称重机",
  "模糊的正确远胜于精确的错误",
  "风险来自于你不知道自己在做什么"
]

function WisdomModule() {
  const [quote, setQuote] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)
  const [, setCurrentIndex] = useState(() => Math.floor(Math.random() * INVESTMENT_QUOTES.length))

  const refreshQuote = () => {
    setIsAnimating(true)
    setCurrentIndex((prev) => {
      const next = (prev + 1) % INVESTMENT_QUOTES.length
      setQuote(INVESTMENT_QUOTES[next])
      return next
    })
    setTimeout(() => setIsAnimating(false), 500)
  }

  useEffect(() => {
    refreshQuote()
  }, [])

  return (
    <div className="relative group w-full">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
      <div className="relative flex items-center justify-between bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3 pr-4 hover:border-slate-600 transition-all">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium flex items-center gap-1">
              巴菲特投资智慧
            </span>
            <p className={`text-sm text-slate-200 font-medium truncate transition-all duration-500 ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
              {quote}
            </p>
          </div>
        </div>

        <button
          onClick={refreshQuote}
          className="ml-3 p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-slate-800 transition-all active:rotate-180 duration-500"
          title="换一句"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}


function getTierColor(tier: string) {
  const colors: any = {
    'S': 'text-purple-400',
    'A': 'text-emerald-400',
    'B': 'text-blue-400',
    'C': 'text-red-400'
  }
  return colors[tier] || 'text-slate-400'
}

