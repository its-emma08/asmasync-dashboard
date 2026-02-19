import { Component, OnInit } from '@angular/core';
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

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private snackBar: MatSnackBar
    ) {
        this.registerForm = this.fb.group({
            full_name: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]],
            specialty: ['neumo', Validators.required],
            license_number: ['', Validators.required], // Cédula Profesional (DGP)
            university: ['', Validators.required], // Universidad de Egreso (NOM Requirement)
            phone: ['', Validators.required],
            institution: [''], // Current Workplace
            acceptTerms: [false, Validators.requiredTrue]
        }, { validators: this.passwordMatchValidator });
    }

    ngOnInit(): void { }

    passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
        const password = form.get('password');
        const confirmPassword = form.get('confirmPassword');

        if (password && confirmPassword && password.value !== confirmPassword.value) {
            confirmPassword.setErrors({ passwordMismatch: true });
            return { passwordMismatch: true };
        }
        return null;
    }

    onSubmit(): void {
        if (this.registerForm.valid) {
            this.isLoading = true;

            // Simulate registration (replace with actual auth service call)
            setTimeout(() => {
                this.isLoading = false;
                this.snackBar.open('¡Registro exitoso! Redirigiendo...', 'OK', { duration: 2000 });
                setTimeout(() => {
                    this.router.navigate(['/login']);
                }, 2000);
            }, 1500);
        }
    }
}
