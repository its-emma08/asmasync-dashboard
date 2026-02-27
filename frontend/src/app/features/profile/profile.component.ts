import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <div class="page-scroll-container print-friendly">
    <div class="profile-page">

      <!-- ===== Glassmorphism Hero Banner ===== -->
      <div class="hero-banner">
        <div class="hero-bg"></div>
        <div class="hero-content">
          <div class="hero-avatar">
            <span>KP</span>
          </div>
          <div class="hero-info">
            <h1>Dr. Kiran Patel</h1>
            <p class="hero-subtitle">Neumología • Hospital General SLP</p>
            <div class="hero-badges hide-on-print">
              <span class="badge badge-role">
                <mat-icon>admin_panel_settings</mat-icon> Administrador
              </span>
              <span class="badge badge-active">
                <span class="pulse-dot"></span> Activo
              </span>
              <span class="badge badge-cert">
                <mat-icon>verified</mat-icon> Certificado INER
              </span>
            </div>
            <!-- Print only text -->
            <p class="print-only text-sm mt-2 text-white">Certificado INER • Ced. Prof: 12345678</p>
          </div>
          <div class="hero-actions hide-on-print">
            <button mat-stroked-button class="hero-btn mr-2" (click)="exportCV()">
              <mat-icon>download</mat-icon> Exportar CV
            </button>
            <button mat-stroked-button class="hero-btn" (click)="goToSettings()">
              <mat-icon>settings</mat-icon> Editar
            </button>
          </div>
        </div>
      </div>

      <!-- ===== KPI Glass Cards (Hide on CV Print if preferred, or keep) ===== -->
      <div class="kpi-row">
        <div *ngFor="let kpi of kpis" class="kpi-glass-card">
          <div class="kpi-icon" [style.background]="kpi.gradient">
            <mat-icon>{{ kpi.icon }}</mat-icon>
          </div>
          <div class="kpi-data">
            <span class="kpi-value">{{ kpi.value }}</span>
            <span class="kpi-label">{{ kpi.label }}</span>
          </div>
        </div>
      </div>

      <!-- ===== Bento Grid ===== -->
      <div class="bento-grid">

        <!-- Professional Info -->
        <div class="bento-card bento-info border-b border-gray-100">
          <div class="bento-header">
            <mat-icon class="text-indigo-500">badge</mat-icon>
            <h3 class="text-indigo-900">Información Profesional</h3>
          </div>
          <div class="info-list grid grid-cols-2 gap-x-4">
            <div *ngFor="let field of professionalInfo" class="info-row col-span-1 border-b border-gray-50 py-2">
              <span class="info-label text-xs text-slate-500">{{ field.label }}</span>
              <span class="info-value text-sm font-bold text-slate-800 block">{{ field.value }}</span>
            </div>
          </div>
        </div>

        <!-- Experience & History -->
        <div class="bento-card bento-history">
          <div class="bento-header">
            <mat-icon class="text-teal-500">work_history</mat-icon>
            <h3 class="text-teal-900">Historial Profesional</h3>
          </div>
          <div class="history-timeline space-y-4 relative pl-4 border-l-2 border-teal-100 mt-4">
            <div *ngFor="let exp of experience" class="relative">
                <div class="absolute -left-[21px] top-1 w-3 h-3 bg-white border-2 border-teal-400 rounded-full"></div>
                <h4 class="font-bold text-slate-800 text-sm">{{ exp.role }}</h4>
                <p class="text-xs text-slate-500 font-medium">{{ exp.institution }} | <span class="text-teal-600">{{ exp.period }}</span></p>
                <p class="text-xs text-slate-400 mt-1">{{ exp.description }}</p>
            </div>
          </div>
        </div>

        <!-- Specialties & Certifications -->
        <div class="bento-card bento-specs">
          <div class="bento-header">
            <mat-icon class="text-purple-500">workspace_premium</mat-icon>
            <h3 class="text-purple-900">Especialidades</h3>
          </div>
          <div class="specs-list mb-6">
            <div *ngFor="let spec of specialties" class="spec-chip" [style.background]="spec.bg">
              <mat-icon>{{ spec.icon }}</mat-icon>
              <span>{{ spec.name }}</span>
            </div>
          </div>
          
          <div class="bento-header flex justify-between items-center mb-0">
            <div class="flex items-center gap-2">
                <mat-icon class="text-amber-500">military_tech</mat-icon>
                <h3 class="text-amber-900 mb-0">Certificaciones</h3>
            </div>
            <button mat-icon-button class="hide-on-print text-amber-600" (click)="addingCert = !addingCert">
                <mat-icon>{{ addingCert ? 'close' : 'add_circle' }}</mat-icon>
            </button>
          </div>

          <!-- Add Cert Form -->
          <div *ngIf="addingCert" class="hide-on-print bg-amber-50 p-4 rounded-xl mb-4 border border-amber-100 flex gap-2 items-start animate-fade-in-up">
            <div class="flex-1 space-y-2">
                <input type="text" [(ngModel)]="newCert.name" placeholder="Nombre de la Certificación" class="w-full text-sm p-2 rounded-lg border border-amber-200 outline-none focus:border-amber-400 bg-white">
                <input type="text" [(ngModel)]="newCert.year" placeholder="Año (ej. 2024)" class="w-full text-sm p-2 rounded-lg border border-amber-200 outline-none focus:border-amber-400 bg-white">
            </div>
            <button mat-flat-button color="accent" (click)="addCert()" [disabled]="!newCert.name" class="mt-1 !bg-amber-500 !text-white">Añadir</button>
          </div>

          <div class="certs-list mt-2 space-y-3">
            <div *ngFor="let cert of certifications" class="cert-item p-3 border border-slate-100 rounded-xl flex items-center gap-3 hover:bg-slate-50 transition-colors">
              <div class="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                <mat-icon>verified</mat-icon>
              </div>
              <div>
                <p class="cert-name text-sm font-bold text-slate-800">{{ cert.name }}</p>
                <p class="cert-year text-xs text-slate-500 font-medium">Emitido en: {{ cert.year }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Session & Quick Actions (Hidden on Print) -->
        <div class="bento-card bento-actions hide-on-print">
          <div class="bento-header">
            <mat-icon class="text-slate-500">schedule</mat-icon>
            <h3 class="text-slate-700">Sesión Actual</h3>
          </div>
          <div class="session-details mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div class="session-row text-sm">
              <span class="text-slate-500">Inicio</span>
              <span class="font-bold text-slate-800">{{ sessionStart }}</span>
            </div>
            <div class="session-row text-sm mt-2">
              <span class="text-slate-500">Duración</span>
              <span class="font-bold text-slate-800">{{ sessionDuration }}</span>
            </div>
          </div>

          <div class="bento-header">
            <mat-icon class="text-indigo-500">bolt</mat-icon>
            <h3 class="text-indigo-900">Acciones Privadas</h3>
          </div>
          <div class="quick-actions-grid">
            <button class="quick-action col-span-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100" (click)="exportCV()">
              <mat-icon class="text-indigo-600">file_download</mat-icon>
              <span>Generar CV Médico (PDF)</span>
            </button>
            <button class="quick-action">
              <mat-icon>lock</mat-icon>
              <span>Contraseña</span>
            </button>
            <button class="quick-action danger" (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

      </div>
    </div>
    </div>
  `,
  styles: [`
    .profile-page {
      padding: 32px;
      max-width: 100%;
      min-height: calc(100vh - 64px);
    }
    .print-only { display: none; }

    /* ===== Hero Banner (Glassmorphism) ===== */
    .hero-banner {
      position: relative;
      border-radius: 24px;
      overflow: hidden;
      margin-bottom: 20px;
    }
    .hero-bg {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #0f766e 0%, #00B5AD 40%, #14b8a6 70%, #2dd4bf 100%);
    }
    .hero-bg::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 30%, rgba(255,255,255,0.08) 0%, transparent 40%);
    }
    .hero-content {
      position: relative;
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 32px;
      background: rgba(255,255,255,0.08);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
    .hero-avatar {
      width: 88px;
      height: 88px;
      border-radius: 22px;
      background: rgba(255,255,255,0.2);
      border: 2px solid rgba(255,255,255,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .hero-avatar span {
      color: white;
      font-size: 32px;
      font-weight: 700;
    }
    .hero-info { flex: 1; }
    .hero-info h1 {
      color: white;
      font-size: 26px;
      font-weight: 700;
      margin: 0 0 4px;
    }
    .hero-subtitle {
      color: rgba(255,255,255,0.7);
      font-size: 14px;
      margin: 0 0 12px;
    }
    .hero-badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .badge-role { background: rgba(255,255,255,0.15); color: white; }
    .badge-active { background: rgba(34,197,94,0.2); color: #86efac; }
    .badge-cert { background: rgba(251,191,36,0.2); color: #fde68a; }
    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #4ade80;
      animation: pulse-dot 2s ease-in-out infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    .hero-actions {
      flex-shrink: 0;
    }
    .hero-btn {
      color: white !important;
      border-color: rgba(255,255,255,0.3) !important;
      border-radius: 12px !important;
      font-size: 13px !important;
    }
    .hero-btn mat-icon { font-size: 18px; margin-right: 4px; }

    /* ===== KPI Glass Cards ===== */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }
    .kpi-glass-card {
      background: white;
      border-radius: 24px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 2px 10px rgba(0,0,0,0.03);
      padding: 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .kpi-glass-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.05);
    }
    .kpi-icon {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .kpi-icon mat-icon { color: white; font-size: 22px; width: 22px; height: 22px; }
    .kpi-data {
      display: flex;
      flex-direction: column;
    }
    .kpi-value {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1;
    }
    .kpi-label {
      font-size: 12px;
      font-weight: 500;
      color: #94a3b8;
      margin-top: 3px;
    }

    /* ===== Bento Grid ===== */
    .bento-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto;
      gap: 16px;
    }
    .bento-card {
      background: white;
      border: 1px solid #f1f5f9;
      border-radius: 24px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.03);
      padding: 24px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .bento-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
    }
    .bento-header h3 {
      font-size: 16px;
      font-weight: 800;
      margin: 0;
    }

    /* Specialties */
    .specs-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .spec-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 14px;
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
    }
    .spec-chip mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* Quick Actions Grid */
    .quick-actions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .quick-action {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 14px;
      border: 1px solid rgba(0,0,0,0.06);
      background: #f8fafc;
      color: #334155;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .quick-action:hover {
      background: #f1f5f9;
      border-color: rgba(0,0,0,0.1);
      transform: translateY(-1px);
    }
    .quick-action mat-icon { font-size: 18px; width: 18px; height: 18px; color: #64748b; }
    .quick-action.col-span-2 { grid-column: span 2; justify-content: center; }
    .quick-action.danger { color: #ef4444; background: #fef2f2; border-color: #fee2e2; }
    .quick-action.danger:hover { background: #fee2e2; }
    .quick-action.danger mat-icon { color: #ef4444; }

    /* ============================================
       Print Styles - Resume / CV Generator
       ============================================ */
    @media print {
      @page { margin: 1.5cm; }
      body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      
      /* Hide unnecessary elements */
      .hide-on-print,
      app-sidebar,
      .main-layout-container aside,
      app-dashboard-header,
      .mat-mdc-snack-bar-container {
        display: none !important;
      }
      
      .print-only { display: block !important; }

      /* Adjust layout for print */
      .main-layout-container { display: block !important; height: auto !important; overflow: visible !important; }
      .layout-content, #main-content, .page-scroll-container, .profile-page {
        overflow: visible !important;
        height: auto !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      .hero-banner {
        break-inside: avoid;
        border-radius: 16px;
        box-shadow: none !important;
        margin-bottom: 24px;
      }

      .bento-grid {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .bento-card {
        box-shadow: none !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 12px !important;
        break-inside: avoid;
        padding: 20px;
      }
      .kpi-row { grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 24px; }
      .kpi-glass-card { padding: 12px; border: 1px solid #e2e8f0; box-shadow: none !important;}
    }
  `]
})
export class ProfileComponent {
  sessionStart = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  sessionDuration = '2h 15min';

  addingCert = false;
  newCert = { name: '', year: new Date().getFullYear().toString() };

  kpis = [
    { icon: 'groups', value: '1,240', label: 'Pacientes Atendidos', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
    { icon: 'healing', value: '98%', label: 'Tasa de Control', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
    { icon: 'workspace_premium', value: '12', label: 'Certificaciones', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    { icon: 'local_library', value: '4', label: 'Publicaciones', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }
  ];

  professionalInfo = [
    { label: 'Especialidad', value: 'Neumología' },
    { label: 'Sub-especialidad', value: 'Asma y Alergias' },
    { label: 'Cédula Profesional', value: '12345678' },
    { label: 'Cédula Especialidad', value: '87654321' },
    { label: 'Institución Principal', value: 'Hospital General SLP' },
    { label: 'Años de Experiencia', value: '12 años' }
  ];

  experience = [
    { role: 'Jefe de Neumología', institution: 'Hospital General SLP', period: '2020 - Presente', description: 'Dirección del área clínica y coordinación del programa nacional de control del asma.' },
    { role: 'Médico Adscrito', institution: 'Instituto Nacional de Enfermedades Respiratorias (INER)', period: '2015 - 2020', description: 'Atención a pacientes referidos e investigación clínica en hiperreactividad bronquial.' },
    { role: 'Residencia Médica', institution: 'Hospital Universitario', period: '2011 - 2015', description: 'Especialidad en Neumología Clínica.' }
  ];

  specialties = [
    { name: 'Neumología', icon: 'lungs', bg: 'rgba(59,130,246,0.1)' },
    { name: 'Alergología', icon: 'local_florist', bg: 'rgba(236,72,153,0.1)' },
    { name: 'Espirometría Avanzada', icon: 'air', bg: 'rgba(139,92,246,0.1)' },
    { name: 'Investigación Clínica', icon: 'science', bg: 'rgba(34,197,94,0.1)' }
  ];

  certifications = [
    { name: 'Consejo Nacional de Neumología', year: '2020' },
    { name: 'GINA Certified Asthma Educator', year: '2022' },
    { name: 'Espirometría Avanzada — INER', year: '2023' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  addCert() {
    if (this.newCert.name) {
      this.certifications.unshift({ ...this.newCert });
      this.newCert = { name: '', year: new Date().getFullYear().toString() };
      this.addingCert = false;
    }
  }

  exportCV() {
    window.print();
  }

  goToSettings(): void {
    this.router.navigate(['/dashboard/settings']);
  }

  logout(): void {
    this.authService.logout();
  }
}
