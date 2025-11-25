import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'  // 首页：只读展示
import CalculatorPage from './pages/CalculatorPage'
import PortfolioPage from './pages/PortfolioPage'  // 我的持仓：完整管理
import NotesPage from './pages/NotesPage'

// Layout
import Layout from './components/layout/Layout'

function App() {
  // const { isAuthenticated } = useAuthStore()
  
  // 🔓 临时跳过登录验证（开发模式）
  const isAuthenticated = true

  return (
    <BrowserRouter>
      <Routes>
        {/* 公开路由 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 受保护的路由 - 临时移除验证 */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Layout />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="calculator" element={<CalculatorPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="notes" element={<NotesPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

