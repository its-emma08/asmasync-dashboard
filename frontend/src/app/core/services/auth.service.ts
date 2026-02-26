import { Injectable, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';

export interface User {
    id: number;
    full_name: string;
    email: string;
    role: 'nurse' | 'admin' | 'doctor' | 'patient';
    is_2fa_enabled?: boolean;
}

export interface LoginResponse {
    access_token?: string;
    refresh_token?: string;
    user?: User;
    requires2FA?: boolean; // New flag
    temp_token?: string;   // Temporary token for 2FA verification
    options?: string[];    // Array of string options for interactive 2FA
}

@Injectable({
    providedIn: 'root'
})
export class AuthService implements OnDestroy {
    private apiUrl = `${environment.apiUrl}/auth`;
    private usersApiUrl = `${environment.apiUrl}/users`;
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    // New: 2FA State
    private requires2FASubject = new BehaviorSubject<boolean>(false);
    public requires2FA$ = this.requires2FASubject.asObservable();

    private autoLogoutTimer: any;
    private isBrowser: boolean;

    constructor(
        private http: HttpClient,
        private router: Router,
        private storageService: StorageService, // Injected for encryption
        @Inject(PLATFORM_ID) platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
        if (this.isBrowser) {
            this.loadUserFromSession();
            this.setupActivityListeners();
        }
    }

    register(payload: any): Observable<any> {
        if (environment.mockMode) {
            return of({ message: "Mock register successful" });
        }
        return this.http.post(`${this.apiUrl}/register`, payload);
    }

    login(email: string, password: string): Observable<LoginResponse> {
        // MOCK MODE: Return mock immediately — zero network calls
        if (environment.mockMode) {
            if (email === 'admin@asmasync.com' && password === 'Admin123!') {
                // SIMULATE 2FA REQUIREMENT
                const mockResponse: LoginResponse = {
                    requires2FA: true,
                    temp_token: 'temp-2fa-token-123'
                };

                // Store temp token
                if (this.isBrowser) {
                    this.storageService.setItem('temp_2fa_token', mockResponse.temp_token);
                }

                return of(mockResponse);
            }
            return throwError(() => new Error('Credenciales inválidas'));
        }

        // REAL MODE: Hit backend
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
            tap(response => {
                if (response.temp_token && this.isBrowser) {
                    this.storageService.setItem('temp_2fa_token', response.temp_token);
                }
                this.handleLoginSuccess(response);
            }),
            catchError(error => throwError(() => error))
        );
    }

    verifyTwoFactor(code: string): Observable<LoginResponse> {
        if (environment.mockMode) {
            if (code === '123456') {
                const mockFinalResponse: LoginResponse = {
                    access_token: 'mock-access-token',
                    refresh_token: 'mock-refresh-token',
                    user: {
                        id: 1,
                        full_name: 'Dr. Admin Mock',
                        email: 'admin@asmasync.com',
                        role: 'admin'
                    }
                };
                this.handleLoginSuccess(mockFinalResponse);
                return of(mockFinalResponse);
            }
            return throwError(() => new Error('Código incorrecto'));
        }

        const tempToken = this.storageService.getItem('temp_2fa_token');
        return this.http.post<LoginResponse>(`${this.apiUrl}/login/2fa`, { temp_token: tempToken, code }).pipe(
            tap(response => this.handleLoginSuccess(response)),
            catchError(error => throwError(() => error))
        );
    }

    setup2FA(): Observable<{ secret: string, qr_code: string }> {
        return this.http.post<{ secret: string, qr_code: string }>(`${this.apiUrl}/2fa/setup`, {});
    }

    verify2FASetup(code: string, secret_key: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/2fa/verify`, { code, secret_key });
    }

    disable2FA(password: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/2fa/disable`, { password });
    }

    changePassword(oldPass: string, newPass: string): Observable<void> {
        if (environment.mockMode) {
            if (oldPass === 'Admin123!') {
                return of(void 0);
            }
            return throwError(() => new Error('La contraseña actual es incorrecta'));
        }
        return this.http.put<void>(`${this.usersApiUrl}/me/password`, { current_password: oldPass, new_password: newPass });
    }

    updateProfile(data: any): Observable<User> {
        if (environment.mockMode) {
            const mockUser = this.currentUserSubject.value || {} as User;
            const updatedUser = { ...mockUser, ...data };
            this.handleUserUpdateSuccess(updatedUser);
            return of(updatedUser);
        }
        return this.http.put<User>(`${this.usersApiUrl}/me`, data).pipe(
            tap(user => this.handleUserUpdateSuccess(user))
        );
    }

    public handleUserUpdateSuccess(user: User): void {
        if (this.isBrowser) {
            this.storageService.setItem('user', user);
            this.currentUserSubject.next(user);
        }
    }

    forgotPassword(email: string): Observable<{ message: string }> {
        if (environment.mockMode) {
            // console.log(`[Mock] Enviando código OTP a ${email}`);
            return of({ message: "Si el correo está registrado, recibirás un código de 6 dígitos." });
        }
        return this.http.post<{ message: string }>(`${this.apiUrl}/forgot-password`, { email });
    }

    verifyResetCode(email: string, code: string): Observable<{ temp_token: string }> {
        if (environment.mockMode) {
            if (code === '123456') {
                return of({ temp_token: 'mock-temp-reset-token' });
            }
            return throwError(() => new Error('El código es inválido o ha expirado.'));
        }
        return this.http.post<{ temp_token: string }>(`${this.apiUrl}/verify-reset-code`, { email, code });
    }

    resetPassword(token: string, new_password: string): Observable<{ message: string }> {
        if (environment.mockMode) {
            return of({ message: "Contraseña actualizada exitosamente." });
        }
        return this.http.post<{ message: string }>(`${this.apiUrl}/reset-password`, { token, new_password });
    }

    public handleLoginSuccess(response: LoginResponse): void {
        if (this.isBrowser) {
            if (response.requires2FA) {
                this.requires2FASubject.next(true);
                return; // Stop here, redirect to 2FA page in component
            }

            this.requires2FASubject.next(false);

            if (response.access_token && response.user) {
                this.storageService.setItem('access_token', response.access_token);
                this.storageService.setItem('refresh_token', response.refresh_token);
                this.storageService.setItem('user', response.user);
                this.currentUserSubject.next(response.user);

                // SEC-001: Clear temp token via encrypted StorageService (not raw localStorage)
                this.storageService.removeItem('temp_2fa_token');

                this.startAutoLogoutTimer();
            }
        }
    }

    logout(): void {
        if (this.isBrowser) {
            if (!environment.mockMode) {
                this.http.post(`${this.apiUrl}/logout`, {}).pipe(
                    catchError(() => of(null))
                ).subscribe();
            }
            this.storageService.clear();
            this.clearAutoLogoutTimer();
        }
        this.currentUserSubject.next(null);
        this.requires2FASubject.next(false);
        this.router.navigate(['/login']);
    }

    refreshToken(): Observable<any> {
        if (environment.mockMode) {
            return of({ access_token: 'mock-refreshed-token' });
        }

        let refreshToken: string | null = null;
        if (this.isBrowser) {
            refreshToken = this.storageService.getItem('refresh_token');
        }

        if (!refreshToken) {
            this.logout();
            return throwError(() => new Error('No refresh token'));
        }

        return this.http.post(`${this.apiUrl}/refresh-token`, { refresh_token: refreshToken }).pipe(
            tap((response: any) => {
                if (this.isBrowser && response.access_token) {
                    this.storageService.setItem('access_token', response.access_token);
                }
            })
        );
    }

    getToken(): string | null {
        if (this.isBrowser) {
            return this.storageService.getItem('access_token');
        }
        return null;
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    getCurrentUser(): Observable<User | null> {
        return this.currentUser$;
    }

    fetchCurrentUser(): Observable<User> {
        if (environment.mockMode) {
            const mockUser = this.currentUserSubject.value || {} as User;
            return of(mockUser);
        }
        return this.http.get<User>(`${this.usersApiUrl}/me`).pipe(
            tap(user => {
                this.currentUserSubject.next(user);
                if (this.isBrowser) {
                    this.storageService.setItem('user', user);
                }
            })
        );
    }

    getAuditLogs(limit: number = 50): Observable<any[]> {
        if (environment.mockMode) {
            return of([
                { id: 1, action: 'LOGIN', entity: 'USER', ip_address: '127.0.0.1', created_at: new Date().toISOString() }
            ]);
        }
        // BUG-003 fix: env.apiUrl already contains /api/v1, no need to add /v1 again
        return this.http.get<any[]>(`${environment.apiUrl}/security/audit-logs?limit=${limit}`);
    }

    private loadUserFromSession(): void {
        const user = this.storageService.getItem('user');
        if (user) {
            this.currentUserSubject.next(user);
            this.startAutoLogoutTimer();
        }
    }

    private startAutoLogoutTimer(): void {
        this.clearAutoLogoutTimer();
        if (this.isBrowser) {
            const timeoutDuration = 12 * 60 * 60 * 1000; // 12h default inside app
            // Note: The Idle Service handles the short 5min timeout.
            // This is just a backup for long sessions.
            this.autoLogoutTimer = setTimeout(() => {
                this.logout();
            }, timeoutDuration);
        }
    }

    private clearAutoLogoutTimer(): void {
        if (this.autoLogoutTimer) {
            clearTimeout(this.autoLogoutTimer);
            this.autoLogoutTimer = null;
        }
    }

    private setupActivityListeners(): void {
        if (this.isBrowser) {
            const events = ['mousemove', 'keydown', 'click', 'scroll'];
            let lastReset = 0;
            const throttleTime = 30000;

            const reset = () => {
                const now = Date.now();
                if (now - lastReset > throttleTime) {
                    this.resetTimer();
                    lastReset = now;
                }
            };

            events.forEach(event => {
                window.addEventListener(event, reset);
            });
        }
    }

    public resetTimer(): void {
        if (this.isAuthenticated()) {
            this.startAutoLogoutTimer();
        }
    }

    ngOnDestroy(): void {
        this.clearAutoLogoutTimer();
    }
}
