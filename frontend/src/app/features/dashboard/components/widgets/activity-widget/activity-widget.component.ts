import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-activity-widget',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, MatIconModule, RouterModule],
    template: `
    <div class="h-full flex flex-col bg-transparent overflow-hidden">

        <!-- Header -->
        <div class="flex items-center gap-2.5 px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700/50 flex-shrink-0">
            <div class="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                <mat-icon class="text-violet-500 dark:text-violet-400 !text-lg">timeline</mat-icon>
            </div>
            <div>
                <h3 class="font-bold text-slate-800 dark:text-white text-sm leading-tight">Actividad Reciente</h3>
                <p class="text-[10px] text-slate-400 font-medium">Últimas acciones del sistema</p>
            </div>
        </div>

        <!-- Empty State (when no activities) -->
        <div *ngIf="!activities || activities.length === 0"
            class="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div class="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                <mat-icon class="text-violet-300 !text-2xl">history_toggle_off</mat-icon>
            </div>
            <div>
                <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">Sin actividad reciente</p>
                <p class="text-xs text-slate-400 mt-1 max-w-[160px]">Las acciones de pacientes y citas aparecerán aquí</p>
            </div>
            <a routerLink="/dashboard/patients"
                class="text-[11px] font-bold text-violet-500 hover:text-violet-700 flex items-center gap-1 transition-colors">
                <mat-icon class="!text-sm !w-4 !h-4">people</mat-icon>
                Ver pacientes
            </a>
        </div>

        <!-- Activity List -->
        <div *ngIf="activities && activities.length > 0"
            class="flex-1 flex flex-col overflow-y-auto">
            <div class="space-y-0.5 p-3 flex-1">
                <div *ngFor="let item of activities"
                    class="flex gap-3 items-start p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors cursor-pointer group">
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                         [ngClass]="getItemBg(item.type)">
                        <mat-icon class="!text-base" [ngClass]="getItemColor(item.type)">{{ getItemIcon(item.type) }}</mat-icon>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-violet-500 transition-colors truncate">{{ item.patientName || item.description }}</h4>
                        <p class="text-xs text-slate-400 dark:text-slate-500 truncate">{{ item.description }}</p>
                        <p class="text-[10px] text-slate-300 dark:text-slate-600 mt-0.5">{{ item.time | date:'HH:mm · d MMM':'es' }}</p>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="px-4 pb-3 flex-shrink-0">
                <a routerLink="/dashboard/patients"
                    class="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-violet-100 dark:border-violet-500/20 text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors text-[11px] font-bold">
                    <mat-icon class="!text-sm !w-4 !h-4">open_in_full</mat-icon>
                    Ver Todo
                </a>
            </div>
        </div>
    </div>
  `
})
export class ActivityWidgetComponent {
    @Input() activities: any[] = [];

    getItemIcon(type: string): string {
        switch (type) {
            case 'alert': return 'notification_important';
            case 'medication': return 'medication';
            case 'symptom': return 'monitor_heart';
            case 'appointment': return 'event';
            default: return 'circle';
        }
    }

    getItemBg(type: string): string {
        switch (type) {
            case 'alert': return 'bg-red-50 dark:bg-red-500/10';
            case 'medication': return 'bg-emerald-50 dark:bg-emerald-500/10';
            case 'symptom': return 'bg-amber-50 dark:bg-amber-500/10';
            case 'appointment': return 'bg-indigo-50 dark:bg-indigo-500/10';
            default: return 'bg-slate-50 dark:bg-slate-700';
        }
    }

    getItemColor(type: string): string {
        switch (type) {
            case 'alert': return 'text-red-500';
            case 'medication': return 'text-emerald-500';
            case 'symptom': return 'text-amber-500';
            case 'appointment': return 'text-indigo-500';
            default: return 'text-slate-500';
        }
    }
}
