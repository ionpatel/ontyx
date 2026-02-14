"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Edit, Trash2, Package, DollarSign, BarChart3,
  Clock, Tag, Box, AlertTriangle, CheckCircle, History
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { mockProducts, mockStockMovements } from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const product = mockProducts.find(p => p.id === params.id)
  const movements = mockStockMovements.filter(m => m.productId === params.id)

  if (!product) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Product not found</h2>
          <p className="text-muted-foreground">The product you&apos;re looking for doesn&apos;t exist.</p>
          <Button asChild className="mt-4">
            <Link href="/inventory">Back to Inventory</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this product?")) {
      router.push("/inventory")
    }
  }

  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= product.reorderLevel
  const margin = ((product.unitPrice - product.costPrice) / product.unitPrice * 100).toFixed(1)

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
              <Badge variant={product.status === "active" ? "default" : product.status === "out_of_stock" ? "destructive" : "secondary"}>
                {product.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-muted-foreground">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/inventory/${product.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Level</CardTitle>
            {isLowStock ? (
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            ) : (
              <Package className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isLowStock ? "text-orange-500" : ""}`}>
              {product.stockQuantity} {product.unit}
            </div>
            <p className="text-xs text-muted-foreground">
              Reorder at: {product.reorderLevel}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unit Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(product.unitPrice)}</div>
            <p className="text-xs text-muted-foreground">
              Cost: {formatCurrency(product.costPrice)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(product.stockQuantity * product.costPrice)}
            </div>
            <p className="text-xs text-muted-foreground">At cost price</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-500">{margin}%</div>
            <p className="text-xs text-muted-foreground">
              Profit: {formatCurrency(product.unitPrice - product.costPrice)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Product Info */}
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SKU</span>
                    <span className="font-mono">{product.sku}</span>
                  </div>
                  {product.barcode && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Barcode</span>
                      <span className="font-mono">{product.barcode}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span>{product.categoryName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unit</span>
                    <span>{product.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax Rate</span>
                    <span>{product.taxRate}%</span>
                  </div>
                  {product.tags && product.tags.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-muted-foreground">Tags</span>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {product.tags.map(tag => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Inventory & Dimensions */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Stock</span>
                    <span className="font-medium">{product.stockQuantity} {product.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reorder Level</span>
                    <span>{product.reorderLevel} {product.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reorder Quantity</span>
                    <span>{product.reorderQuantity} {product.unit}</span>
                  </div>
                  {product.weight && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Weight</span>
                        <span>{product.weight} kg</span>
                      </div>
                    </>
                  )}
                  {product.dimensions && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dimensions (L×W×H)</span>
                      <span>
                        {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} cm
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {product.description && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{product.description}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Stock Movement History</CardTitle>
              <CardDescription>Track all stock changes for this product</CardDescription>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <div className="flex flex-col items-center py-8">
                  <History className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No stock movements recorded</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Stock After</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map(movement => (
                      <TableRow key={movement.id}>
                        <TableCell>{formatDate(movement.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant={movement.type === "in" ? "default" : movement.type === "out" ? "secondary" : "outline"}>
                            {movement.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{movement.warehouseName}</TableCell>
                        <TableCell className={`text-right font-medium ${movement.type === "in" ? "text-green-500" : movement.type === "out" ? "text-red-500" : ""}`}>
                          {movement.type === "in" ? "+" : movement.type === "out" ? "-" : ""}{Math.abs(movement.quantity)}
                        </TableCell>
                        <TableCell className="text-right">{movement.newStock}</TableCell>
                        <TableCell className="font-mono text-sm">{movement.reference || "-"}</TableCell>
                        <TableCell>{movement.createdBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Timestamps */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          Created: {formatDate(product.createdAt)}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          Updated: {formatDate(product.updatedAt)}
        </div>
      </div>
    </div>
  )
}
