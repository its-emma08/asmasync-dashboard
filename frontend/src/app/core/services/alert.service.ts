import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Alert } from '../models/alert.model';

@Injectable({
    providedIn: 'root'
})
export class AlertService {
    private apiUrl = `${environment.apiUrl}/alerts`;
    private unreadCountSubject = new BehaviorSubject<number>(0);
    public unreadCount$ = this.unreadCountSubject.asObservable();

    constructor(private http: HttpClient) { }

    private mockAlertsSubject = new BehaviorSubject<Alert[]>(this.initialMockAlerts());

    // Public method to simulate incoming alerts
    simulateAlert(alert: any): void {
        const current = this.mockAlertsSubject.value;
        const newAlert: Alert = {
            id: current.length + 1 + Math.floor(Math.random() * 1000),
            patient_id: alert.patientId || 99,
            patient: {
                id: alert.patientId || 99,
                full_name: alert.patientName || 'Paciente Simulado',
                risk_level: 'high'
            },
            alert_type: alert.type || 'critical',
            message: alert.message || 'Alerta generada manualmente',
            created_at: new Date().toISOString(),
            is_viewed: false
        };
        this.mockAlertsSubject.next([newAlert, ...current]);
        this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    }

    getAlerts(): Observable<Alert[]> {
        if (environment.mockMode) {
            return this.mockAlertsSubject.asObservable();
        }
        return this.http.get<Alert[]>(this.apiUrl).pipe(
            catchError(() => this.mockAlertsSubject.asObservable())
        );
    }

    getUnreadAlerts(): Observable<Alert[]> {
        if (environment.mockMode) {
            return new Observable<Alert[]>(observer => {
                this.mockAlertsSubject.subscribe(alerts => {
                    const unread = alerts.filter(a => !a.is_viewed);
                    this.unreadCountSubject.next(unread.length);
                    observer.next(unread);
                });
            });
        }
        return this.http.get<Alert[]>(`${this.apiUrl}/unread`).pipe(
            tap(alerts => this.unreadCountSubject.next(alerts.length)),
            catchError(() => {
                // Fallback to mocks
                return new Observable<Alert[]>(observer => {
                    this.mockAlertsSubject.subscribe(alerts => {
                        const unread = alerts.filter(a => !a.is_viewed);
                        this.unreadCountSubject.next(unread.length);
                        observer.next(unread);
                    });
                });
            })
        );
    }

    markAsRead(id: number): Observable<void> {
        if (environment.mockMode) {
            const current = this.mockAlertsSubject.value;
            const updated = current.map(a => a.id === id ? { ...a, is_viewed: true } : a);
            this.mockAlertsSubject.next(updated);

            const unreadCount = updated.filter(a => !a.is_viewed).length;
            this.unreadCountSubject.next(unreadCount);

            return of(void 0);
        }
        return this.http.patch<void>(`${this.apiUrl}/${id}/mark-read`, {}).pipe(
            tap(() => {
                const current = this.unreadCountSubject.value;
                if (current > 0) this.unreadCountSubject.next(current - 1);
            }),
            catchError(() => of(void 0))
        );
    }

    deleteAlert(id: number): Observable<void> {
        if (environment.mockMode) {
            const current = this.mockAlertsSubject.value;
            const updated = current.filter(a => a.id !== id);
            this.mockAlertsSubject.next(updated);
            const unreadCount = updated.filter(a => !a.is_viewed).length;
            this.unreadCountSubject.next(unreadCount);
            return of(void 0);
        }
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            catchError(() => of(void 0))
        );
    }

    getUnreadCount(): Observable<number> {
        return this.unreadCount$;
    }

    updateUnreadCount(count: number): void {
        this.unreadCountSubject.next(count);
    }

    private initialMockAlerts(): Alert[] {
        return [
            {
                id: 1,
                patient_id: 1,
                patient: { id: 1, full_name: 'Ana García', risk_level: 'high' },
                alert_type: 'critical',
                message: 'Caída de PEF del 35% detectada',
                created_at: new Date().toISOString(),
                is_viewed: false
            },
            {
                id: 2,
                patient_id: 2,
                patient: { id: 2, full_name: 'Carlos Ruiz', risk_level: 'medium' },
                alert_type: 'moderate',
                message: 'Uso de inhalador de rescate',
                created_at: new Date(Date.now() - 3600000).toISOString(),
                is_viewed: true
            },
            {
                id: 3,
                patient_id: 5,
                patient: { id: 5, full_name: 'Elena Torres', risk_level: 'medium' },
                alert_type: 'moderate',
                message: 'Calidad de sueño baja (65%)',
                created_at: new Date(Date.now() - 7200000).toISOString(),
                is_viewed: false
            }
        ] as Alert[];
    }
}
