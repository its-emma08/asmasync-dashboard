import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Appointment, CreateAppointmentDto } from '../models/appointment.model';

@Injectable({
    providedIn: 'root'
})
export class AppointmentService {

    // Mock Data
    private appointments: Appointment[] = [
        {
            id: 1,
            patientId: 101,
            patientName: 'Juan Pérez',
            doctorName: 'Dr. Smith',
            date: new Date(new Date().setHours(9, 0, 0, 0)), // Today 9 AM
            durationMinutes: 30,
            type: 'checkup',
            status: 'confirmed',
            notes: 'Revisión semestral',
            location: 'Consultorio 3'
        },
        {
            id: 2,
            patientId: 102,
            patientName: 'Maria Rodriguez',
            doctorName: 'Dr. Smith',
            date: new Date(new Date().setHours(10, 30, 0, 0)), // Today 10:30 AM
            durationMinutes: 45,
            type: 'follow_up',
            status: 'scheduled',
            notes: 'Seguimiento post-crisis',
            location: 'Consultorio 3'
        },
        {
            id: 3,
            patientId: 103,
            patientName: 'Carlos López',
            doctorName: 'Dra. Jones',
            date: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
            durationMinutes: 30,
            type: 'test',
            status: 'scheduled',
            notes: 'Espirometría',
            location: 'Laboratorio'
        }
    ];

    constructor() { }

    getAppointments(startDate: Date, endDate: Date): Observable<Appointment[]> {
        // Filter by range
        const filtered = this.appointments.filter(a =>
            a.date >= startDate && a.date <= endDate
        );
        return of(filtered).pipe(delay(500)); // Simulate latency
    }

    getAppointmentsByPatient(patientId: number): Observable<Appointment[]> {
        const filtered = this.appointments.filter(a => a.patientId === patientId);
        return of(filtered).pipe(delay(300));
    }

    createAppointment(dto: CreateAppointmentDto): Observable<Appointment> {
        const newAppt: Appointment = {
            id: this.appointments.length + 1,
            ...dto,
            patientName: 'Nuevo Paciente', // Mock
            status: 'scheduled'
        };
        this.appointments.push(newAppt);
        return of(newAppt).pipe(delay(500));
    }

    updateStatus(id: number, status: any): Observable<void> {
        const appt = this.appointments.find(a => a.id === id);
        if (appt) {
            appt.status = status;
        }
        return of(void 0).pipe(delay(300));
    }
}
