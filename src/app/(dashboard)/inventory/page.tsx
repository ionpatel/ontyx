"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Package, AlertTriangle, DollarSign, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductTable } from "@/components/modules/operations/product-table"
import { mockProducts, mockProductCategories, getInventorySummary } from "@/lib/mock-data"
import { formatCurrency } from "@/lib/utils"
import { Product, ProductStatus } from "@/types/operations"

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const summary = getInventorySummary()

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts(prev => prev.filter(p => p.id !== id))
    }
  }

  const handleDuplicate = (id: string) => {
    const original = products.find(p => p.id === id)
    if (original) {
      const duplicated: Product = {
        ...original,
        id: crypto.randomUUID(),
        sku: `${original.sku}-COPY`,
        name: `${original.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setProducts(prev => [duplicated, ...prev])
    }
  }

  const handleStatusChange = (id: string, status: ProductStatus) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
      )
    )
  }

  const stats = [
    {
      title: "Total Products",
      value: products.length.toString(),
      icon: Package,
      description: `${products.filter(p => p.isActive).length} active`,
    },
    {
      title: "Inventory Value",
      value: formatCurrency(products.reduce((sum, p) => sum + (p.stockQuantity * p.costPrice), 0)),
      icon: DollarSign,
      description: "At cost price",
    },
    {
      title: "Low Stock",
      value: products.filter(p => p.stockQuantity <= p.reorderLevel && p.stockQuantity > 0).length.toString(),
      icon: TrendingDown,
      description: "Below reorder level",
      className: summary.lowStock > 0 ? "text-orange-500" : "",
    },
    {
      title: "Out of Stock",
      value: products.filter(p => p.stockQuantity === 0).length.toString(),
      icon: AlertTriangle,
      description: "Needs immediate attention",
      className: summary.outOfStock > 0 ? "text-destructive" : "",
    },
  ]

  const categories = mockProductCategories.map(c => ({ id: c.id, name: c.name }))

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your product catalog and stock levels
          </p>
        </div>
        <Button asChild>
          <Link href="/inventory/new">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.className || ""}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Product Table */}
      <Card>
        <CardContent className="pt-6">
          <ProductTable
            products={products}
            categories={categories}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onStatusChange={handleStatusChange}
          />
        </CardContent>
      </Card>
    </div>
  )
}
