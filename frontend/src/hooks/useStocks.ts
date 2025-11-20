import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { AnalysisResult, StockInfo } from '@/types'

export function useAnalyzeStock() {
  return useMutation({
    mutationFn: async (symbol: string) => {
      const response = await api.post<AnalysisResult>('/stocks/analyze', { symbol })
      return response.data
    },
  })
}

export function useStockInfo(symbol: string) {
  return useQuery({
    queryKey: ['stock-info', symbol],
    queryFn: async () => {
      const response = await api.get<StockInfo>(`/stocks/${symbol}/info`)
      return response.data
    },
    enabled: !!symbol,
  })
}

export function useStockPrice(symbol: string) {
  return useQuery({
    queryKey: ['stock-price', symbol],
    queryFn: async () => {
      const response = await api.get<{ symbol: string; price: number }>(`/stocks/${symbol}/price`)
      return response.data
    },
    enabled: !!symbol,
    refetchInterval: 60000, // 每分钟刷新一次
  })
}

