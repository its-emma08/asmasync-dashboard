import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FocusInvalidInputDirective } from '../../../shared/directives/focus-invalid-input.directive';

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
    forgotForm: FormGroup;
    isLoading = false;
    emailSent = false;

    constructor(
        private fb: FormBuilder,
        private snackBar: MatSnackBar
    ) {
        this.forgotForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    onSubmit(): void {
        if (this.forgotForm.valid) {
            this.isLoading = true;

            // Simulate API call
            setTimeout(() => {
                this.isLoading = false;
                this.emailSent = true;
                this.snackBar.open('Enlace de recuperación enviado', 'Cerrar', { duration: 5000 });
            }, 1500);
        }
    }
}
