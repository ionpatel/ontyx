'use client'

import { useState, useEffect, useCallback } from 'react'
import { inventoryService } from '@/services/inventory'
import { useAuth } from '@/hooks/use-auth'
import type { Product, ProductCategory, StockMovement, StockMovementType } from '@/types/operations'

// ============================================================================
// USE PRODUCTS HOOK
// ============================================================================

interface UseProductsOptions {
  search?: string
  categoryId?: string
  status?: string
  limit?: number
  initialLoad?: boolean
}

export function useProducts(options: UseProductsOptions = {}) {
  const { organizationId } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await inventoryService.getProducts({
        ...options,
        organizationId: organizationId || undefined,
      })
      setProducts(result.data)
      setCount(result.count)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch products'))
    } finally {
      setLoading(false)
    }
  }, [options.search, options.categoryId, options.status, options.limit, organizationId])

  useEffect(() => {
    if (options.initialLoad !== false) {
      fetchProducts()
    }
  }, [fetchProducts, options.initialLoad])

  const createProduct = async (product: Partial<Product>) => {
    const newProduct = await inventoryService.createProduct(product, organizationId || undefined)
    setProducts(prev => [newProduct, ...prev])
    setCount(prev => prev + 1)
    return newProduct
  }

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const updated = await inventoryService.updateProduct(id, updates, organizationId || undefined)
    setProducts(prev => prev.map(p => p.id === id ? updated : p))
    return updated
  }

  const deleteProduct = async (id: string) => {
    await inventoryService.deleteProduct(id, organizationId || undefined)
    setProducts(prev => prev.filter(p => p.id !== id))
    setCount(prev => prev - 1)
  }

  return {
    products,
    count,
    loading,
    error,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  }
}

// ============================================================================
// USE PRODUCT HOOK (Single product)
// ============================================================================

export function useProduct(id: string) {
  const { organizationId } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true)
        const data = await inventoryService.getProduct(id, organizationId || undefined)
        setProduct(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch product'))
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id, organizationId])

  const update = async (updates: Partial<Product>) => {
    const updated = await inventoryService.updateProduct(id, updates, organizationId || undefined)
    setProduct(updated)
    return updated
  }

  return { product, loading, error, update }
}

// ============================================================================
// USE CATEGORIES HOOK
// ============================================================================

export function useCategories() {
  const { organizationId } = useAuth()
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true)
        const data = await inventoryService.getCategories(organizationId || undefined)
        setCategories(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch categories'))
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [organizationId])

  const createCategory = async (category: Partial<ProductCategory>) => {
    const newCategory = await inventoryService.createCategory(category, organizationId || undefined)
    setCategories(prev => [...prev, newCategory])
    return newCategory
  }

  return { categories, loading, error, createCategory }
}

// ============================================================================
// USE STOCK MOVEMENTS HOOK
// ============================================================================

export function useStockMovements(productId?: string) {
  const { organizationId } = useAuth()
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true)
      const data = await inventoryService.getStockMovements(productId, organizationId || undefined)
      setMovements(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch movements'))
    } finally {
      setLoading(false)
    }
  }, [productId, organizationId])

  useEffect(() => {
    fetchMovements()
  }, [fetchMovements])

  const createMovement = async (movement: {
    productId: string
    warehouseId: string
    type: StockMovementType
    quantity: number
    reference?: string
    notes?: string
  }) => {
    const newMovement = await inventoryService.createStockMovement(movement, organizationId || undefined)
    setMovements(prev => [newMovement, ...prev])
    return newMovement
  }

  return { movements, loading, error, refetch: fetchMovements, createMovement }
}

// ============================================================================
// USE INVENTORY STATS HOOK
// ============================================================================

export function useInventoryStats() {
  const { organizationId } = useAuth()
  const [stats, setStats] = useState<{
    totalProducts: number
    totalValue: number
    lowStockCount: number
    outOfStockCount: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true)
        const data = await inventoryService.getInventoryStats(organizationId || undefined)
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch stats'))
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [organizationId])

  return { stats, loading, error }
}

// ============================================================================
// USE WAREHOUSES HOOK
// ============================================================================

export function useWarehouses() {
  const { organizationId } = useAuth()
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true)
        const data = await inventoryService.getWarehouses(organizationId || undefined)
        setWarehouses(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch warehouses'))
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [organizationId])

  return { warehouses, loading, error }
}
