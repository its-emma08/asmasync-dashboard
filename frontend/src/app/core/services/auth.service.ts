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
    role: 'nurse' | 'admin';
}

export interface LoginResponse {
    access_token?: string;
    refresh_token?: string;
    user?: User;
    requires2FA?: boolean; // New flag
    temp_token?: string;   // Temporary token for 2FA verification
}

@Injectable({
    providedIn: 'root'
})
export class AuthService implements OnDestroy {
    private apiUrl = `${environment.apiUrl}/auth`;
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
            tap(response => this.handleLoginSuccess(response)),
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

        // Real implementation would go here
        return throwError(() => new Error('Backend not implemented'));
    }

    changePassword(oldPass: string, newPass: string): Observable<void> {
        if (environment.mockMode) {
            if (oldPass === 'Admin123!') {
                return of(void 0);
            }
            return throwError(() => new Error('La contraseña actual es incorrecta'));
        }
        return this.http.post<void>(`${this.apiUrl}/change-password`, { oldPass, newPass });
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

                // Clear temp items
                localStorage.removeItem('temp_2fa_token');

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
