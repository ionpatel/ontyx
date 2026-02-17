"use client"

import { useState } from "react"
import { 
  UserPlus, Users, Search, MoreHorizontal, 
  Mail, Phone, Briefcase, DollarSign, Loader2,
  Edit, Trash2, UserX, UserCheck, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, cn } from "@/lib/utils"
import { useEmployees, useEmployeeStats } from "@/hooks/use-employees"
import type { CreateEmployeeInput, EmployeeStatus, PayType } from "@/services/employees"
import { useToast } from "@/components/ui/toast"

const statusConfig: Record<EmployeeStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  on_leave: { label: 'On Leave', color: 'bg-amber-100 text-amber-700' },
  terminated: { label: 'Terminated', color: 'bg-slate-100 text-slate-700' },
}

const PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' },
]

export default function EmployeesPage() {
  const { employees, loading, createEmployee, updateEmployee, updateStatus, deleteEmployee, refetch } = useEmployees()
  const { stats } = useEmployeeStats()
  const { success, error: showError } = useToast()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'all'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<CreateEmployeeInput>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    jobTitle: '',
    hireDate: new Date().toISOString().split('T')[0],
    payType: 'hourly',
    payRate: 0,
    hoursPerWeek: 40,
    province: 'ON',
  })

  const resetForm = () => {
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      jobTitle: '',
      hireDate: new Date().toISOString().split('T')[0],
      payType: 'hourly',
      payRate: 0,
      hoursPerWeek: 40,
      province: 'ON',
    })
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.firstName.toLowerCase().includes(search.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase()) ||
      emp.department?.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName) {
      showError('Missing Info', 'Please enter first and last name')
      return
    }

    setSaving(true)
    const employee = await createEmployee(form)
    setSaving(false)

    if (employee) {
      success('Employee Added', `${employee.firstName} ${employee.lastName} has been added`)
      setShowAdd(false)
      resetForm()
    } else {
      showError('Error', 'Failed to add employee')
    }
  }

  const handleUpdate = async () => {
    if (!showEdit) return

    setSaving(true)
    const updated = await updateEmployee(showEdit, form)
    setSaving(false)

    if (updated) {
      success('Employee Updated', 'Changes saved successfully')
      setShowEdit(null)
      resetForm()
    } else {
      showError('Error', 'Failed to update employee')
    }
  }

  const handleTerminate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to terminate ${name}?`)) return

    const today = new Date().toISOString().split('T')[0]
    const ok = await updateStatus(id, 'terminated', today)
    
    if (ok) {
      success('Employee Terminated', `${name} has been marked as terminated`)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return

    const ok = await deleteEmployee(id)
    if (ok) {
      success('Deleted', `${name} has been removed`)
    }
  }

  const openEdit = (emp: typeof employees[0]) => {
    setForm({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email || '',
      phone: emp.phone || '',
      department: emp.department || '',
      jobTitle: emp.jobTitle || '',
      hireDate: emp.hireDate || '',
      payType: emp.payType,
      payRate: emp.payRate,
      hoursPerWeek: emp.hoursPerWeek,
      province: emp.province,
      sin: emp.sin || '',
      address: emp.address || '',
      city: emp.city || '',
      postalCode: emp.postalCode || '',
    })
    setShowEdit(emp.id)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage your team and payroll information
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Add Employee
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEmployees || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.activeEmployees || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats?.onLeave || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalPayroll || 0)}</div>
            <p className="text-xs text-muted-foreground">Estimated</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Employee List */}
      <Card>
        <CardContent className="p-0">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Employees</h3>
              <p className="text-muted-foreground mb-6">
                {search || statusFilter !== 'all' 
                  ? 'No employees match your filters'
                  : 'Add your first employee to get started'}
              </p>
              {!search && statusFilter === 'all' && (
                <Button onClick={() => setShowAdd(true)}>
                  <UserPlus className="mr-2 h-4 w-4" /> Add Employee
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Hire Date</TableHead>
                  <TableHead>Compensation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((emp) => {
                  const status = statusConfig[emp.status]
                  return (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                          {emp.email && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {emp.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{emp.department || '—'}</TableCell>
                      <TableCell>{emp.jobTitle || '—'}</TableCell>
                      <TableCell>{formatDate(emp.hireDate)}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {emp.payType === 'salary' 
                            ? `${formatCurrency(emp.payRate)}/yr`
                            : `${formatCurrency(emp.payRate)}/hr`
                          }
                        </div>
                        {emp.payType === 'hourly' && (
                          <div className="text-xs text-muted-foreground">
                            {emp.hoursPerWeek} hrs/week
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs", status.color)}>
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
                            <DropdownMenuItem onClick={() => openEdit(emp)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            {emp.status === 'active' && (
                              <DropdownMenuItem 
                                onClick={() => handleTerminate(emp.id, `${emp.firstName} ${emp.lastName}`)}
                              >
                                <UserX className="mr-2 h-4 w-4" /> Terminate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDelete(emp.id, `${emp.firstName} ${emp.lastName}`)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
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

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd || !!showEdit} onOpenChange={(open) => {
        if (!open) {
          setShowAdd(false)
          setShowEdit(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showEdit ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
            <DialogDescription>
              {showEdit ? 'Update employee information' : 'Add a new team member'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="personal" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="employment">Employment</TabsTrigger>
              <TabsTrigger value="compensation">Compensation</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input
                    value={form.firstName}
                    onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input
                    value={form.lastName}
                    onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="(416) 555-0123"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="123 Main Street"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="Toronto"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Province</Label>
                  <Select
                    value={form.province}
                    onValueChange={(v) => setForm(f => ({ ...f, province: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCES.map(p => (
                        <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Postal Code</Label>
                  <Input
                    value={form.postalCode}
                    onChange={(e) => setForm(f => ({ ...f, postalCode: e.target.value.toUpperCase() }))}
                    placeholder="M5V 1A1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>SIN (Social Insurance Number)</Label>
                <Input
                  value={form.sin}
                  onChange={(e) => setForm(f => ({ ...f, sin: e.target.value }))}
                  placeholder="XXX-XXX-XXX"
                />
                <p className="text-xs text-muted-foreground">Required for payroll and T4</p>
              </div>
            </TabsContent>

            <TabsContent value="employment" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    value={form.department}
                    onChange={(e) => setForm(f => ({ ...f, department: e.target.value }))}
                    placeholder="Sales"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input
                    value={form.jobTitle}
                    onChange={(e) => setForm(f => ({ ...f, jobTitle: e.target.value }))}
                    placeholder="Sales Manager"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Hire Date</Label>
                <Input
                  type="date"
                  value={form.hireDate}
                  onChange={(e) => setForm(f => ({ ...f, hireDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Employee Number (Optional)</Label>
                <Input
                  value={form.employeeNumber}
                  onChange={(e) => setForm(f => ({ ...f, employeeNumber: e.target.value }))}
                  placeholder="EMP-001"
                />
              </div>
            </TabsContent>

            <TabsContent value="compensation" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Pay Type</Label>
                <Select
                  value={form.payType}
                  onValueChange={(v) => setForm(f => ({ ...f, payType: v as PayType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="salary">Salary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{form.payType === 'salary' ? 'Annual Salary' : 'Hourly Rate'}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.payRate || ''}
                    onChange={(e) => setForm(f => ({ ...f, payRate: parseFloat(e.target.value) || 0 }))}
                    placeholder={form.payType === 'salary' ? '50000' : '25.00'}
                  />
                </div>
                {form.payType === 'hourly' && (
                  <div className="space-y-2">
                    <Label>Hours per Week</Label>
                    <Input
                      type="number"
                      value={form.hoursPerWeek || ''}
                      onChange={(e) => setForm(f => ({ ...f, hoursPerWeek: parseFloat(e.target.value) || 40 }))}
                      placeholder="40"
                    />
                  </div>
                )}
              </div>
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Tax Deduction Claims</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>TD1 Federal Claim</Label>
                    <Input
                      type="number"
                      value={form.td1FederalClaim || ''}
                      onChange={(e) => setForm(f => ({ ...f, td1FederalClaim: parseFloat(e.target.value) || 15000 }))}
                      placeholder="15000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>TD1 Provincial Claim</Label>
                    <Input
                      type="number"
                      value={form.td1ProvincialClaim || ''}
                      onChange={(e) => setForm(f => ({ ...f, td1ProvincialClaim: parseFloat(e.target.value) || 11865 }))}
                      placeholder="11865"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => {
              setShowAdd(false)
              setShowEdit(null)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={showEdit ? handleUpdate : handleCreate} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {showEdit ? 'Save Changes' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
