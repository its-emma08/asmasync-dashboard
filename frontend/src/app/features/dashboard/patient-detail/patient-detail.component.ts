import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin, Subject, takeUntil, catchError, of } from 'rxjs';

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
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { default as Annotation } from 'chartjs-plugin-annotation';
import { externalTooltipHandler } from '../../../shared/utils/chart-tooltip';

// Services & Models
import { PatientService } from '../../../core/services/patient.service';
import { ClinicalService } from '../../../core/services/clinical.service';
import { InterventionService } from '../../../core/services/intervention.service';
import { Router } from '@angular/router';
import { WebSocketService } from '../../../core/services/websocket.service';
import { Patient, PEFTrend } from '../../../core/models/patient.model';
import { AgePipe } from '../../../shared/pipes/age-pipe';
import { SafeDatePipe } from '../../../shared/pipes/safe-date.pipe';
import { SkeletonProfileComponent } from '../../../shared/components/skeleton-profile/skeleton-profile';

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

import { ActionPlanWidgetComponent } from '../components/widgets/action-plan-widget/action-plan-widget';

@Component({
    selector: 'app-patient-detail',
    standalone: true,
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
        SkeletonProfileComponent,
        ActionPlanWidgetComponent // Widget for Action Plan
    ],
    providers: [provideCharts(withDefaultRegisterables(Annotation))],
    templateUrl: './patient-detail.component.html',
    styleUrls: ['./patient-detail.component.scss']
})
export class PatientDetailComponent implements OnInit, OnDestroy {

    // Chart Config


    private destroy$ = new Subject<void>();

    loading = true;
    patient: Patient | null = null;
    history: any[] = [];
    symptoms: Symptom[] = [];
    crisisHistory: any[] = [];
    vitalMetrics: VitalMetric[] = [];
    selectedTab = 0; // 0: Resumen, 1: Historial

    // Chart Config
    public pefChartOptions: ChartConfiguration['options'] = {
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
    public pefChartType: ChartType = 'line';
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
    interventions: any[] = [];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private patientService: PatientService,
        private clinicalService: ClinicalService,
        private interventionService: InterventionService,
        private wsService: WebSocketService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
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
            .pipe(takeUntil(this.destroy$))
            .subscribe(msg => {
                if ((msg.type === 'pef_update' || msg.type === 'new_symptom' || msg.type === 'risk_update') && msg.patientId === patientId) {
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
                    this.patientService.addClinicalRecord(this.patient.id, result);
                    this.handleSuccess('Registro clínico guardado (Local)');
                }
            }
        });
    }

    handleSuccess(msg: string) {
        this.snackBar.open(msg, 'Cerrar', { duration: 3000 });
        if (this.patient) this.loadPatientData(this.patient.id);
    }

    handleError(msg: string, err: any) {
        console.error(err);
        this.snackBar.open(msg, 'Cerrar', { duration: 3000 });
    }

    // ...

    loadPatientData(id: string | number): void {
        this.loading = true;
        forkJoin({
            patient: this.patientService.getPatientById(id),
            history: this.patientService.getPatientHistory(id), // Timeline events
            chartData: this.clinicalService.getPatientHistory(id), // Chart data { pef: [], ... }
            interventions: this.interventionService.getInterventionsByPatient(id)
        })
            .pipe(
                takeUntil(this.destroy$),
                catchError(err => {
                    console.error(err);
                    this.snackBar.open('Error cargando datos del paciente', 'Cerrar', { duration: 5000 });
                    return of(null);
                })
            )
            .subscribe(result => {
                this.loading = false;
                if (result) {
                    this.patient = result.patient;
                    this.history = result.history || [];
                    this.interventions = result.interventions || [];

                    this.processHistory(this.history);

                    // Map ClinicalHistory to Charts
                    const chartData = result.chartData;
                    this.setupRealCharts(chartData, this.patient.personal_best_pef || 500);

                    // Update latest metrics from history if available
                    if (chartData.pef && chartData.pef.length > 0) {
                        const lastPef = chartData.pef[chartData.pef.length - 1].y;
                        this.patient.latest_pef = lastPef; // Update local view
                    }
                    if (chartData.spo2 && chartData.spo2.length > 0) {
                        const lastSpo2 = chartData.spo2[chartData.spo2.length - 1].y;
                        this.patient.currentSpO2 = lastSpo2;
                    }

                    this.processVitalMetrics(this.patient);
                }
            });
    }

    setupRealCharts(history: any, personalBest: number): void {
        const pefData = history.pef || [];
        // Sort by date just in case
        pefData.sort((a: any, b: any) => new Date(a.x).getTime() - new Date(b.x).getTime());

        const dates = pefData.map((d: any) => new Date(d.x).toLocaleDateString());
        const values = pefData.map((d: any) => d.y);

        this.pefChartData = {
            labels: dates,
            datasets: [{
                data: values,
                label: 'FEM Medido',
                borderColor: '#00B5AD',
                backgroundColor: (context) => {
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
                value: patient.respiratoryRate || 18,
                unit: 'rpm',
                icon: 'waves',
                colorClass: 'text-blue-600'
            }
        ];
    }

    getMetricColorClass(value: number, type: 'pef' | 'spo2'): string {
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
                backgroundColor: (context) => {
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

    exportPDF(): void {
        window.print();
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
            { key: 'email', weight: 15 },
            { key: 'phone', weight: 15 },
            { key: 'background', weight: 10 },
            { key: 'emergencyContact', weight: 20 },
            { key: 'date_of_birth', weight: 10 },
            { key: 'gender', weight: 5 },
            { key: 'asthma_type', weight: 10 },
            { key: 'personal_best_pef', weight: 15 }
        ];

        fields.forEach(f => {
            total += f.weight;
            const val = (this.patient as any)[f.key];
            if (val && (typeof val === 'object' ? Object.keys(val).length > 0 : true)) {
                score += f.weight;
            }
        });

        // Normalize to 100 just in case weights don't sum up perfectly
        return Math.round((score / total) * 100);
    }

    // Legacy mapping support if needed or ensure models match
    getRiskLabel(level: string): string {
        switch (level) {
            case 'red': return 'RIESGO ALTO - Alerta de Crisis';
            case 'yellow': return 'RIESGO MODERADO - Seguimiento Cercano';
            case 'green': return 'RIESGO BAJO - Estable';
            default: return level;
        }
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

    saveClinicalNote(): void {
        if (!this.clinicalNote.trim()) return;

        const newRecord = {
            date: new Date().toISOString(),
            type: 'evolution',
            description: 'Nota de Evolución',
            notes: this.clinicalNote,
            doctor: 'Dr. Astudillo'
        };

        // Add to local history for immediate feedback
        this.history.unshift(newRecord);
        this.history = [...this.history]; // Trigger change detection
        this.clinicalNote = '';

        this.snackBar.open('Nota de evolución guardada', 'Cerrar', { duration: 3000 });
    }

    addPrescription(): void {
        if (!this.newPrescription.name || !this.newPrescription.dosage) return;

        if (!this.patient) return;

        // Mock update local state
        if (!this.patient.medications) this.patient.medications = [];

        this.patient.medications.push({
            name: this.newPrescription.name,
            dosage: this.newPrescription.dosage,
            frequency: this.newPrescription.frequency || 'Cada 8 hrs'
        });

        this.newPrescription = { name: '', dosage: '', frequency: '' };
        this.snackBar.open('Medicamento prescrito exitosamente', 'Cerrar', { duration: 3000 });
    }

    toggleAllergyEdit(): void {
        this.isAllergyEditMode = !this.isAllergyEditMode;
    }

    saveAllergies(): void {
        this.isAllergyEditMode = false;
        this.snackBar.open('Alergias actualizadas', 'Cerrar', { duration: 3000 });
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
                this.patientService.addClinicalRecord(this.patient.id, result);
                this.snackBar.open('Crisis registrada', 'Cerrar', { duration: 3000 });
                this.loadPatientData(this.patient.id);
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
