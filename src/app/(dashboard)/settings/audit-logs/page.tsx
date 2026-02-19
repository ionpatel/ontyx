"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
  ArrowLeft, Search, Filter, Download, RefreshCw,
  User, FileText, Package, ShoppingCart, Building2,
  Settings, Shield, LogIn, LogOut, UserPlus, Edit,
  Trash2, Eye, Upload, ChevronLeft, ChevronRight,
  Activity, Clock, AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuditLogs, useAuditStats } from "@/hooks/use-audit-logs"
import { cn } from "@/lib/utils"

const actionIcons: Record<string, any> = {
  create: FileText,
  update: Edit,
  delete: Trash2,
  view: Eye,
  export: Download,
  login: LogIn,
  logout: LogOut,
  invite: UserPlus,
  role_change: Shield,
  settings_change: Settings,
}

const actionColors: Record<string, string> = {
  create: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  update: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  delete: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  view: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  export: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  login: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  logout: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  invite: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  role_change: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  settings_change: "bg-primary/10 text-primary",
}

const resourceIcons: Record<string, any> = {
  invoice: FileText,
  product: Package,
  contact: User,
  order: ShoppingCart,
  user: User,
  settings: Settings,
  report: FileText,
  organization: Building2,
  expense: FileText,
  employee: User,
  payroll: FileText,
}

const resourceLabels: Record<string, string> = {
  invoice: 'Invoice',
  product: 'Product',
  contact: 'Contact',
  order: 'Order',
  user: 'User',
  settings: 'Settings',
  report: 'Report',
  organization: 'Organization',
  expense: 'Expense',
  employee: 'Employee',
  payroll: 'Payroll',
}

const PAGE_SIZE = 20

export default function AuditLogsPage() {
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [resourceFilter, setResourceFilter] = useState("all")
  const [page, setPage] = useState(0)

  const { logs, loading, error, totalCount, refetch } = useAuditLogs({
    action: actionFilter,
    entityType: resourceFilter,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })

  const { stats } = useAuditStats()

  // Client-side search filter
  const filteredLogs = logs.filter(log => {
    if (!search) return true
    const q = search.toLowerCase()
    const userName = log.user?.full_name || log.user?.email || ''
    const userEmail = log.user?.email || ''
    const entityId = log.entity_id || ''
    return (
      userName.toLowerCase().includes(q) ||
      userEmail.toLowerCase().includes(q) ||
      entityId.toLowerCase().includes(q) ||
      log.entity_type.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q)
    )
  })

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const handleExport = async () => {
    // Generate CSV
    const headers = ['Timestamp', 'User', 'Action', 'Resource Type', 'Resource ID', 'Details']
    const rows = filteredLogs.map(log => [
      log.created_at,
      log.user?.full_name || log.user?.email || 'Unknown',
      log.action,
      log.entity_type,
      log.entity_id || '',
      JSON.stringify(log.new_values || log.metadata || {}),
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDetails = (log: typeof logs[0]) => {
    const details = log.new_values || log.metadata || {}
    if (Object.keys(details).length === 0) return '—'
    
    // Show a summary of changes
    const entries = Object.entries(details).slice(0, 2)
    return entries.map(([key, value]) => {
      const displayValue = typeof value === 'object' ? JSON.stringify(value).slice(0, 30) : String(value).slice(0, 30)
      return `${key}: ${displayValue}`
    }).join(', ') + (Object.keys(details).length > 2 ? '...' : '')
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground">
              Track all user activity and changes in your organization
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={logs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLogs || totalCount}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayLogs || 0}</div>
            <p className="text-xs text-muted-foreground">Actions today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Common</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {stats?.actionCounts ? Object.entries(stats.actionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—' : '—'}
            </div>
            <p className="text-xs text-muted-foreground">Action type</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Resource</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {stats?.entityCounts ? Object.entries(stats.entityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—' : '—'}
            </div>
            <p className="text-xs text-muted-foreground">Entity type</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, email, or resource ID..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Created</SelectItem>
                <SelectItem value="update">Updated</SelectItem>
                <SelectItem value="delete">Deleted</SelectItem>
                <SelectItem value="view">Viewed</SelectItem>
                <SelectItem value="export">Exported</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="invite">Invited</SelectItem>
                <SelectItem value="role_change">Role Change</SelectItem>
                <SelectItem value="settings_change">Settings</SelectItem>
              </SelectContent>
            </Select>
            <Select value={resourceFilter} onValueChange={(v) => { setResourceFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="invoice">Invoices</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="contact">Contacts</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
                <SelectItem value="report">Reports</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                Activity Log
              </CardTitle>
              <CardDescription>
                {totalCount} total entries
              </CardDescription>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1 || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-3 w-[200px]" />
                  </div>
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No logs found</h3>
              <p className="text-muted-foreground">
                {search || actionFilter !== 'all' || resourceFilter !== 'all'
                  ? 'Try adjusting your filters or search query'
                  : 'Activity will appear here as users interact with the system'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const ActionIcon = actionIcons[log.action] || FileText
                  const ResourceIcon = resourceIcons[log.entity_type] || FileText
                  const userName = log.user?.full_name || log.user?.email || 'System'
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(userName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{userName}</p>
                            {log.user?.email && log.user.email !== userName && (
                              <p className="text-xs text-muted-foreground">{log.user.email}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", actionColors[log.action] || actionColors.view)}>
                          <ActionIcon className="h-3 w-3" />
                          {log.action.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ResourceIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{resourceLabels[log.entity_type] || log.entity_type}</span>
                          {log.entity_id && (
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {log.entity_id.slice(0, 8)}...
                            </code>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="text-xs text-muted-foreground truncate block">
                          {formatDetails(log)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(log.created_at), 'MMM d, yyyy')}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), 'h:mm:ss a')}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
