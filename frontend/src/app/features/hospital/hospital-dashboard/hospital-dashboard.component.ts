import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { catchError, take } from 'rxjs/operators';
import { of } from 'rxjs';
import { HospitalService, HospitalStats } from '../../../core/services/hospital.service';
import { LoadingService } from '../../../core/services/loading.service';
import { InviteDoctorModalComponent } from '../../settings/modals/invite-doctor-modal.component';
import { AddHospitalDialogComponent } from './add-hospital-dialog/add-hospital-dialog.component';
import { EditDoctorDialogComponent } from './edit-doctor-dialog/edit-doctor-dialog.component';
import { environment } from '../../../../environments/environment';
import { ChartConfiguration } from 'chart.js';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { BaseChartDirective } from 'ng2-charts';
import { PdfExportService } from '../../../core/services/pdf-export.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-hospital-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    BaseChartDirective
  ],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './hospital-dashboard.component.html',
  styleUrls: ['./hospital-dashboard.component.scss']
})
export class HospitalDashboardComponent implements OnInit {
  private hospitalService = inject(HospitalService);
  private loadingService = inject(LoadingService);
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private pdfExportService = inject(PdfExportService);
  private notificationService = inject(NotificationService);

  // ── Stats ───────────────────────────────────────────────────────────────────
  stats = signal<HospitalStats | null>(null);
  activeSegment = signal<'today' | 'week' | 'month'>('today');

  greenPercent  = computed(() => this._pct(this.stats()?.zones.green));
  yellowPercent = computed(() => this._pct(this.stats()?.zones.yellow));
  redPercent    = computed(() => this._pct(this.stats()?.zones.red));
  criticalCount = computed(() => this.stats()?.zones?.red ?? 0);

  private _pct(n: number | undefined): number {
    const total = this.stats()?.total_patients;
    if (!total || n === undefined) return 0;
    return Math.round((n / total) * 100);
  }

  // ── Interactive Chart Click Filters ───────────────────────────────────────
  selectedZoneFilter = signal<'all' | 'green' | 'yellow' | 'red'>('all');

  filteredDoctorPerformance = computed(() => {
    const perf = this.stats()?.doctor_performance || [];
    const filter = this.selectedZoneFilter();
    const total = this.stats()?.total_patients;
    
    if (filter === 'all') return perf;
    
    return perf.filter(doc => {
      const p = this.loadPercent(doc.patient_count, total);
      if (filter === 'green') return p < 50;
      if (filter === 'yellow') return p >= 50 && p < 80;
      if (filter === 'red') return p >= 80;
      return true;
    });
  });

  // ── Doctor management and filters ──────────────────────────────────────────
  doctors = signal<any[]>([]);
  isLoadingDoctors = false;
  doctorSearchQuery = signal<string>('');
  doctorStatusFilter = signal<'all' | 'active' | 'inactive'>('all');

  filteredDoctorsList = computed(() => {
    const list = this.doctors();
    const query = this.doctorSearchQuery().toLowerCase().trim();
    const status = this.doctorStatusFilter();

    return list.filter(doc => {
      const matchesSearch = !query || 
        (doc.full_name || '').toLowerCase().includes(query) ||
        (doc.specialty || '').toLowerCase().includes(query) ||
        (doc.email || '').toLowerCase().includes(query);

      const matchesStatus = status === 'all' ||
        (status === 'active' && doc.is_active) ||
        (status === 'inactive' && !doc.is_active);

      return matchesSearch && matchesStatus;
    });
  });

  onDoctorSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.doctorSearchQuery.set(value);
  }

  onStatusFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'all' | 'active' | 'inactive';
    this.doctorStatusFilter.set(value);
  }

  // ── Patient assignment ───────────────────────────────────────────────────────
  allPatients: any[] = [];
  isLoadingPatients = false;
  showAssignPanel = signal(false);
  selectedDoctorForAssign: any = null;
  selectedPatientId: number | null = null;
  isAssigning = false;

  loadAllPatients(): void {
    this.isLoadingPatients = true;
    this.http.get<any[]>(`${environment.apiUrl}/admin/patients`, {
      headers: { 'X-Dashboard-Api-Key': environment.dashboardApiKey }
    }).pipe(catchError(() => of([])), take(1)).subscribe(list => {
      this.allPatients = list;
      this.isLoadingPatients = false;
    });
  }

  openAssignPanel(doctor: any): void {
    this.selectedDoctorForAssign = doctor;
    this.selectedPatientId = null;
    this.loadAllPatients();
    this.showAssignPanel.set(true);
  }

  closeAssignPanel(): void {
    this.showAssignPanel.set(false);
    this.selectedDoctorForAssign = null;
    this.selectedPatientId = null;
  }

  assignPatient(): void {
    if (!this.selectedPatientId || !this.selectedDoctorForAssign) return;
    this.isAssigning = true;
    this.http.post(
      `${environment.apiUrl}/admin/patients/${this.selectedPatientId}/assign-doctor`,
      { doctor_id: this.selectedDoctorForAssign.id },
      { headers: { 'X-Dashboard-Api-Key': environment.dashboardApiKey } }
    ).pipe(catchError(() => of(null)), take(1)).subscribe(res => {
      this.isAssigning = false;
      if (res !== null) {
        this.snackBar.open('Paciente asignado correctamente', 'OK', { duration: 3000 });
        
        // dispatch native local notification
        const patient = this.allPatients.find(p => p.id === this.selectedPatientId);
        this.notificationService.sendLocalNotification('📋 Paciente Asignado', {
          body: `Se ha asignado el paciente ${patient?.full_name || 'Paciente'} al Dr. ${this.selectedDoctorForAssign?.full_name || 'Médico'}.`,
          icon: 'assets/icons/icon-192x192.png'
        });

        this.closeAssignPanel();
        this.loadAllPatients();
      } else {
        this.snackBar.open('Error al asignar paciente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openEditDoctor(doctor: any): void {
    const ref = this.dialog.open(EditDoctorDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: doctor
    });
    ref.afterClosed().subscribe((updated: any) => {
      if (updated) {
        Object.assign(doctor, updated);
        this.doctors.set([...this.doctors()]);
        this.snackBar.open('Doctor actualizado correctamente', 'OK', { duration: 3000 });
      }
    });
  }

  loadDoctors(): void {
    this.isLoadingDoctors = true;
    this.http.get<any[]>(`${environment.apiUrl}/admin/doctors`, {
      headers: { 'X-Dashboard-Api-Key': environment.dashboardApiKey }
    }).pipe(catchError(() => of([])), take(1)).subscribe(list => {
      this.doctors.set(list);
      this.isLoadingDoctors = false;
    });
  }

  openInviteDoctor(): void {
    const ref = this.dialog.open(InviteDoctorModalComponent, {
      panelClass: 'glass-dialog',
      width: '560px',
      maxWidth: '95vw'
    });
    ref.afterClosed().subscribe(() => {
      this.loadDoctors();
      this.notificationService.sendLocalNotification('✉️ Invitación Procesada', {
        body: 'Se ha completado el flujo de invitación para el personal médico de AsmaSync.',
        icon: 'assets/icons/icon-192x192.png'
      });
    });
  }

  toggleDoctorActive(doctor: any): void {
    const action = doctor.is_active ? 'deactivate' : 'activate';
    this.http.patch(`${environment.apiUrl}/admin/doctors/${doctor.id}/${action}`, {}, {
      headers: { 'X-Dashboard-Api-Key': environment.dashboardApiKey }
    }).pipe(catchError(() => of(null)), take(1)).subscribe(res => {
      if (res !== null) {
        doctor.is_active = !doctor.is_active;
        this.doctors.set([...this.doctors()]);
        this.snackBar.open(
          doctor.is_active ? 'Doctor activado' : 'Doctor desactivado',
          'OK', { duration: 3000 }
        );
        // send local notification
        this.notificationService.sendLocalNotification(
          doctor.is_active ? '🩺 Médico Activado' : '📴 Médico Desactivado',
          {
            body: `El Dr. ${doctor.full_name} ahora se encuentra en estado: ${doctor.is_active ? 'Activo' : 'Inactivo'}.`,
            icon: 'assets/icons/icon-192x192.png'
          }
        );
      }
    });
  }

  // ── Chart ───────────────────────────────────────────────────────────────────
  public pieChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed} pacientes` } }
    },
    onClick: (event, elements) => {
      if (elements && elements.length > 0) {
        const clickedIndex = elements[0].index;
        const currentFilter = this.selectedZoneFilter();
        let newFilter: 'all' | 'green' | 'yellow' | 'red' = 'all';
        if (clickedIndex === 0) newFilter = currentFilter === 'green' ? 'all' : 'green';
        else if (clickedIndex === 1) newFilter = currentFilter === 'yellow' ? 'all' : 'yellow';
        else if (clickedIndex === 2) newFilter = currentFilter === 'red' ? 'all' : 'red';
        this.selectedZoneFilter.set(newFilter);
      } else {
        this.selectedZoneFilter.set('all');
      }
    }
  };

  public pieChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Verde', 'Amarillo', 'Rojo'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#34c759', '#ff9f0a', '#ff3b30'],
      hoverBackgroundColor: ['#28a745', '#e8890a', '#e0352b'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  ngOnInit() {
    this.loadStats();
    this.loadDoctors();
  }

  loadStats() {
    this.loadingService.showLoading();
    this.hospitalService.getHospitalStats(1).pipe(take(1)).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.pieChartData = {
          ...this.pieChartData,
          datasets: [{ ...this.pieChartData.datasets[0], data: [data.zones.green, data.zones.yellow, data.zones.red] }]
        };
        this.loadingService.hideLoading();
      },
      error: () => this.loadingService.hideLoading()
    });
  }

  async downloadReport(): Promise<void> {
    const s = this.stats();
    if (!s) {
      this.snackBar.open('Sin datos para exportar', 'OK', { duration: 2000 });
      return;
    }

    const today = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
    const primaryColor = document.documentElement.style.getPropertyValue('--brand-primary') || '#007aff';
    
    // KPI percentages
    const greenPct = this.greenPercent();
    const yellowPct = this.yellowPercent();
    const redPct = this.redPercent();

    const doctorsRowsHtml = (s.doctor_performance || []).map(d => {
      const loadPct = this.loadPercent(d.patient_count, s.total_patients);
      const loadLabel = this.loadLabel(d.patient_count, s.total_patients);
      const statusLabel = this.statusLabel(d.patient_count, s.total_patients);
      let badgeClass = 'background:#e8f8ec;color:#1a7f37;';
      if (loadLabel === 'Alta') badgeClass = 'background:#fff4e0;color:#9a5c00;';
      else if (loadLabel === 'Crítica') badgeClass = 'background:#fff0ee;color:#c0392b;';

      return `
        <tr style="border-bottom:0.5px solid #f1f5f9;">
          <td style="padding:10px 8px;font-size:12px;font-weight:700;color:#1e293b;">Dr. ${d.doctor_name}</td>
          <td style="padding:10px 8px;font-size:12px;text-align:center;color:#475569;">${d.patient_count}</td>
          <td style="padding:10px 8px;font-size:12px;text-align:center;color:#475569;">${loadPct}%</td>
          <td style="padding:10px 8px;font-size:11px;text-align:right;">
            <span style="display:inline-block;padding:2px 8px;border-radius:20px;font-weight:700;${badgeClass}">${statusLabel}</span>
          </td>
        </tr>
      `;
    }).join('');

    const html = `
<div style="font-family:'Inter',Arial,sans-serif;color:#1e293b;background:white;padding:10px;">
  <!-- Header -->
  <div style="background:linear-gradient(135deg, ${primaryColor}, #005ecb);padding:24px;border-radius:12px;margin-bottom:24px;">
    <div style="display:flex;align-items:center;justify-content:space-between;color:white;">
      <div>
        <div style="font-size:24px;font-weight:800;letter-spacing:-0.5px;">${s.hospital_name || 'Establecimiento Médico'}</div>
        <div style="font-size:13px;opacity:0.9;margin-top:2px;">Reporte Ejecutivo de Gestión Hospitalaria</div>
      </div>
      <div style="text-align:right;font-size:11px;opacity:0.8;">
        <div>AsmaSync Central Admin</div>
        <div>Generado: ${today}</div>
      </div>
    </div>
  </div>

  <!-- KPI Grid -->
  <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:12px;margin-bottom:24px;">
    <div style="border:0.5px solid #e2e8f0;border-radius:12px;padding:14px;background:#f8fafc;">
      <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;">Total Pacientes</div>
      <div style="font-size:28px;font-weight:800;color:${primaryColor};margin-top:6px;letter-spacing:-1px;">${s.total_patients}</div>
      <div style="font-size:10px;color:#94a3b8;margin-top:4px;">Activos hoy</div>
    </div>
    <div style="border:0.5px solid #e2e8f0;border-radius:12px;padding:14px;background:#f8fafc;">
      <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;">Zona Verde</div>
      <div style="font-size:28px;font-weight:800;color:#34c759;margin-top:6px;letter-spacing:-1px;">${s.zones?.green ?? 0}</div>
      <div style="font-size:10px;color:#94a3b8;margin-top:4px;">Estable (${greenPct}%)</div>
    </div>
    <div style="border:0.5px solid #e2e8f0;border-radius:12px;padding:14px;background:#f8fafc;">
      <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;">Zona Amarilla</div>
      <div style="font-size:28px;font-weight:800;color:#ff9f0a;margin-top:6px;letter-spacing:-1px;">${s.zones?.yellow ?? 0}</div>
      <div style="font-size:10px;color:#94a3b8;margin-top:4px;">Monitoreo (${yellowPct}%)</div>
    </div>
    <div style="border:0.5px solid #e2e8f0;border-radius:12px;padding:14px;background:#f8fafc;">
      <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;">Zona Roja</div>
      <div style="font-size:28px;font-weight:800;color:#ff3b30;margin-top:6px;letter-spacing:-1px;">${s.zones?.red ?? 0}</div>
      <div style="font-size:10px;color:#94a3b8;margin-top:4px;">Crítico (${redPct}%)</div>
    </div>
  </div>

  <!-- Distribution and Performance Detail -->
  <div style="border:0.5px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
    <div style="background:#f8fafc;padding:14px;border-bottom:0.5px solid #e2e8f0;font-size:13px;font-weight:800;color:#1e293b;">
      Rendimiento y Asignación Médica
    </div>
    <div style="padding:16px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:1px solid #cbd5e1;text-align:left;">
            <th style="padding:8px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;">Médico</th>
            <th style="padding:8px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:center;">Pacientes</th>
            <th style="padding:8px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:center;">Carga</th>
            <th style="padding:8px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:right;">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${doctorsRowsHtml}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Footer Info -->
  <div style="margin-top:40px;padding-top:12px;border-top:0.5px solid #cbd5e1;text-align:center;font-size:10px;color:#94a3b8;">
    AsmaSync Digital Health - Centralized Administration Systems. Documento clasificado como confidencial.
  </div>
</div>
`;

    await this.pdfExportService.exportFromHtml(html, {
      filename: `Reporte_Gestion_${this.pdfExportService.sanitizeName(s.hospital_name)}_${Date.now()}.pdf`,
      paperSize: 'letter'
    });
  }

  addHospital(): void {
    const ref = this.dialog.open(AddHospitalDialogComponent, {
      panelClass: 'glass-dialog',
      width: '600px',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open(`Hospital "${result.name}" registrado correctamente`, 'OK', { duration: 4000 });
        this.loadStats();
      }
    });
  }

  initials(name: string): string {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  avatarClass(index: number): string { return `av-${index % 5}`; }

  loadPercent(count: number, total: number | undefined): number {
    if (!total) return 0;
    return Math.min(Math.round((count / total) * 300), 100);
  }

  loadLabel(count: number, total: number | undefined): string {
    const p = this.loadPercent(count, total);
    return p >= 80 ? 'Crítica' : p >= 50 ? 'Alta' : 'Normal';
  }

  loadClass(count: number, total: number | undefined): string {
    const p = this.loadPercent(count, total);
    return p >= 80 ? 'load-critical' : p >= 50 ? 'load-high' : 'load-normal';
  }

  loadFillClass(count: number, total: number | undefined): string {
    const p = this.loadPercent(count, total);
    return p >= 80 ? 'fill-red' : p >= 50 ? 'fill-amber' : 'fill-green';
  }

  statusLabel(count: number, total: number | undefined): string {
    const p = this.loadPercent(count, total);
    return p >= 80 ? 'Sobrecarga' : p >= 50 ? 'Atención' : 'Óptimo';
  }

  statusPillClass(count: number, total: number | undefined): string {
    const p = this.loadPercent(count, total);
    return p >= 80 ? 'pill-red' : p >= 50 ? 'pill-amber' : 'pill-green';
  }
}
