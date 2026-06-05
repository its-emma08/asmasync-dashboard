import { Component, OnInit, OnDestroy, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { CaptchaComponent } from '../../../shared/components/captcha/captcha.component';
import { OtpInputComponent } from '../../../shared/components/otp-input/otp-input.component';
import { ToastService } from '../../../core/services/toast.service';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        MatCardModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatIconModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatCheckboxModule,
        CaptchaComponent,
        OtpInputComponent
    ],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    registerForm: FormGroup;
    currentStep = signal(1);
    isLoading = signal(false);
    errorMessage = signal<string>('');
    hidePassword = signal(true);
    hideConfirmPassword = signal(true);
    triggerShake = signal(false);
    captchaResolved = signal(false);
    otpCode = signal<string>('');

    passwordRules = {
        length: false,
        upper: false,
        number: false,
        special: false
    };

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef,
        private authService: AuthService,
        private supabaseService: SupabaseService,
        private toastService: ToastService
    ) {
        this.registerForm = this.fb.group({
            full_name: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/(?=.*[A-Z])/),
                Validators.pattern(/(?=.*\d)/),
                Validators.pattern(/(?=.*[!@#$%^&*])/)
            ]],
            confirmPassword: ['', [Validators.required]],
            specialty: ['neumo', Validators.required],
            license_number: ['', [Validators.required, Validators.pattern('^[0-9]{7,8}$')]], // Cédula Profesional (DGP)
            university: ['', Validators.required], // Universidad de Egreso (NOM Requirement)
            phone: ['', Validators.required],
            institution: [''], // Current Workplace
            acceptTerms: [false, Validators.requiredTrue]
        }, { validators: this.passwordMatchValidator });
    }

    ngOnInit(): void {
        this.registerForm.get('password')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
            if (!value) {
                this.passwordRules = { length: false, upper: false, number: false, special: false };
                return;
            }
            this.passwordRules.length = value.length >= 8;
            this.passwordRules.upper = /[A-Z]/.test(value);
            this.passwordRules.number = /\d/.test(value);
            this.passwordRules.special = /[!@#$%^&*]/.test(value);
        });
    }

    passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
        const password = form.get('password');
        const confirmPassword = form.get('confirmPassword');

        if (password && confirmPassword && password.value !== confirmPassword.value) {
            return { passwordMismatch: true };
        }
        return null;
    }

    nextStep(): void {
        if (this.isStepValid(this.currentStep())) {
            this.currentStep.update(s => s + 1);
            this.cdr.detectChanges();
        } else {
            this.triggerShakeEffect();
        }
    }

    prevStep(): void {
        if (this.currentStep() > 1) {
            this.currentStep.update(s => s - 1);
            this.cdr.detectChanges();
        }
    }

    isStepValid(step: number): boolean {
        switch (step) {
            case 1:
                return !!(this.registerForm.get('full_name')?.valid &&
                    this.registerForm.get('email')?.valid &&
                    this.registerForm.get('phone')?.valid);
            case 2:
                return !!(this.registerForm.get('university')?.valid &&
                    this.registerForm.get('license_number')?.valid &&
                    this.registerForm.get('specialty')?.valid);
            case 3:
                return !!(this.registerForm.get('password')?.valid &&
                    this.registerForm.get('confirmPassword')?.valid &&
                    !this.registerForm.hasError('passwordMismatch') &&
                    this.registerForm.get('acceptTerms')?.valid);
            default:
                return false;
        }
    }

    isFieldValid(field: string): boolean {
        const ctrl = this.registerForm.get(field);
        return !!(ctrl && ctrl.valid && (ctrl.dirty || ctrl.touched));
    }

    isFieldInvalid(field: string): boolean {
        const ctrl = this.registerForm.get(field);
        return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
    }

    onOtpChange(code: string): void {
        this.otpCode.set(code);
    }

    verifyRegistrationOtp(code?: string): void {
        const finalCode = code || this.otpCode();
        if (finalCode.length < 6 || this.isLoading()) return;

        this.isLoading.set(true);
        this.errorMessage.set('');
        this.cdr.detectChanges();

        const email = this.registerForm.get('email')?.value;
        const fullName = this.registerForm.get('full_name')?.value;

        this.supabaseService.verifyOtp(email, finalCode, 'signup').pipe(take(1)).subscribe({
            next: (res) => {
                if (res.error) {
                    this.isLoading.set(false);
                    this.errorMessage.set(res.error.message || 'Código incorrecto');
                    this.triggerShakeEffect();
                    this.cdr.detectChanges();
                    return;
                }

                const jwt = res.data?.session?.access_token;
                const supabaseUser = res.data?.session?.user;

                if (!jwt) {
                    this.isLoading.set(false);
                    this.errorMessage.set('No se obtuvo sesión. Intenta de nuevo.');
                    this.cdr.detectChanges();
                    return;
                }

                // Guardar token para que el interceptor lo envíe en la siguiente llamada
                this.authService.setUserFromSupabase({
                    access_token: jwt,
                    email: supabaseUser?.email ?? email,
                    full_name: fullName,
                    role: 'doctor',
                    id: supabaseUser?.id ?? ''
                });

                // Registrar en Pablo's DB con el JWT ya disponible
                this.authService.register({ full_name: fullName, role: 'doctor' }).pipe(take(1)).subscribe({
                    next: () => {
                        this.isLoading.set(false);
                        this.toastService.showSuccess('¡Cuenta creada con éxito!');
                        this.router.navigate(['/dashboard']);
                    },
                    error: () => {
                        // Si el registro en Pablo falla, igual dejamos pasar (pueden operar con Supabase)
                        this.isLoading.set(false);
                        this.toastService.showSuccess('¡Cuenta confirmada!');
                        this.router.navigate(['/dashboard']);
                    }
                });
            },
            error: (err) => {
                this.isLoading.set(false);
                this.errorMessage.set(err.message || 'Error al verificar el código');
                this.triggerShakeEffect();
                this.cdr.detectChanges();
            }
        });
    }

    onSubmit(): void {
        if (this.registerForm.invalid || !this.captchaResolved() || this.isLoading()) {
            this.triggerShakeEffect();
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');
        this.cdr.detectChanges();

        const { email, password, full_name } = this.registerForm.value;

        // Paso 1: Crear cuenta en Supabase (envía OTP al correo)
        this.supabaseService.signUp(email, password, { full_name, role: 'doctor' }).pipe(take(1)).subscribe({
            next: (res) => {
                this.isLoading.set(false);
                if (res.error) {
                    this.errorMessage.set((res.error as any).message || 'Error al crear la cuenta');
                    this.triggerShakeEffect();
                    this.cdr.detectChanges();
                    return;
                }
                this.currentStep.set(4);
                this.toastService.showInfo('Código de confirmación enviado a su correo');
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isLoading.set(false);
                const msg = err.error?.message || err.message || 'Error al crear la cuenta';
                this.errorMessage.set(msg);
                this.triggerShakeEffect();
                this.cdr.detectChanges();
            }
        });
    }

    private triggerShakeEffect() {
        this.triggerShake.set(true);
        setTimeout(() => this.triggerShake.set(false), 600);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
