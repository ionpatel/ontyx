'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import * as contactsService from '@/services/contacts';
import * as automations from '@/services/automations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, Building2,
  FileText, ShoppingCart, Headphones, Calendar, RefreshCw,
  DollarSign, Globe, User, MoreVertical, Send, ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
};

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { organizationId } = useAuth();
  const { toast } = useToast();
  const contactId = params.id as string;

  const [contact, setContact] = useState<any>(null);
  const [relatedRecords, setRelatedRecords] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = useCallback(async () => {
    if (!organizationId || !contactId) return;
    setLoading(true);
    try {
      const [contactData, related] = await Promise.all([
        contactsService.getContact(contactId),
        automations.getContactRelatedRecords(organizationId, contactId),
      ]);
      setContact(contactData);
      setRelatedRecords(related);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load contact', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [organizationId, contactId, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!confirm('Delete this contact? This cannot be undone.')) return;
    try {
      await contactsService.deleteContact(contactId);
      toast({ title: 'Contact deleted' });
      router.push('/contacts');
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete contact', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Contact not found</p>
        <Button onClick={() => router.push('/contacts')} className="mt-4">
          Back to Contacts
        </Button>
      </div>
    );
  }

  const initials = contact.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/contacts')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-xl bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{contact.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={contact.type === 'customer' ? 'default' : 'secondary'}>
                {contact.type}
              </Badge>
              {contact.company && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> {contact.company}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/contacts/${contactId}/edit`}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Link>
          </Button>
          <Button variant="outline" onClick={handleDelete} className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Smart Buttons - Like Odoo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Link href={`/invoices?contact=${contactId}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Invoices</span>
                </div>
                <span className="text-2xl font-bold">{relatedRecords?.invoices?.length || 0}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatCurrency(relatedRecords?.summary?.totalInvoiced || 0)} total
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/sales?contact=${contactId}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Orders</span>
                </div>
                <span className="text-2xl font-bold">{relatedRecords?.salesOrders?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/helpdesk?contact=${contactId}`}>
          <Card className={`hover:shadow-md transition-shadow cursor-pointer ${(relatedRecords?.summary?.openTickets || 0) > 0 ? 'border-yellow-200' : ''}`}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Headphones className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tickets</span>
                </div>
                <span className={`text-2xl font-bold ${(relatedRecords?.summary?.openTickets || 0) > 0 ? 'text-yellow-600' : ''}`}>
                  {relatedRecords?.tickets?.length || 0}
                </span>
              </div>
              {(relatedRecords?.summary?.openTickets || 0) > 0 && (
                <div className="text-xs text-yellow-600 mt-1">
                  {relatedRecords.summary.openTickets} open
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href={`/appointments?contact=${contactId}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Appointments</span>
                </div>
                <span className="text-2xl font-bold">{relatedRecords?.appointments?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/subscriptions?contact=${contactId}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Subscriptions</span>
                </div>
                <span className="text-2xl font-bold">{relatedRecords?.subscriptions?.length || 0}</span>
              </div>
              {(relatedRecords?.summary?.activeSubscriptions || 0) > 0 && (
                <div className="text-xs text-green-600 mt-1">
                  {relatedRecords.summary.activeSubscriptions} active
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contact.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${contact.phone}`} className="hover:underline">
                      {contact.phone}
                    </a>
                  </div>
                )}
                {contact.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={contact.website} target="_blank" rel="noopener" className="text-primary hover:underline flex items-center gap-1">
                      {contact.website} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {(contact.address || contact.city) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      {contact.address && <div>{contact.address}</div>}
                      {contact.city && (
                        <div>{contact.city}{contact.province && `, ${contact.province}`} {contact.postal_code}</div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Invoiced</span>
                  <span className="font-bold text-lg">{formatCurrency(relatedRecords?.summary?.totalInvoiced || 0)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Open Tickets</span>
                  <span className={`font-bold ${(relatedRecords?.summary?.openTickets || 0) > 0 ? 'text-yellow-600' : ''}`}>
                    {relatedRecords?.summary?.openTickets || 0}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Active Subscriptions</span>
                  <span className={`font-bold ${(relatedRecords?.summary?.activeSubscriptions || 0) > 0 ? 'text-green-600' : ''}`}>
                    {relatedRecords?.summary?.activeSubscriptions || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Invoices</CardTitle>
              <Button size="sm" asChild>
                <Link href={`/invoices/new?contact=${contactId}`}>Create Invoice</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {relatedRecords?.invoices?.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No invoices yet</p>
              ) : (
                <div className="space-y-2">
                  {relatedRecords?.invoices?.map((inv: any) => (
                    <Link key={inv.id} href={`/invoices/${inv.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                        <div>
                          <div className="font-medium">{inv.invoice_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(inv.issue_date), 'MMM d, yyyy')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(inv.total)}</div>
                          <Badge className={statusColors[inv.status]}>{inv.status}</Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sales Orders</CardTitle>
              <Button size="sm" asChild>
                <Link href={`/sales/new?contact=${contactId}`}>Create Order</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {relatedRecords?.salesOrders?.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No orders yet</p>
              ) : (
                <div className="space-y-2">
                  {relatedRecords?.salesOrders?.map((order: any) => (
                    <Link key={order.id} href={`/sales/${order.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                        <div>
                          <div className="font-medium">{order.order_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(order.order_date), 'MMM d, yyyy')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(order.total)}</div>
                          <Badge className={statusColors[order.status]}>{order.status}</Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Support Tickets</CardTitle>
              <Button size="sm" asChild>
                <Link href={`/helpdesk/new?contact=${contactId}`}>Create Ticket</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {relatedRecords?.tickets?.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No tickets yet</p>
              ) : (
                <div className="space-y-2">
                  {relatedRecords?.tickets?.map((ticket: any) => (
                    <Link key={ticket.id} href={`/helpdesk/${ticket.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                        <div>
                          <div className="font-medium">{ticket.subject}</div>
                          <div className="text-sm text-muted-foreground">
                            {ticket.ticket_number}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={statusColors[ticket.status]}>{ticket.status}</Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(new Date(ticket.created_at), 'MMM d')}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
