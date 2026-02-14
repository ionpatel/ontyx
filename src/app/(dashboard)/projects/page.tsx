"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  FolderKanban, Plus, Clock, CheckCircle2, AlertCircle, Pause,
  ArrowUpRight, Calendar, Users
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { 
  mockProjects, mockTasks, mockMilestones, getProjectsSummary 
} from "@/lib/mock-data"

export default function ProjectsPage() {
  const summary = getProjectsSummary()
  const activeProjects = mockProjects.filter(p => p.status === "active")
  const upcomingMilestones = mockMilestones.filter(m => m.status === "pending").slice(0, 5)
  const recentTasks = mockTasks.filter(t => t.status === "in_progress" || t.status === "review").slice(0, 5)

  const stats = [
    {
      title: "Active Projects",
      value: summary.activeProjects.toString(),
      subtitle: `${summary.totalProjects} total`,
      icon: FolderKanban,
      href: "/projects/list",
    },
    {
      title: "Budget Utilization",
      value: `${summary.budgetUtilization}%`,
      subtitle: `${formatCurrency(summary.totalSpent)} of ${formatCurrency(summary.totalBudget)}`,
      icon: ArrowUpRight,
      href: "/projects/list",
    },
    {
      title: "Tasks Completed",
      value: `${summary.taskCompletionRate}%`,
      subtitle: `${summary.completedTasks} of ${summary.totalTasks} tasks`,
      icon: CheckCircle2,
      href: "/projects/tasks",
    },
    {
      title: "Hours This Week",
      value: summary.thisWeekHours.toString(),
      subtitle: `${summary.upcomingMilestones} milestones pending`,
      icon: Clock,
      href: "/projects/time",
    },
  ]

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className?: string }> = {
      planning: { variant: "secondary" },
      active: { variant: "default" },
      on_hold: { variant: "outline", className: "border-yellow-500 text-yellow-500" },
      completed: { variant: "outline", className: "border-green-500 text-green-500" },
      cancelled: { variant: "destructive" },
    }
    const { variant, className } = config[status] || { variant: "secondary" }
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

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage projects, tasks, and track time
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/projects/tasks">
              <CheckCircle2 className="mr-2 h-4 w-4" /> Tasks
            </Link>
          </Button>
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Projects */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Projects</CardTitle>
              <CardDescription>Current projects and their progress</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/projects/list">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeProjects.map((project) => (
              <div key={project.id} className="space-y-3 p-4 rounded-lg border">
                <div className="flex items-start justify-between">
                  <div>
                    <Link href={`/projects/${project.id}`} className="font-semibold text-primary hover:underline">
                      {project.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{project.clientName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(project.priority)}
                    {getStatusBadge(project.status)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Due {formatDate(project.endDate)}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {project.teamMembers.length + 1} members
                    </div>
                  </div>
                  <div className="text-muted-foreground">
                    {formatCurrency(project.spent)} / {formatCurrency(project.budget)}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Milestones */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Upcoming Milestones</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/projects/milestones">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingMilestones.map((milestone) => (
                <div key={milestone.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{milestone.title}</p>
                    <p className="text-xs text-muted-foreground">{milestone.projectName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Due {formatDate(milestone.dueDate)}
                    </p>
                  </div>
                </div>
              ))}
              {upcomingMilestones.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming milestones
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Active Tasks</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/projects/tasks">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {task.assigneeName ? getInitials(task.assigneeName) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.projectName}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize text-xs">
                    {task.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/projects/new">
                  <Plus className="mr-1 h-3 w-3" /> Project
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/projects/tasks/new">
                  <Plus className="mr-1 h-3 w-3" /> Task
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/projects/time/new">
                  <Clock className="mr-1 h-3 w-3" /> Log Time
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/projects/milestones">
                  <Calendar className="mr-1 h-3 w-3" /> Milestones
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
