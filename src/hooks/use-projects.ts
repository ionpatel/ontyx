'use client'

import { useState, useEffect, useCallback } from 'react'
import * as projectService from '@/services/projects'
import { useAuth } from '@/components/providers/auth-provider'
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
  TaskStatus
} from '@/types/projects'

// =============================================================================
// PROJECTS
// =============================================================================

export function useProjects() {
  const { organizationId, loading: authLoading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    if (!organizationId) {
      setProjects([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await projectService.getProjects(organizationId)
      setProjects(data)
    } catch (err) {
      setError('Failed to fetch projects')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    if (authLoading) return
    fetchProjects()
  }, [fetchProjects, authLoading])

  return {
    data: projects,
    isLoading: loading || authLoading,
    error,
    refetch: fetchProjects
  }
}

export function useProject(id: string | undefined) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = useCallback(async () => {
    if (!id) {
      setProject(null)
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const data = await projectService.getProject(id)
      setProject(data)
    } catch (err) {
      setError('Failed to fetch project')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  return { data: project, isLoading: loading, error, refetch: fetchProject }
}

export function useCreateProject() {
  const { organizationId } = useAuth()
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (input: CreateProjectInput): Promise<Project> => {
    if (!organizationId) throw new Error('No organization')
    setIsPending(true)
    try {
      return await projectService.createProject(organizationId, input)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useUpdateProject() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async ({ id, input }: { id: string; input: UpdateProjectInput }): Promise<Project> => {
    setIsPending(true)
    try {
      return await projectService.updateProject(id, input)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useDeleteProject() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (id: string): Promise<void> => {
    setIsPending(true)
    try {
      await projectService.deleteProject(id)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

// =============================================================================
// MILESTONES
// =============================================================================

export function useProjectMilestones(projectId: string | undefined) {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMilestones = useCallback(async () => {
    if (!projectId) {
      setMilestones([])
      setLoading(false)
      return
    }
    
    try {
      const data = await projectService.getProjectMilestones(projectId)
      setMilestones(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchMilestones()
  }, [fetchMilestones])

  return { data: milestones, isLoading: loading, refetch: fetchMilestones }
}

export function useCreateMilestone() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async ({ 
    projectId, 
    input 
  }: { 
    projectId: string
    input: { name: string; description?: string; due_date?: string; is_billable?: boolean; amount?: number }
  }): Promise<ProjectMilestone> => {
    setIsPending(true)
    try {
      return await projectService.createMilestone(projectId, input)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useCompleteMilestone() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (id: string): Promise<void> => {
    setIsPending(true)
    try {
      await projectService.completeMilestone(id)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

// =============================================================================
// TASKS
// =============================================================================

export function useTasks(filters?: { project_id?: string; status?: TaskStatus; assigned_to?: string }) {
  const { organizationId, loading: authLoading } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!organizationId) {
      setTasks([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const data = await projectService.getTasks(organizationId, filters)
      setTasks(data)
    } catch (err) {
      setError('Failed to fetch tasks')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId, filters?.project_id, filters?.status, filters?.assigned_to])

  useEffect(() => {
    if (authLoading) return
    fetchTasks()
  }, [fetchTasks, authLoading])

  return { data: tasks, isLoading: loading, error, refetch: fetchTasks }
}

export function useTask(id: string | undefined) {
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTask = useCallback(async () => {
    if (!id) {
      setTask(null)
      setLoading(false)
      return
    }
    
    try {
      const data = await projectService.getTask(id)
      setTask(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchTask()
  }, [fetchTask])

  return { data: task, isLoading: loading, refetch: fetchTask }
}

export function useCreateTask() {
  const { organizationId } = useAuth()
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (input: CreateTaskInput): Promise<Task> => {
    if (!organizationId) throw new Error('No organization')
    setIsPending(true)
    try {
      return await projectService.createTask(organizationId, input)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useUpdateTask() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async ({ id, input }: { id: string; input: UpdateTaskInput }): Promise<Task> => {
    setIsPending(true)
    try {
      return await projectService.updateTask(id, input)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useDeleteTask() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (id: string): Promise<void> => {
    setIsPending(true)
    try {
      await projectService.deleteTask(id)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

// =============================================================================
// TIME ENTRIES
// =============================================================================

export function useTimeEntries(filters?: { project_id?: string; user_id?: string; from_date?: string; to_date?: string }) {
  const { organizationId, loading: authLoading } = useAuth()
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEntries = useCallback(async () => {
    if (!organizationId) {
      setEntries([])
      setLoading(false)
      return
    }
    
    try {
      const data = await projectService.getTimeEntries(organizationId, filters)
      setEntries(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId, filters?.project_id, filters?.user_id, filters?.from_date, filters?.to_date])

  useEffect(() => {
    if (authLoading) return
    fetchEntries()
  }, [fetchEntries, authLoading])

  return { data: entries, isLoading: loading, refetch: fetchEntries }
}

export function useCreateTimeEntry() {
  const { organizationId } = useAuth()
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (input: { 
    project_id?: string
    task_id?: string
    date: string
    hours: number
    description?: string
    is_billable?: boolean
  }): Promise<TimeEntry> => {
    if (!organizationId) throw new Error('No organization')
    setIsPending(true)
    try {
      return await projectService.createTimeEntry(organizationId, input)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

// =============================================================================
// SUMMARY
// =============================================================================

export function useProjectSummary() {
  const { organizationId, loading: authLoading } = useAuth()
  const [summary, setSummary] = useState<ProjectSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSummary = useCallback(async () => {
    if (!organizationId) {
      setSummary(null)
      setLoading(false)
      return
    }
    
    try {
      const data = await projectService.getProjectSummary(organizationId)
      setSummary(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    if (authLoading) return
    fetchSummary()
  }, [fetchSummary, authLoading])

  return { data: summary, isLoading: loading }
}
