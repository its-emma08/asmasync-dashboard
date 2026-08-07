import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { BaseChartDirective } from 'ng2-charts';
import { takeUntil, Subject } from 'rxjs';
import { ThemeService } from '../../../../../core/services/theme.service';
import { chartPalette } from '../../../../../shared/utils/chart-palette';

@Component({
    selector: 'app-trend-widget',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, MatIconModule, BaseChartDirective],
    template: `
    <div class="h-full flex flex-col bg-transparent overflow-hidden">

        <!-- Header -->
        <div class="flex items-start justify-between px-5 pt-4 pb-3 flex-shrink-0 border-b border-slate-100 dark:border-slate-700/50">
            <div class="min-w-0">
                <h3 class="font-bold text-slate-800 dark:text-white text-sm">Análisis de Tendencia</h3>
                <p class="text-[10px] text-slate-400 mt-0.5 font-medium truncate">
                    <span class="text-teal-600 dark:text-teal-400 font-bold">PEF Prom. {{ avgPef }}</span>
                    <span *ngIf="deltaPef != null" class="font-black ml-1"
                        [class]="deltaPef >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                        {{ deltaPef >= 0 ? '▲' : '▼' }} {{ absDeltaPef }}%
                    </span>
                    <span class="mx-1">·</span>{{ periodLabel }}
                </p>
                <p class="text-[10px] text-slate-400 font-medium mt-0.5">
                    Mejor: <b class="text-slate-600 dark:text-slate-200">{{ maxPef }}</b> L/min
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

        <!-- Interactive legend (click to toggle series) -->
        <div class="flex items-center gap-2 px-5 py-2 flex-shrink-0">
            <button *ngFor="let s of series; let i = index"
                (click)="toggleSeries(i)"
                class="flex items-center gap-1.5 text-[10px] font-bold rounded-lg px-2.5 py-1 transition-all duration-200 cursor-pointer"
                [class]="s.visible
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    : 'bg-transparent text-slate-400 dark:text-slate-600 line-through opacity-60'">
                <span class="w-2 h-2 rounded-full flex-shrink-0" [style.background]="s.color"></span>
                {{ s.label }}
            </button>
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
export class TrendWidgetComponent implements OnChanges, OnDestroy {
    @Input() data: any;
    @Input() options: any;
    @Output() periodChange = new EventEmitter<string>();
    @ViewChild(BaseChartDirective) baseChart?: BaseChartDirective;

    series = [
        { label: 'PEF (L/min)', color: '#2563EB', visible: true },
        { label: 'FEV1 (L)', color: '#cbd5e1', visible: true }
    ];

    private destroy$ = new Subject<void>();
    private palette = chartPalette(false);

    constructor(private theme: ThemeService, private cdr: ChangeDetectorRef) {
        this.theme.darkMode$
            .pipe(takeUntil(this.destroy$))
            .subscribe(isDark => {
                this.palette = chartPalette(isDark);
                this.cdr.markForCheck();
            });
    }

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

    private get series0(): any[] {
        return this.data?.datasets?.[0]?.data || [];
    }

    get avgPef(): string {
        const ds = this.series0.filter((v: any) => Number(v) > 0);
        if (!ds.length) return '— L/min';
        const avg = ds.reduce((a: number, b: any) => a + Number(b), 0) / ds.length;
        return `${Math.round(avg)} L/min`;
    }

    get maxPef(): string {
        const ds = this.series0.filter((v: any) => Number(v) > 0);
        if (!ds.length) return '—';
        return `${Math.round(Math.max(...ds.map((v: any) => Number(v))))}`;
    }

    get deltaPef(): number | null {
        const ds = this.series0.filter((v: any) => Number(v) > 0);
        if (ds.length < 2) return null;
        const prev = Number(ds[ds.length - 2]);
        const last = Number(ds[ds.length - 1]);
        if (!prev) return null;
        return Math.round(((last - prev) / prev) * 100);
    }

    get absDeltaPef(): number {
        return Math.abs(this.deltaPef ?? 0);
    }

    get chartOptions() {
        // Merge with incoming options, applying responsive defaults and
        // forcing theme-aware axis colors (palette applied last on purpose).
        const merged = {
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
        } as any;
        return {
            ...merged,
            plugins: {
                ...merged.plugins,
                legend: { ...merged.plugins.legend, display: false }
            },
            scales: {
                ...merged.scales,
                x: { ...merged.scales.x, ticks: { ...merged.scales.x.ticks, color: this.palette.tickColor } },
                y: {
                    ...merged.scales.y,
                    grid: { ...merged.scales.y.grid, color: this.palette.gridColor },
                    ticks: { ...merged.scales.y.ticks, color: this.palette.tickColor }
                }
            }
        };
    }

    ngOnChanges(_: SimpleChanges): void { }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    selectPeriod(key: string): void {
        this.activePeriod = key;
        this.periodChange.emit(key);
    }

    toggleSeries(index: number): void {
        const chart = this.baseChart?.chart;
        if (!chart) return;
        const ds = chart.data.datasets[index];
        if (!ds || !this.series[index]) return;
        ds.hidden = !ds.hidden;
        this.series[index].visible = !ds.hidden;
        chart.update();
    }
}
