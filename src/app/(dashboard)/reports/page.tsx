"use client"

import { useState } from "react"
import { 
  FileText, TrendingUp, TrendingDown, DollarSign, 
  Calendar, Download, BarChart3, PieChart, 
  ArrowUpRight, ArrowDownRight, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow, TableFooter 
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { mockInvoices, mockBills, mockChartOfAccounts } from "@/lib/mock-data"

// Mock report data
const profitLossData = {
  period: { start: "2024-01-01", end: "2024-02-14" },
  revenue: [
    { name: "Sales Revenue", amount: 125000 },
    { name: "Service Revenue", amount: 85000 },
    { name: "Other Income", amount: 5000 },
  ],
  expenses: [
    { name: "Cost of Goods Sold", amount: 45000 },
    { name: "Salaries & Wages", amount: 65000 },
    { name: "Rent Expense", amount: 24000 },
    { name: "Utilities", amount: 4500 },
    { name: "Office Supplies", amount: 3850 },
    { name: "Software & Services", amount: 12000 },
    { name: "Marketing & Advertising", amount: 8000 },
    { name: "Professional Fees", amount: 5000 },
    { name: "Depreciation", amount: 5000 },
  ],
}

const balanceSheetData = {
  assets: {
    current: [
      { name: "Cash and Cash Equivalents", amount: 211170.50 },
      { name: "Accounts Receivable", amount: 24650 },
      { name: "Inventory", amount: 15000 },
      { name: "Prepaid Expenses", amount: 5000 },
    ],
    nonCurrent: [
      { name: "Fixed Assets", amount: 75000 },
      { name: "Less: Accumulated Depreciation", amount: -15000 },
    ],
  },
  liabilities: {
    current: [
      { name: "Accounts Payable", amount: 9275 },
      { name: "Accrued Expenses", amount: 3500 },
      { name: "Sales Tax Payable", amount: 2650 },
    ],
    nonCurrent: [
      { name: "Long-term Debt", amount: 50000 },
    ],
  },
  equity: [
    { name: "Owner's Equity", amount: 150000 },
    { name: "Retained Earnings", amount: 75000 },
    { name: "Current Period Earnings", amount: 25395.50 },
  ],
}

const cashFlowData = {
  operating: [
    { name: "Net Income", amount: 42650 },
    { name: "Depreciation", amount: 5000 },
    { name: "Changes in Accounts Receivable", amount: -8500 },
    { name: "Changes in Accounts Payable", amount: 2500 },
    { name: "Changes in Inventory", amount: -3000 },
  ],
  investing: [
    { name: "Purchase of Equipment", amount: -15000 },
    { name: "Sale of Assets", amount: 0 },
  ],
  financing: [
    { name: "Loan Proceeds", amount: 0 },
    { name: "Loan Repayments", amount: -5000 },
    { name: "Owner Distributions", amount: -10000 },
  ],
  opening: 192170.50,
}

// Generate aged receivables from invoices
const generateAgedReceivables = () => {
  const today = new Date()
  const items: { name: string; current: number; days30: number; days60: number; days90: number; over90: number; total: number }[] = []
  
  const customerInvoices = mockInvoices.reduce((acc, inv) => {
    if (inv.amountDue > 0) {
      const key = inv.customerName
      if (!acc[key]) acc[key] = { name: key, current: 0, days30: 0, days60: 0, days90: 0, over90: 0, total: 0 }
      
      const dueDate = new Date(inv.dueDate)
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysOverdue <= 0) acc[key].current += inv.amountDue
      else if (daysOverdue <= 30) acc[key].days30 += inv.amountDue
      else if (daysOverdue <= 60) acc[key].days60 += inv.amountDue
      else if (daysOverdue <= 90) acc[key].days90 += inv.amountDue
      else acc[key].over90 += inv.amountDue
      
      acc[key].total += inv.amountDue
    }
    return acc
  }, {} as Record<string, any>)
  
  return Object.values(customerInvoices)
}

const agedReceivables = generateAgedReceivables()

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("ytd")

  const totalRevenue = profitLossData.revenue.reduce((sum, r) => sum + r.amount, 0)
  const totalExpenses = profitLossData.expenses.reduce((sum, e) => sum + e.amount, 0)
  const netProfit = totalRevenue - totalExpenses
  const grossProfit = totalRevenue - profitLossData.expenses.find(e => e.name === "Cost of Goods Sold")!.amount

  const totalCurrentAssets = balanceSheetData.assets.current.reduce((sum, a) => sum + a.amount, 0)
  const totalNonCurrentAssets = balanceSheetData.assets.nonCurrent.reduce((sum, a) => sum + a.amount, 0)
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets

  const totalCurrentLiabilities = balanceSheetData.liabilities.current.reduce((sum, l) => sum + l.amount, 0)
  const totalNonCurrentLiabilities = balanceSheetData.liabilities.nonCurrent.reduce((sum, l) => sum + l.amount, 0)
  const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities

  const totalEquity = balanceSheetData.equity.reduce((sum, e) => sum + e.amount, 0)

  const netOperatingCash = cashFlowData.operating.reduce((sum, o) => sum + o.amount, 0)
  const netInvestingCash = cashFlowData.investing.reduce((sum, i) => sum + i.amount, 0)
  const netFinancingCash = cashFlowData.financing.reduce((sum, f) => sum + f.amount, 0)
  const netCashChange = netOperatingCash + netInvestingCash + netFinancingCash
  const closingCash = cashFlowData.opening + netCashChange

  const arTotals = agedReceivables.reduce(
    (acc, item) => ({
      current: acc.current + item.current,
      days30: acc.days30 + item.days30,
      days60: acc.days60 + item.days60,
      days90: acc.days90 + item.days90,
      over90: acc.over90 + item.over90,
      total: acc.total + item.total,
    }),
    { current: 0, days30: 0, days60: 0, days90: 0, over90: 0, total: 0 }
  )

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Financial reports and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mtd">Month to Date</SelectItem>
              <SelectItem value="qtd">Quarter to Date</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="last-quarter">Last Quarter</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-success" />
              <span className="text-success">+12.5%</span> from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3 text-destructive" />
              <span className="text-destructive">+5.2%</span> from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", netProfit >= 0 ? "text-success" : "text-destructive")}>
              {formatCurrency(netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((netProfit / totalRevenue) * 100).toFixed(1)}% profit margin
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding AR</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(arTotals.total)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(arTotals.days30 + arTotals.days60 + arTotals.days90 + arTotals.over90)} overdue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue="pl" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none lg:flex">
          <TabsTrigger value="pl">
            <BarChart3 className="mr-2 h-4 w-4" />
            Profit & Loss
          </TabsTrigger>
          <TabsTrigger value="balance">
            <PieChart className="mr-2 h-4 w-4" />
            Balance Sheet
          </TabsTrigger>
          <TabsTrigger value="cashflow">
            <DollarSign className="mr-2 h-4 w-4" />
            Cash Flow
          </TabsTrigger>
          <TabsTrigger value="aged">
            <Clock className="mr-2 h-4 w-4" />
            Aged Reports
          </TabsTrigger>
        </TabsList>

        {/* Profit & Loss */}
        <TabsContent value="pl">
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <CardDescription>
                {formatDate(profitLossData.period.start)} - {formatDate(profitLossData.period.end)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Revenue Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-success">Revenue</h3>
                  <Table>
                    <TableBody>
                      {profitLossData.revenue.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="pl-6">{item.name}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="font-semibold">
                        <TableCell>Total Revenue</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalRevenue)}</TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>

                <Separator />

                {/* Expenses Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-destructive">Expenses</h3>
                  <Table>
                    <TableBody>
                      {profitLossData.expenses.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="pl-6">{item.name}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="font-semibold">
                        <TableCell>Total Expenses</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalExpenses)}</TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>

                <Separator />

                {/* Summary */}
                <div className="bg-muted/50 rounded-lg p-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Gross Profit</p>
                      <p className="text-2xl font-bold">{formatCurrency(grossProfit)}</p>
                      <p className="text-sm text-muted-foreground">
                        {((grossProfit / totalRevenue) * 100).toFixed(1)}% margin
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Operating Expenses</p>
                      <p className="text-2xl font-bold">{formatCurrency(totalExpenses - 45000)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Net Profit</p>
                      <p className={cn("text-2xl font-bold", netProfit >= 0 ? "text-success" : "text-destructive")}>
                        {formatCurrency(netProfit)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {((netProfit / totalRevenue) * 100).toFixed(1)}% margin
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance Sheet */}
        <TabsContent value="balance">
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>As of {formatDate(new Date().toISOString())}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Assets */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Assets</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-muted-foreground mb-2">Current Assets</h4>
                      <Table>
                        <TableBody>
                          {balanceSheetData.assets.current.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="pl-6">{item.name}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TableCell className="font-medium">Total Current Assets</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(totalCurrentAssets)}</TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground mb-2">Non-Current Assets</h4>
                      <Table>
                        <TableBody>
                          {balanceSheetData.assets.nonCurrent.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="pl-6">{item.name}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TableCell className="font-medium">Total Non-Current Assets</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(totalNonCurrentAssets)}</TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">Total Assets</span>
                      <span className="font-bold text-xl">{formatCurrency(totalAssets)}</span>
                    </div>
                  </div>
                </div>

                {/* Liabilities & Equity */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Liabilities & Equity</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-muted-foreground mb-2">Current Liabilities</h4>
                      <Table>
                        <TableBody>
                          {balanceSheetData.liabilities.current.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="pl-6">{item.name}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TableCell className="font-medium">Total Current Liabilities</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(totalCurrentLiabilities)}</TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground mb-2">Non-Current Liabilities</h4>
                      <Table>
                        <TableBody>
                          {balanceSheetData.liabilities.nonCurrent.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="pl-6">{item.name}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TableCell className="font-medium">Total Liabilities</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(totalLiabilities)}</TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground mb-2">Equity</h4>
                      <Table>
                        <TableBody>
                          {balanceSheetData.equity.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="pl-6">{item.name}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TableCell className="font-medium">Total Equity</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(totalEquity)}</TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">Total Liabilities & Equity</span>
                      <span className="font-bold text-xl">{formatCurrency(totalLiabilities + totalEquity)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow */}
        <TabsContent value="cashflow">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Statement</CardTitle>
              <CardDescription>
                {formatDate(profitLossData.period.start)} - {formatDate(profitLossData.period.end)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Operating Activities */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Operating Activities</h3>
                  <Table>
                    <TableBody>
                      {cashFlowData.operating.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="pl-6">{item.name}</TableCell>
                          <TableCell className={cn("text-right", item.amount < 0 && "text-destructive")}>
                            {formatCurrency(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell className="font-semibold">Net Cash from Operating</TableCell>
                        <TableCell className={cn("text-right font-semibold", netOperatingCash >= 0 ? "text-success" : "text-destructive")}>
                          {formatCurrency(netOperatingCash)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>

                {/* Investing Activities */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Investing Activities</h3>
                  <Table>
                    <TableBody>
                      {cashFlowData.investing.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="pl-6">{item.name}</TableCell>
                          <TableCell className={cn("text-right", item.amount < 0 && "text-destructive")}>
                            {item.amount === 0 ? "—" : formatCurrency(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell className="font-semibold">Net Cash from Investing</TableCell>
                        <TableCell className={cn("text-right font-semibold", netInvestingCash >= 0 ? "text-success" : "text-destructive")}>
                          {formatCurrency(netInvestingCash)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>

                {/* Financing Activities */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Financing Activities</h3>
                  <Table>
                    <TableBody>
                      {cashFlowData.financing.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="pl-6">{item.name}</TableCell>
                          <TableCell className={cn("text-right", item.amount < 0 && "text-destructive")}>
                            {item.amount === 0 ? "—" : formatCurrency(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell className="font-semibold">Net Cash from Financing</TableCell>
                        <TableCell className={cn("text-right font-semibold", netFinancingCash >= 0 ? "text-success" : "text-destructive")}>
                          {formatCurrency(netFinancingCash)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>

                <Separator />

                {/* Summary */}
                <div className="bg-muted/50 rounded-lg p-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Opening Cash Balance</span>
                    <span className="font-medium">{formatCurrency(cashFlowData.opening)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Change in Cash</span>
                    <span className={cn("font-medium", netCashChange >= 0 ? "text-success" : "text-destructive")}>
                      {netCashChange >= 0 ? "+" : ""}{formatCurrency(netCashChange)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-semibold text-lg">Closing Cash Balance</span>
                    <span className="font-bold text-xl">{formatCurrency(closingCash)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aged Reports */}
        <TabsContent value="aged">
          <div className="space-y-6">
            {/* Aged Receivables */}
            <Card>
              <CardHeader>
                <CardTitle>Aged Receivables</CardTitle>
                <CardDescription>Outstanding customer invoices by age</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">1-30 Days</TableHead>
                      <TableHead className="text-right">31-60 Days</TableHead>
                      <TableHead className="text-right">61-90 Days</TableHead>
                      <TableHead className="text-right">90+ Days</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agedReceivables.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{item.current > 0 ? formatCurrency(item.current) : "—"}</TableCell>
                        <TableCell className="text-right">{item.days30 > 0 ? formatCurrency(item.days30) : "—"}</TableCell>
                        <TableCell className="text-right">{item.days60 > 0 ? formatCurrency(item.days60) : "—"}</TableCell>
                        <TableCell className="text-right">{item.days90 > 0 ? formatCurrency(item.days90) : "—"}</TableCell>
                        <TableCell className="text-right text-destructive">{item.over90 > 0 ? formatCurrency(item.over90) : "—"}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="font-semibold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{arTotals.current > 0 ? formatCurrency(arTotals.current) : "—"}</TableCell>
                      <TableCell className="text-right">{arTotals.days30 > 0 ? formatCurrency(arTotals.days30) : "—"}</TableCell>
                      <TableCell className="text-right">{arTotals.days60 > 0 ? formatCurrency(arTotals.days60) : "—"}</TableCell>
                      <TableCell className="text-right">{arTotals.days90 > 0 ? formatCurrency(arTotals.days90) : "—"}</TableCell>
                      <TableCell className="text-right text-destructive">{arTotals.over90 > 0 ? formatCurrency(arTotals.over90) : "—"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(arTotals.total)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>

            {/* Aged Payables Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Aged Payables</CardTitle>
                <CardDescription>Outstanding vendor bills by age</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">1-30 Days</TableHead>
                      <TableHead className="text-right">31-60 Days</TableHead>
                      <TableHead className="text-right">61-90 Days</TableHead>
                      <TableHead className="text-right">90+ Days</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockBills.filter(b => b.amountDue > 0).map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">{bill.vendorName}</TableCell>
                        <TableCell className="text-right">{formatCurrency(bill.amountDue)}</TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(bill.amountDue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="font-semibold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(mockBills.filter(b => b.amountDue > 0).reduce((sum, b) => sum + b.amountDue, 0))}
                      </TableCell>
                      <TableCell className="text-right">—</TableCell>
                      <TableCell className="text-right">—</TableCell>
                      <TableCell className="text-right">—</TableCell>
                      <TableCell className="text-right">—</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(mockBills.filter(b => b.amountDue > 0).reduce((sum, b) => sum + b.amountDue, 0))}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
