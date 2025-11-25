import { useState, useEffect } from 'react'
import { Shield, TrendingUp, Activity, AlertTriangle, CheckCircle, Target, BarChart3 } from 'lucide-react'
import axios from 'axios'

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

export default function DashboardPage() {
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cash, setCash] = useState(0)
  const [holdingsCount, setHoldingsCount] = useState(0)

  useEffect(() => {
    loadAndAnalyze()
  }, [])

  const loadAndAnalyze = async () => {
    setIsLoading(true)
    try {
      // 1. 加载持仓数据
      const holdingsResponse = await axios.get('/api/v1/portfolio/holdings')
      const holdings = holdingsResponse.data.holdings || []
      const cashAmount = holdingsResponse.data.cash || 0
      
      setCash(cashAmount)
      setHoldingsCount(holdings.length)

      // 2. 如果有持仓，进行分析
      if (holdings.length > 0 || cashAmount > 0) {
        const analysisResponse = await axios.post('/api/v1/portfolio/health/analyze', {
          cash: cashAmount,
          holdings
        })
        setHealthReport(analysisResponse.data)
      } else {
        setHealthReport(null)
      }
    } catch (error) {
      console.error('加载失败:', error)
      setHealthReport(null)
    } finally {
      setIsLoading(false)
    }
  }

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

  if (!healthReport) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="max-w-md text-center">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-800/50 border border-slate-700">
            <Shield className="h-10 w-10 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">还没有持仓数据</h3>
          <p className="text-slate-400 text-sm mb-4">
            前往<span className="text-emerald-400">"我的持仓"</span>添加持仓数据，
            系统将自动分析您的资产配置健康度
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-emerald-400" />
          <h2 className="text-2xl font-bold text-white">持仓健康度</h2>
        </div>
        <div className="text-sm text-slate-400">
          持仓数量: {holdingsCount} | 现金: ${cash.toLocaleString()}
        </div>
      </div>

      {/* 评分卡片 */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 合规评分 */}
          <div className="text-center">
            <div className="text-sm text-slate-400 mb-3">合规评分</div>
            <div className="text-7xl font-bold text-white font-mono mb-2">
              {healthReport.compliance_score.toFixed(1)}
            </div>
            <div className="text-xs text-slate-500">满分 100</div>
          </div>

          {/* 评级 */}
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm text-slate-400 mb-3">配置评级</div>
              <div
                className="inline-flex items-center justify-center w-32 h-32 rounded-2xl text-6xl font-bold border-4 mb-3"
                style={{
                  color: healthReport.grade_color,
                  borderColor: healthReport.grade_color,
                  backgroundColor: `${healthReport.grade_color}20`
                }}
              >
                {healthReport.grade}
              </div>
              <div className="text-xs text-slate-400 max-w-xs">
                {healthReport.grade_description}
              </div>
            </div>
          </div>

          {/* 总资产 */}
          <div className="text-center">
            <div className="text-sm text-slate-400 mb-3">总资产</div>
            <div className="text-5xl font-bold text-white font-mono mb-2">
              ${healthReport.total_value.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">USD</div>
          </div>
        </div>
      </div>

      {/* 保守 vs 激进仓位 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white">保守仓位</h3>
            </div>
            <span className="text-xs text-slate-500">目标 {healthReport.conservative_target.toFixed(0)}%</span>
          </div>
          <div className="flex items-end gap-3 mb-3">
            <div className="text-4xl font-bold text-blue-400 font-mono">
              {healthReport.conservative_actual.toFixed(1)}%
            </div>
            <div className={`text-sm font-mono mb-1 ${
              Math.abs(healthReport.conservative_actual - healthReport.conservative_target) < 5
                ? 'text-emerald-400'
                : 'text-amber-400'
            }`}>
              {healthReport.conservative_actual >= healthReport.conservative_target ? '+' : ''}
              {(healthReport.conservative_actual - healthReport.conservative_target).toFixed(1)}%
            </div>
          </div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
              style={{ width: `${Math.min(healthReport.conservative_actual, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-400" />
              <h3 className="text-sm font-bold text-white">激进仓位</h3>
            </div>
            <span className="text-xs text-slate-500">目标 {healthReport.aggressive_target.toFixed(0)}%</span>
          </div>
          <div className="flex items-end gap-3 mb-3">
            <div className="text-4xl font-bold text-orange-400 font-mono">
              {healthReport.aggressive_actual.toFixed(1)}%
            </div>
            <div className={`text-sm font-mono mb-1 ${
              Math.abs(healthReport.aggressive_actual - healthReport.aggressive_target) < 5
                ? 'text-emerald-400'
                : 'text-amber-400'
            }`}>
              {healthReport.aggressive_actual >= healthReport.aggressive_target ? '+' : ''}
              {(healthReport.aggressive_actual - healthReport.aggressive_target).toFixed(1)}%
            </div>
          </div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-400"
              style={{ width: `${Math.min(healthReport.aggressive_actual, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 资产配置详情 */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
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
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white">{score.category_display}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    score.status_color === 'emerald' ? 'bg-emerald-500/20 text-emerald-300' :
                    score.status_color === 'amber' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}>
                    {score.status}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 mb-1">得分</div>
                  <span className="font-mono font-bold text-white text-lg">
                    {score.score.toFixed(1)} / {score.target_weight.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* 进度条 */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>实际配置</span>
                  <span>{score.actual_weight.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
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

              {/* 详细数据 */}
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-slate-500 mb-1">目标金额</div>
                  <div className="font-mono text-slate-300">
                    ${score.target_value.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">实际金额</div>
                  <div className="font-mono text-slate-300">
                    ${score.actual_value.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">缺口</div>
                  <div className={`font-mono ${score.gap_value > 0 ? 'text-amber-400' : score.gap_value < 0 ? 'text-blue-400' : 'text-emerald-400'}`}>
                    {score.gap_value > 0 ? '-' : score.gap_value < 0 ? '+' : ''}${Math.abs(score.gap_value).toLocaleString()}
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
            <Target className="w-4 h-4 text-emerald-400" />
            调仓建议
          </h3>
          <div className="space-y-2">
            {healthReport.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-4 rounded-lg border ${
                  rec.includes('✅')
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-amber-500/5 border-amber-500/30'
                }`}
              >
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

      {/* 提示信息 */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            <span className="font-semibold text-blue-300">提示：</span>
            前往<span className="text-emerald-400 font-semibold">"我的持仓"</span>页面可以编辑和管理您的持仓数据
          </div>
        </div>
      </div>
    </div>
  )
}
