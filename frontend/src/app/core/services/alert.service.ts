import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
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

    // Obtener todas las alertas
    getAlerts(): Observable<Alert[]> {
        return this.http.get<Alert[]>(this.apiUrl);
    }

    // Obtener alertas no vistas
    getUnreadAlerts(): Observable<Alert[]> {
        return this.http.get<Alert[]>(`${this.apiUrl}/unread`).pipe(
            tap(alerts => this.unreadCountSubject.next(alerts.length))
        );
    }

    // Marcar una alerta como vista
    markAsRead(id: number): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${id}/mark-read`, {}).pipe(
            tap(() => {
                // Actualizar contador localmente o volver a pedir
                const current = this.unreadCountSubject.value;
                if (current > 0) {
                    this.unreadCountSubject.next(current - 1);
                }
            })
        );
    }

    // Eliminar alerta
    deleteAlert(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // Obtener contador de no leídos (desde observable local)
    getUnreadCount(): Observable<number> {
        return this.unreadCount$;
    }

    // Actualizar contador manualmente si es necesario
    updateUnreadCount(count: number): void {
        this.unreadCountSubject.next(count);
    }
}
