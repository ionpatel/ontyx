"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, CheckCircle2, Search, MoreHorizontal, Eye, Edit, XCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { mockQualityChecks } from "@/lib/mock-data"
import { QualityCheck, QCStatus } from "@/types/manufacturing"

export default function QualityPage() {
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>(mockQualityChecks)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredChecks = qualityChecks.filter(qc => {
    const matchesStatus = statusFilter === "all" || qc.status === statusFilter
    const matchesSearch = qc.checkNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qc.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qc.workOrderNumber.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusBadge = (status: QCStatus) => {
    const config: Record<QCStatus, { variant: "default" | "secondary" | "destructive" | "outline", icon: React.ReactNode, className?: string }> = {
      pending: { variant: "secondary", icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
      passed: { variant: "outline", icon: <CheckCircle2 className="h-3 w-3 mr-1" />, className: "border-green-500 text-green-500" },
      failed: { variant: "destructive", icon: <XCircle className="h-3 w-3 mr-1" /> },
      needs_review: { variant: "outline", icon: <AlertTriangle className="h-3 w-3 mr-1" />, className: "border-yellow-500 text-yellow-500" },
    }
    const { variant, icon, className } = config[status]
    return (
      <Badge variant={variant} className={cn("capitalize flex items-center w-fit", className)}>
        {icon}
        {status.replace("_", " ")}
      </Badge>
    )
  }

  const getResultBadge = (result: string) => {
    if (result === "pass") return <Badge variant="outline" className="border-green-500 text-green-500">Pass</Badge>
    if (result === "fail") return <Badge variant="destructive">Fail</Badge>
    return <Badge variant="secondary">Pending</Badge>
  }

  const stats = [
    { title: "Total Checks", value: qualityChecks.length, icon: CheckCircle2 },
    { title: "Passed", value: qualityChecks.filter(q => q.status === "passed").length, color: "text-green-500" },
    { title: "Failed", value: qualityChecks.filter(q => q.status === "failed").length, color: "text-destructive" },
    { title: "Needs Review", value: qualityChecks.filter(q => q.status === "needs_review" || q.status === "pending").length, color: "text-yellow-500" },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quality Control</h1>
          <p className="text-muted-foreground">
            Manage quality inspections and track results
          </p>
        </div>
        <Button asChild>
          <Link href="/manufacturing/quality/new">
            <Plus className="mr-2 h-4 w-4" /> New QC Check
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
                  placeholder="Search checks..."
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
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="needs_review">Needs Review</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Check #</TableHead>
                <TableHead>Work Order</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChecks.map((qc) => (
                <TableRow key={qc.id}>
                  <TableCell>
                    <Link href={`/manufacturing/quality/${qc.id}`} className="font-medium text-primary hover:underline">
                      {qc.checkNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/manufacturing/work-orders/${qc.workOrderId}`} className="text-muted-foreground hover:text-primary hover:underline">
                      {qc.workOrderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">{qc.productName}</TableCell>
                  <TableCell>{qc.batchNumber || "-"}</TableCell>
                  <TableCell>{qc.inspectorName}</TableCell>
                  <TableCell>{formatDate(qc.inspectionDate)}</TableCell>
                  <TableCell>{getResultBadge(qc.overallResult)}</TableCell>
                  <TableCell>{getStatusBadge(qc.status)}</TableCell>
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
                          <Link href={`/manufacturing/quality/${qc.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/manufacturing/quality/${qc.id}/edit`}>
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

          {filteredChecks.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No quality checks found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Get started by creating a new quality check
              </p>
              <Button className="mt-4" asChild>
                <Link href="/manufacturing/quality/new">
                  <Plus className="mr-2 h-4 w-4" /> New QC Check
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
