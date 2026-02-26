import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subject, Subscription, forkJoin, Observable, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Services
import { PatientService } from '../../../core/services/patient.service';
import { AlertService } from '../../../core/services/alert.service';
import { Patient } from '../../../core/models/patient.model';
import { DashboardService, DashboardWidget } from '../services/dashboard.service';
import { DashboardMetrics } from '../../../core/models/dashboard.model';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';

// Components
import { DashboardWidgetComponent } from '../components/dashboard-widget/dashboard-widget.component';
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

// New Widgets
import { MedicationWidgetComponent } from '../components/widgets/medication-widget/medication-widget.component';
import { DeviceStatusWidgetComponent } from '../components/widgets/device-status-widget/device-status-widget.component';
import { ActScoreWidgetComponent } from '../components/widgets/act-score-widget/act-score-widget.component';
import { SingleKpiWidgetComponent } from '../components/widgets/single-kpi-widget/single-kpi-widget.component';
import { BirthdaysWidgetComponent } from '../components/widgets/birthdays-widget/birthdays-widget.component';
import { RemindersWidgetComponent } from '../components/widgets/reminders-widget/reminders-widget.component';
import { SkeletonCardComponent } from '../../../shared/components/skeleton-card/skeleton-card';
import { externalTooltipHandler } from '../../../shared/utils/chart-tooltip';

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
        DashboardWidgetComponent,
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
        SkeletonCardComponent,
        KpiGroupWidgetComponent // Moved to end
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
    isLoading = true;
    dataReady = false;
    metrics!: DashboardMetrics;
    urgentPatients: Patient[] = [];
    recentPatients: Patient[] = [];
    recentActivity: Activity[] = [];
    hasPatients: boolean = false;

    // Charts
    trendChartData: ChartConfiguration<'line'>['data'] = {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [
            {
                data: [65, 59, 80, 81, 56, 55, 40],
                label: 'PEF Promedio',
                borderColor: '#00B5AD',
                backgroundColor: (context: any) => {
                    if (!context.chart.ctx) return 'transparent';
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
                    gradient.addColorStop(0, 'rgba(0, 181, 173, 0.5)');
                    gradient.addColorStop(1, 'rgba(0, 181, 173, 0.0)');
                    return gradient;
                },
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointBackgroundColor: '#fff',
                borderWidth: 2
            },
            {
                data: [28, 48, 40, 19, 86, 27, 90],
                label: 'Uso Rescate',
                borderColor: '#94a3b8',
                backgroundColor: (context: any) => {
                    if (!context.chart.ctx) return 'transparent';
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
                    gradient.addColorStop(0, 'rgba(148, 163, 184, 0.4)');
                    gradient.addColorStop(1, 'rgba(148, 163, 184, 0.0)');
                    return gradient;
                },
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointBackgroundColor: '#fff',
                borderWidth: 2
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
        { title: 'Total Pacientes', value: 0, icon: 'groups', color: 'blue', trend: '+12%' },
        { title: 'Pacientes Activos', value: 0, icon: 'person_check', color: 'green', trend: '+5%' },
        { title: 'Alto Riesgo', value: 0, icon: 'warning', color: 'red', trend: '-2%' },
        { title: 'Controlados', value: 0, icon: 'thumb_up', color: 'cyan', trend: '+8%' }
    ];

    constructor(
        private patientService: PatientService,
        private dashboardService: DashboardService,
        private authService: AuthService,
        private router: Router,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private cd: ChangeDetectorRef,
        private loadingService: LoadingService,
        private alertService: AlertService
    ) {
        // ChangeDetectorRef injected to avoid ExpressionChangedAfterItHasBeenChecked errors
        this.widgets$ = this.dashboardService.widgets$;
        this.editMode$ = this.dashboardService.editMode$;
    }

    ngOnInit(): void {
        this.isLoading = true;
        this.cd.detectChanges();
        this.loadDashboardData();
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
        const confirmed = window.confirm('¿Estás seguro de restaurar el diseño original? Se perderán tus cambios personalizados.');
        if (confirmed) {
            // Remove keys used by DashboardService/StorageService
            localStorage.removeItem('asmasync_dashboard_widgets');
            localStorage.removeItem('asmasync_dashboard_layout');
            window.location.reload();
        }
    }

    deleteWidget(id: string): void {
        this.dashboardService.removeWidget(id);
    }

    resizeWidget(id: string): void {
        this.dashboardService.toggleWidgetSize(id);
    }

    onWidgetResize(event: { id: string, colSpan: number, rowSpan?: number }): void {
        this.dashboardService.updateWidgetSize(event.id, event.colSpan, event.rowSpan);
    }

    drop(event: CdkDragDrop<DashboardWidget[]>): void {
        if (event.previousIndex === event.currentIndex) return;
        this.dashboardService.reorderWidgets(event.previousIndex, event.currentIndex);
    }

    trackWidget(index: number, widget: DashboardWidget): string {
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



    triggerDemoAlert(): void {
        this.alertService.simulateAlert({
            type: Math.random() > 0.5 ? 'critical' : 'moderate',
            message: Math.random() > 0.5 ? 'Caída de PEF detectada (-25%)' : 'Uso excesivo de inhalador',
            patientName: Math.random() > 0.5 ? 'Demo Paciente A' : 'Demo Paciente B'
        });
        this.snackBar.open('🔔 Alerta de prueba enviada', 'OK', { duration: 2000, panelClass: 'glass-toast' });
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    markAsResolved(patient: Patient): void {
        this.patientService.resolveAlert(patient.id).subscribe(success => {
            if (success) {
                this.snackBar.open('Alerta resuelta', 'Cerrar', { duration: 3000 });
                this.urgentPatients = this.urgentPatients.filter(p => p.id !== patient.id);
                this.cd.detectChanges();
            }
        });
    }

    markAllAsResolved(): void {
        this.urgentPatients.forEach(p => this.markAsResolved(p));
    }

    private loadDashboardData(): void {
        this.isLoading = true;
        this.cd.detectChanges();

        // Real-time loading progress - Stage 1
        this.loadingService.updateProgress('Configurando dashboard...', 10);

        setTimeout(() => {
            this.loadingService.updateProgress('Cargando métricas...', 30);
        }, 200);

        combineLatest({
            metrics: this.patientService.getDashboardMetrics(),
            allPatients: this.patientService.getAllPatients()
        }).pipe(takeUntil(this.destroy$)).subscribe({
            next: ({ metrics, allPatients }) => {
                this.metrics = metrics;

                this.loadingService.updateProgress('Procesando métricas...', 50);

                // Update KPIs
                this.kpis[0].value = metrics.totalPatients;
                this.kpis[1].value = metrics.activePatients;
                this.kpis[2].value = metrics.riskDistribution.find(r => r.level === 'red')?.count || 0;

                // Filter Patients
                this.urgentPatients = allPatients.filter(p => p.riskLevel === 'red');
                this.recentPatients = allPatients.slice(0, 5);
                this.hasPatients = allPatients.length > 0;

                this.loadingService.updateProgress('Cargando actividad...', 70);

                // Mock Activity (Could be dynamic later)
                this.recentActivity = [
                    { id: '1', type: 'alert', description: 'Crisis detectada (PEF -30%)', time: new Date(), patientId: 'p1', patientName: 'Juan Pérez' },
                    { id: '2', type: 'medication', description: 'Dosis omitida', time: new Date(Date.now() - 3600000), patientId: 'p2', patientName: 'Ana García' }
                ];

                // CRITICAL: Ensure we have widgets. If empty, force reset.
                this.widgets$.pipe(takeUntil(this.destroy$)).subscribe(widgets => {
                    if (!widgets || widgets.length === 0) {
                        console.warn('Dashboard empty, resetting to default layout...');
                        this.dashboardService.resetLayout();
                    }
                });

                this.loadingService.updateProgress('Finalizando...', 90);

                // Ensure loading state is turned off only once initially or handled gracefully
                if (this.isLoading) {
                    setTimeout(() => {
                        this.isLoading = false;
                        this.dataReady = true;
                        this.cd.markForCheck(); // Trigger change detection manually

                        this.loadingService.updateProgress('Listo!', 100);
                        setTimeout(() => this.loadingService.hideLoading(), 300);
                    }, 400);
                } else {
                    this.cd.markForCheck(); // Just update view on subsequent emissions
                }
            },
            error: (err) => {
                console.error('Error loading dashboard', err);
                this.isLoading = false;
                this.cd.markForCheck();
                this.loadingService.hideLoading();
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
