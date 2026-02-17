'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  reportsService, 
  type DateRange,
  type ProfitAndLossReport,
  type BalanceSheetReport,
  type TaxSummaryReport,
  type AccountsAgingReport 
} from '@/services/reports'
import { useAuth } from './use-auth'

export function useProfitAndLoss(dateRange: DateRange) {
  const { organizationId, loading: authLoading } = useAuth()
  const [report, setReport] = useState<ProfitAndLossReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = useCallback(async () => {
    if (!organizationId || authLoading) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await reportsService.getProfitAndLoss(organizationId, dateRange)
      setReport(data)
    } catch (err) {
      setError('Failed to generate P&L report')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId, dateRange.startDate, dateRange.endDate, authLoading])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  return { report, loading: loading || authLoading, error, refetch: fetchReport }
}

export function useBalanceSheet(asOfDate: string) {
  const { organizationId, loading: authLoading } = useAuth()
  const [report, setReport] = useState<BalanceSheetReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId || authLoading) return
    
    setLoading(true)
    setError(null)
    
    reportsService.getBalanceSheet(organizationId, asOfDate)
      .then(data => setReport(data))
      .catch(err => {
        setError('Failed to generate Balance Sheet')
        console.error(err)
      })
      .finally(() => setLoading(false))
  }, [organizationId, asOfDate, authLoading])

  return { report, loading: loading || authLoading, error }
}

export function useTaxSummary(dateRange: DateRange) {
  const { organizationId, loading: authLoading } = useAuth()
  const [report, setReport] = useState<TaxSummaryReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId || authLoading) return
    
    setLoading(true)
    setError(null)
    
    reportsService.getTaxSummary(organizationId, dateRange)
      .then(data => setReport(data))
      .catch(err => {
        setError('Failed to generate Tax Summary')
        console.error(err)
      })
      .finally(() => setLoading(false))
  }, [organizationId, dateRange.startDate, dateRange.endDate, authLoading])

  return { report, loading: loading || authLoading, error }
}

export function useAccountsAging(asOfDate: string) {
  const { organizationId, loading: authLoading } = useAuth()
  const [report, setReport] = useState<AccountsAgingReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId || authLoading) return
    
    setLoading(true)
    setError(null)
    
    reportsService.getAccountsAging(organizationId, asOfDate)
      .then(data => setReport(data))
      .catch(err => {
        setError('Failed to generate Aging Report')
        console.error(err)
      })
      .finally(() => setLoading(false))
  }, [organizationId, asOfDate, authLoading])

  return { report, loading: loading || authLoading, error }
}

export function useFinancialSummary() {
  const { organizationId, loading: authLoading } = useAuth()
  const [summary, setSummary] = useState<{
    totalRevenue: number
    totalExpenses: number
    netIncome: number
    accountsReceivable: number
    cashOnHand: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizationId || authLoading) return
    
    setLoading(true)
    
    reportsService.getFinancialSummary(organizationId)
      .then(data => setSummary(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [organizationId, authLoading])

  return { summary, loading: loading || authLoading }
}
