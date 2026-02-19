"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Package, AlertTriangle, DollarSign, TrendingDown, RefreshCw, Search, FileUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ProductTable } from "@/components/modules/operations/product-table"
import { useProducts, useCategories, useInventoryStats } from "@/hooks/use-inventory"
import { formatCurrency } from "@/lib/utils"
import { ProductStatus } from "@/types/operations"

import { motion } from "framer-motion"
import { ImportDialog } from "@/components/import/import-dialog"

export default function InventoryPage() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [importOpen, setImportOpen] = useState(false)
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { products, loading, error, refetch, updateProduct, deleteProduct } = useProducts({ 
    search: debouncedSearch 
  })
  const { categories } = useCategories()
  const { stats } = useInventoryStats()

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(id)
    }
  }

  const handleDuplicate = async (id: string) => {
    const original = products.find(p => p.id === id)
    if (original) {
      // For demo mode, this creates a copy
      const { createProduct } = await import("@/services/inventory").then(m => ({ createProduct: m.inventoryService.createProduct }))
      await createProduct({
        ...original,
        sku: `${original.sku}-COPY`,
        name: `${original.name} (Copy)`,
      })
      refetch()
    }
  }

  const handleStatusChange = async (id: string, status: ProductStatus) => {
    await updateProduct(id, { status })
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats?.totalProducts?.toString() || products.length.toString(),
      icon: Package,
      description: `In inventory`,
    },
    {
      title: "Inventory Value",
      value: formatCurrency(stats?.totalValue || products.reduce((sum, p) => sum + (p.stockQuantity * p.costPrice), 0)),
      icon: DollarSign,
      description: "At cost price",
    },
    {
      title: "Low Stock",
      value: (stats?.lowStockCount || products.filter(p => p.stockQuantity <= p.reorderLevel && p.stockQuantity > 0).length).toString(),
      icon: TrendingDown,
      description: "Below reorder level",
      className: (stats?.lowStockCount || 0) > 0 ? "text-orange-500" : "",
    },
    {
      title: "Out of Stock",
      value: (stats?.outOfStockCount || products.filter(p => p.stockQuantity === 0).length).toString(),
      icon: AlertTriangle,
      description: "Needs attention",
      className: (stats?.outOfStockCount || 0) > 0 ? "text-destructive" : "",
    },
  ]

  const categoryOptions = categories.map(c => ({ id: c.id, name: c.name }))

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Demo Mode Banner */}
      { false && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950"
        >
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Demo Mode:</strong> Data is stored in memory. Configure Supabase to enable persistent storage.
          </p>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your product catalog and stock levels
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <FileUp className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={refetch} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/inventory/new">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.className || ""}`}>
                  {loading ? "..." : stat.value}
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              Error loading products: {error.message}
            </div>
          )}

          {/* Loading State */}
          {loading && products.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ProductTable
              products={products}
              categories={categoryOptions}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onStatusChange={handleStatusChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        type="products"
        onSuccess={() => refetch()}
      />
    </div>
  )
}
