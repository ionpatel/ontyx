'use client';

import { useState, useEffect } from 'react';
import { useOrganization } from '@/hooks/use-organization';
import { salonService, SalonService, SalonStaff, SalonClient, SalonAppointment } from '@/services/salon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Scissors,
  Search,
  Plus,
  Calendar,
  Users,
  Clock,
  DollarSign,
  Star,
  UserCheck,
  Edit,
  Trash2,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Play,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

const SERVICE_CATEGORIES = ['Hair', 'Nails', 'Spa', 'Makeup', 'Waxing', 'Skin', 'Other'];
const STAFF_ROLES = ['Stylist', 'Nail Technician', 'Esthetician', 'Massage Therapist', 'Barber', 'Colorist'];
const APPOINTMENT_STATUSES = ['booked', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'];

export default function SalonPage() {
  const { organization } = useOrganization();
  const { toast } = useToast();

  const [services, setServices] = useState<SalonService[]>([]);
  const [staff, setStaff] = useState<SalonStaff[]>([]);
  const [clients, setClients] = useState<SalonClient[]>([]);
  const [appointments, setAppointments] = useState<SalonAppointment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

  // Dialogs
  const [serviceDialog, setServiceDialog] = useState(false);
  const [staffDialog, setStaffDialog] = useState(false);
  const [clientDialog, setClientDialog] = useState(false);
  const [appointmentDialog, setAppointmentDialog] = useState(false);

  // Form states
  const [editingService, setEditingService] = useState<SalonService | null>(null);
  const [editingStaff, setEditingStaff] = useState<SalonStaff | null>(null);
  const [editingClient, setEditingClient] = useState<SalonClient | null>(null);

  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: '',
    description: '',
    duration: 30,
    price: 0,
    commission_type: 'percentage' as const,
    commission_value: 0,
    color: '#3B82F6',
  });

  const [staffForm, setStaffForm] = useState({
    display_name: '',
    role: '',
    bio: '',
    photo_url: '',
    color: '#10B981',
    services: [] as string[],
  });

  const [clientForm, setClientForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    preferences: '',
    allergies: '',
    notes: '',
    membership_type: '',
  });

  const [appointmentForm, setAppointmentForm] = useState({
    client_id: '',
    staff_id: '',
    service_id: '',
    appointment_date: selectedDate,
    start_time: '09:00',
    notes: '',
  });

  useEffect(() => {
    if (organization?.id) {
      loadData();
    }
  }, [organization?.id, selectedDate]);

  const loadData = async () => {
    if (!organization?.id) return;
    setIsLoading(true);
    try {
      const [servicesData, staffData, clientsData, appointmentsData, statsData] = await Promise.all([
        salonService.getServices(organization.id),
        salonService.getStaff(organization.id),
        salonService.getClients(organization.id),
        salonService.getAppointments(organization.id, selectedDate),
        salonService.getStats(organization.id, selectedDate),
      ]);
      setServices(servicesData);
      setStaff(staffData);
      setClients(clientsData);
      setAppointments(appointmentsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load salon data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Service handlers
  const handleSaveService = async () => {
    if (!organization?.id) return;
    try {
      if (editingService) {
        await salonService.updateService(editingService.id, serviceForm);
        toast({ title: 'Service updated' });
      } else {
        await salonService.createService({ ...serviceForm, organization_id: organization.id, is_active: true });
        toast({ title: 'Service created' });
      }
      setServiceDialog(false);
      setEditingService(null);
      loadData();
    } catch (error) {
      toast({ title: 'Error saving service', variant: 'destructive' });
    }
  };

  const openServiceDialog = (service?: SalonService) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        name: service.name,
        category: service.category || '',
        description: service.description || '',
        duration: service.duration,
        price: service.price,
        commission_type: service.commission_type,
        commission_value: service.commission_value,
        color: service.color || '#3B82F6',
      });
    } else {
      setEditingService(null);
      setServiceForm({ name: '', category: '', description: '', duration: 30, price: 0, commission_type: 'percentage', commission_value: 0, color: '#3B82F6' });
    }
    setServiceDialog(true);
  };

  // Staff handlers
  const handleSaveStaff = async () => {
    if (!organization?.id) return;
    try {
      if (editingStaff) {
        await salonService.updateStaff(editingStaff.id, staffForm);
        toast({ title: 'Staff updated' });
      } else {
        await salonService.createStaff({ ...staffForm, organization_id: organization.id, is_active: true });
        toast({ title: 'Staff added' });
      }
      setStaffDialog(false);
      setEditingStaff(null);
      loadData();
    } catch (error) {
      toast({ title: 'Error saving staff', variant: 'destructive' });
    }
  };

  const openStaffDialog = (member?: SalonStaff) => {
    if (member) {
      setEditingStaff(member);
      setStaffForm({
        display_name: member.display_name,
        role: member.role || '',
        bio: member.bio || '',
        photo_url: member.photo_url || '',
        color: member.color || '#10B981',
        services: member.services || [],
      });
    } else {
      setEditingStaff(null);
      setStaffForm({ display_name: '', role: '', bio: '', photo_url: '', color: '#10B981', services: [] });
    }
    setStaffDialog(true);
  };

  // Client handlers
  const handleSaveClient = async () => {
    if (!organization?.id) return;
    try {
      if (editingClient) {
        await salonService.updateClient(editingClient.id, clientForm);
        toast({ title: 'Client updated' });
      } else {
        await salonService.createClient({ ...clientForm, organization_id: organization.id });
        toast({ title: 'Client added' });
      }
      setClientDialog(false);
      setEditingClient(null);
      loadData();
    } catch (error) {
      toast({ title: 'Error saving client', variant: 'destructive' });
    }
  };

  const openClientDialog = (client?: SalonClient) => {
    if (client) {
      setEditingClient(client);
      setClientForm({
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email || '',
        phone: client.phone || '',
        date_of_birth: client.date_of_birth || '',
        preferences: client.preferences || '',
        allergies: client.allergies || '',
        notes: client.notes || '',
        membership_type: client.membership_type || '',
      });
    } else {
      setEditingClient(null);
      setClientForm({ first_name: '', last_name: '', email: '', phone: '', date_of_birth: '', preferences: '', allergies: '', notes: '', membership_type: '' });
    }
    setClientDialog(true);
  };

  // Appointment handlers
  const handleSaveAppointment = async () => {
    if (!organization?.id) return;
    const selectedService = services.find(s => s.id === appointmentForm.service_id);
    if (!selectedService) return;

    const startTime = appointmentForm.start_time;
    const [hours, mins] = startTime.split(':').map(Number);
    const endMins = hours * 60 + mins + selectedService.duration;
    const endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;

    try {
      await salonService.createAppointment({
        organization_id: organization.id,
        client_id: appointmentForm.client_id || undefined,
        staff_id: appointmentForm.staff_id,
        service_id: appointmentForm.service_id,
        appointment_date: appointmentForm.appointment_date,
        start_time: startTime,
        end_time: endTime,
        status: 'booked',
        price: selectedService.price,
        deposit_paid: 0,
        notes: appointmentForm.notes,
        reminder_sent: false,
      });
      toast({ title: 'Appointment booked' });
      setAppointmentDialog(false);
      loadData();
    } catch (error) {
      toast({ title: 'Error booking appointment', variant: 'destructive' });
    }
  };

  const updateAppointmentStatus = async (id: string, status: SalonAppointment['status']) => {
    try {
      if (status === 'completed') {
        await salonService.completeAppointment(id);
      } else if (status === 'cancelled') {
        await salonService.cancelAppointment(id);
      } else {
        await salonService.updateAppointmentStatus(id, status);
      }
      toast({ title: `Appointment ${status}` });
      loadData();
    } catch (error) {
      toast({ title: 'Error updating appointment', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      booked: 'bg-blue-100 text-blue-700',
      confirmed: 'bg-purple-100 text-purple-700',
      checked_in: 'bg-amber-100 text-amber-700',
      in_progress: 'bg-cyan-100 text-cyan-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-100 text-gray-700',
      no_show: 'bg-red-100 text-red-700',
    };
    return <Badge className={colors[status] || 'bg-gray-100'}>{status.replace('_', ' ')}</Badge>;
  };

  const filteredClients = clients.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.first_name.toLowerCase().includes(q) || c.last_name.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Scissors className="w-6 h-6 text-pink-600" />
            Salon & Spa
          </h1>
          <p className="text-gray-600">Appointments, clients, services, and staff management</p>
        </div>
        <Button onClick={() => { setAppointmentForm({ ...appointmentForm, appointment_date: selectedDate }); setAppointmentDialog(true); }} className="bg-pink-600 hover:bg-pink-700">
          <Plus className="w-4 h-4 mr-2" />
          Book Appointment
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.todayAppointments}</p>
                  <p className="text-xs text-gray-500">Today&apos;s Appointments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <UserCheck className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.checkedIn}</p>
                  <p className="text-xs text-gray-500">Checked In</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Play className="w-8 h-8 text-cyan-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                  <p className="text-xs text-gray-500">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalClients}</p>
                  <p className="text-xs text-gray-500">Total Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.todayRevenue)}</p>
                  <p className="text-xs text-gray-500">Today&apos;s Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="clients">Clients ({clients.length})</TabsTrigger>
          <TabsTrigger value="services">Services ({services.length})</TabsTrigger>
          <TabsTrigger value="staff">Staff ({staff.length})</TabsTrigger>
        </TabsList>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Today&apos;s Schedule</CardTitle>
                  <CardDescription>{formatDate(selectedDate)}</CardDescription>
                </div>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-40"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell className="font-mono">
                        {apt.start_time?.slice(0, 5)} - {apt.end_time?.slice(0, 5)}
                      </TableCell>
                      <TableCell>
                        {apt.client ? (
                          <div>
                            <p className="font-medium">{apt.client.first_name} {apt.client.last_name}</p>
                            {apt.client.phone && <p className="text-xs text-gray-500">{apt.client.phone}</p>}
                          </div>
                        ) : (
                          <span className="text-gray-400">Walk-in</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {apt.service?.color && (
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: apt.service.color }} />
                          )}
                          <span>{apt.service?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{apt.staff?.display_name}</TableCell>
                      <TableCell>{getStatusBadge(apt.status)}</TableCell>
                      <TableCell>{formatCurrency(apt.price)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {apt.status === 'booked' && (
                            <Button size="sm" variant="outline" onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}>
                              Confirm
                            </Button>
                          )}
                          {apt.status === 'confirmed' && (
                            <Button size="sm" variant="outline" onClick={() => updateAppointmentStatus(apt.id, 'checked_in')}>
                              Check In
                            </Button>
                          )}
                          {apt.status === 'checked_in' && (
                            <Button size="sm" variant="outline" onClick={() => updateAppointmentStatus(apt.id, 'in_progress')}>
                              Start
                            </Button>
                          )}
                          {apt.status === 'in_progress' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateAppointmentStatus(apt.id, 'completed')}>
                              Complete
                            </Button>
                          )}
                          {['booked', 'confirmed'].includes(apt.status) && (
                            <Button size="sm" variant="ghost" onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}>
                              <XCircle className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {appointments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No appointments for this date
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
                <Button onClick={() => openClientDialog()} className="bg-pink-600 hover:bg-pink-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Membership</TableHead>
                    <TableHead>Visits</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Last Visit</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {client.membership_type === 'VIP' && <Star className="w-4 h-4 text-amber-500" />}
                          <span className="font-medium">{client.first_name} {client.last_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {client.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {client.phone}</div>}
                          {client.email && <div className="flex items-center gap-1 text-gray-500"><Mail className="w-3 h-3" /> {client.email}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.membership_type ? (
                          <Badge className={client.membership_type === 'VIP' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100'}>{client.membership_type}</Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell>{client.total_visits}</TableCell>
                      <TableCell>{formatCurrency(client.total_spent)}</TableCell>
                      <TableCell>{client.last_visit ? formatDate(client.last_visit) : '—'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openClientDialog(client)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle>Services Menu</CardTitle>
                <CardDescription>Manage your service offerings</CardDescription>
              </div>
              <Button onClick={() => openServiceDialog()} className="bg-pink-600 hover:bg-pink-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <Card key={service.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: service.color || '#3B82F6' }} />
                          <div>
                            <h3 className="font-semibold">{service.name}</h3>
                            <p className="text-sm text-gray-500">{service.category}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => openServiceDialog(service)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-4 h-4" />
                          {service.duration} min
                        </div>
                        <div className="font-semibold text-green-600">
                          {formatCurrency(service.price)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff">
          <Card>
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage your salon staff</CardDescription>
              </div>
              <Button onClick={() => openStaffDialog()} className="bg-pink-600 hover:bg-pink-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Staff
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staff.map((member) => (
                  <Card key={member.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                          style={{ backgroundColor: member.color || '#10B981' }}
                        >
                          {member.display_name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{member.display_name}</h3>
                          <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => openStaffDialog(member)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                      {member.bio && (
                        <p className="mt-3 text-sm text-gray-600 line-clamp-2">{member.bio}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Service Dialog */}
      <Dialog open={serviceDialog} onOpenChange={setServiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Add Service'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Service Name *</Label>
              <Input value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={serviceForm.category} onValueChange={(v) => setServiceForm({ ...serviceForm, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Color</Label>
                <Input type="color" value={serviceForm.color} onChange={(e) => setServiceForm({ ...serviceForm, color: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration (min)</Label>
                <Input type="number" value={serviceForm.duration} onChange={(e) => setServiceForm({ ...serviceForm, duration: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Price</Label>
                <Input type="number" step="0.01" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveService} className="bg-pink-600 hover:bg-pink-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Staff Dialog */}
      <Dialog open={staffDialog} onOpenChange={setStaffDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff' : 'Add Staff'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Display Name *</Label>
              <Input value={staffForm.display_name} onChange={(e) => setStaffForm({ ...staffForm, display_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Role</Label>
                <Select value={staffForm.role} onValueChange={(v) => setStaffForm({ ...staffForm, role: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Color</Label>
                <Input type="color" value={staffForm.color} onChange={(e) => setStaffForm({ ...staffForm, color: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Bio</Label>
              <Input value={staffForm.bio} onChange={(e) => setStaffForm({ ...staffForm, bio: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStaffDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveStaff} className="bg-pink-600 hover:bg-pink-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Dialog */}
      <Dialog open={clientDialog} onOpenChange={setClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Edit Client' : 'Add Client'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input value={clientForm.first_name} onChange={(e) => setClientForm({ ...clientForm, first_name: e.target.value })} />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input value={clientForm.last_name} onChange={(e) => setClientForm({ ...clientForm, last_name: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" value={clientForm.date_of_birth} onChange={(e) => setClientForm({ ...clientForm, date_of_birth: e.target.value })} />
              </div>
              <div>
                <Label>Membership</Label>
                <Select value={clientForm.membership_type} onValueChange={(v) => setClientForm({ ...clientForm, membership_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Preferences / Notes</Label>
              <Input value={clientForm.preferences} onChange={(e) => setClientForm({ ...clientForm, preferences: e.target.value })} placeholder="Preferred stylist, products, etc." />
            </div>
            <div>
              <Label>Allergies</Label>
              <Input value={clientForm.allergies} onChange={(e) => setClientForm({ ...clientForm, allergies: e.target.value })} placeholder="Known allergies or sensitivities" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClientDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveClient} className="bg-pink-600 hover:bg-pink-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Dialog */}
      <Dialog open={appointmentDialog} onOpenChange={setAppointmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Client</Label>
              <Select value={appointmentForm.client_id} onValueChange={(v) => setAppointmentForm({ ...appointmentForm, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select client (or walk-in)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Walk-in</SelectItem>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Service *</Label>
              <Select value={appointmentForm.service_id} onValueChange={(v) => setAppointmentForm({ ...appointmentForm, service_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>
                  {services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.duration} min - {formatCurrency(s.price)})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Staff *</Label>
              <Select value={appointmentForm.staff_id} onValueChange={(v) => setAppointmentForm({ ...appointmentForm, staff_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>
                  {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.display_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={appointmentForm.appointment_date} onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_date: e.target.value })} />
              </div>
              <div>
                <Label>Time *</Label>
                <Input type="time" value={appointmentForm.start_time} onChange={(e) => setAppointmentForm({ ...appointmentForm, start_time: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={appointmentForm.notes} onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })} placeholder="Special requests..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAppointmentDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveAppointment} className="bg-pink-600 hover:bg-pink-700">Book</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
