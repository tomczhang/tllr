import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, Calculator, Briefcase, BookOpen, LogOut, TrendingUp } from 'lucide-react'
import { useLogout } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'

export default function Layout() {
  const location = useLocation()
  const logout = useLogout()
  const user = useAuthStore((state) => state.user)

  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/calculator', icon: Calculator, label: '建仓计算器' },
    { path: '/portfolio', icon: Briefcase, label: '我的持仓' },
    { path: '/notes', icon: BookOpen, label: '投资笔记' },
  ]

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header - 暗黑专业风格 */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">贪婪猎人</h1>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Greedy Hunter</p>
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.username || '投资者'}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">退出</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation - 暗黑标签式导航 */}
        <nav className="mb-8">
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-glow-emerald'
                      : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main>
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-xs text-slate-500 uppercase tracking-wider">
            从理性决策开始，成为更好的投资者 · Powered by AI
          </p>
        </div>
      </footer>
    </div>
  )
}
