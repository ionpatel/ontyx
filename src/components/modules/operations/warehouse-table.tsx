"use client"

import { useState } from "react"
import Link from "next/link"
import {
  MoreHorizontal, Search, Building2, Edit, Eye, Trash2,
  MapPin, User, CheckCircle, XCircle, Wrench
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Warehouse, WarehouseStatus } from "@/types/operations"

interface WarehouseTableProps {
  warehouses: Warehouse[]
  onDelete?: (id: string) => void
}

const statusConfig: Record<WarehouseStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ComponentType<{ className?: string }> }> = {
  active: { label: "Active", variant: "default", icon: CheckCircle },
  inactive: { label: "Inactive", variant: "secondary", icon: XCircle },
  maintenance: { label: "Maintenance", variant: "outline", icon: Wrench },
}

export function WarehouseTable({ warehouses, onDelete }: WarehouseTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredWarehouses = warehouses.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.code.toLowerCase().includes(search.toLowerCase()) ||
      w.city.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || w.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search warehouses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Zones</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWarehouses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No warehouses found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredWarehouses.map((warehouse) => {
                const status = statusConfig[warehouse.status]
                const utilization = Math.round((warehouse.usedCapacity / warehouse.capacity) * 100)
                return (
                  <TableRow key={warehouse.id}>
                    <TableCell className="font-mono font-medium">{warehouse.code}</TableCell>
                    <TableCell>
                      <Link href={`/warehouses/${warehouse.id}`} className="hover:underline font-medium">
                        {warehouse.name}
                      </Link>
                      {warehouse.isDefault && (
                        <Badge variant="secondary" className="ml-2 text-xs">Default</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {warehouse.city}, {warehouse.country}
                      </div>
                    </TableCell>
                    <TableCell>
                      {warehouse.managerName ? (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {warehouse.managerName}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{warehouse.usedCapacity.toLocaleString()}</span>
                          <span className="text-muted-foreground">/ {warehouse.capacity.toLocaleString()}</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${utilization > 90 ? "bg-destructive" : utilization > 70 ? "bg-orange-500" : "bg-primary"}`}
                            style={{ width: `${utilization}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{utilization}% used</span>
                      </div>
                    </TableCell>
                    <TableCell>{warehouse.zones.length}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/warehouses/${warehouse.id}`}>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/warehouses/${warehouse.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete?.(warehouse.id)}
                            className="text-destructive"
                            disabled={warehouse.isDefault}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
