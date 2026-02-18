"use client"

import Link from "next/link"
import { 
  User, Building2, Phone, Mail, MapPin, 
  MoreHorizontal, ChevronRight
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency, cn } from "@/lib/utils"
import type { Contact, ContactType } from "@/services/contacts"

const typeConfig: Record<ContactType, { 
  label: string
  color: string
  icon: React.ElementType 
}> = {
  customer: { label: "Customer", color: "bg-green-100 text-green-700", icon: User },
  vendor: { label: "Vendor", color: "bg-blue-100 text-blue-700", icon: Building2 },
  both: { label: "Both", color: "bg-purple-100 text-purple-700", icon: User },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

interface ContactCardProps {
  contact: Contact
  onAction?: (action: string, contact: Contact) => void
}

export function ContactCard({ contact, onAction }: ContactCardProps) {
  const TypeIcon = typeConfig[contact.type].icon
  const hasLocation = contact.city || contact.province

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(contact.name)}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link 
                href={`/contacts/${contact.id}`}
                className="font-semibold hover:text-primary hover:underline truncate"
              >
                {contact.name}
              </Link>
              <Badge className={cn("text-xs shrink-0", typeConfig[contact.type].color)}>
                <TypeIcon className="h-3 w-3 mr-1" />
                {typeConfig[contact.type].label}
              </Badge>
            </div>

            {contact.company && (
              <p className="text-sm text-muted-foreground truncate">
                {contact.company}
              </p>
            )}

            {/* Contact details */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
              {contact.email && (
                <a 
                  href={`mailto:${contact.email}`} 
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <Mail className="h-3 w-3" />
                  <span className="truncate max-w-[150px]">{contact.email}</span>
                </a>
              )}
              {contact.phone && (
                <a 
                  href={`tel:${contact.phone}`} 
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <Phone className="h-3 w-3" />
                  {contact.phone}
                </a>
              )}
              {hasLocation && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[contact.city, contact.province].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          </div>

          {/* Stats & Actions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {contact.totalSpent > 0 && (
              <div className="text-right">
                <p className="text-sm font-semibold text-green-600">
                  {formatCurrency(contact.totalSpent, 'CAD')}
                </p>
                <p className="text-xs text-muted-foreground">spent</p>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/contacts/${contact.id}`}>
                  View
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onAction?.('edit', contact)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAction?.('email', contact)}>
                    Send Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAction?.('invoice', contact)}>
                    Create Invoice
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onAction?.('delete', contact)}
                    className="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Mobile-friendly list
export function ContactCardList({ 
  contacts, 
  onAction 
}: { 
  contacts: Contact[]
  onAction?: (action: string, contact: Contact) => void 
}) {
  if (contacts.length === 0) return null

  return (
    <div className="space-y-3">
      {contacts.map((contact) => (
        <ContactCard 
          key={contact.id} 
          contact={contact} 
          onAction={onAction}
        />
      ))}
    </div>
  )
}
