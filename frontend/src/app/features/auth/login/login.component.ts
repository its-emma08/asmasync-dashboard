import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { RecaptchaModule, RecaptchaFormsModule, RECAPTCHA_SETTINGS, RecaptchaSettings } from 'ng-recaptcha';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        MatCardModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatCheckboxModule,
        MatIconModule,
        FocusInvalidInputDirective,
        RecaptchaModule,
        RecaptchaFormsModule
    ],
    providers: [
        {
            provide: RECAPTCHA_SETTINGS,
            useValue: { siteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI' } as RecaptchaSettings, // TODO: Replace with User's Site Key
        },
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

    // Security Signals
    isLocked = signal(false);
    lockoutCountdown = signal(0);

    // Captcha State
    localFailedAttempts = signal(0);
    captchaSolved = signal(false);

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
            ]],
            captcha: [''] // Optional form control for captcha if needed, or just track signal
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
                    // Reset local attempts on unlock? Maybe keep them high to force captcha?
                    // Let's reset purely for UX flow if they waited
                    this.localFailedAttempts.set(0);
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

    // Captcha Handler
    resolved(captchaResponse: string | null): void {
        console.log(`Resolved captcha with response: ${captchaResponse}`);
        this.captchaSolved.set(!!captchaResponse);
        if (captchaResponse) {
            this.errorMessage.set(''); // Clear error if they solve it
        }
    }

    onSubmit(): void {
        if (this.loginForm.invalid || this.isLocked()) {
            return;
        }

        // Captcha Check
        if (this.localFailedAttempts() >= 2 && !this.captchaSolved()) {
            this.errorMessage.set('Por seguridad, completa el Captcha.');
            this.triggerShakeEffect();
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');
        this.loginForm.disable();

        const { email, password } = this.loginForm.value;

        this.authService.login(email, password).subscribe({
            next: (response) => {
                this.isLoading.set(false);
                this.localFailedAttempts.set(0); // Reset on success
                this.securityService.recordLoginAttempt(true, email);

                if (response.requires2FA) {
                    this.toastService.showInfo('Código de verificación enviado');
                    this.router.navigate(['/auth/2fa']);
                } else {
                    this.toastService.showSuccess('Bienvenido de nuevo');
                    this.router.navigate(['/dashboard']);
                }
            },
            error: (err) => {
                this.isLoading.set(false);
                this.loginForm.enable();

                // Increment Local Failure
                this.localFailedAttempts.update(v => v + 1);

                // Record Failure Service
                this.securityService.recordLoginAttempt(false, email);

                // Determine error message
                let msg = 'No pudimos iniciar sesión. Por favor, verifica tu correo y contraseña.';
                if (this.loginForm.get('password')?.hasError('pattern')) {
                    msg = 'Tu contraseña debe ser más segura. Asegúrate de incluir mayúsculas, números y símbolos.';
                }

                if (this.securityService.isLocked()) {
                    msg = 'Por seguridad, hemos bloqueado tu cuenta temporalmente tras varios intentos fallidos.';
                } else if (this.localFailedAttempts() >= 2 && !this.captchaSolved()) {
                    msg = 'Detectamos actividad inusual. Por favor, resuelve el Captcha.';
                }

                // UI Feedback
                this.errorMessage.set(msg);
                this.toastService.showError(msg); // Error Toast
                this.triggerShakeEffect(); // Shake Animation
                this.captchaSolved.set(false); // Force re-solve logic if needed? Usually captcha stays valid for a bit contextually?
                // Actually if they fail password, they might just need to retry password, but maybe keep captcha solved?
                // Generally, if login fails, we assume it *could* be a bot, so maybe invalidate captcha? 
                // reCAPTCHA usually allows multiple attempts with one token? No, token is one-time.
                // But implementing reset requires viewchild. For now, let's just NOT reset it to avoid annoyance on typo.
                // But strictly, the token is consumed by backend. Since we don't send it to backend yet (mocking), 
                // we can keep it "visually" solved.

                console.error(err);
            }
        });
    }

    private triggerShakeEffect() {
        this.triggerShake.set(true);
        setTimeout(() => this.triggerShake.set(false), 500);
    }
}

