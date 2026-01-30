import { Injectable, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, Subscription, timer } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'nurse' | 'admin';
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    user: User;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService implements OnDestroy {
    private apiUrl = `${environment.apiUrl}/auth`;
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    private autoLogoutTimer: any;
    private isBrowser: boolean;

    constructor(
        private http: HttpClient,
        private router: Router,
        @Inject(PLATFORM_ID) platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
        if (this.isBrowser) {
            this.loadUserFromSession();
        }
    }

    // Login
    login(email: string, password: string): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
            tap(response => {
                if (this.isBrowser) {
                    sessionStorage.setItem('access_token', response.access_token);
                    sessionStorage.setItem('refresh_token', response.refresh_token);
                    sessionStorage.setItem('user', JSON.stringify(response.user));
                    this.currentUserSubject.next(response.user);
                    this.startAutoLogoutTimer();
                }
            }),
            catchError(error => {
                return throwError(() => error);
            })
        );
    }

    // Logout
    logout(): void {
        if (this.isBrowser) {
            // Intentar notificar al backend, pero limpiar localmente sin esperar
            this.http.post(`${this.apiUrl}/logout`, {}).pipe(
                catchError(() => of(null))
            ).subscribe();

            sessionStorage.clear();
            this.clearAutoLogoutTimer();
        }
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
    }

    // Renovar token
    refreshToken(): Observable<any> {
        let refreshToken: string | null = null;
        if (this.isBrowser) {
            refreshToken = sessionStorage.getItem('refresh_token');
        }

        if (!refreshToken) {
            this.logout();
            return throwError(() => new Error('No refresh token'));
        }

        return this.http.post(`${this.apiUrl}/refresh-token`, { refresh_token: refreshToken }).pipe(
            tap((response: any) => {
                if (this.isBrowser && response.access_token) {
                    sessionStorage.setItem('access_token', response.access_token);
                }
            })
        );
    }

    // Obtener token actual
    getToken(): string | null {
        if (this.isBrowser) {
            return sessionStorage.getItem('access_token');
        }
        return null;
    }

    // Verificar si está autenticado
    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    // Obtener usuario actual
    getCurrentUser(): Observable<User | null> {
        return this.currentUser$;
    }

    private loadUserFromSession(): void {
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                this.currentUserSubject.next(user);
                this.startAutoLogoutTimer();
            } catch (e) {
                console.error('Error parsing user from session', e);
                this.logout();
            }
        }
    }

    // Auto-logout por inactividad (15 min)
    private startAutoLogoutTimer(): void {
        this.clearAutoLogoutTimer();
        if (this.isBrowser) {
            // 15 minutos = 15 * 60 * 1000
            this.autoLogoutTimer = setTimeout(() => {
                alert('Tu sesión ha expirado por inactividad.');
                this.logout();
            }, 15 * 60 * 1000);
        }
    }

    private clearAutoLogoutTimer(): void {
        if (this.autoLogoutTimer) {
            clearTimeout(this.autoLogoutTimer);
            this.autoLogoutTimer = null;
        }
    }

    // Reiniciar timer en actividad (se llamaría desde un interceptor o evento global)
    public resetTimer(): void {
        if (this.isAuthenticated()) {
            this.startAutoLogoutTimer();
        }
    }

    ngOnDestroy(): void {
        this.clearAutoLogoutTimer();
    }
}
