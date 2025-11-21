import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import CalculatorPage from './pages/CalculatorPage'
import CalculatorPageV2 from './pages/CalculatorPageV2'
import PortfolioPage from './pages/PortfolioPage'
import NotesPage from './pages/NotesPage'

// Layout
import Layout from './components/layout/Layout'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        {/* 公开路由 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 受保护的路由 */}
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
          <Route path="calculator-v2" element={<CalculatorPageV2 />} />
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

