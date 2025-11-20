// 用户相关类型
export interface User {
  id: string
  email: string
  username: string | null
  risk_preference: string | null
  created_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  username?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

// 股票相关类型
export interface StockInfo {
  symbol: string
  company_name: string | null
  sector: string | null
  market_cap: number | null
  current_price: number
}

export interface ScoreDetail {
  score: string
  reason: string
  points: number
}

export interface PyramidLevel {
  level: number
  price: number
  percentage: number
  description: string
}

export interface AnalysisResult {
  symbol: string
  stock_info: StockInfo
  current_price: number
  overall_score: string
  score_details: ScoreDetail[]
  max_drawdown: number
  max_drawdown_date: string
  safe_buy_price: number
  discount_rate: number
  pyramid_strategy: PyramidLevel[]
  recommendation: string
  risk_warning: string
}

// 持仓相关类型
export interface Transaction {
  id: string
  user_id: string
  symbol: string
  type: 'BUY' | 'SELL'
  price: string
  quantity: string
  trade_date: string
  note_id: string | null
  created_at: string
}

export interface TransactionCreate {
  symbol: string
  type: 'BUY' | 'SELL'
  price: number
  quantity: number
  trade_date: string
  note_content?: string
}

export interface PositionSummary {
  symbol: string
  company_name: string | null
  total_quantity: string
  avg_cost: string
  current_price: number
  market_value: number
  unrealized_pnl: number
  unrealized_pnl_percent: number
  safe_buy_price: number | null
  deviation_percent: number | null
  warning_message: string | null
}

export interface PortfolioOverview {
  total_positions: number
  total_market_value: number
  total_cost: number
  total_pnl: number
  total_pnl_percent: number
  positions: PositionSummary[]
  sector_allocation: Record<string, number>
  top_holdings: PositionSummary[]
}

// 笔记相关类型
export interface Note {
  id: string
  user_id: string
  content: string
  symbol: string | null
  tags: string[]
  created_at: string
  updated_at: string | null
}

export interface NoteCreate {
  content: string
  symbol?: string
  tags?: string[]
}

export interface NoteUpdate {
  content?: string
  symbol?: string
  tags?: string[]
}

