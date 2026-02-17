'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, FileText } from 'lucide-react'
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
import { useCreateJournalEntry, useChartOfAccounts } from '@/hooks/use-accounting'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, cn } from '@/lib/utils'

interface JournalLine {
  id: string
  account_id: string
  description: string
  debit_amount: string
  credit_amount: string
}

export default function NewJournalEntryPage() {
  const router = useRouter()
  const toast = useToast()
  const { data: accounts = [] } = useChartOfAccounts()
  const createMutation = useCreateJournalEntry()
  
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [lines, setLines] = useState<JournalLine[]>([
    { id: '1', account_id: '', description: '', debit_amount: '', credit_amount: '' },
    { id: '2', account_id: '', description: '', debit_amount: '', credit_amount: '' }
  ])
  
  // Group accounts by type for easier selection
  const accountsByType = {
    asset: accounts.filter(a => a.account_type === 'asset'),
    liability: accounts.filter(a => a.account_type === 'liability'),
    equity: accounts.filter(a => a.account_type === 'equity'),
    revenue: accounts.filter(a => a.account_type === 'revenue'),
    expense: accounts.filter(a => a.account_type === 'expense')
  }
  
  const addLine = () => {
    setLines([
      ...lines,
      { id: String(Date.now()), account_id: '', description: '', debit_amount: '', credit_amount: '' }
    ])
  }
  
  const removeLine = (id: string) => {
    if (lines.length <= 2) return
    setLines(lines.filter(l => l.id !== id))
  }
  
  const updateLine = (id: string, field: keyof JournalLine, value: string) => {
    setLines(lines.map(line => {
      if (line.id !== id) return line
      
      // If entering debit, clear credit and vice versa
      if (field === 'debit_amount' && value) {
        return { ...line, debit_amount: value, credit_amount: '' }
      }
      if (field === 'credit_amount' && value) {
        return { ...line, credit_amount: value, debit_amount: '' }
      }
      
      return { ...line, [field]: value }
    }))
  }
  
  // Calculate totals
  const totalDebit = lines.reduce((sum, l) => sum + (parseFloat(l.debit_amount) || 0), 0)
  const totalCredit = lines.reduce((sum, l) => sum + (parseFloat(l.credit_amount) || 0), 0)
  const difference = Math.abs(totalDebit - totalCredit)
  const isBalanced = difference < 0.01
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isBalanced) {
      toast.error('Debits must equal credits')
      return
    }
    
    const validLines = lines.filter(l => 
      l.account_id && (parseFloat(l.debit_amount) > 0 || parseFloat(l.credit_amount) > 0)
    )
    
    if (validLines.length < 2) {
      toast.error('At least 2 line items required')
      return
    }
    
    try {
      await createMutation.mutateAsync({
        entry_date: entryDate,
        description: description || undefined,
        reference: reference || undefined,
        lines: validLines.map(l => ({
          account_id: l.account_id,
          description: l.description || undefined,
          debit_amount: parseFloat(l.debit_amount) || 0,
          credit_amount: parseFloat(l.credit_amount) || 0
        }))
      })
      
      toast.success('Journal entry created')
      router.push('/accounting')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to create entry')
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/accounting">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Journal Entry</h1>
          <p className="text-muted-foreground">
            Record a manual accounting entry
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Entry Details */}
            <Card>
              <CardHeader>
                <CardTitle>Entry Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference</Label>
                  <Input
                    id="reference"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g., INV-001"
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Entry description"
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Line Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Line Items</CardTitle>
                  <CardDescription>Debits must equal credits</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Line
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Account</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[120px] text-right">Debit</TableHead>
                      <TableHead className="w-[120px] text-right">Credit</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <Select 
                            value={line.account_id} 
                            onValueChange={(v) => updateLine(line.id, 'account_id', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" disabled>Select account</SelectItem>
                              {Object.entries(accountsByType).map(([type, accts]) => (
                                accts.length > 0 && (
                                  <div key={type}>
                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                                      {type}s
                                    </div>
                                    {accts.map((a) => (
                                      <SelectItem key={a.id} value={a.id}>
                                        {a.code} - {a.name}
                                      </SelectItem>
                                    ))}
                                  </div>
                                )
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={line.description}
                            onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                            placeholder="Line description"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.debit_amount}
                            onChange={(e) => updateLine(line.id, 'debit_amount', e.target.value)}
                            className="text-right"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.credit_amount}
                            onChange={(e) => updateLine(line.id, 'credit_amount', e.target.value)}
                            className="text-right"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLine(line.id)}
                            disabled={lines.length <= 2}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="border-t-2">
                      <TableCell colSpan={2} className="font-semibold text-right">
                        Totals
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(totalDebit, 'CAD')}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(totalCredit, 'CAD')}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Balance Check</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Debits</span>
                  <span className="font-medium">{formatCurrency(totalDebit, 'CAD')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Credits</span>
                  <span className="font-medium">{formatCurrency(totalCredit, 'CAD')}</span>
                </div>
                <div className="border-t pt-4 flex justify-between">
                  <span className="font-semibold">Difference</span>
                  <span className={cn(
                    "font-semibold",
                    isBalanced ? "text-green-600" : "text-red-600"
                  )}>
                    {isBalanced ? '✓ Balanced' : formatCurrency(difference, 'CAD')}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex flex-col gap-2">
              <Button type="submit" size="lg" disabled={createMutation.isPending || !isBalanced}>
                <FileText className="mr-2 h-4 w-4" />
                {createMutation.isPending ? 'Creating...' : 'Create Entry'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/accounting">Cancel</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
