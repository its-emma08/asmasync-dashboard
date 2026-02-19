import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-act-score-widget',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
    template: `
    <div class="h-full flex flex-col">
       <div class="flex justify-between items-start mb-2">
         <div>
            <h3 class="font-bold text-slate-700 text-sm">Score ACT</h3>
            <p class="text-xs text-slate-400">Test de Control de Asma</p>
         </div>
         <button mat-icon-button class="scale-75 text-slate-400" matTooltip="Ver historial">
            <mat-icon>history</mat-icon>
         </button>
       </div>

       <!-- Gauge Visualization -->
       <div class="flex-1 flex items-center justify-center relative">
          <!-- Semi Circle Gauge SVG -->
          <svg viewBox="0 0 100 60" class="w-full h-full max-h-[120px] overflow-visible">
              <!-- Background Path -->
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f1f5f9" stroke-width="8" stroke-linecap="round"/>
              
              <!-- Value Path (Calculated based on score 19/25) -->
              <path d="M 10 50 A 40 40 0 0 1 75 20" fill="none" stroke="#f59e0b" stroke-width="8" stroke-linecap="round" class="drop-shadow-sm transition-all duration-1000 ease-out"/>

              <!-- Score Text -->
              <text x="50" y="45" text-anchor="middle" class="text-[18px] font-bold fill-slate-800">19</text>
              <text x="50" y="55" text-anchor="middle" class="text-[6px] fill-slate-400 font-medium">DE 25 PUNTOS</text>
          </svg>

          <!-- Status Badge Overlay -->
          <div class="absolute bottom-0 bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold border border-amber-100 shadow-sm">
             Control Parcial
          </div>
       </div>

       <!-- Action -->
       <div class="mt-4 pt-2 border-t border-slate-50 flex justify-center">
          <button class="text-xs text-brand-cyan hover:text-brand-dark font-bold underline decoration-brand-cyan/30 underline-offset-4 transition-colors">
            Realizar Test (5 preguntas)
          </button>
       </div>
    </div>
  `
})
export class ActScoreWidgetComponent { }
