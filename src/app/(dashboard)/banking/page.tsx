"use client"

import { useState } from "react"
import { 
  Building2, Plus, ArrowUpRight, ArrowDownRight, 
  RefreshCw, CheckCircle2, AlertCircle, Link as LinkIcon,
  MoreHorizontal, Eye, Settings, History
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import { mockBankAccounts, mockBankTransactions, getBankingSummary } from "@/lib/mock-data"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { BankTransaction, ReconciliationStatus } from "@/types/finance"

const reconciliationStatusConfig: Record<ReconciliationStatus, { label: string; variant: string; icon: any }> = {
  unreconciled: { label: "Unreconciled", variant: "warning", icon: AlertCircle },
  matched: { label: "Matched", variant: "sent", icon: LinkIcon },
  reconciled: { label: "Reconciled", variant: "success", icon: CheckCircle2 },
}

export default function BankingPage() {
  const [transactions, setTransactions] = useState<BankTransaction[]>(mockBankTransactions)
  const [selectedAccountId, setSelectedAccountId] = useState<string>("ba-001")
  const summary = getBankingSummary()

  const selectedAccount = mockBankAccounts.find(a => a.id === selectedAccountId)
  const accountTransactions = transactions.filter(t => t.accountId === selectedAccountId)

  const handleReconcile = (transactionId: string) => {
    setTransactions(prev =>
      prev.map(t =>
        t.id === transactionId
          ? { ...t, reconciliationStatus: "reconciled" as ReconciliationStatus }
          : t
      )
    )
  }

  const unreconciledTransactions = accountTransactions.filter(
    t => t.reconciliationStatus === "unreconciled"
  )

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
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Sync Transactions
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Bank Account
          </Button>
        </div>
      </div>

      {/* Bank Account Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockBankAccounts.map((account) => (
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
                  <CardDescription>{account.bankName} • {account.accountNumber}</CardDescription>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" /> View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <History className="mr-2 h-4 w-4" /> Transaction History
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(account.balance, account.currency)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last reconciled: {account.lastReconciled ? formatDate(account.lastReconciled) : "Never"}
              </p>
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
                  <CardTitle>{selectedAccount?.name} Transactions</CardTitle>
                  <CardDescription>
                    {unreconciledTransactions.length} unreconciled transactions
                  </CardDescription>
                </div>
                <Tabs defaultValue="all" className="w-auto">
                  <TabsList>
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
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
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
                  {accountTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    accountTransactions.map((transaction) => {
                      const StatusIcon = reconciliationStatusConfig[transaction.reconciliationStatus].icon
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {formatDate(transaction.date)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{transaction.description}</div>
                              {transaction.reference && (
                                <div className="text-sm text-muted-foreground">
                                  Ref: {transaction.reference}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {transaction.category || "Uncategorized"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <StatusIcon className={cn(
                                "h-4 w-4",
                                transaction.reconciliationStatus === "reconciled" && "text-success",
                                transaction.reconciliationStatus === "matched" && "text-blue-500",
                                transaction.reconciliationStatus === "unreconciled" && "text-warning"
                              )} />
                              <span className="text-sm">
                                {reconciliationStatusConfig[transaction.reconciliationStatus].label}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              "font-medium",
                              transaction.amount > 0 ? "text-success" : "text-destructive"
                            )}>
                              {transaction.amount > 0 ? "+" : ""}
                              {formatCurrency(transaction.amount)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {transaction.reconciliationStatus === "unreconciled" && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleReconcile(transaction.id)}
                              >
                                Reconcile
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Current Balance</span>
                <span className="font-bold text-lg">
                  {formatCurrency(selectedAccount?.balance || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Accounts</span>
                <span className="font-medium">{summary.accountCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Balance</span>
                <span className="font-medium">{formatCurrency(summary.totalBalance)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Unreconciled</span>
                <Badge variant="warning">{summary.unreconciledCount}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <ArrowDownRight className="mr-2 h-4 w-4 text-success" />
                Record Deposit
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ArrowUpRight className="mr-2 h-4 w-4 text-destructive" />
                Record Payment
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <RefreshCw className="mr-2 h-4 w-4" />
                Transfer Between Accounts
              </Button>
            </CardContent>
          </Card>

          {/* Recent Matches */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Suggested Matches</CardTitle>
              <CardDescription>
                Transactions that may match existing records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {accountTransactions
                  .filter(t => t.reconciliationStatus === "matched")
                  .slice(0, 3)
                  .map(transaction => (
                    <div 
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div>
                        <div className="font-medium text-sm">{transaction.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(Math.abs(transaction.amount))}
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Match</Button>
                    </div>
                  ))}
                {accountTransactions.filter(t => t.reconciliationStatus === "matched").length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No suggested matches
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
