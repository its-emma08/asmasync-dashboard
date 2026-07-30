// frontend/src/app/core/services/google-auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, throwError } from 'rxjs';
import { tap, catchError, switchMap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { PatientService } from './patient.service';
import { GoogleVerifyResponse, RenderUser, RenderStats } from '../models/auth.interfaces';

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private readonly renderApiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private patientService: PatientService
  ) {}

  /**
   * Completes the Google Auth flow:
   * 1. Verifies id_token with Render API
   * 2. Fetches profile and stats for consistency
   * 3. Updates application state reactively
   */
  loginWithGoogle(idToken: string): Observable<{ user: RenderUser; stats: RenderStats }> {
    return this.http.post<GoogleVerifyResponse>(`${this.renderApiUrl}/auth/verify`, { id_token: idToken }).pipe(
      tap(res => {
        // Interceptor will capture this token for subsequent calls
        this.authService.handleLoginSuccess({
          access_token: res.access_token,
          user: res.user as any // Transitioning between local and render user types
        });
      }),
      switchMap(() => this.synchronizeData()),
      catchError(err => {
        console.error('Google Auth Sync Failure:', err);
        return throwError(() => new Error('Failed to synchronize data after Google login.'));
      })
    );
  }

  /**
   * Ensures data consistency after authentication
   */
  private synchronizeData(): Observable<{ user: RenderUser; stats: RenderStats }> {
    return forkJoin({
      user: this.http.get<RenderUser>(`${this.renderApiUrl}/auth/profile`),
      stats: this.patientService.getPatientStats()
    }).pipe(
      tap(({ user, stats }) => {
        this.authService.handleUserUpdateSuccess(user as any);
        // Refresh patients list to ensure everything matches
        this.patientService.getAllPatients().subscribe();
      })
    );
  }
}
