// Appointments / Scheduling Types

export interface AppointmentType {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  color: string;
  price: number | null;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  organization_id: string;
  appointment_type_id: string | null;
  start_time: string;
  end_time: string;
  timezone: string;
  staff_id: string | null;
  contact_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  title: string | null;
  notes: string | null;
  location: string | null;
  meeting_link: string | null;
  reminder_sent: boolean;
  booked_online: boolean;
  confirmation_token: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  appointment_type?: AppointmentType;
  staff?: { id: string; first_name: string; last_name: string };
  contact?: { id: string; name: string };
}

export interface StaffAvailability {
  id: string;
  employee_id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string; // HH:MM
  end_time: string;
  is_available: boolean;
}

export interface CreateAppointmentInput {
  appointment_type_id?: string;
  start_time: string;
  end_time: string;
  staff_id?: string;
  contact_id?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  title?: string;
  notes?: string;
  location?: string;
  meeting_link?: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}
