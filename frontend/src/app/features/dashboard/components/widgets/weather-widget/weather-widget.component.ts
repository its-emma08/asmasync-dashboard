import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';

@Component({
    selector: 'app-weather-widget',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    template: `
    <div class="h-full flex flex-col p-6 bg-gradient-to-br from-blue-400 to-blue-600 dark:from-slate-800 dark:to-slate-800 text-white overflow-hidden relative transition-colors duration-300">
        <!-- Background Decor -->
        <mat-icon class="absolute -top-6 -right-6 text-white/20 dark:text-cyan-500/10 scale-[5] rotate-12">cloud</mat-icon>
        
        <div class="z-10 flex justify-between items-start">
            <div>
                <p class="text-blue-100 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">San Luis Potosí</p>
                <h3 class="text-4xl font-bold mt-1 dark:text-slate-100">{{ weatherData.temp }}°C</h3>
                <p class="text-white/80 dark:text-cyan-300 text-sm font-medium flex items-center gap-1 mt-1">
                    <mat-icon class="scale-75">{{ weatherData.icon }}</mat-icon> {{ weatherData.condition }}
                </p>
            </div>
            
            <!-- AQI Badge (No Blur) -->
            <div class="flex flex-col items-end">
                <div class="bg-white/90 dark:bg-slate-700 px-3 py-1 rounded-lg border border-white/50 dark:border-slate-600 text-center shadow-md">
                    <p class="text-[10px] uppercase font-bold text-gray-600 dark:text-slate-300">ICA (AQI)</p>
                    <p class="text-2xl font-bold text-gray-800 dark:text-slate-100">{{ weatherData.aqi }}</p>
                </div>
                <span class="text-xs font-bold text-green-300 mt-1 flex items-center gap-1">
                    <mat-icon class="icon-xs scale-50">check_circle</mat-icon> {{ weatherData.aqiLabel }}
                </span>
            </div>
        </div>

        <div class="mt-auto z-10 grid grid-cols-3 gap-2 pt-4 border-t border-white/20">
            <div class="text-center">
                <p class="text-[10px] text-blue-100 uppercase">Humedad</p>
                <p class="font-bold">{{ weatherData.humidity }}%</p>
            </div>
            <div class="text-center border-l border-white/20">
                <p class="text-[10px] text-blue-100 uppercase">Viento</p>
                <p class="font-bold">{{ weatherData.wind }} km/h</p>
            </div>
            <div class="text-center border-l border-white/20">
                <p class="text-[10px] text-blue-100 uppercase">Polen</p>
                <p class="font-bold text-yellow-300">{{ weatherData.pollen }}</p>
            </div>
        </div>
    </div>
  `,
    styles: []
})
export class WeatherWidgetComponent {
    weatherData = {
        temp: 24,
        condition: 'Mayormente Soleado',
        icon: 'wb_sunny',
        aqi: 45,
        aqiLabel: 'Bueno',
        humidity: 48,
        wind: 12,
        pollen: 'Medio'
    };

    constructor(private http: HttpClient) {
        this.fetchRealWeather();
        // Update every 5 minutes
        setInterval(() => this.fetchRealWeather(), 300000);
    }

    fetchRealWeather() {
        this.http.get<any>(`${environment.apiUrl}/environment/current`).subscribe({
            next: (data) => {
                this.weatherData.temp = data.temp;
                this.weatherData.wind = data.wind;
                this.weatherData.aqi = data.aqi;
                // Basic mapping based on generic conditions (Open-Meteo provides WMO code normally, but we simplify)
                if (data.temp > 25) {
                    this.weatherData.icon = 'wb_sunny';
                    this.weatherData.condition = 'Despejado';
                } else if (data.temp < 15) {
                    this.weatherData.icon = 'ac_unit';
                    this.weatherData.condition = 'Frío';
                } else {
                    this.weatherData.icon = 'partly_cloudy_day';
                    this.weatherData.condition = 'Templado';
                }
            },
            error: (err) => console.error('Failed to fetch weather', err)
        });
    }
}
