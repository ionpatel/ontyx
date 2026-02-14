// Employee Types for Ontyx HR

export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'intern'
export type EmploymentStatus = 'active' | 'on-leave' | 'terminated' | 'resigned'

export interface Department {
  id: string
  name: string
  code: string
  managerId?: string
  managerName?: string
  parentId?: string
  employeeCount: number
  color: string
}

export interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  avatar?: string
  jobTitle: string
  department: string
  departmentId: string
  managerId?: string
  managerName?: string
  employmentType: EmploymentType
  status: EmploymentStatus
  hireDate: string
  terminationDate?: string
  salary: number
  currency: string
  location: string
  workEmail: string
  skills: string[]
  bio?: string
  dateOfBirth?: string
  address?: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  emergencyContact?: {
    name: string
    relationship: string
    phone: string
  }
  directReports?: string[]
}

export interface OrgNode {
  id: string
  name: string
  title: string
  avatar?: string
  department: string
  children?: OrgNode[]
}

export interface EmployeeStats {
  total: number
  active: number
  onLeave: number
  newHires: number
  departments: number
  avgTenure: number
}
