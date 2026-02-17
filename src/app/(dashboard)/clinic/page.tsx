'use client';

import { useState, useEffect } from 'react';
import { useOrganization } from '@/hooks/use-organization';
import { clinicService, Patient, Provider, ClinicAppointment, BillingCode, OHIP_CODES } from '@/services/clinic';
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
  Stethoscope,
  Search,
  Plus,
  Calendar,
  Users,
  UserCheck,
  DollarSign,
  FileText,
  Clock,
  Activity,
  Edit,
  CheckCircle,
  XCircle,
  Play,
  AlertCircle,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

const PROVINCES = ['ON', 'BC', 'AB', 'QC', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE', 'NT', 'NU', 'YT'];
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const APPOINTMENT_TYPES = ['New Patient', 'Follow-up', 'Annual Physical', 'Urgent Visit', 'Consultation', 'Procedure'];

export default function ClinicPage() {
  const { organization } = useOrganization();
  const { toast } = useToast();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [appointments, setAppointments] = useState<ClinicAppointment[]>([]);
  const [billingCodes, setBillingCodes] = useState<BillingCode[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');

  // Dialogs
  const [patientDialog, setPatientDialog] = useState(false);
  const [providerDialog, setProviderDialog] = useState(false);
  const [appointmentDialog, setAppointmentDialog] = useState(false);

  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  const [patientForm, setPatientForm] = useState({
    health_card_number: '',
    health_card_version: '',
    health_card_expiry: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    email: '',
    phone: '',
    mobile: '',
    address_line1: '',
    city: '',
    province: 'ON',
    postal_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    allergies: [] as string[],
    medications: [] as string[],
    conditions: [] as string[],
    notes: '',
  });

  const [providerForm, setProviderForm] = useState({
    billing_number: '',
    license_number: '',
    specialty: '',
    title: 'Dr.',
    first_name: '',
    last_name: '',
    credentials: 'MD',
    color: '#3B82F6',
  });

  const [appointmentForm, setAppointmentForm] = useState({
    patient_id: '',
    provider_id: '',
    billing_code_id: '',
    appointment_date: selectedDate,
    start_time: '09:00',
    appointment_type: '',
    reason_for_visit: '',
    is_walk_in: false,
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
      const [patientsData, providersData, appointmentsData, codesData, statsData] = await Promise.all([
        clinicService.getPatients(organization.id),
        clinicService.getProviders(organization.id),
        clinicService.getAppointments(organization.id, selectedDate),
        clinicService.getBillingCodes(organization.id),
        clinicService.getStats(organization.id, selectedDate),
      ]);
      setPatients(patientsData);
      setProviders(providersData);
      setAppointments(appointmentsData);
      setBillingCodes(codesData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load clinic data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize OHIP codes
  const initOHIPCodes = async () => {
    if (!organization?.id) return;
    try {
      await clinicService.initializeOHIPCodes(organization.id);
      toast({ title: 'OHIP codes initialized' });
      loadData();
    } catch (error) {
      toast({ title: 'Error initializing codes', variant: 'destructive' });
    }
  };

  // Patient handlers
  const handleSavePatient = async () => {
    if (!organization?.id) return;
    try {
      const patientData = {
        ...patientForm,
        organization_id: organization.id,
        is_active: true,
      };
      if (editingPatient) {
        await clinicService.updatePatient(editingPatient.id, patientData as Partial<Patient>);
        toast({ title: 'Patient updated' });
      } else {
        await clinicService.createPatient(patientData as Omit<Patient, 'id' | 'created_at' | 'updated_at'>);
        toast({ title: 'Patient added' });
      }
      setPatientDialog(false);
      setEditingPatient(null);
      loadData();
    } catch (error) {
      toast({ title: 'Error saving patient', variant: 'destructive' });
    }
  };

  const openPatientDialog = (patient?: Patient) => {
    if (patient) {
      setEditingPatient(patient);
      setPatientForm({
        health_card_number: patient.health_card_number || '',
        health_card_version: patient.health_card_version || '',
        health_card_expiry: patient.health_card_expiry || '',
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth,
        gender: patient.gender || '',
        email: patient.email || '',
        phone: patient.phone || '',
        mobile: patient.mobile || '',
        address_line1: patient.address_line1 || '',
        city: patient.city || '',
        province: patient.province || 'ON',
        postal_code: patient.postal_code || '',
        emergency_contact_name: patient.emergency_contact_name || '',
        emergency_contact_phone: patient.emergency_contact_phone || '',
        allergies: patient.allergies || [],
        medications: patient.medications || [],
        conditions: patient.conditions || [],
        notes: patient.notes || '',
      });
    } else {
      setEditingPatient(null);
      setPatientForm({
        health_card_number: '',
        health_card_version: '',
        health_card_expiry: '',
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: '',
        email: '',
        phone: '',
        mobile: '',
        address_line1: '',
        city: '',
        province: 'ON',
        postal_code: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        allergies: [],
        medications: [],
        conditions: [],
        notes: '',
      });
    }
    setPatientDialog(true);
  };

  // Provider handlers
  const handleSaveProvider = async () => {
    if (!organization?.id) return;
    try {
      if (editingProvider) {
        await clinicService.updateProvider(editingProvider.id, providerForm as Partial<Provider>);
        toast({ title: 'Provider updated' });
      } else {
        await clinicService.createProvider({ ...providerForm, organization_id: organization.id, is_active: true });
        toast({ title: 'Provider added' });
      }
      setProviderDialog(false);
      setEditingProvider(null);
      loadData();
    } catch (error) {
      toast({ title: 'Error saving provider', variant: 'destructive' });
    }
  };

  const openProviderDialog = (provider?: Provider) => {
    if (provider) {
      setEditingProvider(provider);
      setProviderForm({
        billing_number: provider.billing_number || '',
        license_number: provider.license_number || '',
        specialty: provider.specialty || '',
        title: provider.title || 'Dr.',
        first_name: provider.first_name,
        last_name: provider.last_name,
        credentials: provider.credentials || 'MD',
        color: provider.color || '#3B82F6',
      });
    } else {
      setEditingProvider(null);
      setProviderForm({
        billing_number: '',
        license_number: '',
        specialty: '',
        title: 'Dr.',
        first_name: '',
        last_name: '',
        credentials: 'MD',
        color: '#3B82F6',
      });
    }
    setProviderDialog(true);
  };

  // Appointment handlers
  const handleSaveAppointment = async () => {
    if (!organization?.id) return;
    const billingCode = billingCodes.find(c => c.id === appointmentForm.billing_code_id);
    const duration = billingCode?.duration_minutes || 30;

    const [hours, mins] = appointmentForm.start_time.split(':').map(Number);
    const endMins = hours * 60 + mins + duration;
    const endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;

    try {
      await clinicService.createAppointment({
        organization_id: organization.id,
        patient_id: appointmentForm.patient_id,
        provider_id: appointmentForm.provider_id,
        billing_code_id: appointmentForm.billing_code_id || undefined,
        appointment_date: appointmentForm.appointment_date,
        start_time: appointmentForm.start_time,
        end_time: endTime,
        status: 'scheduled',
        appointment_type: appointmentForm.appointment_type,
        reason_for_visit: appointmentForm.reason_for_visit,
        is_walk_in: appointmentForm.is_walk_in,
        reminder_sent: false,
      });
      toast({ title: 'Appointment booked' });
      setAppointmentDialog(false);
      loadData();
    } catch (error) {
      toast({ title: 'Error booking appointment', variant: 'destructive' });
    }
  };

  const updateAppointmentStatus = async (id: string, status: ClinicAppointment['status']) => {
    try {
      if (status === 'checked_in') {
        await clinicService.checkInPatient(id);
      } else if (status === 'in_progress') {
        await clinicService.startAppointment(id);
      } else if (status === 'completed') {
        await clinicService.completeAppointment(id);
      } else if (status === 'cancelled') {
        await clinicService.cancelAppointment(id);
      } else {
        await clinicService.updateAppointmentStatus(id, status);
      }
      toast({ title: `Appointment ${status.replace('_', ' ')}` });
      loadData();
    } catch (error) {
      toast({ title: 'Error updating appointment', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-700',
      confirmed: 'bg-purple-100 text-purple-700',
      checked_in: 'bg-amber-100 text-amber-700',
      in_progress: 'bg-cyan-100 text-cyan-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-100 text-gray-700',
      no_show: 'bg-red-100 text-red-700',
    };
    return <Badge className={colors[status] || 'bg-gray-100'}>{status.replace('_', ' ')}</Badge>;
  };

  const filteredPatients = patients.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.first_name.toLowerCase().includes(q) || p.last_name.toLowerCase().includes(q) || p.health_card_number?.includes(q) || p.phone?.includes(q);
  });

  const filteredAppointments = appointments.filter(a => {
    if (selectedProvider !== 'all' && a.provider_id !== selectedProvider) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-green-600" />
            Medical Clinic
          </h1>
          <p className="text-gray-600">Patient management, appointments, OHIP billing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openPatientDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            New Patient
          </Button>
          <Button onClick={() => { setAppointmentForm({ ...appointmentForm, appointment_date: selectedDate }); setAppointmentDialog(true); }} className="bg-green-600 hover:bg-green-700">
            <Calendar className="w-4 h-4 mr-2" />
            Book Appointment
          </Button>
        </div>
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
                  <p className="text-xs text-gray-500">Today</p>
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
                <Activity className="w-8 h-8 text-cyan-500" />
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
                  <p className="text-2xl font-bold">{stats.totalPatients}</p>
                  <p className="text-xs text-gray-500">Total Patients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.pendingBillingsTotal)}</p>
                  <p className="text-xs text-gray-500">Pending Bills</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule">Today&apos;s Schedule</TabsTrigger>
          <TabsTrigger value="patients">Patients ({patients.length})</TabsTrigger>
          <TabsTrigger value="providers">Providers ({providers.length})</TabsTrigger>
          <TabsTrigger value="billing">Billing Codes ({billingCodes.length})</TabsTrigger>
        </TabsList>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-40"
                  />
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Providers</SelectItem>
                      {providers.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title} {p.first_name} {p.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-gray-500">{formatDate(selectedDate)}</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Health Card</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell className="font-mono">
                        {apt.start_time?.slice(0, 5)}
                      </TableCell>
                      <TableCell>
                        {apt.patient && (
                          <div>
                            <p className="font-medium">{apt.patient.first_name} {apt.patient.last_name}</p>
                            <p className="text-xs text-gray-500">{apt.patient.phone}</p>
                          </div>
                        )}
                        {apt.is_walk_in && <Badge className="ml-2 bg-orange-100 text-orange-700">Walk-in</Badge>}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {apt.patient?.health_card_number || '—'}
                      </TableCell>
                      <TableCell>{apt.appointment_type || '—'}</TableCell>
                      <TableCell>
                        {apt.provider && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: apt.provider.color || '#3B82F6' }} />
                            {apt.provider.title} {apt.provider.last_name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(apt.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {apt.status === 'scheduled' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}>
                                Confirm
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => updateAppointmentStatus(apt.id, 'checked_in')}>
                                Check In
                              </Button>
                            </>
                          )}
                          {apt.status === 'confirmed' && (
                            <Button size="sm" variant="outline" onClick={() => updateAppointmentStatus(apt.id, 'checked_in')}>
                              Check In
                            </Button>
                          )}
                          {apt.status === 'checked_in' && (
                            <Button size="sm" variant="outline" onClick={() => updateAppointmentStatus(apt.id, 'in_progress')}>
                              <Play className="w-4 h-4 mr-1" /> Start
                            </Button>
                          )}
                          {apt.status === 'in_progress' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateAppointmentStatus(apt.id, 'completed')}>
                              <CheckCircle className="w-4 h-4 mr-1" /> Complete
                            </Button>
                          )}
                          {['scheduled', 'confirmed'].includes(apt.status) && (
                            <Button size="sm" variant="ghost" onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}>
                              <XCircle className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAppointments.length === 0 && (
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

        {/* Patients Tab */}
        <TabsContent value="patients">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
                <Button onClick={() => openPatientDialog()} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Patient
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Health Card</TableHead>
                    <TableHead>DOB</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Conditions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                          <p className="text-xs text-gray-500">{patient.gender}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {patient.health_card_number || '—'}
                          {patient.health_card_version && <span className="text-gray-400"> {patient.health_card_version}</span>}
                        </div>
                      </TableCell>
                      <TableCell>{patient.date_of_birth ? formatDate(patient.date_of_birth) : '—'}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {patient.phone && <p>{patient.phone}</p>}
                          {patient.email && <p className="text-gray-500">{patient.email}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {patient.allergies && patient.allergies.length > 0 && (
                            <Badge className="bg-red-100 text-red-700">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Allergies
                            </Badge>
                          )}
                          {patient.conditions && patient.conditions.length > 0 && (
                            <Badge className="bg-yellow-100 text-yellow-700">
                              {patient.conditions.length} conditions
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openPatientDialog(patient)}>
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

        {/* Providers Tab */}
        <TabsContent value="providers">
          <Card>
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle>Healthcare Providers</CardTitle>
                <CardDescription>Physicians and practitioners</CardDescription>
              </div>
              <Button onClick={() => openProviderDialog()} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Provider
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.map((provider) => (
                  <Card key={provider.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                          style={{ backgroundColor: provider.color || '#3B82F6' }}
                        >
                          {provider.first_name.charAt(0)}{provider.last_name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{provider.title} {provider.first_name} {provider.last_name}, {provider.credentials}</h3>
                          <p className="text-sm text-gray-500">{provider.specialty}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => openProviderDialog(provider)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="mt-3 text-sm text-gray-500">
                        {provider.billing_number && <p>OHIP Billing: {provider.billing_number}</p>}
                        {provider.license_number && <p>License: {provider.license_number}</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {providers.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No providers yet. Add your first provider.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Codes Tab */}
        <TabsContent value="billing">
          <Card>
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle>OHIP Billing Codes</CardTitle>
                <CardDescription>Ontario Health Insurance Plan fee codes</CardDescription>
              </div>
              {billingCodes.length === 0 && (
                <Button onClick={initOHIPCodes} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Initialize OHIP Codes
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Fee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono font-medium">{code.code}</TableCell>
                      <TableCell>{code.description}</TableCell>
                      <TableCell>{code.category || '—'}</TableCell>
                      <TableCell>{code.duration_minutes ? `${code.duration_minutes} min` : '—'}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(code.fee)}</TableCell>
                    </TableRow>
                  ))}
                  {billingCodes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No billing codes configured. Click &quot;Initialize OHIP Codes&quot; to add common codes.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Patient Dialog */}
      <Dialog open={patientDialog} onOpenChange={setPatientDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPatient ? 'Edit Patient' : 'New Patient'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Health Card */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Health Card # *</Label>
                <Input value={patientForm.health_card_number} onChange={(e) => setPatientForm({ ...patientForm, health_card_number: e.target.value })} placeholder="1234-567-890" />
              </div>
              <div>
                <Label>Version</Label>
                <Input value={patientForm.health_card_version} onChange={(e) => setPatientForm({ ...patientForm, health_card_version: e.target.value.toUpperCase() })} placeholder="AB" maxLength={2} />
              </div>
              <div>
                <Label>Expiry</Label>
                <Input type="date" value={patientForm.health_card_expiry} onChange={(e) => setPatientForm({ ...patientForm, health_card_expiry: e.target.value })} />
              </div>
            </div>

            {/* Name & DOB */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input value={patientForm.first_name} onChange={(e) => setPatientForm({ ...patientForm, first_name: e.target.value })} />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input value={patientForm.last_name} onChange={(e) => setPatientForm({ ...patientForm, last_name: e.target.value })} />
              </div>
              <div>
                <Label>Date of Birth *</Label>
                <Input type="date" value={patientForm.date_of_birth} onChange={(e) => setPatientForm({ ...patientForm, date_of_birth: e.target.value })} />
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Gender</Label>
                <Select value={patientForm.gender} onValueChange={(v) => setPatientForm({ ...patientForm, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={patientForm.phone} onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={patientForm.email} onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })} />
              </div>
            </div>

            {/* Address */}
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label>Address</Label>
                <Input value={patientForm.address_line1} onChange={(e) => setPatientForm({ ...patientForm, address_line1: e.target.value })} />
              </div>
              <div>
                <Label>City</Label>
                <Input value={patientForm.city} onChange={(e) => setPatientForm({ ...patientForm, city: e.target.value })} />
              </div>
              <div>
                <Label>Province</Label>
                <Select value={patientForm.province} onValueChange={(v) => setPatientForm({ ...patientForm, province: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Emergency Contact Name</Label>
                <Input value={patientForm.emergency_contact_name} onChange={(e) => setPatientForm({ ...patientForm, emergency_contact_name: e.target.value })} />
              </div>
              <div>
                <Label>Emergency Contact Phone</Label>
                <Input value={patientForm.emergency_contact_phone} onChange={(e) => setPatientForm({ ...patientForm, emergency_contact_phone: e.target.value })} />
              </div>
            </div>

            {/* Medical Info */}
            <div>
              <Label>Allergies (comma-separated)</Label>
              <Input value={patientForm.allergies.join(', ')} onChange={(e) => setPatientForm({ ...patientForm, allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Penicillin, Latex" />
            </div>
            <div>
              <Label>Current Medications (comma-separated)</Label>
              <Input value={patientForm.medications.join(', ')} onChange={(e) => setPatientForm({ ...patientForm, medications: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Metformin 500mg, Lisinopril 10mg" />
            </div>
            <div>
              <Label>Conditions (comma-separated)</Label>
              <Input value={patientForm.conditions.join(', ')} onChange={(e) => setPatientForm({ ...patientForm, conditions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Type 2 Diabetes, Hypertension" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPatientDialog(false)}>Cancel</Button>
            <Button onClick={handleSavePatient} className="bg-green-600 hover:bg-green-700">
              {editingPatient ? 'Update' : 'Add Patient'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Provider Dialog */}
      <Dialog open={providerDialog} onOpenChange={setProviderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProvider ? 'Edit Provider' : 'Add Provider'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Title</Label>
                <Select value={providerForm.title} onValueChange={(v) => setProviderForm({ ...providerForm, title: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dr.">Dr.</SelectItem>
                    <SelectItem value="NP">NP</SelectItem>
                    <SelectItem value="PA">PA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>First Name *</Label>
                <Input value={providerForm.first_name} onChange={(e) => setProviderForm({ ...providerForm, first_name: e.target.value })} />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input value={providerForm.last_name} onChange={(e) => setProviderForm({ ...providerForm, last_name: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Credentials</Label>
                <Input value={providerForm.credentials} onChange={(e) => setProviderForm({ ...providerForm, credentials: e.target.value })} placeholder="MD, DO, NP" />
              </div>
              <div>
                <Label>Specialty</Label>
                <Input value={providerForm.specialty} onChange={(e) => setProviderForm({ ...providerForm, specialty: e.target.value })} placeholder="Family Medicine" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>OHIP Billing #</Label>
                <Input value={providerForm.billing_number} onChange={(e) => setProviderForm({ ...providerForm, billing_number: e.target.value })} />
              </div>
              <div>
                <Label>License #</Label>
                <Input value={providerForm.license_number} onChange={(e) => setProviderForm({ ...providerForm, license_number: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Calendar Color</Label>
              <Input type="color" value={providerForm.color} onChange={(e) => setProviderForm({ ...providerForm, color: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProviderDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveProvider} className="bg-green-600 hover:bg-green-700">Save</Button>
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
              <Label>Patient *</Label>
              <Select value={appointmentForm.patient_id} onValueChange={(v) => setAppointmentForm({ ...appointmentForm, patient_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Provider *</Label>
              <Select value={appointmentForm.provider_id} onValueChange={(v) => setAppointmentForm({ ...appointmentForm, provider_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>
                  {providers.map((p) => <SelectItem key={p.id} value={p.id}>{p.title} {p.first_name} {p.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Visit Type</Label>
              <Select value={appointmentForm.appointment_type} onValueChange={(v) => setAppointmentForm({ ...appointmentForm, appointment_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Billing Code</Label>
              <Select value={appointmentForm.billing_code_id} onValueChange={(v) => setAppointmentForm({ ...appointmentForm, billing_code_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select code" /></SelectTrigger>
                <SelectContent>
                  {billingCodes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} - {c.description} ({formatCurrency(c.fee)})
                    </SelectItem>
                  ))}
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
              <Label>Reason for Visit</Label>
              <Input value={appointmentForm.reason_for_visit} onChange={(e) => setAppointmentForm({ ...appointmentForm, reason_for_visit: e.target.value })} placeholder="Chief complaint or reason..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAppointmentDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveAppointment} className="bg-green-600 hover:bg-green-700">Book</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
