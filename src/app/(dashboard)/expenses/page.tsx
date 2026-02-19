"use client"

import { useState, useRef } from "react"
import { 
  Receipt, Plus, Search, MoreHorizontal, Upload,
  DollarSign, Clock, CheckCircle, XCircle, Loader2,
  Edit, Trash2, Send, Eye, Download, Filter, Calendar, FileUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, cn } from "@/lib/utils"
import { useExpenses, useExpenseCategories, useExpenseStats } from "@/hooks/use-expenses"
import type { CreateExpenseInput, ExpenseStatus, PaymentMethod } from "@/services/expenses"
import { useToast } from "@/components/ui/toast"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { ImportDialog } from "@/components/import/import-dialog"

const statusConfig: Record<ExpenseStatus, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600', icon: Edit },
  submitted: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  reimbursed: { label: 'Reimbursed', color: 'bg-blue-100 text-blue-700', icon: DollarSign },
  cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-500', icon: XCircle },
}

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'personal', label: 'Personal Card/Cash' },
  { value: 'company_card', label: 'Company Card' },
  { value: 'cash', label: 'Cash Advance' },
  { value: 'petty_cash', label: 'Petty Cash' },
]

export default function ExpensesPage() {
  const { organizationId } = useAuth()
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'all'>('all')
  const { expenses, loading, createExpense, updateExpense, submitExpense, approveExpense, rejectExpense, reimburseExpense, deleteExpense, refetch } = useExpenses(
    statusFilter === 'all' ? undefined : { status: statusFilter }
  )
  const { categories } = useExpenseCategories()
  const { stats } = useExpenseStats()
  const { success, error: showError } = useToast()

  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [showEdit, setShowEdit] = useState<string | null>(null)
  const [showReject, setShowReject] = useState<string | null>(null)
  const [showReimburse, setShowReimburse] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [reimburseMethod, setReimburseMethod] = useState('payroll')
  const [reimburseRef, setReimburseRef] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<CreateExpenseInput>({
    description: '',
    merchant: '',
    expenseDate: new Date().toISOString().split('T')[0],
    subtotal: 0,
    gstHstAmount: 0,
    pstAmount: 0,
    tipAmount: 0,
    paymentMethod: 'personal',
    isBillable: false,
  })

  const resetForm = () => {
    setForm({
      description: '',
      merchant: '',
      expenseDate: new Date().toISOString().split('T')[0],
      subtotal: 0,
      gstHstAmount: 0,
      pstAmount: 0,
      tipAmount: 0,
      paymentMethod: 'personal',
      isBillable: false,
    })
  }

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = 
      exp.description.toLowerCase().includes(search.toLowerCase()) ||
      exp.merchant?.toLowerCase().includes(search.toLowerCase()) ||
      exp.expenseNumber?.toLowerCase().includes(search.toLowerCase())
    
    return matchesSearch
  })

  const calculateTotal = () => {
    return (form.subtotal || 0) + 
           (form.gstHstAmount || 0) + 
           (form.pstAmount || 0) + 
           (form.tipAmount || 0)
  }

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !organizationId) return
    
    setUploading(true)
    
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const fileName = `${organizationId}/${Date.now()}.${ext}`
      
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, file)
      
      if (error) throw error
      
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName)
      
      setForm(f => ({ ...f, receiptUrl: publicUrl }))
      success('Receipt Uploaded', 'Receipt attached to expense')
    } catch (err) {
      console.error('Upload error:', err)
      showError('Upload Failed', 'Could not upload receipt')
    } finally {
      setUploading(false)
    }
  }

  const handleCreate = async () => {
    if (!form.description || !form.subtotal) {
      showError('Missing Info', 'Please enter description and amount')
      return
    }

    setSaving(true)
    const expense = await createExpense(form)
    setSaving(false)

    if (expense) {
      success('Expense Added', 'Your expense has been saved as draft')
      setShowAdd(false)
      resetForm()
    } else {
      showError('Error', 'Failed to create expense')
    }
  }

  const handleUpdate = async () => {
    if (!showEdit) return

    setSaving(true)
    const updated = await updateExpense(showEdit, form)
    setSaving(false)

    if (updated) {
      success('Expense Updated', 'Changes saved')
      setShowEdit(null)
      resetForm()
    } else {
      showError('Error', 'Failed to update expense')
    }
  }

  const handleSubmit = async (id: string) => {
    const ok = await submitExpense(id)
    if (ok) {
      success('Submitted', 'Expense submitted for approval')
    }
  }

  const handleApprove = async (id: string) => {
    const ok = await approveExpense(id)
    if (ok) {
      success('Approved', 'Expense has been approved')
    }
  }

  const handleReject = async () => {
    if (!showReject || !rejectReason) return
    
    const ok = await rejectExpense(showReject, rejectReason)
    if (ok) {
      success('Rejected', 'Expense has been rejected')
      setShowReject(null)
      setRejectReason('')
    }
  }

  const handleReimburse = async () => {
    if (!showReimburse) return
    
    const ok = await reimburseExpense(showReimburse, reimburseMethod, reimburseRef)
    if (ok) {
      success('Reimbursed', 'Expense marked as reimbursed')
      setShowReimburse(null)
      setReimburseMethod('payroll')
      setReimburseRef('')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    
    const ok = await deleteExpense(id)
    if (ok) {
      success('Deleted', 'Expense removed')
    }
  }

  const openEdit = (exp: typeof expenses[0]) => {
    setForm({
      categoryId: exp.categoryId,
      description: exp.description,
      merchant: exp.merchant || '',
      expenseDate: exp.expenseDate,
      location: exp.location || '',
      subtotal: exp.subtotal,
      gstHstAmount: exp.gstHstAmount,
      pstAmount: exp.pstAmount,
      tipAmount: exp.tipAmount,
      vendorTaxNumber: exp.vendorTaxNumber || '',
      paymentMethod: exp.paymentMethod,
      isBillable: exp.isBillable,
      receiptUrl: exp.receiptUrl || '',
      notes: exp.notes || '',
    })
    setShowEdit(exp.id)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track and manage business expenses
          </p>
        </div>
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <FileUp className="mr-2 h-4 w-4" /> Import
        </Button>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Expense
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalExpenses || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats?.pendingApproval || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.totalAmountPending || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.approvedThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.totalAmountApproved || 0)} to reimburse
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reimbursed</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.reimbursedThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="reimbursed">Reimbursed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Expenses List */}
      <Card>
        <CardContent className="p-0">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Expenses</h3>
              <p className="text-muted-foreground mb-6">
                {search || statusFilter !== 'all'
                  ? 'No expenses match your filters'
                  : 'Add your first expense to get started'}
              </p>
              {!search && statusFilter === 'all' && (
                <Button onClick={() => setShowAdd(true)}>
                  <Plus className="mr-2 h-4 w-4" /> New Expense
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((exp) => {
                  const status = statusConfig[exp.status]
                  const StatusIcon = status.icon
                  return (
                    <TableRow key={exp.id}>
                      <TableCell className="font-mono text-sm">
                        {formatDate(exp.expenseDate)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{exp.description}</div>
                        {exp.expenseNumber && (
                          <div className="text-xs text-muted-foreground">{exp.expenseNumber}</div>
                        )}
                      </TableCell>
                      <TableCell>{exp.merchant || '—'}</TableCell>
                      <TableCell>{exp.categoryName || '—'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(exp.totalAmount)}
                        {exp.gstHstAmount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            GST/HST: {formatCurrency(exp.gstHstAmount)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs gap-1", status.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {exp.receiptUrl && (
                              <DropdownMenuItem asChild>
                                <a href={exp.receiptUrl} target="_blank" rel="noopener noreferrer">
                                  <Eye className="mr-2 h-4 w-4" /> View Receipt
                                </a>
                              </DropdownMenuItem>
                            )}
                            {exp.status === 'draft' && (
                              <>
                                <DropdownMenuItem onClick={() => openEdit(exp)}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSubmit(exp.id)}>
                                  <Send className="mr-2 h-4 w-4" /> Submit
                                </DropdownMenuItem>
                              </>
                            )}
                            {exp.status === 'submitted' && (
                              <>
                                <DropdownMenuItem onClick={() => handleApprove(exp.id)}>
                                  <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setShowReject(exp.id)}>
                                  <XCircle className="mr-2 h-4 w-4" /> Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {exp.status === 'approved' && (
                              <DropdownMenuItem onClick={() => setShowReimburse(exp.id)}>
                                <DollarSign className="mr-2 h-4 w-4" /> Mark Reimbursed
                              </DropdownMenuItem>
                            )}
                            {(exp.status === 'draft' || exp.status === 'rejected') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDelete(exp.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd || !!showEdit} onOpenChange={(open) => {
        if (!open) {
          setShowAdd(false)
          setShowEdit(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showEdit ? 'Edit Expense' : 'New Expense'}</DialogTitle>
            <DialogDescription>
              {showEdit ? 'Update expense details' : 'Record a business expense'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="amounts">Amounts</TabsTrigger>
              <TabsTrigger value="receipt">Receipt</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={form.expenseDate}
                    onChange={(e) => setForm(f => ({ ...f, expenseDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={form.categoryId || 'none'}
                    onValueChange={(v) => setForm(f => ({ ...f, categoryId: v === 'none' ? undefined : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What was this expense for?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Merchant / Vendor</Label>
                  <Input
                    value={form.merchant}
                    onChange={(e) => setForm(f => ({ ...f, merchant: e.target.value }))}
                    placeholder="Staples, Air Canada, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="Toronto, ON"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={form.paymentMethod || 'personal'}
                  onValueChange={(v) => setForm(f => ({ ...f, paymentMethod: v as PaymentMethod }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(pm => (
                      <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Additional details..."
                  rows={2}
                />
              </div>
            </TabsContent>

            <TabsContent value="amounts" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subtotal (before tax) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.subtotal || ''}
                    onChange={(e) => setForm(f => ({ ...f, subtotal: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>GST/HST</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.gstHstAmount || ''}
                    onChange={(e) => setForm(f => ({ ...f, gstHstAmount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>PST/QST (if applicable)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.pstAmount || ''}
                    onChange={(e) => setForm(f => ({ ...f, pstAmount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tip (meals only)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.tipAmount || ''}
                    onChange={(e) => setForm(f => ({ ...f, tipAmount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Amount</span>
                  <span className="text-2xl font-bold">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Vendor Tax Number (for ITC claims)</Label>
                <Input
                  value={form.vendorTaxNumber}
                  onChange={(e) => setForm(f => ({ ...f, vendorTaxNumber: e.target.value }))}
                  placeholder="123456789RT0001"
                />
                <p className="text-xs text-muted-foreground">
                  Required for GST/HST input tax credits on expenses over $30
                </p>
              </div>
            </TabsContent>

            <TabsContent value="receipt" className="space-y-4 mt-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                {form.receiptUrl ? (
                  <div className="space-y-4">
                    <img 
                      src={form.receiptUrl} 
                      alt="Receipt" 
                      className="max-h-48 mx-auto rounded-lg shadow"
                    />
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" size="sm" asChild>
                        <a href={form.receiptUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="mr-2 h-4 w-4" /> View Full
                        </a>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setForm(f => ({ ...f, receiptUrl: '' }))}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Upload Receipt</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      JPG, PNG or PDF up to 5MB
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleReceiptUpload}
                      accept="image/*,.pdf"
                      className="hidden"
                    />
                    <Button 
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" /> Choose File
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                CRA requires receipts for all expenses over $25. Keep receipts for 6 years.
              </p>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => {
              setShowAdd(false)
              setShowEdit(null)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={showEdit ? handleUpdate : handleCreate} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {showEdit ? 'Save Changes' : 'Save Draft'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!showReject} onOpenChange={(open) => !open && setShowReject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Expense</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReject(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason}>
              Reject Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reimburse Dialog */}
      <Dialog open={!!showReimburse} onOpenChange={(open) => !open && setShowReimburse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Reimbursed</DialogTitle>
            <DialogDescription>
              Record how this expense was reimbursed
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Reimbursement Method</Label>
              <Select value={reimburseMethod} onValueChange={setReimburseMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payroll">Payroll</SelectItem>
                  <SelectItem value="direct_deposit">Direct Deposit</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="etransfer">E-Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reference (optional)</Label>
              <Input
                value={reimburseRef}
                onChange={(e) => setReimburseRef(e.target.value)}
                placeholder="Cheque #, transaction ID, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReimburse(null)}>Cancel</Button>
            <Button onClick={handleReimburse}>
              <CheckCircle className="mr-2 h-4 w-4" /> Mark Reimbursed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        type="expenses"
        onSuccess={() => refetch()}
      />
    </div>
  )
}
