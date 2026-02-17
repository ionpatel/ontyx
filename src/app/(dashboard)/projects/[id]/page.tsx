'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, FolderKanban, CheckCircle2, Clock, AlertCircle,
  Calendar, DollarSign, Users, Play, Pause, MoreHorizontal,
  Plus, Trash2, Edit, Timer
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  useProject, 
  useUpdateProject,
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useProjectMilestones,
  useCreateMilestone,
  useCompleteMilestone,
  useTimeEntries
} from '@/hooks/use-projects'
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

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ProjectDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const toast = useToast()
  
  const { data: project, isLoading, refetch } = useProject(id)
  const { data: tasks = [], refetch: refetchTasks } = useTasks({ project_id: id })
  const { data: milestones = [], refetch: refetchMilestones } = useProjectMilestones(id)
  const { data: timeEntries = [] } = useTimeEntries({ project_id: id })
  
  const updateProjectMutation = useUpdateProject()
  const createTaskMutation = useCreateTask()
  const updateTaskMutation = useUpdateTask()
  const deleteTaskMutation = useDeleteTask()
  const createMilestoneMutation = useCreateMilestone()
  const completeMilestoneMutation = useCompleteMilestone()
  
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false)
  const [showNewMilestoneDialog, setShowNewMilestoneDialog] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium')
  const [newMilestoneName, setNewMilestoneName] = useState('')
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState('')
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>
  }
  
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Project not found</p>
        <Button asChild variant="outline">
          <Link href="/projects">Back to Projects</Link>
        </Button>
      </div>
    )
  }
  
  const status = statusConfig[project.status]
  const StatusIcon = status.icon
  
  // Calculate stats
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'done').length
  const totalHours = timeEntries.reduce((sum, e) => sum + (e.hours || 0), 0)
  
  const handleStatusChange = async (newStatus: ProjectStatus) => {
    try {
      await updateProjectMutation.mutateAsync({ id: project.id, input: { status: newStatus } })
      toast.success('Status updated')
      refetch()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }
  
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error('Enter a task title')
      return
    }
    try {
      await createTaskMutation.mutateAsync({
        project_id: project.id,
        title: newTaskTitle.trim(),
        priority: newTaskPriority
      })
      toast.success('Task created')
      setShowNewTaskDialog(false)
      setNewTaskTitle('')
      refetchTasks()
    } catch (error) {
      toast.error('Failed to create task')
    }
  }
  
  const handleToggleTask = async (taskId: string, currentStatus: TaskStatus) => {
    const newStatus: TaskStatus = currentStatus === 'done' ? 'todo' : 'done'
    try {
      await updateTaskMutation.mutateAsync({ id: taskId, input: { status: newStatus } })
      refetchTasks()
      refetch()
    } catch (error) {
      toast.error('Failed to update task')
    }
  }
  
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    try {
      await deleteTaskMutation.mutateAsync(taskId)
      toast.success('Task deleted')
      refetchTasks()
    } catch (error) {
      toast.error('Failed to delete task')
    }
  }
  
  const handleCreateMilestone = async () => {
    if (!newMilestoneName.trim()) {
      toast.error('Enter a milestone name')
      return
    }
    try {
      await createMilestoneMutation.mutateAsync({
        projectId: project.id,
        input: {
          name: newMilestoneName.trim(),
          due_date: newMilestoneDueDate || undefined
        }
      })
      toast.success('Milestone created')
      setShowNewMilestoneDialog(false)
      setNewMilestoneName('')
      setNewMilestoneDueDate('')
      refetchMilestones()
    } catch (error) {
      toast.error('Failed to create milestone')
    }
  }
  
  const handleCompleteMilestone = async (milestoneId: string) => {
    try {
      await completeMilestoneMutation.mutateAsync(milestoneId)
      toast.success('Milestone completed')
      refetchMilestones()
    } catch (error) {
      toast.error('Failed to complete milestone')
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <Badge className={cn("text-sm", status.color)}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {status.label}
              </Badge>
            </div>
            {project.code && <p className="text-muted-foreground">{project.code}</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {project.status === 'planning' && (
            <Button onClick={() => handleStatusChange('active')}>
              <Play className="mr-2 h-4 w-4" />
              Start Project
            </Button>
          )}
          {project.status === 'active' && (
            <>
              <Button variant="outline" onClick={() => handleStatusChange('on_hold')}>
                <Pause className="mr-2 h-4 w-4" />
                Hold
              </Button>
              <Button onClick={() => handleStatusChange('completed')}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Complete
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.progress_percent}%</div>
            <Progress value={project.progress_percent} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}/{totalTasks}</div>
            <p className="text-xs text-muted-foreground">completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hours Logged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
            {project.estimated_hours && (
              <p className="text-xs text-muted-foreground">of {project.estimated_hours}h estimated</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.budget_amount ? formatCurrency(project.budget_amount, project.currency) : '—'}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Tasks ({totalTasks})</TabsTrigger>
          <TabsTrigger value="milestones">Milestones ({milestones.length})</TabsTrigger>
          <TabsTrigger value="time">Time ({timeEntries.length})</TabsTrigger>
        </TabsList>
        
        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowNewTaskDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No tasks yet. Add one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <Checkbox
                            checked={task.status === 'done'}
                            onCheckedChange={() => handleToggleTask(task.id, task.status)}
                          />
                        </TableCell>
                        <TableCell className={cn(task.status === 'done' && "line-through text-muted-foreground")}>
                          {task.title}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("font-normal", priorityConfig[task.priority].color)}>
                            {priorityConfig[task.priority].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("font-normal", taskStatusConfig[task.status].color)}>
                            {taskStatusConfig[task.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>{task.due_date ? formatDate(task.due_date) : '—'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowNewMilestoneDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Milestone
            </Button>
          </div>
          
          <div className="grid gap-4">
            {milestones.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No milestones yet
                </CardContent>
              </Card>
            ) : (
              milestones.map((milestone) => (
                <Card key={milestone.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {milestone.completed_at ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className={cn("font-medium", milestone.completed_at && "line-through text-muted-foreground")}>
                          {milestone.name}
                        </p>
                        {milestone.due_date && (
                          <p className="text-sm text-muted-foreground">Due: {formatDate(milestone.due_date)}</p>
                        )}
                      </div>
                    </div>
                    {!milestone.completed_at && (
                      <Button variant="outline" size="sm" onClick={() => handleCompleteMilestone(milestone.id)}>
                        Complete
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        {/* Time Tab */}
        <TabsContent value="time">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No time entries yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    timeEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{formatDate(entry.date)}</TableCell>
                        <TableCell>{entry.task?.title || '—'}</TableCell>
                        <TableCell>{entry.description || '—'}</TableCell>
                        <TableCell className="text-right font-medium">{entry.hours.toFixed(1)}h</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* New Task Dialog */}
      <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
            <DialogDescription>Add a task to this project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="What needs to be done?"
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTaskDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={createTaskMutation.isPending}>
              {createTaskMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* New Milestone Dialog */}
      <Dialog open={showNewMilestoneDialog} onOpenChange={setShowNewMilestoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Milestone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={newMilestoneName}
                onChange={(e) => setNewMilestoneName(e.target.value)}
                placeholder="Milestone name"
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={newMilestoneDueDate}
                onChange={(e) => setNewMilestoneDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewMilestoneDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateMilestone} disabled={createMilestoneMutation.isPending}>
              {createMilestoneMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
