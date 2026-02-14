'use client'

import { use } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Mail, Phone, Calendar, User, Building2,
  Edit, Trash2, CheckCircle, XCircle, Clock, DollarSign,
  MessageSquare, FileText, Target, MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { cn, formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { mockDeals, stageConfig } from '@/lib/mock-data/crm'
import { DealActivity, DealStage } from '@/types/crm'

const activityIcons: Record<DealActivity['type'], React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: CheckCircle,
  note: MessageSquare,
}

const stageOrder: DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

function StageProgress({ currentStage }: { currentStage: DealStage }) {
  const activeIndex = stageOrder.indexOf(currentStage)
  const isWon = currentStage === 'won'
  const isLost = currentStage === 'lost'
  
  return (
    <div className="flex items-center gap-2">
      {stageOrder.slice(0, -2).map((stage, index) => {
        const isActive = index <= activeIndex && !isLost
        const isCurrent = stage === currentStage
        const config = stageConfig[stage]
        
        return (
          <div key={stage} className="flex items-center">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              isActive 
                ? `${config.color} text-white` 
                : "bg-muted text-muted-foreground",
              isCurrent && "ring-2 ring-offset-2 ring-primary"
            )}>
              {config.name}
            </div>
            {index < stageOrder.length - 3 && (
              <div className={cn(
                "w-8 h-0.5 mx-1",
                index < activeIndex && !isLost ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        )
      })}
      {(isWon || isLost) && (
        <>
          <div className="w-8 h-0.5 mx-1 bg-muted" />
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-white",
            isWon ? "bg-green-500" : "bg-red-500"
          )}>
            {isWon ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {isWon ? 'Won' : 'Lost'}
          </div>
        </>
      )}
    </div>
  )
}

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const deal = mockDeals.find(d => d.id === id)

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold">Deal not found</h2>
        <p className="text-muted-foreground mt-2">The deal you're looking for doesn't exist.</p>
        <Link href="/crm">
          <Button className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pipeline
          </Button>
        </Link>
      </div>
    )
  }

  const isOpen = deal.stage !== 'won' && deal.stage !== 'lost'

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
          <h1 className="text-2xl font-bold">{deal.title}</h1>
          <p className="text-muted-foreground">{deal.company || deal.contactName}</p>
        </div>
        <div className="flex gap-2">
          {isOpen && (
            <>
              <Button variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Won
              </Button>
              <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                <XCircle className="h-4 w-4 mr-2" />
                Mark Lost
              </Button>
            </>
          )}
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Stage Progress */}
      <Card>
        <CardContent className="py-4 overflow-x-auto">
          <StageProgress currentStage={deal.stage} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Value */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="text-center">
                  <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-2">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-3xl font-bold">{formatCurrency(deal.value)}</p>
                  <p className="text-sm text-muted-foreground">Deal Value</p>
                </div>
                <div className="text-center">
                  <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-2">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-3xl font-bold">{deal.probability}%</p>
                  <p className="text-sm text-muted-foreground">Win Probability</p>
                </div>
                <div className="text-center">
                  <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-2">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-3xl font-bold">{formatDate(deal.expectedCloseDate, { month: 'short', day: 'numeric' } as Intl.DateTimeFormatOptions)}</p>
                  <p className="text-sm text-muted-foreground">Expected Close</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{getInitials(deal.contactName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{deal.contactName}</p>
                  {deal.company && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {deal.company}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <a href={`mailto:${deal.contactEmail}`} className="text-sm text-primary hover:underline">
                  {deal.contactEmail}
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Activities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Activities</CardTitle>
                <CardDescription>Tasks and interactions</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
              </Button>
            </CardHeader>
            <CardContent>
              {deal.activities.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No activities yet</p>
              ) : (
                <div className="space-y-4">
                  {deal.activities.map((activity) => {
                    const Icon = activityIcons[activity.type]
                    return (
                      <div 
                        key={activity.id} 
                        className={cn(
                          "flex items-start gap-4 p-4 rounded-lg border",
                          activity.completed ? "bg-muted/50" : "bg-card"
                        )}
                      >
                        <div className={cn(
                          "p-2 rounded-full",
                          activity.completed ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={cn(
                              "font-medium",
                              activity.completed && "line-through text-muted-foreground"
                            )}>
                              {activity.title}
                            </p>
                            {activity.completed && (
                              <Badge variant="success" className="text-xs">Completed</Badge>
                            )}
                          </div>
                          {activity.description && (
                            <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{formatDate(activity.date)}</span>
                            <span>{activity.user}</span>
                          </div>
                        </div>
                        {!activity.completed && (
                          <Button variant="ghost" size="sm">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {deal.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{deal.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner */}
          <Card>
            <CardHeader>
              <CardTitle>Deal Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={deal.assignedToAvatar} />
                  <AvatarFallback>{getInitials(deal.assignedToName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{deal.assignedToName}</p>
                  <p className="text-sm text-muted-foreground">Sales Representative</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {deal.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {deal.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(deal.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{formatDate(deal.updatedAt)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Expected Close</span>
                <span>{formatDate(deal.expectedCloseDate)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Phone className="h-4 w-4 mr-2" />
                Log Call
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Create Proposal
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Plus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
