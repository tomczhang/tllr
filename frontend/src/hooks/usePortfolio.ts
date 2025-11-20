import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import {
  PortfolioOverview,
  PositionSummary,
  Transaction,
  TransactionCreate,
} from '@/types'

export function usePortfolioOverview() {
  return useQuery({
    queryKey: ['portfolio-overview'],
    queryFn: async () => {
      const response = await api.get<PortfolioOverview>('/portfolio/overview')
      return response.data
    },
  })
}

export function usePositions() {
  return useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const response = await api.get<PositionSummary[]>('/portfolio/positions')
      return response.data
    },
  })
}

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.get<Transaction[]>('/portfolio/transactions')
      return response.data
    },
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TransactionCreate) => {
      const response = await api.post<Transaction>('/portfolio/transactions', data)
      return response.data
    },
    onSuccess: () => {
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: ['portfolio-overview'] })
      queryClient.invalidateQueries({ queryKey: ['positions'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

