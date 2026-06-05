import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { PatientService } from '../../../../../core/services/patient.service';
import { Subject, takeUntil, catchError, of } from 'rxjs';

@Component({
    selector: 'app-act-score-widget',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, RouterModule],
    template: `
    <div class="h-full flex flex-col p-5 bg-transparent relative overflow-hidden group transition-all duration-300">
        <!-- Header -->
        <div class="flex justify-between items-start mb-4 flex-shrink-0 z-10 relative">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
                    <mat-icon class="scale-90 text-blue-500 dark:text-blue-400">donut_large</mat-icon>
                </div>
                <div>
                    <h3 class="font-extrabold text-slate-800 dark:text-white text-sm leading-none">Control de Asma</h3>
                    <p class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">Distribución de riesgo</p>
                </div>
            </div>
            <button mat-icon-button class="scale-75 text-slate-450 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors" matTooltip="Ver pacientes"
              routerLink="/dashboard/patients">
               <mat-icon class="!text-lg">open_in_new</mat-icon>
            </button>
        </div>

        <!-- Loading -->
        <div *ngIf="isLoading" class="flex-1 flex items-center justify-center z-10 relative">
          <div class="animate-pulse flex flex-col items-center gap-2 w-full">
            <div class="h-16 w-16 bg-slate-100 dark:bg-slate-700/50 rounded-full"></div>
            <div class="h-3 w-24 bg-slate-100 dark:bg-slate-700/50 rounded"></div>
          </div>
        </div>

        <!-- Gauge Visualization -->
        <div *ngIf="!isLoading" class="flex-1 flex items-center justify-center relative z-10 py-1">
           <svg viewBox="0 0 100 60" class="w-full h-full max-h-[110px] overflow-visible">
               <defs>
                   <linearGradient id="stableGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                       <stop offset="0%" stop-color="#34C759" />
                       <stop offset="100%" stop-color="#30B0C7" />
                   </linearGradient>
                   <linearGradient id="modGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                       <stop offset="0%" stop-color="#FFCC00" />
                       <stop offset="100%" stop-color="#FF9500" />
                   </linearGradient>
                   <linearGradient id="critGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                       <stop offset="0%" stop-color="#FF3B30" />
                       <stop offset="100%" stop-color="#FF9F0A" />
                   </linearGradient>
               </defs>

               <!-- Background Path -->
               <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" class="stroke-slate-100 dark:stroke-slate-700/50" stroke-width="8" stroke-linecap="round"/>
               
               <!-- Value Path -->
               <path [attr.d]="gaugePath" fill="none" [attr.stroke]="gaugeColor"
                 stroke-width="8" stroke-linecap="round"
                 style="transition: all 1s ease-out"/>
                 
               <!-- Total Text -->
               <text x="50" y="44" text-anchor="middle" class="text-[18px] font-black fill-slate-800 dark:fill-slate-100">{{ total }}</text>
               <text x="50" y="54" text-anchor="middle" class="fill-slate-400 dark:fill-slate-500 font-bold text-[6px] tracking-widest">PACIENTES</text>
           </svg>

           <!-- Status Badge -->
           <div class="absolute bottom-1 text-[10px] font-bold px-3.5 py-1 rounded-full border shadow-sm transition-all duration-300 transform group-hover:scale-105"
             [class]="statusClass">
              {{ statusLabel }}
           </div>
        </div>

        <!-- Distribution Row -->
        <div *ngIf="!isLoading" class="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700/50 grid grid-cols-3 gap-1 z-10 relative">
          <div class="flex flex-col items-center gap-0.5">
            <div class="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 shadow-sm shadow-emerald-500/20"></div>
            <span class="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{{ stable }}</span>
            <span class="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Estables</span>
          </div>
          <div class="flex flex-col items-center gap-0.5">
            <div class="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm shadow-amber-500/20"></div>
            <span class="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 mt-1">{{ moderate }}</span>
            <span class="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Parcial</span>
          </div>
          <div class="flex flex-col items-center gap-0.5">
            <div class="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-red-500 to-rose-600 shadow-sm shadow-red-500/20"></div>
            <span class="text-[11px] font-extrabold text-red-600 dark:text-red-400 mt-1">{{ critical }}</span>
            <span class="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Críticos</span>
          </div>
        </div>

        <!-- Background Decor -->
        <div class="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-tr from-blue-50 dark:from-blue-950/10 to-transparent rounded-full blur-3xl opacity-40 pointer-events-none"></div>
    </div>
  `
})
export class ActScoreWidgetComponent implements OnInit, OnDestroy {
    total = 0;
    critical = 0;
    moderate = 0;
    stable = 0;
    isLoading = true;

    private destroy$ = new Subject<void>();

    constructor(private patientService: PatientService, private cdr: ChangeDetectorRef) { }

    ngOnInit(): void {
        this.patientService.getPatientStats()
            .pipe(catchError(() => of({ total: 0, critical: 0, moderate: 0, stable: 0 })), takeUntil(this.destroy$))
            .subscribe((stats: any) => {
                this.total = stats.total || 0;
                this.critical = stats.critical || 0;
                this.moderate = stats.moderate || 0;
                this.stable = stats.stable || 0;
                this.isLoading = false;
                this.cdr.markForCheck();
            });
    }

    get gaugeColor(): string {
        if (this.total === 0) return 'url(#stableGrad)';
        const ratio = this.stable / this.total;
        if (ratio >= 0.8) return 'url(#stableGrad)';
        if (ratio >= 0.5) return 'url(#modGrad)';
        return 'url(#critGrad)';
    }

    get gaugePath(): string {
        if (this.total === 0) return 'M 10 50 A 40 40 0 0 1 10 50';
        const ratio = this.stable / this.total;
        // Map 0–1 → arc from (10,50) to (90,50) via top
        const angle = ratio * Math.PI;
        const x = 50 - 40 * Math.cos(angle);
        const y = 50 - 40 * Math.sin(angle);
        const largeArc = ratio > 0.5 ? 1 : 0;
        return `M 10 50 A 40 40 0 ${largeArc} 1 ${x.toFixed(1)} ${y.toFixed(1)}`;
    }

    get statusLabel(): string {
        if (this.total === 0) return 'Sin pacientes';
        if (this.critical > 0) return `${this.critical} crítico${this.critical > 1 ? 's' : ''}`;
        if (this.moderate > 0) return 'Control parcial';
        return 'Buen control';
    }

    get statusClass(): string {
        if (this.critical > 0) return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
        if (this.moderate > 0) return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
        return 'bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20';
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
