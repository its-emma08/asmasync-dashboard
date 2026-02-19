import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page-scroll-container">
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
            <div class="hero-badges">
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
          </div>
          <div class="hero-actions">
            <button mat-stroked-button class="hero-btn" (click)="goToSettings()">
              <mat-icon>settings</mat-icon> Configuración
            </button>
          </div>
        </div>
      </div>

      <!-- ===== KPI Glass Cards ===== -->
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
        <div class="bento-card bento-info">
          <div class="bento-header">
            <mat-icon>badge</mat-icon>
            <h3>Información Profesional</h3>
          </div>
          <div class="info-list">
            <div *ngFor="let field of professionalInfo" class="info-row">
              <span class="info-label">{{ field.label }}</span>
              <span class="info-value">{{ field.value }}</span>
            </div>
          </div>
        </div>

        <!-- Mini Calendar / Availability -->
        <div class="bento-card bento-calendar">
          <div class="bento-header">
            <mat-icon>calendar_today</mat-icon>
            <h3>Disponibilidad</h3>
          </div>
          <div class="schedule-grid">
            <div *ngFor="let day of schedule" class="schedule-item"
              [class.active]="day.active">
              <span class="day-name">{{ day.day }}</span>
              <span class="day-hours">{{ day.hours }}</span>
            </div>
          </div>
          <div class="next-appt">
            <mat-icon>event</mat-icon>
            <div>
              <p class="next-label">Próxima cita</p>
              <p class="next-time">Hoy 14:30 — Juan Pérez</p>
            </div>
          </div>
        </div>

        <!-- Specialties & Certifications -->
        <div class="bento-card bento-specs">
          <div class="bento-header">
            <mat-icon>workspace_premium</mat-icon>
            <h3>Especialidades</h3>
          </div>
          <div class="specs-list">
            <div *ngFor="let spec of specialties" class="spec-chip" [style.background]="spec.bg">
              <mat-icon>{{ spec.icon }}</mat-icon>
              <span>{{ spec.name }}</span>
            </div>
          </div>
          <div class="bento-header" style="margin-top: 16px;">
            <mat-icon>military_tech</mat-icon>
            <h3>Certificaciones</h3>
          </div>
          <div class="certs-list">
            <div *ngFor="let cert of certifications" class="cert-item">
              <mat-icon>verified</mat-icon>
              <div>
                <p class="cert-name">{{ cert.name }}</p>
                <p class="cert-year">{{ cert.year }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Session & Quick Actions -->
        <div class="bento-card bento-actions">
          <div class="bento-header">
            <mat-icon>schedule</mat-icon>
            <h3>Sesión Actual</h3>
          </div>
          <div class="session-details">
            <div class="session-row">
              <span>Inicio</span>
              <span>{{ sessionStart }}</span>
            </div>
            <div class="session-row">
              <span>Duración</span>
              <span>{{ sessionDuration }}</span>
            </div>
            <div class="session-row">
              <span>Dispositivo</span>
              <span>Windows • Chrome</span>
            </div>
          </div>

          <div class="bento-header" style="margin-top: 16px;">
            <mat-icon>bolt</mat-icon>
            <h3>Acciones Rápidas</h3>
          </div>
          <div class="quick-actions-grid">
            <button class="quick-action" (click)="goToSettings()">
              <mat-icon>settings</mat-icon>
              <span>Configuración</span>
            </button>
            <button class="quick-action">
              <mat-icon>lock</mat-icon>
              <span>Contraseña</span>
            </button>
            <button class="quick-action">
              <mat-icon>download</mat-icon>
              <span>Exportar</span>
            </button>
            <button class="quick-action danger" (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Salir</span>
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
      padding: 20px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .bento-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.05);
    }
    .bento-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
    }
    .bento-header mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #00B5AD;
    }
    .bento-header h3 {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    /* Info list */
    .info-list { display: flex; flex-direction: column; }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(0,0,0,0.03);
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-size: 13px; color: #64748b; }
    .info-value { font-size: 13px; font-weight: 600; color: #1e293b; }

    /* Schedule */
    .schedule-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
      margin-bottom: 16px;
    }
    .schedule-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 4px;
      border-radius: 10px;
      background: #f8fafc;
      transition: all 0.15s ease;
    }
    .schedule-item.active {
      background: rgba(0,181,173,0.08);
    }
    .day-name {
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .schedule-item.active .day-name { color: #00B5AD; }
    .day-hours {
      font-size: 10px;
      font-weight: 500;
      color: #64748b;
    }
    .schedule-item.active .day-hours { color: #009E97; }

    .next-appt {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      background: rgba(0,181,173,0.05);
      border-radius: 14px;
    }
    .next-appt mat-icon { color: #00B5AD; }
    .next-label { font-size: 11px; color: #64748b; margin: 0; }
    .next-time { font-size: 13px; font-weight: 600; color: #1e293b; margin: 2px 0 0; }

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
      padding: 6px 14px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 500;
      color: #1e293b;
    }
    .spec-chip mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .certs-list { display: flex; flex-direction: column; gap: 8px; }
    .cert-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cert-item mat-icon { font-size: 18px; width: 18px; height: 18px; color: #f59e0b; }
    .cert-name { font-size: 13px; font-weight: 600; color: #1e293b; margin: 0; }
    .cert-year { font-size: 11px; color: #94a3b8; margin: 0; }

    /* Session */
    .session-details { display: flex; flex-direction: column; }
    .session-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
    }
    .session-row span:first-child { color: #64748b; }
    .session-row span:last-child { font-weight: 600; color: #1e293b; }

    /* Quick Actions Grid */
    .quick-actions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .quick-action {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 12px;
      border: 1px solid rgba(0,0,0,0.06);
      background: #f8fafc;
      color: #334155;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .quick-action:hover {
      background: #f1f5f9;
      border-color: rgba(0,0,0,0.1);
    }
    .quick-action mat-icon { font-size: 18px; width: 18px; height: 18px; color: #64748b; }
    .quick-action.danger { color: #ef4444; }
    .quick-action.danger mat-icon { color: #ef4444; }
  `]
})
export class ProfileComponent {
  sessionStart = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  sessionDuration = '2h 15min';

  kpis = [
    { icon: 'groups', value: '20', label: 'Pacientes Activos', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
    { icon: 'healing', value: '8', label: 'Crisis Prevenidas', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
    { icon: 'timer', value: '4.2m', label: 'Resp. Promedio', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    { icon: 'description', value: '34', label: 'Reportes Generados', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }
  ];

  professionalInfo = [
    { label: 'Especialidad', value: 'Neumología' },
    { label: 'Sub-especialidad', value: 'Asma y Alergias' },
    { label: 'Cédula Profesional', value: '12345678' },
    { label: 'Institución', value: 'Hospital General SLP' },
    { label: 'Turno', value: 'Matutino (7:00 - 15:00)' },
    { label: 'Antigüedad', value: '8 años' }
  ];

  schedule = [
    { day: 'Lun', hours: '7-15', active: true },
    { day: 'Mar', hours: '7-15', active: true },
    { day: 'Mié', hours: '7-15', active: true },
    { day: 'Jue', hours: '7-15', active: true },
    { day: 'Vie', hours: '7-13', active: true },
    { day: 'Sáb', hours: '—', active: false },
    { day: 'Dom', hours: '—', active: false }
  ];

  specialties = [
    { name: 'Neumología', icon: 'lungs', bg: 'rgba(59,130,246,0.1)' },
    { name: 'Alergología', icon: 'local_florist', bg: 'rgba(236,72,153,0.1)' },
    { name: 'Medicina Interna', icon: 'medical_services', bg: 'rgba(34,197,94,0.1)' },
    { name: 'Espirometría', icon: 'air', bg: 'rgba(139,92,246,0.1)' }
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

  goToSettings(): void {
    this.router.navigate(['/dashboard/settings']);
  }

  logout(): void {
    this.authService.logout();
  }
}
