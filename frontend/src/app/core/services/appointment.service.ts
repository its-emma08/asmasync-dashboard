import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Appointment, CreateAppointmentDto } from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {

    private readonly apiUrl = `${environment.apiUrl}/appointments`;

    constructor(private http: HttpClient) { }

    getAppointments(startDate: Date, endDate: Date, patientId?: number): Observable<Appointment[]> {
        if (environment.mockMode) return of([]);

        let params = new HttpParams()
            .set('start_date', startDate.toISOString())
            .set('end_date', endDate.toISOString());
        if (patientId) params = params.set('patient_id', patientId.toString());

        return this.http.get<{ data: any[]; total: number }>(this.apiUrl, { params }).pipe(
            map(res => (res.data || []).map(app => this.mapApiToModel(app))),
            catchError(() => of([]))
        );
    }

    /** Citas propias del paciente autenticado — GET /api/appointments/my */
    getMyAppointments(): Observable<Appointment[]> {
        if (environment.mockMode) return of([]);
        return this.http.get<any[]>(`${this.apiUrl}/my`).pipe(
            map(res => (res || []).map(app => this.mapApiToModel(app))),
            catchError(() => of([]))
        );
    }

    getAppointmentsByPatient(patientId: number): Observable<Appointment[]> {
        if (environment.mockMode) return of([]);
        const startDate = new Date(); startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate); endDate.setFullYear(endDate.getFullYear() + 1);
        return this.getAppointments(startDate, endDate, patientId);
    }

    createAppointment(dto: CreateAppointmentDto): Observable<Appointment> {
        if (environment.mockMode) return of({} as Appointment);
        return this.http.post<any>(this.apiUrl, dto).pipe(
            map(app => this.mapApiToModel(app)),
            catchError((err: HttpErrorResponse) => throwError(() => err))
        );
    }

    updateAppointment(id: number | string, dto: Partial<CreateAppointmentDto>): Observable<Appointment> {
        if (environment.mockMode) return of({} as Appointment);
        return this.http.patch<any>(`${this.apiUrl}/${id}`, dto).pipe(
            map(app => this.mapApiToModel(app)),
            catchError((err: HttpErrorResponse) => throwError(() => err))
        );
    }

    deleteAppointment(id: number | string): Observable<void> {
        if (environment.mockMode) return of(void 0);
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(catchError(() => of(void 0)));
    }

    private mapApiToModel(app: any): Appointment {
        return {
            id: app.id,
            patientId: app.patient_id ?? app.patientId,
            patientName: app.patient_name ?? app.patientName ?? '',
            doctorName: app.doctor_name ?? app.doctorName,
            date: new Date(app.date),
            durationMinutes: app.duration_minutes ?? app.durationMinutes ?? 30,
            type: app.type ?? 'checkup',
            status: app.status ?? 'scheduled',
            notes: app.notes,
            location: app.location,
        };
    }

    updateStatus(id: number, status: string): Observable<void> {
        if (environment.mockMode) return of(void 0);
        return this.http.patch<Appointment>(`${this.apiUrl}/${id}`, { status }).pipe(
            map(() => void 0), catchError(() => of(void 0))
        );
    }
}
