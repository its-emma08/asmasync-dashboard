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
        // Backend identifies user via token, simplified post
        return this.http.post(`${this.apiUrl}/vitals`, data).pipe(
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
        // Backend name is 'spirometer' in openapi.json
        return this.http.post(`${this.apiUrl}/spirometer`, data).pipe(
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
        // Backend history endpoint is /api/measurements/history
        return this.http.get<any[]>(`${this.apiUrl}/history`).pipe(
            map(list => {
                const pef: any[] = [];
                const spo2: any[] = [];
                const heart_rate: any[] = [];
                
                (list || [])
                .filter(item => {
                    // If backend includes patient_id, narrow history for detail views
                    if (item?.patient_id === undefined || item?.patient_id === null) {
                        return true;
                    }
                    return String(item.patient_id) === String(patientId);
                })
                .forEach(item => {
                    const date = item.measured_at;
                    if (item.pef) pef.push({ x: date, y: item.pef });
                    if (item.spo2) spo2.push({ x: date, y: item.spo2 });
                    if (item.heart_rate) heart_rate.push({ x: date, y: item.heart_rate });
                });
                
                return { pef, spo2, heart_rate };
            }),
            catchError(err => {
                console.error('Error fetching history', err);
                return of({ pef: [], spo2: [], heart_rate: [] });
            })
        );
    }
}
