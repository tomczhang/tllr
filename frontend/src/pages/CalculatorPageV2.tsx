/**
 * 建仓计算器 V2 - 8分制质量评分系统
 */

import { useState } from 'react'
import { Search, TrendingUp, AlertTriangle, Target, BarChart3, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
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
    gross_margin: null,
    roe: null,
    financial_safety: null,
    shareholder_returns: null,
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
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-3 mb-8">
        <BarChart3 className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">建仓计算器 V2</h2>
        <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30">
          8分制评分
        </span>
      </div>

      {/* 输入表单 */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-white mb-4">1. 基础信息</h3>
        
        {/* 股票代码 */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">股票代码</label>
          <div className="relative">
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="如: AAPL, 600519.SS"
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          </div>
        </div>

        {/* 内在估值 */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            内在估值价格 
            <span className="text-slate-500 ml-2">（根据您的认知填写）</span>
          </label>
          <input
            type="number"
            value={intrinsicValue}
            onChange={(e) => setIntrinsicValue(Number(e.target.value))}
            placeholder="您认为的合理价格"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-mono"
          />
        </div>

        <div className="border-t border-slate-700 pt-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            2. 半自动化指标 
            <span className="text-sm text-slate-400 ml-2 font-normal">（可选，留空将使用系统建议）</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <CheckboxField
              label="毛利率 >40%"
              checked={confirmations.gross_margin}
              onChange={(val) => setConfirmations({...confirmations, gross_margin: val})}
            />
            <CheckboxField
              label="ROE >15%"
              checked={confirmations.roe}
              onChange={(val) => setConfirmations({...confirmations, roe: val})}
            />
            <CheckboxField
              label="财务安全（现金>负债）"
              checked={confirmations.financial_safety}
              onChange={(val) => setConfirmations({...confirmations, financial_safety: val})}
            />
            <CheckboxField
              label="股东回报（有分红/回购）"
              checked={confirmations.shareholder_returns}
              onChange={(val) => setConfirmations({...confirmations, shareholder_returns: val})}
            />
          </div>
        </div>

        <div className="border-t border-slate-700 pt-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            3. 完全人工指标 
            <span className="text-sm text-red-400 ml-2 font-normal">（必填）</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <BooleanField
              label="行业地位（是否老大/双寡头）"
              checked={confirmations.industry_dominance}
              onChange={(val) => setConfirmations({...confirmations, industry_dominance: val})}
            />
            <BooleanField
              label="护城河（是否有高转换成本）"
              checked={confirmations.moat}
              onChange={(val) => setConfirmations({...confirmations, moat: val})}
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-emerald-600 text-white font-medium rounded-lg shadow-lg hover:shadow-glow-emerald disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 text-lg"
        >
          <span>{isAnalyzing ? '分析中...' : '开始分析'}</span>
        </button>
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* 分析结果 */}
      {result && (
        <div className="space-y-6">
          {/* 质量评估 */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-emerald-400" />
              质量评估
            </h3>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className={`text-4xl font-bold ${getTierColor(result.quality_assessment.tier)}`}>
                {result.quality_assessment.tier}级
              </div>
              <div>
                <div className="text-lg text-slate-300">{result.quality_assessment.tier_description}</div>
                <div className="text-sm text-slate-500">
                  总分: {result.quality_assessment.total_score}/8 | 品质系数: {result.quality_assessment.quality_coefficient}
                </div>
              </div>
            </div>

            {/* 完全自动化指标 */}
            <MetricsSection title="完全自动化（2项）" metrics={result.quality_assessment.hard_metrics} />
            
            {/* 半自动化指标 */}
            <MetricsSection title="半自动化（4项）" metrics={result.quality_assessment.assisted_metrics} assisted />
            
            {/* 完全人工指标 */}
            <MetricsSection title="完全人工（2项）" metrics={result.quality_assessment.soft_metrics} soft />
          </div>

          {/* 定价分析 */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-4">定价分析</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <PriceCard label="内在估值" value={result.pricing.intrinsic_value} />
              <PriceCard label="安全建仓价" value={result.pricing.safe_buy_price} highlight />
              <PriceCard label="当前价格" value={result.pricing.current_price} current />
            </div>
            <div className={`p-4 rounded-lg ${result.pricing.price_gap_percent <= 0 ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <p className={result.pricing.price_gap_percent <= 0 ? 'text-emerald-300' : 'text-red-300'}>
                {result.pricing.verdict}
              </p>
            </div>
          </div>

          {/* 技术分析 */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-4">技术分析</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-slate-400">MA50</div>
                <div className="text-xl font-mono text-white">${result.technical_analysis.ma50.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">MA200</div>
                <div className="text-xl font-mono text-white">${result.technical_analysis.ma200.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">交易方式</div>
                <div className="text-lg text-white">{result.technical_analysis.trading_side}</div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
              <p className="text-slate-300 text-sm">{result.technical_analysis.max_drawdown_warning}</p>
            </div>
          </div>

          {/* 金字塔策略 */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-4">金字塔网格策略</h3>
            <div className="space-y-2">
              {result.pyramid_strategy.map((level: any, idx: number) => (
                <PyramidLevel key={idx} level={level} />
              ))}
            </div>
          </div>

          {/* 建议和风险 */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-3">💡 投资建议</h3>
              <p className="text-slate-300 whitespace-pre-line text-sm">{result.recommendation}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-3">⚠️ 风险警示</h3>
              <p className="text-slate-300 whitespace-pre-line text-sm">{result.risk_warning}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// === 辅助组件 ===

function CheckboxField({ label, checked, onChange }: { label: string, checked: boolean | null, onChange: (val: boolean | null) => void }) {
  return (
    <div className="flex items-center space-x-3 p-3 bg-slate-900/30 rounded-lg border border-slate-700">
      <div className="flex space-x-2">
        <button
          onClick={() => onChange(true)}
          className={`p-2 rounded ${checked === true ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onChange(false)}
          className={`p-2 rounded ${checked === false ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400'}`}
        >
          <XCircle className="w-4 h-4" />
        </button>
        <button
          onClick={() => onChange(null)}
          className={`p-2 rounded ${checked === null ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
      <span className="text-sm text-slate-300">{label}</span>
    </div>
  )
}

function BooleanField({ label, checked, onChange }: { label: string, checked: boolean, onChange: (val: boolean) => void }) {
  return (
    <div className="flex items-center space-x-3 p-3 bg-slate-900/30 rounded-lg border border-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 rounded border-slate-600 text-emerald-600 focus:ring-emerald-500"
      />
      <span className="text-sm text-slate-300">{label}</span>
    </div>
  )
}

function MetricsSection({ title, metrics, assisted, soft }: any) {
  return (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-slate-400 mb-2">{title}</h4>
      <div className="space-y-2">
        {metrics.map((m: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg border border-slate-700">
            <div className="flex-1">
              <div className="text-white">{m.name}</div>
              <div className="text-xs text-slate-500">
                {m.value_display} | 阈值: {m.threshold}
              </div>
              {assisted && (
                <div className="text-xs text-slate-600 mt-1">
                  系统建议: {m.system_suggestion ? '✅ 通过' : '❌ 未通过'} | 
                  用户确认: {m.user_confirmed ? '✅ 是' : '❌ 否'}
                </div>
              )}
            </div>
            <div className={`px-3 py-1 rounded text-sm font-bold ${m.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {m.points}分
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PriceCard({ label, value, highlight, current }: any) {
  return (
    <div className={`p-4 rounded-lg ${highlight ? 'bg-emerald-500/10 border-2 border-emerald-500/50' : current ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-slate-900/30 border border-slate-700'}`}>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={`text-2xl font-mono font-bold ${highlight ? 'text-emerald-400' : current ? 'text-blue-400' : 'text-white'}`}>
        ${value.toFixed(2)}
      </div>
    </div>
  )
}

function PyramidLevel({ level }: any) {
  const isTriggered = level.description.includes('已触发')
  return (
    <div className={`flex items-center justify-between p-4 rounded-lg ${isTriggered ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-900/30 border border-slate-700'}`}>
      <div className="flex items-center space-x-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isTriggered ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
          {level.level}
        </div>
        <div>
          <div className="text-white font-medium">{level.description}</div>
          <div className="text-sm text-slate-400">仓位: {(level.percentage * 100).toFixed(0)}%</div>
        </div>
      </div>
      <div className="text-xl font-mono text-white">${level.price.toFixed(2)}</div>
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

