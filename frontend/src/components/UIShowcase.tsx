/**
 * 贪婪猎人 UI 组件展示
 * 这个文件展示了所有设计系统中定义的组件样式
 * 供开发者参考和复制使用
 */

import { TrendingUp, TrendingDown, Activity, AlertCircle, CheckCircle, Info } from 'lucide-react'

export default function UIShowcase() {
  return (
    <div className="min-h-screen bg-slate-900 p-8 space-y-12">
      {/* Page Header */}
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">
          贪婪猎人 UI 设计系统
        </h1>
        <p className="text-slate-400 text-sm uppercase tracking-wider">
          Greedy Hunter Design System Showcase
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-12">
        {/* ========== 1. 色彩系统 ========== */}
        <section>
          <h2 className="section-title text-lg mb-6">
            <Activity className="section-title-icon" />
            色彩系统 (Color Palette)
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 背景色 */}
            <div className="space-y-2">
              <div className="h-24 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center">
                <span className="text-xs font-mono text-slate-400">#0f172a</span>
              </div>
              <p className="text-sm text-slate-300">Slate 900 - 主背景</p>
            </div>
            
            <div className="space-y-2">
              <div className="h-24 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center">
                <span className="text-xs font-mono text-slate-400">#1e293b</span>
              </div>
              <p className="text-sm text-slate-300">Slate 800 - 卡片背景</p>
            </div>
            
            {/* 功能色 */}
            <div className="space-y-2">
              <div className="h-24 bg-emerald-500 rounded-xl flex items-center justify-center">
                <span className="text-xs font-mono text-white">#10b981</span>
              </div>
              <p className="text-sm text-slate-300">Emerald 500 - 成功/买入</p>
            </div>
            
            <div className="space-y-2">
              <div className="h-24 bg-red-400 rounded-xl flex items-center justify-center">
                <span className="text-xs font-mono text-white">#f87171</span>
              </div>
              <p className="text-sm text-slate-300">Red 400 - 危险/卖出</p>
            </div>
            
            <div className="space-y-2">
              <div className="h-24 bg-blue-400 rounded-xl flex items-center justify-center">
                <span className="text-xs font-mono text-white">#60a5fa</span>
              </div>
              <p className="text-sm text-slate-300">Blue 400 - 信息/科技</p>
            </div>
            
            <div className="space-y-2">
              <div className="h-24 bg-purple-300 rounded-xl flex items-center justify-center">
                <span className="text-xs font-mono text-slate-900">#d8b4fe</span>
              </div>
              <p className="text-sm text-slate-300">Purple 300 - 强调色</p>
            </div>
          </div>
        </section>

        {/* ========== 2. 卡片组件 ========== */}
        <section>
          <h2 className="section-title text-lg mb-6">
            卡片组件 (Card Components)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 数据卡片 */}
            <div className="card-data">
              <div className="card-data-header">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                总市值
              </div>
              <div className="card-data-value">$150,250.00</div>
              <span className="badge-success">+12.5%</span>
            </div>
            
            {/* 玻璃卡片 */}
            <div className="card-glass p-6">
              <h3 className="section-title mb-4">
                <Activity className="section-title-icon text-blue-400" />
                玻璃面板效果
              </h3>
              <p className="text-slate-300 text-sm">
                半透明背景 + 模糊效果，营造现代科技感
              </p>
            </div>
            
            {/* 光晕卡片 - 成功 */}
            <div className="card-glass p-6 border-emerald-500/50 shadow-glow-emerald glow-wrapper glow-success">
              <h3 className="section-title mb-4">
                <CheckCircle className="section-title-icon text-emerald-400" />
                成功状态光晕
              </h3>
              <div className="text-3xl font-bold text-emerald-400 font-mono">
                贪婪时刻
              </div>
            </div>
            
            {/* 光晕卡片 - 危险 */}
            <div className="card-glass p-6 border-red-500/50 shadow-glow-red glow-wrapper glow-danger">
              <h3 className="section-title mb-4">
                <AlertCircle className="section-title-icon text-red-400" />
                危险状态光晕
              </h3>
              <div className="text-3xl font-bold text-red-400 font-mono">
                太贵了
              </div>
            </div>
          </div>
        </section>

        {/* ========== 3. 标签系统 ========== */}
        <section>
          <h2 className="section-title text-lg mb-6">
            标签系统 (Badges & Tags)
          </h2>
          
          <div className="card-glass p-6 space-y-4">
            <div className="flex flex-wrap gap-3">
              <span className="badge-success">成功/买入</span>
              <span className="badge-danger">危险/卖出</span>
              <span className="badge-info">信息/科技</span>
              <span className="badge-neutral">中性/默认</span>
              <span className="badge-accent">强调/紫色</span>
            </div>
            
            {/* 带图标的标签 */}
            <div className="flex flex-wrap gap-3">
              <span className="badge-success flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                盈利中
              </span>
              <span className="badge-danger flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                亏损中
              </span>
              <span className="badge-info flex items-center gap-1">
                <Info className="w-3 h-3" />
                信息提示
              </span>
            </div>
          </div>
        </section>

        {/* ========== 4. 按钮系统 ========== */}
        <section>
          <h2 className="section-title text-lg mb-6">
            按钮系统 (Buttons)
          </h2>
          
          <div className="card-glass p-6 space-y-4">
            <div className="flex flex-wrap gap-4">
              <button className="btn-primary">
                主要按钮 (Primary)
              </button>
              <button className="btn-secondary">
                次要按钮 (Secondary)
              </button>
              <button className="btn-danger">
                危险按钮 (Danger)
              </button>
              <button className="btn-ghost">
                幽灵按钮 (Ghost)
              </button>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button className="btn-primary" disabled>
                禁用状态
              </button>
              <button className="btn-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                带图标按钮
              </button>
            </div>
          </div>
        </section>

        {/* ========== 5. 输入框 ========== */}
        <section>
          <h2 className="section-title text-lg mb-6">
            输入框 (Input Fields)
          </h2>
          
          <div className="card-glass p-6 space-y-4">
            <div>
              <label className="section-title text-xs mb-2">
                标准输入框
              </label>
              <input 
                type="text" 
                className="input-dark"
                placeholder="输入股票代码..."
              />
            </div>
            
            <div>
              <label className="section-title text-xs mb-2">
                带图标输入框
              </label>
              <div className="relative">
                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input 
                  type="text" 
                  className="input-dark input-dark-with-icon"
                  placeholder="AAPL, TSLA, 600519.SS..."
                />
              </div>
            </div>
          </div>
        </section>

        {/* ========== 6. 数据表格 ========== */}
        <section>
          <h2 className="section-title text-lg mb-6">
            数据表格 (Data Table)
          </h2>
          
          <div className="card-glass overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header text-left px-6">股票代码</th>
                  <th className="table-header text-left px-6">公司名称</th>
                  <th className="table-header text-right px-6">当前价格</th>
                  <th className="table-header text-right px-6">涨跌幅</th>
                </tr>
              </thead>
              <tbody>
                <tr className="table-row">
                  <td className="table-cell font-mono font-bold text-white">AAPL</td>
                  <td className="table-cell">苹果公司</td>
                  <td className="table-cell text-right font-mono">$150.25</td>
                  <td className="table-cell text-right">
                    <span className="badge-success">+2.5%</span>
                  </td>
                </tr>
                <tr className="table-row">
                  <td className="table-cell font-mono font-bold text-white">TSLA</td>
                  <td className="table-cell">特斯拉</td>
                  <td className="table-cell text-right font-mono">$245.80</td>
                  <td className="table-cell text-right">
                    <span className="badge-danger">-1.2%</span>
                  </td>
                </tr>
                <tr className="table-row">
                  <td className="table-cell font-mono font-bold text-white">600519.SS</td>
                  <td className="table-cell">贵州茅台</td>
                  <td className="table-cell text-right font-mono">¥1,850.00</td>
                  <td className="table-cell text-right">
                    <span className="badge-success">+0.8%</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ========== 7. 排版示例 ========== */}
        <section>
          <h2 className="section-title text-lg mb-6">
            排版系统 (Typography)
          </h2>
          
          <div className="card-glass p-6 space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                H1 巨型标题 (4XL)
              </h1>
              <p className="text-slate-400 text-sm">用于页面主标题</p>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                H2 页面标题 (2XL)
              </h2>
              <p className="text-slate-400 text-sm">用于区块标题</p>
            </div>
            
            <div>
              <div className="section-title mb-2">
                卡片标题 (Uppercase, Tracking Wider)
              </div>
              <p className="text-slate-400 text-sm">全大写，字间距加宽，营造专业仪表盘感</p>
            </div>
            
            <div>
              <div className="text-3xl font-bold text-emerald-400 font-mono mb-2">
                $150,250.50
              </div>
              <p className="text-slate-400 text-sm">数值显示使用 font-mono (等宽字体)</p>
            </div>
            
            <div>
              <p className="text-sm text-slate-300 mb-2">
                正文文本 (Text SM, Slate 300)
              </p>
              <p className="text-xs text-slate-500">
                辅助文本 (Text XS, Slate 500)
              </p>
            </div>
          </div>
        </section>

        {/* ========== 8. 代码示例 ========== */}
        <section>
          <h2 className="section-title text-lg mb-6">
            快速复制代码
          </h2>
          
          <div className="card-glass p-6 space-y-4">
            <div>
              <h3 className="text-white font-bold mb-2">玻璃卡片</h3>
              <pre className="bg-slate-900 p-4 rounded-lg text-xs text-emerald-400 overflow-x-auto">
{`<div className="bg-slate-800/50 backdrop-blur-sm rounded-xl 
     border border-slate-700 p-6 hover:bg-slate-800 transition-all">
  <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-4">
    标题
  </h3>
  <div className="text-3xl font-bold text-white font-mono">
    $150.25
  </div>
</div>`}
              </pre>
            </div>
            
            <div>
              <h3 className="text-white font-bold mb-2">输入框带聚焦光晕</h3>
              <pre className="bg-slate-900 p-4 rounded-lg text-xs text-emerald-400 overflow-x-auto">
{`<input 
  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 
             rounded-lg text-white placeholder:text-slate-500
             focus:ring-2 focus:ring-emerald-500 focus:border-transparent
             transition-all"
  placeholder="输入内容..."
/>`}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

