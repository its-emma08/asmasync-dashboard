import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface DashboardKPIs {
    total_patients: number;
    critical_alerts: number;
    moderate_risk: number;
    interventions_today: number;
    risk_distribution: { level: string; count: number }[];
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {

    private readonly BASE_URL = `${environment.apiUrl}/dashboard`;

    constructor(private http: HttpClient) { }

    // GET /api/dashboard/metrics
    getMetrics(): Observable<DashboardKPIs> {
        return this.http.get<DashboardKPIs>(`${this.BASE_URL}/metrics`).pipe(
            catchError(() => of({ total_patients: 0, critical_alerts: 0, moderate_risk: 0, interventions_today: 0, risk_distribution: [] }))
        );
    }

    // GET /api/dashboard/priority-patients
    getPriorityPatients(limit = 5): Observable<any[]> {
        return this.http.get<{ patients: any[] }>(`${this.BASE_URL}/priority-patients`, {
            params: { limit: limit.toString() }
        }).pipe(
            map(res => res.patients || []),
            catchError(() => of([]))
        );
    }
}
