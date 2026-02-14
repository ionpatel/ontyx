'use client'

import { use } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Mail, Phone, MapPin, Calendar, Building2,
  Edit, Trash2, Briefcase, DollarSign, Clock, User,
  GraduationCap, FileText, Shield, Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { cn, formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { mockEmployees, mockDepartments } from '@/lib/mock-data/employees'
import { EmploymentStatus, EmploymentType } from '@/types/employees'

const statusConfig: Record<EmploymentStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: 'text-green-600', bg: 'bg-green-100' },
  'on-leave': { label: 'On Leave', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  terminated: { label: 'Terminated', color: 'text-red-600', bg: 'bg-red-100' },
  resigned: { label: 'Resigned', color: 'text-gray-600', bg: 'bg-gray-100' },
}

const typeLabels: Record<EmploymentType, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  'contract': 'Contract',
  'intern': 'Intern',
}

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const employee = mockEmployees.find(e => e.id === id)

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold">Employee not found</h2>
        <p className="text-muted-foreground mt-2">The employee you're looking for doesn't exist.</p>
        <Link href="/employees">
          <Button className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employees
          </Button>
        </Link>
      </div>
    )
  }

  const department = mockDepartments.find(d => d.id === employee.departmentId)
  const manager = mockEmployees.find(e => e.id === employee.managerId)
  const directReports = mockEmployees.filter(e => e.managerId === employee.id)
  const status = statusConfig[employee.status]

  const yearsOfService = Math.floor(
    (new Date().getTime() - new Date(employee.hireDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={employee.avatar} />
            <AvatarFallback className="text-xl">
              {getInitials(`${employee.firstName} ${employee.lastName}`)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {employee.firstName} {employee.lastName}
              </h1>
              <Badge className={cn(status.bg, status.color, "border-0")}>
                {status.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">{employee.jobTitle}</p>
            <p className="text-sm text-muted-foreground">{employee.employeeId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Offboard
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Work Email</p>
                    <a href={`mailto:${employee.workEmail}`} className="text-primary hover:underline">
                      {employee.workEmail}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Personal Email</p>
                    <a href={`mailto:${employee.email}`} className="text-primary hover:underline">
                      {employee.email}
                    </a>
                  </div>
                </div>
                {employee.phone && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <a href={`tel:${employee.phone}`} className="text-primary hover:underline">
                        {employee.phone}
                      </a>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p>{employee.location}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <div className="flex items-center gap-2">
                        {department && (
                          <div className={cn("w-3 h-3 rounded-full", department.color)} />
                        )}
                        <p>{employee.department}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Employment Type</p>
                      <p>{typeLabels[employee.employmentType]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Hire Date</p>
                      <p>{formatDate(employee.hireDate)}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tenure</p>
                      <p>{yearsOfService} year{yearsOfService !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Annual Salary</p>
                      <p className="font-semibold">{formatCurrency(employee.salary)}</p>
                    </div>
                  </div>
                  {manager && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Reports To</p>
                        <Link href={`/employees/${manager.id}`} className="text-primary hover:underline">
                          {manager.firstName} {manager.lastName}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          {employee.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {employee.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bio */}
          {employee.bio && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{employee.bio}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Direct Reports */}
          {directReports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Direct Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {directReports.map((report) => (
                  <Link 
                    key={report.id}
                    href={`/employees/${report.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={report.avatar} />
                      <AvatarFallback>
                        {getInitials(`${report.firstName} ${report.lastName}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {report.firstName} {report.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{report.jobTitle}</p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                View Documents
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Access & Permissions
              </Button>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          {employee.emergencyContact && (
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{employee.emergencyContact.name}</p>
                <p className="text-sm text-muted-foreground">{employee.emergencyContact.relationship}</p>
                <a 
                  href={`tel:${employee.emergencyContact.phone}`}
                  className="text-sm text-primary hover:underline"
                >
                  {employee.emergencyContact.phone}
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
