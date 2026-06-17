import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient, AuthResponse, AuthTokenResponsePassword, Session, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;
    private supabaseAdmin?: SupabaseClient;

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {
        // ── Client público (anon key) — Para usuarios autenticados normales
        this.supabase = createClient(
            environment.supabaseUrl,
            environment.supabaseAnonKey
        );
    }

    /**
     * Exposes the Supabase client for database operations 
     * (select, insert, update, delete)
     */
    public get client(): SupabaseClient {
        return this.supabase;
    }

    /**
     * Database 'from' helper (Typed)
     */
    public from(table: string) {
        return this.supabase.from(table);
    }

    /**
     * Lazy-load the admin client to avoid multiple GoTrueClient warnings
     * when the service is initialized.
     */
    private getAdminClient(): SupabaseClient {
        if (!environment.supabaseServiceRoleKey || environment.supabaseServiceRoleKey.includes('YOUR_SERVICE_ROLE_KEY')) {
            throw new Error('SERVICE_ROLE_KEY no configurada. Mueva invitaciones admin al backend seguro.');
        }
        if (!this.supabaseAdmin) {
            this.supabaseAdmin = createClient(
                environment.supabaseUrl,
                environment.supabaseServiceRoleKey,
                { auth: { autoRefreshToken: false, persistSession: false } }
            );
        }
        return this.supabaseAdmin;
    }

    // --- AUTH ---

    signUp(email: string, password: string, metadata?: Record<string, any>): Observable<AuthResponse> {
        return from(this.supabase.auth.signUp({ email, password, options: { data: metadata } }));
    }

    signIn(email: string, password: string): Observable<AuthTokenResponsePassword> {
        return from(this.supabase.auth.signInWithPassword({ email, password }));
    }

    /**
     * Envía un PIN de 6 dígitos al correo del usuario.
     * Supabase maneja el envío automáticamente.
     */
    signInWithOtp(email: string): Observable<any> {
        return from(this.supabase.auth.signInWithOtp({ email }));
    }

    /**
     * Verifica el PIN ingresado por el usuario.
     */
    verifyOtp(email: string, token: string, type: 'email' | 'signup' | 'recovery' | 'magiclink' = 'email'): Observable<any> {
        return from(this.supabase.auth.verifyOtp({ email, token, type }));
    }

    signOut(): Observable<{ error: any }> {
        return from(this.supabase.auth.signOut());
    }

    getSession(): Observable<Session | null> {
        return from(this.supabase.auth.getSession()).pipe(
            map(res => res.data?.session ?? null)
        );
    }

    getAccessToken(): Observable<string | null> {
        return this.getSession().pipe(
            map(session => session?.access_token ?? null)
        );
    }

    onAuthStateChange(callback: (event: string, session: Session | null) => void): void {
        this.supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    }

    getCurrentUser(): Observable<User | null> {
        return from(this.supabase.auth.getUser()).pipe(
            map(res => res.data?.user ?? null)
        );
    }

    resetPasswordForEmail(email: string): Observable<{ error: any }> {
        const origin = isPlatformBrowser(this.platformId) ? window.location.origin : 'http://localhost:4200';
        return from(
            this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${origin}/auth/reset-password`
            })
        );
    }

    updatePassword(newPassword: string): Observable<{ error: any }> {
        return from(
            this.supabase.auth.updateUser({ password: newPassword })
        ).pipe(map(res => ({ error: res.error })));
    }

    updateUserProfile(data: { email?: string; full_name?: string; specialty?: string; phone?: string }): Observable<{ data: any; error: any }> {
        return from(
            this.supabase.auth.updateUser({
                email: data.email,
                data: {
                    full_name: data.full_name,
                    specialty: data.specialty,
                    phone: data.phone
                }
            })
        ).pipe(map(res => ({ data: res.data, error: res.error })));
    }

    /**
     * Actualiza la metadata del usuario actualmente autenticado.
     * Útil para persistir estados como is_2fa_enabled sin depender del backend local.
     */
    updateUserMetadata(data: any): Observable<{ data: any; error: any }> {
        return from(this.supabase.auth.updateUser({ data })).pipe(
            map(res => ({ data: res.data, error: res.error }))
        );
    }

    // ─────────────────────────────────────────────────────────
    // ADMIN — Requiere SERVICE_ROLE_KEY
    // ─────────────────────────────────────────────────────────

    /**
     * Invita a un doctor por correo electrónico.
     * Supabase envía automáticamente el Magic Link de invitación
     * usando el proveedor SMTP configurado en el servidor.
     *
     * @param email  Correo del doctor a invitar
     * @param metadata  Datos adicionales: nombre, especialidad, rol
     */
    inviteDoctor(email: string, metadata?: { full_name?: string; specialty?: string; role?: string }): Observable<{ data: any; error: any }> {
        try {
            return from(
                this.getAdminClient().auth.admin.inviteUserByEmail(email, {
                    data: {
                        full_name: metadata?.full_name ?? '',
                        specialty: metadata?.specialty ?? '',
                        role: metadata?.role ?? 'doctor'
                    }
                })
            );
        } catch (error: any) {
            return from(Promise.resolve({ data: null, error }));
        }
    }

    /**
     * Lista todos los usuarios invitados (para audit trail en la UI).
     * Requiere SERVICE_ROLE_KEY.
     */
    listUsers(page = 1, perPage = 50): Observable<{ data: any; error: any }> {
        return from(
            this.getAdminClient().auth.admin.listUsers({ page, perPage })
        );
    }
}
