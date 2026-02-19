'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { formatCurrency, cn } from '@/lib/utils'

interface MonthlyData {
  month: string
  revenue: number
  expenses: number
  profit: number
}

type ChartView = 'area' | 'bar'

export function RevenueChart() {
  const { organizationId, loading: authLoading } = useAuth()
  const [data, setData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ChartView>('area')
  const [period, setPeriod] = useState<'6m' | '12m'>('6m')

  useEffect(() => {
    if (!organizationId || authLoading) return

    const fetchData = async () => {
      setLoading(true)
      const supabase = createClient()

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - (period === '6m' ? 6 : 12))

      // Get invoices by month
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total, issue_date')
        .eq('organization_id', organizationId)
        .gte('issue_date', startDate.toISOString().split('T')[0])
        .lte('issue_date', endDate.toISOString().split('T')[0])
        .in('status', ['sent', 'paid', 'partial'])

      // Get expenses by month (from bank transactions)
      const { data: expenses } = await supabase
        .from('bank_transactions')
        .select('amount, transaction_date')
        .eq('organization_id', organizationId)
        .eq('transaction_type', 'debit')
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0])

      // Group by month
      const monthlyMap: Record<string, { revenue: number; expenses: number }> = {}

      // Initialize months
      const months = period === '6m' ? 6 : 12
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const key = d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short' })
        monthlyMap[key] = { revenue: 0, expenses: 0 }
      }

      // Aggregate invoices
      ;(invoices || []).forEach(inv => {
        const d = new Date(inv.issue_date)
        const key = d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short' })
        if (monthlyMap[key]) {
          monthlyMap[key].revenue += inv.total || 0
        }
      })

      // Aggregate expenses
      ;(expenses || []).forEach(exp => {
        const d = new Date(exp.transaction_date)
        const key = d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short' })
        if (monthlyMap[key]) {
          monthlyMap[key].expenses += Math.abs(exp.amount || 0)
        }
      })

      // Convert to array
      const chartData = Object.entries(monthlyMap).map(([month, values]) => ({
        month,
        revenue: Math.round(values.revenue),
        expenses: Math.round(values.expenses),
        profit: Math.round(values.revenue - values.expenses),
      }))

      setData(chartData)
      setLoading(false)
    }

    fetchData()
  }, [organizationId, authLoading, period])

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
  const totalExpenses = data.reduce((sum, d) => sum + d.expenses, 0)
  const totalProfit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  // Calculate trend (compare last month to previous)
  const lastMonth = data[data.length - 1]?.revenue || 0
  const prevMonth = data[data.length - 2]?.revenue || 0
  const trend = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0

  const formatTooltipValue = (value: number) => formatCurrency(value)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null

    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }} 
            />
            <span className="capitalize">{entry.name}:</span>
            <span className="font-medium">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    )
  }

  if (loading || authLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Revenue Overview
          </CardTitle>
          <CardDescription>
            {period === '6m' ? 'Last 6 months' : 'Last 12 months'} performance
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as '6m' | '12m')}>
            <TabsList className="h-8">
              <TabsTrigger value="6m" className="text-xs px-2">6M</TabsTrigger>
              <TabsTrigger value="12m" className="text-xs px-2">12M</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={view} onValueChange={(v) => setView(v as ChartView)}>
            <TabsList className="h-8">
              <TabsTrigger value="area" className="text-xs px-2">Area</TabsTrigger>
              <TabsTrigger value="bar" className="text-xs px-2">Bar</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Net Profit</p>
            <p className={cn(
              "text-xl font-bold",
              totalProfit >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatCurrency(totalProfit)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Month Trend</p>
            <p className={cn(
              "text-xl font-bold flex items-center gap-1",
              trend >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(trend).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            {view === 'area' ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#colorExpenses)"
                  name="Expenses"
                />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="revenue" fill="#22c55e" name="Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
