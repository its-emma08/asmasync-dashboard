import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface PatientAlert {
    id: number;
    user_id: number;
    pef_value: number;
    risk_level: 'green' | 'yellow' | 'red';
    is_viewed_by_doctor: boolean;
    created_at: string;
}

@Injectable({ providedIn: 'root' })
export class PatientAlertService {
    private http = inject(HttpClient);
    private readonly BASE = `${environment.apiUrl}/patient-alerts`;

    /** Alertas de PEF generadas por un paciente desde la app móvil */
    getByPatient(patientId: number): Observable<PatientAlert[]> {
        return this.http.get<PatientAlert[]>(`${this.BASE}/patient/${patientId}`).pipe(
            catchError(() => of([]))
        );
    }

    /** Marca una alerta como vista por el doctor */
    markAsViewed(alertId: number): Observable<PatientAlert> {
        return this.http.patch<PatientAlert>(`${this.BASE}/${alertId}/view`, {});
    }
}
