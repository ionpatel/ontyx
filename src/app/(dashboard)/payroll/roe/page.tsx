"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  FileText, Plus, Download, Send, Eye, Trash2, 
  Loader2, ArrowLeft, CheckCircle, Clock, AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency, cn } from "@/lib/utils"
import { useROEs, useEligibleEmployees } from "@/hooks/use-roe"
import { ROE_REASON_LABELS, type ROEReasonCode, type CreateROEInput } from "@/services/roe"
import { useToast } from "@/components/ui/toast"

const statusConfig = {
  draft: { label: "Draft", icon: Clock, color: "bg-slate-100 text-slate-700" },
  submitted: { label: "Submitted", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  amended: { label: "Amended", icon: AlertTriangle, color: "bg-amber-100 text-amber-700" },
}

export default function ROEPage() {
  const { roes, loading, generateROE, updateStatus, deleteROE, refetch } = useROEs()
  const { employees, loading: employeesLoading } = useEligibleEmployees()
  const { success, error: showError } = useToast()

  const [showCreate, setShowCreate] = useState(false)
  const [showDetail, setShowDetail] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<CreateROEInput>({
    employeeId: '',
    lastDayForWhichPaid: new Date().toISOString().split('T')[0],
    reasonCode: 'A' as ROEReasonCode,
  })

  const handleCreate = async () => {
    if (!form.employeeId) {
      showError('Missing Info', 'Please select an employee')
      return
    }

    setSaving(true)
    const roe = await generateROE(form)
    setSaving(false)

    if (roe) {
      success('ROE Generated', `ROE for ${roe.employeeFirstName} ${roe.employeeLastName} created`)
      setShowCreate(false)
      setForm({
        employeeId: '',
        lastDayForWhichPaid: new Date().toISOString().split('T')[0],
        reasonCode: 'A',
      })
    } else {
      showError('Error', 'Failed to generate ROE. Make sure the employee has payroll records.')
    }
  }

  const handleSubmit = async (id: string) => {
    const ok = await updateStatus(id, 'submitted')
    if (ok) {
      success('ROE Submitted', 'ROE has been marked as submitted to Service Canada')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ROE?')) return
    
    const ok = await deleteROE(id)
    if (ok) {
      success('Deleted', 'ROE has been removed')
    }
  }

  const selectedROE = roes.find(r => r.id === showDetail)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-CA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/payroll">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Record of Employment</h1>
            <p className="text-muted-foreground">
              Generate ROEs for Service Canada EI claims
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Generate ROE
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total ROEs</CardDescription>
            <CardTitle className="text-3xl">{roes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Drafts</CardDescription>
            <CardTitle className="text-3xl text-amber-600">
              {roes.filter(r => r.status === 'draft').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Submitted</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {roes.filter(r => r.status === 'submitted').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* ROE Table */}
      <Card>
        <CardHeader>
          <CardTitle>ROE Records</CardTitle>
          <CardDescription>
            Records of Employment generated for terminated or departed employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          {roes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No ROE Records</h3>
              <p className="text-muted-foreground mb-6">
                Generate an ROE when an employee leaves your organization.
              </p>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="mr-2 h-4 w-4" /> Generate First ROE
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Serial #</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Last Day Paid</TableHead>
                  <TableHead>Insurable Earnings</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roes.map((roe) => {
                  const status = statusConfig[roe.status]
                  const StatusIcon = status.icon
                  return (
                    <TableRow key={roe.id}>
                      <TableCell>
                        <div className="font-medium">
                          {roe.employeeFirstName} {roe.employeeLastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          SIN: ***-***-{roe.employeeSIN?.slice(-3) || '***'}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {roe.serialNumber || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {roe.reasonCode} - {ROE_REASON_LABELS[roe.reasonCode]?.split('/')[0] || 'Other'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(roe.lastDayForWhichPaid)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(roe.totalInsurableEarnings)}
                      </TableCell>
                      <TableCell>{roe.totalInsurableHours.toFixed(1)}</TableCell>
                      <TableCell>
                        <Badge className={cn("flex items-center gap-1 w-fit", status.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setShowDetail(roe.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {roe.status === 'draft' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleSubmit(roe.id)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDelete(roe.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
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

      {/* Create ROE Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Record of Employment</DialogTitle>
            <DialogDescription>
              Create an ROE for an employee who has left the organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select
                value={form.employeeId}
                onValueChange={(v) => setForm(f => ({ ...f, employeeId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employeesLoading ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : employees.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No employees found
                    </div>
                  ) : (
                    employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                        {emp.terminationDate && (
                          <span className="text-muted-foreground ml-2">
                            (Terminated)
                          </span>
                        )}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Last Day For Which Paid</Label>
              <Input
                type="date"
                value={form.lastDayForWhichPaid}
                onChange={(e) => setForm(f => ({ ...f, lastDayForWhichPaid: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Reason for Issuing ROE</Label>
              <Select
                value={form.reasonCode}
                onValueChange={(v) => setForm(f => ({ ...f, reasonCode: v as ROEReasonCode }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROE_REASON_LABELS).map(([code, label]) => (
                    <SelectItem key={code} value={code}>
                      {code} - {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(form.reasonCode === 'A' || form.reasonCode === 'K') && (
              <div className="space-y-2">
                <Label>Expected Recall Date (Optional)</Label>
                <Input
                  type="date"
                  value={form.expectedRecallDate || ''}
                  onChange={(e) => setForm(f => ({ ...f, expectedRecallDate: e.target.value }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate ROE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ROE Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ROE Details</DialogTitle>
            <DialogDescription>
              Serial Number: {selectedROE?.serialNumber || 'N/A'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedROE && (
            <div className="space-y-6">
              {/* Employer Section */}
              <div>
                <h3 className="font-semibold text-sm text-primary mb-2">EMPLOYER INFORMATION</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Business Name:</span>
                    <p className="font-medium">{selectedROE.employerName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Business Number:</span>
                    <p className="font-medium">{selectedROE.employerBusinessNumber || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Address:</span>
                    <p className="font-medium">
                      {selectedROE.employerAddress}, {selectedROE.employerCity}, {selectedROE.employerProvince} {selectedROE.employerPostalCode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Employee Section */}
              <div>
                <h3 className="font-semibold text-sm text-primary mb-2">EMPLOYEE INFORMATION</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{selectedROE.employeeFirstName} {selectedROE.employeeLastName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">SIN:</span>
                    <p className="font-medium font-mono">{selectedROE.employeeSIN || '***-***-***'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Address:</span>
                    <p className="font-medium">
                      {selectedROE.employeeAddress}, {selectedROE.employeeCity}, {selectedROE.employeeProvince} {selectedROE.employeePostalCode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Employment Section */}
              <div>
                <h3 className="font-semibold text-sm text-primary mb-2">EMPLOYMENT DETAILS</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">First Day Worked:</span>
                    <p className="font-medium">{formatDate(selectedROE.firstDayWorked)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Day Paid:</span>
                    <p className="font-medium">{formatDate(selectedROE.lastDayForWhichPaid)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reason Code:</span>
                    <p className="font-medium">{selectedROE.reasonCode} - {ROE_REASON_LABELS[selectedROE.reasonCode]}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pay Period Type:</span>
                    <p className="font-medium capitalize">{selectedROE.payPeriodType}</p>
                  </div>
                </div>
              </div>

              {/* Earnings Section */}
              <div>
                <h3 className="font-semibold text-sm text-primary mb-2">INSURABLE EARNINGS</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Earnings:</span>
                    <p className="font-bold text-lg">{formatCurrency(selectedROE.totalInsurableEarnings)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Hours:</span>
                    <p className="font-bold text-lg">{selectedROE.totalInsurableHours.toFixed(1)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vacation Pay:</span>
                    <p className="font-bold text-lg">{formatCurrency(selectedROE.vacationPay)}</p>
                  </div>
                </div>

                {selectedROE.insurableEarningsByPeriod.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Earnings by Pay Period:</p>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      {selectedROE.insurableEarningsByPeriod.slice(0, 14).map((period, idx) => (
                        <div key={idx} className="bg-muted p-2 rounded">
                          <span className="text-muted-foreground">PP {period.periodNumber}:</span>
                          <span className="ml-1 font-medium">{formatCurrency(period.earnings)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetail(null)}>
              Close
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
            {selectedROE?.status === 'draft' && (
              <Button onClick={() => {
                handleSubmit(selectedROE.id)
                setShowDetail(null)
              }}>
                <Send className="mr-2 h-4 w-4" /> Mark as Submitted
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
