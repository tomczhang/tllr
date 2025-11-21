import { useState } from 'react'
import { useAnalyzeStock } from '@/hooks/useStocks'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Search, TrendingUp, AlertTriangle, Activity, Target, BarChart3 } from 'lucide-react'

export default function CalculatorPage() {
  const [symbol, setSymbol] = useState('')
  const analyzeStock = useAnalyzeStock()

  const handleAnalyze = () => {
    if (symbol.trim()) {
      analyzeStock.mutate(symbol.toUpperCase())
    }
  }

  const result = analyzeStock.data

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center space-x-3">
        <Activity className="w-6 h-6 text-emerald-400" />
        <h2 className="text-2xl font-bold text-white">建仓计算器</h2>
      </div>

      {/* 搜索框 - 暗黑玻璃风格 */}
      <div className="card-glass p-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="输入股票代码（如: AAPL, 600519.SS, TSLA）"
              className="input-dark input-dark-with-icon pl-11"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={analyzeStock.isPending}
            className="btn-primary flex items-center gap-2 min-w-[120px] justify-center"
          >
            {analyzeStock.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>分析中...</span>
              </>
            ) : (
              <>
                <Activity className="h-4 w-4" />
                <span>开始分析</span>
              </>
            )}
          </button>
        </div>
        
        {/* 提示文本 */}
        <p className="mt-3 text-xs text-slate-500">
          支持美股（AAPL）、A股（600519.SS / 000001.SZ）、港股（0700.HK）
        </p>
      </div>

      {/* 错误提示 */}
      {analyzeStock.isError && (
        <div className="card-glass p-4 border-red-500/50 bg-red-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">分析失败</p>
              <p className="text-sm text-slate-400 mt-1">请检查股票代码是否正确，或稍后重试</p>
            </div>
          </div>
        </div>
      )}

      {/* 分析结果 */}
      {result && (
        <div className="space-y-6">
          {/* 股票信息 & 评分卡片 */}
          <div className="card-glass p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-3xl font-bold text-white font-mono">{result.symbol}</h3>
                  <span className="badge-info">{result.stock_info.sector || '科技'}</span>
                </div>
                <p className="text-slate-400 mb-3">{result.stock_info.company_name}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs uppercase tracking-wider text-slate-500">当前价格</span>
                  <p className="text-2xl font-bold text-white font-mono">
                    {formatCurrency(result.current_price)}
                  </p>
                </div>
              </div>
              
              {/* 评分徽章 */}
              <div className={`px-6 py-4 rounded-xl border-2 ${
                Number(result.overall_score) >= 8 
                  ? 'bg-emerald-500/10 border-emerald-500/50 shadow-glow-emerald' 
                  : Number(result.overall_score) >= 6
                  ? 'bg-blue-500/10 border-blue-500/50'
                  : 'bg-red-500/10 border-red-500/50'
              }`}>
                <div className="text-center">
                  <span className={`text-4xl font-bold font-mono ${
                    Number(result.overall_score) >= 8 ? 'text-emerald-400' : 
                    Number(result.overall_score) >= 6 ? 'text-blue-400' : 'text-red-400'
                  }`}>
                    {result.overall_score}
                  </span>
                  <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">综合评分</p>
                </div>
              </div>
            </div>

            {/* 评分详情 */}
            <div className="space-y-2 mb-6">
              <h4 className="section-title mb-3">
                <BarChart3 className="section-title-icon text-blue-400" />
                评分详情
              </h4>
              {result.score_details.map((detail, index) => {
                const score = typeof detail.score === 'string' ? parseFloat(detail.score) : detail.score;
                return (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:border-slate-600 transition-colors"
                  >
                    <span className="text-sm text-slate-300">{detail.reason}</span>
                    <span className={`font-bold font-mono ${
                      score >= 8 ? 'text-emerald-400' :
                      score >= 6 ? 'text-blue-400' : 'text-red-400'
                    }`}>
                      {detail.score}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 风险提示 */}
            <div className="flex items-start gap-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs uppercase tracking-wider text-yellow-400 font-medium mb-1">风险提示</p>
                <p className="text-sm text-slate-300">{result.risk_warning}</p>
              </div>
            </div>
          </div>

          {/* 建仓建议卡片 */}
          <div className={`card-glass p-6 ${
            result.safe_buy_price > result.current_price 
              ? 'border-emerald-500/50 shadow-glow-emerald' 
              : 'border-red-500/50'
          }`}>
            <h3 className="section-title mb-6">
              <Target className="section-title-icon text-emerald-400" />
              建仓建议
            </h3>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* 安全买入价 */}
              <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-700">
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">安全买入价</p>
                <p className="text-3xl font-bold text-emerald-400 font-mono mb-2">
                  {formatCurrency(result.safe_buy_price)}
                </p>
                <span className={`badge-${
                  result.safe_buy_price > result.current_price ? 'success' : 'danger'
                }`}>
                  {result.safe_buy_price > result.current_price ? '贪婪时刻 🎯' : '太贵了 ⚠️'}
                </span>
              </div>
              
              {/* 折扣率 */}
              <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-700">
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">安全折扣</p>
                <p className="text-3xl font-bold text-white font-mono mb-2">
                  {formatPercent(result.discount_rate * 100)}
                </p>
                <span className="badge-neutral">保守策略</span>
              </div>
            </div>

            {/* 建议文本 */}
            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <p className="text-blue-300 text-sm leading-relaxed">{result.recommendation}</p>
            </div>
          </div>

          {/* 金字塔网格策略 */}
          <div className="card-glass p-6">
            <h3 className="section-title mb-6">
              <TrendingUp className="section-title-icon text-purple-400" />
              6步金字塔建仓策略
            </h3>
            <div className="space-y-3">
              {result.pyramid_strategy.map((level) => (
                <div
                  key={level.level}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* 步骤编号 */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold font-mono shadow-lg">
                      {level.level}
                    </div>
                    
                    {/* 价格和描述 */}
                    <div className="flex-1">
                      <p className="text-lg font-bold text-white font-mono mb-1">
                        {formatCurrency(level.price)}
                      </p>
                      <p className="text-sm text-slate-400">{level.description}</p>
                    </div>
                  </div>
                  
                  {/* 仓位占比 */}
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-emerald-400 font-mono">
                      {level.percentage}%
                    </p>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">仓位</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 策略说明 */}
            <div className="mt-6 p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
              <p className="text-xs text-slate-400 leading-relaxed">
                💡 <span className="text-slate-300 font-medium">策略说明：</span>
                金字塔建仓法通过分批买入，降低平均成本。价格越低，买入比例越大，实现逢低加仓的效果。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

