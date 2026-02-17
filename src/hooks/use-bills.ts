'use client'

import { useState, useEffect, useCallback } from 'react'
import * as billService from '@/services/bills'
import { useAuth } from '@/components/providers/auth-provider'
import type { 
  Bill, 
  CreateBillInput, 
  UpdateBillInput,
  BillSummary,
  BillStatus
} from '@/types/bills'

export function useBills() {
  const { organizationId, loading: authLoading } = useAuth()
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBills = useCallback(async () => {
    if (!organizationId) {
      setBills([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await billService.getBills(organizationId)
      setBills(data)
    } catch (err) {
      setError('Failed to fetch bills')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    if (authLoading) return
    fetchBills()
  }, [fetchBills, authLoading])

  return {
    data: bills,
    isLoading: loading || authLoading,
    error,
    refetch: fetchBills
  }
}

export function useBill(id: string | undefined) {
  const [bill, setBill] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBill = useCallback(async () => {
    if (!id) {
      setBill(null)
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await billService.getBill(id)
      setBill(data)
    } catch (err) {
      setError('Failed to fetch bill')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchBill()
  }, [fetchBill])

  return {
    data: bill,
    isLoading: loading,
    error,
    refetch: fetchBill
  }
}

export function useBillSummary() {
  const { organizationId, loading: authLoading } = useAuth()
  const [summary, setSummary] = useState<BillSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSummary = useCallback(async () => {
    if (!organizationId) {
      setSummary(null)
      setLoading(false)
      return
    }
    
    try {
      const data = await billService.getBillSummary(organizationId)
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

export function useCreateBill() {
  const { organizationId } = useAuth()
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (input: CreateBillInput): Promise<Bill> => {
    if (!organizationId) throw new Error('No organization')
    setIsPending(true)
    try {
      return await billService.createBill(organizationId, input)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useUpdateBill() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async ({ id, input }: { id: string; input: UpdateBillInput }): Promise<Bill> => {
    setIsPending(true)
    try {
      return await billService.updateBill(id, input)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useUpdateBillStatus() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async ({ id, status }: { id: string; status: BillStatus }): Promise<void> => {
    setIsPending(true)
    try {
      await billService.updateBillStatus(id, status)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useRecordBillPayment() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async ({ id, amount }: { id: string; amount: number }): Promise<void> => {
    setIsPending(true)
    try {
      await billService.recordBillPayment(id, amount)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useDeleteBill() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (id: string): Promise<void> => {
    setIsPending(true)
    try {
      await billService.deleteBill(id)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}
