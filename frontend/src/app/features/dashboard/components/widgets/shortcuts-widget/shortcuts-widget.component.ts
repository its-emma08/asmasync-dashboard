import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-shortcuts-widget',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, MatRippleModule, RouterModule],
    template: `
    <div class="h-full flex flex-col bg-transparent overflow-hidden">

        <!-- Header -->
        <div class="flex items-center gap-2.5 px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700/50 flex-shrink-0">
            <div class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <mat-icon class="text-slate-500 dark:text-slate-400 !text-lg">apps</mat-icon>
            </div>
            <div>
                <h3 class="font-bold text-slate-800 dark:text-white text-sm leading-tight">Atajos de Personal</h3>
                <p class="text-[10px] text-slate-400 font-medium">Acceso rápido</p>
            </div>
        </div>

        <!-- Shortcut grid -->
        <div class="flex-1 grid grid-cols-2 gap-3 p-4">

            <!-- Enfermería → Alertas -->
            <a routerLink="/dashboard/alerts" matRipple
                class="flex flex-col items-center justify-center gap-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all duration-200 border border-rose-100 dark:border-rose-500/20 group active:scale-95 cursor-pointer"
                matTooltip="Ir a Alertas">
                <div class="w-10 h-10 rounded-full bg-rose-200 dark:bg-rose-500/30 flex items-center justify-center text-rose-700 dark:text-rose-400 group-hover:scale-110 transition-transform">
                    <mat-icon>local_hospital</mat-icon>
                </div>
                <span class="text-xs font-semibold text-rose-800 dark:text-rose-300">Enfermería</span>
            </a>

            <!-- Farmacia → Reportes -->
            <a routerLink="/dashboard/reports" matRipple
                class="flex flex-col items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all duration-200 border border-emerald-100 dark:border-emerald-500/20 group active:scale-95 cursor-pointer"
                matTooltip="Ir a Reportes">
                <div class="w-10 h-10 rounded-full bg-emerald-200 dark:bg-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                    <mat-icon>medication</mat-icon>
                </div>
                <span class="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Farmacia</span>
            </a>

            <!-- Laboratorio → Pacientes -->
            <a routerLink="/dashboard/patients" matRipple
                class="flex flex-col items-center justify-center gap-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all duration-200 border border-blue-100 dark:border-blue-500/20 group active:scale-95 cursor-pointer"
                matTooltip="Ir a Pacientes">
                <div class="w-10 h-10 rounded-full bg-blue-200 dark:bg-blue-500/30 flex items-center justify-center text-blue-700 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <mat-icon>biotech</mat-icon>
                </div>
                <span class="text-xs font-semibold text-blue-800 dark:text-blue-300">Laboratorio</span>
            </a>

            <!-- Recepción → Calendario -->
            <a routerLink="/dashboard/calendar" matRipple
                class="flex flex-col items-center justify-center gap-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all duration-200 border border-amber-100 dark:border-amber-500/20 group active:scale-95 cursor-pointer"
                matTooltip="Ir a Calendario">
                <div class="w-10 h-10 rounded-full bg-amber-200 dark:bg-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400 group-hover:scale-110 transition-transform">
                    <mat-icon>support_agent</mat-icon>
                </div>
                <span class="text-xs font-semibold text-amber-800 dark:text-amber-300">Recepción</span>
            </a>

        </div>
    </div>
  `,
    styles: []
})
export class ShortcutsWidgetComponent { }
