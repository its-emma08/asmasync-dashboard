import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { VitalSigns, RenderWeeklyTrend } from '../models/measurement.interfaces';
import { environment } from '../../../environments/environment';
import { HealthValidator } from '../../shared/utils/health-validator.util';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MeasurementService {
  private readonly API_URL = `${environment.apiUrl}/measurements`;

  // Reactivity: Subjects for real-time SpO2 and Heart Rate
  private lastSpO2Subject = new BehaviorSubject<number | null>(null);
  public lastSpO2$ = this.lastSpO2Subject.asObservable();

  private lastHeartRateSubject = new BehaviorSubject<number | null>(null);
  public lastHeartRate$ = this.lastHeartRateSubject.asObservable();

  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  public isConnected$ = this.isConnectedSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {}

  /**
   * Post new vital signs with frontend sanitization
   */
  postVitals(vitals: VitalSigns): Observable<VitalSigns> {
    // Sanitization before sending
    if (vitals.spo2 !== undefined && !HealthValidator.isSpO2Valid(vitals.spo2)) {
        return throwError(() => new Error('Error de lectura: SpO2 fuera del rango clínico (50-100).'));
    }

    return this.http.post<VitalSigns>(`${this.API_URL}/vitals`, vitals).pipe(
      tap(res => {
        this.lastSpO2Subject.next(res.spo2);
        this.lastHeartRateSubject.next(res.heart_rate);
      }),
      catchError(err => {
        console.error('Error posting vitals:', err);
        return throwError(() => new Error('Error al registrar signos vitales.'));
      })
    );
  }

  /**
   * Get weekly trend data for Chart.js.
   * Transforms backend format {max_pef, avg_pef, daily_data:[{date,value}]}
   * into the frontend format {dates, pef_values, fev1_values, spo2_values}.
   */
  getWeeklyTrend(): Observable<RenderWeeklyTrend> {
    return this.http.get<any>(`${this.API_URL}/weekly-trend`).pipe(
      map(res => {
        const daily: any[] = res.daily_data || [];
        return {
          dates: daily.map((d: any) =>
            new Date(d.date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
          ),
          pef_values: daily.map((d: any) => d.value ?? 0),
          fev1_values: daily.map(() => 0),
          spo2_values: []
        } as RenderWeeklyTrend;
      }),
      catchError(err => {
        console.warn('[MeasurementService] weekly-trend unavailable, using empty fallback.', err);
        return of({ dates: [], pef_values: [], fev1_values: [], spo2_values: [] });
      })
    );
  }

  simulateReading(payload: {
    user_identifier: string;
    pef: number;
    fev1?: number;
    symptoms?: string;
    symptom_intensity?: string;
    notes?: string;
    measured_at?: string;
  }): Observable<any> {
    const headers = { 'x-api-key': 'ClaveSecretaParaMaestros' };
    return this.http.post<any>(`${this.API_URL}/spirometer/simulate`, payload, { headers }).pipe(
      catchError(err => {
        console.error('Error during simulation:', err);
        return throwError(() => new Error(err.error?.detail || 'La simulación falló.'));
      })
    );
  }
}
