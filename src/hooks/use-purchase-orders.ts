'use client'

import { useState, useEffect, useCallback } from 'react'
import * as purchaseOrderService from '@/services/purchase-orders'
import { useAuth } from '@/components/providers/auth-provider'
import type { 
  PurchaseOrder, 
  CreatePurchaseOrderInput, 
  UpdatePurchaseOrderInput,
  PurchaseOrderSummary,
  OrderStatus
} from '@/types/purchase-orders'

export function usePurchaseOrders() {
  const { organizationId, loading: authLoading } = useAuth()
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPurchaseOrders = useCallback(async () => {
    if (!organizationId) {
      setPurchaseOrders([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await purchaseOrderService.getPurchaseOrders(organizationId)
      setPurchaseOrders(data)
    } catch (err) {
      setError('Failed to fetch purchase orders')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    if (authLoading) return
    fetchPurchaseOrders()
  }, [fetchPurchaseOrders, authLoading])

  return {
    data: purchaseOrders,
    isLoading: loading || authLoading,
    error,
    refetch: fetchPurchaseOrders
  }
}

export function usePurchaseOrder(id: string | undefined) {
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPurchaseOrder = useCallback(async () => {
    if (!id) {
      setPurchaseOrder(null)
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await purchaseOrderService.getPurchaseOrder(id)
      setPurchaseOrder(data)
    } catch (err) {
      setError('Failed to fetch purchase order')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchPurchaseOrder()
  }, [fetchPurchaseOrder])

  return {
    data: purchaseOrder,
    isLoading: loading,
    error,
    refetch: fetchPurchaseOrder
  }
}

export function usePurchaseOrderSummary() {
  const { organizationId, loading: authLoading } = useAuth()
  const [summary, setSummary] = useState<PurchaseOrderSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSummary = useCallback(async () => {
    if (!organizationId) {
      setSummary(null)
      setLoading(false)
      return
    }
    
    try {
      const data = await purchaseOrderService.getPurchaseOrderSummary(organizationId)
      setSummary(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    if (authLoading) return
    fetchSummary()
  }, [fetchSummary, authLoading])

  return { data: summary, isLoading: loading }
}

export function useCreatePurchaseOrder() {
  const { organizationId } = useAuth()
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (input: CreatePurchaseOrderInput): Promise<PurchaseOrder> => {
    if (!organizationId) throw new Error('No organization')
    setIsPending(true)
    try {
      return await purchaseOrderService.createPurchaseOrder(organizationId, input)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useUpdatePurchaseOrder() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async ({ id, input }: { id: string; input: UpdatePurchaseOrderInput }): Promise<PurchaseOrder> => {
    setIsPending(true)
    try {
      return await purchaseOrderService.updatePurchaseOrder(id, input)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useUpdatePurchaseOrderStatus() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async ({ id, status }: { id: string; status: OrderStatus }): Promise<void> => {
    setIsPending(true)
    try {
      await purchaseOrderService.updatePurchaseOrderStatus(id, status)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useReceiveItems() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async ({ 
    purchaseOrderId, 
    items 
  }: { 
    purchaseOrderId: string
    items: { item_id: string; quantity_received: number }[] 
  }): Promise<void> => {
    setIsPending(true)
    try {
      await purchaseOrderService.receiveItems(purchaseOrderId, items)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useDeletePurchaseOrder() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (id: string): Promise<void> => {
    setIsPending(true)
    try {
      await purchaseOrderService.deletePurchaseOrder(id)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useConvertToBill() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (purchaseOrderId: string): Promise<string> => {
    setIsPending(true)
    try {
      return await purchaseOrderService.convertToBill(purchaseOrderId)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}
