import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
    selector: 'app-kpi-group-widget',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatProgressBarModule, MatMenuModule, MatButtonModule],
    templateUrl: './kpi-group-widget.component.html',
    styleUrls: ['./kpi-group-widget.component.scss']
})
export class KpiGroupWidgetComponent implements OnChanges {
    @Input() kpis: any[] = [];
    @Input() colSpan: number = 12;

    visibleKpis: any[] = [];
    visibleCount = 4;

    constructor(private router: Router) { }

    ngOnChanges(): void {
        this.updateVisibility();
    }

    private updateVisibility(): void {
        const max = this.kpis.length || 4;

        // If colSpan >= 4 in a 4-col grid = full width, show all 4
        // colSpan is the raw Tailwind col-span number, NOT a percentage
        let calculated: number;
        if (max <= 1) {
            calculated = 1;
        } else {
            // Always try to show all KPIs; visibility is controlled by responsive Tailwind grid on parent
            calculated = max;
        }

        this.visibleCount = Math.min(max, calculated);
        this.visibleKpis = this.kpis.slice(0, this.visibleCount).map(kpi => ({
            ...kpi,
            timeframe: 'Hoy' // Default timeframe
        }));
    }

    onTimeframeChange(kpi: any, timeframe: string): void {
        kpi.timeframe = timeframe;
        // Mock data update to demonstrate interactivity
        const adjustment = Math.floor(Math.random() * 10) - 5;
        kpi.value = Math.max(0, kpi.value + adjustment);
        kpi.trend = adjustment >= 0 ? 'up' : 'down';
        kpi.trendValue = `${Math.abs(adjustment)}%`;

        // Prevent click propagation
        event?.stopPropagation();
    }

    navigateToDetail(kpi: any): void {
        // Simple routing logic based on KPI title
        if (kpi.title.includes('Pacientes')) {
            this.router.navigate(['/dashboard/patients']);
        } else if (kpi.title.includes('Riesgo')) {
            this.router.navigate(['/dashboard/patients'], { queryParams: { filter: 'risk' } });
        }
        // Add more routes as needed
    }
}
