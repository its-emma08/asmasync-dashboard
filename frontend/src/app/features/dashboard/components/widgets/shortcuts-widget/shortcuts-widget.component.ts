import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-shortcuts-widget',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
    template: `
    <div class="h-full flex flex-col p-4 bg-white">
        <div class="grid grid-cols-2 gap-3 h-full">
            
            <!-- Call Nurse -->
            <button mat-ripple class="flex flex-col items-center justify-center gap-2 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors border border-rose-100 group">
                <div class="w-10 h-10 rounded-full bg-rose-200 flex items-center justify-center text-rose-700 group-hover:scale-110 transition-transform">
                    <mat-icon>local_hospital</mat-icon>
                </div>
                <span class="text-xs font-semibold text-rose-800">Enfermería</span>
            </button>

            <!-- Pharmacy -->
            <button mat-ripple class="flex flex-col items-center justify-center gap-2 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-100 group">
                <div class="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
                    <mat-icon>medication</mat-icon>
                </div>
                <span class="text-xs font-semibold text-emerald-800">Farmacia</span>
            </button>

            <!-- Labs -->
            <button mat-ripple class="flex flex-col items-center justify-center gap-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100 group">
                <div class="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 group-hover:scale-110 transition-transform">
                    <mat-icon>biotech</mat-icon>
                </div>
                <span class="text-xs font-semibold text-blue-800">Laboratorio</span>
            </button>

            <!-- Reception -->
             <button mat-ripple class="flex flex-col items-center justify-center gap-2 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors border border-amber-100 group">
                <div class="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform">
                    <mat-icon>support_agent</mat-icon>
                </div>
                <span class="text-xs font-semibold text-amber-800">Recepción</span>
            </button>

        </div>
    </div>
  `,
    styles: []
})
export class ShortcutsWidgetComponent { }
