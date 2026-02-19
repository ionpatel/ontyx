'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Trash2, Save, Send, Loader2,
  Building2, Calendar, Truck, DollarSign, Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { usePurchaseOrders } from '@/hooks/use-purchase-orders'
import { useContacts } from '@/hooks/use-contacts'
import { useProducts } from '@/hooks/use-products'
import { formatCurrency, cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'

interface LineItem {
  id: string
  product_id?: string
  description: string
  quantity: number
  unit_price: number
  tax_rate: number
}

export default function NewPurchaseOrderPage() {
  const router = useRouter()
  const { createPO, sendPO } = usePurchaseOrders()
  const { contacts } = useContacts()
  const { products } = useProducts()
  const { success, error: showError } = useToast()

  const [saving, setSaving] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<string>('')
  const [formData, setFormData] = useState({
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    shipping: 0,
    shippingMethod: '',
    notes: '',
    internalNotes: '',
  })

  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0, tax_rate: 13 }
  ])

  const vendors = contacts.filter(c => c.isVendor)
  const vendor = vendors.find(v => v.id === selectedVendor)

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  const taxTotal = items.reduce((sum, item) => {
    const base = item.quantity * item.unit_price
    return sum + (base * item.tax_rate / 100)
  }, 0)
  const shipping = formData.shipping || 0
  const total = subtotal + taxTotal + shipping

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: '', quantity: 1, unit_price: 0, tax_rate: 13 }
    ])
  }

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const addProductToOrder = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    setItems([
      ...items,
      {
        id: Date.now().toString(),
        product_id: productId,
        description: product.name,
        quantity: 1,
        unit_price: product.costPrice || 0,
        tax_rate: 13,
      }
    ])
  }

  const handleSave = async (sendAfterSave: boolean = false) => {
    if (!selectedVendor) {
      showError('Missing Vendor', 'Please select a vendor')
      return
    }
    if (items.filter(i => i.description && i.unit_price > 0).length === 0) {
      showError('No Items', 'Please add at least one item')
      return
    }

    setSaving(true)

    const po = await createPO({
      vendor_id: selectedVendor,
      vendor_name: vendor?.displayName || '',
      vendor_email: vendor?.email,
      order_date: formData.orderDate,
      expected_date: formData.expectedDate || undefined,
      shipping: shipping,
      shipping_method: formData.shippingMethod || undefined,
      notes: formData.notes || undefined,
      internal_notes: formData.internalNotes || undefined,
      items: items.filter(i => i.description && i.unit_price > 0).map(item => ({
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
      })),
    })

    if (po) {
      if (sendAfterSave) {
        await sendPO(po.id)
        success('Order Sent', `${po.po_number} has been sent to ${vendor?.email}`)
      } else {
        success('Order Saved', `${po.po_number} has been saved as draft`)
      }
      router.push('/purchases')
    } else {
      showError('Error', 'Failed to create purchase order')
    }

    setSaving(false)
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
        <div className="flex-1">
          <h1 className="text-2xl font-bold">New Purchase Order</h1>
          <p className="text-muted-foreground">
            Order products or services from a vendor
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Save & Send
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vendor Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Vendor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a vendor..." />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.displayName} {v.email && `(${v.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {vendors.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  No vendors found. <Link href="/contacts?new=true&type=vendor" className="text-primary hover:underline">Add a vendor</Link>
                </p>
              )}

              {vendor && (
                <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium">{vendor.displayName}</p>
                  {vendor.email && <p>{vendor.email}</p>}
                  {vendor.phone && <p>{vendor.phone}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Order Date</Label>
                  <Input
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => setFormData(f => ({ ...f, orderDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expected Delivery</Label>
                  <Input
                    type="date"
                    value={formData.expectedDate}
                    onChange={(e) => setFormData(f => ({ ...f, expectedDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Shipping Method</Label>
                  <Select 
                    value={formData.shippingMethod} 
                    onValueChange={(v) => setFormData(f => ({ ...f, shippingMethod: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Shipping</SelectItem>
                      <SelectItem value="express">Express Shipping</SelectItem>
                      <SelectItem value="overnight">Overnight</SelectItem>
                      <SelectItem value="pickup">Pickup</SelectItem>
                      <SelectItem value="freight">Freight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Shipping Cost</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.shipping || ''}
                    onChange={(e) => setFormData(f => ({ ...f, shipping: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Items
                </CardTitle>
                {products.length > 0 && (
                  <Select onValueChange={addProductToOrder}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Add from catalog..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.slice(0, 20).map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} - {formatCurrency(p.costPrice || 0)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Description</TableHead>
                    <TableHead className="w-[10%]">Qty</TableHead>
                    <TableHead className="w-[15%]">Unit Price</TableHead>
                    <TableHead className="w-[15%]">Tax</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const base = item.quantity * item.unit_price
                    const tax = base * (item.tax_rate / 100)
                    const amount = base + tax

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder="Item description"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                            className="w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price || ''}
                            onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={item.tax_rate.toString()} 
                            onValueChange={(v) => updateItem(item.id, 'tax_rate', parseFloat(v))}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">No Tax</SelectItem>
                              <SelectItem value="5">GST 5%</SelectItem>
                              <SelectItem value="13">HST 13%</SelectItem>
                              <SelectItem value="15">HST 15%</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(amount)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <Button variant="outline" onClick={addItem} className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Add Line Item
              </Button>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Notes for Vendor</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any special instructions..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Internal Notes (not sent to vendor)</Label>
                <Textarea
                  value={formData.internalNotes}
                  onChange={(e) => setFormData(f => ({ ...f, internalNotes: e.target.value }))}
                  placeholder="Notes for your team..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(taxTotal)}</span>
                </div>
                {shipping > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{formatCurrency(shipping)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span>{items.filter(i => i.description).length}</span>
                </div>
                {formData.expectedDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected</span>
                    <span>{formData.expectedDate}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Workflow */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm">📦 Purchase Workflow</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>1. Create & send PO to vendor</p>
              <p>2. Vendor confirms the order</p>
              <p>3. Receive items when delivered</p>
              <p>4. Create bill for payment</p>
              <p>5. Pay the vendor</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
