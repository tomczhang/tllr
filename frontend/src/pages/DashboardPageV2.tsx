import { useState, useEffect } from 'react'
import { Activity, TrendingUp, Shield, Target, AlertTriangle, CheckCircle, Plus, Trash2, Save, RefreshCw } from 'lucide-react'
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

export default function DashboardPageV2() {
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
      alert('保存成功！')
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请重试')
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
    setHoldings(holdings.filter(h => h.ticker !== ticker))
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
          <Shield className="w-6 h-6 text-emerald-400" />
          <h2 className="text-2xl font-bold text-white">持仓健康度</h2>
        </div>
        <button
          onClick={saveHoldings}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? '保存中...' : '保存持仓'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：持仓输入 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 现金 */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              现金
            </h3>
            <input
              type="number"
              value={cash}
              onChange={(e) => setCash(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-lg focus:outline-none focus:border-emerald-500"
            />
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
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
              <input
                type="number"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="市值 (USD)"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
              />
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
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {holdings.map((h) => (
                <div key={h.ticker} className="flex items-center gap-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <div className="flex-1">
                    <div className="font-mono font-bold text-white text-sm">{h.ticker}</div>
                    <input
                      type="number"
                      value={h.market_value}
                      onChange={(e) => updateHoldingValue(h.ticker, parseFloat(e.target.value) || 0)}
                      className="w-full mt-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    onClick={() => removeHolding(h.ticker)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
        <div className="lg:col-span-2 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin" />
                <p className="text-slate-400 text-sm">分析中...</p>
              </div>
            </div>
          ) : healthReport ? (
            <>
              {/* 评分卡片 */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-400 mb-2">合规评分</div>
                    <div className="text-6xl font-bold text-white font-mono">
                      {healthReport.compliance_score.toFixed(1)}
                    </div>
                    <div className="text-sm text-slate-500 mt-2">总资产: ${totalValue.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div
                      className="inline-flex items-center justify-center w-24 h-24 rounded-2xl text-4xl font-bold border-4"
                      style={{
                        color: healthReport.grade_color,
                        borderColor: healthReport.grade_color,
                        backgroundColor: `${healthReport.grade_color}20`
                      }}
                    >
                      {healthReport.grade}
                    </div>
                    <div className="text-xs text-slate-400 mt-2 max-w-xs">
                      {healthReport.grade_description}
                    </div>
                  </div>
                </div>
              </div>

              {/* 保守 vs 激进 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
                  <div className="text-sm text-slate-400 mb-2">保守仓位</div>
                  <div className="text-3xl font-bold text-blue-400 font-mono mb-1">
                    {healthReport.conservative_actual.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-500">
                    目标 {healthReport.conservative_target.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
                  <div className="text-sm text-slate-400 mb-2">激进仓位</div>
                  <div className="text-3xl font-bold text-orange-400 font-mono mb-1">
                    {healthReport.aggressive_actual.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-500">
                    目标 {healthReport.aggressive_target.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* 资产评分 */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  资产配置详情
                </h3>
                <div className="space-y-3">
                  {healthReport.asset_scores.map((score) => (
                    <div
                      key={score.category}
                      className={`p-4 rounded-lg border ${
                        score.status_color === 'emerald' ? 'bg-emerald-500/5 border-emerald-500/30' :
                        score.status_color === 'amber' ? 'bg-amber-500/5 border-amber-500/30' :
                        'bg-blue-500/5 border-blue-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white">{score.category_display}</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-300">
                            {score.status}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-white">
                          {score.score.toFixed(1)} / {score.target_weight.toFixed(1)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <div className="text-slate-500">目标</div>
                          <div className="font-mono text-slate-300">
                            {score.target_weight.toFixed(1)}% (${score.target_value.toLocaleString()})
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">实际</div>
                          <div className="font-mono text-slate-300">
                            {score.actual_weight.toFixed(1)}% (${score.actual_value.toLocaleString()})
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">缺口</div>
                          <div className={`font-mono ${score.gap_value > 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                            {score.gap_weight.toFixed(1)}% (${Math.abs(score.gap_value).toLocaleString()})
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 调仓建议 */}
              {healthReport.recommendations.length > 0 && (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    调仓建议
                  </h3>
                  <div className="space-y-2">
                    {healthReport.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                        {rec.includes('✅') ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        )}
                        <span className="text-sm text-slate-300">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">添加持仓后自动分析健康度</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

