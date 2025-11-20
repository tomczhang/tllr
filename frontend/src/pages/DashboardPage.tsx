import { usePortfolioOverview } from '@/hooks/usePortfolio'
import { formatCurrency, formatPercent, getPnlColor } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet, PieChart } from 'lucide-react'

export default function DashboardPage() {
  const { data: overview, isLoading } = usePortfolioOverview()

  if (isLoading) {
    return <div className="text-center py-12">加载中...</div>
  }

  if (!overview || overview.total_positions === 0) {
    return (
      <div className="text-center py-12">
        <Wallet className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">还没有持仓</h3>
        <p className="text-gray-600">前往"建仓计算器"分析股票，或在"我的持仓"添加交易记录</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">投资概览</h2>

      {/* 总览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">总市值</span>
            <Wallet className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(overview.total_market_value)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">总成本</span>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(overview.total_cost)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">总盈亏</span>
            {overview.total_pnl >= 0 ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
          </div>
          <p className={`text-2xl font-bold ${getPnlColor(overview.total_pnl)}`}>
            {formatCurrency(overview.total_pnl)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">收益率</span>
          </div>
          <p className={`text-2xl font-bold ${getPnlColor(overview.total_pnl_percent)}`}>
            {formatPercent(overview.total_pnl_percent)}
          </p>
        </div>
      </div>

      {/* Top 持仓 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Top 5 持仓</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {overview.top_holdings.map((position) => (
              <div key={position.symbol} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">{position.symbol}</span>
                    <span className="text-sm text-gray-600">{position.company_name}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    持仓 {position.total_quantity} | 成本 {formatCurrency(parseFloat(position.avg_cost))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(position.market_value)}
                  </div>
                  <div className={`text-sm ${getPnlColor(position.unrealized_pnl_percent)}`}>
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
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">市场分布</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {Object.entries(overview.sector_allocation).map(([market, percent]) => (
                <div key={market} className="flex items-center justify-between">
                  <span className="text-gray-700">{market}</span>
                  <span className="font-semibold text-gray-900">{percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

