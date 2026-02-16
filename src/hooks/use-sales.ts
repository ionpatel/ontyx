'use client'

import { useState, useEffect, useCallback } from 'react'
import { salesService, type CreateSalesOrderInput, type SalesStats } from '@/services/sales'
import type { SalesOrder, SalesOrderStatus } from '@/types/operations'
import { useAuth } from './use-auth'

export function useSalesOrders(filters?: {
  status?: SalesOrderStatus
  customerId?: string
  fromDate?: string
  toDate?: string
}) {
  const { organizationId } = useAuth()
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use 'demo' as fallback for demo mode
  const effectiveOrgId = organizationId 

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await salesService.getOrders(effectiveOrgId, filters)
      setOrders(data)
    } catch (err) {
      setError('Failed to fetch orders')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [effectiveOrgId, filters?.status, filters?.customerId, filters?.fromDate, filters?.toDate])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const createOrder = async (input: CreateSalesOrderInput): Promise<SalesOrder | null> => {
    try {
      const order = await salesService.createOrder(input, effectiveOrgId)
      if (order) {
        setOrders(prev => [order, ...prev])
      }
      return order
    } catch (err) {
      console.error('Failed to create order:', err)
      return null
    }
  }

  const updateOrderStatus = async (id: string, status: SalesOrderStatus): Promise<boolean> => {
    try {
      const success = await salesService.updateOrderStatus(id, status, effectiveOrgId)
      if (success) {
        setOrders(prev => prev.map(o => 
          o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o
        ))
      }
      return success
    } catch (err) {
      console.error('Failed to update order status:', err)
      return false
    }
  }

  const searchOrders = async (query: string): Promise<SalesOrder[]> => {
    return salesService.searchOrders(query, effectiveOrgId)
  }

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    createOrder,
    updateOrderStatus,
    searchOrders,
  }
}

export function useSalesOrder(id: string | null) {
  const { organizationId } = useAuth()
  const effectiveOrgId = organizationId 
  const [order, setOrder] = useState<SalesOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setOrder(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    salesService.getOrder(id, effectiveOrgId)
      .then(data => setOrder(data))
      .catch(err => {
        setError('Failed to fetch order')
        console.error(err)
      })
      .finally(() => setLoading(false))
  }, [id, effectiveOrgId])

  return { order, loading, error }
}

export function useSalesStats() {
  const { organizationId } = useAuth()
  const effectiveOrgId = organizationId 
  const [stats, setStats] = useState<SalesStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    salesService.getStats(effectiveOrgId)
      .then(data => setStats(data))
      .catch(err => {
        setError('Failed to fetch stats')
        console.error(err)
      })
      .finally(() => setLoading(false))
  }, [effectiveOrgId])

  return { stats, loading, error }
}
