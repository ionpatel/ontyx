'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { useCreateBill } from '@/hooks/use-bills'
import { useContacts } from '@/hooks/use-contacts'
import { useProducts } from '@/hooks/use-inventory'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'

interface LineItem {
  id: string
  product_id?: string
  description: string
  quantity: number
  unit_price: number
  tax_rate: number
}

export default function NewBillPage() {
  const router = useRouter()
  const toast = useToast()
  const { data: contacts = [] } = useContacts()
  const { data: products = [] } = useProducts()
  const createMutation = useCreateBill()
  
  // Filter to vendors only
  const vendors = contacts.filter(c => c.type === 'vendor' || c.type === 'both')
  
  // Form state
  const [contactId, setContactId] = useState('')
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [vendorRef, setVendorRef] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0, tax_rate: 13 }
  ])
  
  // Add new line item
  const addItem = () => {
    setItems([
      ...items,
      { 
        id: String(Date.now()), 
        description: '', 
        quantity: 1, 
        unit_price: 0, 
        tax_rate: 13 
      }
    ])
  }
  
  // Update line item
  const updateItem = (id: string, field: keyof LineItem, value: unknown) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }
  
  // Remove line item
  const removeItem = (id: string) => {
    if (items.length === 1) return
    setItems(items.filter(item => item.id !== id))
  }
  
  // Select product
  const selectProduct = (itemId: string, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      setItems(items.map(item =>
        item.id === itemId
          ? {
              ...item,
              product_id: productId,
              description: product.name,
              unit_price: product.costPrice || 0
            }
          : item
      ))
    }
  }
  
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const taxAmount = items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unit_price
    return sum + lineTotal * (item.tax_rate / 100)
  }, 0)
  const total = subtotal + taxAmount
  
  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!contactId) {
      toast.error('Please select a vendor')
      return
    }
    
    if (items.some(item => !item.description || item.quantity <= 0)) {
      toast.error('Please fill in all line items')
      return
    }
    
    try {
      const bill = await createMutation.mutateAsync({
        contact_id: contactId,
        bill_date: billDate,
        due_date: dueDate || undefined,
        vendor_ref: vendorRef || undefined,
        notes: notes || undefined,
        items: items.map(item => ({
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate
        }))
      })
      
      toast.success('Bill created')
      router.push(`/bills/${bill.id}`)
    } catch (error) {
      toast.error('Failed to create bill')
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/bills">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Bill</h1>
          <p className="text-muted-foreground">
            Enter a bill from your vendor
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vendor Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Vendor Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor *</Label>
                  <Select value={contactId} onValueChange={setContactId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No vendors found
                        </SelectItem>
                      ) : (
                        vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendorRef">Vendor Invoice #</Label>
                  <Input
                    id="vendorRef"
                    placeholder="e.g., INV-12345"
                    value={vendorRef}
                    onChange={(e) => setVendorRef(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billDate">Bill Date *</Label>
                  <Input
                    id="billDate"
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Line Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Line Items</CardTitle>
                  <CardDescription>Add expenses from this bill</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Line
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Description</TableHead>
                      <TableHead className="w-[100px]">Qty</TableHead>
                      <TableHead className="w-[120px]">Unit Price</TableHead>
                      <TableHead className="w-[100px]">Tax %</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const lineTotal = item.quantity * item.unit_price * (1 + item.tax_rate / 100)
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="space-y-2">
                              {products.length > 0 && (
                                <Select
                                  value={item.product_id || 'none'}
                                  onValueChange={(v) => v !== 'none' && selectProduct(item.id, v)}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Select product..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Custom item</SelectItem>
                                    {products.map((p) => (
                                      <SelectItem key={p.id} value={p.id}>
                                        {p.sku ? `[${p.sku}] ` : ''}{p.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              <Input
                                placeholder="Item description"
                                value={item.description}
                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                required
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                              required
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateItem(item.id, 'unit_price', Number(e.target.value))}
                              required
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={item.tax_rate}
                              onChange={(e) => updateItem(item.id, 'tax_rate', Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(lineTotal, 'CAD')}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                              disabled={items.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add any notes for this bill..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bill Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal, 'CAD')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(taxAmount, 'CAD')}</span>
                </div>
                <div className="border-t pt-4 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(total, 'CAD')}</span>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex flex-col gap-2">
              <Button type="submit" size="lg" disabled={createMutation.isPending}>
                <Receipt className="mr-2 h-4 w-4" />
                {createMutation.isPending ? 'Creating...' : 'Create Bill'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/bills">Cancel</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
