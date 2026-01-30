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

// Chart.js
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { default as Annotation } from 'chartjs-plugin-annotation';

// Services & Models
import { PatientService } from '../../../core/services/patient.service';
import { InterventionService } from '../../../core/services/intervention.service';
import { Router } from '@angular/router';
import { WebSocketService } from '../../../core/services/websocket.service'; // Added
import { Patient, PEFTrend } from '../../../core/models/patient.model';

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

@Component({
    selector: 'app-patient-detail',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatTableModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatDividerModule,
        MatTooltipModule,
        BaseChartDirective
    ],
    providers: [provideCharts(withDefaultRegisterables(Annotation))],
    templateUrl: './patient-detail.component.html',
    styleUrls: ['./patient-detail.component.scss']
})
export class PatientDetailComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    loading = true;
    patient: Patient | null = null;
    history: any[] = []; // Using any for history items for now as strict typing wasn't provided for full history
    symptoms: Symptom[] = [];
    crisisHistory: any[] = [];
    vitalMetrics: VitalMetric[] = [];

    // Chart Config
    public pefChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                min: 0,
                title: { display: true, text: 'FEM (L/min)' }
            }
        },
        plugins: {
            legend: { display: true, position: 'bottom' },
            annotation: {
                annotations: {
                    line1: {
                        type: 'line',
                        yMin: 0,
                        yMax: 0,
                        borderColor: 'green',
                        borderWidth: 2,
                        borderDash: [6, 6],
                        label: { content: '80% Mejor Personal', display: true }
                    },
                    line2: {
                        type: 'line',
                        yMin: 0,
                        yMax: 0,
                        borderColor: '#FFC107',
                        borderWidth: 2,
                        borderDash: [6, 6],
                        label: { content: '50% Mejor Personal', display: true }
                    }
                }
            } as any
        }
    };
    public pefChartType: ChartType = 'line';
    public pefChartData: ChartData<'line'> = {
        labels: [],
        datasets: [
            {
                data: [],
                label: 'FEM Medido',
                borderColor: '#1976D2',
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    displayedCrisisColumns: string[] = ['date', 'severity', 'hospitalized', 'duration', 'trigger'];

    // ...
    interventions: any[] = [];

    constructor(
        private route: ActivatedRoute,
        private patientService: PatientService,
        private interventionService: InterventionService,
        private snackBar: MatSnackBar,
        private router: Router,
        private wsService: WebSocketService
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadPatientData(+id);
            this.setupRealtimeUpdates(+id);
        }
    }

    setupRealtimeUpdates(patientId: number): void {
        this.wsService.messages$
            .pipe(takeUntil(this.destroy$))
            .subscribe(msg => {
                // If message relates to current patient
                if ((msg.type === 'pef_update' || msg.type === 'new_symptom' || msg.type === 'risk_update') && msg.patientId === patientId) {
                    this.loadPatientData(patientId);
                }
            });
    }

    loadPatientData(id: number): void {
        this.loading = true;
        forkJoin({
            patient: this.patientService.getPatientById(id),
            history: this.patientService.getPatientHistory(id),
            pefTrend: this.patientService.getPEFTrend(id),
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
                    this.processVitalMetrics(this.patient);
                    this.setupChart(result.pefTrend, this.patient.personalBestPEF || 500); // Fallback best PEF 500
                }
            });
    }

    processHistory(history: any[]): void {
        // Separate symptoms from crises
        // Mocking structure logic here assuming 'type' property
        this.symptoms = history.filter(h => h.type !== 'crisis')
            .map(s => ({
                timestamp: s.timestamp,
                type: s.type,
                description: s.description || 'Síntoma registrado',
                severity: s.severity || 'low'
            }))
            .slice(0, 10); // Last 10 symptoms

        this.crisisHistory = history.filter(h => h.type === 'crisis').slice(0, 5);
    }

    processVitalMetrics(patient: Patient): void {
        // Logic to calculate colors/warnings
        const pefPercent = patient.personalBestPEF ? Math.round((patient.currentPEF / patient.personalBestPEF) * 100) : 0;

        this.vitalMetrics = [
            {
                label: 'FEM Actual',
                value: patient.currentPEF,
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
                value: 18, // Mocked as it might not be in base model
                unit: 'rpm',
                icon: 'waves',
                colorClass: 'text-blue-600'
            }
        ];
    }

    getMetricColorClass(value: number, type: 'pef' | 'spo2'): string {
        if (type === 'pef') {
            if (value > 80) return 'text-green-600';
            if (value >= 50) return 'text-yellow-600';
            return 'text-red-600';
        } else { // spo2
            if (value >= 95) return 'text-green-600';
            if (value >= 92) return 'text-yellow-600';
            return 'text-red-600';
        }
    }

    setupChart(trends: PEFTrend[], personalBest: number): void {
        const dates = trends.map(t => new Date(t.date).toLocaleDateString());
        const values = trends.map(t => t.pefValue);

        this.pefChartData = {
            labels: dates,
            datasets: [{
                data: values,
                label: 'FEM Medido',
                borderColor: '#1976D2',
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };

        // Annotations (Zones)
        const greenZone = personalBest * 0.8;
        const yellowZone = personalBest * 0.5;

        if (this.pefChartOptions?.plugins?.annotation?.annotations) {
            // Need to cast to any primarily because chartjs-plugin-annotation types can be tricky in strict mode
            const annotations = this.pefChartOptions.plugins.annotation.annotations as any;
            if (annotations.line1) annotations.line1.yMin = greenZone;
            if (annotations.line1) annotations.line1.yMax = greenZone;
            if (annotations.line2) annotations.line2.yMin = yellowZone;
            if (annotations.line2) annotations.line2.yMax = yellowZone;
        }
    }

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

    openInterventionForm(): void {
        if (this.patient) {
            this.router.navigate(['/dashboard/interventions/new'], { queryParams: { patientId: this.patient.id } });
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
