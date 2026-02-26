import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-two-factor',
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
      <!-- Background Shapes -->
      <div class="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-teal-400/10 rounded-full blur-3xl"></div>

      <div class="w-full max-w-md bg-white rounded-[2rem] shadow-xl p-8 animate-fade-in-up border border-slate-100 relative z-10">
        
        <div class="text-center mb-8">
            <div class="w-24 h-24 bg-cyan-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-cyan-100">
                <mat-icon class="text-brand-cyan scale-150 transform" style="font-size: 40px; width: 40px; height: 40px;">lock</mat-icon>
            </div>
            <h2 class="text-2xl font-bold text-slate-800 mb-2">Verificación de Dos Pasos</h2>
            <p class="text-slate-500">Hemos enviado un código al dispositivo de tu administrador. (Mock: 123456)</p>
        </div>

        <form [formGroup]="otpForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-6">
            <div class="space-y-2">
                <label class="font-bold text-slate-700 ml-1">Código de Seguridad</label>
                <input 
                    type="text" 
                    formControlName="code" 
                    maxlength="6"
                    class="w-full text-center text-2xl tracking-[0.5em] font-bold py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan outline-none transition-all placeholder-slate-300"
                    placeholder="000000"
                >
                <mat-error *ngIf="otpForm.get('code')?.hasError('pattern')" class="text-xs text-center block text-red-500">
                    Ingresa solo números
                </mat-error>
            </div>

            <button mat-flat-button color="primary" 
                class="!py-6 !rounded-2xl !text-lg !font-bold shadow-lg shadow-brand-cyan/30 transition-transform hover:scale-[1.02]"
                [disabled]="otpForm.invalid || isLoading()">
                <div class="flex items-center justify-center gap-2">
                    <mat-spinner diameter="20" *ngIf="isLoading()" class="mr-2 text-white"></mat-spinner>
                    <span>{{ isLoading() ? 'Verificando...' : 'Verificar' }}</span>
                </div>
            </button>
        </form>

        <div class="text-center mt-6">
            <button mat-button color="warn" (click)="cancel()" class="!rounded-full">Cancelar e ir al Inicio</button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host {
        display: block;
    }
    
    mat-icon {
        overflow: visible; 
    }
  `]
})
export class TwoFactorComponent implements OnInit {
    otpForm: FormGroup;
    isLoading = signal(false);

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private toast: ToastService
    ) {
        this.otpForm = this.fb.group({
            code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern('^[0-9]*$')]]
        });
    }

    ngOnInit(): void {
        // console.log('🔐 Mock 2FA Code: 123456');
    }

    onSubmit() {
        if (this.otpForm.invalid) return;

        this.isLoading.set(true);
        const code = this.otpForm.get('code')?.value;

        this.authService.verifyTwoFactor(code).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.toast.showSuccess('Verificación exitosa');
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.isLoading.set(false);
                this.toast.showError(err.message || 'Código inválido');
                this.otpForm.reset();
            }
        });
    }

    cancel() {
        this.authService.logout();
    }
}
