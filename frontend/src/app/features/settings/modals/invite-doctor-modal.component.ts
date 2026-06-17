import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { HttpClient } from '@angular/common/http';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-invite-doctor-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  template: `
    <div class="invite-modal-wrap">

      <!-- Header -->
      <div class="modal-head">
        <div class="modal-head-left">
          <div class="modal-icon">
            <mat-icon>person_add</mat-icon>
          </div>
          <div>
            <h2>Invitar Doctor</h2>
            <p>Supabase enviará el acceso automáticamente</p>
          </div>
        </div>
        <button class="apple-close-btn" (click)="dialogRef.close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- How it works banner -->
      <div class="how-it-works">
        <mat-icon class="info-icon">auto_awesome</mat-icon>
        <div>
          <strong>Sin configuración de correos</strong>
          <p>Al hacer clic en "Enviar Invitación", Supabase enviará automáticamente un Magic Link al correo del doctor. Él solo hace clic en el link para activar su cuenta.</p>
        </div>
      </div>

      <!-- Form -->
      <form [formGroup]="form" (ngSubmit)="sendInvite()" class="invite-form">

        <!-- Email -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Correo del Doctor</mat-label>
          <input matInput formControlName="email" type="email"
            placeholder="doctor@hospital.com" autocomplete="off">
          <mat-icon matPrefix>email</mat-icon>
          <mat-error *ngIf="form.get('email')?.hasError('required')">El correo es requerido</mat-error>
          <mat-error *ngIf="form.get('email')?.hasError('email')">Formato de correo inválido</mat-error>
        </mat-form-field>

        <!-- Full Name -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nombre Completo (opcional)</mat-label>
          <input matInput formControlName="full_name" placeholder="Dr. Juan Pérez">
          <mat-icon matPrefix>person</mat-icon>
        </mat-form-field>

        <!-- Specialty & Role row -->
        <div class="two-col">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Especialidad</mat-label>
            <input matInput formControlName="specialty" placeholder="Neumología">
            <mat-icon matPrefix>medical_services</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Rol en el sistema</mat-label>
            <mat-select formControlName="role">
              <mat-option value="doctor">Doctor</mat-option>
              <mat-option value="admin">Administrador</mat-option>
              <mat-option value="nurse">Enfermero/a</mat-option>
              <mat-option value="viewer">Solo lectura</mat-option>
            </mat-select>
            <mat-icon matPrefix>badge</mat-icon>
          </mat-form-field>
        </div>

        <!-- Success state -->
        <div class="success-banner" *ngIf="inviteSent()">
          <div class="success-icon">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div>
            <strong>¡Invitación enviada! 🎉</strong>
            <p>El correo de activación fue enviado a <em>{{ lastEmail() }}</em>. El doctor recibirá un Magic Link para activar su cuenta.</p>
          </div>
        </div>

        <!-- Error state -->
        <div class="error-banner" *ngIf="errorMsg()">
          <mat-icon>error_outline</mat-icon>
          <span>{{ errorMsg() }}</span>
        </div>

        <!-- Footer Actions -->
        <div class="modal-footer">
          <button type="button" mat-button (click)="dialogRef.close()" class="!font-bold">
            Cerrar
          </button>
          <button type="submit" mat-flat-button color="primary"
            [disabled]="form.invalid || isSending()"
            class="send-btn">
            <mat-spinner *ngIf="isSending()" diameter="18" class="btn-spinner"></mat-spinner>
            <mat-icon *ngIf="!isSending()">send</mat-icon>
            {{ isSending() ? 'Enviando...' : 'Enviar Invitación' }}
          </button>
        </div>

      </form>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; max-width: 560px; border-radius: 28px; overflow: hidden; }

    .invite-modal-wrap { 
      padding: 40px; 
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(40px) saturate(210%);
      -webkit-backdrop-filter: blur(40px) saturate(210%);
      position: relative;
      overflow: hidden;
      font-family: 'Outfit', sans-serif;
    }

    /* Mesh Gradient Background */
    .invite-modal-wrap::before {
      content: '';
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(at 0% 0%, rgba(0, 122, 255, 0.08) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(0, 199, 190, 0.05) 0px, transparent 50%);
      z-index: 0;
      pointer-events: none;
    }

    .modal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
      z-index: 1;
      position: relative;
    }

    .modal-head-left { display: flex; align-items: center; gap: 20px; }

    .modal-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #007AFF, #00C7BE);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 25px rgba(0, 122, 255, 0.25);
      mat-icon { color: white; font-size: 28px; width: 28px; height: 28px; }
    }

    h2 { font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.04em; color: #1d1d1f; }
    p { font-size: 14px; color: #6e6e73; margin: 6px 0 0; }

    .how-it-works {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      background: rgba(0, 122, 255, 0.08);
      border-radius: 20px;
      padding: 18px 20px;
      margin-bottom: 32px;
      z-index: 1;
      position: relative;

      .info-icon { color: #007AFF; font-size: 22px; width: 22px; height: 22px; flex-shrink: 0; margin-top: 2px; }

      strong { font-size: 14px; font-weight: 700; color: #1d1d1f; display: block; margin-bottom: 4px; }
      p { font-size: 13px; color: #48484a; margin: 0; line-height: 1.5; }
    }

    .invite-form { display: flex; flex-direction: column; gap: 8px; z-index: 1; position: relative; }

    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    .success-banner {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      background: rgba(52, 199, 89, 0.08);
      border-radius: 18px;
      padding: 18px;
      margin-top: 12px;
      animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1);

      .success-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: rgba(52, 199, 89, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        mat-icon { color: #34C759; font-size: 22px; width: 22px; height: 22px; }
      }

      strong { display: block; font-size: 15px; font-weight: 700; color: #1d1d1f; }
      p { font-size: 13px; color: #48484a; margin: 6px 0 0; line-height: 1.5; }
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 59, 48, 0.08);
      border-radius: 14px;
      padding: 14px 18px;
      font-size: 14px;
      font-weight: 600;
      color: #FF3B30;
      margin-top: 12px;
      mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid rgba(0,0,0,0.05);
    }

    .send-btn {
      background: linear-gradient(135deg, #007AFF, #0071e3) !important;
      display: flex !important;
      align-items: center;
      gap: 10px;
      border-radius: 16px !important;
      height: 52px !important;
      padding: 0 32px !important;
      font-weight: 700 !important;
      font-size: 16px !important;
      box-shadow: 0 8px 20px rgba(0, 113, 227, 0.3) !important;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
      &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(0, 113, 227, 0.4) !important; }
    }

    .apple-close-btn { 
      background: rgba(0,0,0,0.05);
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #86868b;
      cursor: pointer;
      transition: all 0.2s;
      &:hover { background: rgba(0,0,0,0.1); color: #1d1d1f; }
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    @keyframes slideUpFade {
      from { transform: translateY(12px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    :host-context(body.dark) {
      .invite-modal-wrap {
        background: rgba(28, 28, 30, 0.8) !important;
        border-color: rgba(255, 255, 255, 0.1) !important;
      }
      h2 {
        color: #ffffff;
      }
      p {
        color: #8e8e93;
      }
      .how-it-works {
        background: var(--brand-primary-light);
        strong {
          color: #ffffff;
        }
        p {
          color: #d1d1d6;
        }
      }
      .success-banner {
        background: rgba(52, 199, 89, 0.12);
        strong {
          color: #ffffff;
        }
        p {
          color: #d1d1d6;
        }
      }
      .modal-footer {
        border-top-color: rgba(255, 255, 255, 0.05);
      }
      .apple-close-btn {
        background: rgba(255, 255, 255, 0.08);
        color: #8e8e93;
        &:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }
      }
    }
  `]
})
export class InviteDoctorModalComponent {
  form: FormGroup;
  isSending = signal(false);
  inviteSent = signal(false);
  errorMsg = signal('');
  lastEmail = signal('');

  // Redirect URL que Supabase incluirá en el email de invitación
  private readonly INVITE_REDIRECT = `${window.location.origin}/auth/invite-complete`;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<InviteDoctorModalComponent>,
    private http: HttpClient,
    private supabaseService: SupabaseService,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      full_name: [''],
      specialty: [''],
      role: ['doctor', Validators.required]
    });
  }

  sendInvite() {
    if (this.form.invalid) return;

    this.isSending.set(true);
    this.errorMsg.set('');
    this.inviteSent.set(false);

    const { email, full_name, specialty, role } = this.form.value;
    this.lastEmail.set(email);

    // Usar el endpoint del backend con la API key del dashboard
    this.http.post<any>(`${environment.apiUrl}/admin/invite-doctor`, {
      email,
      full_name: full_name || undefined,
      specialty: specialty || undefined,
      role: role || 'doctor',
      redirect_url: this.INVITE_REDIRECT
    }, {
      headers: { 'X-Dashboard-Api-Key': environment.dashboardApiKey }
    }).subscribe({
      next: () => {
        this.isSending.set(false);
        this.inviteSent.set(true);
        this.toastService.showSuccess(`Invitación enviada a ${email}`);
        this.form.patchValue({ email: '', full_name: '', specialty: '' });
        this.form.markAsPristine();
      },
      error: (err) => {
        this.isSending.set(false);
        // Fallback: intentar via Supabase si el backend no tiene el endpoint configurado
        if (err.status === 404 || err.status === 403) {
          this.sendViaSupabase(email, full_name, specialty, role);
          return;
        }
        this.errorMsg.set(err?.error?.detail || err?.message || 'No se pudo enviar la invitación');
      }
    });
  }

  /** Fallback: invitar directamente vía Supabase si el backend no está disponible */
  private sendViaSupabase(email: string, full_name: string, specialty: string, role: string) {
    this.supabaseService.inviteDoctor(email, { full_name, specialty, role }).subscribe({
      next: (res) => {
        this.isSending.set(false);
        if (res.error) {
          this.errorMsg.set(res.error.message || 'No se pudo enviar la invitación');
        } else {
          this.inviteSent.set(true);
          this.toastService.showSuccess(`Invitación enviada a ${email}`);
          this.form.patchValue({ email: '', full_name: '', specialty: '' });
          this.form.markAsPristine();
        }
      },
      error: (err) => {
        this.isSending.set(false);
        this.errorMsg.set(err?.message || 'Error al enviar la invitación');
      }
    });
  }
}
