import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { map, catchError, tap, switchMap, delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Patient, PEFTrend } from '../models/patient.model';
import { DashboardMetrics } from '../models/dashboard.model';
import { MOCK_PATIENTS } from '../mocks/mock-patients';

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

import { StorageService } from './storage.service';

@Injectable({
    providedIn: 'root'
})
export class PatientService {
    private apiUrl = `${environment.apiUrl}/patients`;
    private patientsSubject = new BehaviorSubject<Patient[]>([]);
    patients$ = this.patientsSubject.asObservable();

    constructor(
        private http: HttpClient,
        private storageService: StorageService // Injected
    ) {
        this.loadInitialData();
    }

    private loadInitialData(): void {
        this.getAllPatients().subscribe({
            next: (patients) => this.patientsSubject.next(patients),
            error: (err) => console.error('Error loading initial patients', err)
        });
    }

    // --- Data Mapping ---

    private mapBackendToFrontend(backend: any): Patient {
        return {
            id: backend.id,
            full_name: backend.full_name,
            date_of_birth: backend.date_of_birth,
            gender: backend.gender || 'other',
            asthma_type: backend.asthma_type || 'allergic',
            email: backend.email,
            phone: backend.phone,

            // Mapped Fields
            // Mapped Fields
            riskLevel: (backend.risk_level === 'red' || backend.risk_level === 'high') ? 'red' :
                ((backend.risk_level === 'yellow' || backend.risk_level === 'medium') ? 'yellow' : 'green'),
            latest_pef: backend.current_pef || backend.personal_best_pef || 0,
            personal_best_pef: backend.personal_best_pef || 500,
            currentSpO2: backend.current_spo2 || 98,
            respiratoryRate: 16,
            lastUpdate: backend.updated_at || new Date().toISOString(),
            lastCrisis: backend.last_crisis_date || null,
            adherence: 85,
            status: backend.risk_level === 'red' ? 'Crítico' : (backend.risk_level === 'yellow' ? 'Moderado' : 'Estable'),
            profilePicture: `https://ui-avatars.com/api/?name=${backend.full_name}&background=random`,

            // New Fields
            height_cm: backend.height_cm,
            weight_kg: backend.weight_kg,
            diagnosisDate: backend.diagnosis_date,

            // Flats -> Nested
            emergencyContact: (backend.emergency_contact_name) ? {
                name: backend.emergency_contact_name,
                phone: backend.emergency_contact_phone || '',
                relation: backend.emergency_contact_relation || ''
            } : undefined,

            // Legacy
            background: {
                diagnosis: 'Asma (Backend)',
                allergies: [],
                hereditary: [],
                smoking: false
            },
            medications: [],
            interventions: [],
            pefTrend: []
        };
    }

    private mapFrontendToBackend(frontend: any): any {
        // Date formatting helper
        const formatDate = (dateVal: any) => {
            if (!dateVal) return null;
            if (dateVal instanceof Date) return dateVal.toISOString().split('T')[0];
            if (typeof dateVal === 'string' && dateVal.includes('T')) return dateVal.split('T')[0];
            return dateVal;
        };

        // Enforce VARCHAR(1) for gender to match Postgres Database
        const genderMap: any = {
            'male': 'M',
            'female': 'F',
            'other': 'O'
        };
        const genderAbbr = genderMap[frontend.gender] || 'O';

        return {
            full_name: frontend.full_name,
            email: frontend.email || null, // Ensure empty strings are cast to null for Pydantic Optional[EmailStr]
            phone: frontend.phone || null,
            date_of_birth: formatDate(frontend.date_of_birth),
            gender: genderAbbr,
            asthma_type: frontend.asthma_type,
            personal_best_pef: parseInt(frontend.personal_best_pef) || 500,
            risk_level: frontend.riskLevel, // Pass through color directly, backend expects enum value (red/yellow/green)

            // Handle Emergency Contact (Nested OR Flat)
            emergency_contact_name: frontend.emergencyContact?.name || frontend.emergency_contact_name,
            emergency_contact_phone: frontend.emergencyContact?.phone || frontend.emergency_contact_phone,
            emergency_contact_relation: frontend.emergencyContact?.relation || frontend.emergency_contact_relation,

            // Physical data (Map form 'height'/'weight' to backend 'height_cm'/'weight_kg')
            height_cm: parseInt(frontend.height_cm || frontend.height) || null,
            weight_kg: parseInt(frontend.weight_kg || frontend.weight) || null,

            // Medical
            diagnosis_date: formatDate(frontend.diagnosisDate || frontend.diagnosis_date),
        };
    }

    // --- API Methods ---

    getAllPatients(): Observable<Patient[]> {
        // 1. Try to load from Encrypted Storage first
        const stored = this.storageService.getItem('asmasync_patients');
        if (stored && Array.isArray(stored) && stored.length > 0) {
            // console.log('📦 Loaded patients from Encrypted Storage');
            return of(stored).pipe(delay(1)); // Force Async
        }

        if (environment.mockMode) {
            const mapped = MOCK_PATIENTS.map(p => this.mapBackendToFrontend(p));
            // SEED Storage
            this.storageService.setItem('asmasync_patients', mapped);
            return of(mapped).pipe(delay(1)); // Force Async
        }

        return this.http.get<any>(this.apiUrl).pipe(
            map(response => {
                const list = response.data || [];
                const mapped = list.map((p: any) => this.mapBackendToFrontend(p));
                // Sync with storage
                this.storageService.setItem('asmasync_patients', mapped);
                return mapped;
            }),
            tap(patients => this.patientsSubject.next(patients))
        );
    }

    getPatients(page: number = 1, limit: number = 10, search?: string, riskLevel?: string): Observable<PaginatedResponse<Patient>> {
        if (environment.mockMode) {
            let filtered = MOCK_PATIENTS.map(p => this.mapBackendToFrontend(p));
            if (search) {
                const s = search.toLowerCase();
                filtered = filtered.filter(p =>
                    (p.full_name && p.full_name.toLowerCase().includes(s)) ||
                    (p.email && p.email.toLowerCase().includes(s))
                );
            }
            if (riskLevel && riskLevel !== 'all') {
                filtered = filtered.filter(p => p.riskLevel === riskLevel);
            }
            // Mock pagination
            const start = (page - 1) * limit;
            return of({
                data: filtered.slice(start, start + limit),
                total: filtered.length,
                page,
                limit
            });
        }

        let params = new HttpParams()
            .set('skip', page.toString()) // Backend might expect 1-based or we adjust logic
            .set('limit', limit.toString());

        if (search) params = params.set('search', search);
        if (riskLevel && riskLevel !== 'all') params = params.set('risk_level', riskLevel); // Ensure backend accepts 'green', 'yellow', 'red' or map it

        return this.http.get<any>(this.apiUrl, { params }).pipe(
            map(response => ({
                data: (response.data || []).map((p: any) => this.mapBackendToFrontend(p)),
                total: response.total || 0,
                page: response.page || page,
                limit: response.limit || limit
            }))
        );
    }

    getPatientById(id: string | number): Observable<Patient> {
        if (environment.mockMode) {
            const found = MOCK_PATIENTS.find(p => p.id === id || p.id == id);
            if (found) {
                return of(this.mapBackendToFrontend(found));
            }
            return of({} as Patient);
        }

        return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
            map(p => this.mapBackendToFrontend(p)),
            // Optimistically update list if found? Or just return
            catchError(err => {
                console.error(`Patient ${id} not found`, err);
                return of({} as Patient); // Handle error appropriately
            })
        );
    }

    addPatient(patientData: Partial<Patient>): Observable<Patient> {
        // Mock Mode / Offline Handling
        if (environment.mockMode) {
            const newPatient = { ...this.mapBackendToFrontend({ ...patientData, id: Date.now() } as any), ...patientData } as Patient;
            const current = this.patientsSubject.value;
            const updated = [newPatient, ...current];
            this.patientsSubject.next(updated);
            this.storageService.setItem('asmasync_patients', updated); // PERSIST
            return of(newPatient);
        }

        const payload = this.mapFrontendToBackend(patientData);
        return this.http.post<any>(this.apiUrl, payload).pipe(
            map(p => this.mapBackendToFrontend(p)),
            tap(newPatient => {
                const current = this.patientsSubject.value;
                const updated = [newPatient, ...current];
                this.patientsSubject.next(updated);
                this.storageService.setItem('asmasync_patients', updated); // PERSIST
            })
        );
    }

    updatePatient(id: string | number, data: Partial<Patient>): Observable<Patient> {
        // Mock Mode / Offline Handling
        if (environment.mockMode) {
            const current = this.patientsSubject.value;
            const index = current.findIndex(p => p.id === id || p.id == id);
            if (index !== -1) {
                const updatedPatient = { ...current[index], ...data };
                current[index] = updatedPatient;
                this.patientsSubject.next([...current]);
                this.storageService.setItem('asmasync_patients', current); // PERSIST
                return of(updatedPatient);
            }
        }

        const payload = this.mapFrontendToBackend(data);
        return this.http.patch<any>(`${this.apiUrl}/${id}`, payload).pipe(
            map(p => this.mapBackendToFrontend(p)),
            tap(updatedPatient => {
                const current = this.patientsSubject.value;
                const index = current.findIndex(p => p.id === id || p.id == id);
                if (index !== -1) {
                    current[index] = updatedPatient;
                    this.patientsSubject.next([...current]);
                    this.storageService.setItem('asmasync_patients', current); // PERSIST
                }
            })
        );
    }

    // --- Mocked / Partial Implementation for Phase 1 ---

    addClinicalRecord(patientId: string | number, record: any): void {
        console.warn('Backend endpoint for clinical records not yet connected. Using local update.');
        // For now, we manually trigger a refresh or log it. 
        // Real implementation requires POST /interventions endpoint
    }

    getPatientHistory(id: string | number): Observable<any[]> {
        // Mock return empty for now until endpoint exists
        return of([]);
    }

    getPEFTrend(id: string | number): Observable<PEFTrend[]> {
        return of([]);
    }

    // Métricas del dashboard (Calculated from fetched patients)
    getDashboardMetrics(): Observable<DashboardMetrics> {
        return this.patients$.pipe(
            map(patients => {
                const total = patients.length;
                const critical = patients.filter(p => p.riskLevel === 'red').length;
                const moderate = patients.filter(p => p.riskLevel === 'yellow').length;
                const stable = patients.filter(p => p.riskLevel === 'green').length;

                // Mock calculations for now
                return {
                    totalPatients: total,
                    activePatients: critical + moderate,
                    criticalAlerts: critical,
                    moderateRisk: moderate,
                    interventionsToday: 0,
                    adherenceRate: 85,
                    riskDistribution: [
                        { level: 'green', count: stable },
                        { level: 'yellow', count: moderate },
                        { level: 'red', count: critical }
                    ]
                };
            })
        );
    }

    resolveAlert(id: string | number): Observable<boolean> {
        // Mock implementation
        return of(true);
    }
}
