'use client'

import { useState, useEffect, useCallback } from 'react'
import { purchaseOrdersService } from '@/services/purchase-orders'
import { useAuth } from './use-auth'
import type { PurchaseOrder, POStatus, CreatePOInput, POStats, ReceiveItemInput } from '@/types/purchase-orders'

export function usePurchaseOrders(status?: POStatus) {
  const { organizationId, user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!organizationId || authLoading) return

    setLoading(true)
    setError(null)

    try {
      const data = await purchaseOrdersService.getPurchaseOrders(organizationId, status)
      setOrders(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch purchase orders')
    } finally {
      setLoading(false)
    }
  }, [organizationId, status, authLoading])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const createPO = async (input: CreatePOInput): Promise<PurchaseOrder | null> => {
    if (!organizationId || !user) return null

    const po = await purchaseOrdersService.createPO(organizationId, user.id, input)
    if (po) {
      setOrders(prev => [po, ...prev])
    }
    return po
  }

  const updatePO = async (poId: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder | null> => {
    if (!organizationId) return null

    const updated = await purchaseOrdersService.updatePO(poId, organizationId, updates)
    if (updated) {
      setOrders(prev => prev.map(p => p.id === poId ? updated : p))
    }
    return updated
  }

  const sendPO = async (poId: string): Promise<boolean> => {
    if (!organizationId) return false

    const success = await purchaseOrdersService.sendPO(poId, organizationId)
    if (success) {
      setOrders(prev => prev.map(p => 
        p.id === poId ? { ...p, status: 'sent' as POStatus, sent_at: new Date().toISOString() } : p
      ))
    }
    return success
  }

  const confirmPO = async (poId: string, expectedDate?: string): Promise<boolean> => {
    if (!organizationId) return false

    const success = await purchaseOrdersService.confirmPO(poId, organizationId, expectedDate)
    if (success) {
      setOrders(prev => prev.map(p => 
        p.id === poId ? { ...p, status: 'confirmed' as POStatus, confirmed_at: new Date().toISOString() } : p
      ))
    }
    return success
  }

  const receiveItems = async (poId: string, items: ReceiveItemInput[]): Promise<boolean> => {
    if (!organizationId) return false

    const success = await purchaseOrdersService.receiveItems(poId, organizationId, items)
    if (success) {
      await fetchOrders() // Refresh to get updated status
    }
    return success
  }

  const createBill = async (poId: string): Promise<string | null> => {
    if (!organizationId) return null

    const billId = await purchaseOrdersService.createBill(poId, organizationId)
    if (billId) {
      setOrders(prev => prev.map(p => 
        p.id === poId ? { ...p, status: 'billed' as POStatus, bill_id: billId } : p
      ))
    }
    return billId
  }

  const cancelPO = async (poId: string): Promise<boolean> => {
    if (!organizationId) return false

    const success = await purchaseOrdersService.cancelPO(poId, organizationId)
    if (success) {
      setOrders(prev => prev.map(p => 
        p.id === poId ? { ...p, status: 'cancelled' as POStatus } : p
      ))
    }
    return success
  }

  const deletePO = async (poId: string): Promise<boolean> => {
    if (!organizationId) return false

    const success = await purchaseOrdersService.deletePO(poId, organizationId)
    if (success) {
      setOrders(prev => prev.filter(p => p.id !== poId))
    }
    return success
  }

  return {
    orders,
    loading: loading || authLoading,
    error,
    refetch: fetchOrders,
    createPO,
    updatePO,
    sendPO,
    confirmPO,
    receiveItems,
    createBill,
    cancelPO,
    deletePO,
  }
}

export function usePurchaseOrder(poId: string) {
  const { organizationId, loading: authLoading } = useAuth()
  const [order, setOrder] = useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizationId || !poId || authLoading) return

    setLoading(true)
    purchaseOrdersService.getPurchaseOrder(poId, organizationId)
      .then(data => setOrder(data))
      .finally(() => setLoading(false))
  }, [organizationId, poId, authLoading])

  return { order, loading: loading || authLoading }
}

export function usePOStats() {
  const { organizationId, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<POStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizationId || authLoading) return

    setLoading(true)
    purchaseOrdersService.getPOStats(organizationId)
      .then(data => setStats(data))
      .finally(() => setLoading(false))
  }, [organizationId, authLoading])

  return { stats, loading: loading || authLoading }
}
