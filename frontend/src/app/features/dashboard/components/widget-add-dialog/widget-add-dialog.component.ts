import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { DashboardWidget } from '../../services/dashboard.service';

interface WidgetOption {
    type: DashboardWidget['type'];
    title: string;
    description: string;
    icon: string;
    color: string; // Tailwind class
    category: 'clinical' | 'monitoring' | 'productivity';
}

@Component({
    selector: 'app-widget-add-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTabsModule],
    template: `
    <div class="w-[800px] max-w-full h-[600px] flex flex-col bg-slate-50">
      
      <!-- Header -->
      <div class="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 class="text-xl font-bold text-slate-800 m-0">Galería de Widgets</h2>
          <p class="text-sm text-slate-500">Personaliza tu tablero con herramientas especializadas.</p>
        </div>
        <button mat-icon-button (click)="close()" class="text-slate-400 hover:text-red-500 transition-colors">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Content -->
      <mat-tab-group class="flex-1 overflow-hidden" mat-stretch-tabs="false" mat-align-tabs="start" animationDuration="0ms">
        
        <!-- All Widgets Tab -->
        <mat-tab label="Todos">
          <div class="p-6 grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto h-full max-h-[480px]">
             <ng-container *ngFor="let widget of widgets">
                <div class="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-cyan/50 transition-all cursor-pointer group relative flex flex-col"
                     (click)="selectWidget(widget.type)">
                   
                   <!-- Icon Header -->
                   <div class="flex items-start justify-between mb-3">
                      <div [class]="'w-12 h-12 rounded-2xl flex items-center justify-center ' + widget.color">
                         <mat-icon class="text-white drop-shadow-sm">{{widget.icon}}</mat-icon>
                      </div>
                      <mat-icon class="opacity-0 group-hover:opacity-100 text-brand-cyan transform translate-x-2 group-hover:translate-x-0 transition-all">add_circle</mat-icon>
                   </div>

                   <!-- Text -->
                   <h3 class="font-bold text-slate-800 mb-1">{{widget.title}}</h3>
                   <p class="text-xs text-slate-500 leading-relaxed">{{widget.description}}</p>
                   
                   <!-- Hover Overlay Effect -->
                   <div class="absolute inset-0 bg-brand-cyan/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity pointer-events-none"></div>
                </div>
             </ng-container>
          </div>
        </mat-tab>

        <!-- Categories (Simplified for now using filters if needed, but hardcoded lists for speed) -->
        <mat-tab label="Clínico">
           <div class="p-6 grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div *ngFor="let widget of getWidgetsByCategory('clinical')" 
                   class="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-cyan/50 transition-all cursor-pointer group"
                   (click)="selectWidget(widget.type)">
                   <div [class]="'w-10 h-10 rounded-xl flex items-center justify-center mb-3 ' + widget.color">
                         <mat-icon class="text-white">{{widget.icon}}</mat-icon>
                   </div>
                   <h3 class="font-bold text-slate-800">{{widget.title}}</h3>
                   <p class="text-xs text-slate-500">{{widget.description}}</p>
              </div>
           </div>
        </mat-tab>

         <mat-tab label="Monitoreo">
           <div class="p-6 grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div *ngFor="let widget of getWidgetsByCategory('monitoring')" 
                   class="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-cyan/50 transition-all cursor-pointer group"
                   (click)="selectWidget(widget.type)">
                   <div [class]="'w-10 h-10 rounded-xl flex items-center justify-center mb-3 ' + widget.color">
                         <mat-icon class="text-white">{{widget.icon}}</mat-icon>
                   </div>
                   <h3 class="font-bold text-slate-800">{{widget.title}}</h3>
                   <p class="text-xs text-slate-500">{{widget.description}}</p>
              </div>
           </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `
})
export class WidgetAddDialogComponent {

    widgets: WidgetOption[] = [
        {
            type: 'kpi-group',
            title: 'Indicadores Clave',
            description: 'Resumen de pacientes totales, controlados, en riesgo y adherencia.',
            icon: 'analytics',
            color: 'bg-indigo-500',
            category: 'monitoring'
        },
        {
            type: 'alerts-panel',
            title: 'Panel de Alertas',
            description: 'Lista priorizada de pacientes que requieren atención inmediata.',
            icon: 'notifications_active',
            color: 'bg-red-500',
            category: 'clinical'
        },
        {
            type: 'patients-table',
            title: 'Tabla de Pacientes',
            description: 'Vista detallada de pacientes con cambios recientes de estado.',
            icon: 'people',
            color: 'bg-cyan-500',
            category: 'clinical'
        },
        {
            type: 'trend-chart',
            title: 'Gráfico de Tendencia',
            description: 'Visualización histórica de métricas generales de la población.',
            icon: 'show_chart',
            color: 'bg-emerald-500',
            category: 'monitoring'
        },
        {
            type: 'weather',
            title: 'Clima y Aire',
            description: 'Monitoreo ambiental, calidad del aire y riesgo asmático.',
            icon: 'cloud',
            color: 'bg-sky-400',
            category: 'monitoring'
        },
        {
            type: 'medication',
            title: 'Medicación',
            description: 'Rastreo de adherencia diaria y dosis de rescate.',
            icon: 'medication',
            color: 'bg-purple-500',
            category: 'clinical'
        },
        {
            type: 'device-status',
            title: 'Estado Dispositivo',
            description: 'Conectividad y batería de inhaladores inteligentes.',
            icon: 'watch',
            color: 'bg-slate-600',
            category: 'monitoring'
        },
        {
            type: 'act-score',
            title: 'Puntaje ACT',
            description: 'Registro rápido del Asthma Control Test.',
            icon: 'speed',
            color: 'bg-amber-500',
            category: 'clinical'
        },
        {
            type: 'quick-actions',
            title: 'Acciones Rápidas',
            description: 'Botones de acceso directo para tareas comunes.',
            icon: 'bolt',
            color: 'bg-yellow-400',
            category: 'productivity'
        },
        {
            type: 'activity-list',
            title: 'Actividad Reciente',
            description: 'Log de eventos y cambios en el sistema.',
            icon: 'history',
            color: 'bg-blue-400',
            category: 'productivity'
        },
        {
            type: 'calendar',
            title: 'Calendario',
            description: 'Agenda de citas y recordatorios médicos.',
            icon: 'calendar_month',
            color: 'bg-pink-500',
            category: 'productivity'
        },
        {
            type: 'single-kpi',
            title: 'Indicador Simple',
            description: 'Métrica individual configurable (ej. Total Pacientes).',
            icon: 'adjust',
            color: 'bg-slate-400',
            category: 'monitoring'
        },
        {
            type: 'birthdays',
            title: 'Cumpleaños',
            description: 'Lista de pacientes que cumplen años este mes.',
            icon: 'cake',
            color: 'bg-rose-400',
            category: 'productivity'
        },
        {
            type: 'reminders',
            title: 'Notas Rápidas',
            description: 'Bloc de notas adhesivas para recordatorios.',
            icon: 'sticky_note_2',
            color: 'bg-yellow-500',
            category: 'productivity'
        },
        {
            type: 'shortcuts',
            title: 'Atajos de Personal',
            description: 'Acceso rápido a Enfermería, Farmacia y Laboratorio.',
            icon: 'badge',
            color: 'bg-indigo-400',
            category: 'productivity'
        }
    ];

    constructor(private dialogRef: MatDialogRef<WidgetAddDialogComponent>) { }

    getWidgetsByCategory(cat: string): WidgetOption[] {
        return this.widgets.filter(w => w.category === cat);
    }

    selectWidget(type: DashboardWidget['type']): void {
        this.dialogRef.close(type);
    }

    close(): void {
        this.dialogRef.close();
    }
}
