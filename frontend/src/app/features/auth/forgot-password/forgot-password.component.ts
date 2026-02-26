import { Component, ViewChildren, QueryList, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FocusInvalidInputDirective } from '../../../shared/directives/focus-invalid-input.directive';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        FocusInvalidInputDirective
    ],
    templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
    currentStep = signal<1 | 2 | 3>(1);

    emailForm: FormGroup;
    passwordForm: FormGroup;
    codeInputs: string[] = ['', '', '', '', '', ''];

    isLoading = signal(false);

    // Recovery Data
    recoveryEmail = '';
    tempToken = '';

    @ViewChildren('codeField') codeFields!: QueryList<ElementRef>;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private toastService: ToastService,
        private router: Router
    ) {
        // UX-004: Pre-fill email from router navigation state (passed from Login page)
        const navState = this.router.getCurrentNavigation()?.extras?.state;
        const prefilledEmail = navState?.['email'] as string || '';

        this.emailForm = this.fb.group({
            email: [prefilledEmail, [Validators.required, Validators.email]]
        });

        this.passwordForm = this.fb.group({
            password: ['', [
                Validators.required,
                Validators.minLength(8),
                this.passwordStrengthValidator
            ]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
    }

    // --- STEP 1: SOLICITAR OTP ---
    onSubmitEmail(): void {
        if (this.emailForm.invalid) return;

        this.isLoading.set(true);
        this.recoveryEmail = this.emailForm.value.email;

        this.authService.forgotPassword(this.recoveryEmail).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.currentStep.set(2);
                this.toastService.showSuccess('Código enviado exitosamente');
            },
            error: (err) => {
                this.isLoading.set(false);
                this.toastService.showError('Ocurrió un error al solicitar el código.');
                console.error(err);
            }
        });
    }

    // --- STEP 2: VERIFICAR OTP ---
    onCodeInput(index: number, event: Event): void {
        const input = event.target as HTMLInputElement;
        const value = input.value;

        // Ensure only numbers
        if (!/^\d*$/.test(value)) {
            input.value = '';
            this.codeInputs[index] = '';
            return;
        }

        this.codeInputs[index] = value;

        // Auto-focus next
        if (value && index < 5) {
            const nextInput = this.codeFields.toArray()[index + 1].nativeElement;
            nextInput.focus();
        }

        this.checkAndSubmitCode();
    }

    onCodeKeydown(index: number, event: KeyboardEvent): void {
        if (event.key === 'Backspace' && !this.codeInputs[index] && index > 0) {
            const prevInput = this.codeFields.toArray()[index - 1].nativeElement;
            prevInput.focus();
            prevInput.value = '';
            this.codeInputs[index - 1] = '';
        }
    }

    checkAndSubmitCode(): void {
        const fullCode = this.codeInputs.join('');
        if (fullCode.length === 6) {
            this.isLoading.set(true);
            this.authService.verifyResetCode(this.recoveryEmail, fullCode).subscribe({
                next: (res) => {
                    this.isLoading.set(false);
                    this.tempToken = res.temp_token;
                    this.currentStep.set(3);
                    this.toastService.showSuccess('Código verificado correctamente');
                },
                error: (err) => {
                    this.isLoading.set(false);
                    // Clear inputs visually
                    this.codeInputs = ['', '', '', '', '', ''];
                    this.codeFields.toArray().forEach(el => el.nativeElement.value = '');
                    this.codeFields.first.nativeElement.focus();
                    this.toastService.showError('Código inválido o expirado.');
                }
            });
        }
    }

    // --- STEP 3: RESET CONTRASEÑA ---
    onSubmitNewPassword(): void {
        if (this.passwordForm.invalid) return;

        this.isLoading.set(true);
        const { password } = this.passwordForm.value;

        this.authService.resetPassword(this.tempToken, password).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.toastService.showSuccess('Contraseña restablecida con éxito');
                this.router.navigate(['/auth/login']);
            },
            error: (err) => {
                this.isLoading.set(false);
                this.toastService.showError('No se pudo restablecer la contraseña. Intenta de nuevo.');
            }
        });
    }

    // --- UTILS ---
    maskEmail(email: string): string {
        if (!email) return '';
        const [username, domain] = email.split('@');
        if (username.length <= 2) {
            return `*@${domain}`;
        }
        const firstLetter = username.charAt(0);
        const lastLetter = username.charAt(username.length - 1);
        const dots = '*'.repeat(username.length - 2);
        return `${firstLetter}${dots}${lastLetter}@${domain}`;
    }

    passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
        const value = control.value;
        if (!value) return null;

        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumeric = /[0-9]/.test(value);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value);

        const passwordValid = hasUpperCase && hasLowerCase && (hasNumeric || hasSpecial);

        if (!passwordValid) {
            return { passwordStrength: true };
        }
        return null;
    }

    passwordMatchValidator(form: FormGroup): ValidationErrors | null {
        const password = form.get('password');
        const confirmPassword = form.get('confirmPassword');
        if (password && confirmPassword && password.value !== confirmPassword.value) {
            return { passwordMismatch: true };
        }
        return null;
    }

    get passwordStrengthScore(): number {
        const pass = this.passwordForm.get('password')?.value || '';
        if (!pass) return 0;
        let score = 0;
        if (pass.length > 7) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;
        return score;
    }
}
