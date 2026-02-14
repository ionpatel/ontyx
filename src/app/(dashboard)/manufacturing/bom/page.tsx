"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Layers, Search, MoreHorizontal, Eye, Edit, Trash2, Copy } from "lucide-react"
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
import { cn, formatDate, formatCurrency } from "@/lib/utils"
import { mockBOMs } from "@/lib/mock-data"
import { BillOfMaterials } from "@/types/manufacturing"

export default function BOMPage() {
  const [boms, setBOMs] = useState<BillOfMaterials[]>(mockBOMs)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredBOMs = boms.filter(bom => {
    const matchesStatus = statusFilter === "all" || bom.status === statusFilter
    const matchesSearch = bom.bomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bom.productName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this BOM?")) {
      setBOMs(prev => prev.filter(bom => bom.id !== id))
    }
  }

  const handleDuplicate = (id: string) => {
    const original = boms.find(bom => bom.id === id)
    if (original) {
      const duplicated: BillOfMaterials = {
        ...original,
        id: crypto.randomUUID(),
        bomNumber: `${original.bomNumber}-COPY`,
        status: "draft",
        version: "1.0",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setBOMs(prev => [duplicated, ...prev])
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className?: string }> = {
      draft: { variant: "secondary" },
      active: { variant: "default" },
      obsolete: { variant: "outline", className: "text-muted-foreground line-through" },
    }
    const { variant, className } = config[status] || { variant: "secondary" }
    return (
      <Badge variant={variant} className={cn("capitalize", className)}>
        {status}
      </Badge>
    )
  }

  const stats = [
    { title: "Total BOMs", value: boms.length },
    { title: "Active", value: boms.filter(b => b.status === "active").length },
    { title: "Draft", value: boms.filter(b => b.status === "draft").length },
    { title: "Obsolete", value: boms.filter(b => b.status === "obsolete").length },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bill of Materials</h1>
          <p className="text-muted-foreground">
            Manage product BOMs and component specifications
          </p>
        </div>
        <Button asChild>
          <Link href="/manufacturing/bom/new">
            <Plus className="mr-2 h-4 w-4" /> New BOM
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
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
                  placeholder="Search BOMs..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="obsolete">Obsolete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>BOM #</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Components</TableHead>
                <TableHead className="text-right">Material Cost</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBOMs.map((bom) => (
                <TableRow key={bom.id}>
                  <TableCell>
                    <Link href={`/manufacturing/bom/${bom.id}`} className="font-medium text-primary hover:underline">
                      {bom.bomNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{bom.productName}</TableCell>
                  <TableCell className="font-mono text-sm">{bom.productSku}</TableCell>
                  <TableCell>
                    <Badge variant="outline">v{bom.version}</Badge>
                  </TableCell>
                  <TableCell>{bom.items.length} items</TableCell>
                  <TableCell className="text-right">{formatCurrency(bom.totalCost)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(bom.totalProductionCost)}</TableCell>
                  <TableCell>{getStatusBadge(bom.status)}</TableCell>
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
                          <Link href={`/manufacturing/bom/${bom.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/manufacturing/bom/${bom.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(bom.id)}>
                          <Copy className="mr-2 h-4 w-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(bom.id)}
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

          {filteredBOMs.length === 0 && (
            <div className="text-center py-12">
              <Layers className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No BOMs found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Get started by creating a new bill of materials
              </p>
              <Button className="mt-4" asChild>
                <Link href="/manufacturing/bom/new">
                  <Plus className="mr-2 h-4 w-4" /> New BOM
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
