// Projects Types

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Project {
  id: string
  organization_id: string
  code?: string
  name: string
  description?: string
  contact_id?: string
  opportunity_id?: string
  status: ProjectStatus
  start_date?: string
  end_date?: string
  actual_start?: string
  actual_end?: string
  currency: string
  budget_amount?: number
  actual_amount: number
  estimated_hours?: number
  actual_hours: number
  is_billable: boolean
  billing_method: string
  hourly_rate?: number
  project_manager_id?: string
  progress_percent: number
  color: string
  tags?: string[]
  created_by?: string
  created_at: string
  updated_at: string
  // Joined
  contact?: {
    id: string
    display_name: string
  }
  project_manager?: {
    id: string
    full_name?: string
  }
  tasks_count?: number
  milestones_count?: number
}

export interface ProjectMilestone {
  id: string
  project_id: string
  name: string
  description?: string
  due_date?: string
  completed_at?: string
  is_billable: boolean
  amount?: number
  invoice_id?: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  organization_id: string
  project_id?: string
  milestone_id?: string
  parent_id?: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  start_date?: string
  due_date?: string
  completed_at?: string
  estimated_hours?: number
  actual_hours: number
  assigned_to?: string
  progress_percent: number
  tags?: string[]
  sort_order: number
  created_by?: string
  created_at: string
  updated_at: string
  // Joined
  project?: {
    id: string
    name: string
    code?: string
  }
  assigned_user?: {
    id: string
    full_name?: string
  }
  subtasks?: Task[]
}

export interface TimeEntry {
  id: string
  organization_id: string
  user_id: string
  project_id?: string
  task_id?: string
  date: string
  hours: number
  description?: string
  is_billable: boolean
  is_billed: boolean
  hourly_rate?: number
  created_at: string
  // Joined
  project?: { id: string; name: string }
  task?: { id: string; title: string }
  user?: { id: string; full_name?: string }
}

export interface CreateProjectInput {
  name: string
  code?: string
  description?: string
  contact_id?: string
  start_date?: string
  end_date?: string
  budget_amount?: number
  estimated_hours?: number
  is_billable?: boolean
  billing_method?: string
  hourly_rate?: number
  project_manager_id?: string
  color?: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  status?: ProjectStatus
  start_date?: string
  end_date?: string
  budget_amount?: number
  estimated_hours?: number
  progress_percent?: number
  color?: string
}

export interface CreateTaskInput {
  project_id?: string
  milestone_id?: string
  parent_id?: string
  title: string
  description?: string
  priority?: TaskPriority
  start_date?: string
  due_date?: string
  estimated_hours?: number
  assigned_to?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  due_date?: string
  estimated_hours?: number
  assigned_to?: string
  progress_percent?: number
}

export interface ProjectSummary {
  total_projects: number
  active_projects: number
  completed_projects: number
  total_tasks: number
  overdue_tasks: number
  total_budget: number
  total_actual: number
}
