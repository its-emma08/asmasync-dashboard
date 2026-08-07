import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
    selector: 'app-single-kpi-widget',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="h-full p-6 flex flex-col justify-between relative overflow-hidden group min-w-0 min-h-[160px] bg-transparent">
        <!-- Context Icon (Top Right, Faded) -->
        <div class="absolute top-4 right-4 opacity-20">
            <mat-icon [class]="'text-4xl ' + iconClass">{{ config.icon || 'analytics' }}</mat-icon>
        </div>

        <!-- Header -->
        <div class="z-10 truncate mb-1">
            <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1 truncate">{{ config.label || 'Metric' }}</p>
            <div class="flex items-center gap-3">
                <h3 class="text-5xl font-black tracking-tighter text-slate-800 dark:text-white" [class.text-slate-400]="!config.value || config.value === 0">{{ config.value || 0 }}</h3>
                <!-- Sparkline-derived delta -->
                <span *ngIf="sparkDelta != null"
                    [class]="(sparkDelta > 0 ? 'text-green-600 bg-green-50 dark:bg-green-500/10' : sparkDelta < 0 ? 'text-red-600 bg-red-50 dark:bg-red-500/10' : 'text-slate-500 bg-slate-100 dark:bg-slate-700/50') + ' rounded-full px-2 py-0.5 text-xs font-bold flex items-center gap-0.5 min-w-min'">
                    <mat-icon class="text-[12px] w-[12px] h-[12px] leading-[12px]" *ngIf="sparkDelta !== 0">{{ sparkDelta > 0 ? 'north' : 'south' }}</mat-icon>
                    <mat-icon class="text-[12px] w-[12px] h-[12px] leading-[12px]" *ngIf="sparkDelta === 0">horizontal_rule</mat-icon>
                    {{ absDelta }}%
                </span>
            </div>
        </div>

        <!-- Sparkline (real data-driven activity trend) -->
        <div class="z-10 mt-2" *ngIf="sparkline && sparkline.length > 1 && sparkTotal > 0">
            <div class="flex justify-between text-[9px] font-medium text-slate-400 mb-0.5">
                <span>Actividad 7d</span>
                <span>{{ sparkTotal }} registros</span>
            </div>
            <svg viewBox="0 0 120 30" preserveAspectRatio="none" class="w-full h-7 block">
                <defs>
                    <linearGradient [attr.id]="gradId" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" [attr.stop-color]="strokeColor" stop-opacity="0.35"/>
                        <stop offset="100%" [attr.stop-color]="strokeColor" stop-opacity="0"/>
                    </linearGradient>
                </defs>
                <polyline [attr.points]="points" fill="none" [attr.stroke]="strokeColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
                <polygon [attr.points]="areaPoints" [attr.fill]="'url(#' + gradId + ')'"/>
            </svg>
        </div>

        <!-- Footer: Progress Bar -->
        <div class="z-10 mt-auto pt-2" *ngIf="config.progressValue !== undefined">
             <div class="flex justify-between text-[10px] text-gray-400 font-medium mb-1">
                <span>{{ config.progressLabel || 'Progreso' }}</span>
                <span>{{ config.progressValue }}%</span>
            </div>
            <mat-progress-bar mode="determinate" [value]="config.progressValue" class="rounded-full h-1.5"
                [color]="config.color === 'red' ? 'warn' : 'primary'">
            </mat-progress-bar>
        </div>
    </div>
  `,
    imports: [CommonModule, MatIconModule, MatCardModule, MatProgressBarModule],
    styles: []
})
export class SingleKpiWidgetComponent {
    @Input() config: any = {};

    static gradCounter = 0;
    gradId: string = `kpi-spark-${(SingleKpiWidgetComponent.gradCounter++)}`;

    get iconClass(): string {
        const c = this.config?.color;
        return c === 'blue' ? 'text-blue-500' : c === 'green' ? 'text-green-500' : c === 'red' ? 'text-red-500' : 'text-cyan-500';
    }

    get sparkDelta(): number | null {
        const s = this.config?.sparkline as number[] | undefined;
        if (!s || s.length < 2) return null;
        const filtered = s.slice().filter(v => Number(v) > 0);
        if (filtered.length < 2) return null;
        const prev = Number(filtered[filtered.length - 2]);
        const last = Number(filtered[filtered.length - 1]);
        if (!prev) return null;
        return Math.round(((last - prev) / prev) * 100);
    }

    get absDelta(): number {
        return Math.abs(this.sparkDelta ?? 0);
    }

    get sparkline(): number[] {
        return this.config?.sparkline || [];
    }

    get sparkTotal(): number {
        return this.sparkline.reduce((a, b) => a + Number(b), 0);
    }

    private get scaledPoints(): string[] {
        const values = this.sparkline.map(v => Number(v) || 0);
        if (values.length < 2) return [];
        const max = Math.max(...values) || 1;
        const min = Math.min(...values);
        const range = max - min || 1;
        const n = values.length;
        return values.map((v, i) => {
            const x = (i / (n - 1)) * 120;
            const y = 26 - ((v - min) / range) * 22;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        });
    }

    get points(): string {
        return this.scaledPoints.join(' ');
    }

    get areaPoints(): string {
        const line = this.scaledPoints.join(' ');
        if (!line) return '';
        return `0,30 ${line} 120,30`;
    }

    get strokeColor(): string {
        const delta = this.sparkDelta;
        if (delta == null) return '#10b981';
        if (delta > 0) return '#10b981';
        if (delta < 0) return '#ef4444';
        return '#94a3b8';
    }
}