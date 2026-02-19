import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { BaseChartDirective } from 'ng2-charts';

@Component({
    selector: 'app-trend-widget',
    standalone: true,
    imports: [CommonModule, MatIconModule, BaseChartDirective],
    template: `
    <div class="glass-card p-4 h-full flex flex-col">
        <div class="flex justify-between items-center mb-4 flex-shrink-0">
            <h3 class="font-bold text-brand-dark text-sm uppercase tracking-wide">Tendencia General</h3>
            <button class="text-gray-400 hover:text-brand-dark">
                <mat-icon class="scale-75">more_horiz</mat-icon>
            </button>
        </div>
        <div class="relative flex-1 min-h-0 w-full h-full overflow-hidden">
            <canvas baseChart 
                [data]="data" 
                [options]="options" 
                [type]="'line'"
                class="w-full h-full">
            </canvas>
        </div>
    </div>
  `
})
export class TrendWidgetComponent {
    @Input() data: any;
    @Input() options: any;
}
