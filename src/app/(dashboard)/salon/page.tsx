'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarView } from '@/components/calendar-view';
import {
  Scissors, Calendar, Clock, User, Users, DollarSign, Plus,
  Phone, Mail, Star, Heart, Package, Gift, CreditCard, Bell,
  CheckCircle, XCircle, MessageSquare, History
} from 'lucide-react';
import { format, addMinutes, setHours, setMinutes, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  category: string;
  duration: number; // minutes
  price: number;
  description?: string;
}

interface Staff {
  id: string;
  name: string;
  role: string;
  services: string[];
  color: string;
  availability: { day: number; start: string; end: string }[];
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferences?: string;
  notes?: string;
  visits: number;
  total_spent: number;
  last_visit?: string;
  membership?: string;
}

interface Appointment {
  id: string;
  client_id: string;
  client_name: string;
  staff_id: string;
  staff_name: string;
  service_id: string;
  service_name: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: 'booked' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
}

const statusColors: Record<string, string> = {
  booked: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-orange-100 text-orange-700',
};

// Demo data
const demoServices: Service[] = [
  { id: 's1', name: "Women's Haircut", category: 'Hair', duration: 45, price: 65 },
  { id: 's2', name: "Men's Haircut", category: 'Hair', duration: 30, price: 35 },
  { id: 's3', name: 'Color & Highlights', category: 'Hair', duration: 120, price: 150 },
  { id: 's4', name: 'Blowout & Style', category: 'Hair', duration: 45, price: 55 },
  { id: 's5', name: 'Classic Manicure', category: 'Nails', duration: 30, price: 35 },
  { id: 's6', name: 'Gel Manicure', category: 'Nails', duration: 45, price: 50 },
  { id: 's7', name: 'Pedicure', category: 'Nails', duration: 60, price: 65 },
  { id: 's8', name: 'Deep Tissue Massage', category: 'Spa', duration: 60, price: 120 },
  { id: 's9', name: 'Swedish Massage', category: 'Spa', duration: 60, price: 100 },
  { id: 's10', name: 'Facial Treatment', category: 'Spa', duration: 75, price: 95 },
];

const demoStaff: Staff[] = [
  { id: 'st1', name: 'Sarah Chen', role: 'Senior Stylist', services: ['s1', 's2', 's3', 's4'], color: '#DC2626', availability: [{ day: 1, start: '09:00', end: '18:00' }, { day: 2, start: '09:00', end: '18:00' }, { day: 3, start: '09:00', end: '18:00' }, { day: 4, start: '09:00', end: '18:00' }, { day: 5, start: '09:00', end: '18:00' }] },
  { id: 'st2', name: 'Emily Rodriguez', role: 'Nail Technician', services: ['s5', 's6', 's7'], color: '#2563EB', availability: [{ day: 1, start: '10:00', end: '19:00' }, { day: 2, start: '10:00', end: '19:00' }, { day: 3, start: '10:00', end: '19:00' }, { day: 4, start: '10:00', end: '19:00' }, { day: 5, start: '10:00', end: '19:00' }, { day: 6, start: '09:00', end: '17:00' }] },
  { id: 'st3', name: 'Michael Park', role: 'Massage Therapist', services: ['s8', 's9'], color: '#059669', availability: [{ day: 1, start: '11:00', end: '20:00' }, { day: 2, start: '11:00', end: '20:00' }, { day: 4, start: '11:00', end: '20:00' }, { day: 5, start: '11:00', end: '20:00' }, { day: 6, start: '10:00', end: '18:00' }] },
  { id: 'st4', name: 'Jessica Lee', role: 'Esthetician', services: ['s10'], color: '#7C3AED', availability: [{ day: 2, start: '09:00', end: '17:00' }, { day: 3, start: '09:00', end: '17:00' }, { day: 4, start: '09:00', end: '17:00' }, { day: 5, start: '09:00', end: '17:00' }, { day: 6, start: '09:00', end: '15:00' }] },
];

const demoClients: Client[] = [
  { id: 'c1', name: 'Amanda Wilson', email: 'amanda@email.com', phone: '416-555-0101', preferences: 'Prefers quiet environment, tea over coffee', visits: 24, total_spent: 2850, last_visit: '2026-02-10', membership: 'VIP' },
  { id: 'c2', name: 'Jennifer Brown', email: 'jen.b@email.com', phone: '416-555-0102', visits: 12, total_spent: 1420, last_visit: '2026-02-05' },
  { id: 'c3', name: 'Michelle Tran', email: 'mtran@email.com', phone: '416-555-0103', preferences: 'Allergic to certain dyes', visits: 8, total_spent: 890, last_visit: '2026-01-28' },
];

const demoAppointments: Appointment[] = [
  { id: 'a1', client_id: 'c1', client_name: 'Amanda Wilson', staff_id: 'st1', staff_name: 'Sarah Chen', service_id: 's1', service_name: "Women's Haircut", date: '2026-02-17', time: '10:00', duration: 45, price: 65, status: 'confirmed' },
  { id: 'a2', client_id: 'c2', client_name: 'Jennifer Brown', staff_id: 'st2', staff_name: 'Emily Rodriguez', service_id: 's6', service_name: 'Gel Manicure', date: '2026-02-17', time: '11:00', duration: 45, price: 50, status: 'booked' },
  { id: 'a3', client_id: 'c3', client_name: 'Michelle Tran', staff_id: 'st3', staff_name: 'Michael Park', service_id: 's8', service_name: 'Deep Tissue Massage', date: '2026-02-17', time: '14:00', duration: 60, price: 120, status: 'confirmed' },
  { id: 'a4', client_id: 'c1', client_name: 'Amanda Wilson', staff_id: 'st4', staff_name: 'Jessica Lee', service_id: 's10', service_name: 'Facial Treatment', date: '2026-02-18', time: '10:00', duration: 75, price: 95, status: 'booked' },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);

export default function SalonPage() {
  const { organizationId } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('calendar');
  const [services, setServices] = useState<Service[]>(demoServices);
  const [staff, setStaff] = useState<Staff[]>(demoStaff);
  const [clients, setClients] = useState<Client[]>(demoClients);
  const [appointments, setAppointments] = useState<Appointment[]>(demoAppointments);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Stats
  const todayAppointments = appointments.filter(a => a.date === format(new Date(), 'yyyy-MM-dd'));
  const stats = {
    todayBookings: todayAppointments.length,
    todayRevenue: todayAppointments.reduce((sum, a) => sum + a.price, 0),
    totalClients: clients.length,
    vipClients: clients.filter(c => c.membership === 'VIP').length,
    avgTicket: clients.length > 0 ? clients.reduce((sum, c) => sum + c.total_spent, 0) / clients.reduce((sum, c) => sum + c.visits, 0) : 0,
  };

  const confirmAppointment = (id: string) => {
    setAppointments(appointments.map(a =>
      a.id === id ? { ...a, status: 'confirmed' } : a
    ));
    toast({ title: 'Appointment confirmed' });
  };

  const cancelAppointment = (id: string) => {
    setAppointments(appointments.map(a =>
      a.id === id ? { ...a, status: 'cancelled' } : a
    ));
    toast({ title: 'Appointment cancelled' });
  };

  const calendarEvents = appointments.map(apt => {
    const staffMember = staff.find(s => s.id === apt.staff_id);
    return {
      id: apt.id,
      title: `${apt.client_name} - ${apt.service_name}`,
      start: new Date(`${apt.date}T${apt.time}`),
      color: staffMember?.color || '#6B7280',
    };
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scissors className="h-6 w-6" />
            Salon & Spa
          </h1>
          <p className="text-muted-foreground">Appointments, clients, and services management</p>
        </div>
        <Button onClick={() => setShowNewAppointment(true)}>
          <Plus className="h-4 w-4 mr-2" /> Book Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Today</div>
                <div className="text-2xl font-bold">{stats.todayBookings}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Today's Revenue</div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.todayRevenue)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Clients</div>
                <div className="text-2xl font-bold">{stats.totalClients}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">VIP Clients</div>
                <div className="text-2xl font-bold">{stats.vipClients}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100">
                <CreditCard className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Avg Ticket</div>
                <div className="text-2xl font-bold">{formatCurrency(stats.avgTicket)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>

        {/* Calendar */}
        <TabsContent value="calendar">
          <CalendarView events={calendarEvents} />
        </TabsContent>

        {/* Appointments */}
        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle>Today's Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {appointments.filter(a => a.date === '2026-02-17').map(apt => (
                  <div key={apt.id} className="flex items-center gap-4 p-4 rounded-lg border">
                    <div className="text-center min-w-[60px]">
                      <div className="text-2xl font-bold">{apt.time.split(':')[0]}</div>
                      <div className="text-sm text-muted-foreground">:{apt.time.split(':')[1]}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{apt.client_name}</span>
                        <Badge className={statusColors[apt.status]}>{apt.status}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {apt.service_name} with {apt.staff_name}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {apt.duration} min
                        </span>
                        <span className="font-medium text-primary">{formatCurrency(apt.price)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {apt.status === 'booked' && (
                        <Button size="sm" variant="outline" onClick={() => confirmAppointment(apt.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Confirm
                        </Button>
                      )}
                      {['booked', 'confirmed'].includes(apt.status) && (
                        <Button size="sm" variant="ghost" onClick={() => cancelAppointment(apt.id)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clients */}
        <TabsContent value="clients">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map(client => (
              <Card key={client.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedClient(client)}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{client.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{client.name}</span>
                        {client.membership === 'VIP' && (
                          <Badge className="bg-yellow-100 text-yellow-700">
                            <Star className="h-3 w-3 mr-1 fill-yellow-500" /> VIP
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {client.phone}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Visits:</span>
                      <span className="ml-2 font-medium">{client.visits}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Spent:</span>
                      <span className="ml-2 font-medium">{formatCurrency(client.total_spent)}</span>
                    </div>
                  </div>
                  {client.last_visit && (
                    <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                      Last visit: {format(new Date(client.last_visit), 'MMM d, yyyy')}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            <Card className="border-dashed flex items-center justify-center min-h-[200px] cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="text-center">
                <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="font-medium">Add Client</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Services */}
        <TabsContent value="services">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {['Hair', 'Nails', 'Spa'].map(category => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {services.filter(s => s.category === category).map(service => (
                      <div key={service.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3 w-3" /> {service.duration} min
                          </div>
                        </div>
                        <div className="text-lg font-bold text-primary">{formatCurrency(service.price)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Staff */}
        <TabsContent value="staff">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {staff.map(member => (
              <Card key={member.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12" style={{ borderColor: member.color, borderWidth: 3 }}>
                      <AvatarFallback style={{ backgroundColor: member.color + '20', color: member.color }}>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground">{member.role}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Services:</div>
                    <div className="flex flex-wrap gap-1">
                      {member.services.map(sId => {
                        const service = services.find(s => s.id === sId);
                        return service ? (
                          <Badge key={sId} variant="outline" className="text-xs">{service.name}</Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Client Detail Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{selectedClient?.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  {selectedClient?.name}
                  {selectedClient?.membership === 'VIP' && (
                    <Badge className="bg-yellow-100 text-yellow-700">VIP</Badge>
                  )}
                </div>
                <div className="text-sm font-normal text-muted-foreground">{selectedClient?.email}</div>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {selectedClient.phone}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {selectedClient.email}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">{selectedClient.visits}</div>
                  <div className="text-sm text-muted-foreground">Visits</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{formatCurrency(selectedClient.total_spent)}</div>
                  <div className="text-sm text-muted-foreground">Total Spent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatCurrency(selectedClient.total_spent / selectedClient.visits)}</div>
                  <div className="text-sm text-muted-foreground">Avg Ticket</div>
                </div>
              </div>
              {selectedClient.preferences && (
                <div>
                  <Label className="text-muted-foreground">Preferences & Notes</Label>
                  <p className="mt-1 text-sm p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Heart className="h-4 w-4 inline mr-2 text-yellow-600" />
                    {selectedClient.preferences}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedClient(null)}>Close</Button>
            <Button>
              <Calendar className="h-4 w-4 mr-2" /> Book Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Appointment Dialog */}
      <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Service</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select service..." />
                </SelectTrigger>
                <SelectContent>
                  {services.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.duration} min) - {formatCurrency(s.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Staff</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member..." />
                </SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} - {s.role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Any special requests..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewAppointment(false)}>Cancel</Button>
            <Button>Book Appointment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
