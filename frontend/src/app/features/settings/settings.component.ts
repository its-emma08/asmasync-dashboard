import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { StorageService } from '../../core/services/storage.service';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatSlideToggleModule,
    MatButtonModule, MatIconModule, MatDividerModule, MatSelectModule,
    MatInputModule, MatSnackBarModule, MatProgressBarModule
  ],
  template: `
    <div class="settings-layout">

      <!-- ======= SIDEBAR (Frosted Glass) ======= -->
      <nav class="settings-sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <mat-icon>lungs</mat-icon>
          </div>
          <h2>Configuración</h2>
        </div>

        <div class="sidebar-nav">
          <button *ngFor="let tab of tabs; let i = index"
            (click)="activeTab = i"
            class="nav-item"
            [class.active]="activeTab === i">
            <mat-icon>{{ tab.icon }}</mat-icon>
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <div class="sidebar-footer">
          <p class="version-text">AsmaSync v2.4.0</p>
        </div>
      </nav>

      <!-- ======= CONTENT PANEL ======= -->
      <main class="settings-content page-scroll-container">

        <!-- ===== CUENTA ===== -->
        <section *ngIf="activeTab === 0" class="settings-section animate-in">
          <div class="section-header">
            <h3>Cuenta</h3>
            <p>Administra tu perfil y datos de acceso</p>
          </div>

          <!-- Profile Card -->
          <div class="glass-card profile-card">
            <div class="profile-avatar">KP</div>
            <div class="profile-info">
              <h4>Dr. Kiran Patel</h4>
              <p>kiran.patel&#64;hospital.com</p>
              <span class="role-badge">Administrador</span>
            </div>
            <button mat-stroked-button class="edit-profile-btn">Editar Perfil</button>
          </div>

          <div class="glass-card">
            <div class="setting-row">
              <div class="setting-left">
                <div class="setting-icon bg-blue"><mat-icon>lock</mat-icon></div>
                <div>
                  <p class="setting-title">Contraseña</p>
                  <p class="setting-desc">Última actualización hace 30 días</p>
                </div>
              </div>
              <button mat-stroked-button class="action-btn">Cambiar</button>
            </div>
            <div class="divider"></div>
            <div class="setting-row">
              <div class="setting-left">
                <div class="setting-icon bg-green"><mat-icon>security</mat-icon></div>
                <div>
                  <p class="setting-title">Verificación en 2 Pasos (2FA)</p>
                  <p class="setting-desc">Protección adicional para tu cuenta</p>
                </div>
              </div>
              <mat-slide-toggle [(ngModel)]="settings.twoFactor" color="primary" (ngModelChange)="save()"></mat-slide-toggle>
            </div>
            <div class="divider"></div>
            <div class="setting-row">
              <div class="setting-left">
                <div class="setting-icon bg-orange"><mat-icon>download</mat-icon></div>
                <div>
                  <p class="setting-title">Exportar Datos</p>
                  <p class="setting-desc">Descarga una copia de toda tu información</p>
                </div>
              </div>
              <button mat-stroked-button class="action-btn">Exportar</button>
            </div>
          </div>
        </section>

        <!-- ===== NOTIFICACIONES ===== -->
        <section *ngIf="activeTab === 1" class="settings-section animate-in">
          <div class="section-header">
            <h3>Notificaciones</h3>
            <p>Controla cuándo y cómo recibes alertas</p>
          </div>

          <div class="glass-card">
            <h5 class="card-subtitle">Canales de Notificación</h5>
            <div class="notification-channels">
              <div class="channel-item">
                <div class="channel-icon"><mat-icon>notifications</mat-icon></div>
                <div class="channel-info">
                  <p class="setting-title">Push</p>
                  <p class="setting-desc">Notificaciones del navegador</p>
                </div>
                <mat-slide-toggle [(ngModel)]="settings.pushNotifications" color="primary" (ngModelChange)="save()"></mat-slide-toggle>
              </div>
              <div class="channel-item">
                <div class="channel-icon"><mat-icon>email</mat-icon></div>
                <div class="channel-info">
                  <p class="setting-title">Email</p>
                  <p class="setting-desc">Resumen de alertas al correo</p>
                </div>
                <mat-slide-toggle [(ngModel)]="settings.emailAlerts" color="primary" (ngModelChange)="save()"></mat-slide-toggle>
              </div>
              <div class="channel-item">
                <div class="channel-icon"><mat-icon>sms</mat-icon></div>
                <div class="channel-info">
                  <p class="setting-title">SMS</p>
                  <p class="setting-desc">Alertas críticas vía mensaje de texto</p>
                </div>
                <mat-slide-toggle [(ngModel)]="settings.smsAlerts" color="primary" (ngModelChange)="save()"></mat-slide-toggle>
              </div>
            </div>
          </div>

          <div class="glass-card">
            <div class="setting-row">
              <div class="setting-left">
                <div class="setting-icon bg-amber"><mat-icon>volume_up</mat-icon></div>
                <div>
                  <p class="setting-title">Sonido de Alerta</p>
                  <p class="setting-desc">Reproducir un sonido al recibir alertas críticas</p>
                </div>
              </div>
              <mat-slide-toggle [(ngModel)]="settings.alertSound" color="primary" (ngModelChange)="save()"></mat-slide-toggle>
            </div>
            <div class="divider"></div>
            <div class="setting-row">
              <div class="setting-left">
                <div class="setting-icon bg-red"><mat-icon>priority_high</mat-icon></div>
                <div>
                  <p class="setting-title">Solo Alertas Críticas</p>
                  <p class="setting-desc">Filtrar alertas de baja prioridad</p>
                </div>
              </div>
              <mat-slide-toggle [(ngModel)]="settings.criticalOnly" color="primary" (ngModelChange)="save()"></mat-slide-toggle>
            </div>
            <div class="divider"></div>
            <div class="setting-row">
              <div class="setting-left">
                <div class="setting-icon bg-indigo"><mat-icon>timer</mat-icon></div>
                <div>
                  <p class="setting-title">Frecuencia de Resumen</p>
                  <p class="setting-desc">Con qué frecuencia enviar reportes por email</p>
                </div>
              </div>
              <mat-select [(value)]="settings.alertFrequency" class="select-compact" (selectionChange)="save()">
                <mat-option value="realtime">Tiempo real</mat-option>
                <mat-option value="hourly">Cada hora</mat-option>
                <mat-option value="daily">Diario</mat-option>
                <mat-option value="weekly">Semanal</mat-option>
              </mat-select>
            </div>
          </div>
        </section>

        <!-- ===== DISPOSITIVOS IoT ===== -->
        <section *ngIf="activeTab === 2" class="settings-section animate-in">
          <div class="section-header">
            <h3>Dispositivos IoT</h3>
            <p>Monitorea el estado de los dispositivos médicos conectados</p>
          </div>

          <div class="devices-grid">
            <div *ngFor="let device of iotDevices" class="device-card glass-card">
              <div class="device-header">
                <div class="device-icon" [class]="device.statusClass">
                  <mat-icon>{{ device.icon }}</mat-icon>
                </div>
                <div class="device-status-dot" [class]="device.dotClass"></div>
              </div>
              <h4 class="device-name">{{ device.name }}</h4>
              <p class="device-model">{{ device.model }}</p>
              <div class="device-meta">
                <div class="device-meta-item">
                  <mat-icon>battery_std</mat-icon>
                  <span>{{ device.battery }}%</span>
                  <mat-progress-bar [value]="device.battery" [color]="device.battery > 20 ? 'primary' : 'warn'"
                    class="battery-bar"></mat-progress-bar>
                </div>
                <div class="device-meta-item">
                  <mat-icon>sync</mat-icon>
                  <span>{{ device.lastSync }}</span>
                </div>
              </div>
              <div class="device-patient" *ngIf="device.patient">
                <mat-icon>person</mat-icon>
                <span>{{ device.patient }}</span>
              </div>
            </div>

            <!-- Add Device Card -->
            <div class="device-card glass-card add-device">
              <mat-icon>add_circle_outline</mat-icon>
              <span>Vincular Dispositivo</span>
            </div>
          </div>
        </section>

        <!-- ===== SEGURIDAD ===== -->
        <section *ngIf="activeTab === 3" class="settings-section animate-in">
          <div class="section-header">
            <h3>Seguridad</h3>
            <p>Protege la información de tus pacientes</p>
          </div>

          <div class="glass-card">
            <div class="setting-row">
              <div class="setting-left">
                <div class="setting-icon bg-red"><mat-icon>visibility_off</mat-icon></div>
                <div>
                  <p class="setting-title">Modo Privacidad</p>
                  <p class="setting-desc">Ocultar nombres de pacientes en el dashboard</p>
                </div>
              </div>
              <mat-slide-toggle [(ngModel)]="settings.privacyMode" color="primary" (ngModelChange)="save()"></mat-slide-toggle>
            </div>
            <div class="divider"></div>
            <div class="setting-row">
              <div class="setting-left">
                <div class="setting-icon bg-amber"><mat-icon>lock_clock</mat-icon></div>
                <div>
                  <p class="setting-title">Bloqueo Automático</p>
                  <p class="setting-desc">Bloquear la pantalla por inactividad</p>
                </div>
              </div>
              <mat-select [(value)]="settings.autoLock" class="select-compact" (selectionChange)="save()">
                <mat-option [value]="5">5 minutos</mat-option>
                <mat-option [value]="15">15 minutos</mat-option>
                <mat-option [value]="30">30 minutos</mat-option>
                <mat-option [value]="0">Nunca</mat-option>
              </mat-select>
            </div>
            <div class="divider"></div>
            <div class="setting-row">
              <div class="setting-left">
                <div class="setting-icon bg-slate"><mat-icon>timer_off</mat-icon></div>
                <div>
                  <p class="setting-title">Duración de Sesión</p>
                  <p class="setting-desc">Cerrar sesión automáticamente después de</p>
                </div>
              </div>
              <mat-select [(value)]="settings.sessionTimeout" class="select-compact" (selectionChange)="save()">
                <mat-option [value]="1">1 hora</mat-option>
                <mat-option [value]="4">4 horas</mat-option>
                <mat-option [value]="8">8 horas</mat-option>
                <mat-option [value]="12">12 horas</mat-option>
              </mat-select>
            </div>
          </div>

          <!-- Active Sessions -->
          <div class="glass-card">
            <h5 class="card-subtitle">Sesiones Activas</h5>
            <div class="sessions-list">
              <div *ngFor="let session of activeSessions" class="session-item">
                <div class="session-icon">
                  <mat-icon>{{ session.icon }}</mat-icon>
                </div>
                <div class="session-info">
                  <p class="setting-title">{{ session.device }}</p>
                  <p class="setting-desc">{{ session.location }} • {{ session.lastActive }}</p>
                </div>
                <span *ngIf="session.current" class="current-badge">Actual</span>
                <button *ngIf="!session.current" mat-icon-button class="session-close">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- ===== APARIENCIA ===== -->
        <section *ngIf="activeTab === 4" class="settings-section animate-in">
          <div class="section-header">
            <h3>Apariencia</h3>
            <p>Personaliza el aspecto visual de la aplicación</p>
          </div>

          <!-- Theme Selector Cards -->
          <div class="glass-card">
            <h5 class="card-subtitle">Tema</h5>
            <div class="theme-grid">
              <div *ngFor="let theme of themes"
                class="theme-card"
                [class.selected]="settings.theme === theme.id"
                (click)="settings.theme = theme.id; applyTheme(); save()">
                <div class="theme-preview" [style.background]="theme.bg">
                  <div class="theme-preview-sidebar" [style.background]="theme.sidebar"></div>
                  <div class="theme-preview-content">
                    <div class="theme-preview-bar" [style.background]="theme.bar"></div>
                    <div class="theme-preview-cards">
                      <div [style.background]="theme.card"></div>
                      <div [style.background]="theme.card"></div>
                    </div>
                  </div>
                </div>
                <p class="theme-label">{{ theme.label }}</p>
                <mat-icon *ngIf="settings.theme === theme.id" class="theme-check">check_circle</mat-icon>
              </div>
            </div>
          </div>

          <div class="glass-card">
            <div class="setting-row">
              <div class="setting-left">
                <div class="setting-icon bg-teal"><mat-icon>view_compact</mat-icon></div>
                <div>
                  <p class="setting-title">Modo Compacto</p>
                  <p class="setting-desc">Reducir espacio entre elementos</p>
                </div>
              </div>
              <mat-slide-toggle [(ngModel)]="settings.compactMode" color="primary" (ngModelChange)="save()"></mat-slide-toggle>
            </div>
            <div class="divider"></div>
            <div class="setting-row">
              <div class="setting-left">
                <div class="setting-icon bg-violet"><mat-icon>text_fields</mat-icon></div>
                <div>
                  <p class="setting-title">Tamaño de Fuente</p>
                  <p class="setting-desc">Ajustar el tamaño del texto</p>
                </div>
              </div>
              <mat-select [(value)]="settings.fontSize" class="select-compact" (selectionChange)="save()">
                <mat-option value="small">Pequeño</mat-option>
                <mat-option value="medium">Mediano</mat-option>
                <mat-option value="large">Grande</mat-option>
              </mat-select>
            </div>
            <div class="divider"></div>
            <div class="setting-row">
              <div class="setting-left">
                <div class="setting-icon bg-pink"><mat-icon>palette</mat-icon></div>
                <div>
                  <p class="setting-title">Color de Acento</p>
                  <p class="setting-desc">Color principal de la interfaz</p>
                </div>
              </div>
              <div class="color-swatches">
                <button *ngFor="let c of accentColors"
                  (click)="settings.accentColor = c; save()"
                  class="color-swatch"
                  [style.background-color]="c"
                  [class.selected]="settings.accentColor === c">
                  <mat-icon *ngIf="settings.accentColor === c">check</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- ===== ACERCA DE ===== -->
        <section *ngIf="activeTab === 5" class="settings-section animate-in">
          <div class="section-header">
            <h3>Acerca de</h3>
            <p>Información de la aplicación</p>
          </div>

          <div class="glass-card about-card">
            <div class="about-hero">
              <div class="about-logo">
                <mat-icon>lungs</mat-icon>
              </div>
              <div>
                <h4>AsmaSync</h4>
                <p>Plataforma de Monitoreo de Asma</p>
                <span class="version-badge">v2.4.0 • Build 2026.02.13</span>
              </div>
            </div>

            <div class="divider"></div>

            <div class="about-details">
              <div class="about-row">
                <span>Licencia</span>
                <span>Uso Profesional / Educativo</span>
              </div>
              <div class="about-row">
                <span>Desarrollador</span>
                <span>AsmaSync Team</span>
              </div>
              <div class="about-row">
                <span>Soporte</span>
                <a>soporte&#64;asmasync.com</a>
              </div>
            </div>

            <div class="divider"></div>

            <div class="changelog">
              <h5 class="card-subtitle">Cambios Recientes</h5>
              <div class="changelog-item">
                <span class="cl-badge cl-new">NEW</span>
                <span>Generador de reportes PDF con drag & drop</span>
              </div>
              <div class="changelog-item">
                <span class="cl-badge cl-upd">UPD</span>
                <span>Dashboard con widgets estilo iOS</span>
              </div>
              <div class="changelog-item">
                <span class="cl-badge cl-fix">FIX</span>
                <span>Mejoras de rendimiento con OnPush</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Save Button -->
        <div class="save-bar" *ngIf="activeTab < 5">
          <button mat-raised-button color="primary" (click)="save()" class="save-btn">
            <mat-icon>save</mat-icon> Guardar Cambios
          </button>
        </div>

      </main>
    </div>
  `,
  styles: [`
    /* ============================================
       macOS-Style Settings Layout
       ============================================ */
    .settings-layout {
      display: flex;
      height: calc(100vh - 64px);
      background: #f1f5f9;
      overflow: hidden;
    }

    /* ===== Frosted Glass Sidebar ===== */
    .settings-sidebar {
      width: 260px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      padding: 20px 0;
      background: rgba(255,255,255,0.72);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border-right: 1px solid rgba(0,0,0,0.06);
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 20px 20px;
    }
    .sidebar-logo {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .sidebar-logo mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .sidebar-header h2 {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .sidebar-nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 0 8px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 10px;
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: left;
      width: 100%;
    }
    .nav-item:hover { background: rgba(0,0,0,0.04); color: #334155; }
    .nav-item.active {
      background: rgba(59,130,246,0.1);
      color: #2563eb;
      font-weight: 600;
    }
    .nav-item mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .sidebar-footer {
      padding: 16px 20px 0;
      border-top: 1px solid rgba(0,0,0,0.05);
    }
    .version-text {
      font-size: 11px;
      color: #94a3b8;
      margin: 0;
    }

    /* ===== Content Panel ===== */
    .settings-content {
      flex: 1;
      /* overflow and padding handled by .page-scroll-container */
    }

    .settings-section {
      max-width: 720px;
    }

    .section-header {
      margin-bottom: 20px;
    }
    .section-header h3 {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4px;
    }
    .section-header p {
      font-size: 14px;
      color: #94a3b8;
      margin: 0;
    }

    /* ===== Glass Card ===== */
    .glass-card {
      background: rgba(255,255,255,0.8);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.9);
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
      margin-bottom: 16px;
      overflow: hidden;
    }

    .card-subtitle {
      font-size: 12px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 16px 20px 8px;
      margin: 0;
    }

    /* ===== Setting Row ===== */
    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      gap: 12px;
    }
    .setting-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }
    .setting-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .setting-icon mat-icon { font-size: 18px; width: 18px; height: 18px; color: white; }
    .setting-icon.bg-blue { background: #3b82f6; }
    .setting-icon.bg-green { background: #22c55e; }
    .setting-icon.bg-red { background: #ef4444; }
    .setting-icon.bg-orange { background: #f97316; }
    .setting-icon.bg-amber { background: #f59e0b; }
    .setting-icon.bg-indigo { background: #6366f1; }
    .setting-icon.bg-violet { background: #8b5cf6; }
    .setting-icon.bg-pink { background: #ec4899; }
    .setting-icon.bg-teal { background: #14b8a6; }
    .setting-icon.bg-slate { background: #64748b; }

    .setting-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }
    .setting-desc {
      font-size: 12px;
      color: #94a3b8;
      margin: 2px 0 0;
    }

    .divider {
      height: 1px;
      background: rgba(0,0,0,0.04);
      margin: 0 20px;
    }

    .action-btn {
      font-size: 13px !important;
      border-radius: 8px !important;
    }

    .select-compact { width: 140px; }

    /* ===== Profile Card ===== */
    .profile-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }
    .profile-avatar {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #3b82f6, #06b6d4);
      color: white;
      font-size: 20px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .profile-info {
      flex: 1;
    }
    .profile-info h4 {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .profile-info p {
      font-size: 13px;
      color: #64748b;
      margin: 2px 0 6px;
    }
    .role-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 20px;
      background: rgba(59,130,246,0.1);
      color: #2563eb;
      font-size: 11px;
      font-weight: 600;
    }
    .edit-profile-btn {
      font-size: 13px !important;
      border-radius: 10px !important;
    }

    /* ===== Notification Channels ===== */
    .notification-channels {
      padding: 4px 0;
    }
    .channel-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
    }
    .channel-item + .channel-item {
      border-top: 1px solid rgba(0,0,0,0.03);
    }
    .channel-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .channel-icon mat-icon { color: #3b82f6; font-size: 20px; width: 20px; height: 20px; }
    .channel-info { flex: 1; }

    /* ===== IoT Devices Grid ===== */
    .devices-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }
    .device-card {
      padding: 20px;
    }
    .device-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .device-icon {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .device-icon mat-icon { font-size: 22px; width: 22px; height: 22px; color: white; }
    .device-icon.online { background: linear-gradient(135deg, #22c55e, #16a34a); }
    .device-icon.offline { background: linear-gradient(135deg, #94a3b8, #64748b); }
    .device-icon.warning { background: linear-gradient(135deg, #f59e0b, #d97706); }

    .device-status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-top: 4px;
    }
    .device-status-dot.dot-online {
      background: #22c55e;
      box-shadow: 0 0 0 3px rgba(34,197,94,0.2);
      animation: blink 2s ease-in-out infinite;
    }
    .device-status-dot.dot-offline {
      background: #94a3b8;
    }
    .device-status-dot.dot-warning {
      background: #f59e0b;
      box-shadow: 0 0 0 3px rgba(245,158,11,0.2);
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .device-name {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 2px;
    }
    .device-model {
      font-size: 12px;
      color: #94a3b8;
      margin: 0 0 12px;
    }
    .device-meta {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .device-meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #64748b;
    }
    .device-meta-item mat-icon { font-size: 14px; width: 14px; height: 14px; color: #94a3b8; }
    .battery-bar {
      width: 60px;
      height: 4px;
      border-radius: 2px;
    }
    ::ng-deep .battery-bar .mdc-linear-progress__bar-inner {
      border-radius: 2px;
    }
    .device-patient {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #3b82f6;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid rgba(0,0,0,0.04);
    }
    .device-patient mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .add-device {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 200px;
      border: 2px dashed rgba(0,0,0,0.08);
      background: transparent;
      color: #94a3b8;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .add-device:hover {
      border-color: #3b82f6;
      color: #3b82f6;
      background: rgba(59,130,246,0.03);
    }
    .add-device mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .add-device span { font-size: 14px; font-weight: 600; }

    /* ===== Sessions List ===== */
    .sessions-list {
      padding: 4px 0;
    }
    .session-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
    }
    .session-item + .session-item {
      border-top: 1px solid rgba(0,0,0,0.03);
    }
    .session-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .session-icon mat-icon { font-size: 18px; width: 18px; height: 18px; color: #64748b; }
    .session-info { flex: 1; }
    .current-badge {
      padding: 2px 10px;
      border-radius: 20px;
      background: rgba(34,197,94,0.1);
      color: #16a34a;
      font-size: 11px;
      font-weight: 600;
    }
    .session-close mat-icon { font-size: 16px; color: #94a3b8; }

    /* ===== Theme Selector ===== */
    .theme-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      padding: 8px 20px 20px;
    }
    .theme-card {
      position: relative;
      cursor: pointer;
      padding: 6px;
      border-radius: 14px;
      border: 2px solid transparent;
      transition: all 0.2s ease;
    }
    .theme-card:hover { border-color: rgba(59,130,246,0.3); }
    .theme-card.selected { border-color: #3b82f6; }
    .theme-preview {
      width: 100%;
      height: 72px;
      border-radius: 10px;
      overflow: hidden;
      display: flex;
    }
    .theme-preview-sidebar {
      width: 24%;
      height: 100%;
    }
    .theme-preview-content {
      flex: 1;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .theme-preview-bar {
      height: 6px;
      border-radius: 3px;
      width: 60%;
    }
    .theme-preview-cards {
      display: flex;
      gap: 4px;
      flex: 1;
    }
    .theme-preview-cards div {
      flex: 1;
      border-radius: 4px;
    }
    .theme-label {
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      margin: 8px 0 0;
    }
    .theme-check {
      position: absolute;
      top: -6px;
      right: -6px;
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #3b82f6;
      background: white;
      border-radius: 50%;
    }

    /* ===== Color Swatches ===== */
    .color-swatches {
      display: flex;
      gap: 8px;
    }
    .color-swatch {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    .color-swatch:hover { transform: scale(1.15); }
    .color-swatch.selected { border-color: rgba(0,0,0,0.2); transform: scale(1.15); }
    .color-swatch mat-icon { font-size: 14px; width: 14px; height: 14px; color: white; }

    /* ===== About Card ===== */
    .about-hero {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }
    .about-logo {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 12px rgba(6,182,212,0.3);
    }
    .about-logo mat-icon { font-size: 28px; width: 28px; height: 28px; }
    .about-hero h4 {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .about-hero p {
      font-size: 13px;
      color: #64748b;
      margin: 2px 0 4px;
    }
    .version-badge {
      font-size: 11px;
      color: #94a3b8;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 6px;
    }

    .about-details { padding: 8px 0; }
    .about-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 20px;
      font-size: 14px;
    }
    .about-row span:first-child { color: #64748b; }
    .about-row span:last-child, .about-row a { font-weight: 500; color: #1e293b; }
    .about-row a { color: #3b82f6; cursor: pointer; }

    .changelog { padding: 0 0 16px; }
    .changelog-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 20px;
      font-size: 13px;
      color: #475569;
    }
    .cl-badge {
      padding: 1px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .cl-new { background: #dcfce7; color: #16a34a; }
    .cl-upd { background: #dbeafe; color: #2563eb; }
    .cl-fix { background: #fef3c7; color: #d97706; }

    /* ===== Save Bar ===== */
    .save-bar {
      margin-top: 24px;
      display: flex;
      justify-content: flex-end;
    }
    .save-btn {
      padding: 0 24px !important;
      border-radius: 12px !important;
      height: 40px !important;
    }

    /* ===== Animation ===== */
    .animate-in {
      animation: slideIn 0.25s ease-out;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class SettingsComponent implements OnInit {
  activeTab = 0;

  tabs = [
    { icon: 'manage_accounts', label: 'Cuenta' },
    { icon: 'notifications', label: 'Notificaciones' },
    { icon: 'sensors', label: 'Dispositivos IoT' },
    { icon: 'shield', label: 'Seguridad' },
    { icon: 'palette', label: 'Apariencia' },
    { icon: 'info', label: 'Acerca de' }
  ];

  accentColors = ['#3b82f6', '#6366f1', '#ec4899', '#f97316', '#22c55e', '#06b6d4'];

  themes = [
    {
      id: 'light', label: 'Claro',
      bg: '#f1f5f9', sidebar: '#ffffff', bar: '#3b82f6', card: '#ffffff'
    },
    {
      id: 'dark', label: 'Oscuro',
      bg: '#0f172a', sidebar: '#1e293b', bar: '#3b82f6', card: '#334155'
    },
    {
      id: 'system', label: 'Sistema',
      bg: 'linear-gradient(135deg, #f1f5f9 50%, #0f172a 50%)',
      sidebar: 'linear-gradient(135deg, #ffffff 50%, #1e293b 50%)',
      bar: '#3b82f6',
      card: 'linear-gradient(135deg, #ffffff 50%, #334155 50%)'
    }
  ];

  iotDevices = [
    {
      name: 'Espirómetro SP-200',
      model: 'SpiroLink Pro',
      icon: 'air',
      battery: 85,
      lastSync: 'Hace 5 min',
      patient: 'Juan Pérez',
      statusClass: 'online',
      dotClass: 'dot-online'
    },
    {
      name: 'Inhalador Smart',
      model: 'BreathTrack v2',
      icon: 'medication',
      battery: 42,
      lastSync: 'Hace 1 hora',
      patient: 'Ana García',
      statusClass: 'warning',
      dotClass: 'dot-warning'
    },
    {
      name: 'Pulsioxímetro PX-10',
      model: 'OxiSense Mini',
      icon: 'monitor_heart',
      battery: 12,
      lastSync: 'Hace 2 días',
      patient: null,
      statusClass: 'offline',
      dotClass: 'dot-offline'
    }
  ];

  activeSessions = [
    { device: 'Windows • Chrome', location: 'San Luis Potosí', lastActive: 'Ahora', icon: 'laptop_windows', current: true },
    { device: 'iPhone 15 • Safari', location: 'San Luis Potosí', lastActive: 'Hace 2h', icon: 'phone_iphone', current: false },
    { device: 'iPad • Safari', location: 'Monterrey', lastActive: 'Ayer', icon: 'tablet', current: false }
  ];

  settings: any = {
    twoFactor: false,
    pushNotifications: true,
    emailAlerts: false,
    smsAlerts: false,
    alertSound: true,
    criticalOnly: false,
    alertFrequency: 'realtime',
    privacyMode: false,
    autoLock: 15,
    sessionTimeout: 12,
    theme: 'light',
    compactMode: false,
    fontSize: 'medium',
    accentColor: '#3b82f6'
  };

  isLoading = false;

  constructor(private snackBar: MatSnackBar, private storageService: StorageService) { }

  ngOnInit(): void {
    const saved = this.storageService.getItem('asmasync_settings');
    if (saved) {
      try { this.settings = { ...this.settings, ...JSON.parse(saved) }; } catch { }
    }
    this.applyTheme();
  }

  applyTheme(): void {
    if (this.settings.theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }

  save(): void {
    this.isLoading = true;

    // Save to encrypted storage
    this.storageService.setItem('asmasync_settings', this.settings);

    setTimeout(() => {
      this.isLoading = false;
      this.snackBar.open('Configuración guardada exitosamente', 'OK', {
        duration: 3000,
        panelClass: ['toast-success']
      });
    }, 800);
  }
}
