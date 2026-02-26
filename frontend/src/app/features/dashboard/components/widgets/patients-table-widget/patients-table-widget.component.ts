import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SearchService } from '../../../../../core/services/search.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-patients-table-widget',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    template: `
    <div class="glass-card p-6 h-full flex flex-col">
        <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-slate-900 dark:text-white tracking-tight text-lg">Pacientes con cambios recientes</h3>
            <button class="text-brand-cyan text-sm font-bold hover:underline transition-all duration-300 active:scale-95">Ver más..</button>
        </div>

        <div class="overflow-x-auto flex-1 min-h-0 custom-scrollbar">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="text-gray-400 text-xs border-b border-gray-50">
                        <th class="pb-3 font-medium pl-2">Nombre</th>
                        <th class="pb-3 font-medium">PEF Anterior</th>
                        <th class="pb-3 font-medium">PEF Actual</th>
                        <th class="pb-3 font-medium">Tendencia</th>
                    </tr>
                </thead>
                <tbody class="text-sm">
                    <tr *ngFor="let p of filteredPatients" class="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-300 cursor-pointer rounded-lg border-b border-gray-50 dark:border-slate-700 last:border-0 hover:shadow-sm">
                        <td class="py-4 pl-2">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold overflow-hidden relative">
                                    <img [src]="p.profilePicture" class="w-full h-full object-cover" (error)="$event.target.style.display='none'">
                                    <mat-icon class="text-slate-300 dark:text-slate-500 absolute" *ngIf="!p.profilePicture">account_circle</mat-icon>
                                </div>
                                <span class="font-bold text-slate-800 dark:text-slate-100 group-hover:text-brand-cyan dark:group-hover:text-brand-cyan transition-colors">{{ p.full_name }}</span>
                            </div>
                        </td>
                        <td class="py-4 text-slate-500 font-medium">380 L/min</td>
                        <td class="py-4 text-slate-800 dark:text-slate-100 font-bold">{{ p.latest_pef }} L/min</td>
                        <td class="py-4">
                            <span class="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-red-50 text-red-500 w-fit dark:bg-red-500/20 dark:text-red-400">
                                ▼ 5%
                            </span>
                        </td>
                    </tr>
                    <!-- Empty State -->
                    <tr *ngIf="filteredPatients.length === 0">
                        <td colspan="4" class="py-8 text-center text-gray-400 text-sm">
                            No se encontraron pacientes
                        </td>
                    </tr>
                </tbody>
            </table>
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
