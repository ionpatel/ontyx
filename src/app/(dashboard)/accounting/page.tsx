'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Plus, BookOpen, FileText, TrendingUp, TrendingDown,
  ChevronRight, ChevronDown, MoreHorizontal, Edit, Trash2,
  Search, CheckCircle2, Ban, Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { 
  useChartOfAccounts, 
  useJournalEntries, 
  useAccountingSummary,
  useCreateAccount,
  useDeleteAccount,
  usePostJournalEntry,
  useVoidJournalEntry
} from '@/hooks/use-accounting'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { AccountType, JournalStatus } from '@/types/accounting'

const accountTypeConfig: Record<AccountType, { label: string; color: string; icon: typeof TrendingUp }> = {
  asset: { label: 'Asset', color: 'text-blue-600 bg-blue-100', icon: TrendingUp },
  liability: { label: 'Liability', color: 'text-red-600 bg-red-100', icon: TrendingDown },
  equity: { label: 'Equity', color: 'text-purple-600 bg-purple-100', icon: BookOpen },
  revenue: { label: 'Revenue', color: 'text-green-600 bg-green-100', icon: TrendingUp },
  expense: { label: 'Expense', color: 'text-orange-600 bg-orange-100', icon: TrendingDown }
}

const journalStatusConfig: Record<JournalStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700' },
  posted: { label: 'Posted', color: 'bg-green-100 text-green-700' },
  void: { label: 'Void', color: 'bg-red-100 text-red-700' }
}

export default function AccountingPage() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('accounts')
  const [searchQuery, setSearchQuery] = useState('')
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all')
  const [showNewAccountDialog, setShowNewAccountDialog] = useState(false)
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['asset', 'liability', 'equity', 'revenue', 'expense']))
  
  const { data: accounts = [], isLoading: accountsLoading, refetch: refetchAccounts } = useChartOfAccounts()
  const { data: entries = [], isLoading: entriesLoading, refetch: refetchEntries } = useJournalEntries()
  const { data: summary } = useAccountingSummary()
  const createAccountMutation = useCreateAccount()
  const deleteAccountMutation = useDeleteAccount()
  const postEntryMutation = usePostJournalEntry()
  const voidEntryMutation = useVoidJournalEntry()
  
  // New account form state
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<AccountType>('expense')
  const [newDescription, setNewDescription] = useState('')
  
  // Group accounts by type
  const accountsByType: Record<AccountType, typeof accounts> = {
    asset: accounts.filter(a => a.account_type === 'asset'),
    liability: accounts.filter(a => a.account_type === 'liability'),
    equity: accounts.filter(a => a.account_type === 'equity'),
    revenue: accounts.filter(a => a.account_type === 'revenue'),
    expense: accounts.filter(a => a.account_type === 'expense')
  }
  
  // Filter accounts
  const filteredAccounts = accounts.filter(a => {
    const matchesSearch = 
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = accountTypeFilter === 'all' || a.account_type === accountTypeFilter
    return matchesSearch && matchesType
  })
  
  const toggleType = (type: string) => {
    const newExpanded = new Set(expandedTypes)
    if (newExpanded.has(type)) {
      newExpanded.delete(type)
    } else {
      newExpanded.add(type)
    }
    setExpandedTypes(newExpanded)
  }
  
  const handleCreateAccount = async () => {
    if (!newCode.trim() || !newName.trim()) {
      toast.error('Please enter code and name')
      return
    }
    
    try {
      await createAccountMutation.mutateAsync({
        code: newCode.trim(),
        name: newName.trim(),
        description: newDescription || undefined,
        account_type: newType
      })
      toast.success('Account created')
      setShowNewAccountDialog(false)
      setNewCode('')
      setNewName('')
      setNewDescription('')
      refetchAccounts()
    } catch (error) {
      toast.error('Failed to create account')
    }
  }
  
  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Delete this account?')) return
    try {
      await deleteAccountMutation.mutateAsync(id)
      toast.success('Account deleted')
      refetchAccounts()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete')
    }
  }
  
  const handlePostEntry = async (id: string) => {
    try {
      await postEntryMutation.mutateAsync(id)
      toast.success('Journal entry posted')
      refetchEntries()
      refetchAccounts()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to post')
    }
  }
  
  const handleVoidEntry = async (id: string) => {
    const reason = prompt('Enter void reason:')
    if (!reason) return
    try {
      await voidEntryMutation.mutateAsync({ id, reason })
      toast.success('Journal entry voided')
      refetchEntries()
      refetchAccounts()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to void')
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounting</h1>
          <p className="text-muted-foreground">
            Chart of accounts and journal entries
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowNewAccountDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Account
          </Button>
          <Button asChild>
            <Link href="/accounting/journal/new">
              <FileText className="mr-2 h-4 w-4" />
              New Entry
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">
              {formatCurrency(summary?.total_assets || 0, 'CAD')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Liabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-600">
              {formatCurrency(summary?.total_liabilities || 0, 'CAD')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Equity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-600">
              {formatCurrency(summary?.total_equity || 0, 'CAD')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(summary?.total_revenue || 0, 'CAD')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-orange-600">
              {formatCurrency(summary?.total_expenses || 0, 'CAD')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-xl font-bold",
              (summary?.net_income || 0) >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatCurrency(summary?.net_income || 0, 'CAD')}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="journal">Journal Entries</TabsTrigger>
        </TabsList>
        
        {/* Chart of Accounts */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="asset">Assets</SelectItem>
                <SelectItem value="liability">Liabilities</SelectItem>
                <SelectItem value="equity">Equity</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Card>
            <CardContent className="p-0">
              {accountsLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : (
                <div className="divide-y">
                  {(['asset', 'liability', 'equity', 'revenue', 'expense'] as AccountType[]).map((type) => {
                    const typeAccounts = accountsByType[type].filter(a => 
                      searchQuery === '' || 
                      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      a.code.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    if (accountTypeFilter !== 'all' && accountTypeFilter !== type) return null
                    if (typeAccounts.length === 0 && searchQuery) return null
                    
                    const config = accountTypeConfig[type]
                    const isExpanded = expandedTypes.has(type)
                    const TypeIcon = config.icon
                    const totalBalance = typeAccounts.reduce((sum, a) => sum + (a.balance || 0), 0)
                    
                    return (
                      <div key={type}>
                        <button
                          onClick={() => toggleType(type)}
                          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <TypeIcon className={cn("h-5 w-5", config.color.split(' ')[0])} />
                            <span className="font-semibold">{config.label}s</span>
                            <Badge variant="secondary">{typeAccounts.length}</Badge>
                          </div>
                          <span className="font-semibold">
                            {formatCurrency(totalBalance, 'CAD')}
                          </span>
                        </button>
                        
                        {isExpanded && typeAccounts.length > 0 && (
                          <Table>
                            <TableBody>
                              {typeAccounts.map((account) => (
                                <TableRow key={account.id}>
                                  <TableCell className="pl-12 w-[100px]">
                                    <code className="text-sm">{account.code}</code>
                                  </TableCell>
                                  <TableCell>
                                    {account.name}
                                    {account.description && (
                                      <p className="text-xs text-muted-foreground">{account.description}</p>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatCurrency(account.balance, 'CAD')}
                                  </TableCell>
                                  <TableCell className="w-[50px]">
                                    {!account.is_system && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            className="text-destructive"
                                            onClick={() => handleDeleteAccount(account.id)}
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Journal Entries */}
        <TabsContent value="journal" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entry #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entriesLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No journal entries yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((entry) => {
                      const status = journalStatusConfig[entry.status]
                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.entry_number}</TableCell>
                          <TableCell>{formatDate(entry.entry_date)}</TableCell>
                          <TableCell>{entry.description || '—'}</TableCell>
                          <TableCell>
                            <Badge className={cn("font-normal", status.color)}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(entry.total_debit, 'CAD')}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(entry.total_credit, 'CAD')}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {entry.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => handlePostEntry(entry.id)}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Post Entry
                                  </DropdownMenuItem>
                                )}
                                {entry.status !== 'void' && (
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleVoidEntry(entry.id)}
                                  >
                                    <Ban className="mr-2 h-4 w-4" />
                                    Void Entry
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* New Account Dialog */}
      <Dialog open={showNewAccountDialog} onOpenChange={setShowNewAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Account</DialogTitle>
            <DialogDescription>
              Add a new account to your chart of accounts
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Account Code *</Label>
                <Input
                  id="code"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g., 5700"
                />
              </div>
              <div className="space-y-2">
                <Label>Account Type *</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as AccountType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="liability">Liability</SelectItem>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Account Name *</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Marketing Expense"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewAccountDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAccount} disabled={createAccountMutation.isPending}>
              {createAccountMutation.isPending ? 'Creating...' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
