'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import * as appointmentsService from '@/services/appointments';
import type { Appointment, AppointmentType } from '@/types/appointments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Plus, Clock, User, MapPin, Video, CheckCircle, XCircle, CalendarDays } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO } from 'date-fns';

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-orange-100 text-orange-700',
};

export default function AppointmentsPage() {
  const { organizationId } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNewDialog, setShowNewDialog] = useState(false);

  // Form state
  const [typeId, setTypeId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const fetchData = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      const [appts, types] = await Promise.all([
        appointmentsService.getAppointments(organizationId, {
          startDate: format(weekStart, 'yyyy-MM-dd'),
          endDate: format(weekEnd, 'yyyy-MM-dd'),
        }),
        appointmentsService.getAppointmentTypes(organizationId),
      ]);
      setAppointments(appts);
      setAppointmentTypes(types);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load appointments', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, selectedDate, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!organizationId || !typeId || !date || !time) {
      toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    const appointmentType = appointmentTypes.find(t => t.id === typeId);
    const duration = appointmentType?.duration_minutes || 30;
    const startTime = new Date(`${date}T${time}`);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    setIsSubmitting(true);
    try {
      await appointmentsService.createAppointment(organizationId, {
        appointment_type_id: typeId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        contact_name: contactName || undefined,
        contact_email: contactEmail || undefined,
        contact_phone: contactPhone || undefined,
        notes: notes || undefined,
      });
      toast({ title: 'Appointment Created' });
      setShowNewDialog(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create appointment', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (appointmentId: string, action: 'confirm' | 'complete' | 'cancel' | 'no_show') => {
    try {
      if (action === 'confirm') await appointmentsService.confirmAppointment(appointmentId);
      else if (action === 'complete') await appointmentsService.completeAppointment(appointmentId);
      else if (action === 'cancel') await appointmentsService.cancelAppointment(appointmentId);
      else if (action === 'no_show') await appointmentsService.markNoShow(appointmentId);
      toast({ title: 'Status Updated' });
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setTypeId('');
    setDate('');
    setTime('');
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setNotes('');
  };

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(a => isSameDay(parseISO(a.start_time), day));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">Schedule and manage appointments</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Appointment
        </Button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>Previous Week</Button>
        <h2 className="text-lg font-semibold">
          {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </h2>
        <Button variant="outline" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>Next Week</Button>
      </div>

      {/* Week View */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map(day => (
          <Card key={day.toISOString()} className={isSameDay(day, new Date()) ? 'ring-2 ring-primary' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                <div>{format(day, 'EEE')}</div>
                <div className="text-2xl">{format(day, 'd')}</div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <div className="h-20 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                </div>
              ) : getAppointmentsForDay(day).length === 0 ? (
                <div className="h-20 flex items-center justify-center text-muted-foreground text-xs">No appointments</div>
              ) : (
                getAppointmentsForDay(day).map(apt => (
                  <div
                    key={apt.id}
                    className="p-2 rounded-lg text-xs"
                    style={{ backgroundColor: apt.appointment_type?.color + '20', borderLeft: `3px solid ${apt.appointment_type?.color || '#6B7280'}` }}
                  >
                    <div className="font-medium">{format(parseISO(apt.start_time), 'h:mm a')}</div>
                    <div className="truncate">{apt.contact_name || apt.appointment_type?.name}</div>
                    <Badge className={`${statusColors[apt.status]} text-[10px] mt-1`}>{apt.status}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Appointments Detail */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {getAppointmentsForDay(new Date()).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No appointments today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {getAppointmentsForDay(new Date()).map(apt => (
                <div key={apt.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: apt.appointment_type?.color + '20' }}>
                      <Clock className="h-5 w-5" style={{ color: apt.appointment_type?.color }} />
                    </div>
                    <div>
                      <div className="font-medium">{apt.appointment_type?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(parseISO(apt.start_time), 'h:mm a')} - {format(parseISO(apt.end_time), 'h:mm a')}
                      </div>
                      {apt.contact_name && (
                        <div className="flex items-center gap-1 text-sm">
                          <User className="h-3 w-3" /> {apt.contact_name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[apt.status]}>{apt.status}</Badge>
                    {apt.status === 'scheduled' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(apt.id, 'confirm')}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Confirm
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(apt.id, 'cancel')}>
                          <XCircle className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                      </>
                    )}
                    {apt.status === 'confirmed' && (
                      <Button size="sm" onClick={() => handleStatusChange(apt.id, 'complete')}>Complete</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Appointment Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Appointment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Appointment Type *</label>
              <Select value={typeId} onValueChange={setTypeId}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.duration_minutes} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Date *</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Time *</label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Contact Name</label>
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNewDialog(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
