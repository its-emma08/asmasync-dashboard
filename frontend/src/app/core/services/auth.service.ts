import { Injectable, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';

import { User, AuditLog } from '../models/settings.types';
import { SupabaseService } from './supabase.service';

export type { User, AuditLog };

export interface LoginResponse {
    access_token?: string;
    refresh_token?: string;
    user?: User;
    require_2fa?: boolean;
    temp_token?: string;
    options?: string[];
}

@Injectable({
    providedIn: 'root'
})
export class AuthService implements OnDestroy {
    private apiUrl = `${environment.apiUrl}/auth`;
    // Note: No 'users' or 'security' base URL as they aren't in Pablo's openapi.json
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();
    get currentUserValue(): User | null { return this.currentUserSubject.value; }

    // New: 2FA State
    private requires2FASubject = new BehaviorSubject<boolean>(false);
    public requires2FA$ = this.requires2FASubject.asObservable();

    private autoLogoutTimer: any;
    private isBrowser: boolean;
    private resetHandler?: () => void;

    constructor(
        private http: HttpClient,
        private router: Router,
        private storageService: StorageService,
        private supabaseService: SupabaseService,
        @Inject(PLATFORM_ID) platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
        if (this.isBrowser) {
            this.loadUserFromSession();
            this.setupActivityListeners();
        }
    }

    register(payload: any): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/register`, payload);
    }

    login(email: string, password: string): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
            tap(response => {
                if (response.temp_token && this.isBrowser) {
                    this.storageService.setItem('temp_2fa_token', response.temp_token);
                }
                this.handleLoginSuccess(response);
            })
        );
    }

    signInWithOtp(email: string): Observable<any> {
        return this.supabaseService.signInWithOtp(email);
    }

    verifyOtp(email: string, token: string, type: any = 'email', shouldLogin: boolean = true): Observable<any> {
        return this.supabaseService.verifyOtp(email, token, type).pipe(
            tap(res => {
                if (shouldLogin && !res.error && res.data?.session) {
                    this.handleSupabaseAuthResponse(res.data);
                }
            })
        );
    }

    private handleSupabaseAuthResponse(response: any): void {
        const session = response.session;
        const user = response.user;
        if (this.isBrowser && session && user) {
            // Sincronizar metadata (2FA, etc)
            if (user.user_metadata?.is_2fa_enabled !== undefined) {
                user.is_2fa_enabled = user.user_metadata.is_2fa_enabled;
            }

            this.storageService.setItem('access_token', session.access_token);
            this.handleUserUpdateSuccess(user); // Usa el método centralizado para persistir y notificar
            this.requires2FASubject.next(false);
            this.startAutoLogoutTimer();
        }
    }

    /**
     * Paso 2 del flujo Supabase (igual que la app móvil):
     * Envía el JWT de Supabase al backend para que lo valide y devuelva el user de Postgres.
     * El backend hace GET a Supabase /auth/v1/user con el Bearer token.
     */
    verifySupabaseToken(supabaseJwt: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/verify`, {}, {
            headers: { Authorization: `Bearer ${supabaseJwt}` }
        });
    }

    verifyTwoFactor(code: string): Observable<LoginResponse> {
        const tempToken = this.storageService.getItem('temp_2fa_token');
        return this.http.post<LoginResponse>(`${this.apiUrl}/login/2fa`, { temp_token: tempToken, code }).pipe(
            tap(response => this.handleLoginSuccess(response))
        );
    }

    setup2FA(): Observable<{ secret: string, qr_code: string }> {
        return this.http.post<{ secret: string, qr_code: string }>(`${this.apiUrl}/2fa/setup`, {});
    }

    verify2FASetup(code: string, secret_key: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/2fa/verify`, { code, secret_key });
    }

    enable2FA(): Observable<any> {
        return this.supabaseService.updateUserMetadata({ is_2fa_enabled: true }).pipe(
            tap(() => {
                const user = this.currentUserValue;
                if (user) {
                    this.handleUserUpdateSuccess({ ...user, is_2fa_enabled: true });
                }
            })
        );
    }

    disable2FA(password: string): Observable<any> {
        const user = this.currentUserValue;
        if (!user) return throwError(() => new Error('No user session'));

        return this.supabaseService.signIn(user.email, password).pipe(
            switchMap(res => {
                if (res.error) throw res.error;
                return this.supabaseService.updateUserMetadata({ is_2fa_enabled: false });
            }),
            tap(() => {
                this.handleUserUpdateSuccess({ ...user, is_2fa_enabled: false });
            })
        );
    }

    changePassword(oldPass: string, newPass: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/change-password`, {
            current_password: oldPass,
            new_password: newPass
        }).pipe(
            catchError((err) => {
                if (err?.status !== 404) {
                    return throwError(() => err);
                }

                const user = this.currentUserValue;
                if (!user?.email) {
                    return throwError(() => new Error('No user session'));
                }

                // Render backend may not expose change-password yet; use Supabase as fallback.
                return this.supabaseService.signIn(user.email, oldPass).pipe(
                    switchMap((signInRes) => {
                        if (signInRes?.error) {
                            throw signInRes.error;
                        }
                        return this.supabaseService.updatePassword(newPass);
                    }),
                    map((updateRes) => {
                        if (updateRes?.error) {
                            throw updateRes.error;
                        }
                        return { message: 'Password updated' };
                    })
                );
            })
        );
    }

    updateProfile(data: Partial<User>): Observable<User> {
        return this.http.put<User>(`${this.apiUrl}/profile`, data).pipe(
            tap(user => this.handleUserUpdateSuccess(user)),
            catchError((err) => {
                if (err?.status !== 403 && err?.status !== 404) {
                    return throwError(() => err);
                }

                return this.supabaseService.updateUserProfile({
                    email: data.email,
                    full_name: data.full_name,
                    specialty: data.specialty,
                    phone: data.phone
                }).pipe(
                    switchMap((res) => {
                        if (res?.error) {
                            throw res.error;
                        }
                        return this.fetchCurrentUser();
                    }),
                    tap((user) => this.handleUserUpdateSuccess(user))
                );
            })
        );
    }

    updateSettings(settings: any): Observable<any> {
        // En la API de Pablo, settings es un endpoint separado: /api/settings
        const baseUrl = environment.apiUrl;
        return this.http.put<any>(`${baseUrl}/settings`, settings).pipe(
            tap(res => {
                // Actualizar info local si es necesario
                const user = this.currentUserValue;
                if (user) {
                    this.handleUserUpdateSuccess({ ...user, settings });
                }
            })
        );
    }

    fetchSettings(): Observable<any> {
        const baseUrl = environment.apiUrl;
        return this.http.get<any>(`${baseUrl}/settings`).pipe(
            tap(settings => {
                const user = this.currentUserValue;
                if (user) {
                    this.handleUserUpdateSuccess({ ...user, settings });
                }
            })
        );
    }

    public handleUserUpdateSuccess(user: User): void {
        if (this.isBrowser) {
            // Sincronización bi-direccional por redundancia y compatibilidad UI
            if (user.settings && user.settings.twoFactor !== undefined) {
                user.is_2fa_enabled = user.settings.twoFactor;
            } else if (user.is_2fa_enabled !== undefined) {
                if (!user.settings) user.settings = {} as any;
                if (user.settings) {
                    user.settings.twoFactor = user.is_2fa_enabled;
                }
            }
            
            this.storageService.setItem('user', user);
            this.currentUserSubject.next(user);
        }
    }

    forgotPassword(email: string): Observable<{ message: string }> {
        return this.supabaseService.signInWithOtp(email).pipe(
            map(res => {
                if (res?.error) {
                    throw res.error;
                }
                return { message: 'OTP sent' };
            })
        );
    }

    verifyResetCode(email: string, code: string): Observable<{ temp_token: string }> {
        return this.supabaseService.verifyOtp(email, code, 'email').pipe(
            tap(res => {
                if (res?.error) {
                    throw res.error;
                }
                if (res?.data?.session) {
                    this.handleSupabaseAuthResponse(res.data);
                }
            }),
            map(() => ({ temp_token: 'supabase-session' }))
        );
    }

    resetPassword(token: string, new_password: string): Observable<{ message: string }> {
        return this.supabaseService.updatePassword(new_password).pipe(
            map(res => {
                if (res?.error) {
                    throw res.error;
                }
                return { message: 'Password updated' };
            })
        );
    }

    public handleLoginSuccess(response: LoginResponse): void {
        if (this.isBrowser) {
            const needs2FA = response.require_2fa;
            if (needs2FA) {
                this.requires2FASubject.next(true);
                return;
            }

            this.requires2FASubject.next(false);

            if (response.access_token && response.user) {
                this.storageService.setItem('access_token', response.access_token);
                this.storageService.setItem('user', response.user);
                this.currentUserSubject.next(response.user);
                this.storageService.removeItem('temp_2fa_token');
                this.startAutoLogoutTimer();
            }
        }
    }

    /**
     * Sincroniza una sesión de Supabase con el sistema de auth de la app.
     * Útil cuando el usuario se autentica via Supabase (app móvil / web).
     */
    setUserFromSupabase(payload: {
        access_token: string;
        email: string;
        full_name: string;
        role: string;
        id: string;
    }): void {
        if (!this.isBrowser) return;

        const user: any = {
            id: payload.id,
            email: payload.email,
            full_name: payload.full_name,
            role: payload.role,
            is_2fa_enabled: false,
            doctor_code: '',
            created_at: new Date().toISOString()
        };

        this.storageService.setItem('access_token', payload.access_token);
        this.storageService.setItem('user', user);
        this.currentUserSubject.next(user);
        this.requires2FASubject.next(false);
        this.startAutoLogoutTimer();

        // Sincronizar rol en la BD. Si es doctor, ESPERAR a que el register termine
        // antes de pedir el perfil (evita race condition con _ensure_doctor_profile).
        this.http.post<any>(`${environment.apiUrl}/auth/register`,
            { full_name: payload.full_name, role: payload.role },
            { headers: { Authorization: `Bearer ${payload.access_token}` } }
        ).pipe(
            catchError(() => of(null)),
            switchMap(() => {
                if (payload.role !== 'doctor') return of(null);
                return this.http.get<any>(`${environment.apiUrl}/doctor/profile`, {
                    headers: { Authorization: `Bearer ${payload.access_token}` }
                }).pipe(catchError(() => of(null)));
            })
        ).subscribe(profile => {
            if (profile?.doctor_code) {
                const enriched = {
                    ...user,
                    doctor_code:   profile.doctor_code,
                    specialty:     profile.specialty     || user.specialty,
                    hospital_name: profile.hospital_name || user.hospital_name,
                    is_verified:   profile.is_verified   ?? user.is_verified,
                };
                this.storageService.setItem('user', enriched);
                this.currentUserSubject.next(enriched);
            }
        });
    }

    /** Actualiza el usuario en storage y en el BehaviorSubject sin reemplazar el token */
    updateStoredUser(partialUser: Partial<any>): void {
        if (!this.isBrowser) return;
        const current = this.currentUserSubject.value;
        if (!current) return;
        const updated = { ...current, ...partialUser };
        this.storageService.setItem('user', updated);
        this.currentUserSubject.next(updated);
    }

    logout(): void {
        if (this.isBrowser) {
            // Cerrar sesión en Supabase y limpiar storage local.
            // No llamamos al backend de Pablo porque /auth/logout no existe en su API.
            const projectRef = 'gspjcaqonnvrzuviqrjq';
            localStorage.removeItem(`sb-${projectRef}-auth-token`);

            this.storageService.clear();
            this.clearAutoLogoutTimer();
        }
        this.currentUserSubject.next(null);
        this.requires2FASubject.next(false);
        this.router.navigate(['/login']);
    }

    refreshToken(): Observable<{ access_token: string }> {
        return this.http.post<{ access_token: string }>(`${this.apiUrl}/refresh`, {}, { withCredentials: true }).pipe(
            tap((response) => {
                if (this.isBrowser && response.access_token) {
                    this.storageService.setItem('access_token', response.access_token);
                }
            }),
            catchError((err) => {
                this.logout();
                return throwError(() => err);
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
        return this.http.get<User>(`${this.apiUrl}/profile`).pipe(
            catchError(() => {
                // Si el perfil de Pablo falla, intentar lo de Supabase.
                // Merge con el usuario existente para no perder campos locales.
                return this.supabaseService.getCurrentUser().pipe(
                    map(sbUser => {
                        if (!sbUser) throw new Error('No sessions found');
                        const existing = this.currentUserSubject.value;
                        return {
                            ...(existing || {}),
                            id: sbUser.id as any,
                            email: sbUser.email || existing?.email || '',
                            full_name: sbUser.user_metadata?.['full_name'] || existing?.full_name || '',
                            role: sbUser.user_metadata?.['role'] || existing?.role || 'doctor',
                            is_2fa_enabled: sbUser.user_metadata?.['is_2fa_enabled'] ?? existing?.is_2fa_enabled ?? false,
                            created_at: sbUser.created_at || existing?.created_at
                        } as User;
                    })
                );
            }),
            switchMap(user => {
                return this.supabaseService.getCurrentUser().pipe(
                    map(sbUser => {
                        // Merge con el usuario existente para preservar campos no retornados
                        const existing = this.currentUserSubject.value;
                        const merged: User = { ...(existing || {}), ...user };
                        if (sbUser && sbUser.user_metadata?.['is_2fa_enabled'] !== undefined) {
                            merged.is_2fa_enabled = sbUser.user_metadata['is_2fa_enabled'];
                        }
                        this.currentUserSubject.next(merged);
                        if (this.isBrowser) {
                            this.storageService.setItem('user', merged);
                        }
                        return merged;
                    })
                );
            })
        );
    }

    /**
     * Audit logs mock for UI compatibility 
     */
    getAuditLogs(): Observable<AuditLog[]> {
        const logs: AuditLog[] = [
            {
                id: 1,
                action: 'INICIO_SESION',
                entity: 'auth',
                user_id: this.currentUserValue?.id || 1,
                ip_address: '189.203.45.12',
                user_agent: 'Chrome 122.0 / Windows 11',
                created_at: new Date(Date.now() - 5 * 60000).toISOString()
            },
            {
                id: 2,
                action: 'CONSULTA_EXPEDIENTE',
                entity: 'patient',
                entity_id: 12,
                user_id: this.currentUserValue?.id || 1,
                ip_address: '189.203.45.12',
                user_agent: 'Chrome 122.0 / Windows 11',
                created_at: new Date(Date.now() - 15 * 60000).toISOString()
            },
            {
                id: 3,
                action: 'ACTUALIZACION_CONFIGURACION',
                entity: 'settings',
                user_id: this.currentUserValue?.id || 1,
                ip_address: '189.203.45.12',
                user_agent: 'Chrome 122.0 / Windows 11',
                created_at: new Date(Date.now() - 120 * 60000).toISOString()
            },
            {
                id: 4,
                action: 'DESCARGA_REPORTE_PDF',
                entity: 'patient',
                entity_id: 12,
                user_id: this.currentUserValue?.id || 1,
                ip_address: '189.203.45.12',
                user_agent: 'Chrome 122.0 / Windows 11',
                created_at: new Date(Date.now() - 240 * 60000).toISOString()
            }
        ];
        return of(logs);
    }

    private loadUserFromSession(): void {
        const user = this.storageService.getItem('user') as User;
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
            this.resetHandler = reset;

            events.forEach(event => {
                window.addEventListener(event, this.resetHandler!);
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
        if (this.isBrowser && this.resetHandler) {
            const events = ['mousemove', 'keydown', 'click', 'scroll'];
            events.forEach(event => {
                window.removeEventListener(event, this.resetHandler!);
            });
        }
    }
}
