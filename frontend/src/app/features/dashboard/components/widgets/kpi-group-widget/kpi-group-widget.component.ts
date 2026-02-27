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

    private readonly COLOR_MAP: Record<string, { accent: string; bubble: string; progress: string; text: string }> = {
        'text-teal-500': { accent: 'accent-teal', bubble: 'bubble-teal', progress: 'fill-teal', text: 'text-teal-500' },
        'text-cyan-500': { accent: 'accent-teal', bubble: 'bubble-teal', progress: 'fill-teal', text: 'text-teal-500' },
        'text-red-500': { accent: 'accent-red', bubble: 'bubble-red', progress: 'fill-red', text: 'text-red-500' },
        'text-rose-500': { accent: 'accent-red', bubble: 'bubble-red', progress: 'fill-red', text: 'text-red-500' },
        'text-green-500': { accent: 'accent-green', bubble: 'bubble-green', progress: 'fill-green', text: 'text-green-500' },
        'text-emerald-500': { accent: 'accent-green', bubble: 'bubble-green', progress: 'fill-green', text: 'text-green-500' },
        'text-yellow-500': { accent: 'accent-yellow', bubble: 'bubble-yellow', progress: 'fill-yellow', text: 'text-yellow-500' },
        'text-amber-500': { accent: 'accent-yellow', bubble: 'bubble-yellow', progress: 'fill-yellow', text: 'text-yellow-500' },
        'text-purple-500': { accent: 'accent-purple', bubble: 'bubble-purple', progress: 'fill-purple', text: 'text-purple-500' },
        'text-violet-500': { accent: 'accent-purple', bubble: 'bubble-purple', progress: 'fill-purple', text: 'text-purple-500' },
    };

    private getColors(kpi: any) {
        // Try exact match on kpi.color
        if (kpi.color && this.COLOR_MAP[kpi.color]) return this.COLOR_MAP[kpi.color];
        // Fallback by position index
        const fallbacks = ['accent-teal', 'accent-red', 'accent-green', 'accent-yellow'];
        return { accent: 'accent-teal', bubble: 'bubble-teal', progress: 'fill-teal', text: 'text-teal-500' };
    }

    private updateVisibility(): void {
        const max = this.kpis.length || 4;
        this.visibleCount = max;
        this.visibleKpis = this.kpis.slice(0, this.visibleCount).map((kpi, i) => {
            const colorSet = this.COLOR_MAP[kpi.color] ||
                Object.values(this.COLOR_MAP)[i % Object.values(this.COLOR_MAP).length];
            return {
                ...kpi,
                timeframe: kpi.timeframe || 'Hoy',
                accentClass: colorSet.accent,
                bubbleClass: colorSet.bubble,
                progressColorClass: colorSet.progress,
                textColorClass: colorSet.text,
            };
        });
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
