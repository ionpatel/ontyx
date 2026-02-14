'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Search, Plus, Filter, Building2, User, Phone, Mail, 
  MoreHorizontal, Tag, ArrowUpRight, Users, TrendingUp, UserPlus 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn, formatCurrency, getInitials } from '@/lib/utils'
import { mockContacts, mockContactStats } from '@/lib/mock-data/contacts'
import { Contact, ContactType } from '@/types/contacts'

const typeFilters: { value: ContactType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Contacts' },
  { value: 'customer', label: 'Customers' },
  { value: 'vendor', label: 'Vendors' },
  { value: 'both', label: 'Both' },
]

function ContactTypeIcon({ type }: { type: ContactType }) {
  const colors = {
    customer: 'text-green-500 bg-green-500/10',
    vendor: 'text-blue-500 bg-blue-500/10',
    both: 'text-purple-500 bg-purple-500/10',
  }
  
  return (
    <span className={cn('p-1.5 rounded-full', colors[type])}>
      {type === 'vendor' ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
    </span>
  )
}

function StatCard({ title, value, icon: Icon, trend }: { 
  title: string
  value: string | number
  icon: React.ElementType
  trend?: string 
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && (
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ContactsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ContactType | 'all'>('all')

  const filteredContacts = mockContacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(search.toLowerCase()) ||
      contact.email.toLowerCase().includes(search.toLowerCase()) ||
      contact.company?.toLowerCase().includes(search.toLowerCase())
    
    const matchesType = typeFilter === 'all' || contact.type === typeFilter
    
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">Manage customers, vendors, and partners</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard 
          title="Total Contacts" 
          value={mockContactStats.total} 
          icon={Users}
        />
        <StatCard 
          title="Customers" 
          value={mockContactStats.customers} 
          icon={User}
          trend="+12% this month"
        />
        <StatCard 
          title="Vendors" 
          value={mockContactStats.vendors} 
          icon={Building2}
        />
        <StatCard 
          title="New This Month" 
          value={mockContactStats.newThisMonth} 
          icon={UserPlus}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {typeFilters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={typeFilter === filter.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {filteredContacts.length} Contact{filteredContacts.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {filteredContacts.map((contact) => (
              <Link 
                key={contact.id} 
                href={`/contacts/${contact.id}`}
                className="flex items-center justify-between py-4 hover:bg-muted/50 px-4 -mx-4 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{contact.name}</p>
                      <ContactTypeIcon type={contact.type} />
                      {contact.category === 'company' && (
                        <Badge variant="outline" className="text-xs">Company</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </span>
                      {contact.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </span>
                      )}
                    </div>
                    {contact.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        {contact.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {contact.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{contact.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {contact.type !== 'vendor' && (
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(contact.totalRevenue)}</p>
                      <p className="text-sm text-muted-foreground">{contact.totalOrders} orders</p>
                    </div>
                  )}
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
