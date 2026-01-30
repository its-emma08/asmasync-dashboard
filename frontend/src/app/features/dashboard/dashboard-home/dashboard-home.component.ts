import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { RouterModule } from '@angular/router';

// Angular Material Lists
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

// Chart.js
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

// Services & Models
import { PatientService } from '../../../core/services/patient.service';
import { AlertService } from '../../../core/services/alert.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { DashboardMetrics } from '../../../core/models/dashboard.model';
import { Patient } from '../../../core/models/patient.model';

@Component({
    selector: 'app-dashboard-home',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatCardModule,
        MatIconModule,
        MatTableModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatDividerModule,
        MatChipsModule,
        BaseChartDirective
    ],
    providers: [provideCharts(withDefaultRegisterables())],
    templateUrl: './dashboard-home.component.html',
    styleUrls: ['./dashboard-home.component.scss']
})
export class DashboardHomeComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    isLoading = true;
    error = '';

    // KPIs
    metrics: DashboardMetrics = {
        totalPatients: 0,
        criticalAlerts: 0,
        moderateRisk: 0,
        interventionsToday: 0,
        riskDistribution: []
    };

    // Chart Configuration
    public barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        indexAxis: 'y', // Horizontal bar chart
        scales: {
            x: {
                min: 0,
            }
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: (context) => `Pacientes: ${context.raw}`
                }
            }
        }
    };
    public barChartType: ChartType = 'bar';
    public barChartData: ChartData<'bar'> = {
        labels: ['Bajo (Verde)', 'Moderado (Amarillo)', 'Crítico (Rojo)'],
        datasets: [
            {
                data: [0, 0, 0],
                backgroundColor: ['#4CAF50', '#FFC107', '#F44336'],
                hoverBackgroundColor: ['#43A047', '#FFB300', '#E53935']
            }
        ]
    };

    // Table Configuration
    priorityPatients: Patient[] = [];
    displayedColumns: string[] = ['fullName', 'riskLevel', 'currentPEF', 'lastUpdate', 'actions'];

    constructor(
        private patientService: PatientService,
        private alertService: AlertService,
        private wsService: WebSocketService
    ) { }

    ngOnInit(): void {
        this.loadDashboardData();
        this.setupRealtimeUpdates();
    }

    loadDashboardData(): void {
        this.isLoading = true;
        this.error = '';

        forkJoin({
            metrics: this.patientService.getDashboardMetrics(),
            priority: this.patientService.getPriorityPatients()
        })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: ({ metrics, priority }) => {
                    this.metrics = metrics;
                    this.priorityPatients = priority;
                    this.updateChartData(metrics.riskDistribution);
                    this.isLoading = false;
                },
                error: (err) => {
                    console.error('Error loading dashboard data', err);
                    this.error = 'No se pudieron cargar los datos del dashboard.';
                    this.isLoading = false;
                }
            });
    }

    updateChartData(distribution: { level: string; count: number }[]): void {
        // Map distribution to chart
        // Assuming distribution returns objects like { level: 'green', count: 10 }
        const green = distribution.find(d => d.level === 'green')?.count || 0;
        const yellow = distribution.find(d => d.level === 'yellow')?.count || 0;
        const red = distribution.find(d => d.level === 'red')?.count || 0;

        this.barChartData = {
            ...this.barChartData,
            datasets: [{
                ...this.barChartData.datasets[0],
                data: [green, yellow, red]
            }]
        };
    }

    setupRealtimeUpdates(): void {
        this.wsService.connect();

        this.wsService.messages$
            .pipe(takeUntil(this.destroy$))
            .subscribe((message) => {
                if (message.type === 'new_alert') {
                    // update metrics locally or reload
                    this.metrics.criticalAlerts++;
                    this.alertService.updateUnreadCount(this.metrics.criticalAlerts); // Sync navbar
                }
                else if (message.type === 'risk_update' || message.type === 'new_patient') {
                    this.loadDashboardData();
                }
            });
    }

    getRiskLabel(level: string): string {
        switch (level) {
            case 'red': return 'Crítico';
            case 'yellow': return 'Moderado';
            case 'green': return 'Bajo';
            default: return level;
        }
    }

    getRiskColor(level: string): string {
        switch (level) {
            case 'red': return 'warn';
            case 'yellow': return 'accent'; // Angular Material accent is usually pink/yellowish depending on theme, utilizing class for specific colors
            case 'green': return 'primary';
            default: return '';
        }
    }

    // Custom class helper because Material colors are limited (primary/accent/warn)
    getRiskClass(level: string): string {
        return `risk-badge risk-${level}`;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.wsService.disconnect();
    }
}
