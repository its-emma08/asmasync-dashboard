import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
    selector: 'app-single-kpi-widget',
    standalone: true,
    template: `
    <div class="h-full bg-white rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all duration-300 border border-gray-100 min-w-0 cursor-pointer min-h-[160px]">
        <!-- Context Icon (Top Right, Faded) -->
        <div class="absolute top-4 right-4 opacity-20">
            <mat-icon [class]="'text-4xl ' + (config.color === 'blue' ? 'text-blue-500' : config.color === 'green' ? 'text-green-500' : config.color === 'red' ? 'text-red-500' : 'text-cyan-500')">
                {{ config.icon || 'analytics' }}
            </mat-icon>
        </div>

        <!-- Header -->
        <div class="z-10 truncate">
            <p class="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1 truncate">{{ config.label || 'Metric' }}</p>
            <div class="flex items-baseline gap-2">
                <h3 class="text-3xl font-bold text-slate-800">{{ config.value || 0 }}</h3>
                <!-- Trend Indicator -->
                <span *ngIf="config.trend"
                    [class]="(config.trend.includes('+') ? 'text-green-500' : 'text-red-500') + ' text-xs font-bold flex items-center'">
                    <mat-icon class="scale-50 w-4 h-4">{{ config.trend.includes('+') ? 'north' : 'south' }}</mat-icon>
                    {{ config.trend }}
                </span>
            </div>
        </div>

        <!-- Footer: Progress Bar -->
        <div class="z-10 mt-auto pt-4">
             <div class="flex justify-between text-[10px] text-gray-400 font-medium mb-1">
                <span>Progreso Mensual</span>
                <span>75%</span>
            </div>
            <mat-progress-bar mode="determinate" value="75" class="rounded-full h-1.5"
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
