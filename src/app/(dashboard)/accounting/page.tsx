"use client"

import { useState } from "react"
import { 
  Plus, BookOpen, FileText, List, TrendingUp, TrendingDown,
  ChevronRight, ChevronDown, MoreHorizontal, Edit, Trash2,
  Search, Filter, Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { mockChartOfAccounts, mockJournalEntries } from "@/lib/mock-data"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { AccountType, ChartOfAccount, JournalEntry } from "@/types/finance"

const accountTypeConfig: Record<AccountType, { label: string; color: string; icon: any }> = {
  asset: { label: "Asset", color: "text-blue-500 bg-blue-500/10", icon: TrendingUp },
  liability: { label: "Liability", color: "text-red-500 bg-red-500/10", icon: TrendingDown },
  equity: { label: "Equity", color: "text-purple-500 bg-purple-500/10", icon: BookOpen },
  revenue: { label: "Revenue", color: "text-green-500 bg-green-500/10", icon: TrendingUp },
  expense: { label: "Expense", color: "text-orange-500 bg-orange-500/10", icon: TrendingDown },
}

interface AccountRowProps {
  account: ChartOfAccount
  level?: number
}

function AccountRow({ account, level = 0 }: AccountRowProps) {
  const [expanded, setExpanded] = useState(true)
  const children = mockChartOfAccounts.filter(a => a.parentId === account.id)
  const hasChildren = children.length > 0
  const config = accountTypeConfig[account.type]
  const Icon = config.icon

  return (
    <>
      <TableRow className="hover:bg-muted/50">
        <TableCell style={{ paddingLeft: `${level * 24 + 16}px` }}>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-6" />
            )}
            <span className="font-mono text-muted-foreground">{account.code}</span>
          </div>
        </TableCell>
        <TableCell>
          <span className="font-medium">{account.name}</span>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={config.color}>
            <Icon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <span className={cn(
            "font-medium",
            account.balance < 0 && "text-destructive"
          )}>
            {formatCurrency(Math.abs(account.balance), account.currency)}
            {account.balance < 0 && " CR"}
          </span>
        </TableCell>
        <TableCell>
          <Badge variant={account.isActive ? "success" : "secondary"}>
            {account.isActive ? "Active" : "Inactive"}
          </Badge>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" /> View Transactions
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {expanded && children.map(child => (
        <AccountRow key={child.id} account={child} level={level + 1} />
      ))}
    </>
  )
}

export default function AccountingPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<AccountType | "all">("all")

  // Get root level accounts (no parentId)
  const rootAccounts = mockChartOfAccounts.filter(a => !a.parentId)

  // Group accounts by type for summary
  const accountsByType = mockChartOfAccounts.reduce((acc, account) => {
    if (!acc[account.type]) acc[account.type] = []
    acc[account.type].push(account)
    return acc
  }, {} as Record<AccountType, ChartOfAccount[]>)

  const getTotalByType = (type: AccountType) => {
    return accountsByType[type]?.reduce((sum, a) => sum + a.balance, 0) || 0
  }

  const filteredAccounts = mockChartOfAccounts.filter(account => {
    const matchesSearch = 
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || account.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounting</h1>
          <p className="text-muted-foreground">
            Chart of accounts, journal entries, and general ledger
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" /> New Journal Entry
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Account
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        {(Object.keys(accountTypeConfig) as AccountType[]).map(type => {
          const config = accountTypeConfig[type]
          const Icon = config.icon
          const total = getTotalByType(type)
          return (
            <Card key={type}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
                <div className={cn("p-2 rounded-full", config.color)}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(Math.abs(total))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {accountsByType[type]?.length || 0} accounts
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart">
            <List className="mr-2 h-4 w-4" />
            Chart of Accounts
          </TabsTrigger>
          <TabsTrigger value="journal">
            <FileText className="mr-2 h-4 w-4" />
            Journal Entries
          </TabsTrigger>
          <TabsTrigger value="ledger">
            <BookOpen className="mr-2 h-4 w-4" />
            General Ledger
          </TabsTrigger>
        </TabsList>

        {/* Chart of Accounts */}
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Chart of Accounts</CardTitle>
                  <CardDescription>
                    Manage your account structure and balances
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search accounts..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-9 w-[250px]"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchTerm ? (
                    filteredAccounts.map(account => (
                      <AccountRow key={account.id} account={account} />
                    ))
                  ) : (
                    rootAccounts.map(account => (
                      <AccountRow key={account.id} account={account} />
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journal Entries */}
        <TabsContent value="journal">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Journal Entries</CardTitle>
                  <CardDescription>
                    Record and view accounting entries
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> New Entry
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entry #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockJournalEntries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {entry.entryNumber}
                      </TableCell>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {entry.lines.length} lines
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {entry.reference || "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(entry.totalDebit)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(entry.totalCredit)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.isPosted ? "success" : "draft"}>
                          {entry.isPosted ? "Posted" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
                            {!entry.isPosted && (
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Ledger */}
        <TabsContent value="ledger">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>General Ledger</CardTitle>
                  <CardDescription>
                    View all transactions by account
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input type="date" className="w-[150px]" />
                  <span className="flex items-center text-muted-foreground">to</span>
                  <Input type="date" className="w-[150px]" />
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" /> Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Sample Ledger View */}
              <div className="space-y-6">
                {mockChartOfAccounts.slice(0, 3).map(account => (
                  <div key={account.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">
                          {account.code} - {account.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {accountTypeConfig[account.type].label}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Balance</div>
                        <div className="text-lg font-bold">
                          {formatCurrency(account.balance)}
                        </div>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Credit</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="text-muted-foreground">
                            Opening Balance
                          </TableCell>
                          <TableCell colSpan={4}></TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(account.balance * 0.9)}
                          </TableCell>
                        </TableRow>
                        {mockJournalEntries
                          .flatMap(je => 
                            je.lines
                              .filter(l => l.accountId === account.id)
                              .map(line => ({ ...line, entry: je }))
                          )
                          .slice(0, 3)
                          .map((line, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{formatDate(line.entry.date)}</TableCell>
                              <TableCell>{line.entry.description}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {line.entry.reference || "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                {line.debit > 0 ? formatCurrency(line.debit) : "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                {line.credit > 0 ? formatCurrency(line.credit) : "—"}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(account.balance)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
