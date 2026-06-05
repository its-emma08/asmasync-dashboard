import { Component, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressBarModule
  ],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 m-0">Cambiar Contraseña</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1" *ngIf="step === 1">Tu nueva contraseña debe cumplir con los requisitos de seguridad.</p>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1" *ngIf="step === 2">Ingresa el código OTP enviado a tu correo.</p>
        </div>
        <button mat-icon-button (click)="dialogRef.close()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="passwordForm" (ngSubmit)="submitStep()">
        
        <!-- STEP 1: New Password Details -->
        <div class="flex flex-col gap-4" *ngIf="step === 1">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Contraseña Actual</mat-label>
            <input matInput [type]="hideCurrent ? 'password' : 'text'" formControlName="current_password">
            <mat-icon matPrefix class="text-slate-400 mr-2">lock_outline</mat-icon>
            <button mat-icon-button matSuffix (click)="hideCurrent = !hideCurrent" type="button" class="text-slate-400">
              <mat-icon>{{hideCurrent ? 'visibility_off' : 'visibility'}}</mat-icon>
            </button>
            <mat-error *ngIf="passwordForm.get('current_password')?.hasError('required')">Requerido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Nueva Contraseña</mat-label>
            <input matInput [type]="hideNew ? 'password' : 'text'" formControlName="new_password">
            <mat-icon matPrefix class="text-slate-400 mr-2">key</mat-icon>
            <button mat-icon-button matSuffix (click)="hideNew = !hideNew" type="button" class="text-slate-400">
              <mat-icon>{{hideNew ? 'visibility_off' : 'visibility'}}</mat-icon>
            </button>
            <mat-error *ngIf="passwordForm.get('new_password')?.hasError('required')">Requerido</mat-error>
            <mat-error *ngIf="passwordForm.get('new_password')?.hasError('minlength')">Mínimo 8 caracteres</mat-error>
          </mat-form-field>

          <!-- Password Rules Visuzalization -->
          <div class="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-white/5 mb-2">
            <p class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Requisitos de Contraseña</p>
            <div class="space-y-1.5">
              <div class="flex items-center gap-2 text-xs" [ngClass]="hasLength ? 'text-primary' : 'text-slate-400 dark:text-slate-500'">
                <mat-icon class="scale-75 w-4 h-4">{{ hasLength ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <span>Mínimo 8 caracteres</span>
              </div>
              <div class="flex items-center gap-2 text-xs" [ngClass]="hasUpper ? 'text-primary' : 'text-slate-400 dark:text-slate-500'">
                <mat-icon class="scale-75 w-4 h-4">{{ hasUpper ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <span>Al menos 1 mayúscula</span>
              </div>
              <div class="flex items-center gap-2 text-xs" [ngClass]="hasNumber ? 'text-primary' : 'text-slate-400 dark:text-slate-500'">
                <mat-icon class="scale-75 w-4 h-4">{{ hasNumber ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <span>Al menos 1 número</span>
              </div>
              <div class="flex items-center gap-2 text-xs" [ngClass]="hasSpecial ? 'text-primary' : 'text-slate-400 dark:text-slate-500'">
                <mat-icon class="scale-75 w-4 h-4">{{ hasSpecial ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <span>Al menos 1 símbolo especial (!&#64;#$%)</span>
              </div>
            </div>
            
            <div class="mt-3">
              <mat-progress-bar mode="determinate" [value]="passwordStrength" 
                [color]="passwordStrength < 50 ? 'warn' : (passwordStrength < 100 ? 'accent' : 'primary')">
              </mat-progress-bar>
              <p class="text-[10px] text-right mt-1 font-bold" 
                [ngClass]="passwordStrength < 50 ? 'text-red-500' : (passwordStrength < 100 ? 'text-amber-500' : 'text-primary')">
                {{ passwordStrength < 50 ? 'Débil' : (passwordStrength < 100 ? 'Regular' : 'Fuerte') }}
              </p>
            </div>
          </div>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Confirmar Contraseña</mat-label>
            <input matInput [type]="hideConfirm ? 'password' : 'text'" formControlName="confirm_password">
            <mat-icon matPrefix class="text-slate-400 mr-2">verified</mat-icon>
            <button mat-icon-button matSuffix (click)="hideConfirm = !hideConfirm" type="button" class="text-slate-400">
              <mat-icon>{{hideConfirm ? 'visibility_off' : 'visibility'}}</mat-icon>
            </button>
            <mat-error *ngIf="passwordForm.hasError('mismatch') && passwordForm.get('confirm_password')?.touched">
              Las contraseñas no coinciden
            </mat-error>
          </mat-form-field>
        </div>

        <!-- STEP 2: OTP Confirmation -->
        <div class="flex flex-col gap-4" *ngIf="step === 2">
          <div class="bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-200 p-4 rounded-xl text-sm flex gap-3 border border-blue-100 dark:border-blue-900/30">
            <mat-icon class="text-blue-500 flex-shrink-0">mark_email_read</mat-icon>
            <p class="m-0">Hemos enviado un OTP de 6 dígitos a <strong>{{ maskEmail(userEmail) }}</strong>.</p>
          </div>

          <mat-form-field appearance="outline" class="w-full mt-2 text-center text-2xl tracking-[0.5em] font-mono">
            <mat-label class="tracking-normal font-sans text-sm">Código de 6 dígitos</mat-label>
            <input matInput formControlName="otp_code" maxlength="6" class="text-center font-bold">
            <mat-error *ngIf="passwordForm.get('otp_code')?.hasError('required')">Requerido</mat-error>
            <mat-error *ngIf="passwordForm.get('otp_code')?.hasError('pattern')">Solo 6 números</mat-error>
            <mat-error *ngIf="passwordForm.get('otp_code')?.hasError('invalidOtp')">El código es incorrecto</mat-error>
          </mat-form-field>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button mat-button type="button" (click)="dialogRef.close()" class="!font-bold">Cancelar</button>
          
          <button *ngIf="step === 1" mat-flat-button color="primary" type="submit" [disabled]="passwordForm.invalid || isGeneratingCode || passwordStrength < 100" class="!rounded-full px-6">
            <mat-icon *ngIf="!isGeneratingCode" class="mr-1">mark_email_unread</mat-icon>
            <mat-icon *ngIf="isGeneratingCode" class="mr-1 animate-spin">refresh</mat-icon>
            {{ isGeneratingCode ? 'Generando...' : 'Generar Código OTP' }}
          </button>

          <button *ngIf="step === 2" mat-flat-button color="primary" type="button" (click)="saveFinal()" [disabled]="passwordForm.invalid || isSaving || passwordStrength < 100" class="!rounded-full px-6">
            <mat-icon *ngIf="!isSaving" class="mr-1">save_as</mat-icon>
            <mat-icon *ngIf="isSaving" class="mr-1 animate-spin">refresh</mat-icon>
            {{ isSaving ? 'Guardando...' : 'Cambiar Contraseña Definitiva' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      max-width: 500px;
      width: 100vw;
    }
    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
        border-radius: 24px !important;
    }
  `]
})
export class ChangePasswordModalComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  passwordForm: FormGroup;
  step = 1;
  isGeneratingCode = false;
  isSaving = false;

  hideCurrent = true;
  hideNew = true;
  hideConfirm = true;

  // Visual Strength Password Checks
  hasLength = false;
  hasUpper = false;
  hasNumber = false;
  hasSpecial = false;
  passwordStrength = 0;
  userEmail = '';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ChangePasswordModalComponent>,
    private authService: AuthService,
    private toastService: ToastService,
    private cd: ChangeDetectorRef
  ) {
    this.passwordForm = this.fb.group({
      current_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', Validators.required],
      otp_code: ['']
    }, { validators: this.passwordMatchValidator });

    // Track password changes to update UI strength
    this.passwordForm.get('new_password')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
      this.evaluatePassword(val || '');
      this.cd.markForCheck();
    });
  }

  evaluatePassword(password: string) {
    this.hasLength = password.length >= 8;
    this.hasUpper = /[A-Z]/.test(password);
    this.hasNumber = /[0-9]/.test(password);
    this.hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    let strength = 0;
    if (this.hasLength) strength += 25;
    if (this.hasUpper) strength += 25;
    if (this.hasNumber) strength += 25;
    if (this.hasSpecial) strength += 25;

    this.passwordStrength = strength;
  }

  passwordMatchValidator(g: AbstractControl): ValidationErrors | null {
    const password = g.get('new_password')?.value;
    const confirm = g.get('confirm_password')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  submitStep() {
    if (this.passwordForm.valid && this.step === 1) {
      this.isGeneratingCode = true;
      this.cd.markForCheck();
      this.authService.fetchCurrentUser().pipe(take(1)).subscribe({
        next: (user) => {
          this.userEmail = user.email;
          this.authService.signInWithOtp(this.userEmail).pipe(take(1)).subscribe({
            next: () => {
              this.isGeneratingCode = false;
              this.step = 2;
              this.passwordForm.get('otp_code')?.setValidators([Validators.required, Validators.pattern('^[0-9]{6}$')]);
              this.passwordForm.get('otp_code')?.updateValueAndValidity();
              this.cd.markForCheck();
              this.toastService.showInfo('Código OTP enviado al correo');
            },
            error: () => {
              this.isGeneratingCode = false;
              this.cd.markForCheck();
              this.toastService.showError('No se pudo enviar el OTP. Intenta de nuevo.');
            }
          });
        },
        error: () => {
          this.isGeneratingCode = false;
          this.cd.markForCheck();
          this.toastService.showError('No se pudo recuperar tu usuario actual.');
        }
      });
    }
  }

  saveFinal() {
    if (this.passwordForm.valid && this.step === 2) {
      this.isSaving = true;
      const data = this.passwordForm.value;
      const otpCode = data.otp_code;

      this.authService.verifyOtp(this.userEmail, otpCode, 'email', false).pipe(take(1)).subscribe({
        next: (otpRes) => {
          if (otpRes?.error) {
            this.isSaving = false;
            this.passwordForm.get('otp_code')?.setErrors({ invalidOtp: true });
            this.toastService.showError('El código OTP es inválido o expiró.');
            this.cd.markForCheck();
            return;
          }

          this.authService.changePassword(data.current_password, data.new_password).pipe(take(1)).subscribe({
            next: () => {
              this.isSaving = false;
              this.toastService.showSuccess('Contraseña actualizada con éxito');
              this.dialogRef.close(true);
            },
            error: (err: any) => {
              this.isSaving = false;
              this.toastService.showError(err.error?.detail || 'Error al cambiar la contraseña');
              console.error('Error changing password', err);
              this.cd.markForCheck();
            }
          });
        },
        error: () => {
          this.isSaving = false;
          this.passwordForm.get('otp_code')?.setErrors({ invalidOtp: true });
          this.toastService.showError('No se pudo verificar el OTP.');
          this.cd.markForCheck();
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  maskEmail(email: string): string {
    if (!email || !email.includes('@')) return '';
    const [name, domain] = email.split('@');
    return `${name.slice(0, 3)}***@${domain}`;
  }
}
