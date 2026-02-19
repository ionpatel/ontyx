"use client"

import { useState } from "react"
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, 
  FileText, Download, Calendar, Loader2, AlertCircle,
  PieChart, ArrowUpRight, ArrowDownRight, Wallet, Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { formatCurrency, cn } from "@/lib/utils"
import { 
  useProfitAndLoss, 
  useBalanceSheet,
  useCashFlow,
  useTaxSummary, 
  useAccountsAging,
  useFinancialSummary 
} from "@/hooks/use-reports"
import type { DateRange } from "@/services/reports"

// Date range helpers
function getDateRange(period: string): DateRange {
  const now = new Date()
  let startDate: Date
  let endDate = now
  
  switch (period) {
    case 'this-month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      break
    case 'last-month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      endDate = new Date(now.getFullYear(), now.getMonth(), 0)
      break
    case 'this-quarter':
      const quarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), quarter * 3, 1)
      endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0)
      break
    case 'this-year':
      startDate = new Date(now.getFullYear(), 0, 1)
      endDate = new Date(now.getFullYear(), 11, 31)
      break
    case 'last-year':
      startDate = new Date(now.getFullYear() - 1, 0, 1)
      endDate = new Date(now.getFullYear() - 1, 11, 31)
      break
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = now
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  }
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('this-month')
  const [dateRange, setDateRange] = useState<DateRange>(getDateRange('this-month'))
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0])
  
  const { summary, loading: summaryLoading } = useFinancialSummary()
  const { report: pnl, loading: pnlLoading } = useProfitAndLoss(dateRange)
  const { report: balance, loading: balanceLoading } = useBalanceSheet(asOfDate)
  const { report: cashFlow, loading: cashFlowLoading } = useCashFlow(dateRange)
  const { report: tax, loading: taxLoading } = useTaxSummary(dateRange)
  const { report: aging, loading: agingLoading } = useAccountsAging(asOfDate)

  const handlePeriodChange = (value: string) => {
    setPeriod(value)
    if (value !== 'custom') {
      setDateRange(getDateRange(value))
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Financial reports and business insights
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-quarter">This Quarter</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          {period === 'custom' && (
            <>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(r => ({ ...r, startDate: e.target.value }))}
                className="w-[150px]"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(r => ({ ...r, endDate: e.target.value }))}
                className="w-[150px]"
              />
            </>
          )}
        </div>
      </div>

      {/* Quick Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summaryLoading ? '...' : formatCurrency(summary?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summaryLoading ? '...' : formatCurrency(summary?.totalExpenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              (summary?.netIncome || 0) >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {summaryLoading ? '...' : formatCurrency(summary?.netIncome || 0)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receivables</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {summaryLoading ? '...' : formatCurrency(summary?.accountsReceivable || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summaryLoading ? '...' : formatCurrency(summary?.cashOnHand || 0)}
            </div>
            <p className="text-xs text-muted-foreground">On hand</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue="pnl" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="tax">Tax Summary</TabsTrigger>
          <TabsTrigger value="aging">Accounts Aging</TabsTrigger>
        </TabsList>

        {/* Profit & Loss Tab */}
        <TabsContent value="pnl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profit & Loss Statement</CardTitle>
                  <CardDescription>
                    {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pnlLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : pnl ? (
                <div className="space-y-6">
                  {/* Revenue */}
                  <div>
                    <h3 className="font-semibold text-primary mb-3">REVENUE</h3>
                    <div className="space-y-2">
                      {pnl.revenue.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1">
                          <span className="text-muted-foreground">{item.category}</span>
                          <span className="font-medium">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 border-t font-semibold">
                        <span>Total Revenue</span>
                        <span className="text-green-600">{formatCurrency(pnl.revenue.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses */}
                  <div>
                    <h3 className="font-semibold text-primary mb-3">EXPENSES</h3>
                    <div className="space-y-2">
                      {pnl.expenses.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1">
                          <span className="text-muted-foreground">{item.category}</span>
                          <span className="font-medium">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 border-t font-semibold">
                        <span>Total Expenses</span>
                        <span className="text-red-600">{formatCurrency(pnl.expenses.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Income */}
                  <div className="bg-primary text-primary-foreground p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Net Income</span>
                      <span className="text-2xl font-bold">
                        {formatCurrency(pnl.netIncome)}
                      </span>
                    </div>
                    <p className="text-sm opacity-80 mt-1">
                      Profit margin: {pnl.profitMargin.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No data available for this period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance Sheet Tab */}
        <TabsContent value="balance">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Balance Sheet</CardTitle>
                  <CardDescription>As of {formatDate(asOfDate)}</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : balance ? (
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Assets */}
                  <div>
                    <h3 className="font-semibold text-primary mb-4">ASSETS</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Current Assets</h4>
                        <div className="space-y-2 pl-4">
                          <div className="flex justify-between">
                            <span>Cash</span>
                            <span>{formatCurrency(balance.assets.currentAssets.cash)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Accounts Receivable</span>
                            <span>{formatCurrency(balance.assets.currentAssets.accountsReceivable)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Inventory</span>
                            <span>{formatCurrency(balance.assets.currentAssets.inventory)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between font-medium border-t mt-2 pt-2">
                          <span>Total Current Assets</span>
                          <span>{formatCurrency(balance.assets.currentAssets.total)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-4">
                        <span>Total Assets</span>
                        <span className="text-primary">{formatCurrency(balance.assets.totalAssets)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities & Equity */}
                  <div>
                    <h3 className="font-semibold text-primary mb-4">LIABILITIES & EQUITY</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Liabilities</h4>
                        <div className="flex justify-between pl-4">
                          <span>Total Liabilities</span>
                          <span>{formatCurrency(balance.liabilities.totalLiabilities)}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Equity</h4>
                        <div className="flex justify-between pl-4">
                          <span>Owner's Equity</span>
                          <span>{formatCurrency(balance.equity.ownerEquity)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-4">
                        <span>Total Liabilities & Equity</span>
                        <span className="text-primary">
                          {formatCurrency(balance.liabilities.totalLiabilities + balance.equity.totalEquity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow Statement Tab */}
        <TabsContent value="cashflow">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cash Flow Statement</CardTitle>
                  <CardDescription>
                    {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {cashFlowLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : cashFlow ? (
                <div className="space-y-6">
                  {/* Operating Activities */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Cash Flows from Operating Activities
                    </h3>
                    <div className="space-y-2 ml-7">
                      <div className="flex justify-between py-2 border-b">
                        <span>Net Income</span>
                        <span className={cn(
                          "font-medium",
                          cashFlow.operating.netIncome >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatCurrency(cashFlow.operating.netIncome)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Add: Depreciation & Amortization</span>
                        <span className="font-medium">{formatCurrency(cashFlow.operating.depreciation)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Changes in Accounts Receivable</span>
                        <span className="font-medium">{formatCurrency(cashFlow.operating.accountsReceivableChange)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Changes in Inventory</span>
                        <span className="font-medium">{formatCurrency(cashFlow.operating.inventoryChange)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Changes in Accounts Payable</span>
                        <span className="font-medium">{formatCurrency(cashFlow.operating.accountsPayableChange)}</span>
                      </div>
                      <div className="flex justify-between py-2 bg-muted/30 px-2 rounded font-semibold">
                        <span>Net Cash from Operating Activities</span>
                        <span className={cn(
                          cashFlow.operating.total >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatCurrency(cashFlow.operating.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Investing Activities */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Cash Flows from Investing Activities
                    </h3>
                    <div className="space-y-2 ml-7">
                      <div className="flex justify-between py-2 border-b">
                        <span>Equipment Purchases</span>
                        <span className="font-medium text-red-600">
                          ({formatCurrency(cashFlow.investing.equipmentPurchases)})
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Asset Sales</span>
                        <span className="font-medium text-green-600">{formatCurrency(cashFlow.investing.assetSales)}</span>
                      </div>
                      <div className="flex justify-between py-2 bg-muted/30 px-2 rounded font-semibold">
                        <span>Net Cash from Investing Activities</span>
                        <span className={cn(
                          cashFlow.investing.total >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {cashFlow.investing.total >= 0 ? '' : '('}{formatCurrency(Math.abs(cashFlow.investing.total))}{cashFlow.investing.total >= 0 ? '' : ')'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financing Activities */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-purple-600" />
                      Cash Flows from Financing Activities
                    </h3>
                    <div className="space-y-2 ml-7">
                      <div className="flex justify-between py-2 border-b">
                        <span>Loan Proceeds</span>
                        <span className="font-medium text-green-600">{formatCurrency(cashFlow.financing.loanProceeds)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Loan Payments</span>
                        <span className="font-medium text-red-600">
                          ({formatCurrency(cashFlow.financing.loanPayments)})
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Owner Contributions</span>
                        <span className="font-medium text-green-600">{formatCurrency(cashFlow.financing.ownerContributions)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Owner Drawings</span>
                        <span className="font-medium text-red-600">
                          ({formatCurrency(cashFlow.financing.ownerDrawings)})
                        </span>
                      </div>
                      <div className="flex justify-between py-2 bg-muted/30 px-2 rounded font-semibold">
                        <span>Net Cash from Financing Activities</span>
                        <span className={cn(
                          cashFlow.financing.total >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {cashFlow.financing.total >= 0 ? '' : '('}{formatCurrency(Math.abs(cashFlow.financing.total))}{cashFlow.financing.total >= 0 ? '' : ')'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="border-t-2 pt-4 space-y-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Net Change in Cash</span>
                      <span className={cn(
                        cashFlow.netCashChange >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {formatCurrency(cashFlow.netCashChange)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Beginning Cash Balance</span>
                      <span className="font-medium">{formatCurrency(cashFlow.beginningCash)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Ending Cash Balance</span>
                      <span className="text-primary">{formatCurrency(cashFlow.endingCash)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Summary Tab */}
        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>GST/HST Summary</CardTitle>
                  <CardDescription>
                    {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {taxLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : tax ? (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          GST/HST Collected
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(tax.gstHstCollected)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          GST/HST Paid (ITCs)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                          {formatCurrency(tax.gstHstPaid)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-primary text-primary-foreground">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-80">
                          Net Tax Owing
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(tax.gstHstOwing)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">📋 CRA Remittance</h4>
                    <p className="text-sm text-muted-foreground">
                      Based on your collected GST/HST of {formatCurrency(tax.gstHstCollected)} and 
                      Input Tax Credits (ITCs) of {formatCurrency(tax.gstHstPaid)}, 
                      you {tax.gstHstOwing >= 0 ? 'owe' : 'are owed'} {formatCurrency(Math.abs(tax.gstHstOwing))} to CRA.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No tax data for this period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounts Aging Tab */}
        <TabsContent value="aging">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Accounts Receivable Aging</CardTitle>
                  <CardDescription>As of {formatDate(asOfDate)}</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {agingLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : aging ? (
                <div className="space-y-6">
                  {/* Aging Summary */}
                  <div className="grid grid-cols-6 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Current</div>
                        <div className="text-xl font-bold text-green-600">
                          {formatCurrency(aging.receivables.current)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">1-30 Days</div>
                        <div className="text-xl font-bold text-amber-500">
                          {formatCurrency(aging.receivables.days1to30)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">31-60 Days</div>
                        <div className="text-xl font-bold text-orange-500">
                          {formatCurrency(aging.receivables.days31to60)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">61-90 Days</div>
                        <div className="text-xl font-bold text-red-500">
                          {formatCurrency(aging.receivables.days61to90)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">90+ Days</div>
                        <div className="text-xl font-bold text-red-700">
                          {formatCurrency(aging.receivables.over90)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-primary text-primary-foreground">
                      <CardContent className="pt-4">
                        <div className="text-sm opacity-80">Total</div>
                        <div className="text-xl font-bold">
                          {formatCurrency(aging.receivables.total)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Invoice Details */}
                  {aging.receivables.items.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Invoice Date</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Days Overdue</TableHead>
                          <TableHead>Bucket</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {aging.receivables.items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{item.customerName}</TableCell>
                            <TableCell>{item.invoiceNumber}</TableCell>
                            <TableCell>{formatDate(item.invoiceDate)}</TableCell>
                            <TableCell>{formatDate(item.dueDate)}</TableCell>
                            <TableCell>
                              {item.daysOverdue > 0 ? (
                                <Badge variant="destructive">{item.daysOverdue} days</Badge>
                              ) : (
                                <Badge variant="outline">Current</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.bucket}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No outstanding receivables 🎉
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
