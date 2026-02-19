import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';

@Component({
    selector: 'app-device-status-widget',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, MatRippleModule],
    template: `
    <div class="h-full flex flex-col relative overflow-hidden">
      
      <!-- Background Abstract Shape -->
      <div class="absolute -right-6 -top-6 w-24 h-24 bg-brand-cyan/5 rounded-full blur-2xl pointer-events-none"></div>

      <div class="flex justify-between items-start mb-4 relative z-10">
        <div>
          <h3 class="font-bold text-slate-700 text-sm">Dispositivo IoT</h3>
          <p class="text-xs text-green-500 font-bold flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Conectado
          </p>
        </div>
        <mat-icon class="text-slate-300">bluetooth_connected</mat-icon>
      </div>

      <!-- Device Image / Icon -->
      <div class="flex-1 flex flex-col items-center justify-center py-2 relative z-10">
         <div class="w-20 h-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full shadow-inner border border-slate-200 flex items-center justify-center mb-3 relative">
            <mat-icon class="text-4xl text-brand-cyan drop-shadow-sm scale-125">watch</mat-icon>
            <!-- Battery Indicator on Device -->
            <div class="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow border border-slate-100 flex items-center justify-center w-8 h-8" title="Batería 85%">
                <mat-icon class="text-green-500 text-sm scale-75">battery_full</mat-icon>
            </div>
         </div>
         <h4 class="font-bold text-slate-800">Smart Inhaler v2</h4>
         <p class="text-xs text-slate-400">ID: #DEVICE-8832</p>
      </div>

      <!-- Footer Actions -->
      <div class="grid grid-cols-2 gap-2 mt-2 relative z-10">
          <div class="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
             <div class="text-xs text-slate-400">Última Sync</div>
             <div class="font-bold text-slate-700 text-sm">Hace 10m</div>
          </div>
          <button mat-ripple class="bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan rounded-lg p-2 text-xs font-bold transition-colors flex flex-col items-center justify-center">
             <span>Sincronizar</span>
          </button>
      </div>

    </div>
  `
})
export class DeviceStatusWidgetComponent { }
