import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, of, switchMap, catchError, shareReplay, tap, filter } from 'rxjs';
import { environment } from '../../../environments/environment';

import { Alert } from '../models/alert.model';
import { ToastService } from './toast.service';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private apiUrl = `${environment.apiUrl}/alerts`;
    private pollingInterval = 30000; // 30 seconds

    private unreadCountSubject = new BehaviorSubject<number>(0);
    public unreadCount$ = this.unreadCountSubject.asObservable();

    private notificationsSubject = new BehaviorSubject<Alert[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();

    private lastHandledAlertId = 0;

    constructor(
        private http: HttpClient,
        private toastService: ToastService,
        private authService: AuthService
    ) {
        this.startPolling();
    }

    private startPolling() {
        // Initial load to set lastHandledAlertId without notifying
        this.getLatest().subscribe(alerts => {
            if (alerts.length > 0) {
                this.lastHandledAlertId = alerts[0].id;
            }
        });

        interval(this.pollingInterval)
            .pipe(
                filter(() => this.authService.isAuthenticated()),
                switchMap(() => this.getUnreadCount()),
                catchError(err => {
                    console.error('Polling error', err);
                    return of({ count: 0 });
                })
            )
            .subscribe(res => {
                const prevCount = this.unreadCountSubject.value;
                this.unreadCountSubject.next(res.count);

                // If count increased, fetch latest to see if we need to notify
                if (res.count > prevCount) {
                    this.checkForNewAlerts();
                }
            });

        // Initial refresh
        this.refresh();
    }

    private checkForNewAlerts() {
        this.http.get<Alert[]>(`${this.apiUrl}?limit=5`).subscribe(alerts => {
            // Find alerts newer than lastHandledAlertId
            // Assuming alerts are sorted DESC by id or created_at
            const newAlerts = alerts.filter(a => a.id > this.lastHandledAlertId);

            if (newAlerts.length > 0) {
                // Update tracking ID
                this.lastHandledAlertId = newAlerts[0].id; // taking the max ID

                // Notify for each new alert
                newAlerts.forEach(alert => {
                    if (alert.alert_type === 'critical') {
                        this.toastService.showError(`ALERTA CRÍTICA: ${alert.patient?.full_name || 'Paciente'} - ${alert.message}`);
                    } else if (alert.alert_type === 'moderate') {
                        this.toastService.showWarning(`Alerta: ${alert.patient?.full_name || 'Paciente'} - ${alert.message}`);
                    }
                });

                // Also update the list observable
                this.notificationsSubject.next(alerts);
            }
        });
    }

    refresh() {
        this.getUnreadCount().subscribe(res => this.unreadCountSubject.next(res.count));
        this.getLatest().subscribe(alerts => this.notificationsSubject.next(alerts));
    }

    getLatest(): Observable<Alert[]> {
        return this.http.get<Alert[]>(`${this.apiUrl}?limit=10`).pipe(
            tap(alerts => this.notificationsSubject.next(alerts))
        );
    }

    getUnreadCount(): Observable<{ count: number }> {
        return this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`);
    }

    markAsRead(id: number): Observable<Alert> {
        return this.http.patch<Alert>(`${this.apiUrl}/${id}/mark-read`, {}).pipe(
            tap(() => {
                // Optimistic update
                const current = this.notificationsSubject.value;
                const updated = current.map(n => n.id === id ? { ...n, is_viewed: true } : n);
                this.notificationsSubject.next(updated);

                const currentCount = this.unreadCountSubject.value;
                this.unreadCountSubject.next(Math.max(0, currentCount - 1));
            })
        );
    }

    createTestAlert(patientId: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/test`, null, {
            params: { patient_id: patientId.toString(), type: 'critical' }
        }).pipe(
            tap(() => {
                this.refresh();
                // Manually trigger check effectively for instant feedback in dev
                setTimeout(() => this.checkForNewAlerts(), 500);
            })
        );
    }
}
