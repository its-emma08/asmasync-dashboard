import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, effect, inject, EffectRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Subject, forkJoin, Observable, combineLatest, BehaviorSubject } from 'rxjs';
import { takeUntil, take, map } from 'rxjs/operators';

// Services
import { PatientService } from '../../../core/services/patient.service';
import { AlertService } from '../../../core/services/alert.service';
import { Patient } from '../../../core/models/patient.model';
import { DashboardService, DashboardWidget } from '../services/dashboard.service';
import { DashboardMetrics } from '../../../core/models/dashboard.model';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';
import { RenderWeeklyTrend } from '../../../core/models/measurement.interfaces';
import { WeatherService } from '../../../core/services/weather.service';

// Components
import { WidgetShellComponent, WidgetSize } from '../components/widget-shell/widget-shell.component';
import { KpiGroupWidgetComponent } from '../components/widgets/kpi-group-widget/kpi-group-widget.component';
import { AlertsWidgetComponent } from '../components/widgets/alerts-widget/alerts-widget.component';
import { PatientsTableWidgetComponent } from '../components/widgets/patients-table-widget/patients-table-widget.component';
import { TrendWidgetComponent } from '../components/widgets/trend-widget/trend-widget.component';
import { ActivityWidgetComponent } from '../components/widgets/activity-widget/activity-widget.component';
import { WeatherWidgetComponent } from '../components/widgets/weather-widget/weather-widget.component';
import { CalendarWidgetComponent } from '../components/widgets/calendar-widget/calendar-widget.component';
import { QuickActionsWidgetComponent } from '../components/widgets/quick-actions-widget/quick-actions-widget.component';
import { ShortcutsWidgetComponent } from '../components/widgets/shortcuts-widget/shortcuts-widget.component';

import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

interface Activity {
    id: string;
    type: 'alert' | 'medication' | 'symptom';
    description: string;
    time: Date;
    patientId: string;
    patientName: string;
}

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { WidgetAddDialogComponent } from '../components/widget-add-dialog/widget-add-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

// New Widgets
import { MedicationWidgetComponent } from '../components/widgets/medication-widget/medication-widget.component';
import { DeviceStatusWidgetComponent } from '../components/widgets/device-status-widget/device-status-widget.component';
import { ActScoreWidgetComponent } from '../components/widgets/act-score-widget/act-score-widget.component';
import { SingleKpiWidgetComponent } from '../components/widgets/single-kpi-widget/single-kpi-widget.component';
import { BirthdaysWidgetComponent } from '../components/widgets/birthdays-widget/birthdays-widget.component';
import { RemindersWidgetComponent } from '../components/widgets/reminders-widget/reminders-widget.component';
import { SkeletonDashboardComponent } from '../../../shared/components/skeleton-dashboard/skeleton-dashboard.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { externalTooltipHandler } from '../../../shared/utils/chart-tooltip';
import { EmergencyProtocolComponent } from '../../../shared/components/emergency-protocol/emergency-protocol.component';
import { NotificationService } from '../../../core/services/notification.service';


@Component({
    selector: 'app-dashboard-home',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatMenuModule,
        MatDividerModule,
        MatSnackBarModule,
        MatDialogModule,
        MatTooltipModule,
        DragDropModule,
        WidgetShellComponent,
        AlertsWidgetComponent,
        PatientsTableWidgetComponent,
        TrendWidgetComponent,
        ActivityWidgetComponent,
        WeatherWidgetComponent,
        CalendarWidgetComponent,
        QuickActionsWidgetComponent,
        MedicationWidgetComponent,
        DeviceStatusWidgetComponent,
        ActScoreWidgetComponent,
        SingleKpiWidgetComponent,
        BirthdaysWidgetComponent,
        RemindersWidgetComponent,
        ShortcutsWidgetComponent,
        EmptyStateComponent,
        KpiGroupWidgetComponent,
        SkeletonDashboardComponent
    ],
    providers: [
        provideCharts(withDefaultRegisterables())
    ],
    templateUrl: './dashboard-home.component.html',
    styleUrls: ['./dashboard-home.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardHomeComponent implements OnInit, OnDestroy {
    widgets$: Observable<DashboardWidget[]>;
    editMode$: Observable<boolean>;
    destroy$ = new Subject<void>();
    private emergencyEffectRef?: EffectRef;
    isLoading = true;
    dataReady = false;
    metrics!: DashboardMetrics;
    urgentPatients: Patient[] = [];
    recentPatients: Patient[] = [];
    recentActivity: Activity[] = [];
    hasPatients: boolean = false;
    rawMeasurements: any[] = [];
    activeTrendPeriod = '7d';

    // Charts
    trendChartData: ChartConfiguration<'line'>['data'] = {
        labels: [],
        datasets: [
            {
                data: [],
                label: 'PEF (L/min)',
                borderColor: '#2563EB',
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    if (!ctx) return 'transparent';
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.1)');
                    gradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');
                    return gradient;
                },
                tension: 0.4,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 5,
                pointBackgroundColor: '#2563EB',
                pointBorderColor: '#fff',
                borderWidth: 2
            },
            {
                data: [],
                label: 'FEV1 (L)',
                borderColor: '#cbd5e1',
                backgroundColor: 'transparent',
                tension: 0.4,
                fill: false,
                pointRadius: 3,
                pointHoverRadius: 5,
                pointBackgroundColor: '#cbd5e1',
                pointBorderColor: '#fff',
                borderWidth: 2,
                borderDash: [5, 5]
            }
        ]
    };

    trendChartOptions: ChartConfiguration<'line'>['options'] = {
        responsive: true,
        maintainAspectRatio: false, // CRITICAL for fluid resizing
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    font: { family: "'Quicksand', sans-serif", size: 12 },
                    padding: 20
                }
            },
            tooltip: {
                enabled: false,
                external: externalTooltipHandler
            }
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: { font: { family: "'Quicksand', sans-serif", size: 10 }, color: '#94a3b8' }
            },
            y: {
                grid: { color: 'rgba(226, 232, 240, 0.4)', drawTicks: false },
                border: { dash: [4, 4], display: false },
                ticks: { display: true, font: { family: "'Quicksand', sans-serif", size: 10 }, color: '#94a3b8' }
            }
        },
        interaction: {
            mode: 'index',
            intersect: false,
        }
    };

    kpis = [
        { title: 'Total Pacientes', value: 0, icon: 'groups', color: 'blue', trend: '', progress: 100 },
        { title: 'Pacientes Activos', value: 0, icon: 'person_check', color: 'green', trend: '', progress: 0 },
        { title: 'Alto Riesgo', value: 0, icon: 'warning', color: 'red', trend: '', progress: 0 },
        { title: 'Controlados', value: 0, icon: 'thumb_up', color: 'cyan', trend: '', progress: 0 }
    ];

    kpisSubject = new BehaviorSubject<any[]>(this.kpis);

    public alertService = inject(AlertService); // Changed to inject
    private notificationService = inject(NotificationService); // Added

    public weatherService = inject(WeatherService);
    get weather() { return this.weatherService.currentWeather(); }

    constructor(
        private patientService: PatientService,
        private dashboardService: DashboardService,
        private authService: AuthService,
        private router: Router,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private cd: ChangeDetectorRef,
        private loadingService: LoadingService
    ) {
        // ChangeDetectorRef injected to avoid ExpressionChangedAfterItHasBeenChecked errors
        this.widgets$ = combineLatest([
            this.dashboardService.widgets$,
            this.kpisSubject
        ]).pipe(
            map(([widgets, kpis]) => widgets.map(w => {
                if (w.type === 'single-kpi') {
                    const config = { ...w.config };
                    if (config.icon === 'groups') {
                        config.value = kpis[0].value;
                        config.progressValue = 100;
                        config.progressLabel = 'Capacidad';
                    } else if (config.icon === 'person_check') {
                        config.value = kpis[1].value;
                        config.progressValue = kpis[1].progress;
                        config.progressLabel = 'Proporción';
                    } else if (config.icon === 'warning') {
                        config.value = kpis[2].value;
                        config.progressValue = kpis[2].progress;
                        config.progressLabel = 'Proporción';
                    } else if (config.icon === 'thumb_up') {
                        config.value = kpis[3].value;
                        config.progressValue = kpis[3].progress;
                        config.progressLabel = 'Proporción';
                    }
                    return { ...w, config };
                }
                return w;
            }))
        );
        this.editMode$ = this.dashboardService.editMode$;

        // CRITICAL: Ensure we have widgets. If empty, force reset.
        this.widgets$.pipe(takeUntil(this.destroy$)).subscribe(widgets => {
            if (!widgets || widgets.length === 0) {
                // console.warn('Dashboard empty, resetting to default layout...');
                this.dashboardService.resetLayout();
            }
        });

        // Effect to trigger emergency protocol if status turns RED
        this.emergencyEffectRef = effect(() => {
            const status = this.alertService.healthStatus();
            if (status === 'Red') {
                this.dialog.open(EmergencyProtocolComponent, {
                    width: '450px',
                    disableClose: true,
                    panelClass: 'emergency-modal-panel'
                });
                // Reactive Push Notification Trigger
                this.notificationService.triggerCriticalAlert(this.authService.currentUserValue?.full_name || 'Paciente');
            }
        });
    }

    ngOnInit(): void {
        this.isLoading = true;
        this.cd.detectChanges();

        // Start loading data immediately
        this.loadDashboardData();

        // Request notification permission non-intrusively
        setTimeout(() => {
            this.notificationService.requestPermission();
        }, 3000);
    }

    openAddWidgetDialog(): void {
        const dialogRef = this.dialog.open(WidgetAddDialogComponent, {
            width: '850px',
            maxHeight: '90vh',
            panelClass: 'custom-dialog-container',
            data: {}
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.dashboardService.addWidget(result);
                this.snackBar.open('Widget agregado exitosamente', 'Cerrar', { duration: 3000 });
            }
        });
    }

    toggleEdit(): void {
        this.dashboardService.toggleEditMode();
    }

    /**
     * EMERGENCY FIX: Reset Layout
     * Clears corrupted local storage and reloads default state.
     */
    resetLayout(): void {
        this.dialog.open(ConfirmDialogComponent, {
            width: '380px',
            data: {
                title: 'Restaurar diseño',
                message: '¿Estás seguro de restaurar el diseño original? Se perderán tus cambios personalizados.',
                confirmText: 'Restaurar',
                cancelText: 'Cancelar',
                isDestructive: true
            }
        }).afterClosed().subscribe(confirmed => {
            if (confirmed) {
                this.dashboardService.resetLayout();
                this.snackBar.open('Diseño restaurado', 'Cerrar', { duration: 3000 });
            }
        });
    }

    deleteWidget(id: string): void {
        this.dashboardService.removeWidget(id);
    }


    drop(event: CdkDragDrop<DashboardWidget[]>): void {
        if (event.previousIndex === event.currentIndex) return;
        this.dashboardService.reorderWidgets(event.previousIndex, event.currentIndex);
    }

    trackWidget(_index: number, widget: DashboardWidget): string {
        return widget.id;
    }

    addWidget(type: DashboardWidget['type'], subType?: string): void {
        this.dashboardService.addWidget(type, subType);
    }

    showFeatureComingSoon(featureName: string): void {
        this.snackBar.open(`🛠️ La función "${featureName}" estará disponible próximamente.`, 'Entendido', {
            duration: 3000,
            panelClass: 'glass-toast'
        });
    }



    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    markAsResolved(patient: Patient): void {
        // Optimistic UI update: Remove immediately
        const previousUrgent = [...this.urgentPatients];
        this.urgentPatients = this.urgentPatients.filter(p => p.id !== patient.id);
        this.cd.detectChanges();

        this.patientService.resolveAlert(patient.id).pipe(take(1)).subscribe({
            next: (success) => {
                if (success) {
                    this.snackBar.open(`Alerta de ${patient.full_name} resuelta`, 'Cerrar', { duration: 3000 });
                } else {
                    // Rollback if service returns false
                    this.urgentPatients = previousUrgent;
                    this.cd.detectChanges();
                }
            },
            error: (_err) => {
                this.snackBar.open('Error al resolver la alerta', 'Cerrar', { duration: 3000 });
                // Rollback on error
                this.urgentPatients = previousUrgent;
                this.cd.detectChanges();
            }
        });
    }

    markAllAsResolved(): void {
        this.urgentPatients.forEach(p => this.markAsResolved(p));
    }

    private renderTrendChart(trend: RenderWeeklyTrend): void {
        this.trendChartData.labels = trend.dates;
        this.trendChartData.datasets[0].data = trend.pef_values;
        this.trendChartData.datasets[1].data = trend.fev1_values;
        this.cd.markForCheck();
    }

    public async loadDashboardData(): Promise<void> {
        this.isLoading = true;
        this.cd.detectChanges();
        this.loadingService.updateProgress('Cargando métricas...', 10);

        // Etapa 1: métricas, pacientes y priority-patients en paralelo
        forkJoin({
            metrics: this.patientService.getDashboardMetrics(),
            allPatients: this.patientService.getAllPatients(),
            priorityPatients: this.patientService.getPriorityPatients(),
            doctorStats: this.patientService.getDoctorStats()
        }).pipe(takeUntil(this.destroy$)).subscribe({
            next: ({ metrics, allPatients, priorityPatients, doctorStats }) => {
                this.metrics = metrics;

                if (metrics?.averagePef) {
                    this.alertService.updateHealthStatus(metrics.averagePef, 600);
                }

                // Use doctor stats for more accurate KPIs if available
                const stats = doctorStats;
                const total = stats?.total_patients ?? metrics?.totalPatients ?? 0;
                const active = stats?.active_patients ?? metrics?.activePatients ?? 0;
                const critical = stats?.critical_count ?? metrics?.riskDistribution?.find((r: any) => r.level === 'high')?.count ?? 0;
                const controlled = stats?.controlled_count ?? metrics?.riskDistribution?.find((r: any) => r.level === 'low')?.count ?? 0;

                this.kpis[0].value = total;
                this.kpis[1].value = active;
                this.kpis[2].value = critical;
                this.kpis[3].value = controlled;

                // Calculate dynamic progress based on real data
                this.kpis[0].progress = 100; // Total is always 100% of itself
                this.kpis[1].progress = total > 0 ? Math.round((active / total) * 100) : 0;
                this.kpis[2].progress = total > 0 ? Math.round((critical / total) * 100) : 0;
                this.kpis[3].progress = total > 0 ? Math.round((controlled / total) * 100) : 0;

                this.kpisSubject.next(this.kpis);

                const patientsList = allPatients ?? [];
                // Use priority-patients from API; fall back to filtering locally
                this.urgentPatients = (priorityPatients?.length 
                    ? priorityPatients 
                    : patientsList.filter(p => p.riskLevel === 'high')
                ).filter(p => p && p.id); // remove null/incomplete entries
                this.recentPatients = patientsList.filter(p => p && p.id).slice(0, 5);
                this.hasPatients = patientsList.length > 0;
                const activities: Activity[] = [];
                patientsList.forEach((p: any, idx: number) => {
                    if (!p || !p.id) return; // skip incomplete patient records
                    const baselineTime = new Date();
                    const pName = p.full_name || 'Paciente';
                    if (p.riskLevel === 'high') {
                        activities.push({
                            id: `act_alert_${p.id}`,
                            type: 'alert',
                            description: `Descenso de flujo PEF detectado (${p.latest_pef || '—'} L/min)`,
                            time: new Date(baselineTime.getTime() - (idx * 45 * 60 * 1000) - (15 * 60 * 1000)),
                            patientId: p.id,
                            patientName: pName
                        });
                    }
                    if (p.current_medications) {
                        const meds = p.current_medications.split(',');
                        if (meds.length > 0 && idx % 2 === 0) {
                            activities.push({
                                id: `act_med_${p.id}`,
                                type: 'medication',
                                description: `Dosis de ${meds[0].trim()} registrada`,
                                time: new Date(baselineTime.getTime() - (idx * 90 * 60 * 1000) - (30 * 60 * 1000)),
                                patientId: p.id,
                                patientName: pName
                            });
                        }
                    }
                    if ((p.riskLevel === 'moderate' || p.riskLevel === 'high') && idx % 3 === 0) {
                        activities.push({
                            id: `act_sym_${p.id}`,
                            type: 'symptom',
                            description: `Reporte de sibilancias y tos moderada`,
                            time: new Date(baselineTime.getTime() - (idx * 120 * 60 * 1000) - (60 * 60 * 1000)),
                            patientId: p.id,
                            patientName: pName
                        });
                    }
                });
                
                this.recentActivity = activities
                    .sort((a, b) => b.time.getTime() - a.time.getTime())
                    .slice(0, 5);

                // Dashboard visible sin esperar la gráfica de tendencia
                this.isLoading = false;
                this.dataReady = true;
                this.loadingService.updateProgress('Listo!', 100);
                this.cd.markForCheck();
                setTimeout(() => this.loadingService.hideLoading(), 300);
            },
            error: (err) => {
                console.error('Error loading dashboard', err);
                this.isLoading = false;
                this.dataReady = true;
                this.cd.markForCheck();
                this.loadingService.hideLoading();
            }
        });

        // Etapa 2: tendencia del paciente más crítico (tiene mediciones reales del WearOS)
        // Se ejecuta después de Etapa 1 para poder usar urgentPatients[0].id
        // La gráfica simplemente queda vacía si no hay pacientes o fallan los datos
        this.patientService.getAllPatients()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (patients) => {
                    const topPatient = (patients ?? [])
                        .find(p => p.riskLevel === 'high') ?? (patients ?? [])[0];
                    if (!topPatient?.id) return;

                    this.patientService.getPatientById(topPatient.id)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: (detail) => {
                                const measurements: any[] = detail?.recent_measurements ?? [];
                                if (!measurements.length) return;

                                this.rawMeasurements = [...measurements]
                                    .filter(m => m.pef)
                                    .sort((a, b) =>
                                        new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
                                    );

                                this.filterAndRenderTrend();
                            },
                            error: () => {}
                        });
                },
                error: () => {}
            });
    }

    onTrendPeriodChange(period: string): void {
        this.activeTrendPeriod = period;
        this.filterAndRenderTrend();
    }

    filterAndRenderTrend(): void {
        if (!this.rawMeasurements.length) return;
        const now = new Date();
        let filtered = [...this.rawMeasurements];

        if (this.activeTrendPeriod === 'hoy') {
            const todayStr = now.toDateString();
            filtered = this.rawMeasurements.filter(m => new Date(m.measured_at).toDateString() === todayStr);
        } else if (this.activeTrendPeriod === '7d') {
            const limit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = this.rawMeasurements.filter(m => new Date(m.measured_at) >= limit);
        } else if (this.activeTrendPeriod === '30d') {
            const limit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filtered = this.rawMeasurements.filter(m => new Date(m.measured_at) >= limit);
        }

        const trend: RenderWeeklyTrend = {
            dates: filtered.map(m => {
                const date = new Date(m.measured_at);
                if (this.activeTrendPeriod === 'hoy') {
                    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
                }
                return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
            }),
            pef_values: filtered.map(m => m.pef),
            fev1_values: filtered.map(m => m.fev1 ?? 0),
            spo2_values: filtered.map(m => m.spo2 ?? 0)
        };
        this.renderTrendChart(trend);
        this.cd.markForCheck();
    }

    getWidgetConfig(widget: DashboardWidget): any {
        if (widget.type !== 'single-kpi') return widget.config;
        const config = { ...widget.config };
        const label = config.label || '';
        
        if (label === 'Pacientes') {
            config.value = this.kpis[0].value;
            config.progressValue = 100;
        } else if (label === 'Activos') {
            config.value = this.kpis[1].value;
            config.progressValue = this.kpis[1].progress;
        } else if (label === 'Riesgo') {
            config.value = this.kpis[2].value;
            config.progressValue = this.kpis[2].progress;
        } else if (label === 'Controlados') {
            config.value = this.kpis[3].value;
            config.progressValue = this.kpis[3].progress;
        }
        return config;
    }

    ngOnDestroy(): void {
        if (this.emergencyEffectRef) {
            this.emergencyEffectRef.destroy();
        }
        this.destroy$.next();
        this.destroy$.complete();
    }
}
