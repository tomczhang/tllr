import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, Calculator, Briefcase, BookOpen, LogOut } from 'lucide-react'
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary">🎯</span>
              <h1 className="text-xl font-bold text-gray-900">贪婪猎人</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.username || user?.email}</span>
              <button
                onClick={logout}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
                <span>退出</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <nav className="mb-8">
          <div className="flex space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
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
    </div>
  )
}

