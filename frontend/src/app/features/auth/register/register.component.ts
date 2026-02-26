import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { FocusInvalidInputDirective } from '../../../shared/directives/focus-invalid-input.directive';
import { AuthService } from '../../../core/services/auth.service';

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
        FocusInvalidInputDirective
    ],
    templateUrl: './register.component.html'
})
export class RegisterComponent implements OnInit {
    registerForm: FormGroup;
    isLoading = false;
    hidePassword = true;
    hideConfirmPassword = true;

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
        private authService: AuthService
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
        this.registerForm.get('password')?.valueChanges.subscribe(value => {
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

    onSubmit(): void {
        if (this.registerForm.valid) {
            this.isLoading = true;
            this.cdr.detectChanges(); // Previene error NG0100

            const formValues = this.registerForm.value;

            // Mapeo estricto al esquema backend (UserCreate)
            const payload = {
                full_name: formValues.full_name,
                email: formValues.email,
                password: formValues.password,
                role: 'doctor', // CRÍTICO: Forzar el rol a doctor
                specialty: formValues.specialty,
                license_number: formValues.license_number,
                university: formValues.university,
                phone: formValues.phone,
                institution: formValues.institution
            };

            this.authService.register(payload).subscribe({
                next: () => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this.snackBar.open('¡Registro exitoso! Redirigiendo...', 'OK', { duration: 2000 });
                    setTimeout(() => {
                        this.router.navigate(['/login']);
                    }, 2000);
                },
                error: (err) => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    const msg = err.error?.detail || 'Ocurrió un error en el registro';
                    this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
                    console.error('Registration Error:', err);
                }
            });
        }
    }
}
