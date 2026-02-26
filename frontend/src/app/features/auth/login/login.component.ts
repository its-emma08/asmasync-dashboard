import { Component, OnInit, signal } from '@angular/core';
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
import { SecurityService } from '../../../core/services/security.service';
import { ToastService } from '../../../core/services/toast.service';
import { FocusInvalidInputDirective } from '../../../shared/directives/focus-invalid-input.directive';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        RouterModule,
        MatCardModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatCheckboxModule,
        MatIconModule,
        FocusInvalidInputDirective
    ],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    isLoading = signal(false);
    errorMessage = signal<string>('');
    hidePassword = signal(true);
    triggerShake = signal(false); // New Signal for Animation
    is2FAStage = signal(false); // Transición de login a 2FA
    twoFactorCode = signal('');
    twoFactorOptions = signal<string[]>([]); // Options for Interactive Email 2FA

    // Security Signals
    isLocked = signal(false);
    lockoutCountdown = signal(0);

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private toastService: ToastService, // Injected
        private securityService: SecurityService
    ) {
        this.loginForm = this.fb.group({
            email: ['admin@asmasync.com', [Validators.required, Validators.email]],
            password: ['Admin123!', [
                Validators.required,
                Validators.minLength(8)
            ]]
        });
    }

    ngOnInit(): void {
        if (this.authService.isAuthenticated()) {
            this.router.navigate(['/dashboard']);
        }

        // Check Security Lock
        this.checkLockStatus();
        this.securityService.lockoutTimeRemaining$.subscribe(time => {
            this.lockoutCountdown.set(time);
            if (time > 0) {
                this.isLocked.set(true);
                this.loginForm.disable();
                this.errorMessage.set(`Cuenta bloqueada temporalmente. Intenta en ${time}s`);
            } else {
                if (this.isLocked()) {
                    this.isLocked.set(false);
                    this.loginForm.enable();
                    this.errorMessage.set('');
                }
            }
        });
    }

    checkLockStatus() {
        if (this.securityService.isLocked()) {
            this.isLocked.set(true);
            this.loginForm.disable();
        }
    }

    onSubmit(): void {
        if (this.loginForm.invalid || this.isLocked() || this.isLoading()) {
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');
        this.loginForm.disable();

        const { email, password } = this.loginForm.value;

        this.authService.login(email, password).subscribe({
            next: (response) => {
                this.isLoading.set(false);
                this.securityService.recordLoginAttempt(true, email);

                if (response.requires2FA) {
                    this.toastService.showInfo('Revisa tu correo para continuar');
                    this.twoFactorOptions.set(response.options || []);
                    this.is2FAStage.set(true);
                    this.loginForm.enable(); // Por si retroceden
                } else {
                    this.toastService.showSuccess('Bienvenido de nuevo');
                    this.router.navigate(['/dashboard']);
                }
            },
            error: (err) => {
                this.isLoading.set(false);
                this.loginForm.enable();

                this.securityService.recordLoginAttempt(false, email);

                let msg = 'No pudimos iniciar sesión. Verifica tu correo y contraseña.';

                // Si el backend retorna 429 Locked
                if (err.status === 429) {
                    msg = err.error?.detail || 'Cuenta bloqueada temporalmente por seguridad tras múltiples intentos fallidos.';
                    this.toastService.showError(msg);
                    // Dispara el bloqueo local apoyándonos en el security service para la cuenta regresiva visual
                    this.securityService.recordLoginAttempt(false, email); // Esto eventualmente dispara el lock local
                    this.isLocked.set(true);
                    this.loginForm.disable();
                } else {
                    if (this.loginForm.get('password')?.hasError('pattern')) {
                        msg = 'Tu contraseña debe ser más segura. Asegúrate de incluir mayúsculas, números y símbolos.';
                    }
                    this.toastService.showError(msg);
                }

                this.errorMessage.set(msg);
                this.triggerShakeEffect();
                console.error(err);
            }
        });
    }

    select2FACode(code: string): void {
        if (this.isLoading()) return;

        this.twoFactorCode.set(code);
        this.isLoading.set(true);
        this.errorMessage.set('');

        this.authService.verifyTwoFactor(code).subscribe({
            next: (res) => {
                this.isLoading.set(false);
                this.toastService.showSuccess('Bienvenido de nuevo');
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.isLoading.set(false);
                const msg = err.error?.detail || 'Código incorrecto. Intenta de nuevo.';
                this.errorMessage.set(msg);
                this.toastService.showError(msg);
                this.triggerShakeEffect();
            }
        });
    }

    private triggerShakeEffect() {
        this.triggerShake.set(true);
        setTimeout(() => this.triggerShake.set(false), 500);
    }

    goToForgotPassword(): void {
        // UX-004: Pass the currently entered email to the forgot-password page
        const email = this.loginForm.get('email')?.value || '';
        this.router.navigate(['/auth/forgot-password'], {
            state: { email }
        });
    }
}

