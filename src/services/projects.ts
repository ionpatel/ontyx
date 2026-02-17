import { createClient } from '@/lib/supabase/client'
import type { 
  Project, 
  ProjectMilestone,
  Task, 
  TimeEntry,
  CreateProjectInput, 
  UpdateProjectInput,
  CreateTaskInput,
  UpdateTaskInput,
  ProjectSummary,
  ProjectStatus,
  TaskStatus
} from '@/types/projects'

// =============================================================================
// PROJECTS
// =============================================================================

export async function getProjects(organizationId: string): Promise<Project[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      contact:contacts!contact_id (
        id,
        display_name
      ),
      project_manager:users!project_manager_id (
        id,
        full_name
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      contact:contacts!contact_id (
        id,
        display_name
      ),
      project_manager:users!project_manager_id (
        id,
        full_name
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function createProject(
  organizationId: string,
  input: CreateProjectInput
): Promise<Project> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  // Generate code if not provided
  let code = input.code
  if (!code) {
    const { data: existing } = await supabase
      .from('projects')
      .select('code')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    const lastNum = existing?.code ? parseInt(existing.code.replace('PRJ-', ''), 10) || 0 : 0
    code = `PRJ-${String(lastNum + 1).padStart(3, '0')}`
  }
  
  const { data, error } = await supabase
    .from('projects')
    .insert({
      organization_id: organizationId,
      ...input,
      code,
      status: 'planning',
      progress_percent: 0,
      actual_amount: 0,
      actual_hours: 0,
      created_by: user.id
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<Project> {
  const supabase = createClient()
  
  const updateData: Record<string, unknown> = {
    ...input,
    updated_at: new Date().toISOString()
  }
  
  // If status changed to completed, set actual_end
  if (input.status === 'completed') {
    updateData.actual_end = new Date().toISOString().split('T')[0]
  }
  
  // If status changed to active and no actual_start, set it
  if (input.status === 'active') {
    const { data: project } = await supabase
      .from('projects')
      .select('actual_start')
      .eq('id', id)
      .single()
    
    if (!project?.actual_start) {
      updateData.actual_start = new Date().toISOString().split('T')[0]
    }
  }
  
  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// =============================================================================
// MILESTONES
// =============================================================================

export async function getProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('project_milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order')
  
  if (error) throw error
  return data || []
}

export async function createMilestone(
  projectId: string,
  input: { name: string; description?: string; due_date?: string; is_billable?: boolean; amount?: number }
): Promise<ProjectMilestone> {
  const supabase = createClient()
  
  // Get max sort_order
  const { data: existing } = await supabase
    .from('project_milestones')
    .select('sort_order')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()
  
  const sortOrder = (existing?.sort_order || 0) + 1
  
  const { data, error } = await supabase
    .from('project_milestones')
    .insert({
      project_id: projectId,
      ...input,
      sort_order: sortOrder
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function completeMilestone(id: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('project_milestones')
    .update({
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
  
  if (error) throw error
}

// =============================================================================
// TASKS
// =============================================================================

export async function getTasks(
  organizationId: string,
  filters?: { project_id?: string; status?: TaskStatus; assigned_to?: string }
): Promise<Task[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('tasks')
    .select(`
      *,
      project:projects!project_id (
        id,
        name,
        code
      ),
      assigned_user:users!assigned_to (
        id,
        full_name
      )
    `)
    .eq('organization_id', organizationId)
    .is('parent_id', null) // Only top-level tasks
    .order('sort_order')
  
  if (filters?.project_id) {
    query = query.eq('project_id', filters.project_id)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data || []
}

export async function getTask(id: string): Promise<Task | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      project:projects!project_id (
        id,
        name,
        code
      ),
      assigned_user:users!assigned_to (
        id,
        full_name
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  
  // Get subtasks
  if (data) {
    const { data: subtasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('parent_id', id)
      .order('sort_order')
    
    data.subtasks = subtasks || []
  }
  
  return data
}

export async function createTask(
  organizationId: string,
  input: CreateTaskInput
): Promise<Task> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      organization_id: organizationId,
      ...input,
      status: 'todo',
      progress_percent: 0,
      actual_hours: 0,
      created_by: user.id
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput
): Promise<Task> {
  const supabase = createClient()
  
  const updateData: Record<string, unknown> = {
    ...input,
    updated_at: new Date().toISOString()
  }
  
  // If status changed to done, set completed_at
  if (input.status === 'done') {
    updateData.completed_at = new Date().toISOString()
    updateData.progress_percent = 100
  }
  
  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  
  // Update project progress if task has project
  if (data.project_id) {
    await updateProjectProgress(data.project_id)
  }
  
  return data
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = createClient()
  
  // Get task to check project
  const { data: task } = await supabase
    .from('tasks')
    .select('project_id')
    .eq('id', id)
    .single()
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  
  // Update project progress
  if (task?.project_id) {
    await updateProjectProgress(task.project_id)
  }
}

// Update project progress based on task completion
async function updateProjectProgress(projectId: string): Promise<void> {
  const supabase = createClient()
  
  const { data: tasks } = await supabase
    .from('tasks')
    .select('status')
    .eq('project_id', projectId)
  
  if (!tasks || tasks.length === 0) return
  
  const completedTasks = tasks.filter(t => t.status === 'done').length
  const progress = Math.round((completedTasks / tasks.length) * 100)
  
  await supabase
    .from('projects')
    .update({ progress_percent: progress })
    .eq('id', projectId)
}

// =============================================================================
// TIME ENTRIES
// =============================================================================

export async function getTimeEntries(
  organizationId: string,
  filters?: { project_id?: string; user_id?: string; from_date?: string; to_date?: string }
): Promise<TimeEntry[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('time_entries')
    .select(`
      *,
      project:projects!project_id (id, name),
      task:tasks!task_id (id, title),
      user:users!user_id (id, full_name)
    `)
    .eq('organization_id', organizationId)
    .order('date', { ascending: false })
  
  if (filters?.project_id) {
    query = query.eq('project_id', filters.project_id)
  }
  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id)
  }
  if (filters?.from_date) {
    query = query.gte('date', filters.from_date)
  }
  if (filters?.to_date) {
    query = query.lte('date', filters.to_date)
  }
  
  const { data, error } = await query.limit(100)
  
  if (error) throw error
  return data || []
}

export async function createTimeEntry(
  organizationId: string,
  input: { project_id?: string; task_id?: string; date: string; hours: number; description?: string; is_billable?: boolean }
): Promise<TimeEntry> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      organization_id: organizationId,
      user_id: user.id,
      ...input,
      is_billed: false
    })
    .select()
    .single()
  
  if (error) throw error
  
  // Update task actual_hours
  if (input.task_id) {
    const { data: entries } = await supabase
      .from('time_entries')
      .select('hours')
      .eq('task_id', input.task_id)
    
    const totalHours = (entries || []).reduce((sum, e) => sum + (e.hours || 0), 0)
    
    await supabase
      .from('tasks')
      .update({ actual_hours: totalHours })
      .eq('id', input.task_id)
  }
  
  // Update project actual_hours
  if (input.project_id) {
    const { data: entries } = await supabase
      .from('time_entries')
      .select('hours')
      .eq('project_id', input.project_id)
    
    const totalHours = (entries || []).reduce((sum, e) => sum + (e.hours || 0), 0)
    
    await supabase
      .from('projects')
      .update({ actual_hours: totalHours })
      .eq('id', input.project_id)
  }
  
  return data
}

// =============================================================================
// SUMMARY
// =============================================================================

export async function getProjectSummary(organizationId: string): Promise<ProjectSummary> {
  const supabase = createClient()
  
  const { data: projects } = await supabase
    .from('projects')
    .select('status, budget_amount, actual_amount')
    .eq('organization_id', organizationId)
  
  const { data: tasks } = await supabase
    .from('tasks')
    .select('status, due_date')
    .eq('organization_id', organizationId)
  
  const projectList = projects || []
  const taskList = tasks || []
  const today = new Date().toISOString().split('T')[0]
  
  return {
    total_projects: projectList.length,
    active_projects: projectList.filter(p => p.status === 'active').length,
    completed_projects: projectList.filter(p => p.status === 'completed').length,
    total_tasks: taskList.length,
    overdue_tasks: taskList.filter(t => 
      t.due_date && t.due_date < today && !['done', 'cancelled'].includes(t.status)
    ).length,
    total_budget: projectList.reduce((sum, p) => sum + (p.budget_amount || 0), 0),
    total_actual: projectList.reduce((sum, p) => sum + (p.actual_amount || 0), 0)
  }
}
