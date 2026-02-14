"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Settings2, Search, MoreHorizontal, Edit, Power, PowerOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { cn, formatCurrency } from "@/lib/utils"
import { mockWorkCenters } from "@/lib/mock-data"
import { WorkCenter } from "@/types/manufacturing"

export default function WorkCentersPage() {
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>(mockWorkCenters)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCenters = workCenters.filter(wc => 
    wc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wc.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleActive = (id: string) => {
    setWorkCenters(prev => prev.map(wc => 
      wc.id === id ? { ...wc, isActive: !wc.isActive } : wc
    ))
  }

  const totalCapacity = workCenters.filter(w => w.isActive).reduce((sum, wc) => sum + wc.capacityPerHour, 0)
  const avgUtilization = Math.round(workCenters.reduce((sum, wc) => sum + wc.currentUtilization, 0) / workCenters.length)
  const totalHourlyCost = workCenters.filter(w => w.isActive).reduce((sum, wc) => sum + wc.costPerHour, 0)

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Centers</h1>
          <p className="text-muted-foreground">
            Manage production work centers and capacity
          </p>
        </div>
        <Button asChild>
          <Link href="/manufacturing/work-centers/new">
            <Plus className="mr-2 h-4 w-4" /> New Work Center
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Centers</CardTitle>
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workCenters.length}</div>
            <p className="text-xs text-muted-foreground">{workCenters.filter(w => w.isActive).length} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapacity}</div>
            <p className="text-xs text-muted-foreground">units/hour</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Utilization</CardTitle>
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", avgUtilization > 80 ? "text-destructive" : "")}>{avgUtilization}%</div>
            <Progress value={avgUtilization} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hourly Cost</CardTitle>
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalHourlyCost)}</div>
            <p className="text-xs text-muted-foreground">per hour</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search work centers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Work Centers Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCenters.map((wc) => (
          <Card key={wc.id} className={cn(!wc.isActive && "opacity-60")}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{wc.name}</CardTitle>
                  <Badge variant={wc.isActive ? "default" : "secondary"}>
                    {wc.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription className="mt-1">
                  <span className="font-mono">{wc.code}</span>
                  {wc.description && ` • ${wc.description}`}
                </CardDescription>
              </div>
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
                    <Link href={`/manufacturing/work-centers/${wc.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleActive(wc.id)}>
                    {wc.isActive ? (
                      <>
                        <PowerOff className="mr-2 h-4 w-4" /> Deactivate
                      </>
                    ) : (
                      <>
                        <Power className="mr-2 h-4 w-4" /> Activate
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Utilization</span>
                  <span className={cn("font-medium", wc.currentUtilization > 85 ? "text-destructive" : "")}>
                    {wc.currentUtilization}%
                  </span>
                </div>
                <Progress 
                  value={wc.currentUtilization} 
                  className={cn("h-2", wc.currentUtilization > 85 ? "[&>div]:bg-destructive" : "")}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Capacity</p>
                  <p className="font-medium">{wc.capacityPerHour} units/hr</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cost</p>
                  <p className="font-medium">{formatCurrency(wc.costPerHour)}/hr</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCenters.length === 0 && (
        <div className="text-center py-12">
          <Settings2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No work centers found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Get started by creating a new work center
          </p>
          <Button className="mt-4" asChild>
            <Link href="/manufacturing/work-centers/new">
              <Plus className="mr-2 h-4 w-4" /> New Work Center
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
