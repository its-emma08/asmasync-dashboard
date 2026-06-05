import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SecurityService } from '../../../core/services/security.service';
import { ToastService } from '../../../core/services/toast.service';
import { FocusInvalidInputDirective } from '../../../shared/directives/focus-invalid-input.directive';
import { OtpInputComponent } from '../../../shared/components/otp-input/otp-input.component';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, FormsModule, RouterModule,
        MatCardModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule,
        MatSnackBarModule, MatCheckboxModule, MatIconModule,
        FocusInvalidInputDirective, OtpInputComponent
    ],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    loginForm: FormGroup;
    isLoading = signal(false);
    errorMessage = signal<string>('');
    hidePassword = signal(true);
    triggerShake = signal(false);
    showForgotLink = signal(false);
    is2FAStage = signal(false);
    otpCode = signal<string>('');
    twoFactorOptions = signal<string[]>([]);
    isLocked = signal(false);
    lockoutCountdown = signal(0);
    failedAttempts = signal(0);
    loadingMessage = signal('Entrar al Sistema');
    private messageTimer: any;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private supabaseService: SupabaseService,
        private router: Router,
        private toastService: ToastService,
        private securityService: SecurityService
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required]]
        });
    }

    ngOnInit(): void {
        if (this.authService.isAuthenticated()) {
            this.router.navigate(['/dashboard']);
        }
        this.checkLockStatus();
        this.securityService.lockoutTimeRemaining$.pipe(takeUntil(this.destroy$)).subscribe(time => {
            this.lockoutCountdown.set(time);
            if (time > 0) {
                this.isLocked.set(true);
                this.loginForm.disable();
                this.errorMessage.set(`Cuenta bloqueada temporalmente. Intenta en ${time}s`);
            } else if (this.isLocked()) {
                this.isLocked.set(false);
                this.loginForm.enable();
                this.errorMessage.set('');
            }
        });
        this.detectHashError();
    }

    private detectHashError(): void {
        const hash = window.location.hash;
        if (hash && hash.includes('error')) {
            const hashString = hash.startsWith('#') ? hash.substring(1) : hash;
            const params = new URLSearchParams(hashString);
            const error = params.get('error');
            const errorCode = params.get('error_code');
            const errorDescription = params.get('error_description');

            if (error || errorCode || errorDescription) {
                if (errorCode === 'otp_expired' || errorDescription?.includes('expired') || errorDescription?.includes('invalid')) {
                    this.errorMessage.set('El enlace de invitación ha expirado o ya fue utilizado. Por favor, solicita una nueva invitación a tu administrador.');
                } else if (errorDescription) {
                    const decodedMsg = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
                    this.errorMessage.set(decodedMsg);
                } else {
                    this.errorMessage.set('Ocurrió un error al procesar la invitación.');
                }
                
                // Limpiar el hash de la URL para evitar que persista
                window.location.hash = '';
            }
        }
    }

    checkLockStatus() {
        if (this.securityService.isLocked()) {
            this.isLocked.set(true);
            this.loginForm.disable();
        }
    }

    /**
     * Consulta public.users en Supabase para obtener el rol real.
     * Busca primero por supabase_uid, luego por email como fallback.
     */
    private async getRoleFromSupabase(supabaseUid: string, email: string): Promise<string> {
        try {
            const { data, error } = await this.supabaseService
                .from('users')
                .select('role')
                .eq('supabase_uid', supabaseUid)
                .single();

            if (!error && data?.role) return data.role;

            const { data: byEmail } = await this.supabaseService
                .from('users')
                .select('role')
                .eq('email', email)
                .single();

            return byEmail?.role ?? 'doctor';
        } catch {
            return 'doctor';
        }
    }

    /**
     * Completa el proceso de login guardando el usuario con su rol real.
     * FIX condición de carrera: guarda el token en storage ANTES de llamar
     * a verifySupabaseToken para que el interceptor lo encuentre en la primera llamada.
     */
    private async completeLogin(
        supabaseJwt: string,
        supabaseUser: any,
        email: string,
        stopLoading: () => void
    ): Promise<void> {
        // Obtener rol real desde public.users
        const realRole = await this.getRoleFromSupabase(supabaseUser.id, email);

        // FIX: guardar el token de Supabase en storage ANTES de verifySupabaseToken
        // Esto evita la condición de carrera donde el interceptor no encuentra el token
        // en la primera llamada porque storage aún está vacío.
        const projectRef = 'gspjcaqonnvrzuviqrjq';
        const sessionKey = `sb-${projectRef}-auth-token`;
        const existingSession = localStorage.getItem(sessionKey);
        if (!existingSession) {
            // Solo si Supabase no lo guardó aún, lo guardamos manualmente
            localStorage.setItem('access_token', supabaseJwt);
        }

        this.authService.verifySupabaseToken(supabaseJwt).pipe(take(1)).subscribe({
            next: (response: any) => {
                stopLoading();
                this.securityService.recordLoginAttempt(true, email);
                this.failedAttempts.set(0);

                const apiToken = response?.access_token ?? supabaseJwt;
                this.authService.setUserFromSupabase({
                    access_token: apiToken,
                    email: response?.user?.email ?? supabaseUser.email ?? email,
                    full_name: response?.user?.full_name ?? supabaseUser.user_metadata?.['full_name'] ?? email.split('@')[0],
                    role: realRole,
                    id: response?.user?.id ?? supabaseUser.id
                });
                this.toastService.showSuccess('Acceso Autorizado ✓');
                this.router.navigate(['/dashboard']);
            },
            error: (err: any) => {
                // Backend offline: usamos el JWT de Supabase directamente
                if (err.status === 404 || err.status === 0 || err.status === 503) {
                    stopLoading();
                    this.securityService.recordLoginAttempt(true, email);
                    this.failedAttempts.set(0);
                    this.authService.setUserFromSupabase({
                        access_token: supabaseJwt,
                        email: supabaseUser.email ?? email,
                        full_name: supabaseUser.user_metadata?.['full_name'] ?? email.split('@')[0],
                        role: realRole,
                        id: supabaseUser.id
                    });
                    this.toastService.showSuccess('Acceso Autorizado ✓');
                    this.router.navigate(['/dashboard']);
                    return;
                }
                stopLoading();
                const msg = err.error?.detail ?? 'Error al verificar tu sesión. Intenta de nuevo.';
                this.errorMessage.set(msg);
                this.failedAttempts.update(v => v + 1);
                if (this.failedAttempts() >= 2) this.showForgotLink.set(true);
                this.triggerShake.set(true);
                setTimeout(() => this.triggerShake.set(false), 600);
            }
        });
    }

    onSubmit(): void {
        if (this.loginForm.invalid || this.isLocked() || this.isLoading()) return;

        this.isLoading.set(true);
        this.errorMessage.set('');
        this.loadingMessage.set('Validando...');
        this.loginForm.disable();

        this.messageTimer = setTimeout(() => {
            if (this.isLoading()) this.loadingMessage.set('Conectando con Supabase...');
        }, 4000);

        const { email, password } = this.loginForm.value;
        const stopLoading = () => {
            this.isLoading.set(false);
            this.loginForm.enable();
            clearTimeout(this.messageTimer);
            this.loadingMessage.set('Entrar al Sistema');
        };

        this.supabaseService.signIn(email, password).pipe(take(1)).subscribe({
            next: async (result) => {
                if (result.error || !result.data?.session) {
                    stopLoading();
                    this.errorMessage.set('Credenciales no válidas. Verifica tu correo y contraseña.');
                    this.failedAttempts.update(v => v + 1);
                    if (this.failedAttempts() >= 2) this.showForgotLink.set(true);
                    this.triggerShake.set(true);
                    setTimeout(() => this.triggerShake.set(false), 600);
                    return;
                }

                const supabaseJwt = result.data.session.access_token;
                const supabaseUser = result.data.session.user;
                const needs2FA = supabaseUser.user_metadata?.['is_2fa_enabled'] === true;

                if (needs2FA) {
                    stopLoading();
                    this.is2FAStage.set(true);
                    this.authService.signInWithOtp(email).pipe(take(1)).subscribe({
                        next: () => this.toastService.showInfo('Código de verificación enviado a su correo'),
                        error: () => this.toastService.showError('No se pudo enviar el código OTP')
                    });
                    return;
                }

                this.loadingMessage.set('Verificando identidad...');
                await this.completeLogin(supabaseJwt, supabaseUser, email, stopLoading);
            },
            error: () => {
                stopLoading();
                this.errorMessage.set('Error de conexión con el servidor de autenticación.');
                this.failedAttempts.update(v => v + 1);
                if (this.failedAttempts() >= 2) this.showForgotLink.set(true);
                this.triggerShake.set(true);
                setTimeout(() => this.triggerShake.set(false), 600);
            }
        });
    }

    onOtpChange(code: string): void {
        this.otpCode.set(code);
    }

    verify2FA(code?: string): void {
        const finalCode = code || this.otpCode();
        if (finalCode.length < 6 || this.isLoading()) return;

        this.isLoading.set(true);
        this.errorMessage.set('');
        const email = this.loginForm.get('email')?.value;
        if (!email) { this.isLoading.set(false); return; }

        this.authService.verifyOtp(email, finalCode, 'email', false).pipe(take(1)).subscribe({
            next: async (res) => {
                if (res.error) {
                    this.isLoading.set(false);
                    this.handleOtpError(res.error);
                    return;
                }
                const supabaseJwt = res.data?.session?.access_token;
                const supabaseUser = res.data?.session?.user;
                if (!supabaseJwt) {
                    this.isLoading.set(false);
                    this.handleOtpError({ message: 'No se obtuvo sesión de Supabase.' });
                    return;
                }
                const stopLoading = () => { this.isLoading.set(false); };
                await this.completeLogin(supabaseJwt, supabaseUser, email, stopLoading);
            },
            error: (err) => {
                this.isLoading.set(false);
                this.handleOtpError(err);
            }
        });
    }

    private handleOtpError(err: any): void {
        const msg = err.error_description || err.message || 'Código incorrecto o expirado.';
        this.errorMessage.set(msg);
        this.toastService.showError(msg);
        this.triggerShake.set(true);
        setTimeout(() => this.triggerShake.set(false), 500);
        this.otpCode.set('');
    }

    resendCode(): void {
        if (!this.isLoading()) this.onSubmit();
    }

    goToForgotPassword(): void {
        const email = this.loginForm.get('email')?.value || '';
        this.router.navigate(['/auth/forgot-password'], { state: { email } });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
