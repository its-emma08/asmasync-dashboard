import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-weather-widget',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    template: `
    <div class="h-full flex flex-col p-6 bg-gradient-to-br from-blue-400 to-blue-600 text-white overflow-hidden relative">
        <!-- Background Decor -->
        <mat-icon class="absolute -top-6 -right-6 text-white/20 scale-[5] rotate-12">cloud</mat-icon>
        
        <div class="z-10 flex justify-between items-start">
            <div>
                <p class="text-blue-100 text-xs font-bold uppercase tracking-wider">San Luis Potosí</p>
                <h3 class="text-4xl font-bold mt-1">{{ weatherData.temp }}°C</h3>
                <p class="text-white/80 text-sm font-medium flex items-center gap-1 mt-1">
                    <mat-icon class="scale-75">{{ weatherData.icon }}</mat-icon> {{ weatherData.condition }}
                </p>
            </div>
            
            <!-- AQI Badge (No Blur) -->
            <div class="flex flex-col items-end">
                <div class="bg-white/90 px-3 py-1 rounded-lg border border-white/50 text-center shadow-md">
                    <p class="text-[10px] uppercase font-bold text-gray-600">ICA (AQI)</p>
                    <p class="text-2xl font-bold text-gray-800">{{ weatherData.aqi }}</p>
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

    constructor() {
        this.simulateWeatherUpdates();
    }

    simulateWeatherUpdates() {
        setInterval(() => {
            // Slight variations
            const deltaTemp = (Math.random() - 0.5) * 2; // +/- 1 degree
            this.weatherData.temp = Math.round((this.weatherData.temp + deltaTemp) * 10) / 10;

            // Randomly change wind
            this.weatherData.wind = Math.max(0, Math.round(this.weatherData.wind + (Math.random() - 0.5) * 5));

            // Random conditions (rarely)
            if (Math.random() > 0.95) {
                const conditions = [
                    { condition: 'Soleado', icon: 'wb_sunny' },
                    { condition: 'Nublado', icon: 'cloud' },
                    { condition: 'Lluvia Ligera', icon: 'water_drop' },
                    { condition: 'Parcialmente Nublado', icon: 'partly_cloudy_day' }
                ];
                const next = conditions[Math.floor(Math.random() * conditions.length)];
                this.weatherData.condition = next.condition;
                this.weatherData.icon = next.icon;
            }
        }, 10000); // Update every 10 seconds
    }
}
