import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Patient, PEFTrend } from '../models/patient.model';
import { DashboardMetrics } from '../models/dashboard.model';

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

@Injectable({
    providedIn: 'root'
})
export class PatientService {
    private apiUrl = `${environment.apiUrl}`;

    constructor(private http: HttpClient) { }

    // Lista simple de todos los pacientes (para selectores)
    getAllPatients(): Observable<Patient[]> {
        return this.http.get<Patient[]>(`${this.apiUrl}/patients/all`);
    }

    // Lista paginada de pacientes con filtros
    getPatients(page: number = 1, limit: number = 10, search?: string, riskLevel?: string): Observable<PaginatedResponse<Patient>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (search) {
            params = params.set('search', search);
        }

        if (riskLevel && riskLevel !== 'all') {
            params = params.set('riskLevel', riskLevel);
        }

        return this.http.get<PaginatedResponse<Patient>>(`${this.apiUrl}/patients`, { params });
    }

    // Detalle de paciente por ID
    getPatientById(id: number): Observable<Patient> {
        return this.http.get<Patient>(`${this.apiUrl}/patients/${id}`);
    }

    // Historial clínico de paciente
    getPatientHistory(id: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/patients/${id}/history`);
    }

    // Tendencia FEM (7 días)
    getPEFTrend(id: number): Observable<PEFTrend[]> {
        return this.http.get<PEFTrend[]>(`${this.apiUrl}/patients/${id}/pef-trend`);
    }

    // Métricas del dashboard
    getDashboardMetrics(): Observable<DashboardMetrics> {
        return this.http.get<DashboardMetrics>(`${this.apiUrl}/dashboard/metrics`);
    }

    // Pacientes prioritarios
    getPriorityPatients(): Observable<Patient[]> {
        return this.http.get<Patient[]>(`${this.apiUrl}/dashboard/priority-patients`);
    }
}
