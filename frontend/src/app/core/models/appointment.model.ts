export type AppointmentType = 'checkup' | 'emergency' | 'follow_up' | 'test' | 'other';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
    id: number;
    patientId: number;
    patientName: string;
    doctorName?: string;
    date: Date;
    durationMinutes: number;
    type: AppointmentType;
    status: AppointmentStatus;
    notes?: string;
    location?: string;
}

export interface CreateAppointmentDto {
    patientId: number;
    date: Date;
    durationMinutes: number;
    type: AppointmentType;
    notes?: string;
}
