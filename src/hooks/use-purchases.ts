'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  purchasesService, 
  type PurchaseOrder, 
  type OrderStatus,
  type CreatePurchaseOrderInput,
  type PurchaseStats
} from '@/services/purchases'
import { useAuth } from './use-auth'

export function usePurchaseOrders(filters?: {
  status?: OrderStatus
  contactId?: string
  startDate?: string
  endDate?: string
}) {
  const { organizationId, user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!organizationId || authLoading) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await purchasesService.getPurchaseOrders(organizationId, filters)
      setOrders(data)
    } catch (err) {
      setError('Failed to fetch purchase orders')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId, filters?.status, filters?.contactId, filters?.startDate, filters?.endDate, authLoading])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const createOrder = async (input: CreatePurchaseOrderInput): Promise<PurchaseOrder | null> => {
    if (!organizationId || !user) return null
    
    try {
      const order = await purchasesService.createPurchaseOrder(input, organizationId, user.id)
      if (order) {
        setOrders(prev => [order, ...prev])
      }
      return order
    } catch (err) {
      console.error('Failed to create purchase order:', err)
      return null
    }
  }

  const updateOrder = async (id: string, input: Partial<CreatePurchaseOrderInput>): Promise<PurchaseOrder | null> => {
    if (!organizationId) return null
    
    try {
      const updated = await purchasesService.updatePurchaseOrder(id, input, organizationId)
      if (updated) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updated } : o))
      }
      return updated
    } catch (err) {
      console.error('Failed to update purchase order:', err)
      return null
    }
  }

  const updateStatus = async (id: string, status: OrderStatus): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      const success = await purchasesService.updateStatus(id, status, organizationId, user?.id)
      if (success) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
      }
      return success
    } catch (err) {
      console.error('Failed to update status:', err)
      return false
    }
  }

  const receiveItems = async (id: string, items: { itemId: string; quantityReceived: number }[]): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      const success = await purchasesService.receiveItems(id, items, organizationId)
      if (success) {
        // Refetch to get updated status
        fetchOrders()
      }
      return success
    } catch (err) {
      console.error('Failed to receive items:', err)
      return false
    }
  }

  const deleteOrder = async (id: string): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      const success = await purchasesService.deletePurchaseOrder(id, organizationId)
      if (success) {
        setOrders(prev => prev.filter(o => o.id !== id))
      }
      return success
    } catch (err) {
      console.error('Failed to delete purchase order:', err)
      return false
    }
  }

  return {
    orders,
    loading: loading || authLoading,
    error,
    refetch: fetchOrders,
    createOrder,
    updateOrder,
    updateStatus,
    receiveItems,
    deleteOrder,
  }
}

export function usePurchaseOrder(id: string | null) {
  const { organizationId, loading: authLoading } = useAuth()
  const [order, setOrder] = useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !organizationId || authLoading) {
      setOrder(null)
      setLoading(false)
      return
    }
    
    setLoading(true)
    
    purchasesService.getPurchaseOrder(id, organizationId)
      .then(data => setOrder(data))
      .catch(err => {
        setError('Failed to fetch purchase order')
        console.error(err)
      })
      .finally(() => setLoading(false))
  }, [id, organizationId, authLoading])

  return { order, loading: loading || authLoading, error }
}

export function usePurchaseStats() {
  const { organizationId, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<PurchaseStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizationId || authLoading) return
    
    setLoading(true)
    
    purchasesService.getStats(organizationId)
      .then(data => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [organizationId, authLoading])

  return { stats, loading: loading || authLoading }
}

export function useVendors() {
  const { organizationId, loading: authLoading } = useAuth()
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizationId || authLoading) return
    
    setLoading(true)
    
    purchasesService.getVendors(organizationId)
      .then(data => setVendors(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [organizationId, authLoading])

  return { vendors, loading: loading || authLoading }
}
