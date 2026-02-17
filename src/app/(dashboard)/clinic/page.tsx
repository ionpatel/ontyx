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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarView } from '@/components/calendar-view';
import {
  Stethoscope, Calendar, Clock, User, Users, DollarSign, Plus,
  Phone, Mail, FileText, CreditCard, Heart, Activity, Pill,
  ClipboardList, Bell, CheckCircle, AlertCircle, Search
} from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import { cn } from '@/lib/utils';

interface Patient {
  id: string;
  health_card: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  address: string;
  emergency_contact?: string;
  emergency_phone?: string;
  allergies?: string[];
  medications?: string[];
  conditions?: string[];
  last_visit?: string;
  notes?: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string;
  provider_id: string;
  provider_name: string;
  service_code: string;
  service_name: string;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  reason?: string;
  notes?: string;
  billing_code?: string;
  fee: number;
}

interface BillingCode {
  code: string;
  description: string;
  fee: number;
  province: string;
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  checked_in: 'bg-purple-100 text-purple-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-orange-100 text-orange-700',
};

// OHIP billing codes (Ontario)
const ohipCodes: BillingCode[] = [
  { code: 'A001A', description: 'Minor Assessment', fee: 33.70, province: 'ON' },
  { code: 'A003A', description: 'General Assessment', fee: 77.20, province: 'ON' },
  { code: 'A004A', description: 'General Re-Assessment', fee: 38.35, province: 'ON' },
  { code: 'A007A', description: 'Intermediate Assessment', fee: 33.70, province: 'ON' },
  { code: 'A008A', description: 'Mini Assessment', fee: 22.25, province: 'ON' },
  { code: 'K130A', description: 'Counselling - Mental Health', fee: 61.30, province: 'ON' },
  { code: 'K131A', description: 'Counselling - Other', fee: 25.00, province: 'ON' },
  { code: 'G372A', description: 'ECG - Interpretation', fee: 15.00, province: 'ON' },
  { code: 'G489A', description: 'Injection IM/SC', fee: 6.65, province: 'ON' },
];

// Demo data
const demoPatients: Patient[] = [
  {
    id: 'p1',
    health_card: '1234-567-890-AB',
    first_name: 'Robert',
    last_name: 'Chen',
    date_of_birth: '1985-03-15',
    gender: 'male',
    phone: '416-555-0101',
    email: 'robert.chen@email.com',
    address: '123 Maple Street, Toronto, ON M5V 1A1',
    allergies: ['Penicillin', 'Sulfa'],
    medications: ['Metformin 500mg', 'Lisinopril 10mg'],
    conditions: ['Type 2 Diabetes', 'Hypertension'],
    last_visit: '2026-02-10',
  },
  {
    id: 'p2',
    health_card: '9876-543-210-CD',
    first_name: 'Lisa',
    last_name: 'Park',
    date_of_birth: '1992-07-22',
    gender: 'female',
    phone: '416-555-0102',
    email: 'lisa.park@email.com',
    address: '456 Oak Avenue, Toronto, ON M5V 2B2',
    emergency_contact: 'James Park',
    emergency_phone: '416-555-0103',
    last_visit: '2026-01-28',
  },
  {
    id: 'p3',
    health_card: '5555-666-777-EF',
    first_name: 'Michael',
    last_name: 'Brown',
    date_of_birth: '1978-11-08',
    gender: 'male',
    phone: '416-555-0104',
    email: 'm.brown@email.com',
    address: '789 Pine Road, Toronto, ON M5V 3C3',
    allergies: ['Latex'],
    conditions: ['Asthma'],
    medications: ['Ventolin PRN'],
    last_visit: '2026-02-05',
  },
];

const demoAppointments: Appointment[] = [
  { id: 'a1', patient_id: 'p1', patient_name: 'Robert Chen', provider_id: 'dr1', provider_name: 'Dr. Sarah Williams', service_code: 'A003A', service_name: 'General Assessment', date: '2026-02-17', time: '09:00', duration: 30, status: 'completed', billing_code: 'A003A', fee: 77.20, reason: 'Diabetes follow-up' },
  { id: 'a2', patient_id: 'p2', patient_name: 'Lisa Park', provider_id: 'dr1', provider_name: 'Dr. Sarah Williams', service_code: 'A001A', service_name: 'Minor Assessment', date: '2026-02-17', time: '09:30', duration: 15, status: 'checked_in', billing_code: 'A001A', fee: 33.70, reason: 'Cold symptoms' },
  { id: 'a3', patient_id: 'p3', patient_name: 'Michael Brown', provider_id: 'dr1', provider_name: 'Dr. Sarah Williams', service_code: 'A004A', service_name: 'General Re-Assessment', date: '2026-02-17', time: '10:00', duration: 20, status: 'scheduled', billing_code: 'A004A', fee: 38.35, reason: 'Asthma check' },
  { id: 'a4', patient_id: 'p1', patient_name: 'Robert Chen', provider_id: 'dr2', provider_name: 'Dr. James Lee', service_code: 'K130A', service_name: 'Mental Health Counselling', date: '2026-02-18', time: '14:00', duration: 60, status: 'scheduled', billing_code: 'K130A', fee: 61.30 },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);

export default function ClinicPage() {
  const { organizationId } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('schedule');
  const [patients, setPatients] = useState<Patient[]>(demoPatients);
  const [appointments, setAppointments] = useState<Appointment[]>(demoAppointments);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showNewAppointment, setShowNewAppointment] = useState(false);

  const todayAppointments = appointments.filter(a => a.date === '2026-02-17');
  
  const stats = {
    todayAppointments: todayAppointments.length,
    checkedIn: todayAppointments.filter(a => a.status === 'checked_in').length,
    completed: todayAppointments.filter(a => a.status === 'completed').length,
    totalPatients: patients.length,
    todayBillings: todayAppointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + a.fee, 0),
  };

  const checkInPatient = (id: string) => {
    setAppointments(appointments.map(a =>
      a.id === id ? { ...a, status: 'checked_in' } : a
    ));
    toast({ title: 'Patient checked in' });
  };

  const startAppointment = (id: string) => {
    setAppointments(appointments.map(a =>
      a.id === id ? { ...a, status: 'in_progress' } : a
    ));
    toast({ title: 'Appointment started' });
  };

  const completeAppointment = (id: string) => {
    setAppointments(appointments.map(a =>
      a.id === id ? { ...a, status: 'completed' } : a
    ));
    toast({ title: 'Appointment completed' });
  };

  const getAge = (dob: string) => differenceInYears(new Date(), new Date(dob));

  const calendarEvents = appointments.map(apt => ({
    id: apt.id,
    title: `${apt.patient_name} - ${apt.service_name}`,
    start: new Date(`${apt.date}T${apt.time}`),
    color: apt.status === 'completed' ? 'bg-green-500' : 
           apt.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500',
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Stethoscope className="h-6 w-6" />
            Clinic Management
          </h1>
          <p className="text-muted-foreground">Patient records, appointments, and OHIP billing</p>
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
                <div className="text-2xl font-bold">{stats.todayAppointments}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <ClipboardList className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Checked In</div>
                <div className="text-2xl font-bold text-purple-600">{stats.checkedIn}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Completed</div>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Patients</div>
                <div className="text-2xl font-bold">{stats.totalPatients}</div>
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
                <div className="text-sm text-muted-foreground">Today's Billings</div>
                <div className="text-xl font-bold text-green-600">{formatCurrency(stats.todayBillings)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="schedule">Today's Schedule</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="billing">Billing Codes</TabsTrigger>
        </TabsList>

        {/* Today's Schedule */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Today's Appointments — {format(new Date(), 'EEEE, MMMM d, yyyy')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayAppointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No appointments scheduled for today
                  </div>
                ) : (
                  todayAppointments.map(apt => {
                    const patient = patients.find(p => p.id === apt.patient_id);
                    return (
                      <div key={apt.id} className={cn(
                        'flex items-center gap-4 p-4 rounded-lg border',
                        apt.status === 'in_progress' && 'bg-yellow-50 border-yellow-200',
                        apt.status === 'checked_in' && 'bg-purple-50 border-purple-200'
                      )}>
                        <div className="text-center min-w-[60px]">
                          <div className="text-2xl font-bold">{apt.time.split(':')[0]}</div>
                          <div className="text-sm text-muted-foreground">:{apt.time.split(':')[1]}</div>
                        </div>
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>{apt.patient_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{apt.patient_name}</span>
                            <Badge className={statusColors[apt.status]}>{apt.status.replace('_', ' ')}</Badge>
                            {patient?.allergies && patient.allergies.length > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" /> Allergies
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {apt.service_name} ({apt.billing_code}) • {apt.provider_name}
                          </div>
                          {apt.reason && (
                            <div className="text-sm text-muted-foreground">
                              Reason: {apt.reason}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">{formatCurrency(apt.fee)}</div>
                          <div className="text-xs text-muted-foreground">{apt.duration} min</div>
                        </div>
                        <div className="flex gap-2">
                          {apt.status === 'scheduled' && (
                            <Button size="sm" variant="outline" onClick={() => checkInPatient(apt.id)}>
                              Check In
                            </Button>
                          )}
                          {apt.status === 'checked_in' && (
                            <Button size="sm" onClick={() => startAppointment(apt.id)}>
                              Start
                            </Button>
                          )}
                          {apt.status === 'in_progress' && (
                            <Button size="sm" onClick={() => completeAppointment(apt.id)}>
                              Complete
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => {
                            setSelectedPatient(patient || null);
                          }}>
                            Chart
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar */}
        <TabsContent value="calendar">
          <CalendarView events={calendarEvents} />
        </TabsContent>

        {/* Patients */}
        <TabsContent value="patients">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or health card..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" /> Add Patient
                </Button>
              </div>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Health Card</TableHead>
                  <TableHead>DOB / Age</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.filter(p => 
                  `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  p.health_card.includes(searchTerm)
                ).map(patient => (
                  <TableRow key={patient.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPatient(patient)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{patient.first_name[0]}{patient.last_name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{patient.first_name} {patient.last_name}</div>
                          <div className="text-sm text-muted-foreground capitalize">{patient.gender}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{patient.health_card}</TableCell>
                    <TableCell>
                      <div>{format(new Date(patient.date_of_birth), 'MMM d, yyyy')}</div>
                      <div className="text-sm text-muted-foreground">{getAge(patient.date_of_birth)} years old</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{patient.phone}</div>
                      <div className="text-sm text-muted-foreground">{patient.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {patient.allergies && patient.allergies.length > 0 && (
                          <Badge variant="destructive" className="text-xs">Allergies</Badge>
                        )}
                        {patient.conditions?.slice(0, 2).map((c, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {patient.last_visit ? format(new Date(patient.last_visit), 'MMM d, yyyy') : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">View Chart</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Billing Codes */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                OHIP Billing Codes (Ontario)
              </CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ohipCodes.map(code => (
                  <TableRow key={code.code}>
                    <TableCell className="font-mono font-bold">{code.code}</TableCell>
                    <TableCell>{code.description}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(code.fee)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Patient Detail Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{selectedPatient?.first_name[0]}{selectedPatient?.last_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div>{selectedPatient?.first_name} {selectedPatient?.last_name}</div>
                <div className="text-sm font-normal text-muted-foreground">
                  {selectedPatient?.health_card} • {selectedPatient && getAge(selectedPatient.date_of_birth)} years old
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {selectedPatient.phone}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {selectedPatient.email}
                </div>
              </div>

              {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                    <AlertCircle className="h-4 w-4" /> Allergies
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedPatient.allergies.map((allergy, i) => (
                      <Badge key={i} variant="destructive">{allergy}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedPatient.conditions && selectedPatient.conditions.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Medical Conditions</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedPatient.conditions.map((condition, i) => (
                      <Badge key={i} variant="outline">
                        <Heart className="h-3 w-3 mr-1" /> {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedPatient.medications && selectedPatient.medications.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Current Medications</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedPatient.medications.map((med, i) => (
                      <Badge key={i} variant="secondary">
                        <Pill className="h-3 w-3 mr-1" /> {med}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedPatient.emergency_contact && (
                <div className="p-3 bg-muted rounded-lg">
                  <Label className="text-muted-foreground">Emergency Contact</Label>
                  <div className="font-medium">{selectedPatient.emergency_contact}</div>
                  <div className="text-sm text-muted-foreground">{selectedPatient.emergency_phone}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPatient(null)}>Close</Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" /> Full Chart
            </Button>
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
              <Label>Patient</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.health_card})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Service / Billing Code</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select service..." />
                </SelectTrigger>
                <SelectContent>
                  {ohipCodes.map(code => (
                    <SelectItem key={code.code} value={code.code}>
                      {code.code} - {code.description} ({formatCurrency(code.fee)})
                    </SelectItem>
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
              <Label>Reason for Visit</Label>
              <Textarea placeholder="Brief description..." />
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
