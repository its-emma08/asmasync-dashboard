import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AgePipe } from '../../../../../shared/pipes/age-pipe';
import { SafeDatePipe } from '../../../../../shared/pipes/safe-date.pipe';
import { SearchService } from '../../../../../core/services/search.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-alerts-widget',
    standalone: true,
    imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule, AgePipe, SafeDatePipe],
    template: `
    <div class="h-full flex flex-col bg-white dark:bg-slate-800/80 rounded-3xl overflow-hidden">

        <!-- Header -->
        <div class="flex justify-between items-center px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700/50 flex-shrink-0">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center"
                     [class]="filteredPatients.length > 0 ? 'bg-red-50 dark:bg-red-500/10' : 'bg-slate-50 dark:bg-slate-700'">
                    <mat-icon class="text-base"
                        [class]="filteredPatients.length > 0 ? 'text-red-500' : 'text-slate-400'">notifications_active</mat-icon>
                </div>
                <div>
                    <h3 class="font-bold text-slate-800 dark:text-white text-sm leading-tight">Alertas Urgentes</h3>
                    <p class="text-[10px] text-slate-400 font-medium">{{ filteredPatients.length }} paciente{{ filteredPatients.length !== 1 ? 's' : '' }} requieren atención</p>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <!-- View toggle -->
                <div class="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5 gap-0.5">
                    <button (click)="viewMode = 'cards'"
                        class="p-1.5 rounded-md transition-all"
                        [class]="viewMode === 'cards' ? 'bg-white dark:bg-slate-600 shadow-sm text-teal-600 dark:text-teal-400' : 'text-slate-400 hover:text-slate-600'"
                        matTooltip="Vista tarjetas">
                        <mat-icon class="text-sm !w-4 !h-4 !text-base">view_module</mat-icon>
                    </button>
                    <button (click)="viewMode = 'list'"
                        class="p-1.5 rounded-md transition-all"
                        [class]="viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm text-teal-600 dark:text-teal-400' : 'text-slate-400 hover:text-slate-600'"
                        matTooltip="Vista lista">
                        <mat-icon class="text-sm !w-4 !h-4 !text-base">view_list</mat-icon>
                    </button>
                </div>
                <button (click)="markAll.emit()"
                    class="text-[11px] text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30 hover:bg-teal-50 dark:hover:bg-teal-500/10 px-3 py-1.5 rounded-lg font-bold transition-all duration-200 active:scale-95 flex-shrink-0">
                    Marcar todas
                </button>
            </div>
        </div>

        <!-- CARD MODE: horizontal scroll -->
        <div *ngIf="viewMode === 'cards'" class="flex gap-3 overflow-x-auto pb-4 pt-3 px-4 scrollbar-hide snap-x flex-1 min-h-0 items-stretch">
            <div *ngFor="let p of filteredPatients"
                class="min-w-[240px] max-w-[260px] flex-shrink-0 snap-start bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-4 shadow-[0_2px_12px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 flex flex-col gap-2 relative"
                [class.border-l-4]="true"
                [class.!border-l-red-400]="p.riskLevel === 'red'"
                [class.!border-l-yellow-400]="p.riskLevel === 'yellow'">

                <!-- Risk badge -->
                <span class="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide flex items-center gap-1"
                    [class]="p.riskLevel === 'red' ? 'bg-red-50 text-red-500' : 'bg-yellow-50 text-yellow-600'">
                    <span class="w-1.5 h-1.5 rounded-full animate-pulse"
                          [class]="p.riskLevel === 'red' ? 'bg-red-500' : 'bg-yellow-500'"></span>
                    {{ p.riskLevel === 'red' ? 'Crítico' : 'Moderado' }}
                </span>

                <!-- Patient info -->
                <div class="flex items-center gap-2.5 mt-1">
                    <div class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img *ngIf="p.profilePicture" [src]="p.profilePicture" class="w-full h-full object-cover" (error)="$event.target.style.display='none'">
                        <mat-icon *ngIf="!p.profilePicture" class="text-slate-400 text-xl">person</mat-icon>
                    </div>
                    <div class="min-w-0">
                        <p class="font-bold text-slate-800 dark:text-white text-sm leading-tight truncate">{{ p.full_name }}</p>
                        <p class="text-[10px] text-slate-400">{{ p.date_of_birth | age }} años</p>
                    </div>
                </div>

                <!-- Stats row -->
                <div class="grid grid-cols-2 gap-1.5 mt-1">
                    <div class="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-xl text-center">
                        <p class="text-[9px] text-slate-400 uppercase font-bold">PEF</p>
                        <p class="text-base font-black text-slate-700 dark:text-white leading-tight">{{ p.latest_pef }}<span class="text-[9px] text-slate-400 font-normal ml-0.5">L/m</span></p>
                    </div>
                    <div class="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-xl text-center">
                        <p class="text-[9px] text-slate-400 uppercase font-bold">Crisis</p>
                        <p class="text-[10px] font-medium text-slate-500 dark:text-slate-400">{{ p.lastCrisis ? (p.lastCrisis | safeDate) : 'Ninguna' }}</p>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-2 mt-auto pt-1">
                    <a [href]="'tel:' + (p.contact?.phone || p.phone)"
                        class="w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                        <mat-icon class="text-slate-500 dark:text-slate-400 !text-base !w-4 !h-4">call</mat-icon>
                    </a>
                    <button class="flex-1 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 text-[10px] font-bold py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                        [routerLink]="['/dashboard/patients', p.id]">
                        Ver Ficha
                    </button>
                    <button (click)="resolve.emit(p)"
                        class="w-8 h-8 flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white rounded-lg shadow-sm transition-colors cursor-pointer active:scale-95">
                        <mat-icon class="!text-base !w-4 !h-4">check</mat-icon>
                    </button>
                </div>
            </div>

            <!-- Empty state -->
            <div *ngIf="filteredPatients.length === 0" class="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                <div class="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                    <mat-icon class="text-green-500">check_circle</mat-icon>
                </div>
                <p class="text-sm font-medium text-slate-500">Sin alertas activas</p>
                <p class="text-xs text-slate-400">Todos los pacientes están controlados</p>
            </div>
        </div>

        <!-- LIST MODE: compact vertical list -->
        <div *ngIf="viewMode === 'list'" class="flex flex-col gap-0.5 overflow-y-auto flex-1 min-h-0 p-3 scrollbar-hide">
            <div *ngFor="let p of filteredPatients"
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 group transition-all cursor-pointer"
                [routerLink]="['/dashboard/patients', p.id]">

                <!-- Risk indicator -->
                <div class="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse"
                    [class]="p.riskLevel === 'red' ? 'bg-red-500' : 'bg-yellow-400'"></div>

                <!-- Avatar -->
                <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img *ngIf="p.profilePicture" [src]="p.profilePicture" class="w-full h-full object-cover" (error)="$event.target.style.display='none'">
                    <span *ngIf="!p.profilePicture" class="text-xs font-bold text-slate-500 dark:text-slate-400">{{ p.full_name?.charAt(0) }}</span>
                </div>

                <!-- Name + PEF -->
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-slate-700 dark:text-white truncate">{{ p.full_name }}</p>
                    <p class="text-[10px] text-slate-400">PEF: {{ p.latest_pef }} L/min · {{ p.date_of_birth | age }} años</p>
                </div>

                <!-- Risk badge -->
                <span class="text-[9px] font-black uppercase px-2 py-1 rounded-lg flex-shrink-0"
                    [class]="p.riskLevel === 'red' ? 'bg-red-50 text-red-500 dark:bg-red-500/10' : 'bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10'">
                    {{ p.riskLevel === 'red' ? 'Crítico' : 'Moderado' }}
                </span>

                <!-- Quick action -->
                <button (click)="resolve.emit(p); $event.stopPropagation()"
                    class="w-7 h-7 flex items-center justify-center rounded-lg bg-teal-500 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-90 flex-shrink-0">
                    <mat-icon class="!text-sm !w-3.5 !h-3.5">check</mat-icon>
                </button>
            </div>

            <!-- Empty state (list) -->
            <div *ngIf="filteredPatients.length === 0" class="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 py-8">
                <mat-icon class="text-3xl text-green-400">check_circle</mat-icon>
                <p class="text-sm text-slate-400">Sin alertas activas</p>
            </div>
        </div>
    </div>
  `
})
export class AlertsWidgetComponent implements OnInit, OnDestroy {
    @Input() patients: any[] = [];
    @Output() markAll = new EventEmitter<void>();
    @Output() resolve = new EventEmitter<any>();

    viewMode: 'cards' | 'list' = 'cards';
    searchQuery: string = '';
    private destroy$ = new Subject<void>();

    constructor(private searchService: SearchService) { }

    ngOnInit() {
        this.searchService.search$.pipe(takeUntil(this.destroy$)).subscribe(term => {
            this.searchQuery = term;
        });
    }

    get filteredPatients() {
        if (!this.searchQuery) return this.patients;
        const q = this.searchQuery.toLowerCase();
        return this.patients.filter(p =>
            p.full_name?.toLowerCase().includes(q) || p.id?.toString().includes(q)
        );
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
