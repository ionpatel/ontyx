'use client'

import { useState, useEffect } from 'react'
import { dashboardService, type DashboardStats, type RecentInvoice, type RecentOrder, type RecentActivity } from '@/services/dashboard'
import { useAuth } from './use-auth'

export function useDashboardStats() {
  const { organizationId, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return
    
    // No org = empty stats
    if (!organizationId) {
      setStats(null)
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
  }, [organizationId, authLoading])

  return { stats, loading: loading || authLoading, error }
}

export function useRecentInvoices(limit = 5) {
  const { organizationId, loading: authLoading } = useAuth()
  const [invoices, setInvoices] = useState<RecentInvoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!organizationId) {
      setInvoices([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    dashboardService.getRecentInvoices(organizationId, limit)
      .then(data => setInvoices(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [organizationId, authLoading, limit])

  return { invoices, loading: loading || authLoading }
}

export function useRecentOrders(limit = 5) {
  const { organizationId, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!organizationId) {
      setOrders([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    dashboardService.getRecentOrders(organizationId, limit)
      .then(data => setOrders(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [organizationId, authLoading, limit])

  return { orders, loading: loading || authLoading }
}

export function useRecentActivity(limit = 10) {
  const { organizationId, loading: authLoading } = useAuth()
  const [activity, setActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!organizationId) {
      setActivity([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    dashboardService.getRecentActivity(organizationId, limit)
      .then(data => setActivity(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [organizationId, authLoading, limit])

  return { activity, loading: loading || authLoading }
}
