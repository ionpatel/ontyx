'use client'

import Link from 'next/link'
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn, getInitials } from '@/lib/utils'
import { mockOrgChart, mockDepartments } from '@/lib/mock-data/employees'
import { OrgNode } from '@/types/employees'

const departmentColors: Record<string, string> = {
  'Executive': 'border-slate-500 bg-slate-500/10',
  'Engineering': 'border-blue-500 bg-blue-500/10',
  'Sales': 'border-green-500 bg-green-500/10',
  'Marketing': 'border-purple-500 bg-purple-500/10',
  'Human Resources': 'border-yellow-500 bg-yellow-500/10',
  'Finance': 'border-red-500 bg-red-500/10',
  'Operations': 'border-orange-500 bg-orange-500/10',
}

function OrgNodeCard({ node, isRoot = false }: { node: OrgNode; isRoot?: boolean }) {
  const colorClass = departmentColors[node.department] || 'border-gray-500 bg-gray-500/10'
  
  return (
    <div className="flex flex-col items-center">
      <Link href={`/employees/${node.id}`}>
        <div className={cn(
          "p-4 rounded-lg border-2 hover:shadow-lg transition-all cursor-pointer min-w-[180px]",
          colorClass,
          isRoot && "border-4"
        )}>
          <div className="flex flex-col items-center text-center">
            <Avatar className={cn("border-2 border-white shadow", isRoot ? "h-16 w-16" : "h-12 w-12")}>
              <AvatarImage src={node.avatar} />
              <AvatarFallback className={isRoot ? "text-lg" : "text-sm"}>
                {getInitials(node.name)}
              </AvatarFallback>
            </Avatar>
            <h4 className={cn("font-semibold mt-2", isRoot ? "text-base" : "text-sm")}>
              {node.name}
            </h4>
            <p className="text-xs text-muted-foreground">{node.title}</p>
            <span className="text-xs mt-1 px-2 py-0.5 rounded-full bg-muted">
              {node.department}
            </span>
          </div>
        </div>
      </Link>
      
      {node.children && node.children.length > 0 && (
        <>
          {/* Vertical connector */}
          <div className="w-px h-6 bg-border" />
          
          {/* Horizontal connector */}
          {node.children.length > 1 && (
            <div 
              className="h-px bg-border" 
              style={{ 
                width: `${Math.min(node.children.length * 200, 1000)}px` 
              }} 
            />
          )}
          
          {/* Children */}
          <div className="flex gap-8 pt-6">
            {node.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                {node.children && node.children.length > 1 && (
                  <div className="w-px h-6 bg-border -mt-6" />
                )}
                <OrgNodeCard node={child} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function OrgChartPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/employees">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Organization Chart</h1>
            <p className="text-muted-foreground">Company structure and reporting lines</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Department Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {Object.entries(departmentColors).map(([dept, color]) => (
              <div key={dept} className="flex items-center gap-2">
                <div className={cn("w-4 h-4 rounded border-2", color)} />
                <span className="text-sm">{dept}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Org Chart */}
      <Card className="overflow-x-auto">
        <CardContent className="pt-8 pb-8 min-w-fit">
          <div className="flex justify-center">
            <OrgNodeCard node={mockOrgChart} isRoot />
          </div>
        </CardContent>
      </Card>

      {/* Department Summary */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {mockDepartments.map((dept) => (
          <Card key={dept.id}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={cn("w-4 h-4 rounded-full", dept.color)} />
                <div>
                  <p className="font-medium text-sm">{dept.name}</p>
                  <p className="text-xs text-muted-foreground">{dept.employeeCount} employees</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
