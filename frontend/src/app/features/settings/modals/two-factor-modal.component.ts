import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-two-factor-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatInputModule
  ],
  template: `
    <div class="glass-modal">
      <div class="modal-header">
        <div class="header-icon bg-green" [class.bg-red]="mode() === 'disable'">
          <mat-icon *ngIf="mode() === 'setup'">security</mat-icon>
          <mat-icon *ngIf="mode() === 'disable'">gpp_bad</mat-icon>
        </div>
        <div>
          <h2>{{ mode() === 'setup' ? 'Configurar 2FA' : 'Desactivar 2FA' }}</h2>
          <p>{{ mode() === 'setup' ? 'Potencia tu seguridad validando tu correo electrónico' : 'Apagar doble factor de autenticación requiere confirmación.' }}</p>
        </div>
        <button mat-icon-button class="close-btn" (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="modal-body p-6">
        <ng-container *ngIf="isLoading()">
          <div class="flex justify-center p-8 text-center text-slate-500 flex-col items-center">
            <mat-spinner diameter="40"></mat-spinner>
            <p class="mt-4">Procesando...</p>
          </div>
        </ng-container>

        <!-- SETUP MODE -->
        <ng-container *ngIf="mode() === 'setup'">
          <!-- Paso 1: Notificar envío de correo -->
          <ng-container *ngIf="!isLoading() && setupData()">
            <div class="mb-6 text-center">
              <p class="text-slate-600 mb-4 text-sm font-medium">Hemos enviado un código de seguridad de 2 dígitos a tu correo electrónico para verificar tu identidad.</p>
              <div class="inline-flex p-5 bg-brand-cyan/10 rounded-full shadow-sm mb-2">
                <mat-icon class="text-brand-cyan scale-[2]">mark_email_read</mat-icon>
              </div>
            </div>

            <!-- Paso 2: Verificar -->
            <div class="text-center pt-4 border-t border-slate-100">
              <p class="text-slate-600 mb-4 text-sm font-medium">Ingresa el código que recibiste en el correo.</p>
              <mat-form-field appearance="outline" class="w-full max-w-[150px]" color="primary">
                <input matInput [(ngModel)]="verificationCode" placeholder="00" maxlength="2" class="text-center text-3xl tracking-widest font-mono font-bold" (keyup.enter)="verifyCode()">
              </mat-form-field>
            </div>
          </ng-container>
        </ng-container>

        <!-- DISABLE MODE -->
        <ng-container *ngIf="mode() === 'disable' && !isLoading()">
          <div class="mb-2 text-center">
             <p class="text-slate-600 mb-4 text-sm font-medium">Para desactivar la autenticación de dos factores, ingresa tu contraseña actual.</p>
             <mat-form-field appearance="outline" class="w-full" color="primary">
               <input matInput type="password" [(ngModel)]="password" placeholder="Contraseña actual" (keyup.enter)="disable2FA()">
             </mat-form-field>
          </div>
        </ng-container>
      </div>

      <div class="modal-footer">
        <button mat-button (click)="close()">Cancelar</button>
        <button *ngIf="mode() === 'setup'" mat-flat-button color="primary" 
                class="px-6 rounded-xl"
                [disabled]="isLoading() || verificationCode.length !== 2 || isVerifying()"
                (click)="verifyCode()">
          <mat-spinner diameter="20" *ngIf="isVerifying()" class="inline mr-2"></mat-spinner>
          {{ isVerifying() ? 'Verificando...' : 'Activar 2FA' }}
        </button>
        <button *ngIf="mode() === 'disable'" mat-flat-button color="warn" 
                class="px-6 rounded-xl"
                [disabled]="isLoading() || !password || isVerifying()"
                (click)="disable2FA()">
          <mat-spinner diameter="20" *ngIf="isVerifying()" class="inline mr-2"></mat-spinner>
          {{ isVerifying() ? 'Desactivando...' : 'Desactivar 2FA' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .glass-modal {
      @apply bg-white dark:bg-slate-900 border-0;
      color: inherit;
    }
    .modal-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
      border-bottom: 1px solid rgba(0,0,0,0.05);
      position: relative;
    }
    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .header-icon.bg-green { background: linear-gradient(135deg, #22c55e, #16a34a); box-shadow: 0 4px 12px rgba(34,197,94,0.3); }
    .header-icon.bg-red { background: linear-gradient(135deg, #ef4444, #dc2626); box-shadow: 0 4px 12px rgba(239,68,68,0.3); }
    .header-icon mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .modal-header h2 { margin: 0; font-size: 20px; font-weight: 700; @apply text-slate-900 dark:text-white; }
    .modal-header p { margin: 2px 0 0; font-size: 13px; @apply text-slate-500 dark:text-slate-400; }
    .close-btn { position: absolute; right: 16px; top: 16px; @apply text-slate-400; }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      background: rgba(0,0,0,0.02);
      border-top: 1px solid rgba(0,0,0,0.05);
    }
  `]
})
export class TwoFactorModalComponent implements OnInit {
  mode = signal<'setup' | 'disable'>('setup');
  setupData = signal<{ secret: string, qr_code: string } | null>(null);
  isLoading = signal(true);
  isVerifying = signal(false);
  verificationCode = '';
  password = '';

  constructor(
    private dialogRef: MatDialogRef<TwoFactorModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private authService: AuthService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    if (this.data?.mode === 'disable') {
      this.mode.set('disable');
      this.isLoading.set(false);
      return;
    }

    this.authService.setup2FA().subscribe({
      next: (res) => {
        this.setupData.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toastService.showError('Error al generar las credenciales TOTP');
        this.close();
      }
    });
  }

  verifyCode() {
    if (this.verificationCode.length !== 2) return;
    this.isVerifying.set(true);

    const secret = this.setupData()?.secret;
    if (!secret) return;

    this.authService.verify2FASetup(this.verificationCode, secret).subscribe({
      next: (res) => {
        this.toastService.showSuccess('Autenticador activado con éxito.');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isVerifying.set(false);
        this.toastService.showError('Código incorrecto. Intenta de nuevo.');
      }
    });
  }

  disable2FA() {
    if (!this.password) return;
    this.isVerifying.set(true);

    this.authService.disable2FA(this.password).subscribe({
      next: (res) => {
        this.toastService.showSuccess('2FA desactivado correctamente.');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isVerifying.set(false);
        const msg = err.error?.detail || 'Contraseña incorrecta.';
        this.toastService.showError(msg);
      }
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
