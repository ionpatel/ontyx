'use client'

import { useState, useEffect } from 'react'
import { dashboardService, type DashboardStats, type RecentInvoice, type RecentOrder, type RecentActivity } from '@/services/dashboard'
import { useAuth } from './use-auth'

export function useDashboardStats() {
  const { organizationId } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId) {
      // Still show demo data when no org
      dashboardService.getStats('demo').then(setStats)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    dashboardService.getStats(organizationId)
      .then(data => setStats(data))
      .catch(err => {
        setError('Failed to fetch dashboard stats')
        console.error(err)
      })
      .finally(() => setLoading(false))
  }, [organizationId])

  return { stats, loading, error }
}

export function useRecentInvoices(limit = 5) {
  const { organizationId } = useAuth()
  const [invoices, setInvoices] = useState<RecentInvoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const orgId = organizationId 
    
    setLoading(true)
    dashboardService.getRecentInvoices(orgId, limit)
      .then(data => setInvoices(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [organizationId, limit])

  return { invoices, loading }
}

export function useRecentOrders(limit = 5) {
  const { organizationId } = useAuth()
  const [orders, setOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const orgId = organizationId 
    
    setLoading(true)
    dashboardService.getRecentOrders(orgId, limit)
      .then(data => setOrders(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [organizationId, limit])

  return { orders, loading }
}

export function useRecentActivity(limit = 10) {
  const { organizationId } = useAuth()
  const [activity, setActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const orgId = organizationId 
    
    setLoading(true)
    dashboardService.getRecentActivity(orgId, limit)
      .then(data => setActivity(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [organizationId, limit])

  return { activity, loading }
}
