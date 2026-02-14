'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Search, Plus, Filter, Users, Building2, UserPlus, Clock,
  Mail, Phone, MapPin, MoreHorizontal, Grid, List, Network
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn, getInitials } from '@/lib/utils'
import { mockEmployees, mockDepartments, mockEmployeeStats } from '@/lib/mock-data/employees'
import { Employee, EmploymentStatus, EmploymentType } from '@/types/employees'

type ViewMode = 'grid' | 'list'

const statusColors: Record<EmploymentStatus, string> = {
  active: 'bg-green-500',
  'on-leave': 'bg-yellow-500',
  terminated: 'bg-red-500',
  resigned: 'bg-gray-500',
}

const typeLabels: Record<EmploymentType, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  'contract': 'Contract',
  'intern': 'Intern',
}

function StatCard({ title, value, icon: Icon, color }: { 
  title: string
  value: string | number
  icon: React.ElementType
  color?: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
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

function EmployeeCard({ employee }: { employee: Employee }) {
  const department = mockDepartments.find(d => d.id === employee.departmentId)
  
  return (
    <Link href={`/employees/${employee.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={employee.avatar} />
                <AvatarFallback className="text-xl">
                  {getInitials(`${employee.firstName} ${employee.lastName}`)}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white",
                statusColors[employee.status]
              )} />
            </div>
            
            <h3 className="font-semibold mt-4">
              {employee.firstName} {employee.lastName}
            </h3>
            <p className="text-sm text-muted-foreground">{employee.jobTitle}</p>
            
            {department && (
              <Badge 
                variant="outline" 
                className="mt-2"
                style={{ borderColor: department.color.replace('bg-', '').replace('-500', '') }}
              >
                {department.name}
              </Badge>
            )}
            
            <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{employee.location}</span>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Mail className="h-4 w-4" />
              </Button>
              {employee.phone && (
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Phone className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function EmployeeRow({ employee }: { employee: Employee }) {
  const department = mockDepartments.find(d => d.id === employee.departmentId)
  
  return (
    <Link 
      href={`/employees/${employee.id}`}
      className="flex items-center justify-between py-4 hover:bg-muted/50 px-4 -mx-4 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage src={employee.avatar} />
            <AvatarFallback>
              {getInitials(`${employee.firstName} ${employee.lastName}`)}
            </AvatarFallback>
          </Avatar>
          <div className={cn(
            "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
            statusColors[employee.status]
          )} />
        </div>
        <div>
          <p className="font-medium">
            {employee.firstName} {employee.lastName}
          </p>
          <p className="text-sm text-muted-foreground">{employee.jobTitle}</p>
        </div>
      </div>
      
      <div className="hidden md:flex items-center gap-8">
        {department && (
          <Badge variant="outline">{department.name}</Badge>
        )}
        <span className="text-sm text-muted-foreground w-32">{employee.location}</span>
        <span className="text-sm text-muted-foreground w-24">{typeLabels[employee.employmentType]}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Mail className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </Link>
  )
}

export default function EmployeesPage() {
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const filteredEmployees = mockEmployees.filter(employee => {
    const matchesSearch = 
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      employee.email.toLowerCase().includes(search.toLowerCase()) ||
      employee.jobTitle.toLowerCase().includes(search.toLowerCase())
    
    const matchesDepartment = departmentFilter === 'all' || employee.departmentId === departmentFilter
    
    return matchesSearch && matchesDepartment
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">Manage your team members</p>
        </div>
        <div className="flex gap-2">
          <Link href="/employees/org-chart">
            <Button variant="outline">
              <Network className="h-4 w-4 mr-2" />
              Org Chart
            </Button>
          </Link>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard 
          title="Total Employees" 
          value={mockEmployeeStats.total} 
          icon={Users}
        />
        <StatCard 
          title="Active" 
          value={mockEmployeeStats.active} 
          icon={Users}
          color="bg-green-500"
        />
        <StatCard 
          title="Departments" 
          value={mockEmployeeStats.departments} 
          icon={Building2}
        />
        <StatCard 
          title="New This Month" 
          value={mockEmployeeStats.newHires} 
          icon={UserPlus}
        />
      </div>

      {/* Departments Quick Access */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {mockDepartments.map((dept) => (
          <Button
            key={dept.id}
            variant={departmentFilter === dept.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDepartmentFilter(dept.id === departmentFilter ? 'all' : dept.id)}
            className="flex-shrink-0"
          >
            <div className={cn("w-2 h-2 rounded-full mr-2", dept.color)} />
            {dept.name}
            <Badge variant="secondary" className="ml-2">{dept.employeeCount}</Badge>
          </Button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      {viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredEmployees.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {filteredEmployees.length} Employee{filteredEmployees.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {filteredEmployees.map((employee) => (
                <EmployeeRow key={employee.id} employee={employee} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredEmployees.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No employees found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
