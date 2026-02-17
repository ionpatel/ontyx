"use client"

import { useState } from "react"
import { 
  Building2, Plus, ArrowUpRight, ArrowDownRight, 
  RefreshCw, CheckCircle2, AlertCircle, Link as LinkIcon,
  MoreHorizontal, Eye, Trash2, Loader2, DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency, cn } from "@/lib/utils"
import { useBankAccounts, useBankTransactions, useBankingSummary, useTransactionCategories } from "@/hooks/use-banking"
import type { BankAccountType, TransactionType, CreateBankAccountInput, CreateTransactionInput } from "@/services/banking"
import { useToast } from "@/components/ui/toast"

const accountTypeLabels: Record<BankAccountType, string> = {
  checking: "Checking",
  savings: "Savings",
  credit_card: "Credit Card",
  line_of_credit: "Line of Credit",
  investment: "Investment",
}

export default function BankingPage() {
  const { accounts, loading: accountsLoading, createAccount, deleteAccount, refetch: refetchAccounts } = useBankAccounts()
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>()
  const { 
    transactions, 
    unreconciledTransactions, 
    loading: txLoading, 
    reconcileTransaction,
    categorizeTransaction,
    createTransaction,
    deleteTransaction,
    refetch: refetchTransactions 
  } = useBankTransactions(selectedAccountId)
  const { summary, loading: summaryLoading } = useBankingSummary()
  const { categories } = useTransactionCategories()
  const { success, error: showError } = useToast()

  // Dialogs
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [saving, setSaving] = useState(false)

  // Forms
  const [accountForm, setAccountForm] = useState<CreateBankAccountInput>({
    name: '',
    accountType: 'checking',
    accountNumber: '',
    bankName: '',
    currentBalance: 0,
  })
  const [transactionForm, setTransactionForm] = useState<CreateTransactionInput>({
    bankAccountId: '',
    transactionDate: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    transactionType: 'debit',
  })

  // Selected account
  const selectedAccount = accounts.find(a => a.id === selectedAccountId)
  
  // Set default account when accounts load
  if (accounts.length > 0 && !selectedAccountId) {
    setSelectedAccountId(accounts[0].id)
  }

  const handleCreateAccount = async () => {
    if (!accountForm.name || !accountForm.bankName) {
      showError('Missing Info', 'Please fill in all required fields')
      return
    }

    setSaving(true)
    const account = await createAccount(accountForm)
    setSaving(false)

    if (account) {
      success('Account Added', `${account.name} has been created`)
      setShowAddAccount(false)
      setAccountForm({
        name: '',
        accountType: 'checking',
        accountNumber: '',
        bankName: '',
        currentBalance: 0,
      })
      setSelectedAccountId(account.id)
    } else {
      showError('Error', 'Failed to create account')
    }
  }

  const handleCreateTransaction = async () => {
    if (!transactionForm.description || !transactionForm.amount || !selectedAccountId) {
      showError('Missing Info', 'Please fill in all required fields')
      return
    }

    setSaving(true)
    const tx = await createTransaction({
      ...transactionForm,
      bankAccountId: selectedAccountId,
    })
    setSaving(false)

    if (tx) {
      success('Transaction Added', 'Transaction has been recorded')
      setShowAddTransaction(false)
      setTransactionForm({
        bankAccountId: '',
        transactionDate: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        transactionType: 'debit',
      })
      refetchAccounts() // Update balance
    } else {
      showError('Error', 'Failed to record transaction')
    }
  }

  const handleReconcile = async (transactionId: string) => {
    const ok = await reconcileTransaction(transactionId)
    if (ok) {
      success('Reconciled', 'Transaction marked as reconciled')
    }
  }

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return
    
    const ok = await deleteAccount(id)
    if (ok) {
      success('Deleted', 'Account has been removed')
      if (selectedAccountId === id && accounts.length > 1) {
        setSelectedAccountId(accounts.find(a => a.id !== id)?.id)
      }
    }
  }

  const loading = accountsLoading || summaryLoading

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
          <h1 className="text-3xl font-bold tracking-tight">Banking</h1>
          <p className="text-muted-foreground">
            Manage bank accounts and reconcile transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { refetchAccounts(); refetchTransactions() }}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button onClick={() => setShowAddAccount(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Bank Account
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Bank Accounts</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Add your bank accounts to track transactions, reconcile payments, and manage your cash flow.
            </p>
            <Button onClick={() => setShowAddAccount(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Your First Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Bank Account Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <Card 
                key={account.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedAccountId === account.id && "ring-2 ring-primary"
                )}
                onClick={() => setSelectedAccountId(account.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-medium">{account.name}</CardTitle>
                      <CardDescription>
                        {account.bankName} • ****{account.accountNumber}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDeleteAccount(account.id) }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(account.currentBalance, account.currency)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {accountTypeLabels[account.accountType]}
                    </Badge>
                    {account.isPrimary && (
                      <Badge variant="default" className="text-xs">Primary</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Transactions Panel */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedAccount?.name || 'Select Account'}</CardTitle>
                      <CardDescription>
                        {unreconciledTransactions.length} unreconciled transactions
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowAddTransaction(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Transaction
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {txLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Tabs defaultValue="all">
                      <TabsList className="mb-4">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="unreconciled">
                          Unreconciled
                          {unreconciledTransactions.length > 0 && (
                            <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                              {unreconciledTransactions.length}
                            </Badge>
                          )}
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="all">
                        <TransactionsTable 
                          transactions={transactions} 
                          onReconcile={handleReconcile}
                          onCategorize={categorizeTransaction}
                          onDelete={deleteTransaction}
                          categories={categories}
                        />
                      </TabsContent>

                      <TabsContent value="unreconciled">
                        <TransactionsTable 
                          transactions={unreconciledTransactions} 
                          onReconcile={handleReconcile}
                          onCategorize={categorizeTransaction}
                          onDelete={deleteTransaction}
                          categories={categories}
                        />
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Balance</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(summary?.totalBalance || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Accounts</span>
                    <span className="font-medium">{summary?.accountCount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Unreconciled</span>
                    <Badge variant="warning">{summary?.unreconciledCount || 0}</Badge>
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">This Month In</span>
                      <span className="font-medium text-green-600">
                        +{formatCurrency(summary?.monthlyInflow || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">This Month Out</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(summary?.monthlyOutflow || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      setTransactionForm(f => ({ ...f, transactionType: 'credit' }))
                      setShowAddTransaction(true)
                    }}
                  >
                    <ArrowDownRight className="mr-2 h-4 w-4 text-green-600" />
                    Record Deposit
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      setTransactionForm(f => ({ ...f, transactionType: 'debit' }))
                      setShowAddTransaction(true)
                    }}
                  >
                    <ArrowUpRight className="mr-2 h-4 w-4 text-red-600" />
                    Record Payment
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Add Account Dialog */}
      <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
            <DialogDescription>
              Add a new bank account to track transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Account Name</Label>
              <Input
                id="name"
                placeholder="e.g., Business Checking"
                value={accountForm.name}
                onChange={(e) => setAccountForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="e.g., TD Bank, RBC, Scotiabank"
                value={accountForm.bankName}
                onChange={(e) => setAccountForm(f => ({ ...f, bankName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Account Type</Label>
                <Select
                  value={accountForm.accountType}
                  onValueChange={(v) => setAccountForm(f => ({ ...f, accountType: v as BankAccountType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(accountTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Last 4 Digits</Label>
                <Input
                  id="accountNumber"
                  placeholder="1234"
                  maxLength={4}
                  value={accountForm.accountNumber}
                  onChange={(e) => setAccountForm(f => ({ ...f, accountNumber: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="balance">Current Balance</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={accountForm.currentBalance || ''}
                onChange={(e) => setAccountForm(f => ({ ...f, currentBalance: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAccount(false)}>Cancel</Button>
            <Button onClick={handleCreateAccount} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {transactionForm.transactionType === 'credit' ? 'Record Deposit' : 'Record Payment'}
            </DialogTitle>
            <DialogDescription>
              Manually add a transaction to {selectedAccount?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={transactionForm.transactionType === 'credit' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setTransactionForm(f => ({ ...f, transactionType: 'credit' }))}
                >
                  <ArrowDownRight className="mr-2 h-4 w-4" /> Deposit
                </Button>
                <Button
                  type="button"
                  variant={transactionForm.transactionType === 'debit' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setTransactionForm(f => ({ ...f, transactionType: 'debit' }))}
                >
                  <ArrowUpRight className="mr-2 h-4 w-4" /> Payment
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="txDate">Date</Label>
              <Input
                id="txDate"
                type="date"
                value={transactionForm.transactionDate}
                onChange={(e) => setTransactionForm(f => ({ ...f, transactionDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g., Client payment, Supplier invoice"
                value={transactionForm.description}
                onChange={(e) => setTransactionForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={transactionForm.amount || ''}
                onChange={(e) => setTransactionForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={transactionForm.category || ''}
                onValueChange={(v) => setTransactionForm(f => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTransaction(false)}>Cancel</Button>
            <Button onClick={handleCreateTransaction} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================================
// TRANSACTIONS TABLE COMPONENT
// ============================================================================

function TransactionsTable({ 
  transactions, 
  onReconcile, 
  onCategorize,
  onDelete,
  categories 
}: { 
  transactions: any[]
  onReconcile: (id: string) => void
  onCategorize: (id: string, category: string) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
  categories: string[]
}) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No transactions found.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="w-[80px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell className="font-medium">
              {formatDate(transaction.transactionDate)}
            </TableCell>
            <TableCell>
              <div className="font-medium">{transaction.description}</div>
            </TableCell>
            <TableCell>
              <Select
                value={transaction.category || ''}
                onValueChange={(v) => onCategorize(transaction.id, v)}
              >
                <SelectTrigger className="h-8 w-[140px]">
                  <SelectValue placeholder="Categorize..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5">
                {transaction.isReconciled ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Reconciled</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-amber-500">Unreconciled</span>
                  </>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <span className={cn(
                "font-medium",
                transaction.transactionType === 'credit' ? "text-green-600" : "text-red-600"
              )}>
                {transaction.transactionType === 'credit' ? '+' : '-'}
                {formatCurrency(Math.abs(transaction.amount))}
              </span>
            </TableCell>
            <TableCell>
              {!transaction.isReconciled && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onReconcile(transaction.id)}
                >
                  Reconcile
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
