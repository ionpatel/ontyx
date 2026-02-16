"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
  ArrowLeft, Search, Filter, Download, RefreshCw,
  User, FileText, Package, ShoppingCart, Building2,
  Settings, Shield, LogIn, LogOut, UserPlus, Edit,
  Trash2, Eye, Upload
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

// Mock audit logs data
const mockAuditLogs = [
  {
    id: "1",
    user: { name: "John Doe", email: "john@example.com", avatar: "JD" },
    action: "create",
    resource_type: "invoice",
    resource_id: "INV-001",
    details: { amount: 1500, customer: "Acme Corp" },
    ip_address: "192.168.1.100",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    user: { name: "Jane Smith", email: "jane@example.com", avatar: "JS" },
    action: "update",
    resource_type: "product",
    resource_id: "PRD-042",
    details: { field: "price", old_value: 29.99, new_value: 34.99 },
    ip_address: "192.168.1.101",
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "3",
    user: { name: "Mike Johnson", email: "mike@example.com", avatar: "MJ" },
    action: "login",
    resource_type: "user",
    resource_id: null,
    details: { method: "password" },
    ip_address: "10.0.0.55",
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "4",
    user: { name: "Sarah Wilson", email: "sarah@example.com", avatar: "SW" },
    action: "delete",
    resource_type: "contact",
    resource_id: "CNT-089",
    details: { name: "Old Vendor Inc" },
    ip_address: "192.168.1.102",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "5",
    user: { name: "John Doe", email: "john@example.com", avatar: "JD" },
    action: "export",
    resource_type: "report",
    resource_id: "RPT-FIN-2024",
    details: { format: "PDF", records: 1250 },
    ip_address: "192.168.1.100",
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "6",
    user: { name: "Admin User", email: "admin@example.com", avatar: "AU" },
    action: "settings_change",
    resource_type: "settings",
    resource_id: null,
    details: { setting: "tax_rate", old_value: "13%", new_value: "15%" },
    ip_address: "192.168.1.1",
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: "7",
    user: { name: "Admin User", email: "admin@example.com", avatar: "AU" },
    action: "invite",
    resource_type: "user",
    resource_id: "USR-NEW",
    details: { email: "newuser@example.com", role: "member" },
    ip_address: "192.168.1.1",
    created_at: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: "8",
    user: { name: "Jane Smith", email: "jane@example.com", avatar: "JS" },
    action: "role_change",
    resource_type: "user",
    resource_id: "USR-005",
    details: { user: "Mike Johnson", old_role: "member", new_role: "manager" },
    ip_address: "192.168.1.101",
    created_at: new Date(Date.now() - 432000000).toISOString(),
  },
]

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
  create: "bg-success-light text-success",
  update: "bg-info-light text-info",
  delete: "bg-error-light text-error",
  view: "bg-secondary text-text-secondary",
  export: "bg-warning-light text-warning",
  login: "bg-success-light text-success",
  logout: "bg-secondary text-text-secondary",
  invite: "bg-info-light text-info",
  role_change: "bg-warning-light text-warning",
  settings_change: "bg-primary-light text-primary",
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
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState(mockAuditLogs)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [resourceFilter, setResourceFilter] = useState("all")

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user.name.toLowerCase().includes(search.toLowerCase()) ||
      log.user.email.toLowerCase().includes(search.toLowerCase()) ||
      (log.resource_id?.toLowerCase().includes(search.toLowerCase()) || false)
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter
    const matchesResource = resourceFilter === "all" || log.resource_type === resourceFilter
    
    return matchesSearch && matchesAction && matchesResource
  })

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }

  const handleExport = () => {
    // In production, this would generate a CSV/PDF
    alert("Export functionality coming soon!")
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
            <p className="text-text-secondary">
              Track all user activity and changes in your organization
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Search by user, email, or resource ID..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
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
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="invoice">Invoices</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="contact">Contacts</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
                <SelectItem value="report">Reports</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Activity Log
            <Badge variant="secondary" className="ml-2">
              {filteredLogs.length} entries
            </Badge>
          </CardTitle>
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
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const ActionIcon = actionIcons[log.action] || FileText
                  const ResourceIcon = resourceIcons[log.resource_type] || FileText
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">
                            {log.user.avatar}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{log.user.name}</p>
                            <p className="text-xs text-text-muted">{log.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={actionColors[log.action]}>
                          <ActionIcon className="h-3 w-3 mr-1" />
                          {log.action.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ResourceIcon className="h-4 w-4 text-text-muted" />
                          <span className="capitalize">{log.resource_type}</span>
                          {log.resource_id && (
                            <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                              {log.resource_id}
                            </code>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-secondary px-2 py-1 rounded max-w-[200px] truncate block">
                          {JSON.stringify(log.details)}
                        </code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-text-muted">
                          {log.ip_address}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(log.created_at), 'MMM d, yyyy')}</p>
                          <p className="text-xs text-text-muted">
                            {format(new Date(log.created_at), 'h:mm a')}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {filteredLogs.length === 0 && !loading && (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-text-muted mb-4" />
              <h3 className="text-lg font-medium mb-2">No logs found</h3>
              <p className="text-text-secondary">
                Try adjusting your filters or search query
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
