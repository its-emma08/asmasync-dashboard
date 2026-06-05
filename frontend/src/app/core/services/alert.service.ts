import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HealthMath, AsthmaZone } from '../../shared/utils/health-math.util';

export interface Alert {
    id: number;
    user_id: number;
    alert_type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    is_viewed: boolean;
    created_at: string;
    read_at?: string;
}

@Injectable({ providedIn: 'root' })
export class AlertService {

    private readonly BASE_URL = `${environment.apiUrl}/alerts`;

    private unreadCountSubject = new BehaviorSubject<number>(0);
    public unreadCount$ = this.unreadCountSubject.asObservable();

    // Signal-based UI state for Health Status (used by dashboard-home)
    public healthStatus = signal<AsthmaZone>('Green');

    constructor(private http: HttpClient) {
        this.refreshUnreadCount();
    }

    updateHealthStatus(currentPEF: number, personalBest: number): void {
        const zone = HealthMath.calculateAsthmaZone(currentPEF, personalBest);
        this.healthStatus.set(zone);
    }

    // GET /api/alerts
    getAlerts(isViewed?: boolean, skip = 0, limit = 20): Observable<Alert[]> {
        let params = new HttpParams().set('skip', skip.toString()).set('limit', limit.toString());
        if (isViewed !== undefined) params = params.set('is_viewed', isViewed.toString());

        return this.http.get<Alert[]>(this.BASE_URL, { params }).pipe(
            catchError(() => of([]))
        );
    }

    // GET /api/alerts/unread-count
    getUnreadCount(): Observable<number> {
        return this.http.get<{ count: number }>(`${this.BASE_URL}/unread-count`).pipe(
            map(res => res.count),
            tap(count => this.unreadCountSubject.next(count)),
            catchError(() => of(0))
        );
    }

    refreshUnreadCount(): void {
        this.getUnreadCount().subscribe();
    }

    updateUnreadCount(count: number): void {
        this.unreadCountSubject.next(count);
    }

    // PATCH /api/alerts/{id}/mark-read
    markAsRead(id: number): Observable<Alert> {
        return this.http.patch<Alert>(`${this.BASE_URL}/${id}/mark-read`, {}).pipe(
            tap(() => {
                const current = this.unreadCountSubject.value;
                if (current > 0) this.unreadCountSubject.next(current - 1);
            }),
            catchError(() => of({} as Alert))
        );
    }

    deleteAlert(id: number): Observable<Alert> {
        return this.markAsRead(id);
    }

    markAllAsRead(): void {
        this.getAlerts(false).subscribe(alerts =>
            alerts.forEach(a => this.markAsRead(a.id).subscribe())
        );
    }
}
