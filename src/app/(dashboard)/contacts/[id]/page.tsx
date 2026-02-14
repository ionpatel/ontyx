'use client'

import { use } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Mail, Phone, Globe, MapPin, Edit, Trash2,
  Building2, User, Calendar, Clock, MessageSquare, FileText,
  CreditCard, ShoppingCart, MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { cn, formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { mockContacts } from '@/lib/mock-data/contacts'
import { ContactActivity } from '@/types/contacts'

const activityIcons: Record<ContactActivity['type'], React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: MessageSquare,
  invoice: FileText,
  payment: CreditCard,
  order: ShoppingCart,
}

const activityColors: Record<ContactActivity['type'], string> = {
  call: 'bg-blue-500',
  email: 'bg-green-500',
  meeting: 'bg-purple-500',
  note: 'bg-yellow-500',
  invoice: 'bg-orange-500',
  payment: 'bg-emerald-500',
  order: 'bg-pink-500',
}

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const contact = mockContacts.find(c => c.id === id)

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold">Contact not found</h2>
        <p className="text-muted-foreground mt-2">The contact you're looking for doesn't exist.</p>
        <Link href="/contacts">
          <Button className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contacts
          </Button>
        </Link>
      </div>
    )
  }

  const primaryAddress = contact.addresses.find(a => a.isPrimary) || contact.addresses[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/contacts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              <AvatarImage src={contact.avatar} />
              <AvatarFallback className="text-lg">{getInitials(contact.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{contact.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={contact.type === 'customer' ? 'success' : contact.type === 'vendor' ? 'default' : 'secondary'}>
                  {contact.type.charAt(0).toUpperCase() + contact.type.slice(1)}
                </Badge>
                <Badge variant="outline">
                  {contact.category === 'company' ? <Building2 className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                  {contact.category.charAt(0).toUpperCase() + contact.category.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Contact Details */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                      {contact.email}
                    </a>
                  </div>
                </div>
                {contact.phone && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                        {contact.phone}
                      </a>
                    </div>
                  </div>
                )}
                {contact.website && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {contact.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}
                {primaryAddress && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p>{primaryAddress.line1}</p>
                      <p className="text-sm text-muted-foreground">
                        {primaryAddress.city}, {primaryAddress.state} {primaryAddress.postalCode}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {contact.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Notes</p>
                    <p>{contact.notes}</p>
                  </div>
                </>
              )}

              {contact.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {contact.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Recent interactions with this contact</CardDescription>
            </CardHeader>
            <CardContent>
              {contact.activities.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No activities yet</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-6">
                    {contact.activities.map((activity) => {
                      const Icon = activityIcons[activity.type]
                      return (
                        <div key={activity.id} className="relative flex items-start gap-4 pl-10">
                          <div className={cn(
                            'absolute left-2 p-1.5 rounded-full text-white',
                            activityColors[activity.type]
                          )}>
                            <Icon className="h-3 w-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{activity.title}</p>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(activity.date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {activity.user}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          {contact.type !== 'vendor' && (
            <Card>
              <CardHeader>
                <CardTitle>Revenue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">{formatCurrency(contact.totalRevenue)}</p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{contact.totalOrders}</p>
                    <p className="text-sm text-muted-foreground">Orders</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {contact.totalOrders > 0 
                        ? formatCurrency(contact.totalRevenue / contact.totalOrders).replace('$', '')
                        : '0'
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">Avg. Order</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                Create Invoice
              </Button>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(contact.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{formatDate(contact.updatedAt)}</span>
              </div>
              {contact.lastContactedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Contacted</span>
                  <span>{formatDate(contact.lastContactedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
