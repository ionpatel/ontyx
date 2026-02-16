'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Plus, Search, Calendar, DollarSign, Users, Clock,
  CheckCircle, AlertCircle, PlayCircle, FileText,
  ArrowRight, TrendingUp, Download, Calculator, Leaf
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { cn, formatCurrency } from '@/lib/utils'
import { payrollService, TAX_YEAR, FEDERAL_BPA, PROVINCIAL_TAX_RATES } from '@/services/payroll'

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
  // Calculator state
  const [annualSalary, setAnnualSalary] = useState(75000)
  const [province, setProvince] = useState('ON')
  const [payFrequency, setPayFrequency] = useState<'weekly' | 'biweekly' | 'semi-monthly' | 'monthly'>('biweekly')

  // Calculate payroll using real Canadian tax rates
  const calculation = useMemo(() => {
    const freq = PAY_FREQUENCIES.find(f => f.value === payFrequency)!
    const periodicPay = annualSalary / freq.periods
    return payrollService.calculatePreview(periodicPay, province, payFrequency)
  }, [annualSalary, province, payFrequency])

  const freq = PAY_FREQUENCIES.find(f => f.value === payFrequency)!
  const periodicGross = annualSalary / freq.periods

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
          <p className="text-muted-foreground">Canadian payroll management with CPP, EI, and tax calculations</p>
        </div>
        <Button className="shadow-maple">
          <Plus className="h-4 w-4 mr-2" />
          New Pay Run
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard 
          title="Tax Year" 
          value={TAX_YEAR.toString()}
          subtitle="Current rates"
          icon={Calendar}
        />
        <StatCard 
          title="Federal BPA" 
          value={formatCurrency(FEDERAL_BPA, 'CAD')}
          subtitle="Basic personal amount"
          icon={Users}
        />
        <StatCard 
          title="CPP Max" 
          value="$4,152"
          subtitle="Annual contribution"
          icon={DollarSign}
        />
        <StatCard 
          title="EI Max" 
          value="$1,058"
          subtitle="Annual premium"
          icon={TrendingUp}
          color="bg-green-500"
        />
      </div>

      {/* Payroll Calculator */}
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
                  onValueChange={(v) => setPayFrequency(v as typeof payFrequency)}
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" disabled>
              <PlayCircle className="h-4 w-4 mr-2" />
              Start Pay Run
              <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
            </Button>
            <Button variant="outline" disabled>
              <FileText className="h-4 w-4 mr-2" />
              Generate T4s
              <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
            </Button>
            <Button variant="outline" disabled>
              <Download className="h-4 w-4 mr-2" />
              Export ROE
              <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
            </Button>
            <Button variant="outline" disabled>
              <Users className="h-4 w-4 mr-2" />
              Manage Employees
              <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Canadian Compliance Info */}
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
    </div>
  )
}
