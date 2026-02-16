'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Download, CheckCircle, XCircle, 
  DollarSign, Users, Calendar, FileText, Printer,
  ChevronDown, ChevronRight, Mail, Loader2, PlayCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { cn, formatCurrency } from '@/lib/utils'
import { usePayRunDetail } from '@/hooks/use-pay-runs'
import { payRunsService, type PayRunStatus, type PayRunEmployee } from '@/services/pay-runs'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/toast'
import { generatePayStubPDF } from '@/services/pdf-paystub'

const statusConfig: Record<PayRunStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-gray-600', bg: 'bg-gray-100' },
  pending: { label: 'Pending Approval', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  approved: { label: 'Approved', color: 'text-blue-600', bg: 'bg-blue-100' },
  processing: { label: 'Processing', color: 'text-indigo-600', bg: 'bg-indigo-100' },
  completed: { label: 'Completed', color: 'text-green-600', bg: 'bg-green-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-100' },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function EmployeePayRow({ employee, payDate, expanded, onToggle }: { 
  employee: PayRunEmployee
  payDate: string
  expanded: boolean
  onToggle: () => void
}) {
  const handleDownloadPDF = () => {
    generatePayStubPDF({
      employeeName: employee.employeeName,
      employeeEmail: employee.employeeEmail,
      payDate,
      periodStart: '', // Would come from pay run
      periodEnd: '',
      regularHours: employee.regularHours,
      regularPay: employee.regularPay,
      overtimeHours: employee.overtimeHours,
      overtimePay: employee.overtimePay,
      otherEarnings: employee.otherEarnings,
      grossPay: employee.grossPay,
      cpp: employee.cpp,
      cpp2: employee.cpp2,
      ei: employee.ei,
      federalTax: employee.federalTax,
      provincialTax: employee.provincialTax,
      otherDeductions: employee.otherDeductions,
      totalDeductions: employee.totalDeductions,
      netPay: employee.netPay,
      ytdGross: employee.ytdGross,
      ytdCpp: employee.ytdCpp,
      ytdEi: employee.ytdEi,
      ytdNet: employee.ytdNet,
    })
  }

  return (
    <div className="border rounded-lg">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-6 w-6">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(employee.employeeName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{employee.employeeName}</p>
            {employee.employeeEmail && (
              <p className="text-sm text-muted-foreground">{employee.employeeEmail}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <p className="text-sm text-muted-foreground">Gross</p>
            <p className="font-medium">{formatCurrency(employee.grossPay, 'CAD')}</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-sm text-muted-foreground">Deductions</p>
            <p className="font-medium text-red-500">-{formatCurrency(employee.totalDeductions, 'CAD')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Net Pay</p>
            <p className="font-semibold text-primary">{formatCurrency(employee.netPay, 'CAD')}</p>
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="border-t p-4 bg-muted/30">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Earnings */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                Earnings
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Regular Pay ({employee.regularHours.toFixed(1)} hrs)
                  </span>
                  <span className="font-medium">{formatCurrency(employee.regularPay, 'CAD')}</span>
                </div>
                {employee.overtimePay > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Overtime ({employee.overtimeHours.toFixed(1)} hrs)
                    </span>
                    <span className="font-medium">{formatCurrency(employee.overtimePay, 'CAD')}</span>
                  </div>
                )}
                {employee.otherEarnings > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Other Earnings</span>
                    <span className="font-medium">{formatCurrency(employee.otherEarnings, 'CAD')}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex items-center justify-between font-medium">
                  <span>Total Earnings</span>
                  <span className="text-green-600">{formatCurrency(employee.grossPay, 'CAD')}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-red-500" />
                Deductions
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">CPP</span>
                  <span className="font-medium text-red-500">-{formatCurrency(employee.cpp, 'CAD')}</span>
                </div>
                {employee.cpp2 > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">CPP2 (Enhanced)</span>
                    <span className="font-medium text-red-500">-{formatCurrency(employee.cpp2, 'CAD')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">EI</span>
                  <span className="font-medium text-red-500">-{formatCurrency(employee.ei, 'CAD')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Federal Tax</span>
                  <span className="font-medium text-red-500">-{formatCurrency(employee.federalTax, 'CAD')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Provincial Tax</span>
                  <span className="font-medium text-red-500">-{formatCurrency(employee.provincialTax, 'CAD')}</span>
                </div>
                {employee.otherDeductions > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Other Deductions</span>
                    <span className="font-medium text-red-500">-{formatCurrency(employee.otherDeductions, 'CAD')}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex items-center justify-between font-medium">
                  <span>Total Deductions</span>
                  <span className="text-red-600">-{formatCurrency(employee.totalDeductions, 'CAD')}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* YTD and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">YTD Gross: </span>
                <span className="font-medium">{formatCurrency(employee.ytdGross, 'CAD')}</span>
              </div>
              <div>
                <span className="text-muted-foreground">YTD CPP: </span>
                <span className="font-medium">{formatCurrency(employee.ytdCpp, 'CAD')}</span>
              </div>
              <div>
                <span className="text-muted-foreground">YTD EI: </span>
                <span className="font-medium">{formatCurrency(employee.ytdEi, 'CAD')}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Pay Stub
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PayRunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { payRun, employees, loading } = usePayRunDetail(id)
  const { organizationId } = useAuth()
  const { success, error: showError } = useToast()
  
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const effectiveOrgId = organizationId || 'demo'

  const handleApprove = async () => {
    setActionLoading('approve')
    const result = await payRunsService.updateStatus(id, 'approved', effectiveOrgId)
    setActionLoading(null)
    if (result) {
      success('Pay Run Approved', 'Pay run has been approved and is ready for processing')
      window.location.reload() // Refresh to get updated status
    } else {
      showError('Approval Failed', 'Could not approve pay run')
    }
  }

  const handleProcess = async () => {
    setActionLoading('process')
    const result = await payRunsService.updateStatus(id, 'completed', effectiveOrgId)
    setActionLoading(null)
    if (result) {
      success('Pay Run Completed', 'Pay run has been processed successfully')
      window.location.reload()
    } else {
      showError('Processing Failed', 'Could not process pay run')
    }
  }

  const handleCancel = async () => {
    setActionLoading('cancel')
    const result = await payRunsService.updateStatus(id, 'cancelled', effectiveOrgId)
    setActionLoading(null)
    if (result) {
      success('Pay Run Cancelled', 'Pay run has been cancelled')
      window.location.reload()
    } else {
      showError('Cancellation Failed', 'Could not cancel pay run')
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!payRun) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold">Pay run not found</h2>
        <p className="text-muted-foreground mt-2">The pay run you're looking for doesn't exist.</p>
        <Link href="/payroll">
          <Button className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payroll
          </Button>
        </Link>
      </div>
    )
  }

  const status = statusConfig[payRun.status]
  const filteredEmployees = employees.filter(e => 
    e.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    (e.employeeEmail?.toLowerCase().includes(search.toLowerCase()))
  )

  const canApprove = payRun.status === 'draft'
  const canProcess = payRun.status === 'approved'
  const canCancel = payRun.status === 'draft' || payRun.status === 'approved'

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/payroll">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{payRun.name}</h1>
            <Badge className={cn(status.bg, status.color, "border-0")}>
              {status.label}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {formatDate(payRun.periodStart)} - {formatDate(payRun.periodEnd)}
          </p>
        </div>
        <div className="flex gap-2">
          {canApprove && (
            <Button 
              onClick={handleApprove}
              disabled={actionLoading === 'approve'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {actionLoading === 'approve' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve
            </Button>
          )}
          {canProcess && (
            <Button 
              onClick={handleProcess}
              disabled={actionLoading === 'process'}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading === 'process' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4 mr-2" />
              )}
              Process Payroll
            </Button>
          )}
          {canCancel && (
            <Button 
              variant="destructive"
              onClick={handleCancel}
              disabled={actionLoading === 'cancel'}
            >
              {actionLoading === 'cancel' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Cancel
            </Button>
          )}
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print All
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Employees</p>
                <p className="text-2xl font-bold">{payRun.totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gross Pay</p>
                <p className="text-2xl font-bold">{formatCurrency(payRun.totalGross, 'CAD')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-100">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deductions</p>
                <p className="text-2xl font-bold">{formatCurrency(payRun.totalDeductions, 'CAD')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Pay</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(payRun.totalNet, 'CAD')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deduction Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Deduction Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">CPP</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(payRun.totalCpp, 'CAD')}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">EI</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(payRun.totalEi, 'CAD')}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Federal Tax</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(payRun.totalFederalTax, 'CAD')}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Provincial Tax</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(payRun.totalProvincialTax, 'CAD')}</p>
            </div>
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-muted-foreground">Total Deductions</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(payRun.totalDeductions, 'CAD')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pay Details */}
      <Card>
        <CardHeader>
          <CardTitle>Pay Run Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Pay Frequency</p>
              <p className="font-medium capitalize">{payRun.payFrequency.replace('-', ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pay Date</p>
              <p className="font-medium">{formatDate(payRun.payDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{formatDate(payRun.createdAt)}</p>
            </div>
            {payRun.processedAt && (
              <div>
                <p className="text-sm text-muted-foreground">Processed</p>
                <p className="font-medium">{formatDate(payRun.processedAt)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Employee Payslips */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employee Payslips</CardTitle>
              <CardDescription>Individual pay breakdown for each employee</CardDescription>
            </div>
            <div className="w-64">
              <Input
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {employees.length === 0 
                ? 'No employees in this pay run' 
                : 'No employees match your search'
              }
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEmployees.map((employee) => (
                <EmployeePayRow
                  key={employee.id}
                  employee={employee}
                  payDate={payRun.payDate}
                  expanded={expandedEmployee === employee.id}
                  onToggle={() => setExpandedEmployee(
                    expandedEmployee === employee.id ? null : employee.id
                  )}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
