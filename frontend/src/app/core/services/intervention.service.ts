import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Intervention } from '../models/intervention.model';

@Injectable({ providedIn: 'root' })
export class InterventionService {
    private http = inject(HttpClient);
    private readonly BASE = `${environment.apiUrl}/interventions`;

    getByPatient(patientId: number): Observable<Intervention[]> {
        return this.http.get<Intervention[]>(this.BASE, {
            params: { patient_id: patientId }
        });
    }

    create(data: {
        patient_id: number;
        type: string;
        description: string;
        recommendations?: string;
        next_follow_up?: string | null;
    }): Observable<Intervention> {
        return this.http.post<Intervention>(this.BASE, data);
    }

    update(id: number, data: Partial<Intervention>): Observable<Intervention> {
        return this.http.patch<Intervention>(`${this.BASE}/${id}`, data);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.BASE}/${id}`);
    }
}
