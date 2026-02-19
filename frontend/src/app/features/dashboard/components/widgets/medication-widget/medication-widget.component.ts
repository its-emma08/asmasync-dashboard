import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-medication-widget',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  template: `
    <div class="h-full flex flex-col p-3 bg-white rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
      <!-- Header: Rigid -->
      <div class="flex justify-between items-center mb-2 flex-shrink-0">
        <div class="min-w-0 flex-1 mr-2"> <!-- allow truncate with flex-1 -->
          <h3 class="font-bold text-slate-700 text-xs uppercase tracking-wide truncate">Medicación</h3>
          <p class="text-[10px] text-slate-400 truncate">Hoy, 12 Feb</p>
        </div>
        <div class="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0">95%</div>
      </div>

      <!-- Main Content: Fluid Scrollable Area -->
      <div class="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar min-h-0">
        
        <!-- Medication Item 1 -->
        <div class="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 group hover:border-brand-cyan/30 transition-all cursor-pointer">
          <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
             <mat-icon class="scale-75 text-sm">medication</mat-icon>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-center">
                <span class="font-bold text-slate-700 text-xs truncate">Salbutamol</span>
                <span class="text-[10px] text-slate-400 whitespace-nowrap ml-1">8:00 AM</span>
            </div>
            <p class="text-[10px] text-slate-500 truncate">2 disparos • Rescate</p>
          </div>
          <button mat-icon-button class="w-6 h-6 flex items-center justify-center text-green-500 bg-white shadow-sm border border-green-100 flex-shrink-0">
            <mat-icon class="text-sm scale-75">check</mat-icon>
          </button>
        </div>

        <!-- Medication Item 2 -->
        <div class="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-100 shadow-sm border-l-2 border-l-orange-400">
          <div class="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
             <mat-icon class="scale-75 text-sm">medical_services</mat-icon>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-center">
                <span class="font-bold text-slate-800 text-xs truncate">Fluticasona</span>
                <span class="text-[10px] text-orange-500 font-bold whitespace-nowrap ml-1">Ahora</span>
            </div>
            <p class="text-[10px] text-slate-500 truncate">1 puff • Mantenimiento</p>
          </div>
          <button mat-icon-button class="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-brand-cyan hover:bg-slate-50 transition-colors flex-shrink-0">
            <mat-icon class="text-sm scale-75">radio_button_unchecked</mat-icon>
          </button>
        </div>

         <!-- Medication Item 3 -->
        <div class="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 opacity-60">
          <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center flex-shrink-0">
             <mat-icon class="scale-75 text-sm">nightlight</mat-icon>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-center">
                <span class="font-bold text-slate-700 text-xs truncate">Montelukast</span>
                <span class="text-[10px] text-slate-400 whitespace-nowrap ml-1">9:00 PM</span>
            </div>
            <p class="text-[10px] text-slate-500 truncate">1 tableta • Oral</p>
          </div>
           <div class="text-[10px] text-slate-400 font-medium px-1 flex-shrink-0">Pendiente</div>
        </div>

      </div>

      <!-- Footer: Rigid -->
       <div class="mt-2 pt-2 border-t border-slate-100 flex-shrink-0">
           <div class="flex justify-between text-[10px] mb-1">
               <span class="text-slate-500 truncate mr-2">Progreso Diario</span>
               <span class="font-bold text-brand-dark whitespace-nowrap">1/3 Dosis</span>
           </div>
           <mat-progress-bar mode="determinate" value="33" class="rounded-full h-1"></mat-progress-bar>
       </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
  `]
})
export class MedicationWidgetComponent { }
