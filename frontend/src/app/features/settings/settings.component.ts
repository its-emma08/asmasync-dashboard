import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntil, debounceTime, distinctUntilChanged, catchError, take } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { throwError, Subject, of } from 'rxjs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { StorageService } from '../../core/services/storage.service';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { PatientService } from '../../core/services/patient.service';
import { EditProfileModalComponent } from './modals/edit-profile-modal.component';
import { ChangePasswordModalComponent } from './modals/change-password-modal.component';
import { TwoFactorModalComponent } from './modals/two-factor-modal.component';
import { User, UserSettings, AuditLog, UserSession, IoTDevice } from '../../core/models/settings.types';
import { ChangeDetectorRef } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatSlideToggleModule,
    MatButtonModule, MatIconModule, MatDividerModule, MatSelectModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule, MatProgressBarModule, MatProgressSpinnerModule,
    MatDialogModule, MatTableModule, MatTooltipModule
  ],
  template: `
    <div class="settings-layout">
      <!-- ======= SIDEBAR (Apple Glass) ======= -->
      <nav class="settings-sidebar glass-sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo-container">
            <div class="sidebar-logo shadow-apple">
              <mat-icon>respiratory_rate</mat-icon>
            </div>
          </div>
          <h2 class="dark:text-white">Ajustes</h2>
        </div>

        <div class="sidebar-nav">
          <button *ngFor="let tab of tabs; let i = index"
            (click)="setTab(i)"
            class="nav-item"
            [class.active]="activeTab === i">
            <div class="nav-icon-wrapper shadow-sm" [style.background-color]="getTabColor(i)">
              <mat-icon>{{ tab.icon }}</mat-icon>
            </div>
            <span>{{ tab.label }}</span>
          </button>
        </div>
      </nav>

      <!-- ======= CONTENT PANEL ======= -->
      <main class="settings-content page-scroll-container">
        <!-- ===== CUENTA ===== -->
        <section *ngIf="activeTab === 0" class="settings-section animate-in">
          <div class="section-header">
            <h3 class="dark:text-white">Cuenta</h3>
            <p>Administra tu perfil profesional y credenciales de acceso</p>
          </div>

          <!-- Profile Card -->
          <div class="glass-card-premium profile-card-apple mb-8">
            <div class="profile-avatar shadow-lg">{{ userInitials }}</div>
            <div class="profile-info-apple" *ngIf="currentUser">
              <h4 class="text-xl font-bold">{{ currentUser.full_name || 'Usuario' }}</h4>
              <p class="text-sm opacity-60">{{ currentUser.email }}</p>
              <div class="flex gap-2 mt-2 flex-wrap">
                <span class="apple-badge primary">{{ currentUser.role === 'admin' ? 'Administrador' : 'Médico' }}</span>
                <span class="apple-badge secondary">Especialista</span>
                <span class="apple-badge" *ngIf="currentUser.doctor_code"
                  style="background:rgba(0,122,255,0.12);color:#007AFF;font-family:monospace;letter-spacing:0.05em;cursor:pointer;"
                  title="Código para que tus pacientes te vinculen"
                  (click)="copyDoctorCode()">
                  <mat-icon style="font-size:13px;height:13px;width:13px;margin-right:3px;vertical-align:middle;">badge</mat-icon>
                  {{ currentUser.doctor_code }}
                </span>
              </div>
            </div>
            <div class="profile-actions-apple">
              <button mat-flat-button color="primary" class="apple-btn-pill" (click)="openEditProfile()">
                <mat-icon>edit</mat-icon> Editar Perfil
              </button>
            </div>
          </div>

          <!-- iOS-Style Security Group -->
          <div class="apple-group-label">Seguridad y Datos</div>
          <div class="glass-card-premium p-0 overflow-hidden mb-8">
            <div class="apple-list-row" (click)="openChangePassword()">
              <div class="apple-row-left">
                <div class="apple-icon-box bg-blue-500"><mat-icon>lock</mat-icon></div>
                <div class="apple-row-text">
                  <p class="apple-row-title">Contraseña</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-slate-400">Hace 30 días</span>
                <mat-icon class="apple-chevron">chevron_right</mat-icon>
              </div>
            </div>
            
            <div class="apple-list-divider"></div>
            
            <div class="apple-list-row">
              <div class="apple-row-left">
                <div class="apple-icon-box bg-green-500"><mat-icon>security</mat-icon></div>
                <div class="apple-row-text">
                  <p class="apple-row-title">Verificación en 2 pasos</p>
                </div>
              </div>
              <mat-slide-toggle [(ngModel)]="settings.twoFactor" color="primary" (ngModelChange)="toggle2FA()"></mat-slide-toggle>
            </div>

            <div class="apple-list-divider"></div>
            
            <div class="apple-list-row" (click)="exportData()">
              <div class="apple-row-left">
                <div class="apple-icon-box bg-orange-500"><mat-icon>download</mat-icon></div>
                <div class="apple-row-text">
                  <p class="apple-row-title">Exportar Datos (.json)</p>
                </div>
              </div>
              <mat-icon class="apple-chevron">file_download</mat-icon>
            </div>
          </div>
        </section>

        <!-- ===== NOTIFICACIONES ===== -->
        <section *ngIf="activeTab === 1" class="settings-section animate-in">
          <div class="section-header">
            <h3 class="dark:text-white">Notificaciones</h3>
            <p>Elige cómo quieres recibir las actualizaciones críticas</p>
          </div>

          <div class="glass-card-premium p-0 mb-6">
            <div class="apple-list-row">
              <div class="apple-row-left">
                <div class="apple-icon-box bg-blue"><mat-icon>notifications</mat-icon></div>
                <div class="apple-row-text">
                  <p class="apple-row-title">Notificaciones Push</p>
                  <p class="apple-row-desc">Alertas instantáneas en el navegador</p>
                </div>
              </div>
              <mat-slide-toggle [(ngModel)]="settings.pushNotifications" color="primary" (ngModelChange)="markDirty()"></mat-slide-toggle>
            </div>
            <div class="apple-list-divider"></div>
            <div class="apple-list-row">
              <div class="apple-row-left">
                <div class="apple-icon-box bg-indigo"><mat-icon>email</mat-icon></div>
                <div class="apple-row-text">
                  <p class="apple-row-title">Alertas por Correo</p>
                  <p class="apple-row-desc">Resúmenes diarios y semanales</p>
                </div>
              </div>
              <mat-slide-toggle [(ngModel)]="settings.emailAlerts" color="primary" (ngModelChange)="markDirty()"></mat-slide-toggle>
            </div>
            <div class="apple-list-divider"></div>
            <div class="apple-list-row">
              <div class="apple-row-left">
                <div class="apple-icon-box bg-teal"><mat-icon>sms</mat-icon></div>
                <div class="apple-row-text">
                  <p class="apple-row-title">Mensajes SMS</p>
                  <p class="apple-row-desc">Solo para situaciones de emergencia</p>
                </div>
              </div>
              <mat-slide-toggle [(ngModel)]="settings.smsAlerts" color="primary" (ngModelChange)="markDirty()"></mat-slide-toggle>
            </div>
          </div>

          <div class="glass-card-premium p-0">
             <div class="apple-list-row">
              <div class="apple-row-left">
                <div class="apple-icon-box bg-amber"><mat-icon>volume_up</mat-icon></div>
                <div class="apple-row-text">
                  <p class="apple-row-title">Sonido de alta prioridad</p>
                  <p class="apple-row-desc">Activar audio para niveles críticos</p>
                </div>
              </div>
              <mat-slide-toggle [(ngModel)]="settings.alertSound" color="primary" (ngModelChange)="markDirty()"></mat-slide-toggle>
            </div>
            <div class="apple-list-divider"></div>
            <div class="apple-list-row">
              <div class="apple-row-left">
                <div class="apple-icon-box bg-red"><mat-icon>priority_high</mat-icon></div>
                <div class="apple-row-text">
                  <p class="apple-row-title">Solo Críticas</p>
                  <p class="apple-row-desc">Ignorar niveles verde y amarillo</p>
                </div>
              </div>
              <mat-slide-toggle [(ngModel)]="settings.criticalOnly" color="primary" (ngModelChange)="markDirty()"></mat-slide-toggle>
            </div>
          </div>
        </section>

        <!-- ===== DISPOSITIVOS IoT ===== -->
        <section *ngIf="activeTab === 2" class="settings-section animate-in">
          <div class="section-header">
            <h3 class="dark:text-white">Dispositivos Médicos</h3>
            <p>Estado de la red de monitoreo IoT</p>
          </div>

          <!-- Loading state -->
          <div *ngIf="isDevicesLoading" class="flex items-center justify-center p-12">
            <mat-spinner diameter="32"></mat-spinner>
          </div>

          <div class="devices-grid-apple" *ngIf="!isDevicesLoading">
            <div *ngFor="let device of iotDevices" class="glass-card-premium device-card-apple">
              <div class="device-header-apple">
                <div class="device-icon-apple" [class]="device.statusClass">
                  <mat-icon>{{ device.icon }}</mat-icon>
                </div>
                <div class="status-indicator">
                   <div class="status-dot-apple" [class]="device.dotClass"></div>
                   <span>{{ device.status }}</span>
                </div>
              </div>
              <h4>{{ device.name }}</h4>
              <p class="device-model-apple">{{ device.model }}</p>

              <div class="device-metrics-apple">
                <div class="metric-item">
                  <mat-icon>battery_charging_full</mat-icon>
                  <span>{{ device.battery }}%</span>
                </div>
                <div class="metric-item">
                  <mat-icon>history</mat-icon>
                  <span>{{ device.lastSync }}</span>
                </div>
              </div>

              <div class="patient-tag-apple" *ngIf="device.patient">
                <mat-icon>person</mat-icon>
                <span>{{ device.patient }}</span>
              </div>
            </div>

            <!-- Empty state when no devices -->
            <div *ngIf="iotDevices.length === 0" class="glass-card-premium iot-empty-state">
              <div class="iot-empty-icon">
                <mat-icon>sensors_off</mat-icon>
              </div>
              <h4>Sin dispositivos vinculados</h4>
              <p>Los sensores se sincronizan automáticamente cuando un paciente conecta su dispositivo desde la app móvil.</p>
              <div *ngIf="connectedPatientsCount > 0" class="iot-patient-count">
                <mat-icon>groups</mat-icon>
                <span>{{ connectedPatientsCount }} paciente(s) con datos activos</span>
              </div>
            </div>

            <!-- Add Device -->
            <button class="glass-card-premium add-device-apple" routerLink="/onboarding/iot-connection">
              <div class="add-icon-apple">
                <mat-icon>add</mat-icon>
              </div>
              <span>Vincular nuevo hardware</span>
            </button>
          </div>
        </section>

        <!-- ===== SEGURIDAD ===== -->
        <section *ngIf="activeTab === 3" class="settings-section animate-in">
           <div class="section-header">
            <h3 class="dark:text-white">Privacidad y Seguridad</h3>
            <p>Control de acceso y cifrado de datos (NOM-004)</p>
          </div>

          <div class="glass-card-premium p-0 mb-6">
            <div class="apple-list-row">
              <div class="apple-row-left">
                <div class="apple-icon-box bg-slate"><mat-icon>visibility_off</mat-icon></div>
                <div class="apple-row-text">
                  <p class="apple-row-title">Ocultar datos sensibles</p>
                  <p class="apple-row-desc">Pseudonimización automática en el dashboard</p>
                </div>
              </div>
              <mat-slide-toggle [(ngModel)]="settings.privacyMode" color="primary" (ngModelChange)="markDirty()"></mat-slide-toggle>
            </div>
            <div class="apple-list-divider"></div>
            <div class="apple-list-row">
              <div class="apple-row-left">
                <div class="apple-icon-box bg-blue"><mat-icon>lock_clock</mat-icon></div>
                <div class="apple-row-text">
                  <p class="apple-row-title">Cerrar sesión inactiva</p>
                  <p class="apple-row-desc">Bloqueo tras periodo de inactividad</p>
                </div>
              </div>
              <mat-select [(value)]="settings.autoLock" class="apple-select" (selectionChange)="markDirty()">
                <mat-option [value]="5">5 minutos</mat-option>
                <mat-option [value]="15">15 minutos</mat-option>
                <mat-option [value]="0">Nunca</mat-option>
              </mat-select>
            </div>
          </div>

          <div class="apple-group-label">Dispositivos y Sesiones Activas</div>
          <div class="glass-card-premium p-0 overflow-hidden">
            <div *ngFor="let session of activeSessions" class="apple-list-row">
              <div class="apple-row-left">
                <div class="apple-icon-box bg-slate"><mat-icon>{{ session.icon }}</mat-icon></div>
                <div class="apple-row-text">
                  <p class="apple-row-title">
                    {{ session.device }}
                    <span *ngIf="session.current" class="apple-badge primary" style="margin-left: 8px;">Actual</span>
                  </p>
                  <p class="apple-row-desc">{{ session.location }} • Activo: {{ session.lastActive }}</p>
                </div>
              </div>
              <button *ngIf="!session.current" mat-icon-button color="warn" (click)="revokeSession(session)" matTooltip="Revocar sesión">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        </section>

        <!-- ===== APARIENCIA ===== -->
        <section *ngIf="activeTab === 4" class="settings-section animate-in">
          <div class="section-header">
            <h3 class="dark:text-white">Estilo Visual</h3>
            <p>Personaliza la atmósfera de tu estación de trabajo</p>
          </div>

          <div class="glass-card-premium p-0">
            <div class="apple-list-row">
              <div class="apple-row-left">
                <div class="apple-icon-box bg-blue"><mat-icon>brightness_4</mat-icon></div>
                <div class="apple-row-text">
                  <p class="apple-row-title">Tema de la aplicación</p>
                  <p class="apple-row-desc">Apariencia visual de la interfaz</p>
                </div>
              </div>
              <div class="flex gap-4">
                <button *ngFor="let t of themes" 
                        class="apple-theme-card-btn" 
                        [class.active]="settings.theme === t.id"
                        (click)="changeTheme(t.id)">
                  <div class="theme-preview-box shadow-sm" [style.background]="t.bg">
                    <div class="preview-sidebar" [style.background]="t.sidebar"></div>
                    <div class="preview-content">
                      <div class="preview-bar" [style.background]="t.bar"></div>
                      <div class="preview-card" [style.background]="t.card"></div>
                    </div>
                  </div>
                  <span class="theme-label">{{ t.label }}</span>
                </button>
              </div>
            </div>
            <div class="apple-list-divider"></div>
             <div class="apple-list-row">
              <div class="apple-row-left">
                <div class="apple-icon-box bg-teal"><mat-icon>view_compact</mat-icon></div>
                <div class="apple-row-text">
                  <p class="apple-row-title">Diseño de alta densidad</p>
                  <p class="apple-row-desc">Optimiza el espacio para pantallas grandes</p>
                </div>
              </div>
              <mat-slide-toggle [(ngModel)]="settings.compactMode" color="primary" (ngModelChange)="markDirty()"></mat-slide-toggle>
            </div>
            <div class="apple-list-divider"></div>
            <div class="apple-list-row">
              <div class="apple-row-left">
                <div class="apple-icon-box bg-indigo"><mat-icon>palette</mat-icon></div>
                <div class="apple-row-text">
                  <p class="apple-row-title">Color de énfasis</p>
                  <p class="apple-row-desc">Personalizar tonos del sistema</p>
                </div>
              </div>
              <div class="apple-color-picker">
                <button *ngFor="let c of accentColors"
                  (click)="settings.accentColor = c; markDirty()"
                  class="apple-color-dot"
                  [style.background-color]="c"
                  [class.active]="settings.accentColor === c">
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- ===== ACERCA DE ===== -->
        <section *ngIf="activeTab === 5" class="settings-section animate-in">
          <div class="section-header mt-4">
            <h3 class="dark:text-white">Acerca de</h3>
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

        <!-- ===== AUDITORÍA ===== -->
        <section *ngIf="activeTab === 6" class="settings-section animate-in">
           <div class="section-header flex justify-between items-end">
            <div>
              <h3 class="dark:text-white">Bitácora Médica</h3>
              <p>Historial inalterable de actividad (Auditoría HIPAA/NOM)</p>
            </div>
            <button mat-stroked-button (click)="loadAuditLogs()" class="apple-btn-secondary">
              <mat-icon>refresh</mat-icon> Sincronizar
            </button>
          </div>

          <div class="glass-card-premium mt-6 overflow-hidden">
             <div class="p-4 border-b border-white/20 bg-white/10">
                <div class="apple-search-box">
                  <mat-icon>search</mat-icon>
                  <input type="text" placeholder="Filtrar eventos..." (input)="onAuditSearch($event)">
                </div>
             </div>
             
             <div class="audit-table-container">
               <table mat-table [dataSource]="filteredAuditLogs" class="apple-table">
                  <ng-container matColumnDef="fecha">
                    <th mat-header-cell *matHeaderCellDef> FECHA </th>
                    <td mat-cell *matCellDef="let log"> 
                      <div class="font-semibold">{{ log.created_at | date:'dd MMM, yyyy' }}</div>
                      <div class="text-[10px] opacity-60">{{ log.created_at | date:'HH:mm' }}</div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="evento">
                    <th mat-header-cell *matHeaderCellDef> ACCIÓN </th>
                    <td mat-cell *matCellDef="let log"> 
                      <span class="apple-status-pill" [class]="log.action.toLowerCase()">
                        {{ log.action }}
                      </span>
                    </td>
                  </ng-container>

                   <ng-container matColumnDef="ip">
                    <th mat-header-cell *matHeaderCellDef> ORIGEN </th>
                    <td mat-cell *matCellDef="let log" class="font-mono text-[11px]"> {{ log.ip_address }} </td>
                  </ng-container>

                  <ng-container matColumnDef="detalles">
                    <th mat-header-cell *matHeaderCellDef> DETALLES </th>
                    <td mat-cell *matCellDef="let log" class="text-[11px] opacity-70"> {{ log.user_agent }} </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="['fecha', 'evento', 'ip', 'detalles']"></tr>
                  <tr mat-row *matRowDef="let row; columns: ['fecha', 'evento', 'ip', 'detalles'];"></tr>
               </table>
               
               <div *ngIf="isLogsLoading" class="p-12 flex flex-col items-center">
                  <mat-spinner diameter="30"></mat-spinner>
                  <p class="mt-4 text-sm opacity-50">Validando registros...</p>
               </div>

               <div *ngIf="!isLogsLoading && filteredAuditLogs.length === 0" class="p-10 text-center text-sm opacity-70">
                  {{ auditUnavailable ? 'La bitácora de auditoría no está disponible en la API actual.' : 'Sin eventos para mostrar.' }}
               </div>
             </div>
          </div>
        </section>

        <!-- ===== FOOTER SAVE (Floating) ===== -->
        <div class="save-bar-apple" *ngIf="isDirty">
          <div class="save-bar-inner glass-card-premium">
            <p>Cuentas con cambios sin guardar</p>
            <button mat-flat-button color="primary" class="apple-btn-pill" (click)="save()" [disabled]="isLoading">
              <mat-icon *ngIf="!isLoading">save</mat-icon>
              <mat-spinner *ngIf="isLoading" diameter="18" class="mr-2"></mat-spinner>
              Guardar Configuración
            </button>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    /* ============================================
       Clinical Clean: Apple System Design
       ============================================ */
    .settings-layout {
      display: flex;
      height: 100%;
      min-height: 0;
      background: #F2F2F7;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      overflow: hidden;
    }

    .dark .settings-layout {
      background: #000000;
    }

    /* ===== Minimal Sidebar ===== */
    .glass-sidebar {
      width: 260px;
      flex-shrink: 0;
      background: rgba(246, 246, 246, 0.8) !important;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-right: 1px solid rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      padding: 24px 0;
    }

    .dark .glass-sidebar {
      background: rgba(28, 28, 30, 0.8) !important;
      border-right: 1px solid rgba(255,255,255,0.1);
    }

    .sidebar-header {
      padding: 0 20px 24px;
    }

    .sidebar-header h2 {
      font-size: 22px;
      font-weight: 700;
      margin: 0;
      color: #000;
    }
    .dark .sidebar-header h2 { color: #fff; }

    .sidebar-nav {
      flex: 1;
      padding: 0 10px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: #3a3a3c;
      font-size: 13.5px;
      font-weight: 400;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s ease;
    }

    .dark .nav-item { color: #d1d1d6; }

    .nav-item:hover { background: rgba(0,0,0,0.05); }
    .dark .nav-item:hover { background: rgba(255,255,255,0.05); }

    .nav-item.active {
      background: #007AFF;
      color: white;
      font-weight: 500;
      box-shadow: 0 4px 10px rgba(0, 122, 255, 0.2);
    }

    .nav-icon-wrapper {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    
    .nav-item.active .nav-icon-wrapper { background: transparent !important; }

    /* ===== Main Content Area ===== */
    .settings-content {
      flex: 1;
      padding: 40px 60px;
      overflow-y: auto;
    }

    .settings-section {
      max-width: 720px;
      margin: 0 auto;
    }

    .section-header {
      margin-bottom: 30px;
    }

    .section-header h3 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 4px;
      color: #000;
    }
    .dark .section-header h3 { color: #fff; }

    .section-header p {
      font-size: 13px;
      color: #8e8e93;
      margin: 0;
    }

    /* ===== Apple List Grouping ===== */
    .apple-group-label {
      font-size: 12px;
      color: #8e8e93;
      text-transform: uppercase;
      margin: 24px 0 8px 14px;
      letter-spacing: 0.05em;
    }

    .glass-card-premium {
      background: #fff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      margin-bottom: 20px;
      border: 1px solid rgba(0,0,0,0.05);
    }

    .dark .glass-card-premium {
      background: #1c1c1e;
      border: 1px solid rgba(255,255,255,0.05);
    }

    .apple-list-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      cursor: pointer;
      background: white;
    }

    .dark .apple-list-row { background: #1c1c1e; }

    .apple-list-row:hover { background: rgba(0,0,0,0.02); }
    .dark .apple-list-row:hover { background: rgba(255,255,255,0.02); }

    .apple-row-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .apple-icon-box {
      width: 30px;
      height: 30px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .apple-row-title {
      font-size: 15px;
      color: #000;
      font-weight: 400;
    }
    .dark .apple-row-title { color: #fff; }

    .apple-row-desc {
      font-size: 12px;
      color: #8e8e93;
    }

    .apple-list-divider {
      height: 0.5px;
      background: rgba(0,0,0,0.1);
      margin-left: 60px;
    }
    .dark .apple-list-divider { background: rgba(255,255,255,0.1); }

    /* ===== Profile Card ===== */
    .profile-card-apple {
      display: flex;
      align-items: center;
      padding: 20px;
      gap: 16px;
    }

    .profile-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #8e8e93;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 600;
    }

    .profile-info-apple h4 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .apple-badge {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 4px;
      background: rgba(0,0,0,0.05);
      color: #8e8e93;
      text-transform: uppercase;
      font-weight: 700;
      margin-top: 4px;
      display: inline-block;
    }

    /* ===== Save Footer (Floating Pill) ===== */
    .save-bar-apple {
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
    }

    .save-bar-inner {
      background: rgba(255, 255, 255, 0.8) !important;
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      padding: 10px 24px;
      border-radius: 40px;
      border: 1px solid rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    .dark .save-bar-inner {
      background: rgba(44, 44, 46, 0.8) !important;
      border: 1px solid rgba(255,255,255,0.1);
    }

    .save-bar-inner p {
      font-size: 13px;
      font-weight: 500;
      color: #000;
      margin: 0;
    }
    .dark .save-bar-inner p { color: #fff; }

    .apple-btn-pill {
      background: #007AFF !important;
      color: white !important;
      border-radius: 20px !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      padding: 0 16px !important;
      height: 32px !important;
      line-height: 32px !important;
    }

    /* ===== Animations ===== */
    .animate-in {
      animation: apple-fade 0.4s ease-out;
    }
    @keyframes apple-fade {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ===== IoT Empty State ===== */
    .iot-empty-state {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 40px 24px;
      border: 1.5px dashed rgba(0,0,0,0.12) !important;
      background: transparent !important;
      box-shadow: none !important;
    }
    .dark .iot-empty-state { border-color: rgba(255,255,255,0.1) !important; }

    .iot-empty-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: #f2f2f7;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      mat-icon { font-size: 28px; width: 28px; height: 28px; color: #8e8e93; }
    }
    .dark .iot-empty-icon { background: #2c2c2e; }

    .iot-empty-state h4 {
      font-size: 15px;
      font-weight: 600;
      color: #000;
      margin: 0 0 6px;
    }
    .dark .iot-empty-state h4 { color: #fff; }

    .iot-empty-state p {
      font-size: 12px;
      color: #8e8e93;
      max-width: 260px;
      line-height: 1.5;
    }

    .iot-patient-count {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 12px;
      padding: 6px 14px;
      border-radius: 20px;
      background: #e8f5e9;
      color: #2e7d32;
      font-size: 12px;
      font-weight: 600;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    .apple-theme-card-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      background: transparent;
      border: none;
      padding: 0;
      cursor: pointer;
      color: #3a3a3c;
      transition: all 0.2s ease;
      outline: none;
    }
    .dark .apple-theme-card-btn {
      color: #d1d1d6;
    }
    
    .theme-preview-box {
      width: 72px;
      height: 48px;
      border-radius: 8px;
      border: 2px solid rgba(0,0,0,0.1);
      overflow: hidden;
      display: flex;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }
    .dark .theme-preview-box {
      border-color: rgba(255,255,255,0.1);
    }
    
    .apple-theme-card-btn.active .theme-preview-box {
      border-color: var(--brand-primary);
      box-shadow: 0 0 0 1.5px var(--brand-primary);
      transform: scale(1.04);
    }
    
    .preview-sidebar {
      width: 18px;
      height: 100%;
      border-right: 1px solid rgba(0,0,0,0.06);
    }
    .dark .preview-sidebar {
      border-right-color: rgba(255,255,255,0.06);
    }
    
    .preview-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 4px;
      gap: 3px;
    }
    
    .preview-bar {
      height: 4px;
      border-radius: 2px;
      width: 65%;
    }
    
    .preview-card {
      flex: 1;
      border-radius: 3px;
      border: 1px solid rgba(0,0,0,0.04);
    }
    .dark .preview-card {
      border-color: rgba(255,255,255,0.04);
    }
    
    .theme-label {
      font-size: 11px;
      font-weight: 500;
      transition: color 0.2s ease;
    }
    
    .apple-theme-card-btn.active .theme-label {
      color: var(--brand-primary);
      font-weight: 600;
    }
    
    /* ===== Accent Color Picker ===== */
    .apple-color-picker {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 4px 0;
    }

    .apple-color-dot {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 0 1px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1);
      cursor: pointer;
      padding: 0;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      outline: none;
    }

    .apple-color-dot:hover {
      transform: scale(1.15);
      box-shadow: 0 0 0 1px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.15);
    }

    .apple-color-dot.active {
      transform: scale(1.1);
      box-shadow: 0 0 0 2px var(--brand-primary), 0 0 0 4px white, 0 4px 8px rgba(0,0,0,0.2);
    }
    
    .dark .apple-color-dot {
      border-color: #1c1c1e;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.2);
    }
    
    .dark .apple-color-dot.active {
      box-shadow: 0 0 0 2px var(--brand-primary), 0 0 0 4px #1c1c1e, 0 4px 8px rgba(0,0,0,0.4);
    }

    /* ===== Colors ===== */
    .bg-blue { background: #007AFF !important; }
    .bg-orange { background: #FF9500 !important; }
    .bg-green { background: #34C759 !important; }
    .bg-red { background: #FF3B30 !important; }
    .bg-indigo { background: #5856D6 !important; }
    .bg-teal { background: #30B0C7 !important; }
    .bg-amber { background: #FFCC00 !important; }
    .bg-slate { background: #8E8E93 !important; }
  `]
})
export class SettingsComponent implements OnInit, OnDestroy {

  getTabColor(index: number): string {
    const colors = [
      '#0071e3',
      '#FF9500',
      '#34C759',
      '#FF3B30',
      '#5856D6',
      '#8E8E93',
      '#000000'
    ];
    return colors[index] || '#0071e3';
  }

  activeTab = 0;
  currentUser: User | null = null;
  userInitials: string = 'U';

  tabs = [
    { icon: 'manage_accounts', label: 'Cuenta' },
    { icon: 'notifications', label: 'Notificaciones' },
    { icon: 'sensors', label: 'Dispositivos IoT' },
    { icon: 'shield', label: 'Seguridad' },
    { icon: 'palette', label: 'Apariencia' },
    { icon: 'info', label: 'Acerca de' },
    { icon: 'history', label: 'Auditoría' }
  ];

  accentColors = ['#3b82f6', '#6366f1', '#ec4899', '#f97316', '#22c55e', '#06b6d4'];

  themes: Array<{
    id: 'light' | 'dark' | 'system';
    label: string;
    bg: string;
    sidebar: string;
    bar: string;
    card: string;
  }> = [
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

  iotDevices: IoTDevice[] = [];

  activeSessions: UserSession[] = [
    { device: 'Windows • Chrome', location: 'San Luis Potosí', lastActive: 'Ahora', icon: 'laptop_windows', current: true },
    { device: 'iPhone 15 • Safari', location: 'San Luis Potosí', lastActive: 'Hace 2h', icon: 'phone_iphone', current: false },
    { device: 'iPad • Safari', location: 'Monterrey', lastActive: 'Ayer', icon: 'tablet', current: false }
  ];

  settings: UserSettings = {
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
  isDirty = false;
  isLogsLoading = false;
  isDevicesLoading = false;
  connectedPatientsCount = 0;
  auditUnavailable = false;
  auditLogs: AuditLog[] = [];
  filteredAuditLogs: AuditLog[] = [];
  auditSearch$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private snackBar: MatSnackBar,
    private storageService: StorageService,
    private authService: AuthService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private patientService: PatientService,
    private http: HttpClient,
    private themeService: ThemeService
  ) { }

  ngOnInit(): void {
    this.settings.theme = this.themeService.getTheme();
    this.authService.fetchCurrentUser().pipe(take(1)).subscribe({
      next: (user: User) => {
        queueMicrotask(() => {
          this.currentUser = user;
          this.updateInitials();
          // Sincronizar el toggle 2FA desde el flag real del usuario
          if (user.is_2fa_enabled !== undefined) {
            this.settings.twoFactor = user.is_2fa_enabled;
          }
          this.cdr.markForCheck();
        });

        // Cargar ajustes desde el endpoint dedicado de Pablo
        this.authService.fetchSettings().pipe(take(1)).subscribe({
          next: (settings) => {
            if (settings) {
              this.settings = { ...this.settings, ...settings };
            }
            // Re-aplicar el estado 2FA desde Supabase (tiene prioridad sobre Pablo's API)
            if (user.is_2fa_enabled !== undefined) {
              this.settings.twoFactor = user.is_2fa_enabled;
            }
            queueMicrotask(() => {
              this.applyThemeSettings();
              this.cdr.markForCheck();
            });
          },
          error: () => {
             // Fallback a local storage si el endpoint falla
             const saved = this.storageService.getItem('asmasync_settings');
             if (saved) {
               try { this.settings = { ...this.settings, ...JSON.parse(saved) }; } catch { }
             }
             // Re-aplicar el estado 2FA desde Supabase
             if (user.is_2fa_enabled !== undefined) {
               this.settings.twoFactor = user.is_2fa_enabled;
             }
             queueMicrotask(() => {
               this.applyThemeSettings();
               this.cdr.markForCheck();
             });
          }
        });
      },
      error: () => { }
    });

    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      queueMicrotask(() => {
        if (user) {
          this.currentUser = user;
          this.updateInitials();
        }
        this.cdr.markForCheck();
      });
    });

    this.auditSearch$.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((term: string) => {
      if (!term) {
        this.filteredAuditLogs = [...this.auditLogs];
      } else {
        const lower = term.toLowerCase();
        this.filteredAuditLogs = this.auditLogs.filter(log =>
          log.action.toLowerCase().includes(lower) ||
          (log.ip_address && log.ip_address.includes(lower)) ||
          log.entity.toLowerCase().includes(lower) ||
          (log.user_agent && log.user_agent.toLowerCase().includes(lower))
        );
      }
    });

    // Settings initially loaded in fetchCurrentUser above

    // Auto load logs if we land on tab 6 immediately (mostly for hard refreshes if we persisted the tab state later, but safe to just have it triggered on click via template getter or ngDoCheck/Set method).
    // The easiest robust way is checking the setter of activeTab. We'll use a getter/setter for activeTab or just fetch when the tab changes from the UI.
  }

  setTab(index: number) {
    this.activeTab = index;
    if (index === 6) {
      this.loadAuditLogs();
    }
    if (index === 2) {
      this.loadIoTStatus();
    }
  }

  loadIoTStatus(): void {
    this.isDevicesLoading = true;
    this.cdr.markForCheck();

    this.http.get<any[]>(`${environment.apiUrl}/devices`).pipe(
      catchError(() => of([])),
      takeUntil(this.destroy$)
    ).subscribe(devices => {
      this.iotDevices = (devices || []).map(d => ({
        id: String(d.id),
        name: [d.device_brand, d.device_model].filter(Boolean).join(' ') || d.device_type,
        model: d.device_model || d.device_type,
        status: d.is_active ? 'online' : 'offline',
        battery: 0,
        lastSync: d.created_at ? new Date(d.created_at).toLocaleDateString('es-MX') : '—',
        icon: d.device_type?.includes('watch') ? 'watch' : d.device_type?.includes('spirometer') ? 'air' : 'sensors',
        statusClass: d.is_active ? 'online' : 'offline',
        dotClass: d.is_active ? 'dot-online' : 'dot-offline'
      } as IoTDevice));
      this.isDevicesLoading = false;
      this.cdr.markForCheck();
    });

    this.patientService.getAllPatients().pipe(
      catchError(() => of([])),
      takeUntil(this.destroy$)
    ).subscribe(patients => {
      this.connectedPatientsCount = patients.filter(p => p.latest_pef && p.latest_pef > 0).length;
      this.cdr.markForCheck();
    });
  }

  loadAuditLogs() {
    // Force to next cycle to avoid NG0100: ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
        this.isLogsLoading = true;
        this.cdr.detectChanges();
    });
    this.authService.getAuditLogs().pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        console.error('Audit log fetch error:', err);
        return throwError(() => err);
      })
    ).subscribe({
      next: (logs: any) => {
        const auditLogs = Array.isArray(logs) ? logs : [];
        this.auditLogs = auditLogs;
        this.filteredAuditLogs = [...auditLogs];
        this.auditUnavailable = auditLogs.length === 0;
        this.isLogsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.auditLogs = [];
        this.filteredAuditLogs = [];
        this.auditUnavailable = true;
        this.isLogsLoading = false;
        this.snackBar.open('Error al cargar la auditoría', 'OK', { duration: 3000 });
        this.cdr.markForCheck();
      }
    });

    // Fallback timer: absolutely force loading off after 5s
    setTimeout(() => {
      if (this.isLogsLoading) {
        this.isLogsLoading = false;
        if (this.auditLogs.length === 0) {
          this.snackBar.open('Servidor de auditoría no responde (Timeout)', 'Cerrar', { duration: 3000 });
        }
        this.cdr.markForCheck();
      }
    }, 5000);
  }

  save(): void {
    this.isLoading = true;

    // 1. Local Save
    this.storageService.setItem('asmasync_settings', this.settings);

    // 2. Backend Save (Persistence)
    this.authService.updateSettings(this.settings).pipe(take(1)).subscribe({
      next: () => {
        this.isLoading = false;
        this.isDirty = false;
        this.applyThemeSettings();
        this.cdr.markForCheck();
        this.snackBar.open('Configuración sincronizada en la nube', 'OK', {
          duration: 3000,
          panelClass: ['toast-success']
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.snackBar.open('Guardado local aplicado. La API no permitió sincronizar en este momento.', 'OK', { duration: 5000 });
        console.error('Settings Sync Error:', err);
      }
    });
  }

  copyDoctorCode(): void {
    const code = this.currentUser?.doctor_code;
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      this.snackBar.open('Código copiado al portapapeles', '', { duration: 2000 });
    });
  }

  updateInitials(): void {
    if (!this.currentUser || !this.currentUser.full_name) {
      this.userInitials = 'U';
      return;
    }
    const parts = this.currentUser.full_name.split(' ');
    if (parts.length > 1) {
      this.userInitials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
      this.userInitials = parts[0][0].toUpperCase();
    }
  }

  openEditProfile(): void {
    if (!this.currentUser) return;
    const dialogRef = this.dialog.open(EditProfileModalComponent, {
      width: '100vw',
      maxWidth: '500px',
      data: { user: this.currentUser },
      panelClass: 'glass-dialog',
      backdropClass: 'glass-backdrop'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Perfil actualizado exitosamente', 'OK', {
          duration: 3000,
          panelClass: ['toast-success']
        });
      }
    });
  }

  openChangePassword(): void {
    this.dialog.open(ChangePasswordModalComponent, {
      width: '100vw',
      maxWidth: '500px',
      panelClass: 'glass-dialog',
      backdropClass: 'glass-backdrop'
    });
  }

  toggle2FA(): void {
    if (this.settings.twoFactor) {
      const dialogRef = this.dialog.open(TwoFactorModalComponent, {
        width: '100vw',
        maxWidth: '480px',
        disableClose: true,
        data: { mode: 'setup' },
        panelClass: 'glass-dialog',
        backdropClass: 'glass-backdrop'
      });

      dialogRef.afterClosed().subscribe(result => {
        if (!result) {
          // El usuario canceló o le dio a la equis
          this.settings.twoFactor = false;
          this.cdr.markForCheck();
        } else {
          // Se activó correctamente
          this.save();
        }
      });
    } else {
      // Flujo de apagado
      const dialogRef = this.dialog.open(TwoFactorModalComponent, {
        width: '100vw',
        maxWidth: '480px',
        disableClose: true,
        data: { mode: 'disable' },
        panelClass: 'glass-dialog',
        backdropClass: 'glass-backdrop'
      });

      dialogRef.afterClosed().subscribe(result => {
        if (!result) {
          // Rollback si canceló desactivación
          this.settings.twoFactor = true;
          this.cdr.markForCheck();
        } else {
          // Se desactivó correctamente
          this.save();
        }
      });
    }
  }

  changeTheme(themeId: 'light' | 'dark' | 'system'): void {
    this.settings.theme = themeId;
    this.markDirty();
  }

  revokeSession(session: UserSession): void {
    this.activeSessions = this.activeSessions.filter(s => s !== session);
    this.snackBar.open('Sesión revocada correctamente', 'OK', { duration: 3000 });
    this.cdr.markForCheck();
  }

  exportData(): void {
    this.isLoading = true;

    const exportPayload = {
      timestamp: new Date().toISOString(),
      user: this.currentUser,
      settings: this.settings,
      devices: this.iotDevices,
      patientsWithActiveData: this.connectedPatientsCount
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `asmasync_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    setTimeout(() => {
      this.isLoading = false;
      this.snackBar.open('Datos exportados exitosamente (.json)', 'OK', {
        duration: 4000,
        panelClass: ['toast-success']
      });
    }, 600);
  }

  onAuditSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.auditSearch$.next(input.value);
  }

  markDirty(): void {
    this.isDirty = true;
    this.applyThemeSettings();
    this.cdr.markForCheck();
  }

  applyThemeSettings(): void {
    if (this.settings) {
      this.themeService.applyThemeSettings(
        this.settings.theme,
        this.settings.accentColor,
        this.settings.compactMode
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
