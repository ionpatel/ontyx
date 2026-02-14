'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Plus, Search, Calendar, DollarSign, Users, Clock,
  CheckCircle, AlertCircle, PlayCircle, FileText,
  ArrowRight, TrendingUp, Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { mockPayrollRuns, mockPayrollStats } from '@/lib/mock-data/payroll'
import { PayrollRun, PayrollStatus } from '@/types/payroll'

const statusConfig: Record<PayrollStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'text-gray-600', bg: 'bg-gray-100', icon: FileText },
  pending: { label: 'Pending Approval', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock },
  processing: { label: 'Processing', color: 'text-blue-600', bg: 'bg-blue-100', icon: PlayCircle },
  completed: { label: 'Completed', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-100', icon: AlertCircle },
}

function StatCard({ title, value, subtitle, icon: Icon, color }: { 
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  color?: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center",
            color || "bg-primary/10"
          )}>
            <Icon className={cn("h-6 w-6", color ? "text-white" : "text-primary")} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PayrollRunCard({ run }: { run: PayrollRun }) {
  const status = statusConfig[run.status]
  const StatusIcon = status.icon
  
  return (
    <Link href={`/payroll/${run.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{run.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(run.periodStart)} - {formatDate(run.periodEnd)}
              </p>
            </div>
            <Badge className={cn(status.bg, status.color, "border-0")}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div>
              <p className="text-sm text-muted-foreground">Employees</p>
              <p className="text-lg font-semibold">{run.totalEmployees}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gross Pay</p>
              <p className="text-lg font-semibold">{formatCurrency(run.totalGross)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Pay</p>
              <p className="text-lg font-semibold text-primary">{formatCurrency(run.totalNet)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Pay Date: {formatDate(run.payDate)}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function PayrollPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PayrollStatus | 'all'>('all')

  const filteredRuns = mockPayrollRuns.filter(run => {
    const matchesSearch = run.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || run.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
          <p className="text-muted-foreground">Manage payroll runs and employee compensation</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Payroll Run
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard 
          title="YTD Payroll" 
          value={formatCurrency(mockPayrollStats.totalPayrollYTD)}
          subtitle="Total processed"
          icon={DollarSign}
        />
        <StatCard 
          title="Last Payroll" 
          value={formatCurrency(mockPayrollStats.lastPayrollAmount)}
          subtitle="72 employees"
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatCard 
          title="Avg Salary" 
          value={formatCurrency(mockPayrollStats.avgSalary)}
          subtitle="Per employee/year"
          icon={Users}
        />
        <StatCard 
          title="Next Payroll" 
          value={formatDate(mockPayrollStats.nextPayrollDate, { month: 'short', day: 'numeric' })}
          subtitle={`${mockPayrollStats.pendingApprovals} pending approvals`}
          icon={Calendar}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Button variant="outline">
              <PlayCircle className="h-4 w-4 mr-2" />
              Start Payroll Run
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              View Reports
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Manage Employees
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payroll runs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              {Object.entries(statusConfig).slice(0, 4).map(([key, config]) => (
                <Button
                  key={key}
                  variant={statusFilter === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(key as PayrollStatus)}
                >
                  {config.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Runs */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Payroll Runs</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {filteredRuns.map((run) => (
            <PayrollRunCard key={run.id} run={run} />
          ))}
        </div>
      </div>

      {filteredRuns.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No payroll runs found</p>
          </CardContent>
        </Card>
      )}

      {/* Upcoming */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming</CardTitle>
          <CardDescription>Scheduled payroll activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">March 2024 - Period 1</p>
                  <p className="text-sm text-muted-foreground">Pay date: March 15, 2024</p>
                </div>
              </div>
              <Button size="sm">Prepare</Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Tax Filing Deadline</p>
                  <p className="text-sm text-muted-foreground">Q1 payroll taxes due: April 15, 2024</p>
                </div>
              </div>
              <Badge variant="warning">Upcoming</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
