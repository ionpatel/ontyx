// Manufacturing Types

// Bill of Materials
export interface BOMItem {
  id: string
  itemCode: string
  name: string
  description?: string
  quantity: number
  unit: string
  unitCost: number
  totalCost: number
  leadTimeDays: number
  supplierId?: string
  supplierName?: string
}

export interface BillOfMaterials {
  id: string
  bomNumber: string
  productId: string
  productName: string
  productSku: string
  version: string
  status: "draft" | "active" | "obsolete"
  items: BOMItem[]
  totalCost: number
  laborCost: number
  overheadCost: number
  totalProductionCost: number
  notes?: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

// Work Orders
export type WorkOrderStatus = "draft" | "planned" | "in_progress" | "on_hold" | "completed" | "cancelled"
export type WorkOrderPriority = "low" | "medium" | "high" | "urgent"

export interface WorkOrderOperation {
  id: string
  sequence: number
  name: string
  workCenterId: string
  workCenterName: string
  plannedHours: number
  actualHours?: number
  status: "pending" | "in_progress" | "completed"
  startedAt?: string
  completedAt?: string
  assignedTo?: string
  notes?: string
}

export interface WorkOrder {
  id: string
  orderNumber: string
  bomId: string
  productId: string
  productName: string
  quantity: number
  quantityCompleted: number
  status: WorkOrderStatus
  priority: WorkOrderPriority
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate?: string
  actualEndDate?: string
  operations: WorkOrderOperation[]
  estimatedCost: number
  actualCost?: number
  assignedTo?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// Production Scheduling
export interface ProductionSchedule {
  id: string
  name: string
  startDate: string
  endDate: string
  workOrders: string[] // Work order IDs
  status: "draft" | "active" | "completed"
  capacity: number
  utilization: number
  createdAt: string
  updatedAt: string
}

export interface WorkCenter {
  id: string
  code: string
  name: string
  description?: string
  capacityPerHour: number
  costPerHour: number
  isActive: boolean
  currentUtilization: number
}

// Quality Control
export type QCStatus = "pending" | "passed" | "failed" | "needs_review"

export interface QualityCheckItem {
  id: string
  parameter: string
  specification: string
  actualValue?: string
  result: "pass" | "fail" | "pending"
  notes?: string
}

export interface QualityCheck {
  id: string
  checkNumber: string
  workOrderId: string
  workOrderNumber: string
  productName: string
  batchNumber?: string
  inspectionDate: string
  inspectorId: string
  inspectorName: string
  status: QCStatus
  items: QualityCheckItem[]
  overallResult: "pass" | "fail" | "pending"
  notes?: string
  attachments?: string[]
  createdAt: string
  updatedAt: string
}

// Projects Module Types
export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled"
export type ProjectPriority = "low" | "medium" | "high" | "critical"

export interface Project {
  id: string
  code: string
  name: string
  description?: string
  clientId?: string
  clientName?: string
  status: ProjectStatus
  priority: ProjectPriority
  startDate: string
  endDate: string
  budget: number
  spent: number
  progress: number
  managerId: string
  managerName: string
  teamMembers: string[]
  tags?: string[]
  createdAt: string
  updatedAt: string
}

// Tasks
export type TaskStatus = "todo" | "in_progress" | "review" | "completed" | "blocked"
export type TaskPriority = "low" | "medium" | "high" | "urgent"

export interface Task {
  id: string
  projectId: string
  projectName: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId?: string
  assigneeName?: string
  dueDate?: string
  estimatedHours?: number
  actualHours?: number
  parentTaskId?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
  completedAt?: string
}

// Milestones
export interface Milestone {
  id: string
  projectId: string
  projectName: string
  title: string
  description?: string
  dueDate: string
  status: "pending" | "achieved" | "missed"
  completedDate?: string
  deliverables?: string[]
  createdAt: string
}

// Time Tracking
export interface TimeEntry {
  id: string
  projectId: string
  projectName: string
  taskId?: string
  taskTitle?: string
  userId: string
  userName: string
  date: string
  hours: number
  description?: string
  billable: boolean
  hourlyRate?: number
  status: "draft" | "submitted" | "approved" | "rejected"
  createdAt: string
}

// Settings Types
export interface CompanyProfile {
  id: string
  name: string
  legalName?: string
  email: string
  phone?: string
  website?: string
  address: string
  city: string
  state?: string
  postalCode?: string
  country: string
  taxId?: string
  registrationNumber?: string
  logo?: string
  favicon?: string
  currency: string
  timezone: string
  fiscalYearStart: string
  industry?: string
}

export interface BrandingSettings {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl?: string
  faviconUrl?: string
  fontFamily: string
  borderRadius: "none" | "sm" | "md" | "lg" | "full"
}

export interface UserPreferences {
  theme: "light" | "dark" | "system"
  language: string
  dateFormat: string
  timeFormat: "12h" | "24h"
  currency: string
  notifications: {
    email: boolean
    push: boolean
    desktop: boolean
  }
  dashboardLayout: "default" | "compact" | "expanded"
}

export interface SystemSettings {
  invoicePrefix: string
  invoiceNextNumber: number
  billPrefix: string
  billNextNumber: number
  workOrderPrefix: string
  workOrderNextNumber: number
  projectCodePrefix: string
  projectNextNumber: number
  defaultPaymentTerms: number
  defaultTaxRate: number
  autoBackup: boolean
  backupFrequency: "daily" | "weekly" | "monthly"
}
