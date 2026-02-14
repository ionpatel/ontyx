'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Download, Send, CheckCircle, XCircle, 
  DollarSign, Users, Calendar, FileText, Printer,
  ChevronDown, ChevronRight, Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { cn, formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { mockPayrollRuns, mockPayslips } from '@/lib/mock-data/payroll'
import { PayrollStatus, Payslip, PayslipStatus } from '@/types/payroll'

const statusConfig: Record<PayrollStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-gray-600', bg: 'bg-gray-100' },
  pending: { label: 'Pending Approval', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  processing: { label: 'Processing', color: 'text-blue-600', bg: 'bg-blue-100' },
  completed: { label: 'Completed', color: 'text-green-600', bg: 'bg-green-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-100' },
}

const payslipStatusConfig: Record<PayslipStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-600' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-600' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600' },
}

function PayslipRow({ payslip, expanded, onToggle }: { 
  payslip: Payslip
  expanded: boolean
  onToggle: () => void
}) {
  const status = payslipStatusConfig[payslip.status]
  
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
            <AvatarFallback>{getInitials(payslip.employeeName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{payslip.employeeName}</p>
            <p className="text-sm text-muted-foreground">{payslip.department}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <p className="text-sm text-muted-foreground">Gross</p>
            <p className="font-medium">{formatCurrency(payslip.grossPay)}</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-sm text-muted-foreground">Deductions</p>
            <p className="font-medium text-red-500">-{formatCurrency(payslip.totalDeductions)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Net Pay</p>
            <p className="font-semibold text-primary">{formatCurrency(payslip.netPay)}</p>
          </div>
          <Badge className={cn(status.color, "border-0")}>
            {status.label}
          </Badge>
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
                {payslip.earnings.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex items-center justify-between font-medium">
                  <span>Total Earnings</span>
                  <span className="text-green-600">{formatCurrency(payslip.grossPay)}</span>
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
                {payslip.deductions.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-medium text-red-500">-{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex items-center justify-between font-medium">
                  <span>Total Deductions</span>
                  <span className="text-red-600">-{formatCurrency(payslip.totalDeductions)}</span>
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
                <span className="font-medium">{formatCurrency(payslip.ytdGross)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">YTD Net: </span>
                <span className="font-medium">{formatCurrency(payslip.ytdNet)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [expandedPayslip, setExpandedPayslip] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  
  const payrollRun = mockPayrollRuns.find(r => r.id === id)

  if (!payrollRun) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold">Payroll run not found</h2>
        <p className="text-muted-foreground mt-2">The payroll run you're looking for doesn't exist.</p>
        <Link href="/payroll">
          <Button className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payroll
          </Button>
        </Link>
      </div>
    )
  }

  const status = statusConfig[payrollRun.status]
  const payslips = mockPayslips.filter(p => 
    p.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    p.department.toLowerCase().includes(search.toLowerCase())
  )

  const isEditable = payrollRun.status === 'draft' || payrollRun.status === 'pending'
  const canProcess = payrollRun.status === 'pending'
  const isComplete = payrollRun.status === 'completed'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/payroll">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{payrollRun.name}</h1>
            <Badge className={cn(status.bg, status.color, "border-0")}>
              {status.label}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {formatDate(payrollRun.periodStart)} - {formatDate(payrollRun.periodEnd)}
          </p>
        </div>
        <div className="flex gap-2">
          {canProcess && (
            <Button variant="success">
              <CheckCircle className="h-4 w-4 mr-2" />
              Process Payroll
            </Button>
          )}
          {isEditable && (
            <Button variant="destructive">
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
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
                <p className="text-2xl font-bold">{payrollRun.totalEmployees}</p>
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
                <p className="text-2xl font-bold">{formatCurrency(payrollRun.totalGross)}</p>
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
                <p className="text-2xl font-bold">{formatCurrency(payrollRun.totalDeductions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Pay</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(payrollRun.totalNet)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Pay Period</p>
              <p className="font-medium">{payrollRun.period.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pay Date</p>
              <p className="font-medium">{formatDate(payrollRun.payDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created By</p>
              <p className="font-medium">{payrollRun.createdBy}</p>
            </div>
            {payrollRun.processedBy && (
              <div>
                <p className="text-sm text-muted-foreground">Processed By</p>
                <p className="font-medium">{payrollRun.processedBy}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payslips */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payslips</CardTitle>
              <CardDescription>Individual employee payslips for this run</CardDescription>
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
          <div className="space-y-3">
            {payslips.map((payslip) => (
              <PayslipRow
                key={payslip.id}
                payslip={payslip}
                expanded={expandedPayslip === payslip.id}
                onToggle={() => setExpandedPayslip(
                  expandedPayslip === payslip.id ? null : payslip.id
                )}
              />
            ))}
          </div>
          
          {payslips.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No payslips found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
