import { Component, Input, OnChanges, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
    selector: 'app-kpi-group-widget',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, MatIconModule, MatProgressBarModule, MatMenuModule, MatButtonModule],
    templateUrl: './kpi-group-widget.component.html',
    styleUrls: ['./kpi-group-widget.component.scss']
})
export class KpiGroupWidgetComponent implements OnChanges, OnDestroy {
    @Input() kpis: any[] = [];
    @Input() colSpan: number = 12;
    private animationIds: number[] = [];

    visibleKpis: any[] = [];
    visibleCount = 4;

    constructor(private router: Router, private cdr: ChangeDetectorRef) { }

    ngOnChanges(): void {
        this.updateVisibility();
    }

    private readonly COLOR_MAP: Record<string, { accent: string; bubble: string; progress: string; text: string }> = {
        // Full Tailwind class keys
        'text-teal-500':   { accent: 'accent-teal',   bubble: 'bubble-teal',   progress: 'fill-teal',   text: 'text-teal-500' },
        'text-cyan-500':   { accent: 'accent-teal',   bubble: 'bubble-teal',   progress: 'fill-teal',   text: 'text-teal-500' },
        'text-blue-500':   { accent: 'accent-teal',   bubble: 'bubble-teal',   progress: 'fill-teal',   text: 'text-blue-500' },
        'text-red-500':    { accent: 'accent-red',    bubble: 'bubble-red',    progress: 'fill-red',    text: 'text-red-500' },
        'text-rose-500':   { accent: 'accent-red',    bubble: 'bubble-red',    progress: 'fill-red',    text: 'text-red-500' },
        'text-green-500':  { accent: 'accent-green',  bubble: 'bubble-green',  progress: 'fill-green',  text: 'text-green-500' },
        'text-emerald-500':{ accent: 'accent-green',  bubble: 'bubble-green',  progress: 'fill-green',  text: 'text-green-500' },
        'text-yellow-500': { accent: 'accent-yellow', bubble: 'bubble-yellow', progress: 'fill-yellow', text: 'text-yellow-500' },
        'text-amber-500':  { accent: 'accent-yellow', bubble: 'bubble-yellow', progress: 'fill-yellow', text: 'text-yellow-500' },
        'text-purple-500': { accent: 'accent-purple', bubble: 'bubble-purple', progress: 'fill-purple', text: 'text-purple-500' },
        'text-violet-500': { accent: 'accent-purple', bubble: 'bubble-purple', progress: 'fill-purple', text: 'text-purple-500' },
        // Simple name aliases (used by dashboard-home.component.ts)
        'blue':   { accent: 'accent-teal',   bubble: 'bubble-teal',   progress: 'fill-teal',   text: 'text-blue-500' },
        'green':  { accent: 'accent-green',  bubble: 'bubble-green',  progress: 'fill-green',  text: 'text-green-500' },
        'red':    { accent: 'accent-red',    bubble: 'bubble-red',    progress: 'fill-red',    text: 'text-red-500' },
        'cyan':   { accent: 'accent-teal',   bubble: 'bubble-teal',   progress: 'fill-teal',   text: 'text-teal-500' },
        'yellow': { accent: 'accent-yellow', bubble: 'bubble-yellow', progress: 'fill-yellow', text: 'text-yellow-500' },
        'purple': { accent: 'accent-purple', bubble: 'bubble-purple', progress: 'fill-purple', text: 'text-purple-500' },
        'orange': { accent: 'accent-yellow', bubble: 'bubble-yellow', progress: 'fill-yellow', text: 'text-amber-500' },
    };

    private updateVisibility(): void {
        const max = this.kpis.length || 4;
        this.visibleCount = max;
        this.visibleKpis = this.kpis.slice(0, this.visibleCount).map((kpi, i) => {
            const colorSet = this.COLOR_MAP[kpi.color] ||
                Object.values(this.COLOR_MAP)[i % Object.values(this.COLOR_MAP).length];
            
            const animatedValue = kpi.value;
            return {
                ...kpi,
                displayValue: 0,
                targetValue: animatedValue,
                timeframe: kpi.timeframe || 'Hoy',
                accentClass: colorSet.accent,
                bubbleClass: colorSet.bubble,
                progressColorClass: colorSet.progress,
                textColorClass: colorSet.text,
            };
        });
        this.animateCounters();
    }

    private animateCounters(): void {
        // Cancel any pending animations to prevent duplicate loops
        this.animationIds.forEach(id => cancelAnimationFrame(id));
        this.animationIds = [];

        this.visibleKpis.forEach(kpi => {
            const duration = 1200; // 1.2s
            const start = 0;
            const end = kpi.targetValue;
            let startTime: number | null = null;

            const step = (timestamp: number) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                kpi.displayValue = Math.floor(progress * (end - start) + start);
                if (progress < 1) {
                    const animId = window.requestAnimationFrame(step);
                    this.animationIds.push(animId);
                } else {
                    kpi.displayValue = end;
                }
                this.cdr.markForCheck();
            };
            const animId = window.requestAnimationFrame(step);
            this.animationIds.push(animId);
        });
    }

    onTimeframeChange(kpi: any, timeframe: string, event?: Event): void {
        event?.stopPropagation();
        kpi.timeframe = timeframe;
    }

    navigateToDetail(kpi: any): void {
        if (kpi.title.includes('Pacientes')) {
            this.router.navigate(['/dashboard/patients']);
        } else if (kpi.title.includes('Riesgo')) {
            this.router.navigate(['/dashboard/patients'], { queryParams: { filter: 'risk' } });
        }
    }

    ngOnDestroy(): void {
        this.animationIds.forEach(id => cancelAnimationFrame(id));
        this.animationIds = [];
    }
}
