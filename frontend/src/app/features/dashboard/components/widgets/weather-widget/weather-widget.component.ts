import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { WeatherService, WeatherData } from '../../../../../core/services/weather.service';

@Component({
    selector: 'app-weather-widget',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    template: `
    <!-- Skeleton while loading -->
    <div *ngIf="!weather" class="h-full flex flex-col justify-between p-5 animate-pulse bg-transparent">
        <div class="flex items-center gap-2">
            <div class="h-5 w-5 bg-slate-200 dark:bg-slate-700/50 rounded-full"></div>
            <div class="h-3 w-20 bg-slate-200 dark:bg-slate-700/50 rounded-full"></div>
        </div>
        <div class="h-10 w-24 bg-slate-200 dark:bg-slate-700/50 rounded-xl my-4"></div>
        <div class="grid grid-cols-3 gap-2">
            <div class="h-8 bg-slate-100 dark:bg-slate-700/30 rounded-lg"></div>
            <div class="h-8 bg-slate-100 dark:bg-slate-700/30 rounded-lg"></div>
            <div class="h-8 bg-slate-100 dark:bg-slate-700/30 rounded-lg"></div>
        </div>
    </div>

    <!-- Weather content -->
    <div *ngIf="weather" class="h-full flex flex-col justify-between p-5 relative overflow-hidden group bg-transparent">
        <!-- Environmental Indicator Glow (Soft Top Corner) -->
        <div class="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl opacity-30 pointer-events-none transition-all duration-700 group-hover:scale-125"
             [ngClass]="{
                'bg-emerald-400': weather.riskLevel === 'Low',
                'bg-amber-400': weather.riskLevel === 'Medium',
                'bg-rose-500': weather.riskLevel === 'High'
             }">
        </div>

        <!-- Header -->
        <div class="flex justify-between items-start z-10">
            <div class="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                <mat-icon class="!text-xs !w-3 !h-3">location_on</mat-icon>
                <span class="text-[10px] font-bold uppercase tracking-wider truncate max-w-[120px]">{{ weather.city }}</span>
            </div>
            
            <!-- Dynamic Risk Badge -->
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border shadow-sm transition-all duration-300"
                [ngClass]="{
                    'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20': weather.riskLevel === 'Low',
                    'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20': weather.riskLevel === 'Medium',
                    'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20': weather.riskLevel === 'High'
                }">
                <span class="w-1 h-1 rounded-full" 
                      [ngClass]="{
                          'bg-emerald-500 animate-pulse': weather.riskLevel === 'Low',
                          'bg-amber-500 animate-pulse': weather.riskLevel === 'Medium',
                          'bg-red-500 animate-pulse': weather.riskLevel === 'High'
                      }"></span>
                Asma: {{ weather.riskLevel === 'Low' ? 'Seguro' : weather.riskLevel === 'Medium' ? 'Precaución' : 'Peligro' }}
            </span>
        </div>

        <!-- Temp + Condition -->
        <div class="my-auto py-2 flex items-center gap-4 z-10">
            <span class="text-[44px] font-black leading-none tracking-tighter text-slate-800 dark:text-white font-sans drop-shadow-sm select-none">
                {{ weather.temp }}°
            </span>
            <div class="flex flex-col gap-1 min-w-0">
                <div class="flex items-center gap-1">
                    <mat-icon class="!text-slate-500 dark:!text-slate-400 !text-sm !w-4 !h-4">{{ weather.icon }}</mat-icon>
                    <span class="text-xs font-bold text-slate-700 dark:text-slate-200 truncate leading-none capitalize">{{ weather.condition }}</span>
                </div>
                <span class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide leading-none">Ambiente</span>
            </div>
        </div>

        <!-- Stats row -->
        <div class="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50 z-10 relative bg-transparent">
            <div class="stat-cell">
                <span class="stat-label">Humedad</span>
                <span class="stat-value" [class.text-amber-500]="weather.humidity > 80">{{ weather.humidity }}%</span>
            </div>
            <div class="stat-cell border-l border-slate-100 dark:border-slate-700/50">
                <span class="stat-label">Viento</span>
                <span class="stat-value">{{ weather.wind }}<span class="text-[8px] font-bold text-slate-400 ml-0.5">km/h</span></span>
            </div>
            <div class="stat-cell border-l border-slate-100 dark:border-slate-700/50">
                <span class="stat-label">Ind. UV</span>
                <span class="stat-value">{{ weather.uvIndex ?? '—' }}</span>
            </div>
        </div>
    </div>
  `,
    styles: [`
        .stat-cell {
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            gap: 2px;
            justify-content: center;
        }
        .stat-label {
            font-size: 8px; 
            font-weight: 700; 
            text-transform: uppercase;
            letter-spacing: 0.08em; 
            color: #94a3b8;
        }
        :host-context(body.dark) .stat-label {
            color: #64748b;
        }
        .stat-value {
            font-size: 13px; 
            font-weight: 900; 
            color: #1e293b;
            line-height: 1.1;
        }
        :host-context(body.dark) .stat-value { 
            color: #f1f5f9; 
        }
    `]
})
export class WeatherWidgetComponent {
    public weatherService = inject(WeatherService);

    get weather(): WeatherData | null {
        return this.weatherService.currentWeather();
    }
}
