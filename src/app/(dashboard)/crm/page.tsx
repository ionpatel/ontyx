'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Plus, Search, Filter, TrendingUp, DollarSign, Target, 
  Award, BarChart3, Users, Calendar, ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn, formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { getPipelineStages, mockCRMStats, stageConfig } from '@/lib/mock-data/crm'
import { Deal, DealStage } from '@/types/crm'

function StatCard({ title, value, subtitle, icon: Icon, trend, color }: { 
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  trend?: { value: string; positive: boolean }
  color?: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            {trend && (
              <p className={cn(
                "text-xs mt-1 flex items-center gap-1",
                trend.positive ? "text-green-500" : "text-red-500"
              )}>
                <TrendingUp className={cn("h-3 w-3", !trend.positive && "rotate-180")} />
                {trend.value}
              </p>
            )}
          </div>
          <div className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center",
            color || "bg-primary/10"
          )}>
            <Icon className={cn("h-6 w-6", color ? "text-white" : "text-primary")} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DealCard({ deal }: { deal: Deal }) {
  return (
    <Link href={`/crm/${deal.id}`}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium line-clamp-1">{deal.title}</h4>
              <p className="text-sm text-muted-foreground">{deal.company || deal.contactName}</p>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-primary">
                {formatCurrency(deal.value)}
              </span>
              <Badge variant="outline" className="text-xs">
                {deal.probability}%
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={deal.assignedToAvatar} />
                <AvatarFallback className="text-xs">{getInitials(deal.assignedToName)}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{deal.assignedToName}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(deal.expectedCloseDate)}
              </span>
              {deal.tags.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {deal.tags[0]}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function PipelineColumn({ stage, name, color, deals, totalValue }: { 
  stage: DealStage
  name: string
  color: string
  deals: Deal[]
  totalValue: number
}) {
  const isClosedStage = stage === 'won' || stage === 'lost'
  
  return (
    <div className="flex-shrink-0 w-80">
      <div className="bg-muted/50 rounded-lg p-4 h-full">
        {/* Column Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", color)} />
            <h3 className="font-semibold">{name}</h3>
            <Badge variant="outline" className="text-xs">{deals.length}</Badge>
          </div>
          {!isClosedStage && (
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Column Value */}
        <div className="mb-4 text-sm text-muted-foreground">
          {formatCurrency(totalValue)} total
        </div>

        {/* Deal Cards */}
        <div className="space-y-3">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>

        {deals.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No deals in this stage
          </div>
        )}
      </div>
    </div>
  )
}

export default function CRMPage() {
  const [search, setSearch] = useState('')
  const pipelineStages = getPipelineStages()

  // Filter to only show active pipeline stages (not won/lost)
  const activeStages = pipelineStages.filter(s => s.id !== 'won' && s.id !== 'lost')
  const closedStages = pipelineStages.filter(s => s.id === 'won' || s.id === 'lost')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Pipeline</h1>
          <p className="text-muted-foreground">Track deals and opportunities</p>
        </div>
        <div className="flex gap-2">
          <Link href="/crm/leads">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Leads
            </Button>
          </Link>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard 
          title="Pipeline Value" 
          value={formatCurrency(mockCRMStats.pipelineValue)}
          subtitle={`${mockCRMStats.totalDeals} active deals`}
          icon={DollarSign}
        />
        <StatCard 
          title="Won This Quarter" 
          value={formatCurrency(mockCRMStats.wonValue)}
          subtitle={`${mockCRMStats.wonDeals} deals closed`}
          icon={Award}
          trend={{ value: '+23% vs last quarter', positive: true }}
          color="bg-green-500"
        />
        <StatCard 
          title="Conversion Rate" 
          value={`${mockCRMStats.conversionRate}%`}
          icon={Target}
          trend={{ value: '+5% improvement', positive: true }}
        />
        <StatCard 
          title="Avg Deal Size" 
          value={formatCurrency(mockCRMStats.avgDealSize)}
          icon={BarChart3}
        />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Kanban */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {activeStages.map((stage) => (
            <PipelineColumn
              key={stage.id}
              stage={stage.id}
              name={stage.name}
              color={stage.color}
              deals={stage.deals}
              totalValue={stage.totalValue}
            />
          ))}
        </div>
      </div>

      {/* Closed Deals Section */}
      <Card>
        <CardHeader>
          <CardTitle>Closed Deals</CardTitle>
          <CardDescription>Won and lost opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {closedStages.map((stage) => (
              <div key={stage.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                  <h4 className="font-medium">{stage.name}</h4>
                  <Badge variant="outline">{stage.deals.length}</Badge>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {formatCurrency(stage.totalValue)}
                  </span>
                </div>
                <div className="space-y-2">
                  {stage.deals.slice(0, 3).map((deal) => (
                    <Link 
                      key={deal.id} 
                      href={`/crm/${deal.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{deal.title}</p>
                        <p className="text-sm text-muted-foreground">{deal.company}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(deal.value)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(deal.updatedAt)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
