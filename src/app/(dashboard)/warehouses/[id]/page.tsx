"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Edit, Trash2, Building2, MapPin, User, Phone, Mail,
  Package, ArrowRightLeft, CheckCircle, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { mockWarehouses, mockStockTransfers } from "@/lib/mock-data"
import { formatDate } from "@/lib/utils"

export default function WarehouseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const warehouse = mockWarehouses.find(w => w.id === params.id)
  const relatedTransfers = mockStockTransfers.filter(
    t => t.fromWarehouseId === params.id || t.toWarehouseId === params.id
  ).slice(0, 5)

  if (!warehouse) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Warehouse not found</h2>
          <p className="text-muted-foreground">The warehouse you&apos;re looking for doesn&apos;t exist.</p>
          <Button asChild className="mt-4">
            <Link href="/warehouses">Back to Warehouses</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleDelete = () => {
    if (warehouse.isDefault) {
      alert("Cannot delete the default warehouse")
      return
    }
    if (confirm("Are you sure you want to delete this warehouse?")) {
      router.push("/warehouses")
    }
  }

  const utilization = Math.round((warehouse.usedCapacity / warehouse.capacity) * 100)

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/warehouses">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{warehouse.name}</h1>
              {warehouse.isDefault && <Badge variant="secondary">Default</Badge>}
              <Badge variant={warehouse.status === "active" ? "default" : warehouse.status === "maintenance" ? "outline" : "secondary"}>
                {warehouse.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">Code: {warehouse.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/warehouses/${warehouse.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={warehouse.isDefault}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouse.capacity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">units</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used Capacity</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouse.usedCapacity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">units</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${utilization > 90 ? "text-destructive" : utilization > 70 ? "text-orange-500" : "text-teal-500"}`}>
              {utilization}%
            </div>
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full ${utilization > 90 ? "bg-destructive" : utilization > 70 ? "bg-orange-500" : "bg-primary"}`}
                style={{ width: `${utilization}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Zones</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouse.zones.filter(z => z.isActive).length}</div>
            <p className="text-xs text-muted-foreground">of {warehouse.zones.length} total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Warehouse Info */}
        <Card>
          <CardHeader>
            <CardTitle>Warehouse Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{warehouse.address}</p>
                  <p className="text-muted-foreground">{warehouse.city}, {warehouse.country}</p>
                </div>
              </div>
              {warehouse.managerName && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Manager: {warehouse.managerName}</span>
                </div>
              )}
              {warehouse.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{warehouse.phone}</span>
                </div>
              )}
              {warehouse.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{warehouse.email}</span>
                </div>
              )}
            </div>
            <Separator />
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Created: {formatDate(warehouse.createdAt)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Updated: {formatDate(warehouse.updatedAt)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zones */}
        <Card>
          <CardHeader>
            <CardTitle>Zones</CardTitle>
            <CardDescription>Storage zones in this warehouse</CardDescription>
          </CardHeader>
          <CardContent>
            {warehouse.zones.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No zones configured</p>
            ) : (
              <div className="space-y-3">
                {warehouse.zones.map(zone => {
                  const zoneUtil = Math.round((zone.usedCapacity / zone.capacity) * 100)
                  return (
                    <div key={zone.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{zone.name}</span>
                          <Badge variant="outline" className="text-xs">{zone.code}</Badge>
                          <Badge variant="secondary" className="text-xs capitalize">{zone.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {zone.usedCapacity.toLocaleString()} / {zone.capacity.toLocaleString()} units
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`font-medium ${zoneUtil > 90 ? "text-destructive" : zoneUtil > 70 ? "text-orange-500" : "text-teal-500"}`}>
                          {zoneUtil}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transfers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transfers</CardTitle>
            <CardDescription>Stock transfers involving this warehouse</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/warehouses?tab=transfers">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {relatedTransfers.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <ArrowRightLeft className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No transfers found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transfer #</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatedTransfers.map(transfer => (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-mono">
                      <Link href={`/warehouses/transfers/${transfer.id}`} className="hover:underline">
                        {transfer.transferNumber}
                      </Link>
                    </TableCell>
                    <TableCell className={transfer.fromWarehouseId === warehouse.id ? "font-medium" : ""}>
                      {transfer.fromWarehouseName}
                    </TableCell>
                    <TableCell className={transfer.toWarehouseId === warehouse.id ? "font-medium" : ""}>
                      {transfer.toWarehouseName}
                    </TableCell>
                    <TableCell>{transfer.totalQuantity} units</TableCell>
                    <TableCell>{formatDate(transfer.requestedAt)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        transfer.status === "completed" ? "default" :
                        transfer.status === "in_transit" ? "secondary" :
                        transfer.status === "cancelled" ? "destructive" : "outline"
                      }>
                        {transfer.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
