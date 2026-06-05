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
import { OtpInputComponent } from '../../../shared/components/otp-input/otp-input.component';

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
    MatInputModule,
    OtpInputComponent
  ],
  template: `
    <div class="glass-modal-elite">
      <div class="modal-header-premium">
        <div class="header-icon-box" [class.bg-red-gradient]="mode() === 'disable'">
          <mat-icon *ngIf="mode() === 'setup'">verified_user</mat-icon>
          <mat-icon *ngIf="mode() === 'disable'">cancel</mat-icon>
        </div>
        <div class="header-text">
          <h2 class="title">{{ mode() === 'setup' ? 'Seguridad Avanzada' : 'Desactivar 2FA' }}</h2>
          <p class="subtitle">{{ mode() === 'setup' ? 'Valida tu identidad con un PIN de 6 dígitos' : 'Confirma tu contraseña para remover el doble factor' }}</p>
        </div>
        <button mat-icon-button class="apple-close-btn" (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="modal-content-premium">
        <ng-container *ngIf="isLoading()">
          <div class="loader-container">
            <mat-spinner diameter="32"></mat-spinner>
            <p>Sincronizando con Supabase...</p>
          </div>
        </ng-container>

        <!-- SETUP MODE -->
        <ng-container *ngIf="mode() === 'setup' && !isLoading()">
          <div class="otp-setup-container animate-in">
             <div class="brand-badge mb-6">
                <mat-icon>mail</mat-icon>
                <span>Código enviado a {{ maskedEmail() }}</span>
             </div>

             <div class="otp-grid-container mb-8">
               <app-otp-input (codeChange)="onOtpChange($event)" (codeComplete)="verifyCode($event)"></app-otp-input>
             </div>

             <div class="info-alert-glass">
                <mat-icon>info</mat-icon>
                <p>Al activar el segundo factor, se te solicitará este PIN cada vez que inicies sesión.</p>
             </div>
          </div>
        </ng-container>

        <!-- DISABLE MODE -->
        <ng-container *ngIf="mode() === 'disable' && !isLoading()">
          <div class="disable-container animate-in">
             <p class="instr text-center mb-6">Para confirmar la desactivación, ingresa tu contraseña de acceso.</p>
             <div class="clinical-input-wrapper">
               <mat-icon class="input-icon">lock</mat-icon>
               <input type="password" [(ngModel)]="password" placeholder="Ingresa tu contraseña" class="clinical-input-field" (keyup.enter)="disable2FA()">
             </div>
          </div>
        </ng-container>
      </div>

      <div class="modal-footer-premium">
        <button class="cancel-btn-elite" (click)="close()">Cancelar</button>
        <button *ngIf="mode() === 'setup'" 
                class="confirm-btn-elite" 
                [disabled]="!isOtpComplete() || isVerifying()"
                (click)="verifyCode()">
          <mat-spinner diameter="18" *ngIf="isVerifying()" class="inline mr-2"></mat-spinner>
          Confirmar y Activar
        </button>
        <button *ngIf="mode() === 'disable'" 
                class="danger-btn-elite" 
                [disabled]="!password || isVerifying()"
                (click)="disable2FA()">
          <mat-spinner diameter="18" *ngIf="isVerifying()" class="inline mr-2"></mat-spinner>
          Desactivar Seguridad
        </button>
      </div>
    </div>
  `,
  styles: [`
    /* ELITE 2.0 Glass Modal Styles */
    :host { display: block; border-radius: 28px; overflow: hidden; }

    .glass-modal-elite {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(40px) saturate(210%);
      -webkit-backdrop-filter: blur(40px) saturate(210%);
      border: 1px solid rgba(255, 255, 255, 0.5);
      position: relative;
      overflow: hidden;
      font-family: 'Outfit', sans-serif;
    }

    /* Mesh Gradient for "100/10" effect */
    .glass-modal-elite::before {
      content: '';
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(at 0% 0%, rgba(0, 113, 227, 0.08) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(52, 199, 89, 0.05) 0px, transparent 50%);
      z-index: 0;
      pointer-events: none;
    }

    .modal-header-premium {
      padding: 40px 32px 24px;
      display: flex;
      align-items: center;
      gap: 24px;
      z-index: 1;
      position: relative;
    }

    .header-icon-box {
      width: 60px;
      height: 60px;
      border-radius: 18px;
      background: linear-gradient(135deg, #007AFF, #00C7BE);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 10px 25px rgba(0, 122, 255, 0.3);
      flex-shrink: 0;
      mat-icon { font-size: 30px; width: 30px; height: 30px; }
    }

    .bg-red-gradient {
      background: linear-gradient(135deg, #FF3B30, #FF9500);
      box-shadow: 0 10px 25px rgba(255, 59, 48, 0.3);
    }

    .header-text .title { 
      font-size: 26px; 
      font-weight: 800; 
      color: #1d1d1f; 
      margin: 0; 
      letter-spacing: -0.03em;
      line-height: 1.1;
    }
    .header-text .subtitle { font-size: 15px; color: #6e6e73; margin: 8px 0 0; line-height: 1.4; }

    .modal-content-premium { padding: 0 32px 32px; z-index: 1; position: relative; }

    .loader-container { padding: 60px 0; text-align: center; color: #6e6e73; }

    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: rgba(0, 122, 255, 0.08);
      padding: 10px 20px;
      border-radius: 100px;
      color: #0071e3;
      font-weight: 700;
      font-size: 13px;
      margin-bottom: 32px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    /* OTP Grid */
    .otp-digit-boxes { display: flex; gap: 14px; justify-content: center; }
    .otp-box-elite {
      width: 56px;
      height: 72px;
      border-radius: 16px;
      border: 1px solid rgba(0,0,0,0.1);
      background: rgba(255,255,255,0.6);
      text-align: center;
      font-size: 32px;
      font-weight: 800;
      color: #1d1d1f;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      &:focus {
        border-color: #007AFF;
        background: white;
        box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.15);
        transform: translateY(-4px) scale(1.05);
        outline: none;
      }
    }

    .info-alert-glass {
      background: rgba(0,0,0,0.04);
      padding: 18px;
      border-radius: 20px;
      display: flex;
      gap: 14px;
      margin-top: 32px;
      p { font-size: 13px; color: #48484a; margin: 0; line-height: 1.5; }
      mat-icon { color: #86868b; font-size: 20px; width: 20px; height: 20px; }
    }

    .clinical-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: rgba(0,0,0,0.06);
      border-radius: 18px;
      padding: 0 20px;
      transition: all 0.2s;
      &:focus-within { background: rgba(0,0,0,0.08); box-shadow: 0 0 0 3px rgba(0,122,255,0.1); }
    }
    .input-icon { color: #86868b; margin-right: 14px; }
    .clinical-input-field {
      flex: 1;
      height: 60px;
      background: transparent;
      border: none;
      font-size: 17px;
      font-weight: 500;
      color: #1d1d1f;
      outline: none;
    }

    .modal-footer-premium {
      padding: 32px;
      background: rgba(0,0,0,0.02);
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      z-index: 1;
      position: relative;
      border-top: 1px solid rgba(0,0,0,0.05);
    }

    .cancel-btn-elite {
      background: transparent;
      border: none;
      padding: 12px 28px;
      font-size: 16px;
      font-weight: 600;
      color: #86868b;
      cursor: pointer;
      border-radius: 14px;
      transition: all 0.2s;
      &:hover { background: rgba(0,0,0,0.05); color: #1d1d1f; }
    }

    .confirm-btn-elite {
      background: linear-gradient(135deg, #007AFF, #0071e3);
      padding: 12px 32px;
      border: none;
      border-radius: 14px;
      color: white;
      font-size: 16px;
      font-weight: 700;
      box-shadow: 0 8px 20px rgba(0, 113, 227, 0.35);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      &:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
      &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(0, 113, 227, 0.45); }
      &:active:not(:disabled) { transform: translateY(0); }
    }

    .danger-btn-elite {
      background: linear-gradient(135deg, #FF3B30, #FF453A);
      padding: 12px 32px;
      border: none;
      border-radius: 14px;
      color: white;
      font-size: 16px;
      font-weight: 700;
      box-shadow: 0 8px 20px rgba(255, 59, 48, 0.35);
      cursor: pointer;
      transition: all 0.2s;
      &:disabled { opacity: 0.5; }
      &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 12px 28px rgba(255, 59, 48, 0.45); }
    }

    .apple-close-btn { 
      position: absolute; 
      right: 24px; 
      top: 24px; 
      color: #86868b; 
      background: rgba(0,0,0,0.05);
      border-radius: 50%;
      height: 32px;
      width: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      &:hover { background: rgba(0,0,0,0.1); color: #1d1d1f; }
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .animate-in { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideUpFade {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    :host-context(body.dark) {
      .glass-modal-elite {
        background: rgba(28, 28, 30, 0.8) !important;
        border-color: rgba(255, 255, 255, 0.1) !important;
      }
      .header-text .title {
        color: #ffffff;
      }
      .header-text .subtitle {
        color: #8e8e93;
      }
      .otp-box-elite {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        &:focus {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--brand-primary);
        }
      }
      .info-alert-glass {
        background: rgba(255, 255, 255, 0.05);
        p {
          color: #d1d1d6;
        }
      }
      .clinical-input-wrapper {
        background: rgba(255, 255, 255, 0.08);
        &:focus-within {
          background: rgba(255, 255, 255, 0.1);
        }
      }
      .clinical-input-field {
        color: #ffffff;
      }
      .modal-footer-premium {
        border-top-color: rgba(255, 255, 255, 0.05);
        background: rgba(255, 255, 255, 0.02);
      }
      .cancel-btn-elite {
        color: #8e8e93;
        &:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
        }
      }
      .apple-close-btn {
        background: rgba(255, 255, 255, 0.08);
        color: #8e8e93;
        &:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }
      }
      .loader-container {
        color: #8e8e93;
      }
    }
  `]
})
export class TwoFactorModalComponent implements OnInit {
  mode = signal<'setup' | 'disable'>('setup');
  isLoading = signal(true);
  isVerifying = signal(false);
  otpCode = signal<string>('');
  password = '';
  userEmail = '';

  isOtpComplete = () => this.otpCode().length === 6;

  maskedEmail = () => {
    if (!this.userEmail) return '...';
    const [name, domain] = this.userEmail.split('@');
    return `${name.substring(0, 3)}***@${domain}`;
  };

  constructor(
    private dialogRef: MatDialogRef<TwoFactorModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'setup' | 'disable' },
    private authService: AuthService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    if (this.data?.mode === 'disable') {
      this.mode.set('disable');
    }

    // Obtener email del usuario actual para Supabase
    this.authService.fetchCurrentUser().subscribe({
      next: (user) => {
        this.userEmail = user.email;
        if (this.mode() === 'setup') {
          this.triggerSupabaseOtp();
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.toastService.showError('Error al recuperar sesión de usuario');
        this.close();
      }
    });
  }

  triggerSupabaseOtp() {
    this.isLoading.set(true);
    this.authService.signInWithOtp(this.userEmail).subscribe({
      next: () => {
        this.isLoading.set(false);
        setTimeout(() => {
           const first = document.getElementById('otp-digit-0');
           if (first) first.focus();
        }, 100);
      },
      error: () => {
        this.toastService.showError('No se pudo generar el código de seguridad de Supabase.');
        this.close();
      }
    });
  }

  onOtpChange(code: string) {
    this.otpCode.set(code);
  }

  verifyCode(code?: string) {
    const finalCode = code || this.otpCode();
    if (finalCode.length < 6 || this.isVerifying()) return;
    this.isVerifying.set(true);

    this.authService.verifyOtp(this.userEmail, finalCode, 'email', false).subscribe({
      next: (res) => {
        if (res.error) {
           this.isVerifying.set(false);
           this.toastService.showError('Código inválido o expirado.');
           return;
        }

        // Activado en Supabase. Persistimos el flag en metadata
        this.authService.enable2FA().subscribe({
          next: () => {
             this.isVerifying.set(false);
             this.toastService.showSuccess('¡Verificación en 2 pasos activada!');
             this.dialogRef.close(true);
          },
          error: () => {
             this.isVerifying.set(false);
             this.toastService.showError('Error al guardar estado de seguridad.');
             this.dialogRef.close(true);
          }
        });
      },
      error: (err) => {
        this.isVerifying.set(false);
        this.toastService.showError(err.message || 'Error de validación OTP.');
      }
    });
  }

  disable2FA() {
    if (!this.password || this.isVerifying()) return;
    this.isVerifying.set(true);

    this.authService.disable2FA(this.password).subscribe({
      next: () => {
        this.toastService.showSuccess('2FA desactivado correctamente.');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isVerifying.set(false);
        this.toastService.showError(err.error?.detail || 'Contraseña incorrecta.');
      }
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
