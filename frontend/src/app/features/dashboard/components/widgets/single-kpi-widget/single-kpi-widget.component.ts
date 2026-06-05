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
            <mat-icon [class]="'text-4xl ' + (config.color === 'blue' ? 'text-blue-500' : config.color === 'green' ? 'text-green-500' : config.color === 'red' ? 'text-red-500' : 'text-cyan-500')">
                {{ config.icon || 'analytics' }}
            </mat-icon>
        </div>

        <!-- Header -->
        <div class="z-10 truncate mb-1">
            <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1 truncate">{{ config.label || 'Metric' }}</p>
            <div class="flex items-center gap-3">
                <h3 class="text-5xl font-black tracking-tighter text-slate-800 dark:text-white" [class.text-slate-400]="!config.value || config.value === 0">{{ config.value || 0 }}</h3>
                <!-- Trend Indicator -->
                <span *ngIf="config.trend"
                    [class]="(config.trend.includes('+') ? 'text-green-500 bg-green-50 dark:bg-green-500/10' : (config.trend === '0' || config.trend === '0%') ? 'text-slate-500 bg-slate-100 dark:bg-slate-700/50' : 'text-red-500 bg-red-50 dark:bg-red-500/10') + ' rounded-full px-2 py-0.5 text-xs font-bold flex items-center gap-0.5 min-w-min'">
                    <mat-icon class="scale-50 w-4 h-4" *ngIf="config.trend !== '0' && config.trend !== '0%'">{{ config.trend.includes('+') ? 'north' : 'south' }}</mat-icon>
                    <mat-icon class="scale-50 w-4 h-4" *ngIf="config.trend === '0' || config.trend === '0%'">horizontal_rule</mat-icon>
                    {{ config.trend }}
                </span>
            </div>
        </div>

        <!-- Footer: Progress Bar -->
        <div class="z-10 mt-auto pt-4" *ngIf="config.progressValue !== undefined">
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
}
