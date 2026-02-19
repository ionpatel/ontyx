'use client'

import { useState, useEffect } from 'react'
import { 
  Building2, Plus, RefreshCw, Link2, Unlink, Upload, 
  ArrowUpRight, ArrowDownLeft, CheckCircle2, AlertCircle,
  Search, Filter, Download, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatCurrency, formatDate } from '@/lib/utils'

interface BankAccount {
  id: string
  institution: string
  accountName: string
  accountNumber: string // Last 4 digits
  type: 'checking' | 'savings' | 'credit'
  balance: number
  currency: string
  lastSync: string
  status: 'connected' | 'error' | 'disconnected'
}

interface BankTransaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'credit' | 'debit'
  category?: string
  matched?: boolean
  matchedTo?: { type: 'invoice' | 'expense' | 'bill', id: string, number: string }
  accountId: string
}

const CANADIAN_BANKS = [
  { id: 'td', name: 'TD Canada Trust', logo: '🟢' },
  { id: 'rbc', name: 'RBC Royal Bank', logo: '🔵' },
  { id: 'bmo', name: 'BMO Bank of Montreal', logo: '🔴' },
  { id: 'scotiabank', name: 'Scotiabank', logo: '🔴' },
  { id: 'cibc', name: 'CIBC', logo: '🟡' },
  { id: 'tangerine', name: 'Tangerine', logo: '🟠' },
  { id: 'simplii', name: 'Simplii Financial', logo: '🟢' },
  { id: 'desjardins', name: 'Desjardins', logo: '🟢' },
  { id: 'national', name: 'National Bank', logo: '🔴' },
  { id: 'hsbc', name: 'HSBC Canada', logo: '🔴' },
]

const EXPENSE_CATEGORIES = [
  'Office Supplies', 'Utilities', 'Rent', 'Software', 'Marketing',
  'Meals & Entertainment', 'Transportation', 'Insurance', 'Professional Services',
  'Bank Fees', 'Payroll', 'Inventory', 'Equipment', 'Other'
]

export default function BankingPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [connectDialogOpen, setConnectDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMatched, setFilterMatched] = useState<'all' | 'matched' | 'unmatched'>('all')

  useEffect(() => {
    loadBankingData()
  }, [])

  const loadBankingData = async () => {
    setLoading(true)
    try {
      const [accountsRes, transactionsRes] = await Promise.all([
        fetch('/api/banking/accounts'),
        fetch('/api/banking/transactions')
      ])
      
      if (accountsRes.ok) {
        const data = await accountsRes.json()
        setAccounts(data.accounts || [])
      }
      
      if (transactionsRes.ok) {
        const data = await transactionsRes.json()
        setTransactions(data.transactions || [])
      }
    } catch (err) {
      console.error('Failed to load banking data:', err)
    } finally {
      setLoading(false)
    }
  }

  const syncAccounts = async () => {
    setSyncing(true)
    try {
      await fetch('/api/banking/sync', { method: 'POST' })
      await loadBankingData()
    } catch (err) {
      console.error('Sync failed:', err)
    } finally {
      setSyncing(false)
    }
  }

  const handleConnectBank = async (bankId: string) => {
    // In production, this would redirect to Flinks/Plaid OAuth
    // For now, show a placeholder
    window.open(`/api/banking/connect?bank=${bankId}`, '_blank', 'width=500,height=600')
    setConnectDialogOpen(false)
  }

  const categorizeTransaction = async (transactionId: string, category: string) => {
    try {
      await fetch(`/api/banking/transactions/${transactionId}/categorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category })
      })
      
      setTransactions(prev => 
        prev.map(t => t.id === transactionId ? { ...t, category } : t)
      )
    } catch (err) {
      console.error('Failed to categorize:', err)
    }
  }

  const autoMatchTransactions = async () => {
    try {
      const res = await fetch('/api/banking/auto-match', { method: 'POST' })
      const { matched } = await res.json()
      await loadBankingData()
      alert(`Auto-matched ${matched} transactions!`)
    } catch (err) {
      console.error('Auto-match failed:', err)
    }
  }

  const filteredTransactions = transactions.filter(t => {
    if (selectedAccount !== 'all' && t.accountId !== selectedAccount) return false
    if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (filterMatched === 'matched' && !t.matched) return false
    if (filterMatched === 'unmatched' && t.matched) return false
    return true
  })

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const unmatchedCount = transactions.filter(t => !t.matched).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Banking</h1>
          <p className="text-muted-foreground">
            Connect your bank accounts and reconcile transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={syncAccounts} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import Statement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Bank Statement</DialogTitle>
                <DialogDescription>
                  Upload a CSV or OFX file exported from your bank
                </DialogDescription>
              </DialogHeader>
              <ImportStatementForm onComplete={() => {
                setImportDialogOpen(false)
                loadBankingData()
              }} />
            </DialogContent>
          </Dialog>
          <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Connect Bank
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Connect Your Bank</DialogTitle>
                <DialogDescription>
                  Securely connect to your Canadian bank account
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 py-4">
                {CANADIAN_BANKS.map(bank => (
                  <button
                    key={bank.id}
                    onClick={() => handleConnectBank(bank.id)}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors text-left"
                  >
                    <span className="text-2xl">{bank.logo}</span>
                    <span className="font-medium">{bank.name}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Powered by Flinks • Bank-level security • Read-only access
              </p>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Account Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Balance</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalBalance)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month In</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {formatCurrency(transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0))}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowDownLeft className="h-3 w-3" /> Credits & deposits
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month Out</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {formatCurrency(transactions.filter(t => t.type === 'debit').reduce((s, t) => s + Math.abs(t.amount), 0))}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" /> Debits & payments
            </p>
          </CardContent>
        </Card>
        
        <Card className={unmatchedCount > 0 ? 'border-yellow-500' : ''}>
          <CardHeader className="pb-2">
            <CardDescription>Unmatched</CardDescription>
            <CardTitle className="text-2xl">{unmatchedCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Transactions to categorize
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Connected Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map(account => (
                <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{account.accountName}</div>
                      <div className="text-sm text-muted-foreground">
                        {account.institution} •••• {account.accountNumber}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(account.balance)}</div>
                    <Badge variant={account.status === 'connected' ? 'default' : 'destructive'} className="text-xs">
                      {account.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {accounts.length === 0 && !loading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bank accounts connected</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Connect your Canadian bank account to automatically import transactions 
              and reconcile with your invoices and expenses.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setConnectDialogOpen(true)}>
                <Link2 className="h-4 w-4 mr-2" />
                Connect Bank
              </Button>
              <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      {(accounts.length > 0 || transactions.length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Transactions</CardTitle>
              <Button variant="outline" size="sm" onClick={autoMatchTransactions}>
                <Sparkles className="h-4 w-4 mr-2" />
                Auto-Match
              </Button>
            </div>
            <div className="flex gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All accounts</SelectItem>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.accountName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterMatched} onValueChange={(v: any) => setFilterMatched(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="unmatched">Unmatched</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map(transaction => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.date)}</TableCell>
                      <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                      <TableCell>
                        <Select
                          value={transaction.category || ''}
                          onValueChange={(v) => categorizeTransaction(transaction.id, v)}
                        >
                          <SelectTrigger className="w-40 h-8">
                            <SelectValue placeholder="Categorize..." />
                          </SelectTrigger>
                          <SelectContent>
                            {EXPENSE_CATEGORIES.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </TableCell>
                      <TableCell>
                        {transaction.matched ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {transaction.matchedTo?.type} #{transaction.matchedTo?.number}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Unmatched
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Import Statement Form Component
function ImportStatementForm({ onComplete }: { onComplete: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [accountName, setAccountName] = useState('')
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImport = async () => {
    if (!file || !accountName) return
    
    setImporting(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('accountName', accountName)
      
      const res = await fetch('/api/banking/import', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Import failed')
      }
      
      onComplete()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div>
        <label className="text-sm font-medium">Account Name</label>
        <Input
          placeholder="e.g., TD Business Chequing"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          className="mt-1"
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Bank Statement File</label>
        <Input
          type="file"
          accept=".csv,.ofx,.qfx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Supports CSV, OFX, and QFX formats from most Canadian banks
        </p>
      </div>
      
      <DialogFooter>
        <Button onClick={handleImport} disabled={!file || !accountName || importing}>
          {importing ? 'Importing...' : 'Import Transactions'}
        </Button>
      </DialogFooter>
    </div>
  )
}
