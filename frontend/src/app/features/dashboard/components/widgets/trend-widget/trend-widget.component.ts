import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { BaseChartDirective } from 'ng2-charts';

@Component({
    selector: 'app-trend-widget',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, MatIconModule, BaseChartDirective],
    template: `
    <div class="h-full flex flex-col bg-transparent overflow-hidden">

        <!-- Header -->
        <div class="flex items-start justify-between px-5 pt-4 pb-3 flex-shrink-0 border-b border-slate-100 dark:border-slate-700/50">
            <div>
                <h3 class="font-bold text-slate-800 dark:text-white text-sm">Análisis de Tendencia</h3>
                <p class="text-[10px] text-slate-400 mt-0.5 font-medium">
                    <span class="text-teal-600 dark:text-teal-400 font-bold">PEF Prom. {{ avgPef }}</span>
                    · {{ periodLabel }}
                </p>
            </div>

            <!-- Period pills -->
            <div class="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-0.5 gap-0.5 flex-shrink-0">
                <button *ngFor="let p of periods"
                    (click)="selectPeriod(p.key)"
                    class="px-3 py-1.5 rounded-lg text-[10px] font-black transition-all duration-200"
                    [class]="activePeriod === p.key
                        ? 'bg-white dark:bg-slate-600 text-teal-600 dark:text-teal-400 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'">
                    {{ p.label }}
                </button>
            </div>
        </div>

        <!-- Chart -->
        <div class="relative flex-1 min-h-0 w-full px-2 pb-2 pt-1 overflow-hidden">
            <canvas baseChart
                [data]="data"
                [options]="chartOptions"
                [type]="'line'"
                class="w-full h-full">
            </canvas>
        </div>
    </div>
  `
})
export class TrendWidgetComponent implements OnChanges {
    @Input() data: any;
    @Input() options: any;
    @Output() periodChange = new EventEmitter<string>();

    activePeriod = '7d';

    periods = [
        { key: 'hoy', label: 'Hoy' },
        { key: '7d', label: '7D' },
        { key: '30d', label: '30D' },
    ];

    get periodLabel(): string {
        const map: Record<string, string> = { hoy: 'Hoy', '7d': 'Últimos 7 días', '30d': 'Últimos 30 días' };
        return map[this.activePeriod] || '';
    }

    get avgPef(): string {
        // Try to derive avg from data labels/values if available
        try {
            const ds = this.data?.datasets?.[0]?.data;
            if (ds?.length) {
                const avg = ds.reduce((a: number, b: number) => a + b, 0) / ds.length;
                return `${Math.round(avg)} L/min`;
            }
        } catch { }
        return '— L/min';
    }

    get chartOptions() {
        // Merge with incoming options, applying responsive defaults
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 12, font: { size: 10 } } },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 9 } } },
                y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 9 } } }
            },
            elements: { line: { tension: 0.4 }, point: { radius: 3, hoverRadius: 6 } },
            animation: { duration: 600, easing: 'easeInOutQuart' },
            ...this.options
        };
    }

    ngOnChanges(_: SimpleChanges): void { }

    selectPeriod(key: string): void {
        this.activePeriod = key;
        this.periodChange.emit(key);
    }
}
