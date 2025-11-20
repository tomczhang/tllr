import { useState } from 'react'
import { usePositions, useCreateTransaction } from '@/hooks/usePortfolio'
import { formatCurrency, formatPercent, getPnlColor } from '@/lib/utils'
import { Plus, TrendingUp, TrendingDown } from 'lucide-react'

export default function PortfolioPage() {
  const { data: positions, isLoading } = usePositions()
  const createTransaction = useCreateTransaction()
  const [showAddModal, setShowAddModal] = useState(false)

  if (isLoading) {
    return <div className="text-center py-12">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">我的持仓</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
          <span>记录交易</span>
        </button>
      </div>

      {!positions || positions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">还没有持仓记录</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  股票
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  持仓量
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  成本价
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  当前价
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  市值
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  盈亏
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  收益率
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {positions.map((position) => (
                <tr key={position.symbol} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-semibold text-gray-900">{position.symbol}</div>
                      <div className="text-sm text-gray-600">{position.company_name}</div>
                      {position.warning_message && (
                        <div className="text-xs text-yellow-600 mt-1">
                          {position.warning_message}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    {position.total_quantity}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    {formatCurrency(parseFloat(position.avg_cost))}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    {formatCurrency(position.current_price)}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">
                    {formatCurrency(position.market_value)}
                  </td>
                  <td className={`px-6 py-4 text-right font-semibold ${getPnlColor(position.unrealized_pnl)}`}>
                    {formatCurrency(position.unrealized_pnl)}
                  </td>
                  <td className={`px-6 py-4 text-right font-semibold ${getPnlColor(position.unrealized_pnl_percent)}`}>
                    <div className="flex items-center justify-end space-x-1">
                      {position.unrealized_pnl_percent >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>{formatPercent(position.unrealized_pnl_percent)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TODO: 添加交易记录的 Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">记录交易（简化版）</h3>
            <p className="text-gray-600">
              交易录入功能开发中...
              <br />
              请使用 API 或等待完整版本
            </p>
            <button
              onClick={() => setShowAddModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

