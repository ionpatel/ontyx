"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, Plus, Trash2, Loader2, Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { usePurchaseOrders, useVendors } from "@/hooks/use-purchases"
import { useProducts } from "@/hooks/use-inventory"
import type { CreatePurchaseOrderInput, CreatePurchaseOrderItemInput } from "@/services/purchases"
import { useToast } from "@/components/ui/toast"

export default function NewPurchaseOrderPage() {
  const router = useRouter()
  const { createOrder } = usePurchaseOrders()
  const { vendors } = useVendors()
  const { products } = useProducts()
  const { success, error: showError } = useToast()

  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    contactId: '',
    vendorRef: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    notes: '',
  })

  const [items, setItems] = useState<CreatePurchaseOrderItemInput[]>([
    { description: '', quantity: 1, unitPrice: 0, taxRate: 13 }
  ])

  const addItem = () => {
    setItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0, taxRate: 13 }])
  }

  const updateItem = (index: number, field: keyof CreatePurchaseOrderItemInput, value: any) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const removeItem = (index: number) => {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const selectProduct = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    
    setItems(prev => prev.map((item, i) => 
      i === index ? {
        ...item,
        productId,
        description: product.name,
        unitPrice: product.costPrice || 0,
      } : item
    ))
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  }

  const calculateTax = () => {
    return items.reduce((sum, item) => {
      const lineTotal = item.quantity * item.unitPrice
      return sum + (lineTotal * ((item.taxRate || 0) / 100))
    }, 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  const handleSubmit = async (asDraft = true) => {
    if (!form.contactId) {
      showError('Missing Vendor', 'Please select a vendor')
      return
    }
    
    if (items.every(item => !item.description)) {
      showError('Missing Items', 'Please add at least one item')
      return
    }

    setSaving(true)
    
    const input: CreatePurchaseOrderInput = {
      contactId: form.contactId,
      vendorRef: form.vendorRef || undefined,
      orderDate: form.orderDate,
      expectedDate: form.expectedDate || undefined,
      notes: form.notes || undefined,
      items: items.filter(item => item.description),
    }
    
    const order = await createOrder(input)
    setSaving(false)

    if (order) {
      success('Purchase Order Created', `Order ${order.orderNumber} has been created`)
      router.push(`/purchases/${order.id}`)
    } else {
      showError('Error', 'Failed to create purchase order')
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/purchases">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Purchase Order</h1>
          <p className="text-muted-foreground">Create an order to a vendor</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vendor & Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Vendor *</Label>
                  <Select
                    value={form.contactId || 'none'}
                    onValueChange={(v) => setForm(f => ({ ...f, contactId: v === 'none' ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select vendor...</SelectItem>
                      {vendors.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {vendors.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No vendors found. <Link href="/contacts" className="text-primary hover:underline">Add a vendor contact</Link> first.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Vendor Reference</Label>
                  <Input
                    value={form.vendorRef}
                    onChange={(e) => setForm(f => ({ ...f, vendorRef: e.target.value }))}
                    placeholder="Quote #, PO ref, etc."
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Order Date</Label>
                  <Input
                    type="date"
                    value={form.orderDate}
                    onChange={(e) => setForm(f => ({ ...f, orderDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expected Delivery</Label>
                  <Input
                    type="date"
                    value={form.expectedDate}
                    onChange={(e) => setForm(f => ({ ...f, expectedDate: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>Add products or services to this order</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Item</TableHead>
                    <TableHead className="w-[100px]">Qty</TableHead>
                    <TableHead className="w-[120px]">Unit Price</TableHead>
                    <TableHead className="w-[80px]">Tax %</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="space-y-2">
                          <Select
                            value={item.productId || 'custom'}
                            onValueChange={(v) => v !== 'custom' && selectProduct(index, v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="custom">Custom item</SelectItem>
                              {products.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.sku && `[${p.sku}] `}{p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder="Description"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPrice || ''}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.5"
                          value={item.taxRate || ''}
                          onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                          placeholder="13"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button variant="outline" size="sm" onClick={addItem} className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notes for the vendor..."
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>{formatCurrency(calculateTax())}</span>
              </div>
              <div className="border-t pt-4 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-lg">{formatCurrency(calculateTotal())}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button 
              className="w-full" 
              onClick={() => handleSubmit(true)}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save as Draft
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              asChild
            >
              <Link href="/purchases">Cancel</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
