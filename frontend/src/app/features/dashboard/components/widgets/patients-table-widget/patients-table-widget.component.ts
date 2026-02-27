import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { SearchService } from '../../../../../core/services/search.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-patients-table-widget',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule],
    template: `
    <div class="h-full flex flex-col bg-white dark:bg-slate-800/80 rounded-3xl overflow-hidden">

        <!-- Header -->
        <div class="flex justify-between items-center px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700/50 flex-shrink-0">
            <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
                    <mat-icon class="text-teal-600 dark:text-teal-400 !text-lg">group</mat-icon>
                </div>
                <div>
                    <h3 class="font-bold text-slate-800 dark:text-white text-sm leading-tight">Pacientes Recientes</h3>
                    <p class="text-[10px] text-slate-400 font-medium">{{ patients.length }} paciente{{ patients.length !== 1 ? 's' : '' }} registrado{{ patients.length !== 1 ? 's' : '' }}</p>
                </div>
            </div>
            <a routerLink="/dashboard/patients"
                class="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline transition-all flex items-center gap-1">
                Ver todos
                <mat-icon class="!text-sm !w-3.5 !h-3.5">chevron_right</mat-icon>
            </a>
        </div>

        <!-- Column headers -->
        <div class="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-5 py-2 flex-shrink-0">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nombre</span>
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">PEF</span>
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">Riesgo</span>
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right w-12">Trend</span>
        </div>

        <!-- Row list -->
        <div class="flex-1 overflow-y-auto min-h-0 scrollbar-hide divide-y divide-slate-50 dark:divide-slate-700/50">

            <a *ngFor="let p of filteredPatients"
                [routerLink]="['/dashboard/patients', p.id]"
                class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors duration-150 cursor-pointer group">

                <!-- Name + avatar -->
                <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <img *ngIf="p.profilePicture" [src]="p.profilePicture" class="w-full h-full object-cover" (error)="$event.target.style.display='none'">
                        <span class="text-xs font-black text-slate-500">{{ p.full_name?.charAt(0) }}</span>
                    </div>
                    <div class="min-w-0">
                        <p class="text-sm font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{{ p.full_name }}</p>
                    </div>
                </div>

                <!-- PEF value -->
                <span class="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums text-right">{{ p.latest_pef }}<span class="text-[9px] text-slate-400 ml-0.5">L/m</span></span>

                <!-- Risk badge -->
                <span class="text-[9px] font-black uppercase px-2 py-1 rounded-lg text-center"
                    [class]="p.riskLevel === 'red' ? 'bg-red-50 text-red-500 dark:bg-red-500/10' :
                             p.riskLevel === 'yellow' ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10' :
                             'bg-green-50 text-green-600 dark:bg-green-500/10'">
                    {{ p.riskLevel === 'red' ? 'Alto' : p.riskLevel === 'yellow' ? 'Medio' : 'Ok' }}
                </span>

                <!-- Trend -->
                <div class="w-12 flex justify-end">
                    <span class="flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-md"
                        [class]="(p.trend === 'up') ? 'text-green-600 bg-green-50 dark:bg-green-500/10' : 'text-red-500 bg-red-50 dark:bg-red-500/10'">
                        <mat-icon class="!text-xs !w-3 !h-3">{{ p.trend !== 'down' ? 'trending_up' : 'trending_down' }}</mat-icon>
                        {{ p.trendValue || '5%' }}
                    </span>
                </div>
            </a>

            <!-- Empty state -->
            <div *ngIf="filteredPatients.length === 0"
                class="flex flex-col items-center justify-center py-10 text-slate-400 gap-3">
                <div class="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
                    <mat-icon class="text-slate-300 dark:text-slate-500 !text-2xl">person_search</mat-icon>
                </div>
                <p class="text-sm text-slate-400">No se encontraron pacientes</p>
            </div>
        </div>
    </div>
  `
})
export class PatientsTableWidgetComponent implements OnInit, OnChanges, OnDestroy {
    @Input() patients: any[] = [];
    filteredPatients: any[] = [];
    private destroy$ = new Subject<void>();

    constructor(private searchService: SearchService) { }

    ngOnInit() {
        this.searchService.search$
            .pipe(takeUntil(this.destroy$))
            .subscribe(term => this.filterPatients(term));
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['patients']) {
            this.filterPatients(this.searchService.currentTerm);
        }
    }

    filterPatients(term: string) {
        if (!term) {
            this.filteredPatients = this.patients || [];
        } else {
            this.filteredPatients = (this.patients || []).filter(p =>
                p.full_name.toLowerCase().includes(term.toLowerCase())
            );
        }
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
