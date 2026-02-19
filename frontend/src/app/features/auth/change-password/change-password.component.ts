import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-change-password',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        MatCardModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule
    ],
    template: `
    <div class="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
        
      <div class="w-full max-w-lg bg-white rounded-[2rem] shadow-xl p-8 animate-fade-in-up border border-slate-100 relative z-10">
        
        <div class="flex items-center gap-4 mb-8">
            <button mat-icon-button routerLink="/dashboard" class="!bg-slate-100 !text-slate-600">
                <mat-icon>arrow_back</mat-icon>
            </button>
            <h2 class="text-2xl font-bold text-slate-800 m-0">Cambiar Contraseña</h2>
        </div>

        <form [formGroup]="pwdForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-6">
            
            <!-- Current Password -->
            <div class="space-y-1">
                <label class="font-bold text-slate-700 ml-1">Contraseña Actual</label>
                <div class="relative">
                    <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 scale-90">lock</mat-icon>
                    <input [type]="hideCurrent() ? 'password' : 'text'" formControlName="currentPassword"
                        class="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan outline-none transition-all font-medium">
                    <button type="button" (click)="hideCurrent.set(!hideCurrent())"
                        class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400">
                        <mat-icon class="scale-90">{{hideCurrent() ? 'visibility_off' : 'visibility'}}</mat-icon>
                    </button>
                </div>
            </div>

            <!-- New Password -->
            <div class="space-y-1">
                <label class="font-bold text-slate-700 ml-1">Nueva Contraseña</label>
                <div class="relative">
                    <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 scale-90">key</mat-icon>
                    <input [type]="hideNew() ? 'password' : 'text'" formControlName="newPassword"
                        class="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan outline-none transition-all font-medium">
                    <button type="button" (click)="hideNew.set(!hideNew())"
                        class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400">
                        <mat-icon class="scale-90">{{hideNew() ? 'visibility_off' : 'visibility'}}</mat-icon>
                    </button>
                </div>
                <div class="text-xs text-slate-500 ml-1 mt-1">
                    Mínimo 8 caracteres, una mayúscula, una minúscula y un número.
                </div>
            </div>

            <!-- Confirm Password -->
            <div class="space-y-1">
                <label class="font-bold text-slate-700 ml-1">Confirmar Nueva Contraseña</label>
                <div class="relative">
                    <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 scale-90">check_circle</mat-icon>
                    <input [type]="hideConfirm() ? 'password' : 'text'" formControlName="confirmPassword"
                        class="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan outline-none transition-all font-medium">
                </div>
                <mat-error *ngIf="pwdForm.hasError('mismatch') && pwdForm.get('confirmPassword')?.touched" class="text-xs ml-1 font-bold text-red-500">
                    Las contraseñas no coinciden
                </mat-error>
            </div>

            <button mat-flat-button color="primary" 
                class="!py-6 !rounded-2xl !text-lg !font-bold shadow-lg shadow-brand-cyan/30 mt-2 transition-transform hover:scale-[1.02]"
                [disabled]="pwdForm.invalid || isLoading()">
                <div class="flex items-center justify-center gap-2">
                    <mat-spinner diameter="20" *ngIf="isLoading()" class="mr-2 text-white"></mat-spinner>
                    <span>{{ isLoading() ? 'Guardando...' : 'Actualizar Contraseña' }}</span>
                </div>
            </button>
        </form>

      </div>
    </div>
  `,
    styles: [`:host { display: block; }`]
})
export class ChangePasswordComponent {
    pwdForm: FormGroup;
    isLoading = signal(false);

    hideCurrent = signal(true);
    hideNew = signal(true);
    hideConfirm = signal(true);

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private toast: ToastService
    ) {
        this.pwdForm = this.fb.group({
            currentPassword: ['', Validators.required],
            newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
    }

    passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
        const newP = control.get('newPassword')?.value;
        const confirmP = control.get('confirmPassword')?.value;
        return newP === confirmP ? null : { mismatch: true };
    }

    onSubmit() {
        if (this.pwdForm.invalid) return;

        this.isLoading.set(true);
        const { currentPassword, newPassword } = this.pwdForm.value;

        this.authService.changePassword(currentPassword, newPassword).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.toast.showSuccess('Contraseña actualizada correctamente');
                this.authService.logout(); // Force re-login
            },
            error: (err) => {
                this.isLoading.set(false);
                this.toast.showError(err.message || 'Error al cambiar contraseña');
            }
        });
    }
}
