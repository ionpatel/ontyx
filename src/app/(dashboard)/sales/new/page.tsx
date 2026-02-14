"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Plus, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { mockContacts, mockProducts } from "@/lib/mock-data"
import { formatCurrency } from "@/lib/utils"

interface OrderItem {
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  taxRate: number
  discount: number
}

export default function NewSalesOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [customerId, setCustomerId] = useState("")
  const [shippingMethod, setShippingMethod] = useState("standard")
  const [items, setItems] = useState<OrderItem[]>([])
  const [notes, setNotes] = useState("")
  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "USA",
  })

  const customers = mockContacts.filter(c => c.type === "customer" || c.type === "both")
  const products = mockProducts.filter(p => p.status === "active" && p.stockQuantity > 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    router.push("/sales")
  }

  const addItem = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    
    // Check if already in items
    if (items.some(i => i.productId === productId)) return

    setItems(prev => [...prev, {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: 1,
      unitPrice: product.unitPrice,
      taxRate: product.taxRate,
      discount: 0,
    }])
  }

  const updateItem = (index: number, field: keyof OrderItem, value: number) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((sum, item) => {
    const discountedPrice = item.unitPrice * (1 - item.discount / 100)
    return sum + (discountedPrice * item.quantity)
  }, 0)

  const taxTotal = items.reduce((sum, item) => {
    const discountedPrice = item.unitPrice * (1 - item.discount / 100)
    return sum + (discountedPrice * item.quantity * item.taxRate / 100)
  }, 0)

  const shippingCost = shippingMethod === "express" ? 25 : shippingMethod === "overnight" ? 50 : 10
  const total = subtotal + taxTotal + shippingCost

  const selectedCustomer = customers.find(c => c.id === customerId)

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sales">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Sales Order</h1>
          <p className="text-muted-foreground">Create a new sales order</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Customer Selection */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Customer</CardTitle>
              <CardDescription>Select the customer for this order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select value={customerId} onValueChange={setCustomerId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCustomer && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">{selectedCustomer.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                  {selectedCustomer.phone && (
                    <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Shipping Method</Label>
                <Select value={shippingMethod} onValueChange={setShippingMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard ($10)</SelectItem>
                    <SelectItem value="express">Express ($25)</SelectItem>
                    <SelectItem value="overnight">Overnight ($50)</SelectItem>
                    <SelectItem value="pickup">Customer Pickup (Free)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Street Address *</Label>
              <Input
                placeholder="123 Main St"
                value={shippingAddress.street}
                onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label>City *</Label>
                <Input
                  placeholder="New York"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  placeholder="NY"
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Postal Code *</Label>
                <Input
                  placeholder="10001"
                  value={shippingAddress.postalCode}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Country *</Label>
                <Select
                  value={shippingAddress.country}
                  onValueChange={(value) => setShippingAddress(prev => ({ ...prev, country: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USA">United States</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>Add products to this order</CardDescription>
            </div>
            <Select onValueChange={addItem}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Add product..." />
              </SelectTrigger>
              <SelectContent>
                {products
                  .filter(p => !items.some(i => i.productId === p.id))
                  .map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {formatCurrency(product.unitPrice)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No items added. Select products from the dropdown above.
              </p>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.productId} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground font-mono">{item.sku}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-20">
                        <Label className="text-xs">Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="w-24">
                        <Label className="text-xs">Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="w-20">
                        <Label className="text-xs">Discount %</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) => updateItem(index, "discount", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="w-24 text-right">
                        <Label className="text-xs">Total</Label>
                        <p className="font-medium">
                          {formatCurrency(item.unitPrice * item.quantity * (1 - item.discount / 100))}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div className="flex justify-end pt-4">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span>{formatCurrency(taxTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{formatCurrency(shippingCost)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add any notes for this order..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" asChild>
            <Link href="/sales">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading || items.length === 0 || !customerId}>
            {loading ? "Creating..." : (
              <>
                <Save className="mr-2 h-4 w-4" /> Create Order
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
