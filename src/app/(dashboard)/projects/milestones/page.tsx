"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Flag, Search, CheckCircle2, Circle, AlertCircle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { cn, formatDate } from "@/lib/utils"
import { mockMilestones } from "@/lib/mock-data"
import { Milestone } from "@/types/manufacturing"

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>(mockMilestones)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredMilestones = milestones.filter(milestone => {
    const matchesStatus = statusFilter === "all" || milestone.status === statusFilter
    const matchesSearch = milestone.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      milestone.projectName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusIcon = (status: string) => {
    if (status === "achieved") return <CheckCircle2 className="h-5 w-5 text-green-500" />
    if (status === "missed") return <AlertCircle className="h-5 w-5 text-red-500" />
    return <Circle className="h-5 w-5 text-muted-foreground" />
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className?: string }> = {
      pending: { variant: "secondary" },
      achieved: { variant: "outline", className: "border-green-500 text-green-500" },
      missed: { variant: "destructive" },
    }
    const { variant, className } = config[status] || { variant: "secondary" }
    return (
      <Badge variant={variant} className={cn("capitalize", className)}>
        {status}
      </Badge>
    )
  }

  const stats = [
    { title: "Total", value: milestones.length },
    { title: "Pending", value: milestones.filter(m => m.status === "pending").length },
    { title: "Achieved", value: milestones.filter(m => m.status === "achieved").length, color: "text-green-500" },
    { title: "Missed", value: milestones.filter(m => m.status === "missed").length, color: "text-red-500" },
  ]

  // Group milestones by project
  const groupedByProject = filteredMilestones.reduce((acc, milestone) => {
    if (!acc[milestone.projectName]) {
      acc[milestone.projectName] = []
    }
    acc[milestone.projectName].push(milestone)
    return acc
  }, {} as Record<string, Milestone[]>)

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Milestones</h1>
          <p className="text-muted-foreground">
            Track project milestones and deliverables
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/milestones/new">
            <Plus className="mr-2 h-4 w-4" /> New Milestone
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", stat.color)}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search milestones..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="achieved">Achieved</SelectItem>
            <SelectItem value="missed">Missed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Milestones by Project */}
      <div className="space-y-6">
        {Object.entries(groupedByProject).map(([projectName, projectMilestones]) => (
          <Card key={projectName}>
            <CardHeader>
              <CardTitle className="text-lg">{projectName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectMilestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-start gap-4 p-4 rounded-lg border">
                    <div className="mt-0.5">
                      {getStatusIcon(milestone.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold">{milestone.title}</h3>
                          {milestone.description && (
                            <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                          )}
                        </div>
                        {getStatusBadge(milestone.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Due {formatDate(milestone.dueDate)}
                        </div>
                        {milestone.completedDate && (
                          <div className="flex items-center gap-1 text-green-500">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed {formatDate(milestone.completedDate)}
                          </div>
                        )}
                      </div>
                      {milestone.deliverables && milestone.deliverables.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Deliverables:</p>
                          <div className="flex flex-wrap gap-1">
                            {milestone.deliverables.map((d, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {d}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {Object.keys(groupedByProject).length === 0 && (
        <div className="text-center py-12">
          <Flag className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No milestones found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Get started by creating a new milestone
          </p>
          <Button className="mt-4" asChild>
            <Link href="/projects/milestones/new">
              <Plus className="mr-2 h-4 w-4" /> New Milestone
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
