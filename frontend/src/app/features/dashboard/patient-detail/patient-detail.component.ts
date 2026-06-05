import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, Subject, takeUntil, catchError, of, debounceTime, finalize } from 'rxjs';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MeasurementDialogComponent } from '../components/measurement-dialog/measurement-dialog.component';

// Chart.js
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartData, ChartType, ChartOptions } from 'chart.js';
import { default as Annotation } from 'chartjs-plugin-annotation';
import { externalTooltipHandler } from '../../../shared/utils/chart-tooltip';

// Services & Models
import { PatientService } from '../../../core/services/patient.service';
import { ClinicalService } from '../../../core/services/clinical.service';
import { InterventionService } from '../../../core/services/intervention.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { Router } from '@angular/router';
import { WebSocketService } from '../../../core/services/websocket.service';
import { Patient, PEFTrend } from '../../../core/models/patient.model';
import { Appointment } from '../../../core/models/appointment.model';
import { Intervention } from '../../../core/models/intervention.model';
import { AgePipe } from '../../../shared/pipes/age-pipe';
import { SafeDatePipe } from '../../../shared/pipes/safe-date.pipe';
import { PdfExportService } from '../../../core/services/pdf-export.service';
import { AuthService } from '../../../core/services/auth.service';
import * as riskHelper from '../../../core/utils/risk.helper';

interface VitalMetric {
    label: string;
    value: string | number;
    unit: string;
    icon: string;
    colorClass: string;
    subtext?: string;
}

interface Symptom {
    timestamp: string;
    type: 'cough' | 'wheezing' | 'shortness_of_breath' | 'medication_use' | 'other';
    description: string;
    severity: 'low' | 'medium' | 'high';
}

interface HistoryEntry {
    date: string;
    measured_at: string;
    value: number;
    type: 'pef' | 'spo2' | 'heart_rate' | 'evolution' | 'crisis';
    description?: string | null;
    pef?: number;
    spo2?: number;
    heart_rate?: number;
    notes?: string;
    symptoms?: string[];
    doctor?: string;
}

interface MeasurementChartData {
    pef: Array<{ x: string; y: number }>;
    spo2: Array<{ x: string; y: number }>;
    heart_rate: Array<{ x: string; y: number }>;
}

import { ActionPlanWidgetComponent } from '../components/widgets/action-plan-widget/action-plan-widget';
import { ClinicalHistoryStepperComponent } from './components/clinical-history-stepper.component';
import { MedicalDocumentUploadComponent } from './components/medical-document-upload.component';
import { AppointmentDialogComponent } from '../components/appointment-dialog/appointment-dialog.component';

@Component({
    selector: 'app-patient-detail',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.Default,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatTableModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatDividerModule,
        MatTooltipModule,
        MatTabsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        BaseChartDirective,
        AgePipe,
        SafeDatePipe,
        ActionPlanWidgetComponent,
        ClinicalHistoryStepperComponent,
        MedicalDocumentUploadComponent
    ],
    providers: [provideCharts(withDefaultRegisterables(Annotation))],
    templateUrl: './patient-detail.component.html',
    styleUrl: './patient-detail.component.scss'
})
export class PatientDetailComponent implements OnInit, OnDestroy {

    // Chart Config


    private destroy$ = new Subject<void>();

    loading = true;
    loadError: string | null = null;
    patientId: string | number | null = null;
    todayDate = new Date(); // ADDED FOR PRINT HEADER
    patient: Patient | null = null;
    nextAppointment: Appointment | null = null;
    history: HistoryEntry[] = [];
    symptoms: Symptom[] = [];
    crisisHistory: HistoryEntry[] = [];
    vitalMetrics: VitalMetric[] = [];
    interventions: Intervention[] = [];
    selectedTab = 0; // 0: Resumen, 1: Historial
    public pefChartOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                min: 0,
                grid: {
                    color: 'rgba(226, 232, 240, 0.6)', // Slate-200 with opacity
                    drawTicks: false
                },
                border: { dash: [4, 4], display: false },
                title: { display: true, text: 'FEM (L/min)', font: { family: "'Quicksand', sans-serif", weight: 'bold', size: 10 }, color: '#94a3b8' },
                ticks: { font: { family: "'Quicksand', sans-serif", size: 11 }, color: '#64748b', padding: 10 }
            },
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: { font: { family: "'Quicksand', sans-serif", size: 11 }, color: '#64748b', maxRotation: 0 }
            }
        },
        plugins: {
            legend: {
                display: false // Hide legend for cleaner look, or style it better
            },
            tooltip: {
                enabled: false, // Disable default
                external: externalTooltipHandler // Use custom glass tooltip
            },
            annotation: {
                common: {
                    drawTime: 'beforeDraw'
                },
                annotations: {
                    boxGreen: {
                        type: 'box',
                        yMin: 0,
                        backgroundColor: 'rgba(34, 197, 94, 0.08)', // Green-500 optimized
                        borderWidth: 0,
                        drawTime: 'beforeDraw'
                    },
                    boxYellow: {
                        type: 'box',
                        yMin: 0,
                        yMax: 0,
                        backgroundColor: 'rgba(234, 179, 8, 0.1)', // Yellow-500 optimized
                        borderWidth: 0,
                        drawTime: 'beforeDraw'
                    },
                    boxRed: {
                        type: 'box',
                        yMin: 0,
                        yMax: 0,
                        backgroundColor: 'rgba(239, 68, 68, 0.08)', // Red-500 optimized
                        borderWidth: 0,
                        drawTime: 'beforeDraw'
                    }
                }
            } as any
        },
        interaction: {
            mode: 'index',
            intersect: false,
        }
    };
    public pefChartType: 'line' = 'line';
    public pefChartData: ChartData<'line'> = {
        labels: [],
        datasets: [
            {
                data: [],
                label: 'FEM Medido',
                borderColor: '#06B6D4', // brand-cyan
                backgroundColor: (context: any) => {
                    if (!context.chart.ctx) return 'transparent';
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 350);
                    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
                    gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointBackgroundColor: '#fff',
                borderWidth: 2
            }
        ]
    };

    displayedCrisisColumns: string[] = ['date', 'severity', 'hospitalized', 'duration', 'trigger'];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private patientService: PatientService,
        private clinicalService: ClinicalService,
        private interventionService: InterventionService,
        private appointmentService: AppointmentService,
        private wsService: WebSocketService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private pdfExport: PdfExportService,
        private cdr: ChangeDetectorRef,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.patientId = id;
            if (id.startsWith('P-')) {
                this.loadPatientData(id as any);
            } else {
                this.loadPatientData(+id);
                this.setupRealtimeUpdates(+id);
            }
        }
    }

    setupRealtimeUpdates(patientId: number): void {
        this.wsService.messages$
            .pipe(
                takeUntil(this.destroy$),
                debounceTime(2000) // Evita recargas en cascada cuando IoT envía datos rápidamente
            )
            .subscribe(msg => {
                if ((msg.type === 'pef_update' || msg.type === 'new_symptom' || msg.type === 'risk_update') && 
                    msg.patientId && Number(msg.patientId) === Number(patientId)) {
                    this.loadPatientData(patientId);
                }
            });
    }

    openAddMeasurementDialog(): void {
        const dialogRef = this.dialog.open(MeasurementDialogComponent, {
            width: '600px',
            data: { patientId: this.patient?.id }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && this.patient) {
                // Determine API call based on type
                if (result.type === 'pef') {
                    this.clinicalService.addSpirometry(this.patient.id as number, {
                        pef: result.pef,
                        measured_at: result.date
                    }).subscribe({
                        next: () => this.handleSuccess('PEF registrado'),
                        error: (err) => this.handleError('Error al registrar PEF', err)
                    });
                } else if (result.type === 'vitals') {
                    this.clinicalService.addVitalSign(this.patient.id as number, {
                        spo2: result.spo2,
                        heart_rate: result.heart_rate,
                        measured_at: result.date
                    }).subscribe({
                        next: () => this.handleSuccess('Signos vitales registrados'),
                        error: (err) => this.handleError('Error al registrar signos vitales', err)
                    });
                } else {
                    // Fallback for symptoms/meds (legacy or future endpoint)
                    this.handleSuccess('Registro clínico guardado (Local)');
                }
            }
        });
    }

    handleSuccess(msg: string) {
        this.snackBar.open(msg, 'Cerrar', { duration: 3000 });
        if (this.patient) this.loadPatientData(this.patient.id);
    }

    handleError(msg: string, err: Error | HttpErrorResponse) {
        console.error(err);
        this.snackBar.open(msg, 'Cerrar', { duration: 3000 });
    }

    // ...

    loadPatientData(id: string | number): void {
        this.loading = true;
        this.loadError = null;

        const numericId = id && !isNaN(Number(id)) ? Number(id) : null;

        forkJoin({
            patient: this.patientService.getPatientById(id),
            interventions: this.interventionService.getByPatient(numericId ?? 0).pipe(
                catchError(() => of([]))
            )
        })
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => {
                    // ✓ SIEMPRE se ejecuta, con o sin error
                    this.loading = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: (result) => {
                    if (result && result.patient) {
                        this.patient = result.patient;
                        this.interventions = result.interventions || [];

                        // Build chart data and history timeline from recent_measurements
                        const chartData = this.buildChartDataFromMeasurements(
                            this.patient.recent_measurements || []
                        );
                        this.history = this.buildHistoryFromMeasurements(
                            this.patient.recent_measurements || []
                        );

                        this.processHistory(this.history);
                        this.setupRealCharts(chartData, this.patient?.personal_best_pef || 500);

                        // Update vitals from most recent measurement
                        if (chartData.pef?.length) {
                            const lastPef = chartData.pef[chartData.pef.length - 1].y;
                            if (this.patient) this.patient.latest_pef = lastPef;
                        }
                        if (chartData.spo2?.length) {
                            const lastSpo2 = chartData.spo2[chartData.spo2.length - 1].y;
                            if (this.patient) this.patient.currentSpO2 = lastSpo2;
                        }

                        this.processVitalMetrics(this.patient);

                        if (typeof this.patient.id === 'number') {
                            this.loadNextAppointment(this.patient.id);
                        }
                    } else {
                        // API devolvió null pero sin error en la observación
                        this.loadError = 'No se encontraron datos del paciente';
                    }
                },
                error: (err) => {
                    // Capturar error específico
                    const errorMsg = err?.message || 'Error al cargar datos del paciente';
                    this.loadError = errorMsg;

                    // Mostrar error con opción de reintentar
                    const snackBarRef = this.snackBar.open(
                        errorMsg,
                        'Reintentar',
                        { duration: 10000 }
                    );

                    snackBarRef.onAction().subscribe(() => {
                        // Usuario hizo clic en "Reintentar"
                        this.loadPatientData(id);
                    });

                    console.error('Error loading patient data:', err);
                }
            });
    }

    /** Converts raw recent_measurements array to PatientHistory chart format */
    private buildChartDataFromMeasurements(measurements: HistoryEntry[]): MeasurementChartData {
        const pef: Array<{x:string, y:number}> = [];
        const spo2: Array<{x:string, y:number}> = [];
        const heart_rate: Array<{x:string, y:number}> = [];
        const valid = (measurements || []).filter(m => m && m.measured_at);
        const sorted = [...valid].sort(
            (a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
        );
        for (const m of sorted) {
            const x = m.measured_at;
            if (m.pef) pef.push({ x, y: m.pef });
            if (m.spo2) spo2.push({ x, y: m.spo2 });
            if (m.heart_rate) heart_rate.push({ x, y: m.heart_rate });
        }
        return { pef, spo2, heart_rate };
    }

    /** Converts raw recent_measurements to the history timeline format */
    private buildHistoryFromMeasurements(measurements: HistoryEntry[]): HistoryEntry[] {
        return (measurements || []).map(m => {
            let symptomsText: string | null = null;
            if (m.symptoms) {
                symptomsText = Array.isArray(m.symptoms) ? m.symptoms.join(', ') : String(m.symptoms);
            }
            return {
                ...m,
                date: m.measured_at,
                value: m.pef || m.spo2 || m.heart_rate || 0,
                type: m.pef ? 'pef' : m.spo2 ? 'spo2' : 'heart_rate',
                description: m.notes || symptomsText || null
            };
        });
    }

    setupRealCharts(history: MeasurementChartData, personalBest: number): void {
        const pefData = history.pef || [];
        pefData.sort((a: { x: string; y: number }, b: { x: string; y: number }) => {
            const timeA = a.x ? new Date(a.x).getTime() : 0;
            const timeB = b.x ? new Date(b.x).getTime() : 0;
            return timeA - timeB;
        });

        const dates = pefData.map((d: { x: string; y: number }) => {
            if (!d.x) return '—';
            const date = new Date(d.x);
            return isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
        });
        const values = pefData.map((d: { x: string; y: number }) => d.y);

        this.pefChartData = {
            labels: dates,
            datasets: [{
                data: values,
                label: 'FEM Medido',
                borderColor: '#00B5AD',
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(0, 181, 173, 0.4)');
                    gradient.addColorStop(1, 'rgba(0, 181, 173, 0.0)');
                    return gradient;
                },
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4, // Visible points for real data
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#00B5AD',
                pointBorderWidth: 2
            }]
        };

        // Annotations logic remains same
        const greenZone = personalBest * 0.8;
        const yellowZone = personalBest * 0.5;

        if (this.pefChartOptions?.plugins?.annotation?.annotations) {
            const annotations = this.pefChartOptions.plugins.annotation.annotations as any;
            if (annotations) {
                if (annotations.boxGreen) {
                    annotations.boxGreen.yMin = greenZone;
                }
                if (annotations.boxYellow) {
                    annotations.boxYellow.yMin = yellowZone;
                    annotations.boxYellow.yMax = greenZone;
                }
                if (annotations.boxRed) {
                    annotations.boxRed.yMin = 0;
                    annotations.boxRed.yMax = yellowZone;
                }
            }
        }
    }


    processHistory(history: any[]): void {
        this.symptoms = history.filter(h => h.type === 'symptom')
            .map(s => ({
                timestamp: s.date || s.timestamp,
                type: s.type,
                description: s.description || 'Síntoma registrado',
                severity: s.severity || 'low'
            }))
            .slice(0, 10);

        this.crisisHistory = history.filter(h => h.type === 'crisis').slice(0, 5);
    }

    processVitalMetrics(patient: Patient): void {
        // Logic to calculate colors/warnings
        const pefPercent = patient.personal_best_pef ? Math.round((patient.latest_pef / patient.personal_best_pef) * 100) : 0;

        this.vitalMetrics = [
            {
                label: 'FEM Actual',
                value: patient.latest_pef, // Updated field name
                unit: 'L/min',
                icon: 'air',
                colorClass: this.getMetricColorClass(pefPercent, 'pef'),
                subtext: `${pefPercent}% del mejor personal`
            },
            {
                label: 'SpO2',
                value: patient.currentSpO2,
                unit: '%',
                icon: 'favorite',
                colorClass: this.getMetricColorClass(patient.currentSpO2, 'spo2')
            },
            {
                label: 'Frecuencia Resp.',
                value: patient.respiratoryRate || '—',
                unit: patient.respiratoryRate ? 'rpm' : '',
                icon: 'waves',
                colorClass: 'text-blue-600'
            }
        ];
    }

    loadNextAppointment(patientId: number): void {
        this.appointmentService.getAppointmentsByPatient(patientId)
            .pipe(takeUntil(this.destroy$), catchError(() => of([])))
            .subscribe(appointments => {
                const now = new Date();
                const upcoming = appointments
                    .filter(a => new Date(a.date) >= now && a.status !== 'cancelled' && a.status !== 'completed')
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                this.nextAppointment = upcoming[0] ?? null;
                this.cdr.detectChanges();
            });
    }

    openAppointmentDialog(): void {
        const dialogRef = this.dialog.open(AppointmentDialogComponent, {
            width: '480px',
            data: this.nextAppointment
                ? { appointment: this.nextAppointment }
                : { patientId: this.patient?.id, date: new Date() }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result && this.patient?.id && typeof this.patient.id === 'number') {
                this.loadNextAppointment(this.patient.id);
            }
        });
    }

    getAppointmentTypeLabel(type: string): string {
        const labels: { [key: string]: string } = {
            checkup: 'Consulta General',
            follow_up: 'Seguimiento',
            emergency: 'Urgencia',
            test: 'Estudio',
            other: 'Otro'
        };
        return labels[type] ?? type;
    }

    getMetricColorClass(_value: number, _type: 'pef' | 'spo2'): string {
        return '';
    }

    getPefPercentage(current: number, best: number | undefined): number {
        if (!best) return 0;
        return Math.round((current / best) * 100);
    }

    setupChart(trends: PEFTrend[], personalBest: number): void {
        const dates = trends.map(t => new Date(t.date).toLocaleDateString());
        const values = trends.map(t => t.pefValue);

        this.pefChartData = {
            labels: dates,
            datasets: [{
                data: values,
                label: 'FEM Medido',
                borderColor: '#00B5AD', // Brand Primary
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(0, 181, 173, 0.4)');
                    gradient.addColorStop(1, 'rgba(0, 181, 173, 0.0)');
                    return gradient;
                },
                borderWidth: 3,
                fill: true,
                tension: 0.4, // Smooth curve
                pointRadius: 0, // Hidden points
                pointHoverRadius: 6,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#00B5AD',
                pointBorderWidth: 2
            }]
        };

        const greenZone = personalBest * 0.8;
        const yellowZone = personalBest * 0.5;

        if (this.pefChartOptions?.plugins?.annotation?.annotations) {
            const annotations = this.pefChartOptions.plugins.annotation.annotations as any;
            if (annotations) {
                if (annotations.boxGreen) {
                    annotations.boxGreen.yMin = greenZone;
                }
                if (annotations.boxYellow) {
                    annotations.boxYellow.yMin = yellowZone;
                    annotations.boxYellow.yMax = greenZone;
                }
                if (annotations.boxRed) {
                    annotations.boxRed.yMin = 0;
                    annotations.boxRed.yMax = yellowZone;
                }
            }
        }
    }

    async exportPDF(): Promise<void> {
        if (!this.patient) return;
        const p = this.patient;
        const agePipe = new AgePipe();
        const age = agePipe.transform(p.date_of_birth);
        const today = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const riskLabel = riskHelper.getRiskLabel(p.riskLevel);
        const riskColor = riskHelper.getRiskColor(p.riskLevel);
        const institutionName = (this.authService.currentUserValue as any)?.hospital_name || 'AsmaSync Medical Dashboard';
        const meds = (p.medications || []).map((m: any) => `
            <tr><td style="padding:6px 8px;border-bottom:1px solid #f1f5f9">${m.name}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;color:#64748b">${m.dosage}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;color:#64748b">${m.frequency || ''}</td></tr>`).join('');

        const html = `
<div style="font-family:'Inter',Arial,sans-serif;color:#1e293b;background:white;">
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0e7490,#06b6d4);padding:20px 24px;border-radius:12px;margin-bottom:20px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="color:white;font-size:22px;font-weight:800;margin-bottom:4px;">${institutionName}</div>
        <div style="color:rgba(255,255,255,0.75);font-size:12px;">DIRECCIÓN DE NEUMOLOGÍA Y CONTROL DE ASMA</div>
      </div>
      <div style="text-align:right;color:rgba(255,255,255,0.85);font-size:11px;">
        <div>EMISIÓN: ${today}</div>
        <div>EXPEDIENTE: #${p.id}</div>
      </div>
    </div>
  </div>

  <div style="background:linear-gradient(135deg,#0e7490,#06b6d4);color:white;padding:10px 16px;text-align:center;font-size:14px;font-weight:700;letter-spacing:0.08em;border-radius:8px;margin-bottom:20px;">EXPEDIENTE CLÍNICO DEL PACIENTE</div>

  <!-- Identification -->
  <div style="margin-bottom:20px;">
    <div style="font-size:11px;font-weight:700;color:#0e7490;letter-spacing:0.05em;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:12px;">FICHA DE IDENTIFICACIÓN</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
      <div><div style="font-size:9px;color:#94a3b8;font-weight:700;">PACIENTE</div><div style="font-size:13px;font-weight:700">${(p.full_name || '').toUpperCase()}</div></div>
      <div><div style="font-size:9px;color:#94a3b8;font-weight:700;">EDAD</div><div style="font-size:13px;font-weight:700">${age} años</div></div>
      <div><div style="font-size:9px;color:#94a3b8;font-weight:700;">SEXO</div><div style="font-size:13px;font-weight:700">${p.gender === 'male' ? 'MASCULINO' : 'FEMENINO'}</div></div>
      <div><div style="font-size:9px;color:#94a3b8;font-weight:700;">DIAGNÓSTICO</div><div style="font-size:13px;font-weight:700">${p.asthma_type || 'Asma Bronquial'}</div></div>
      <div><div style="font-size:9px;color:#94a3b8;font-weight:700;">TELÉFONO</div><div style="font-size:13px;font-weight:700">${p.phone || '—'}</div></div>
      <div><div style="font-size:9px;color:#94a3b8;font-weight:700;">RIESGO</div>
        <div style="display:inline-block;padding:2px 10px;border-radius:6px;background:${riskColor}20;color:${riskColor};font-size:11px;font-weight:800;">${riskLabel}</div></div>
    </div>
  </div>

  <!-- Vitals -->
  <div style="margin-bottom:20px;">
    <div style="font-size:11px;font-weight:700;color:#0e7490;letter-spacing:0.05em;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:12px;">SIGNOS VITALES</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:28px;font-weight:900;color:#0e7490">${p.latest_pef || '—'}</div>
        <div style="font-size:9px;color:#64748b;font-weight:700">L/min</div>
        <div style="font-size:10px;font-weight:800;color:#334155;margin-top:4px">FEM ACTUAL</div>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:28px;font-weight:900;color:#0e7490">${p.currentSpO2 || '—'}</div>
        <div style="font-size:9px;color:#64748b;font-weight:700">%</div>
        <div style="font-size:10px;font-weight:800;color:#334155;margin-top:4px">SpO₂</div>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:28px;font-weight:900;color:#0e7490">${p.personal_best_pef || '—'}</div>
        <div style="font-size:9px;color:#64748b;font-weight:700">L/min</div>
        <div style="font-size:10px;font-weight:800;color:#334155;margin-top:4px">MEJOR PERSONAL</div>
      </div>
    </div>
  </div>

  ${meds ? `
  <!-- Medications -->
  <div style="margin-bottom:20px;">
    <div style="font-size:11px;font-weight:700;color:#0e7490;letter-spacing:0.05em;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:12px;">MEDICACIÓN ACTUAL</div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead><tr style="background:#f8fafc;">
        <th style="padding:8px;text-align:left;font-size:10px;color:#64748b;">MEDICAMENTO</th>
        <th style="padding:8px;text-align:left;font-size:10px;color:#64748b;">DOSIS</th>
        <th style="padding:8px;text-align:left;font-size:10px;color:#64748b;">FRECUENCIA</th>
      </tr></thead>
      <tbody>${meds}</tbody>
    </table>
  </div>` : ''}

  <!-- Signatures -->
  <div style="margin-top:30px;display:flex;justify-content:space-around;text-align:center;">
    <div style="width:200px;">
      <div style="border-top:1px solid #1e293b;margin-bottom:8px;"></div>
      <div style="font-size:12px;font-weight:800;color:#1e293b;">${(this.authService.currentUserValue?.full_name || 'DR. EMMA RUIZ').toUpperCase()}</div>
      <div style="font-size:9px;color:#64748b;font-weight:700;">ESPECIALISTA EN NEUMOLOGÍA</div>
    </div>
    <div style="width:200px;">
      <div style="border-top:1px solid #1e293b;margin-bottom:8px;"></div>
      <div style="font-size:12px;font-weight:800;color:#1e293b;">FIRMA DEL PACIENTE</div>
      <div style="font-size:9px;color:#64748b;font-weight:700;">ACEPTACIÓN DE TRATAMIENTO</div>
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top:40px;padding-top:12px;border-top:1px solid #e2e8f0;text-align:center;">
    <p style="font-size:9px;color:#94a3b8;margin:0;">${institutionName} — Reporte generado el ${today}</p>
    <p style="font-size:8px;color:#cbd5e1;margin:4px 0 0;font-style:italic;">Este documento es una herramienta de apoyo clínico y no sustituye el juicio médico profesional.</p>
  </div>
</div>`;

        this.snackBar.open('Generando PDF...', '', { duration: 2000 });
        const safeName = this.pdfExport.sanitizeName(p.full_name || 'Paciente');
        await this.pdfExport.exportFromHtml(html, {
            filename: `Expediente_${safeName}_${Date.now()}.pdf`,
            paperSize: 'letter'
        });
        this.snackBar.open('PDF descargado correctamente', 'OK', { duration: 3000 });
    }

    sharePatient(): void {
        if (!this.patient) return;

        const summary = `
Paciente: ${this.patient.full_name}
ID: ${this.patient.id}
Edad: ${new AgePipe().transform(this.patient.date_of_birth)} años
Nivel de Riesgo: ${this.getRiskLabel(this.patient.riskLevel)}
FEM Actual: ${this.patient.latest_pef} L/min
        `.trim();

        navigator.clipboard.writeText(summary).then(() => {
            this.snackBar.open('📋 Información del paciente copiada al portapapeles', 'Cerrar', {
                duration: 3000,
                panelClass: 'glass-toast'
            });
        }).catch(err => {
            console.error('Error al copiar:', err);
            this.snackBar.open('Error al copiar información', 'Cerrar', { duration: 3000 });
        });
    }

    getCompletionPercentage(): number {
        if (!this.patient) return 0;
        let score = 0;
        let total = 0;

        // Define weighted fields
        const fields = [
            { key: 'email', weight: 10 },
            { key: 'phone', weight: 10 },
            { key: 'emergencyContact', weight: 15 },
            { key: 'date_of_birth', weight: 10 },
            { key: 'gender', weight: 5 },
            { key: 'asthma_type', weight: 10 },
            { key: 'personal_best_pef', weight: 15 },
            { key: 'vaccination_history', weight: 10 },
            { key: 'allergies', weight: 15 }
        ];

        fields.forEach(f => {
            total += f.weight;
            const val = (this.patient as any)[f.key];
            if (val && (Array.isArray(val) ? val.length > 0 : (typeof val === 'object' ? Object.keys(val).length > 0 : true))) {
                score += f.weight;
            }
        });

        return Math.min(100, Math.round((score / total) * 100));
    }

    getMissingFields(): string {
        if (!this.patient) return '';
        const missing: string[] = [];
        const criticalFields = [
            { key: 'email', label: 'email' },
            { key: 'phone', label: 'teléfono' },
            { key: 'emergencyContact', label: 'contacto emerg.' },
            { key: 'personal_best_pef', label: 'FEM mejor' },
            { key: 'vaccination_history', label: 'vacunas' },
            { key: 'allergies', label: 'alergias' }
        ];

        criticalFields.forEach(f => {
            const val = (this.patient as any)[f.key];
            const isEmpty = !val || (Array.isArray(val) && val.length === 0) || (typeof val === 'object' && Object.keys(val).length === 0);
            if (isEmpty) missing.push(f.label);
        });

        if (missing.length === 0) return 'Perfil completo';
        return `Falta: ${missing.slice(0, 2).join(', ')}${missing.length > 2 ? '...' : ''}`;
    }

    getRiskLabel(level: string): string {
        return riskHelper.getRiskLabel(level);
    }

    getRiskColorClass(level: string): string {
        return `risk-header-${level}`;
    }

    getSymptomIcon(type: string): string {
        const map: { [key: string]: string } = {
            'cough': 'sick',
            'wheezing': 'air',
            'shortness_of_breath': 'warning',
            'medication_use': 'medication'
        };
        return map[type] || 'info';
    }

    getSeverityColor(severity: string): string {
        switch (severity) {
            case 'high': return 'red';
            case 'medium': return 'orange';
            default: return 'green';
        }
    }

    getAdherenceColor(value: number | undefined): string {
        if (!value) return '#E0E0E0';
        if (value >= 80) return '#10B981';
        if (value >= 50) return '#F59E0B';
        return '#EF4444';
    }

    // Clinical Station Logic
    clinicalNote: string = '';
    newPrescription = { name: '', dosage: '', frequency: '' };
    isAllergyEditMode = false;
    editableAllergies: string = '';

    saveClinicalNote(): void {
        if (!this.clinicalNote.trim() || !this.patient) return;

        const currentUser = this.authService.currentUserValue;
        const doctorName = currentUser?.full_name ? `Dr. ${currentUser.full_name.split(' ').slice(-1)[0]}` : 'Dr.';

        const noteText = this.clinicalNote;

        // Optimistic UI update
        this.history.unshift({
            date: new Date().toISOString(),
            measured_at: new Date().toISOString(),
            value: 0,
            type: 'evolution',
            description: 'Nota de Evolución',
            notes: noteText,
            doctor: doctorName
        });
        this.history = [...this.history];
        this.clinicalNote = '';
        this.snackBar.open('Nota guardada', 'Cerrar', { duration: 2000 });

        // Persist via interventions endpoint
        this.interventionService.create({
            patient_id: this.patient.id as number,
            type: 'other',
            description: noteText,
        }).pipe(catchError(() => of(null))).subscribe();
    }

    onUploadSuccess(_response: any): void {
        if (this.patient) {
            this.loadPatientData(this.patient.id);
        }
    }

    addPrescription(): void {
        if (!this.newPrescription.name || !this.newPrescription.dosage || !this.patient) return;

        if (!this.patient.medications) this.patient.medications = [];

        const med = {
            name: this.newPrescription.name,
            dosage: this.newPrescription.dosage,
            frequency: this.newPrescription.frequency || 'Cada 8 hrs'
        };
        this.patient.medications = [...this.patient.medications, med];
        this.newPrescription = { name: '', dosage: '', frequency: '' };

        // Persist to backend
        this.patientService.updatePatientMedications(this.patient.id, this.patient.medications)
            .pipe(catchError(() => of(null)))
            .subscribe(() => this.snackBar.open('Medicamento guardado', 'Cerrar', { duration: 2000 }));
    }

    deletePrescription(index: number): void {
        if (!this.patient || !this.patient.medications) return;
        
        const list = [...this.patient.medications];
        list.splice(index, 1);
        this.patient.medications = list;

        // Persist to backend
        this.patientService.updatePatientMedications(this.patient.id, this.patient.medications)
            .pipe(catchError(() => of(null)))
            .subscribe(() => this.snackBar.open('Medicamento eliminado', 'Cerrar', { duration: 2000 }));
    }

    toggleAllergyEdit(): void {
        if (!this.isAllergyEditMode) {
            // Entering edit mode: populate input with current allergies
            this.editableAllergies = this.patient?.known_allergies || '';
            this.isAllergyEditMode = true;
        } else {
            this.saveAllergies();
        }
    }

    saveAllergies(): void {
        if (!this.patient) { this.isAllergyEditMode = false; return; }
        const newAllergies = this.editableAllergies.trim();
        this.patient = { ...this.patient, known_allergies: newAllergies };
        this.isAllergyEditMode = false;
        this.snackBar.open('Alergias actualizadas', 'Cerrar', { duration: 2000 });

        this.patientService.updateClinicalHistory(this.patient.id, {
            known_allergies: newAllergies
        }).pipe(catchError(() => of(null))).subscribe();
    }

    navigateToEdit(): void {
        if (this.patient) {
            this.router.navigate(['/dashboard/patients/edit', this.patient.id]);
        }
    }

    openClinicalHistory(): void {
        this.selectedTab = 1;
        // Optional: Scroll to tabs if needed
        const tabs = document.querySelector('mat-tab-group');
        if (tabs) {
            tabs.scrollIntoView({ behavior: 'smooth' });
        }
    }

    openCrisisReport(): void {
        const dialogRef = this.dialog.open(MeasurementDialogComponent, {
            width: '600px',
            data: { patientId: this.patient?.id, type: 'checkup' } // Default to checkup or symptom/crisis if supported
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result && this.patient) {
                this.snackBar.open('Medición registrada correctamente', 'Cerrar', { duration: 3000 });
                this.loadPatientData(this.patient.id);
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    getInitials(name: string): string {
        if (!name) return '??';
        const parts = name.split(' ').filter(n => n.length > 0);
        if (parts.length === 0) return '??';
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
    }

    getAllergiesList(allergies: string): string[] {
        if (!allergies) return [];
        return allergies.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
}
