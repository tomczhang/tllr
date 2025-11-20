import { usePortfolioOverview } from '@/hooks/usePortfolio'
import { formatCurrency, formatPercent, getPnlColor } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet, PieChart, Activity } from 'lucide-react'

export default function DashboardPage() {
  const { data: overview, isLoading } = usePortfolioOverview()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          <p className="text-slate-400 text-sm">加载中...</p>
        </div>
      </div>
    )
  }

  if (!overview || overview.total_positions === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="max-w-md text-center">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-800/50 border border-slate-700">
            <Wallet className="h-10 w-10 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">还没有持仓</h3>
          <p className="text-slate-400 text-sm">
            前往<span className="text-emerald-400">"建仓计算器"</span>分析股票，
            或在<span className="text-blue-400">"我的持仓"</span>添加交易记录
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center space-x-3 mb-8">
        <Activity className="w-6 h-6 text-emerald-400" />
        <h2 className="text-2xl font-bold text-white">投资概览</h2>
      </div>

      {/* 总览卡片 - 暗黑玻璃风格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 总市值 */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 hover:bg-slate-800 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">总市值</span>
            <Wallet className="h-5 w-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white font-mono mb-1">
            {formatCurrency(overview.total_market_value)}
          </p>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            当前价值
          </span>
        </div>

        {/* 总成本 */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 hover:bg-slate-800 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">总成本</span>
            <PieChart className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-white font-mono mb-1">
            {formatCurrency(overview.total_cost)}
          </p>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300 border border-slate-600">
            持仓成本
          </span>
        </div>

        {/* 总盈亏 */}
        <div className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border p-6 hover:bg-slate-800 transition-all ${
          overview.total_pnl >= 0 
            ? 'border-emerald-500/50 shadow-glow-emerald' 
            : 'border-red-500/50 shadow-glow-red'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">总盈亏</span>
            {overview.total_pnl >= 0 ? (
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-400" />
            )}
          </div>
          <p className={`text-3xl font-bold font-mono mb-1 ${
            overview.total_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {formatCurrency(overview.total_pnl)}
          </p>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
            overview.total_pnl >= 0
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {overview.total_pnl >= 0 ? '盈利' : '亏损'}
          </span>
        </div>

        {/* 收益率 */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 hover:bg-slate-800 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">收益率</span>
          </div>
          <p className={`text-3xl font-bold font-mono mb-1 ${
            overview.total_pnl_percent >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {formatPercent(overview.total_pnl_percent)}
          </p>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
            年化收益
          </span>
        </div>
      </div>

      {/* Top 持仓 - 专业数据表格 */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h3 className="text-xs uppercase tracking-wider text-slate-400 font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Top 5 持仓
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {overview.top_holdings.map((position, index) => (
              <div 
                key={position.symbol} 
                className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:border-slate-600 transition-all"
              >
                <div className="flex items-center space-x-4 flex-1">
                  {/* Rank */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 font-mono text-sm font-bold">
                    #{index + 1}
                  </div>
                  
                  {/* Stock Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-white font-mono">{position.symbol}</span>
                      <span className="text-sm text-slate-400">{position.company_name}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                      <span>持仓: <span className="text-slate-300 font-mono">{position.total_quantity}</span></span>
                      <span>成本: <span className="text-slate-300 font-mono">{formatCurrency(parseFloat(position.avg_cost))}</span></span>
                    </div>
                  </div>
                </div>
                
                {/* Market Value & PnL */}
                <div className="text-right">
                  <div className="font-bold text-white font-mono text-lg mb-1">
                    {formatCurrency(position.market_value)}
                  </div>
                  <div className={`text-sm font-mono ${
                    position.unrealized_pnl_percent >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {formatPercent(position.unrealized_pnl_percent)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 市场分布 */}
      {Object.keys(overview.sector_allocation).length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-medium flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-400" />
              市场分布
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {Object.entries(overview.sector_allocation).map(([market, percent]) => (
                <div key={market} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <span className="text-slate-300 font-medium">{market}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-white font-mono w-12 text-right">{percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
