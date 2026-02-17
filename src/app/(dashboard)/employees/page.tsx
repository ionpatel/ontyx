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
import { useEmployees, useEmployeeStats, useDepartments } from "@/hooks/use-employees"
import type { CreateEmployeeInput, EmployeeStatus, EmploymentType } from "@/services/employees"
import { useToast } from "@/components/ui/toast"

const statusConfig: Record<EmployeeStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  on_leave: { label: 'On Leave', color: 'bg-amber-100 text-amber-700' },
  terminated: { label: 'Terminated', color: 'bg-slate-100 text-slate-700' },
  resigned: { label: 'Resigned', color: 'bg-slate-100 text-slate-700' },
}

const employmentTypes: { value: EmploymentType; label: string }[] = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
  { value: 'freelance', label: 'Freelance' },
]

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
  const { departments } = useDepartments()
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
    departmentId: '',
    jobTitle: '',
    hireDate: new Date().toISOString().split('T')[0],
    employmentType: 'full_time',
    workHoursPerWeek: 40,
    state: 'ON',
    country: 'CA',
  })

  const resetForm = () => {
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      departmentId: '',
      jobTitle: '',
      hireDate: new Date().toISOString().split('T')[0],
      employmentType: 'full_time',
      workHoursPerWeek: 40,
      state: 'ON',
      country: 'CA',
    })
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.firstName.toLowerCase().includes(search.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase()) ||
      emp.jobTitle?.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || emp.employmentStatus === statusFilter
    
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
      mobile: emp.mobile || '',
      departmentId: emp.departmentId || '',
      jobTitle: emp.jobTitle || '',
      hireDate: emp.hireDate || '',
      employmentType: emp.employmentType,
      workHoursPerWeek: emp.workHoursPerWeek,
      addressLine1: emp.addressLine1 || '',
      addressLine2: emp.addressLine2 || '',
      city: emp.city || '',
      state: emp.state || 'ON',
      postalCode: emp.postalCode || '',
      country: emp.country || 'CA',
      taxId: emp.taxId || '',
      emergencyContactName: emp.emergencyContactName || '',
      emergencyContactPhone: emp.emergencyContactPhone || '',
      emergencyContactRelationship: emp.emergencyContactRelationship || '',
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

  const getDepartmentName = (deptId?: string) => {
    if (!deptId) return '—'
    const dept = departments.find(d => d.id === deptId)
    return dept?.name || '—'
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
            <SelectItem value="resigned">Resigned</SelectItem>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((emp) => {
                  const status = statusConfig[emp.employmentStatus]
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
                      <TableCell>{getDepartmentName(emp.departmentId)}</TableCell>
                      <TableCell>{emp.jobTitle || '—'}</TableCell>
                      <TableCell>{formatDate(emp.hireDate)}</TableCell>
                      <TableCell>
                        {employmentTypes.find(t => t.value === emp.employmentType)?.label || emp.employmentType}
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
                            {emp.employmentStatus === 'active' && (
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="employment">Employment</TabsTrigger>
              <TabsTrigger value="emergency">Emergency</TabsTrigger>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mobile</Label>
                  <Input
                    value={form.mobile}
                    onChange={(e) => setForm(f => ({ ...f, mobile: e.target.value }))}
                    placeholder="(416) 555-0124"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>SIN / Tax ID</Label>
                <Input
                  value={form.taxId}
                  onChange={(e) => setForm(f => ({ ...f, taxId: e.target.value }))}
                  placeholder="XXX-XXX-XXX"
                />
                <p className="text-xs text-muted-foreground">Required for payroll and T4</p>
              </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Address Line 1</Label>
                <Input
                  value={form.addressLine1}
                  onChange={(e) => setForm(f => ({ ...f, addressLine1: e.target.value }))}
                  placeholder="123 Main Street"
                />
              </div>
              <div className="space-y-2">
                <Label>Address Line 2</Label>
                <Input
                  value={form.addressLine2}
                  onChange={(e) => setForm(f => ({ ...f, addressLine2: e.target.value }))}
                  placeholder="Suite 100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="Toronto"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Province/State</Label>
                  <Select
                    value={form.state}
                    onValueChange={(v) => setForm(f => ({ ...f, state: v }))}
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Postal Code</Label>
                  <Input
                    value={form.postalCode}
                    onChange={(e) => setForm(f => ({ ...f, postalCode: e.target.value.toUpperCase() }))}
                    placeholder="M5V 1A1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select
                    value={form.country}
                    onValueChange={(v) => setForm(f => ({ ...f, country: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="employment" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    value={form.departmentId || 'none'}
                    onValueChange={(v) => setForm(f => ({ ...f, departmentId: v === 'none' ? undefined : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Department</SelectItem>
                      {departments.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employment Type</Label>
                  <Select
                    value={form.employmentType}
                    onValueChange={(v) => setForm(f => ({ ...f, employmentType: v as EmploymentType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {employmentTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Hours per Week</Label>
                  <Input
                    type="number"
                    value={form.workHoursPerWeek || ''}
                    onChange={(e) => setForm(f => ({ ...f, workHoursPerWeek: parseFloat(e.target.value) || 40 }))}
                    placeholder="40"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hire Date *</Label>
                  <Input
                    type="date"
                    value={form.hireDate}
                    onChange={(e) => setForm(f => ({ ...f, hireDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Employee Number</Label>
                  <Input
                    value={form.employeeNumber}
                    onChange={(e) => setForm(f => ({ ...f, employeeNumber: e.target.value }))}
                    placeholder="EMP-001"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="emergency" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Emergency Contact Name</Label>
                <Input
                  value={form.emergencyContactName}
                  onChange={(e) => setForm(f => ({ ...f, emergencyContactName: e.target.value }))}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Emergency Contact Phone</Label>
                  <Input
                    value={form.emergencyContactPhone}
                    onChange={(e) => setForm(f => ({ ...f, emergencyContactPhone: e.target.value }))}
                    placeholder="(416) 555-0125"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  <Input
                    value={form.emergencyContactRelationship}
                    onChange={(e) => setForm(f => ({ ...f, emergencyContactRelationship: e.target.value }))}
                    placeholder="Spouse"
                  />
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
