import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { SKIP_RESILIENCE } from '../interceptors/http-context.tokens';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Patient, PEFTrend } from '../models/patient.model';
import { DashboardMetrics } from '../models/dashboard.model';

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

@Injectable({ providedIn: 'root' })
export class PatientService {

    private readonly BASE             = environment.apiUrl;
    private readonly PATIENTS_URL     = `${this.BASE}/patients`;
    private readonly DOCTOR_URL       = `${this.BASE}/doctor/my-patients`;
    private readonly DASHBOARD_URL    = `${this.BASE}/dashboard`;
    private readonly MEASUREMENTS_URL = `${this.BASE}/measurements`;

    private patientsSubject = new BehaviorSubject<Patient[]>([]);
    patients$ = this.patientsSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadInitialData();
    }

    private loadInitialData(): void {
        this.getAllPatients().subscribe({
            next: patients => this.patientsSubject.next(patients),
            error: err => console.error('[PatientService] Error loading patients', err)
        });
    }

    private mapToFrontend(b: any): Patient {
        // Extract latest vitals from recent_measurements if available
        const recentMeasurements: any[] = b.recent_measurements || [];
        const latestMeasurement = recentMeasurements[0] || {};

        const latestPef = b.current_pef
            || latestMeasurement.pef
            || b.personal_best_pef
            || 0;
        const latestSpo2 = b.current_spo2
            || latestMeasurement.spo2
            || 0;
        const latestHR = latestMeasurement.heart_rate || 0;

        return {
            id: b.id,
            full_name: b.full_name,
            date_of_birth: b.date_of_birth,
            gender: b.gender || 'other',
            asthma_type: b.asthma_type || 'allergic',
            email: b.email,
            phone: b.phone || b.phone_number || null,
            riskLevel: b.risk_level || 'unknown',
            latest_pef: latestPef,
            personal_best_pef: b.personal_best_pef || 500,
            currentSpO2: latestSpo2,
            respiratoryRate: b.respiratory_rate || latestMeasurement.respiratory_rate || 0,
            lastUpdate: b.updated_at || b.last_prediction_at || new Date().toISOString(),
            lastCrisis: b.last_crisis_date || null,
            adherence: b.adherence ?? null,
            status: b.risk_level === 'high' ? 'Crítico' : b.risk_level === 'moderate' ? 'Moderado' : 'Estable',
            profilePicture: b.avatar_seed
                ? `https://api.dicebear.com/7.x/micah/svg?seed=${b.avatar_seed}`
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(b.full_name || 'P')}&background=random`,
            height_cm: b.height_cm,
            weight_kg: b.weight_kg,
            diagnosisDate: b.diagnosis_date,
            blood_type: b.blood_type || null,
            known_allergies: b.known_allergies || null,
            current_medications: b.current_medications || null,
            family_history_mother: b.family_history_mother || null,
            family_history_father: b.family_history_father || null,
            family_history_siblings: b.family_history_siblings || null,
            family_history_grandparents: b.family_history_grandparents || null,
            smoking: b.smoking || null,
            alcohol: b.alcohol || null,
            exercise: b.exercise || null,
            diet: b.diet || null,
            surgeries_traumas: b.surgeries_traumas || null,
            photo_url: b.photo_url || null,
            spirometer_id: b.spirometer_id || null,
            inhaler_id: b.inhaler_id || null,
            emergencyContact: b.emergency_contact_name ? {
                name: b.emergency_contact_name,
                phone: b.emergency_contact_phone || '',
                relation: b.emergency_contact_relation || ''
            } : undefined,
            background: b.background || { diagnosis: 'Asma', allergies: [], hereditary: [], smoking: false },
            medications: b.medications || [],
            interventions: b.interventions || [],
            pefTrend: b.pefTrend || [],
            // WearOS / Smartwatch
            heart_rate: latestHR,
            sleep_hours: latestMeasurement.sleep_hours || null,
            steps: latestMeasurement.steps || null,
            respiratory_rate_wearos: latestMeasurement.respiratory_rate || null,
            // Environmental
            aqi: latestMeasurement.aqi || null,
            temperature: latestMeasurement.temperature || null,
            humidity: latestMeasurement.humidity || null,
            pollen_level: latestMeasurement.pollen_level || null,
            location_name: latestMeasurement.location_name || null,
            // Raw measurements for charts
            recent_measurements: recentMeasurements,
            documents: b.documents || []
        };
    }

    private mapToBackend(f: Partial<Patient> | any): any {
        const fmt = (d: any) => {
            if (!d) return null;
            if (d instanceof Date) return d.toISOString().split('T')[0];
            return typeof d === 'string' && d.includes('T') ? d.split('T')[0] : d;
        };
        // Support both flat form values (weight/height/diagnosis_date/emergency_contact_*)
        // and Patient model values (weight_kg/height_cm/diagnosisDate/emergencyContact.*)
        const heightRaw = f.height_cm ?? f.height ?? null;
        const weightRaw = f.weight_kg ?? f.weight ?? null;
        const diagDate = f.diagnosis_date ?? f.diagnosisDate ?? null;

        // Split full_name into first_name / last_name for PatientFullUpdate schema
        const nameParts = (f.full_name || '').trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        return {
            first_name: firstName || null,
            last_name: lastName || null,
            email: f.email || null,
            phone_number: f.phone || f.phone_number || null,
            gender: ({ male: 'M', female: 'F', other: 'O' } as any)[f.gender || 'other'] || 'O',
            date_of_birth: fmt(f.date_of_birth) || null,
            asthma_type: f.asthma_type,
            personal_best_pef: f.personal_best_pef ? parseInt(f.personal_best_pef.toString()) : 500,
            height_cm: heightRaw ? parseFloat(heightRaw.toString()) : null,
            weight_kg: weightRaw ? parseFloat(weightRaw.toString()) : null,
            diagnosis_date: fmt(diagDate),
            emergency_contact_name: f.emergency_contact_name ?? f.emergencyContact?.name ?? null,
            emergency_contact_phone: f.emergency_contact_phone ?? f.emergencyContact?.phone ?? null,
            emergency_contact_relation: f.emergency_contact_relation ?? f.emergencyContact?.relation ?? null,
            blood_type: f.blood_type || null,
            known_allergies: f.known_allergies ?? f.allergies ?? null,
            current_medications: f.current_medications || null,
            // Family history
            family_history_mother: f.family_history_mother || null,
            family_history_father: f.family_history_father || null,
            family_history_siblings: f.family_history_siblings || null,
            family_history_grandparents: f.family_history_grandparents || null,
            // Non-pathological history
            smoking: f.smoking || null,
            alcohol: f.alcohol || null,
            exercise: f.exercise || null,
            diet: f.diet || null,
            // Pathological history
            surgeries_traumas: f.surgeries_traumas || null,
            // Photo & devices
            photo_url: f.photo_url || null,
            spirometer_id: f.spirometer_id || null,
            inhaler_id: f.inhaler_id || null,
        };
    }

    // GET /api/doctor/my-patients (endpoint original de Pablo)
    getAllPatients(): Observable<Patient[]> {
        return this.http.get<any[]>(this.DOCTOR_URL).pipe(
            map(res => (res || []).map(p => this.mapToFrontend(p))),
            tap(patients => this.patientsSubject.next(patients)),
            catchError(() => of([]))
        );
    }

    // GET /api/patients (nuevo, paginado)
    getPatients(page = 1, limit = 10, search?: string, riskLevel?: string): Observable<PaginatedResponse<Patient>> {
        let params = new HttpParams().set('skip', page.toString()).set('limit', limit.toString());
        if (search) params = params.set('search', search);
        if (riskLevel && riskLevel !== 'all') params = params.set('risk_level', riskLevel);

        return this.http.get<{ data: any[]; total: number; page: number; limit: number }>(
            this.PATIENTS_URL, { params }
        ).pipe(
            map(res => ({ data: (res.data || []).map(p => this.mapToFrontend(p)), total: res.total, page: res.page, limit: res.limit })),
            catchError(() => of({ data: [], total: 0, page, limit }))
        );
    }

    // GET /api/patients/{id}
    getPatientById(id: string | number): Observable<Patient> {
        return this.http.get<any>(`${this.PATIENTS_URL}/${id}`).pipe(
            map(p => this.mapToFrontend(p)),
            catchError(() => of({} as Patient))
        );
    }

    // POST /api/patients
    addPatient(data: Partial<Patient>): Observable<any> {
        return this.http.post<any>(this.PATIENTS_URL, this.mapToBackend(data)).pipe(
            tap(res => {
                if (res?.id) {
                    this.patientsSubject.next([this.mapToFrontend(res), ...this.patientsSubject.value]);
                }
            })
            // Sin catchError: los errores deben propagarse al componente
        );
    }

    // POST /api/auth/check-email
    checkEmailExists(email: string): Observable<{ exists: boolean; patient: any | null }> {
        return this.http.post<{ exists: boolean; patient: any | null }>(`${this.BASE}/auth/check-email`, { email }).pipe(
            catchError(() => of({ exists: false, patient: null }))
        );
    }

    // PATCH /api/patients/{id}
    updatePatient(id: string | number, data: Partial<Patient>): Observable<Patient> {
        return this.http.patch<any>(`${this.PATIENTS_URL}/${id}`, this.mapToBackend(data)).pipe(
            map(p => this.mapToFrontend(p)),
            tap(updated => {
                const list = [...this.patientsSubject.value];
                const idx = list.findIndex(p => String(p.id) === String(id));
                if (idx !== -1) { list[idx] = updated; this.patientsSubject.next(list); }
            }),
            catchError(() => of({} as Patient))
        );
    }

    // DELETE /api/patients/{id}
    deletePatient(id: string | number): Observable<void> {
        return this.http.delete<void>(`${this.PATIENTS_URL}/${id}`).pipe(
            tap(() => this.patientsSubject.next(this.patientsSubject.value.filter(p => String(p.id) !== String(id))))
        );
    }

    // GET /api/patients/stats
    getPatientStats(): Observable<any> {
        return this.http.get<any>(`${this.PATIENTS_URL}/stats`).pipe(
            catchError(() => of({
                total: this.patientsSubject.value.length,
                stable: this.patientsSubject.value.filter(p => p.riskLevel === 'low').length,
                moderate: this.patientsSubject.value.filter(p => p.riskLevel === 'moderate').length,
                critical: this.patientsSubject.value.filter(p => p.riskLevel === 'high').length
            }))
        );
    }

    // GET /api/dashboard/metrics
    getDashboardMetrics(): Observable<DashboardMetrics> {
        return this.http.get<any>(`${this.DASHBOARD_URL}/metrics`).pipe(
            map(m => ({
                totalPatients: m.total_patients,
                activePatients: (m.critical_alerts || 0) + (m.moderate_risk || 0),
                criticalAlerts: m.critical_alerts,
                moderateRisk: m.moderate_risk,
                interventionsToday: m.interventions_today || 0,
                adherenceRate: null,
                averagePef: 0,
                riskDistribution: m.risk_distribution || []
            })),
            catchError(() => this.getPatientStats().pipe(
                map(s => ({
                    totalPatients: s.total, activePatients: s.critical + s.moderate,
                    criticalAlerts: s.critical, moderateRisk: s.moderate,
                    interventionsToday: 0, adherenceRate: null, averagePef: 0,
                    riskDistribution: [
                        { level: 'low', count: s.stable },
                        { level: 'moderate', count: s.moderate },
                        { level: 'high', count: s.critical }
                    ]
                }))
            ))
        );
    }

    // GET /api/measurements/history
    getPatientHistory(id: string | number): Observable<any[]> {
        let params = new HttpParams().set('patient_id', id.toString());
        return this.http.get<any[]>(`${this.MEASUREMENTS_URL}/history`, { params }).pipe(
            map(list => (list || []).map(item => ({
                ...item, date: item.measured_at,
                value: item.pef || item.spo2 || item.heart_rate,
                type: item.pef ? 'pef' : item.spo2 ? 'spo2' : 'heart_rate'
            }))),
            catchError(() => of([]))
        );
    }

    // GET /api/measurements/weekly-trend
    getPEFTrend(id: string | number): Observable<PEFTrend[]> {
        let params = new HttpParams().set('patient_id', id.toString());
        return this.http.get<{ daily_data?: any[] }>(`${this.MEASUREMENTS_URL}/weekly-trend`, { params }).pipe(
            map(res => {
                const best = this.patientsSubject.value.find(p => String(p.id) === String(id))?.personal_best_pef || 500;
                return (res.daily_data || []).map((p: any) => ({
                    date: new Date(p.date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
                    pefValue: p.value,
                    zone: p.value < best * 0.5 ? 'red' : p.value < best * 0.8 ? 'yellow' : 'green'
                } as PEFTrend));
            }),
            catchError(() => of([]))
        );
    }

    // PATCH /api/alerts/{id}/mark-read
    resolveAlert(id: string | number): Observable<boolean> {
        return this.http.patch<any>(`${this.BASE}/alerts/${id}/mark-read`, {}).pipe(
            map(() => true), catchError(() => of(false))
        );
    }

    // POST /api/patients/{id}/predict
    predictPatientRisk(patientId: number | string): Observable<any> {
        return this.http.post<any>(`${this.PATIENTS_URL}/${patientId}/predict`, {});
    }

    getWeeklySummary(_from: string, _to: string): Observable<any> {
        // /api/reports/summary does not exist; use dashboard/metrics which has the same data
        return this.http.get<any>(`${this.DASHBOARD_URL}/metrics`).pipe(
            map(m => {
                const dist: { level: string; count: number }[] = m.risk_distribution || [];
                const low  = dist.find(d => d.level === 'low')?.count  ?? 0;
                const high    = dist.find(d => d.level === 'high')?.count    ?? 0;
                return {
                    total_patients: m.total_patients ?? 0,
                    risk_distribution: { low, high }
                };
            }),
            catchError(() => of({ total_patients: 0, risk_distribution: { low: 0, high: 0 } }))
        );
    }

    downloadWeeklyPdf(from: string, to: string): Observable<Blob> {
        // /api/reports/weekly/pdf does not exist on the backend.
        // Return an error so the caller can handle the fallback client-side.
        const params = new HttpParams().set('date_from', from).set('date_to', to);
        return this.http.get(`${this.BASE}/reports/weekly/pdf`, { params, responseType: 'blob' });
    }

    updateClinicalHistory(patientId: number | string, data: any): Observable<any> {
        return this.http.patch<any>(`${this.PATIENTS_URL}/${patientId}`, data);
    }

    uploadMedicalDocument(patientId: number | string, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('patient_id', patientId.toString());
        return this.http.post<any>(`${this.PATIENTS_URL}/${patientId}/documents`, formData, {
            context: new HttpContext().set(SKIP_RESILIENCE, true)
        });
    }

    // GET /api/dashboard/priority-patients
    getPriorityPatients(): Observable<Patient[]> {
        return this.http.get<any[]>(`${this.DASHBOARD_URL}/priority-patients`).pipe(
            map(list => (list || []).map(p => this.mapToFrontend(p))),
            catchError(() => of([]))
        );
    }

    // GET /api/doctor/my-patients/stats
    getDoctorStats(): Observable<any> {
        return this.http.get<any>(`${this.BASE}/doctor/my-patients/stats`).pipe(
            catchError(() => of(null))
        );
    }

    // PUT /api/patients/{id}/medications
    updatePatientMedications(patientId: number | string, medications: any[]): Observable<any> {
        return this.http.put<any>(`${this.PATIENTS_URL}/${patientId}/medications`, { medications });
    }
}
