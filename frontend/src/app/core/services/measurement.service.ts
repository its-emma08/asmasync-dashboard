import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of, interval, Subject, timer } from 'rxjs';
import { tap, catchError, retry, takeUntil, sampleTime, map } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { VitalSigns, RenderWeeklyTrend } from '../models/measurement.interfaces';
import { environment } from '../../../environments/environment';
import { HealthValidator } from '../../shared/utils/health-validator.util';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MeasurementService implements OnDestroy {
  private readonly API_URL = `${environment.apiUrl}/measurements`;
  private readonly WS_URL = environment.wsUrl;

  private socket$!: WebSocketSubject<any>;
  private destroy$ = new Subject<void>();

  // Reactivity: Subjects for real-time SpO2 and Heart Rate
  // Reactivity: Subjects for real-time SpO2 and Heart Rate
  private lastSpO2Subject = new BehaviorSubject<number | null>(null);
  public lastSpO2$ = this.lastSpO2Subject.asObservable();

  private lastHeartRateSubject = new BehaviorSubject<number | null>(null);
  public lastHeartRate$ = this.lastHeartRateSubject.asObservable();

  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  public isConnected$ = this.isConnectedSubject.asObservable();

  private readonly MAX_RETRIES = 3;
  private realtimeDisabled = false;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.connect();
  }

  /**
   * Connect to WebSocket with exponential backoff reconnection
   */
  private connect(): void {
    if (this.realtimeDisabled || environment.mockMode) return;
    if (this.socket$ && !this.socket$.closed) return;
    const token = this.authService.getToken();
    if (!token) return;
    const wsUrl = `${this.WS_URL}?token=${token}`;

    this.socket$ = webSocket({
        url: wsUrl,
        openObserver: {
            next: () => {
                this.isConnectedSubject.next(true);
this.startHeartbeat();
            }
        },
        closeObserver: {
            next: () => {
                this.isConnectedSubject.next(false);
                this.stopHeartbeat();
            }
        }
    });

    this.socket$.pipe(
        sampleTime(100), // Debounce/Throttle: Max 10 updates per second
        retry({
            count: this.MAX_RETRIES,
            delay: (_error, retryAttempt) => {
                const backoffTime = Math.pow(2, retryAttempt) * 1000;
                console.warn(`[MeasurementService] Connection failed. Retry ${retryAttempt}/${this.MAX_RETRIES} in ${backoffTime}ms`);
                return timer(backoffTime);
            }
        }),
        takeUntil(this.destroy$)
    ).subscribe({
        next: (msg) => this.handleSocketMessage(msg),
        error: (err) => {
            console.error('[MeasurementService] WebSocket Max Retries Reached. Staying Offline.', err);
            this.isConnectedSubject.next(false);
            this.stopHeartbeat();
            this.realtimeDisabled = true;
        }
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat(); // Safety check
    interval(30000).pipe(
      takeUntil(this.destroy$),
      takeUntil(this.isConnected$.pipe(tap(connected => { if(!connected) this.stopHeartbeat(); })))
    ).subscribe(() => {
      if (this.socket$ && !this.socket$.closed) {
        this.socket$.next({ type: 'ping', timestamp: new Date().toISOString() });
        // Set a timeout to check if we get a pong back?
        // For now, the closeObserver will handle network-level drops.
      }
    });
  }

  private stopHeartbeat(): void {
    // Managed by takeUntil
  }
  private handleSocketMessage(msg: any): void {
      if (msg.type === 'vital_signs') {
          const data = msg.data;
          
          // Sanitization: SpO2
          if (data.spo2 !== undefined && !HealthValidator.isSpO2Valid(data.spo2)) {
              console.warn(HealthValidator.getErrorMessage('SpO2', data.spo2));
              return;
          }

          // Sanitization: HR (Basic check remains)
          if (data.heart_rate !== undefined && (data.heart_rate > 250 || data.heart_rate < 0)) {
              console.warn('[MeasurementService] Ignored invalid HR:', data.heart_rate);
              return;
          }

          if (data.spo2) this.lastSpO2Subject.next(data.spo2);
          if (data.heart_rate) this.lastHeartRateSubject.next(data.heart_rate);
      } else if (msg.type === 'pong') {
          this.isConnectedSubject.next(true);
      }
  }

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

  /**
   * Simulate a spirometry reading for QA purposes
   */
  simulateReading(): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/spirometer/simulate`, {}).pipe(
      catchError(err => {
        console.error('Error during simulation:', err);
        return throwError(() => new Error('La simulación falló.'));
      })
    );
  }

  ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
      if (this.socket$) this.socket$.complete();
  }
}
