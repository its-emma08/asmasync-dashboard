import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="flex flex-col items-center justify-center p-8 text-center h-full w-full">
      <div class="relative mb-6">
        <div class="absolute inset-0 bg-slate-100 rounded-full scale-150 opacity-20 animate-pulse"></div>
        <div class="relative w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center">
            <mat-icon class="scale-[2] text-slate-300">{{ icon }}</mat-icon>
        </div>
      </div>
      <h3 class="text-lg font-bold text-slate-700 mb-2">{{ title }}</h3>
      <p class="text-sm text-slate-500 max-w-[200px] mx-auto leading-relaxed">{{ message }}</p>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() icon: string = 'query_stats';
  @Input() title: string = 'Sin datos aún';
  @Input() message: string = 'Las mediciones aparecerán aquí tan pronto como sean registradas.';
}
