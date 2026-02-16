'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, FileText, Download, RefreshCw, CheckCircle,
  Calendar, DollarSign, Users, Loader2, AlertCircle, Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { cn, formatCurrency } from '@/lib/utils'
import { t4Service, type T4Data, type T4Summary } from '@/services/t4'
import { generateT4PDF, generateAllT4sPDF } from '@/services/pdf-t4'
import { useAuth } from '@/hooks/use-auth'
import { useOrganization } from '@/hooks/use-organization'
import { useToast } from '@/components/ui/toast'

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  reviewed: { label: 'Reviewed', color: 'bg-blue-100 text-blue-700' },
  filed: { label: 'Filed', color: 'bg-green-100 text-green-700' },
}

const CURRENT_YEAR = new Date().getFullYear()
const AVAILABLE_YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]

export default function T4Page() {
  const { organizationId } = useAuth()
  const { organization } = useOrganization()
  const { success, error: showError } = useToast()
  
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR - 1) // Default to last year
  const [t4s, setT4s] = useState<T4Data[]>([])
  const [summary, setSummary] = useState<T4Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  
  const effectiveOrgId = organizationId || 'demo'

  useEffect(() => {
    loadT4s()
  }, [taxYear, effectiveOrgId])

  const loadT4s = async () => {
    setLoading(true)
    try {
      const [t4Data, summaryData] = await Promise.all([
        t4Service.getT4s(effectiveOrgId, taxYear),
        t4Service.getT4Summary(effectiveOrgId, taxYear),
      ])
      setT4s(t4Data)
      setSummary(summaryData)
    } catch (err) {
      console.error('Error loading T4s:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!organization) {
      showError('Missing Info', 'Please configure your company settings first')
      return
    }

    setGenerating(true)
    try {
      const generated = await t4Service.generateT4s(effectiveOrgId, taxYear, {
        name: organization.name || 'Your Company',
        bn: organization.taxNumber || 'N/A',
        address: `${organization.city || ''}, ${organization.province || 'ON'}`,
      })
      
      setT4s(generated)
      setSummary(await t4Service.getT4Summary(effectiveOrgId, taxYear))
      setShowGenerateDialog(false)
      
      if (generated.length > 0) {
        success('T4s Generated', `Generated ${generated.length} T4 slip(s) for ${taxYear}`)
      } else {
        showError('No Data', 'No completed pay runs found for this tax year')
      }
    } catch (err) {
      console.error('Error generating T4s:', err)
      showError('Generation Failed', 'Could not generate T4 slips')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadSingle = (t4: T4Data) => {
    generateT4PDF(t4)
  }

  const handleDownloadAll = () => {
    if (t4s.length === 0) return
    generateAllT4sPDF(t4s, taxYear)
    success('Download Started', `Downloading ${t4s.length} T4 slips`)
  }

  const handleMarkReviewed = async (id: string) => {
    const result = await t4Service.updateT4Status(id, 'reviewed', effectiveOrgId)
    if (result) {
      setT4s(prev => prev.map(t => t.id === id ? { ...t, status: 'reviewed' } : t))
      success('Status Updated', 'T4 marked as reviewed')
    }
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/payroll">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">T4 Tax Slips</h1>
            <p className="text-muted-foreground">Generate and manage T4 Statement of Remuneration Paid</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_YEARS.map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {t4s.length > 0 && (
            <Button variant="outline" onClick={handleDownloadAll}>
              <Download className="mr-2 h-4 w-4" />
              Download All
            </Button>
          )}
          
          <Button onClick={() => setShowGenerateDialog(true)} className="shadow-maple">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t4s.length > 0 ? 'Regenerate' : 'Generate'} T4s
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
                <p className="text-sm text-muted-foreground">Total Slips</p>
                <p className="text-2xl font-bold">{summary?.totalSlips || 0}</p>
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
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold">{formatCurrency(summary?.totalEmploymentIncome || 0, 'CAD')}</p>
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
                <p className="text-sm text-muted-foreground">Total Tax Deducted</p>
                <p className="text-2xl font-bold">{formatCurrency(summary?.totalIncomeTax || 0, 'CAD')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tax Year</p>
                <p className="text-2xl font-bold">{taxYear}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* T4 List */}
      <Card>
        <CardHeader>
          <CardTitle>T4 Slips</CardTitle>
          <CardDescription>
            {t4s.length > 0 
              ? `${t4s.length} T4 slip(s) for tax year ${taxYear}`
              : `No T4 slips generated for ${taxYear} yet`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {t4s.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No T4 Slips Yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate T4 slips from your completed pay runs for {taxYear}
              </p>
              <Button onClick={() => setShowGenerateDialog(true)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate T4s
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Employment Income</TableHead>
                  <TableHead className="text-right">CPP</TableHead>
                  <TableHead className="text-right">EI</TableHead>
                  <TableHead className="text-right">Tax Deducted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {t4s.map(t4 => {
                  const status = STATUS_CONFIG[t4.status]
                  return (
                    <TableRow key={t4.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{t4.employeeName}</p>
                          <p className="text-sm text-muted-foreground">SIN: {t4.employeeSin}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(t4.employmentIncome, 'CAD')}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(t4.cppContributions + t4.cpp2Contributions, 'CAD')}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(t4.eiPremiums, 'CAD')}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(t4.incomeTaxDeducted, 'CAD')}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(status.color)}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDownloadSingle(t4)}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {t4.status === 'draft' && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleMarkReviewed(t4.id)}
                              title="Mark as Reviewed"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* CRA Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Filing Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Filing Deadline</h4>
              <p className="text-sm text-muted-foreground">
                T4 slips must be filed with CRA and distributed to employees by the last day of February 
                following the calendar year to which the slips apply.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Electronic Filing</h4>
              <p className="text-sm text-muted-foreground">
                If you file more than 50 information returns for a calendar year, you must file them 
                electronically (Internet file transfer or Web Forms).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate T4 Slips</DialogTitle>
            <DialogDescription>
              This will aggregate all completed pay runs for {taxYear} and generate T4 slips for each employee.
              {t4s.length > 0 && ' Existing T4s for this year will be replaced.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm">
                <strong>Tax Year:</strong> {taxYear}<br />
                <strong>Employer:</strong> {organization?.name || 'Your Company'}<br />
                <strong>BN:</strong> {organization?.taxNumber || 'Not configured'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate T4s
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
