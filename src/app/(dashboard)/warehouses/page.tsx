"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Building2, ArrowRightLeft, Package, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WarehouseTable } from "@/components/modules/operations/warehouse-table"
import { TransferTable } from "@/components/modules/operations/transfer-table"
import { mockWarehouses, mockStockTransfers, getWarehouseSummary } from "@/lib/mock-data"
import { Warehouse, StockTransfer, TransferStatus } from "@/types/operations"

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(mockWarehouses)
  const [transfers, setTransfers] = useState<StockTransfer[]>(mockStockTransfers)
  const summary = getWarehouseSummary()

  const handleDeleteWarehouse = (id: string) => {
    const wh = warehouses.find(w => w.id === id)
    if (wh?.isDefault) {
      alert("Cannot delete the default warehouse")
      return
    }
    if (confirm("Are you sure you want to delete this warehouse?")) {
      setWarehouses(prev => prev.filter(w => w.id !== id))
    }
  }

  const handleApproveTransfer = (id: string) => {
    setTransfers(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              status: "in_transit" as TransferStatus,
              approvedBy: "Current User",
              approvedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    )
  }

  const handleCompleteTransfer = (id: string) => {
    setTransfers(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              status: "completed" as TransferStatus,
              completedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    )
  }

  const handleCancelTransfer = (id: string) => {
    if (confirm("Are you sure you want to cancel this transfer?")) {
      setTransfers(prev =>
        prev.map(t =>
          t.id === id
            ? { ...t, status: "cancelled" as TransferStatus, updatedAt: new Date().toISOString() }
            : t
        )
      )
    }
  }

  const stats = [
    {
      title: "Active Warehouses",
      value: summary.totalWarehouses.toString(),
      icon: Building2,
      description: `${warehouses.length} total locations`,
    },
    {
      title: "Total Capacity",
      value: summary.totalCapacity.toLocaleString(),
      icon: Package,
      description: `${summary.usedCapacity.toLocaleString()} used`,
    },
    {
      title: "Utilization Rate",
      value: `${summary.utilizationRate}%`,
      icon: TrendingUp,
      description: "Across all warehouses",
      className: summary.utilizationRate > 90 ? "text-destructive" : summary.utilizationRate > 70 ? "text-orange-500" : "text-teal-500",
    },
    {
      title: "Pending Transfers",
      value: transfers.filter(t => t.status === "pending" || t.status === "in_transit").length.toString(),
      icon: ArrowRightLeft,
      description: `${transfers.filter(t => t.status === "in_transit").length} in transit`,
    },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warehouses</h1>
          <p className="text-muted-foreground">
            Manage your warehouse locations and stock transfers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/warehouses/transfers/new">
              <ArrowRightLeft className="mr-2 h-4 w-4" /> New Transfer
            </Link>
          </Button>
          <Button asChild>
            <Link href="/warehouses/new">
              <Plus className="mr-2 h-4 w-4" /> Add Warehouse
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.className || ""}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="warehouses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
          <TabsTrigger value="transfers">Stock Transfers</TabsTrigger>
        </TabsList>

        <TabsContent value="warehouses">
          <Card>
            <CardContent className="pt-6">
              <WarehouseTable
                warehouses={warehouses}
                onDelete={handleDeleteWarehouse}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers">
          <Card>
            <CardContent className="pt-6">
              <TransferTable
                transfers={transfers}
                onApprove={handleApproveTransfer}
                onComplete={handleCompleteTransfer}
                onCancel={handleCancelTransfer}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
