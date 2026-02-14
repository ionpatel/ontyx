"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Clock, Search, MoreHorizontal, Eye, Edit, Calendar, DollarSign } from "lucide-react"
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
import { cn, formatDate, formatCurrency } from "@/lib/utils"
import { mockTimeEntries, getProjectsSummary } from "@/lib/mock-data"
import { TimeEntry } from "@/types/manufacturing"

export default function TimeTrackingPage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(mockTimeEntries)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const summary = getProjectsSummary()

  const filteredEntries = timeEntries.filter(entry => {
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter
    const matchesSearch = entry.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.taskTitle?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const totalHours = timeEntries.reduce((sum, e) => sum + e.hours, 0)
  const billableHours = timeEntries.filter(e => e.billable).reduce((sum, e) => sum + e.hours, 0)
  const totalValue = timeEntries.filter(e => e.billable && e.hourlyRate).reduce((sum, e) => sum + (e.hours * (e.hourlyRate || 0)), 0)
  const pendingApproval = timeEntries.filter(e => e.status === "submitted").length

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className?: string }> = {
      draft: { variant: "secondary" },
      submitted: { variant: "outline", className: "border-blue-500 text-blue-500" },
      approved: { variant: "outline", className: "border-green-500 text-green-500" },
      rejected: { variant: "destructive" },
    }
    const { variant, className } = config[status] || { variant: "secondary" }
    return (
      <Badge variant={variant} className={cn("capitalize", className)}>
        {status}
      </Badge>
    )
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  const stats = [
    { title: "Total Hours", value: totalHours.toString(), icon: Clock },
    { title: "Billable Hours", value: billableHours.toString(), icon: Clock, subtitle: `${Math.round((billableHours/totalHours)*100)}% billable` },
    { title: "Total Value", value: formatCurrency(totalValue), icon: DollarSign },
    { title: "Pending Approval", value: pendingApproval.toString(), icon: Calendar, color: pendingApproval > 0 ? "text-yellow-500" : "" },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time Tracking</h1>
          <p className="text-muted-foreground">
            Track and manage project time entries
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/time/new">
            <Plus className="mr-2 h-4 w-4" /> Log Time
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", stat.color)}>{stat.value}</div>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              )}
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
                  placeholder="Search entries..."
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead>Billable</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{formatDate(entry.date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(entry.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{entry.userName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link href={`/projects/${entry.projectId}`} className="text-primary hover:underline">
                      {entry.projectName}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate">
                    {entry.taskTitle || "-"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {entry.description || "-"}
                  </TableCell>
                  <TableCell className="text-right font-medium">{entry.hours}h</TableCell>
                  <TableCell>
                    {entry.billable ? (
                      <Badge variant="outline" className="border-green-500 text-green-500">Yes</Badge>
                    ) : (
                      <Badge variant="secondary">No</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.billable && entry.hourlyRate 
                      ? formatCurrency(entry.hours * entry.hourlyRate)
                      : "-"
                    }
                  </TableCell>
                  <TableCell>{getStatusBadge(entry.status)}</TableCell>
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
                          <Link href={`/projects/time/${entry.id}/edit`}>
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

          {filteredEntries.length === 0 && (
            <div className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No time entries found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Get started by logging your time
              </p>
              <Button className="mt-4" asChild>
                <Link href="/projects/time/new">
                  <Plus className="mr-2 h-4 w-4" /> Log Time
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
