import { useState, useEffect } from 'react'
import { Wallet, Plus, Trash2, Save, RefreshCw, DollarSign, TrendingUp, Shield } from 'lucide-react'
import axios from 'axios'

interface Holding {
  ticker: string
  market_value: number
  quantity?: number
  avg_cost?: number
}

interface AssetScore {
  category: string
  category_display: string
  target_weight: number
  target_value: number
  actual_value: number
  actual_weight: number
  score: number
  status: string
  status_color: string
  gap_value: number
  gap_weight: number
}

interface HealthReport {
  total_value: number
  compliance_score: number
  grade: string
  grade_color: string
  grade_description: string
  asset_scores: AssetScore[]
  conservative_actual: number
  conservative_target: number
  aggressive_actual: number
  aggressive_target: number
  recommendations: string[]
}

export default function PortfolioPage() {
  const [cash, setCash] = useState<number>(0)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // 新增持仓表单
  const [newTicker, setNewTicker] = useState('')
  const [newValue, setNewValue] = useState('')

  // 加载持仓数据
  useEffect(() => {
    loadHoldings()
  }, [])

  // 自动分析（当持仓变化时）
  useEffect(() => {
    if (holdings.length > 0 || cash > 0) {
      analyzeHealth()
    } else {
      setHealthReport(null)
    }
  }, [holdings, cash])

  const loadHoldings = async () => {
    try {
      const response = await axios.get('/api/v1/portfolio/holdings')
      setCash(response.data.cash || 0)
      setHoldings(response.data.holdings || [])
    } catch (error) {
      console.error('加载持仓失败:', error)
    }
  }

  const saveHoldings = async () => {
    setIsSaving(true)
    try {
      await axios.post('/api/v1/portfolio/holdings', {
        cash,
        holdings
      })
      alert('✅ 保存成功！')
    } catch (error) {
      console.error('保存失败:', error)
      alert('❌ 保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const analyzeHealth = async () => {
    if (holdings.length === 0 && cash === 0) {
      setHealthReport(null)
      return
    }

    setIsLoading(true)
    try {
      const response = await axios.post('/api/v1/portfolio/health/analyze', {
        cash,
        holdings
      })
      setHealthReport(response.data)
    } catch (error) {
      console.error('分析失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addHolding = () => {
    if (!newTicker || !newValue) {
      alert('请输入股票代码和市值')
      return
    }

    const ticker = newTicker.trim().toUpperCase()
    const value = parseFloat(newValue)

    if (isNaN(value) || value <= 0) {
      alert('市值必须是正数')
      return
    }

    // 检查是否已存在
    const existingIndex = holdings.findIndex(h => h.ticker === ticker)
    if (existingIndex >= 0) {
      // 更新现有持仓
      const updated = [...holdings]
      updated[existingIndex].market_value = value
      setHoldings(updated)
    } else {
      // 添加新持仓
      setHoldings([...holdings, { ticker, market_value: value }])
    }

    setNewTicker('')
    setNewValue('')
  }

  const removeHolding = (ticker: string) => {
    if (confirm(`确定要删除 ${ticker} 吗？`)) {
      setHoldings(holdings.filter(h => h.ticker !== ticker))
    }
  }

  const updateHoldingValue = (ticker: string, value: number) => {
    const updated = holdings.map(h =>
      h.ticker === ticker ? { ...h, market_value: value } : h
    )
    setHoldings(updated)
  }

  const totalValue = holdings.reduce((sum, h) => sum + h.market_value, 0) + cash

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Wallet className="w-6 h-6 text-emerald-400" />
          <h2 className="text-2xl font-bold text-white">我的持仓</h2>
        </div>
        <button
          onClick={saveHoldings}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isSaving ? '保存中...' : '保存持仓'}
        </button>
      </div>

      {/* 总资产概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">总资产</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">
            ${totalValue.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">持仓数量</span>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">
            {holdings.length}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">健康评分</span>
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-3xl font-bold text-white font-mono">
              {healthReport ? healthReport.compliance_score.toFixed(1) : '--'}
            </div>
            {healthReport && (
              <div
                className="text-xl font-bold"
                style={{ color: healthReport.grade_color }}
              >
                {healthReport.grade}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：持仓管理 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 现金管理 */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              现金
            </h3>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">$</span>
              <input
                type="number"
                value={cash}
                onChange={(e) => setCash(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full pl-8 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-lg focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* 添加持仓 */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              添加持仓
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value)}
                placeholder="股票代码 (如 AAPL)"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white uppercase focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="市值 (USD)"
                  className="w-full pl-8 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <button
                onClick={addHolding}
                className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加
              </button>
            </div>
          </div>

          {/* 持仓列表 */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <h3 className="text-sm font-bold text-white mb-4">当前持仓 ({holdings.length})</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {holdings.map((h) => (
                <div key={h.ticker} className="flex items-center gap-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
                  <div className="flex-1">
                    <div className="font-mono font-bold text-white text-sm mb-1">{h.ticker}</div>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                      <input
                        type="number"
                        value={h.market_value}
                        onChange={(e) => updateHoldingValue(h.ticker, parseFloat(e.target.value) || 0)}
                        className="w-full pl-5 pr-2 py-1 bg-slate-800 border border-slate-700 rounded text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeHolding(h.ticker)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {holdings.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  暂无持仓
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：健康度分析 */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700">
              <div className="flex flex-col items-center space-y-4">
                <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin" />
                <p className="text-slate-400 text-sm">分析中...</p>
              </div>
            </div>
          ) : healthReport ? (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                持仓健康度分析
              </h3>

              {/* 简化的评分展示 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <div className="text-xs text-slate-500 mb-1">合规评分</div>
                  <div className="flex items-center gap-2">
                    <div className="text-3xl font-bold text-white font-mono">
                      {healthReport.compliance_score.toFixed(1)}
                    </div>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: healthReport.grade_color }}
                    >
                      {healthReport.grade}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <div className="text-xs text-slate-500 mb-1">仓位配置</div>
                  <div className="flex items-center gap-3 text-sm">
                    <div>
                      <span className="text-blue-400 font-mono">{healthReport.conservative_actual.toFixed(0)}%</span>
                      <span className="text-slate-500 ml-1">保守</span>
                    </div>
                    <div className="text-slate-600">|</div>
                    <div>
                      <span className="text-orange-400 font-mono">{healthReport.aggressive_actual.toFixed(0)}%</span>
                      <span className="text-slate-500 ml-1">激进</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 资产配置进度条 */}
              <div className="space-y-3">
                {healthReport.asset_scores.map((score) => (
                  <div key={score.category} className="p-3 bg-slate-900/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{score.category_display}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          score.status_color === 'emerald' ? 'bg-emerald-500/20 text-emerald-300' :
                          score.status_color === 'amber' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {score.status}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {score.actual_weight.toFixed(1)}% / {score.target_weight.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          score.status_color === 'emerald' ? 'bg-emerald-500' :
                          score.status_color === 'amber' ? 'bg-amber-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min((score.actual_weight / score.target_weight) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 调仓建议 */}
              {healthReport.recommendations.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <div className="text-xs font-bold text-slate-400 mb-3">调仓建议</div>
                  <div className="space-y-2">
                    {healthReport.recommendations.map((rec, idx) => (
                      <div key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700">
              <div className="text-center">
                <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-sm">添加持仓后自动分析健康度</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
