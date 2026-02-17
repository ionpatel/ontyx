'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Plus, Search, Target, DollarSign, TrendingUp, 
  Users, ArrowRight, MoreHorizontal, Eye, UserPlus, Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { 
  useLeads, 
  useOpportunities, 
  usePipelineStages,
  useCRMSummary,
  useDeleteLead,
  useConvertLead,
  useUpdateOpportunity
} from '@/hooks/use-crm'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { LeadStatus, Opportunity } from '@/types/crm'
import { useToast } from '@/components/ui/toast'

const leadStatusConfig: Record<LeadStatus, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700' },
  contacted: { label: 'Contacted', color: 'bg-yellow-100 text-yellow-700' },
  qualified: { label: 'Qualified', color: 'bg-green-100 text-green-700' },
  unqualified: { label: 'Unqualified', color: 'bg-gray-100 text-gray-700' },
  converted: { label: 'Converted', color: 'bg-purple-100 text-purple-700' }
}

export default function CRMPage() {
  const router = useRouter()
  const toast = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('pipeline')
  
  const { data: leads = [], isLoading: leadsLoading } = useLeads()
  const { data: opportunities = [], isLoading: oppsLoading } = useOpportunities()
  const { data: stages = [] } = usePipelineStages()
  const { data: summary } = useCRMSummary()
  const deleteLeadMutation = useDeleteLead()
  const convertLeadMutation = useConvertLead()
  const updateOppMutation = useUpdateOpportunity()
  
  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const searchLower = searchQuery.toLowerCase()
    return (
      lead.first_name?.toLowerCase().includes(searchLower) ||
      lead.last_name?.toLowerCase().includes(searchLower) ||
      lead.email?.toLowerCase().includes(searchLower) ||
      lead.company_name?.toLowerCase().includes(searchLower)
    )
  }).filter(l => l.status !== 'converted')
  
  // Group opportunities by stage for pipeline view
  const pipelineData = stages.map(stage => ({
    stage,
    opportunities: opportunities.filter(o => o.stage_id === stage.id && o.status === 'open')
  }))
  
  const handleDeleteLead = async (id: string) => {
    if (!confirm('Delete this lead?')) return
    try {
      await deleteLeadMutation.mutateAsync(id)
      toast.success('Lead deleted')
    } catch (error) {
      toast.error('Failed to delete lead')
    }
  }
  
  const handleConvertLead = async (id: string) => {
    try {
      await convertLeadMutation.mutateAsync({ leadId: id, createOpportunity: true })
      toast.success('Lead converted to contact and opportunity')
    } catch (error) {
      toast.error('Failed to convert lead')
    }
  }
  
  const handleMoveOpportunity = async (oppId: string, stageId: string) => {
    try {
      await updateOppMutation.mutateAsync({ id: oppId, input: { stage_id: stageId } })
      toast.success('Opportunity moved')
    } catch (error) {
      toast.error('Failed to move opportunity')
    }
  }
  
  const stats = [
    {
      title: 'Total Leads',
      value: summary?.total_leads || 0,
      subtitle: `${summary?.new_leads || 0} new`,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Pipeline Value',
      value: formatCurrency(summary?.pipeline_value || 0, 'CAD'),
      subtitle: `${summary?.open_opportunities || 0} open deals`,
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Won This Month',
      value: formatCurrency(summary?.won_this_month || 0, 'CAD'),
      icon: TrendingUp,
      color: 'text-emerald-600'
    },
    {
      title: 'Conversion Rate',
      value: `${summary?.conversion_rate || 0}%`,
      subtitle: 'leads to customers',
      icon: Target,
      color: 'text-purple-600'
    }
  ]
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground">
            Manage leads and sales pipeline
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/crm/leads/new">
              <UserPlus className="mr-2 h-4 w-4" />
              New Lead
            </Link>
          </Button>
          <Button asChild>
            <Link href="/crm/opportunities/new">
              <Plus className="mr-2 h-4 w-4" />
              New Opportunity
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          </TabsList>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        {/* Pipeline View */}
        <TabsContent value="pipeline" className="mt-6">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {pipelineData.map(({ stage, opportunities: stageOpps }) => (
              <div 
                key={stage.id} 
                className="flex-shrink-0 w-72 bg-muted/50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="font-semibold">{stage.name}</h3>
                  </div>
                  <Badge variant="secondary">{stageOpps.length}</Badge>
                </div>
                <div className="space-y-3">
                  {stageOpps.map((opp) => (
                    <Card 
                      key={opp.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => router.push(`/crm/opportunities/${opp.id}`)}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-medium truncate">{opp.name}</h4>
                        {opp.contact && (
                          <p className="text-sm text-muted-foreground truncate">
                            {opp.contact.display_name}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-semibold text-green-600">
                            {opp.amount ? formatCurrency(opp.amount, opp.currency) : '—'}
                          </span>
                          {opp.expected_close && (
                            <span className="text-xs text-muted-foreground">
                              {formatDate(opp.expected_close)}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {stageOpps.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No opportunities
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        {/* Leads List */}
        <TabsContent value="leads" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No leads found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => {
                      const status = leadStatusConfig[lead.status]
                      return (
                        <TableRow 
                          key={lead.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => router.push(`/crm/leads/${lead.id}`)}
                        >
                          <TableCell className="font-medium">
                            {lead.first_name} {lead.last_name}
                          </TableCell>
                          <TableCell>{lead.company_name || '—'}</TableCell>
                          <TableCell>{lead.email || '—'}</TableCell>
                          <TableCell>{lead.source || '—'}</TableCell>
                          <TableCell>
                            <Badge className={cn("font-normal", status.color)}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{lead.score}</Badge>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/crm/leads/${lead.id}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {lead.status === 'qualified' && (
                                  <DropdownMenuItem onClick={() => handleConvertLead(lead.id)}>
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                    Convert to Customer
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteLead(lead.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
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
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Opportunities List */}
        <TabsContent value="opportunities" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Opportunity</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Close Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {oppsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : opportunities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No opportunities found
                      </TableCell>
                    </TableRow>
                  ) : (
                    opportunities.map((opp) => (
                      <TableRow 
                        key={opp.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/crm/opportunities/${opp.id}`)}
                      >
                        <TableCell className="font-medium">{opp.name}</TableCell>
                        <TableCell>{opp.contact?.display_name || '—'}</TableCell>
                        <TableCell>
                          {opp.stage && (
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: opp.stage.color }}
                              />
                              {opp.stage.name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {opp.expected_close ? formatDate(opp.expected_close) : '—'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {opp.amount ? formatCurrency(opp.amount, opp.currency) : '—'}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/crm/opportunities/${opp.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
