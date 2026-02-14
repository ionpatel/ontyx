"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Factory, Filter, Search, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
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
import { mockWorkOrders, getManufacturingSummary } from "@/lib/mock-data"
import { WorkOrder, WorkOrderStatus } from "@/types/manufacturing"

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(mockWorkOrders)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const summary = getManufacturingSummary()

  const filteredOrders = workOrders.filter(wo => {
    const matchesStatus = statusFilter === "all" || wo.status === statusFilter
    const matchesSearch = wo.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.productName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this work order?")) {
      setWorkOrders(prev => prev.filter(wo => wo.id !== id))
    }
  }

  const getStatusBadge = (status: WorkOrderStatus) => {
    const config: Record<WorkOrderStatus, { variant: "default" | "secondary" | "destructive" | "outline", className?: string }> = {
      draft: { variant: "secondary" },
      planned: { variant: "outline", className: "border-blue-500 text-blue-500" },
      in_progress: { variant: "default" },
      on_hold: { variant: "destructive" },
      completed: { variant: "outline", className: "border-green-500 text-green-500" },
      cancelled: { variant: "secondary", className: "line-through" },
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

  const stats = [
    { title: "In Progress", value: summary.activeWorkOrders, color: "text-primary" },
    { title: "Planned", value: summary.plannedWorkOrders, color: "text-blue-500" },
    { title: "Completed", value: summary.completedWorkOrders, color: "text-green-500" },
    { title: "On Hold", value: summary.onHoldWorkOrders, color: "text-destructive" },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Orders</h1>
          <p className="text-muted-foreground">
            Manage production work orders and track progress
          </p>
        </div>
        <Button asChild>
          <Link href="/manufacturing/work-orders/new">
            <Plus className="mr-2 h-4 w-4" /> New Work Order
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Factory className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", stat.color)}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Est. Cost</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((wo) => (
                <TableRow key={wo.id}>
                  <TableCell>
                    <Link href={`/manufacturing/work-orders/${wo.id}`} className="font-medium text-primary hover:underline">
                      {wo.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{wo.productName}</TableCell>
                  <TableCell>{wo.quantity}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(wo.quantityCompleted / wo.quantity) * 100} 
                        className="w-20 h-2"
                      />
                      <span className="text-xs text-muted-foreground min-w-[50px]">
                        {wo.quantityCompleted}/{wo.quantity}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getPriorityBadge(wo.priority)}</TableCell>
                  <TableCell>{formatDate(wo.plannedEndDate)}</TableCell>
                  <TableCell>{getStatusBadge(wo.status)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(wo.estimatedCost)}</TableCell>
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
                          <Link href={`/manufacturing/work-orders/${wo.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/manufacturing/work-orders/${wo.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(wo.id)}
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

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Factory className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No work orders found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your filters"
                  : "Get started by creating a new work order"}
              </p>
              <Button className="mt-4" asChild>
                <Link href="/manufacturing/work-orders/new">
                  <Plus className="mr-2 h-4 w-4" /> New Work Order
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
