import { useState } from 'react'
import { useAnalyzeStock } from '@/hooks/useStocks'
import { formatCurrency, formatPercent, getScoreColor } from '@/lib/utils'
import { Search, TrendingUp, AlertTriangle } from 'lucide-react'

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
      <h2 className="text-2xl font-bold text-gray-900">建仓计算器</h2>

      {/* 搜索框 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex space-x-4">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="输入股票代码（如: AAPL, 600519.SS）"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleAnalyze}
            disabled={analyzeStock.isPending}
            className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            <Search className="h-5 w-5" />
            <span>{analyzeStock.isPending ? '分析中...' : '分析'}</span>
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {analyzeStock.isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          分析失败，请检查股票代码是否正确
        </div>
      )}

      {/* 分析结果 */}
      {result && (
        <div className="space-y-6">
          {/* 股票信息 & 评分 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{result.symbol}</h3>
                <p className="text-gray-600">{result.stock_info.company_name}</p>
                <p className="text-lg font-semibold text-gray-900 mt-2">
                  当前价格: {formatCurrency(result.current_price)}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-lg ${getScoreColor(result.overall_score)}`}>
                <span className="text-3xl font-bold">{result.overall_score}</span>
              </div>
            </div>

            {/* 评分详情 */}
            <div className="space-y-2 mb-6">
              {result.score_details.map((detail, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{detail.reason}</span>
                  <span className={`font-semibold ${getScoreColor(detail.score)}`}>
                    {detail.score}
                  </span>
                </div>
              ))}
            </div>

            {/* 风险提示 */}
            <div className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">{result.risk_warning}</p>
            </div>
          </div>

          {/* 建仓建议 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              建仓建议
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">安全买入价</span>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(result.safe_buy_price)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">折扣率</span>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPercent(result.discount_rate * 100)}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-900">{result.recommendation}</p>
              </div>
            </div>
          </div>

          {/* 金字塔网格策略 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">6步金字塔建仓策略</h3>
            <div className="space-y-3">
              {result.pyramid_strategy.map((level) => (
                <div
                  key={level.level}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                      {level.level}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{formatCurrency(level.price)}</p>
                      <p className="text-sm text-gray-600">{level.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{level.percentage}%</p>
                    <p className="text-sm text-gray-600">仓位</p>
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

