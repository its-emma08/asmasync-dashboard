import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AgePipe } from '../../../../../shared/pipes/age-pipe';
import { SafeDatePipe } from '../../../../../shared/pipes/safe-date.pipe';
import { SearchService } from '../../../../../core/services/search.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-alerts-widget',
    standalone: true,
    imports: [CommonModule, RouterModule, MatIconModule, AgePipe, SafeDatePipe],
    template: `
    <div class="glass-card p-4 h-full flex flex-col">
        <div class="flex justify-between items-center mb-2 flex-shrink-0">
            <div class="flex items-center gap-2 min-w-0">
                <h3 class="font-bold text-brand-dark text-sm uppercase tracking-wide truncate">Alertas Urgentes ({{ filteredPatients.length }})</h3>
            </div>
            
            <div class="flex gap-2 flex-shrink-0">
                <button (click)="markAll.emit()" class="text-[10px] text-slate-500 hover:text-slate-800 px-2 py-1 border border-slate-200 rounded-lg font-medium transition-colors">
                    Marcar todas
                </button>
            </div>
        </div>

        <!-- Scrollable Area -->
        <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x flex-1 min-h-0 items-center">
            <div *ngFor="let p of filteredPatients" class="urgent-card min-w-[260px] max-w-[280px] h-full border border-gray-100 rounded-2xl p-3 hover:shadow-md transition-shadow bg-white flex flex-col gap-2 relative group snap-start">
                <!-- Badges -->
                <span *ngIf="p.riskLevel === 'red'" class="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-50 text-red-500 flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Crítico
                </span>
                <span *ngIf="p.riskLevel === 'yellow'" class="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-yellow-50 text-yellow-600 flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span> Moderado
                </span>

                <!-- Header -->
                <div class="flex items-center gap-2 mt-1">
                    <div class="flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                        <img [src]="p.profilePicture" class="w-full h-full object-cover" (error)="$event.target.style.display='none'">
                        <mat-icon class="text-gray-300 text-2xl" style="position:absolute">account_circle</mat-icon>
                    </div>
                    <div class="min-w-0">
                        <p class="font-bold text-slate-800 text-sm leading-tight truncate">{{ p.full_name }}</p>
                        <p class="text-[10px] text-slate-400">{{ p.date_of_birth | age }} Años</p>
                    </div>
                </div>

                <!-- Data -->
                <div class="grid grid-cols-2 gap-2 my-1 flex-1">
                    <div class="bg-slate-50 p-1.5 rounded-xl border border-slate-100 flex flex-col items-center text-center justify-center">
                        <p class="text-[9px] text-gray-400 uppercase font-bold mb-0.5">PEF Actual</p>
                        <p class="text-lg font-bold text-brand-dark flex items-end leading-none">
                            {{ p.latest_pef }} <span class="text-[9px] text-gray-400 font-normal ml-1 mb-0.5">L/min</span>
                        </p>
                    </div>
                    <div class="bg-slate-50 p-1.5 rounded-xl border border-slate-100 flex flex-col items-center text-center justify-center">
                        <p class="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Crisis</p>
                        <p class="text-[10px] font-medium text-gray-500 line-clamp-1">
                            {{ p.lastCrisis ? (p.lastCrisis | safeDate) : 'Ninguna' }}
                        </p>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-2 w-full mt-auto">
                    <a [href]="'tel:' + (p.contact?.phone || p.phone)" class="flex items-center justify-center w-8 h-8 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer" title="Llamar">
                        <mat-icon class="scale-75">call</mat-icon>
                    </a>
                    <button class="flex-1 bg-white text-slate-600 border border-slate-200 text-[10px] font-bold py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" [routerLink]="['/dashboard/patients', p.id]">
                        Ver Ficha
                    </button>
                    <button (click)="resolve.emit(p)" class="w-8 h-8 flex items-center justify-center bg-brand-dark text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm cursor-pointer" title="Marcar Atendido">
                        <mat-icon class="scale-75">check</mat-icon>
                    </button>
                </div>
            </div>

            <div *ngIf="filteredPatients.length === 0" class="min-w-full flex flex-col items-center justify-center p-4 text-gray-400">
                <mat-icon class="text-3xl mb-2 text-gray-200">check_circle</mat-icon>
                <p class="text-xs">No hay alertas encontradas</p>
            </div>
        </div>
    </div>
  `
})
export class AlertsWidgetComponent implements OnInit, OnDestroy {
    @Input() patients: any[] = [];
    @Output() markAll = new EventEmitter<void>();
    @Output() resolve = new EventEmitter<any>();

    searchQuery: string = '';
    private destroy$ = new Subject<void>();

    constructor(private searchService: SearchService) { }

    ngOnInit() {
        this.searchService.search$
            .pipe(takeUntil(this.destroy$))
            .subscribe(term => {
                this.searchQuery = term;
            });
    }

    get filteredPatients() {
        if (!this.searchQuery) return this.patients;
        const q = this.searchQuery.toLowerCase();
        return this.patients.filter(p => p.full_name?.toLowerCase().includes(q) || p.id?.toString().includes(q));
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
