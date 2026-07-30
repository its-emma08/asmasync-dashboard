import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface HospitalBranch {
    id: number;
    hospital_id: number;
    name: string;
    clues?: string;
    address?: string;
    phone?: string;
    is_active: boolean;
}

export interface Hospital {
    id: number;
    name: string;
    institution_type?: string;
    clues?: string;
    state?: string;
    city?: string;
    address?: string;
    phone?: string;
    is_active: boolean;
    branches?: HospitalBranch[];
    created_at?: string;
}

export interface HospitalStats {
    hospital_name: string;
    total_patients: number;
    zones: { green: number; yellow: number; red: number };
    doctor_performance: { doctor_id: number; doctor_name: string; patient_count: number }[];
}

@Injectable({ providedIn: 'root' })
export class HospitalService {
    private http = inject(HttpClient);
    private readonly BASE = `${environment.apiUrl}/hospitals`;

    getHospitals(includeInactive = false): Observable<Hospital[]> {
        return this.http.get<Hospital[]>(this.BASE, {
            params: includeInactive ? { include_inactive: 'true' } : {}
        }).pipe(catchError(() => of([])));
    }

    createHospital(data: {
        name: string;
        institution_type?: string;
        clues?: string;
        state?: string;
        city?: string;
        address?: string;
        phone?: string;
        branches?: Partial<HospitalBranch>[];
    }): Observable<Hospital> {
        return this.http.post<Hospital>(this.BASE, data);
    }

    updateHospital(id: number, data: Partial<Hospital>): Observable<Hospital> {
        return this.http.patch<Hospital>(`${this.BASE}/${id}`, data);
    }

    addBranch(hospitalId: number, data: {
        name: string;
        clues?: string;
        address?: string;
        phone?: string;
    }): Observable<HospitalBranch> {
        return this.http.post<HospitalBranch>(`${this.BASE}/${hospitalId}/branches`, data);
    }

    assignDoctor(hospitalId: number, branchId: number, doctorId: number): Observable<any> {
        return this.http.post<any>(
            `${this.BASE}/${hospitalId}/branches/${branchId}/assign-doctor`,
            null,
            { params: { doctor_id: doctorId } }
        );
    }

    /** Estadísticas globales del sistema (requiere rol admin) */
    getHospitalStats(_hospitalId?: number): Observable<HospitalStats> {
        return this.http.get<HospitalStats>(`${environment.apiUrl}/admin/stats`, {
            headers: { 'X-Dashboard-Api-Key': environment.dashboardApiKey }
        }).pipe(
            catchError(() => of({
                hospital_name: 'Sin datos',
                total_patients: 0,
                zones: { green: 0, yellow: 0, red: 0 },
                doctor_performance: []
            }))
        );
    }
}
