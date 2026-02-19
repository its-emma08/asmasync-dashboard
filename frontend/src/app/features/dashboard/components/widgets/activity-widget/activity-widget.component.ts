import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-activity-widget',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    template: `
    <div class="glass-card p-6 h-full flex flex-col">
        <h3 class="text-lg font-bold text-brand-dark mb-4">Actividad Reciente</h3>
        <div class="space-y-4 flex-1 overflow-y-auto">
            <div *ngFor="let item of activities" class="flex gap-4 items-start p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                     [ngClass]="item.bg + ' ' + item.color">
                    <mat-icon class="scale-75">{{ item.icon }}</mat-icon>
                </div>
                <div>
                    <h4 class="font-bold text-brand-dark text-sm group-hover:text-brand-cyan transition-colors">{{ item.title }}</h4>
                    <p class="text-xs text-gray-400">{{ item.desc }}</p>
                </div>
            </div>
        </div>
        <button class="w-full mt-4 text-center text-brand-cyan text-sm font-bold hover:underline">Ver Todo</button>
    </div>
  `
})
export class ActivityWidgetComponent {
    @Input() activities: any[] = [];
}
