'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  FolderKanban, Plus, Clock, CheckCircle2, AlertCircle, Pause,
  MoreHorizontal, Eye, Trash2, Play, Calendar, DollarSign
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProjects, useTasks, useProjectSummary, useDeleteProject, useUpdateProject } from '@/hooks/use-projects'
import { useToast } from '@/components/ui/toast'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { ProjectStatus, TaskStatus, TaskPriority } from '@/types/projects'

const statusConfig: Record<ProjectStatus, { label: string; color: string; icon: typeof Clock }> = {
  planning: { label: 'Planning', color: 'bg-slate-100 text-slate-700', icon: Clock },
  active: { label: 'Active', color: 'bg-blue-100 text-blue-700', icon: Play },
  on_hold: { label: 'On Hold', color: 'bg-yellow-100 text-yellow-700', icon: Pause },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: AlertCircle }
}

const taskStatusConfig: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: 'To Do', color: 'bg-slate-100 text-slate-700' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  review: { label: 'Review', color: 'bg-purple-100 text-purple-700' },
  done: { label: 'Done', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' }
}

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-700' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700' }
}

export default function ProjectsPage() {
  const router = useRouter()
  const toast = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('projects')
  
  const { data: projects = [], isLoading: projectsLoading, refetch: refetchProjects } = useProjects()
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useTasks()
  const { data: summary } = useProjectSummary()
  const deleteProjectMutation = useDeleteProject()
  const updateProjectMutation = useUpdateProject()
  
  // Filter projects
  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })
  
  const handleDeleteProject = async (id: string) => {
    if (!confirm('Delete this project and all its tasks?')) return
    try {
      await deleteProjectMutation.mutateAsync(id)
      toast.success('Project deleted')
      refetchProjects()
    } catch (error) {
      toast.error('Failed to delete project')
    }
  }
  
  const handleStartProject = async (id: string) => {
    try {
      await updateProjectMutation.mutateAsync({ id, input: { status: 'active' } })
      toast.success('Project started')
      refetchProjects()
    } catch (error) {
      toast.error('Failed to start project')
    }
  }
  
  const stats = [
    {
      title: 'Active Projects',
      value: summary?.active_projects || 0,
      subtitle: `${summary?.total_projects || 0} total`,
      icon: FolderKanban,
      color: 'text-blue-600'
    },
    {
      title: 'Total Tasks',
      value: summary?.total_tasks || 0,
      subtitle: `${summary?.overdue_tasks || 0} overdue`,
      icon: CheckCircle2,
      color: 'text-green-600'
    },
    {
      title: 'Budget',
      value: formatCurrency(summary?.total_budget || 0, 'CAD'),
      subtitle: `${formatCurrency(summary?.total_actual || 0, 'CAD')} spent`,
      icon: DollarSign,
      color: 'text-emerald-600'
    },
    {
      title: 'Completed',
      value: summary?.completed_projects || 0,
      subtitle: 'projects',
      icon: CheckCircle2,
      color: 'text-purple-600'
    }
  ]
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage projects, tasks, and track progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/projects/tasks">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              All Tasks
            </Link>
          </Button>
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Projects Grid/Table */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projectsLoading ? (
          <p className="col-span-full text-center py-8 text-muted-foreground">Loading...</p>
        ) : filteredProjects.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              No projects found. Create your first project to get started.
            </CardContent>
          </Card>
        ) : (
          filteredProjects.map((project) => {
            const status = statusConfig[project.status]
            const StatusIcon = status.icon
            return (
              <Card 
                key={project.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      {project.code && (
                        <CardDescription>{project.code}</CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/projects/${project.id}`)
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {project.status === 'planning' && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            handleStartProject(project.id)
                          }}>
                            <Play className="mr-2 h-4 w-4" />
                            Start Project
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteProject(project.id)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Badge className={cn("font-normal", status.color)}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {status.label}
                    </Badge>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span>{project.progress_percent}%</span>
                      </div>
                      <Progress value={project.progress_percent} className="h-2" />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      {project.end_date ? (
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="mr-1 h-3 w-3" />
                          Due {formatDate(project.end_date)}
                        </div>
                      ) : (
                        <span />
                      )}
                      {project.budget_amount && (
                        <span className="font-medium">
                          {formatCurrency(project.budget_amount, project.currency)}
                        </span>
                      )}
                    </div>
                    
                    {project.contact && (
                      <p className="text-sm text-muted-foreground truncate">
                        Client: {project.contact.display_name}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
