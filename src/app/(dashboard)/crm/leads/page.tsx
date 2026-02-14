'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Plus, Search, Filter, Star, Mail, Phone,
  Building2, Calendar, ArrowRight, TrendingUp, Users,
  UserPlus, Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, formatDate, getInitials } from '@/lib/utils'
import { mockLeads } from '@/lib/mock-data/crm'
import { Lead, LeadStatus } from '@/types/crm'

const statusConfig: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: 'text-blue-600', bg: 'bg-blue-100' },
  contacted: { label: 'Contacted', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  qualified: { label: 'Qualified', color: 'text-green-600', bg: 'bg-green-100' },
  unqualified: { label: 'Unqualified', color: 'text-gray-600', bg: 'bg-gray-100' },
}

function LeadScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500'
  const stars = Math.ceil(score / 20)
  
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          className={cn(
            "h-3 w-3",
            i < stars ? color : "text-muted"
          )}
          fill={i < stars ? "currentColor" : "none"}
        />
      ))}
      <span className={cn("text-xs ml-1", color)}>{score}</span>
    </div>
  )
}

function LeadCard({ lead }: { lead: Lead }) {
  const status = statusConfig[lead.status]
  
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials(lead.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium">{lead.name}</h4>
              {lead.company && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {lead.company}
                </p>
              )}
            </div>
          </div>
          <Badge className={cn(status.bg, status.color, "border-0")}>
            {status.label}
          </Badge>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span>{lead.email}</span>
          </div>
          {lead.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{lead.phone}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <LeadScoreBadge score={lead.score} />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-muted rounded">{lead.source}</span>
            <span>{formatDate(lead.createdAt)}</span>
          </div>
        </div>

        {lead.assignedTo && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Assigned to: <span className="font-medium text-foreground">{lead.assignedTo}</span>
            </span>
            <Button size="sm" variant="ghost">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function LeadsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')

  const filteredLeads = mockLeads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      lead.company?.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: mockLeads.length,
    new: mockLeads.filter(l => l.status === 'new').length,
    qualified: mockLeads.filter(l => l.status === 'qualified').length,
    avgScore: Math.round(mockLeads.reduce((sum, l) => sum + l.score, 0) / mockLeads.length),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/crm">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Capture and qualify potential customers</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New Leads</p>
                <p className="text-2xl font-bold">{stats.new}</p>
              </div>
              <UserPlus className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Qualified</p>
                <p className="text-2xl font-bold">{stats.qualified}</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Score</p>
                <p className="text-2xl font-bold">{stats.avgScore}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              {Object.entries(statusConfig).map(([key, config]) => (
                <Button
                  key={key}
                  variant={statusFilter === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(key as LeadStatus)}
                >
                  {config.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredLeads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No leads found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
