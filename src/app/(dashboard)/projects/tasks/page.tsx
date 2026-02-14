"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, CheckCircle2, Search, MoreHorizontal, Eye, Edit, Circle, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { cn, formatDate } from "@/lib/utils"
import { mockTasks, getProjectsSummary } from "@/lib/mock-data"
import { Task, TaskStatus } from "@/types/manufacturing"

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const summary = getProjectsSummary()

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.projectName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusIcon = (status: TaskStatus) => {
    const icons: Record<TaskStatus, React.ReactNode> = {
      todo: <Circle className="h-4 w-4 text-muted-foreground" />,
      in_progress: <Clock className="h-4 w-4 text-blue-500" />,
      review: <AlertCircle className="h-4 w-4 text-yellow-500" />,
      completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      blocked: <AlertCircle className="h-4 w-4 text-red-500" />,
    }
    return icons[status]
  }

  const getStatusBadge = (status: TaskStatus) => {
    const config: Record<TaskStatus, { variant: "default" | "secondary" | "destructive" | "outline", className?: string }> = {
      todo: { variant: "secondary" },
      in_progress: { variant: "default" },
      review: { variant: "outline", className: "border-yellow-500 text-yellow-500" },
      completed: { variant: "outline", className: "border-green-500 text-green-500" },
      blocked: { variant: "destructive" },
    }
    const { variant, className } = config[status]
    return (
      <Badge variant={variant} className={cn("capitalize", className)}>
        {status.replace("_", " ")}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "bg-red-500/10 text-red-500 border-red-500/20",
      high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      low: "bg-green-500/10 text-green-500 border-green-500/20",
    }
    return (
      <Badge variant="outline" className={cn("capitalize", colors[priority])}>
        {priority}
      </Badge>
    )
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  const stats = [
    { title: "To Do", value: tasks.filter(t => t.status === "todo").length, color: "text-muted-foreground" },
    { title: "In Progress", value: tasks.filter(t => t.status === "in_progress").length, color: "text-blue-500" },
    { title: "In Review", value: tasks.filter(t => t.status === "review").length, color: "text-yellow-500" },
    { title: "Completed", value: tasks.filter(t => t.status === "completed").length, color: "text-green-500" },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track all project tasks
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/tasks/new">
            <Plus className="mr-2 h-4 w-4" /> New Task
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", stat.color)}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">In Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]"></TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{getStatusIcon(task.status)}</TableCell>
                  <TableCell>
                    <Link href={`/projects/tasks/${task.id}`} className="font-medium text-primary hover:underline">
                      {task.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/projects/${task.projectId}`} className="text-muted-foreground hover:text-primary hover:underline">
                      {task.projectName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {task.assigneeName ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getInitials(task.assigneeName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.assigneeName}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                  <TableCell>
                    {task.dueDate ? formatDate(task.dueDate) : "-"}
                  </TableCell>
                  <TableCell>
                    {task.actualHours !== undefined ? (
                      <span>
                        {task.actualHours}
                        {task.estimatedHours && (
                          <span className="text-muted-foreground">/{task.estimatedHours}h</span>
                        )}
                      </span>
                    ) : task.estimatedHours ? (
                      <span className="text-muted-foreground">{task.estimatedHours}h est</span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/projects/tasks/${task.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/projects/tasks/${task.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No tasks found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Get started by creating a new task
              </p>
              <Button className="mt-4" asChild>
                <Link href="/projects/tasks/new">
                  <Plus className="mr-2 h-4 w-4" /> New Task
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
