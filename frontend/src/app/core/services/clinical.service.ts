import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface VitalSign {
    spo2?: number;
    heart_rate?: number;
    measured_at?: string;
}

export interface Spirometry {
    pef: number;
    fev1?: number;
    measured_at?: string;
}

export interface PatientHistory {
    pef: { x: string, y: number }[];
    spo2: { x: string, y: number }[];
    heart_rate: { x: string, y: number }[];
}

@Injectable({
    providedIn: 'root'
})
export class ClinicalService {
    private apiUrl = `${environment.apiUrl}/measurements`;

    constructor(private http: HttpClient) { }

    addVitalSign(patientId: number, data: VitalSign): Observable<any> {
        return this.http.post(`${this.apiUrl}/vitals?patient_id=${patientId}`, data).pipe(
            catchError(err => {
                if (err.status === 422) {
                    console.error('Validation Error (422):', err.error);
                    throw new Error('Datos inválidos: Verifique rangos (SpO2 50-100, FC 30-250).');
                }
                throw err;
            })
        );
    }

    addSpirometry(patientId: number, data: Spirometry): Observable<any> {
        return this.http.post(`${this.apiUrl}/spirometry?patient_id=${patientId}`, data).pipe(
            catchError(err => {
                if (err.status === 422) {
                    throw new Error('Datos inválidos: PEF debe ser positivo y menor a 900.');
                }
                throw err;
            })
        );
    }

    getPatientHistory(patientId: number | string): Observable<PatientHistory> {
        if (environment.mockMode) {
            // Mock data for fallback
            return of({
                pef: [
                    { x: '2024-01-01T10:00:00', y: 450 },
                    { x: '2024-01-02T10:00:00', y: 460 },
                    { x: '2024-01-03T10:00:00', y: 455 }
                ],
                spo2: [
                    { x: '2024-01-01T10:00:00', y: 98 },
                    { x: '2024-01-02T10:00:00', y: 97 },
                    { x: '2024-01-03T10:00:00', y: 99 }
                ],
                heart_rate: []
            });
        }
        return this.http.get<PatientHistory>(`${this.apiUrl}/history/${patientId}`).pipe(
            catchError(err => {
                console.error('Error fetching history', err);
                return of({ pef: [], spo2: [], heart_rate: [] });
            })
        );
    }
}
