"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, FolderKanban, Search, MoreHorizontal, Eye, Edit, Trash2, Calendar, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import { cn, formatDate, formatCurrency } from "@/lib/utils"
import { mockProjects, getProjectsSummary } from "@/lib/mock-data"
import { Project, ProjectStatus } from "@/types/manufacturing"

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const summary = getProjectsSummary()

  const filteredProjects = projects.filter(project => {
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.clientName?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      setProjects(prev => prev.filter(p => p.id !== id))
    }
  }

  const getStatusBadge = (status: ProjectStatus) => {
    const config: Record<ProjectStatus, { variant: "default" | "secondary" | "destructive" | "outline", className?: string }> = {
      planning: { variant: "secondary" },
      active: { variant: "default" },
      on_hold: { variant: "outline", className: "border-yellow-500 text-yellow-500" },
      completed: { variant: "outline", className: "border-green-500 text-green-500" },
      cancelled: { variant: "destructive" },
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
      critical: "bg-red-500/10 text-red-500 border-red-500/20",
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

  const stats = [
    { title: "Active", value: summary.activeProjects, color: "text-primary" },
    { title: "Planning", value: projects.filter(p => p.status === "planning").length, color: "text-blue-500" },
    { title: "Completed", value: projects.filter(p => p.status === "completed").length, color: "text-green-500" },
    { title: "On Hold", value: projects.filter(p => p.status === "on_hold").length, color: "text-yellow-500" },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Projects</h1>
          <p className="text-muted-foreground">
            View and manage all your projects
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
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
                  placeholder="Search projects..."
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
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div>
                      <Link href={`/projects/${project.id}`} className="font-medium text-primary hover:underline">
                        {project.name}
                      </Link>
                      <p className="text-xs text-muted-foreground font-mono">{project.code}</p>
                    </div>
                  </TableCell>
                  <TableCell>{project.clientName || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={project.progress} className="w-16 h-2" />
                      <span className="text-xs text-muted-foreground">{project.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{getPriorityBadge(project.priority)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{formatDate(project.startDate)}</p>
                      <p className="text-muted-foreground">to {formatDate(project.endDate)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{formatCurrency(project.spent)}</p>
                      <p className="text-muted-foreground">of {formatCurrency(project.budget)}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(project.status)}</TableCell>
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
                          <Link href={`/projects/${project.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/projects/${project.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(project.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No projects found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Get started by creating a new project
              </p>
              <Button className="mt-4" asChild>
                <Link href="/projects/new">
                  <Plus className="mr-2 h-4 w-4" /> New Project
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
