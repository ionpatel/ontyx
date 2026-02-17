// Appointments / Scheduling Service
import { createClient } from '@/lib/supabase/client';
import type { Appointment, AppointmentType, StaffAvailability, CreateAppointmentInput, TimeSlot } from '@/types/appointments';
import { addMinutes, format, parseISO, isWithinInterval, eachDayOfInterval, getDay } from 'date-fns';

const supabase = createClient();

// Appointment Types
export async function getAppointmentTypes(organizationId: string): Promise<AppointmentType[]> {
  const { data, error } = await supabase
    .from('appointment_types')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function createAppointmentType(
  organizationId: string,
  input: Partial<AppointmentType>
): Promise<AppointmentType> {
  const { data, error } = await supabase
    .from('appointment_types')
    .insert({ organization_id: organizationId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Appointments
export async function getAppointments(
  organizationId: string,
  options?: { staffId?: string; startDate?: string; endDate?: string; status?: string }
): Promise<Appointment[]> {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      appointment_type:appointment_types(id, name, color, duration_minutes),
      staff:employees(id, first_name, last_name),
      contact:contacts(id, name)
    `)
    .eq('organization_id', organizationId)
    .order('start_time', { ascending: true });

  if (options?.staffId) query = query.eq('staff_id', options.staffId);
  if (options?.startDate) query = query.gte('start_time', options.startDate);
  if (options?.endDate) query = query.lte('start_time', options.endDate);
  if (options?.status) query = query.eq('status', options.status);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getAppointment(appointmentId: string): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      appointment_type:appointment_types(*),
      staff:employees(id, first_name, last_name),
      contact:contacts(id, name, email, phone)
    `)
    .eq('id', appointmentId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createAppointment(
  organizationId: string,
  input: CreateAppointmentInput
): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      organization_id: organizationId,
      appointment_type_id: input.appointment_type_id,
      start_time: input.start_time,
      end_time: input.end_time,
      staff_id: input.staff_id,
      contact_id: input.contact_id,
      contact_name: input.contact_name,
      contact_email: input.contact_email,
      contact_phone: input.contact_phone,
      title: input.title,
      notes: input.notes,
      location: input.location,
      meeting_link: input.meeting_link,
      status: 'scheduled',
      confirmation_token: crypto.randomUUID(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAppointment(appointmentId: string, updates: Partial<Appointment>): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', appointmentId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function cancelAppointment(appointmentId: string): Promise<Appointment> {
  return updateAppointment(appointmentId, { status: 'cancelled' });
}

export async function confirmAppointment(appointmentId: string): Promise<Appointment> {
  return updateAppointment(appointmentId, { status: 'confirmed' });
}

export async function completeAppointment(appointmentId: string): Promise<Appointment> {
  return updateAppointment(appointmentId, { status: 'completed' });
}

export async function markNoShow(appointmentId: string): Promise<Appointment> {
  return updateAppointment(appointmentId, { status: 'no_show' });
}

// Staff Availability
export async function getStaffAvailability(employeeId: string): Promise<StaffAvailability[]> {
  const { data, error } = await supabase
    .from('staff_availability')
    .select('*')
    .eq('employee_id', employeeId)
    .order('day_of_week');
  if (error) throw error;
  return data || [];
}

export async function setStaffAvailability(
  employeeId: string,
  availability: Omit<StaffAvailability, 'id' | 'employee_id'>[]
): Promise<StaffAvailability[]> {
  // Delete existing
  await supabase.from('staff_availability').delete().eq('employee_id', employeeId);

  // Insert new
  const { data, error } = await supabase
    .from('staff_availability')
    .insert(availability.map(a => ({ employee_id: employeeId, ...a })))
    .select();
  if (error) throw error;
  return data || [];
}

// Get available time slots
export async function getAvailableSlots(
  organizationId: string,
  date: string,
  options: { staffId?: string; appointmentTypeId?: string; duration?: number }
): Promise<TimeSlot[]> {
  const slots: TimeSlot[] = [];
  const targetDate = parseISO(date);
  const dayOfWeek = getDay(targetDate);

  // Get appointment type duration
  let duration = options.duration || 30;
  if (options.appointmentTypeId) {
    const { data: type } = await supabase
      .from('appointment_types')
      .select('duration_minutes, buffer_before_minutes, buffer_after_minutes')
      .eq('id', options.appointmentTypeId)
      .single();
    if (type) {
      duration = type.duration_minutes + (type.buffer_before_minutes || 0) + (type.buffer_after_minutes || 0);
    }
  }

  // Get staff availability for this day
  let availabilityQuery = supabase
    .from('staff_availability')
    .select('*, employee:employees(id, first_name, last_name)')
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true);

  if (options.staffId) {
    availabilityQuery = availabilityQuery.eq('employee_id', options.staffId);
  }

  const { data: availabilities } = await availabilityQuery;

  // Get existing appointments for the day
  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;
  
  const { data: existingAppointments } = await supabase
    .from('appointments')
    .select('start_time, end_time, staff_id')
    .eq('organization_id', organizationId)
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .not('status', 'in', '("cancelled")');

  // Generate slots for each available staff
  availabilities?.forEach(avail => {
    const [startHour, startMin] = avail.start_time.split(':').map(Number);
    const [endHour, endMin] = avail.end_time.split(':').map(Number);

    let currentTime = new Date(targetDate);
    currentTime.setHours(startHour, startMin, 0, 0);

    const endTime = new Date(targetDate);
    endTime.setHours(endHour, endMin, 0, 0);

    while (currentTime < endTime) {
      const slotEnd = addMinutes(currentTime, duration);
      if (slotEnd > endTime) break;

      // Check if slot conflicts with existing appointments
      const hasConflict = existingAppointments?.some(apt => {
        if (options.staffId && apt.staff_id !== options.staffId) return false;
        const aptStart = parseISO(apt.start_time);
        const aptEnd = parseISO(apt.end_time);
        return (
          isWithinInterval(currentTime, { start: aptStart, end: aptEnd }) ||
          isWithinInterval(slotEnd, { start: aptStart, end: aptEnd }) ||
          (currentTime <= aptStart && slotEnd >= aptEnd)
        );
      });

      slots.push({
        start: currentTime.toISOString(),
        end: slotEnd.toISOString(),
        available: !hasConflict,
      });

      currentTime = addMinutes(currentTime, 30); // 30-min increments
    }
  });

  return slots;
}

// Public booking (for online scheduling)
export async function bookAppointmentPublic(
  organizationId: string,
  input: CreateAppointmentInput
): Promise<Appointment> {
  const appointment = await createAppointment(organizationId, {
    ...input,
    booked_online: true,
  } as any);

  // TODO: Send confirmation email

  return appointment;
}
