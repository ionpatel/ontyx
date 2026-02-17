'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Clock, Play, Pause, Plus, Calendar, 
  ChevronLeft, ChevronRight, Timer, DollarSign
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { useTimeEntries, useCreateTimeEntry, useProjects, useTasks } from '@/hooks/use-projects'
import { useToast } from '@/components/ui/toast'
import { cn, formatDate } from '@/lib/utils'

export default function TimeTrackingPage() {
  const toast = useToast()
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  // Get current week range
  const currentDate = new Date(selectedDate)
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  
  const { data: entries = [], isLoading, refetch } = useTimeEntries({
    from_date: startOfWeek.toISOString().split('T')[0],
    to_date: endOfWeek.toISOString().split('T')[0]
  })
  const { data: projects = [] } = useProjects()
  const { data: tasks = [] } = useTasks()
  const createEntryMutation = useCreateTimeEntry()
  
  // New entry form state
  const [newProjectId, setNewProjectId] = useState('')
  const [newTaskId, setNewTaskId] = useState('')
  const [newDate, setNewDate] = useState(selectedDate)
  const [newHours, setNewHours] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newIsBillable, setNewIsBillable] = useState(true)
  
  // Group entries by date
  const entriesByDate: Record<string, typeof entries> = {}
  entries.forEach(entry => {
    if (!entriesByDate[entry.date]) {
      entriesByDate[entry.date] = []
    }
    entriesByDate[entry.date].push(entry)
  })
  
  // Calculate totals
  const totalHours = entries.reduce((sum, e) => sum + (e.hours || 0), 0)
  const billableHours = entries.filter(e => e.is_billable).reduce((sum, e) => sum + (e.hours || 0), 0)
  const todayHours = entries
    .filter(e => e.date === new Date().toISOString().split('T')[0])
    .reduce((sum, e) => sum + (e.hours || 0), 0)
  
  // Generate week days
  const weekDays = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    weekDays.push(day)
  }
  
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setSelectedDate(newDate.toISOString().split('T')[0])
  }
  
  const handleCreateEntry = async () => {
    if (!newHours || parseFloat(newHours) <= 0) {
      toast.error('Please enter valid hours')
      return
    }
    
    try {
      await createEntryMutation.mutateAsync({
        project_id: newProjectId || undefined,
        task_id: newTaskId || undefined,
        date: newDate,
        hours: parseFloat(newHours),
        description: newDescription || undefined,
        is_billable: newIsBillable
      })
      toast.success('Time entry added')
      setShowNewDialog(false)
      resetForm()
      refetch()
    } catch (error) {
      toast.error('Failed to add time entry')
    }
  }
  
  const resetForm = () => {
    setNewProjectId('')
    setNewTaskId('')
    setNewDate(selectedDate)
    setNewHours('')
    setNewDescription('')
    setNewIsBillable(true)
  }
  
  // Filter tasks by selected project
  const projectTasks = newProjectId 
    ? tasks.filter(t => t.project_id === newProjectId)
    : tasks
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time Tracking</h1>
          <p className="text-muted-foreground">
            Track time spent on projects and tasks
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Log Time
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayHours.toFixed(1)}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billable</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{billableHours.toFixed(1)}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-Billable</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalHours - billableHours).toFixed(1)}h</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Week Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <CardTitle>
                  {formatDate(startOfWeek.toISOString())} - {formatDate(endOfWeek.toISOString())}
                </CardTitle>
                <CardDescription>
                  Week {Math.ceil((startOfWeek.getDate() + 1) / 7)}
                </CardDescription>
              </div>
              <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}>
              Today
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week Days Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map((day) => {
              const dateStr = day.toISOString().split('T')[0]
              const dayEntries = entriesByDate[dateStr] || []
              const dayHours = dayEntries.reduce((sum, e) => sum + (e.hours || 0), 0)
              const isToday = dateStr === new Date().toISOString().split('T')[0]
              
              return (
                <div 
                  key={dateStr}
                  className={cn(
                    "p-3 rounded-lg border text-center cursor-pointer hover:bg-muted/50",
                    isToday && "border-primary bg-primary/5"
                  )}
                  onClick={() => {
                    setNewDate(dateStr)
                    setShowNewDialog(true)
                  }}
                >
                  <p className="text-xs text-muted-foreground">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className="font-semibold">{day.getDate()}</p>
                  <p className={cn(
                    "text-sm mt-1",
                    dayHours > 0 ? "text-green-600 font-medium" : "text-muted-foreground"
                  )}>
                    {dayHours > 0 ? `${dayHours.toFixed(1)}h` : '—'}
                  </p>
                </div>
              )
            })}
          </div>
          
          {/* Entries Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead>Billable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No time entries this week. Click on a day to add one.
                  </TableCell>
                </TableRow>
              ) : (
                entries
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell>
                        {entry.project ? (
                          <Link 
                            href={`/projects/${entry.project.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {entry.project.name}
                          </Link>
                        ) : '—'}
                      </TableCell>
                      <TableCell>{entry.task?.title || '—'}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {entry.description || '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {entry.hours.toFixed(1)}h
                      </TableCell>
                      <TableCell>
                        {entry.is_billable ? (
                          <Badge className="bg-green-100 text-green-700">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* New Entry Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Time</DialogTitle>
            <DialogDescription>
              Record time spent on work
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Hours *</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={newHours}
                  onChange={(e) => setNewHours(e.target.value)}
                  placeholder="1.5"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={newProjectId} onValueChange={(v) => {
                setNewProjectId(v)
                setNewTaskId('') // Reset task when project changes
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {newProjectId && (
              <div className="space-y-2">
                <Label>Task</Label>
                <Select value={newTaskId} onValueChange={setNewTaskId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select task" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No task</SelectItem>
                    {projectTasks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What did you work on?"
                rows={2}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="billable"
                checked={newIsBillable}
                onChange={(e) => setNewIsBillable(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="billable" className="font-normal">
                Billable time
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEntry} disabled={createEntryMutation.isPending}>
              {createEntryMutation.isPending ? 'Saving...' : 'Log Time'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
