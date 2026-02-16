'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Plus, Calendar, DollarSign, Users, Clock,
  CheckCircle, AlertCircle, PlayCircle, FileText,
  ArrowRight, TrendingUp, Calculator, Leaf, Loader2,
  MoreHorizontal, Trash2, Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn, formatCurrency } from '@/lib/utils'
import { payrollService, TAX_YEAR, FEDERAL_BPA } from '@/services/payroll'
import { usePayRuns } from '@/hooks/use-pay-runs'
import { useToast } from '@/components/ui/toast'
import type { PayRunStatus, PayFrequency } from '@/services/pay-runs'

const PROVINCES = [
  { value: 'ON', label: 'Ontario' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'AB', label: 'Alberta' },
  { value: 'QC', label: 'Quebec' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland' },
  { value: 'PE', label: 'Prince Edward Island' },
]

const PAY_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly (52)', periods: 52 },
  { value: 'biweekly', label: 'Bi-weekly (26)', periods: 26 },
  { value: 'semi-monthly', label: 'Semi-monthly (24)', periods: 24 },
  { value: 'monthly', label: 'Monthly (12)', periods: 12 },
]

const STATUS_CONFIG: Record<PayRunStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700', icon: FileText },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  processing: { label: 'Processing', color: 'bg-indigo-100 text-indigo-700', icon: PlayCircle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: AlertCircle },
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

export default function PayrollPage() {
  const { payRuns, loading, stats, createPayRun, updateStatus, deletePayRun } = usePayRuns()
  const { success, error: showError } = useToast()
  
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState('runs')
  
  // Calculator state
  const [annualSalary, setAnnualSalary] = useState(75000)
  const [province, setProvince] = useState('ON')
  const [payFrequency, setPayFrequency] = useState<PayFrequency>('biweekly')
  
  // New pay run form
  const [payRunForm, setPayRunForm] = useState({
    name: '',
    periodStart: '',
    periodEnd: '',
    payDate: '',
    payFrequency: 'semi-monthly' as PayFrequency,
  })

  // Calculate payroll using real Canadian tax rates
  const calculation = useMemo(() => {
    const freq = PAY_FREQUENCIES.find(f => f.value === payFrequency)!
    const periodicPay = annualSalary / freq.periods
    return payrollService.calculatePreview(periodicPay, province, payFrequency)
  }, [annualSalary, province, payFrequency])

  const freq = PAY_FREQUENCIES.find(f => f.value === payFrequency)!
  const periodicGross = annualSalary / freq.periods

  const handleCreatePayRun = async () => {
    if (!payRunForm.name || !payRunForm.periodStart || !payRunForm.periodEnd || !payRunForm.payDate) {
      showError('Missing Fields', 'Please fill in all required fields')
      return
    }
    
    setCreating(true)
    const created = await createPayRun(payRunForm)
    setCreating(false)
    
    if (created) {
      success('Pay Run Created', `Created pay run: ${created.name}`)
      setShowCreate(false)
      setPayRunForm({
        name: '',
        periodStart: '',
        periodEnd: '',
        payDate: '',
        payFrequency: 'semi-monthly',
      })
    } else {
      showError('Creation Failed', 'Could not create pay run')
    }
  }

  const handleApprove = async (id: string) => {
    const result = await updateStatus(id, 'approved')
    if (result) success('Pay Run Approved', 'Pay run has been approved')
  }

  const handleProcess = async (id: string) => {
    const result = await updateStatus(id, 'completed')
    if (result) success('Pay Run Processed', 'Pay run has been processed')
  }

  const handleDelete = async (id: string) => {
    const result = await deletePayRun(id)
    if (result) success('Pay Run Deleted', 'Draft pay run has been deleted')
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
          <p className="text-muted-foreground">Canadian payroll with CPP, EI, and tax calculations</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="shadow-maple">
              <Plus className="h-4 w-4 mr-2" />
              New Pay Run
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Pay Run</DialogTitle>
              <DialogDescription>
                Start a new payroll run for your employees
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Pay Run Name *</Label>
                <Input
                  placeholder="e.g., February 2026 - Period 2"
                  value={payRunForm.name}
                  onChange={(e) => setPayRunForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Period Start *</Label>
                  <Input
                    type="date"
                    value={payRunForm.periodStart}
                    onChange={(e) => setPayRunForm(prev => ({ ...prev, periodStart: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Period End *</Label>
                  <Input
                    type="date"
                    value={payRunForm.periodEnd}
                    onChange={(e) => setPayRunForm(prev => ({ ...prev, periodEnd: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Pay Date *</Label>
                  <Input
                    type="date"
                    value={payRunForm.payDate}
                    onChange={(e) => setPayRunForm(prev => ({ ...prev, payDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pay Frequency</Label>
                  <Select 
                    value={payRunForm.payFrequency}
                    onValueChange={(v: PayFrequency) => setPayRunForm(prev => ({ ...prev, payFrequency: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAY_FREQUENCIES.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreatePayRun} disabled={creating} className="shadow-maple">
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Pay Run
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard 
          title="YTD Payroll" 
          value={formatCurrency(stats.ytdTotal, 'CAD')}
          subtitle="Total processed"
          icon={DollarSign}
        />
        <StatCard 
          title="Pay Runs" 
          value={stats.total.toString()}
          subtitle={`${stats.completed} completed`}
          icon={FileText}
        />
        <StatCard 
          title="Pending" 
          value={stats.pending.toString()}
          subtitle="Awaiting approval"
          icon={Clock}
          color={stats.pending > 0 ? "bg-yellow-500" : undefined}
        />
        <StatCard 
          title="Draft" 
          value={stats.draft.toString()}
          subtitle="In progress"
          icon={FileText}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="runs">Pay Runs</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Pay Runs Tab */}
        <TabsContent value="runs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pay Runs</CardTitle>
              <CardDescription>Manage your payroll runs</CardDescription>
            </CardHeader>
            <CardContent>
              {payRuns.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No pay runs yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first pay run to start processing payroll
                  </p>
                  <Button onClick={() => setShowCreate(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Create Pay Run
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Pay Date</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead className="text-right">Gross</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payRuns.map(run => {
                      const status = STATUS_CONFIG[run.status]
                      const StatusIcon = status.icon
                      return (
                        <TableRow key={run.id}>
                          <TableCell className="font-medium">{run.name}</TableCell>
                          <TableCell>
                            {new Date(run.periodStart).toLocaleDateString('en-CA')} - {new Date(run.periodEnd).toLocaleDateString('en-CA')}
                          </TableCell>
                          <TableCell>{new Date(run.payDate).toLocaleDateString('en-CA')}</TableCell>
                          <TableCell>{run.totalEmployees}</TableCell>
                          <TableCell className="text-right">{formatCurrency(run.totalGross, 'CAD')}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {formatCurrency(run.totalNet, 'CAD')}
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(status.color)}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" /> View Details
                                </DropdownMenuItem>
                                {run.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => handleApprove(run.id)}>
                                    <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                  </DropdownMenuItem>
                                )}
                                {run.status === 'approved' && (
                                  <DropdownMenuItem onClick={() => handleProcess(run.id)}>
                                    <PlayCircle className="mr-2 h-4 w-4" /> Process
                                  </DropdownMenuItem>
                                )}
                                {run.status === 'draft' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(run.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Canadian Payroll Calculator
              </CardTitle>
              <CardDescription>
                Calculate net pay with CPP, EI, and income tax deductions using {TAX_YEAR} rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Input Section */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="salary">Annual Salary</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="salary"
                        type="number"
                        min="0"
                        step="1000"
                        value={annualSalary}
                        onChange={(e) => setAnnualSalary(parseFloat(e.target.value) || 0)}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Province</Label>
                    <Select value={province} onValueChange={setProvince}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVINCES.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Pay Frequency</Label>
                    <Select 
                      value={payFrequency} 
                      onValueChange={(v) => setPayFrequency(v as PayFrequency)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAY_FREQUENCIES.map(f => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Results Section */}
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Gross Pay (per period)</p>
                    <p className="text-2xl font-bold">{formatCurrency(periodicGross, 'CAD')}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">CPP Contribution</span>
                      <span className="font-medium text-red-600">-{formatCurrency(calculation.cpp, 'CAD')}</span>
                    </div>
                    {calculation.cpp2 > 0 && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">CPP2 (Enhanced)</span>
                        <span className="font-medium text-red-600">-{formatCurrency(calculation.cpp2, 'CAD')}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">EI Premium</span>
                      <span className="font-medium text-red-600">-{formatCurrency(calculation.ei, 'CAD')}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Federal Tax</span>
                      <span className="font-medium text-red-600">-{formatCurrency(calculation.federalTax, 'CAD')}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Provincial Tax ({province})</span>
                      <span className="font-medium text-red-600">-{formatCurrency(calculation.provincialTax, 'CAD')}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">Total Deductions</span>
                      <span className="font-bold text-red-600">-{formatCurrency(calculation.totalDeductions, 'CAD')}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-primary text-primary-foreground">
                    <p className="text-sm opacity-90 mb-1">Net Pay (per period)</p>
                    <p className="text-3xl font-bold">{formatCurrency(calculation.netPay, 'CAD')}</p>
                    <p className="text-sm opacity-75 mt-2">
                      Annual: {formatCurrency(calculation.netPay * freq.periods, 'CAD')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-red-600" />
                Canadian Compliance
              </CardTitle>
              <CardDescription>
                Built-in support for CRA requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">CPP/QPP</h4>
                  <p className="text-sm text-muted-foreground">
                    Canada Pension Plan contributions calculated automatically including CPP2 (enhanced tier).
                  </p>
                </div>
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">EI Premiums</h4>
                  <p className="text-sm text-muted-foreground">
                    Employment Insurance premiums with proper maximums and insurable earnings limits.
                  </p>
                </div>
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">Provincial Taxes</h4>
                  <p className="text-sm text-muted-foreground">
                    Tax brackets for all provinces including Quebec's unique system.
                  </p>
                </div>
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">T4 Generation</h4>
                  <p className="text-sm text-muted-foreground">
                    Year-end tax slips generated in CRA-compliant format.
                  </p>
                  <Badge variant="secondary" className="mt-2">Coming Soon</Badge>
                </div>
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">ROE Export</h4>
                  <p className="text-sm text-muted-foreground">
                    Record of Employment for Service Canada submissions.
                  </p>
                  <Badge variant="secondary" className="mt-2">Coming Soon</Badge>
                </div>
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">Pay Stubs</h4>
                  <p className="text-sm text-muted-foreground">
                    Professional PDF pay stubs with YTD totals and deduction breakdown.
                  </p>
                  <Badge variant="secondary" className="mt-2">Coming Soon</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
