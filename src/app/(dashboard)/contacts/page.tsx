'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Search, Plus, Building2, User, Phone, Mail, 
  MoreHorizontal, ArrowUpRight, Users, TrendingUp, 
  UserPlus, Edit, Trash2, Eye, MapPin, FileDown
} from 'lucide-react'
import { exportContactsToCSV } from '@/lib/export'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useContacts } from '@/hooks/use-contacts'
import type { Contact, ContactType, CreateContactInput } from '@/services/contacts'
import { cn, formatCurrency } from '@/lib/utils'

const typeFilters: { value: ContactType | 'all'; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'All Contacts', icon: Users },
  { value: 'customer', label: 'Customers', icon: User },
  { value: 'vendor', label: 'Vendors', icon: Building2 },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function ContactTypeIcon({ type }: { type: ContactType }) {
  const colors = {
    customer: 'text-green-600 bg-green-100',
    vendor: 'text-blue-600 bg-blue-100',
    both: 'text-purple-600 bg-purple-100',
  }
  
  return (
    <span className={cn('p-1.5 rounded-full', colors[type])}>
      {type === 'vendor' ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
    </span>
  )
}

function StatCard({ title, value, icon: Icon, description, iconBg, iconColor }: { 
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
  iconBg: string
  iconColor: string
}) {
  return (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-text-secondary">{title}</CardTitle>
        <div className={cn("p-2 rounded-lg", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-text-primary">{value}</div>
        {description && (
          <p className="text-xs text-text-muted mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

export default function ContactsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ContactType | 'all'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newContact, setNewContact] = useState<Partial<CreateContactInput>>({
    type: 'customer',
    name: '',
    email: '',
    phone: '',
    company: '',
    country: 'CA',
  })

  const { contacts, loading, createContact, deleteContact } = useContacts(
    typeFilter !== 'all' ? typeFilter : undefined
  )

  const filteredContacts = contacts.filter(contact => {
    if (search) {
      const q = search.toLowerCase()
      return (
        contact.name.toLowerCase().includes(q) ||
        contact.email?.toLowerCase().includes(q) ||
        contact.company?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const stats = {
    total: contacts.length,
    customers: contacts.filter(c => c.type === 'customer' || c.type === 'both').length,
    vendors: contacts.filter(c => c.type === 'vendor' || c.type === 'both').length,
    totalRevenue: contacts.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
  }

  const handleCreateContact = async () => {
    if (!newContact.name || !newContact.type) return
    
    const result = await createContact(newContact as CreateContactInput)
    if (result) {
      setIsDialogOpen(false)
      setNewContact({
        type: 'customer',
        name: '',
        email: '',
        phone: '',
        company: '',
        country: 'CA',
      })
    }
  }

  const handleDeleteContact = async (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      await deleteContact(id)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Contacts</h1>
          <p className="text-text-secondary mt-1">Manage customers, vendors, and partners</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => exportContactsToCSV(contacts)}
            disabled={contacts.length === 0}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-maple">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
              <DialogDescription>
                Add a new customer, vendor, or partner to your contacts.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Contact Type</Label>
                  <Select 
                    value={newContact.type} 
                    onValueChange={(v) => setNewContact(prev => ({ ...prev, type: v as ContactType }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={newContact.company || ''}
                    onChange={(e) => setNewContact(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Company name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Contact Name *</Label>
                <Input
                  id="name"
                  value={newContact.name || ''}
                  onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newContact.email || ''}
                    onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newContact.phone || ''}
                    onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(416) 555-0100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={newContact.city || ''}
                    onChange={(e) => setNewContact(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Toronto"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Select 
                    value={newContact.province || ''} 
                    onValueChange={(v) => setNewContact(prev => ({ ...prev, province: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ON">Ontario</SelectItem>
                      <SelectItem value="QC">Quebec</SelectItem>
                      <SelectItem value="BC">British Columbia</SelectItem>
                      <SelectItem value="AB">Alberta</SelectItem>
                      <SelectItem value="MB">Manitoba</SelectItem>
                      <SelectItem value="SK">Saskatchewan</SelectItem>
                      <SelectItem value="NS">Nova Scotia</SelectItem>
                      <SelectItem value="NB">New Brunswick</SelectItem>
                      <SelectItem value="NL">Newfoundland</SelectItem>
                      <SelectItem value="PE">PEI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateContact} disabled={!newContact.name}>
                Add Contact
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard 
          title="Total Contacts" 
          value={stats.total}
          icon={Users}
          description="In your network"
          iconBg="bg-primary-light"
          iconColor="text-primary"
        />
        <StatCard 
          title="Customers" 
          value={stats.customers}
          icon={User}
          description="Active customers"
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard 
          title="Vendors" 
          value={stats.vendors}
          icon={Building2}
          description="Suppliers"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(stats.totalRevenue, 'CAD')}
          icon={TrendingUp}
          description="From customers"
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
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
                  className={typeFilter === filter.value ? 'shadow-maple' : ''}
                >
                  <filter.icon className="h-4 w-4 mr-2" />
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
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {filteredContacts.length} Contact{filteredContacts.length !== 1 ? 's' : ''}
          </CardTitle>
          <CardDescription>
            Click on a contact to view details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Users className="h-12 w-12 text-text-muted mb-4" />
              <h3 className="text-lg font-medium text-text-primary">No contacts found</h3>
              <p className="text-text-muted mt-1">
                {search ? "Try adjusting your search" : "Add your first contact to get started"}
              </p>
              {!search && (
                <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Contact
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredContacts.map((contact) => (
                <div 
                  key={contact.id} 
                  className="flex items-center justify-between py-4 hover:bg-surface-hover px-4 -mx-4 transition-colors group"
                >
                  <Link href={`/contacts/${contact.id}`} className="flex items-center gap-4 flex-1">
                    <Avatar className="h-12 w-12 border-2 border-border">
                      <AvatarFallback className="bg-primary-light text-primary font-semibold">
                        {getInitials(contact.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-text-primary truncate">{contact.name}</p>
                        <ContactTypeIcon type={contact.type} />
                      </div>
                      {contact.company && (
                        <p className="text-sm text-text-secondary truncate">{contact.company}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-text-muted mt-1">
                        {contact.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            {contact.email}
                          </span>
                        )}
                        {contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            {contact.phone}
                          </span>
                        )}
                        {contact.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            {contact.city}, {contact.province}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-6">
                    {(contact.type === 'customer' || contact.type === 'both') && (
                      <div className="text-right hidden sm:block">
                        <p className="font-semibold text-text-primary">
                          {formatCurrency(contact.totalSpent || 0, 'CAD')}
                        </p>
                        <p className="text-sm text-text-muted">{contact.totalOrders || 0} orders</p>
                      </div>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/contacts/${contact.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/contacts/${contact.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Contact
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteContact(contact.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
