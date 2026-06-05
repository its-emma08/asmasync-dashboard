import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PatientService } from '../../core/services/patient.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import { EditProfileModalComponent } from '../settings/modals/edit-profile-modal.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, MatDialogModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  sessionStart = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  private currentUser = signal<any>(null);
  private patientCount = signal<number>(0);
  doctorProfileFetched = false;
  private userReloadPending = false;

  userName = computed(() => this.currentUser()?.full_name || 'Usuario');
  userEmail = computed(() => this.currentUser()?.email || '');
  userInitials = computed(() => {
    const name = this.currentUser()?.full_name || '';
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '??';
  });
  userSpecialty = computed(() => this.currentUser()?.specialty || '');
  profileSubtitle = computed(() => {
    const parts = [this.currentUser()?.specialty, this.currentUser()?.hospital_name].filter(Boolean);
    return parts.join(' • ');
  });
  userRoleLabel = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'admin' ? 'Administrador' : role === 'doctor' ? 'Médico' : 'Usuario';
  });
  doctorCode = computed(() => this.currentUser()?.doctor_code || null);
  isDoctor = computed(() => this.currentUser()?.role === 'doctor');
  userHospital = computed(() => this.currentUser()?.hospital_name || null);
  codeCopied = false;

  kpis = computed(() => [
    { icon: 'groups', value: this.patientCount() || '—', label: 'Pacientes Asignados', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
    { icon: 'workspace_premium', value: this.certifications.length || '—', label: 'Certificaciones', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' }
  ]);

  professionalInfo = computed(() => [
    { label: 'Email', value: this.currentUser()?.email || '—' },
    { label: 'Rol', value: this.userRoleLabel() },
    { label: 'Especialidad', value: this.currentUser()?.specialty || '—' },
    { label: 'Institución', value: this.currentUser()?.hospital_name || '—' },
    { label: 'Activo desde', value: this.currentUser()?.created_at ? new Date(this.currentUser().created_at).toLocaleDateString('es-MX') : '—' },
    { label: 'Pacientes activos', value: String(this.patientCount()) }
  ]);

  addingCert = false;
  newCert = { name: '', year: new Date().getFullYear().toString() };

  specialties = computed(() => {
    const specRaw = this.userSpecialty();
    if (!specRaw || specRaw === '—') return [];
    return specRaw.split(',').map((s: string) => {
      const name = s.trim();
      let icon = 'medical_services';
      if (name.toLowerCase().includes('neumo')) icon = 'air';
      if (name.toLowerCase().includes('alergo')) icon = 'local_florist';
      if (name.toLowerCase().includes('espiro')) icon = 'monitor_heart';
      return { name, icon, bg: 'rgba(59,130,246,0.1)' };
    });
  });

  certifications: any[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private patientService: PatientService,
    private pdfExport: PdfExportService,
    private dialog: MatDialog,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser.set(user);
        // Sync certifications whenever user data arrives
        const certs = user?.certifications;
        this.certifications = (certs && Array.isArray(certs)) ? certs : this.certifications;
        // Si no hay datos de usuario o le falta el nombre, recargar desde el backend (solo una vez)
        if (!user?.full_name || !user?.email) {
          if (!this.userReloadPending) {
            this.userReloadPending = true;
            this.authService.fetchCurrentUser().pipe(takeUntil(this.destroy$)).subscribe({
              complete: () => { this.userReloadPending = false; }
            });
          }
          return;
        }
        // Si el doctor no tiene código cargado, pedirlo al backend
        if (user?.role === 'doctor' && !user?.doctor_code) {
          this.fetchDoctorProfile();
        }
      });

    // Conteo de pacientes
    this.patientService.getPatientStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (stats: any) => this.patientCount.set(stats.total || 0) });

    // Certificaciones — se cargan junto con el usuario
    const certs = this.currentUser()?.certifications;
    this.certifications = (certs && Array.isArray(certs)) ? certs : [];
  }

  private fetchDoctorProfile(): void {
    // GET /doctor/profile — POST returns 405 (backend not yet deployed with upsert endpoint)
    this.http.get<any>(`${environment.apiUrl}/doctor/profile`).pipe(
      catchError(() => of(null)),
      takeUntil(this.destroy$)
    ).subscribe(profile => {
      this.doctorProfileFetched = true;
      if (profile?.doctor_code) {
        const enriched = {
          ...this.currentUser(),
          doctor_code: profile.doctor_code,
          specialty: profile.specialty || this.currentUser()?.specialty
        };
        this.currentUser.set(enriched);
        this.authService.updateStoredUser(enriched);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  copyDoctorCode(): void {
    const code = this.doctorCode();
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      this.codeCopied = true;
      setTimeout(() => this.codeCopied = false, 2000);
    });
  }

  openEditModal(): void {
    const ref = this.dialog.open(EditProfileModalComponent, {
      width: '520px',
      data: { user: this.currentUser() }
    });
    ref.afterClosed().subscribe((updatedUser: any) => {
      if (updatedUser) this.currentUser.set(updatedUser);
    });
  }

  addCert() {
    if (this.newCert.name) {
      this.certifications.unshift({ ...this.newCert });
      this.newCert = { name: '', year: new Date().getFullYear().toString() };
      this.addingCert = false;
      this.saveCerts();
    }
  }

  saveCerts() {
    this.authService.updateProfile({ certifications: this.certifications }).subscribe({
      next: (user) => {
        this.currentUser.set(user);
      },
      error: (err) => {
        console.error('Error guardando certificaciones', err);
        const updated = { ...this.currentUser(), certifications: this.certifications };
        this.authService.updateStoredUser(updated);
        this.currentUser.set(updated);
      }
    });
  }

  async exportCV(): Promise<void> {
    const user = this.currentUser();
    const today = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
    const initials = this.userInitials();
    const name = this.userName();
    const certsHtml = this.certifications.map(c => `
      <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #f1f5f9;">
        <div style="width:32px;height:32px;border-radius:50%;background:#fef3c7;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">🏅</div>
        <div><div style="font-size:12px;font-weight:700;color:#1e293b;">${c.name}</div>
        <div style="font-size:10px;color:#64748b;">Emitido: ${c.year}</div></div>
      </div>`).join('');
    const infoHtml = this.professionalInfo().map(f =>
      `<div style="padding:6px 0;border-bottom:1px solid #f1f5f9;"><span style="font-size:9px;color:#94a3b8;font-weight:700;text-transform:uppercase;display:block;">${f.label}</span><span style="font-size:12px;font-weight:700;color:#1e293b;">${f.value}</span></div>`
    ).join('');

    const html = `
<div style="font-family:'Inter',Arial,sans-serif;color:#1e293b;background:white;">
  <div style="background:linear-gradient(135deg,#0f766e,#00B5AD,#14b8a6);padding:24px;border-radius:12px;margin-bottom:24px;">
    <div style="display:flex;align-items:center;gap:20px;">
      <div style="width:72px;height:72px;border-radius:18px;background:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;">
        <span style="color:white;font-size:28px;font-weight:700;">${initials}</span>
      </div>
      <div>
        <div style="color:white;font-size:24px;font-weight:800;">${name}</div>
        <div style="color:rgba(255,255,255,0.8);font-size:13px;">${this.userSpecialty()}${user?.hospital_name ? ' · ' + user.hospital_name : ''}</div>
        <div style="color:rgba(255,255,255,0.7);font-size:11px;margin-top:4px;">${user?.email || ''}</div>
      </div>
      <div style="margin-left:auto;text-align:right;color:rgba(255,255,255,0.8);font-size:11px;">
        <div>Curriculo Vitae Médico</div><div>${today}</div>
      </div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
    <div>
      <div style="font-size:11px;font-weight:700;color:#0e7490;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:12px;">INFORMACIÓN PROFESIONAL</div>
      ${infoHtml}
    </div>
    <div>
      <div style="font-size:11px;font-weight:700;color:#d97706;text-transform:uppercase;border-bottom:1px solid #fef3c7;padding-bottom:4px;margin-bottom:12px;">CERTIFICACIONES</div>
      ${certsHtml}
    </div>
  </div>
  <div style="margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0;text-align:center;">
    <p style="font-size:9px;color:#94a3b8;margin:0;">AsmaSync Medical Dashboard — CV generado el ${today}</p>
  </div>
</div>`;

    await this.pdfExport.exportFromHtml(html, {
      filename: `CV_${this.pdfExport.sanitizeName(name)}_${Date.now()}.pdf`,
      paperSize: 'letter'
    });
  }

  goToSettings(): void { this.router.navigate(['/dashboard/settings']); }
  logout(): void { this.authService.logout(); }
}
