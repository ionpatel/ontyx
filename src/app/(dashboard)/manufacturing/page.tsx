"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Factory, ClipboardList, Layers, CheckCircle2, Settings2,
  ArrowUpRight, ArrowDownRight, Plus, AlertCircle, Clock
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { cn, formatDate } from "@/lib/utils"
import { 
  mockWorkOrders, mockWorkCenters, mockQualityChecks, mockBOMs,
  getManufacturingSummary 
} from "@/lib/mock-data"

export default function ManufacturingPage() {
  const summary = getManufacturingSummary()
  const recentWorkOrders = mockWorkOrders.slice(0, 5)
  const pendingQC = mockQualityChecks.filter(qc => qc.status === "needs_review" || qc.status === "pending")

  const stats = [
    {
      title: "Active Work Orders",
      value: summary.activeWorkOrders.toString(),
      subtitle: `${summary.plannedWorkOrders} planned`,
      icon: Factory,
      href: "/manufacturing/work-orders",
    },
    {
      title: "Units in Production",
      value: summary.totalUnitsPlanned.toString(),
      subtitle: `${summary.totalUnitsCompleted} completed`,
      icon: Layers,
      href: "/manufacturing/work-orders",
    },
    {
      title: "QC Pending",
      value: summary.pendingQC.toString(),
      subtitle: `${summary.passedQC} passed today`,
      icon: CheckCircle2,
      href: "/manufacturing/quality",
      alert: summary.pendingQC > 0,
    },
    {
      title: "Avg. Utilization",
      value: `${summary.avgUtilization}%`,
      subtitle: `${summary.activeWorkCenters} work centers`,
      icon: Settings2,
      href: "/manufacturing/work-centers",
    },
  ]

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      in_progress: "default",
      planned: "secondary",
      completed: "outline",
      on_hold: "destructive",
      draft: "secondary",
    }
    return (
      <Badge variant={variants[status] || "secondary"} className="capitalize">
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

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manufacturing</h1>
          <p className="text-muted-foreground">
            Manage production, work orders, and quality control
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/manufacturing/bom">
              <Layers className="mr-2 h-4 w-4" /> BOMs
            </Link>
          </Button>
          <Button asChild>
            <Link href="/manufacturing/work-orders/new">
              <Plus className="mr-2 h-4 w-4" /> New Work Order
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
                <stat.icon className={cn("h-4 w-4", stat.alert ? "text-destructive" : "text-muted-foreground")} />
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
        {/* Work Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Work Orders</CardTitle>
              <CardDescription>Current production orders and their progress</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/manufacturing/work-orders">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentWorkOrders.map((wo) => (
                  <TableRow key={wo.id}>
                    <TableCell>
                      <Link href={`/manufacturing/work-orders/${wo.id}`} className="font-medium text-primary hover:underline">
                        {wo.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">{wo.productName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(wo.quantityCompleted / wo.quantity) * 100} 
                          className="w-16 h-2"
                        />
                        <span className="text-xs text-muted-foreground">
                          {wo.quantityCompleted}/{wo.quantity}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(wo.priority)}</TableCell>
                    <TableCell>{getStatusBadge(wo.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QC Alerts */}
          {pendingQC.length > 0 && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-base">QC Reviews Needed</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingQC.slice(0, 3).map((qc) => (
                  <div key={qc.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{qc.checkNumber}</p>
                      <p className="text-xs text-muted-foreground">{qc.productName}</p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                      {qc.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/manufacturing/quality">Review All</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Work Center Utilization */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Work Center Utilization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockWorkCenters.slice(0, 4).map((wc) => (
                <div key={wc.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{wc.name}</span>
                    <span className="text-sm text-muted-foreground">{wc.currentUtilization}%</span>
                  </div>
                  <Progress 
                    value={wc.currentUtilization} 
                    className={cn("h-2", wc.currentUtilization > 85 ? "[&>div]:bg-destructive" : "")}
                  />
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/manufacturing/work-centers">View All</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/manufacturing/work-orders/new">
                  <Plus className="mr-1 h-3 w-3" /> Work Order
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/manufacturing/bom/new">
                  <Plus className="mr-1 h-3 w-3" /> BOM
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/manufacturing/quality/new">
                  <Plus className="mr-1 h-3 w-3" /> QC Check
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/manufacturing/work-centers">
                  <Settings2 className="mr-1 h-3 w-3" /> Centers
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
