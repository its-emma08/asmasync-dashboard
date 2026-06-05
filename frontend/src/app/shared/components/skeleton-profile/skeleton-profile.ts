import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
        <!-- 1. Header del Paciente (Skeleton) -->
        <div class="glass-card p-8 flex flex-col xl:flex-row gap-6 justify-between items-center relative overflow-hidden">
            <div class="flex flex-col md:flex-row items-center gap-6 z-10 w-full xl:w-auto">
                <div class="relative">
                    <div class="w-24 h-24 rounded-3xl skeleton border-4 border-white shadow-lg"></div>
                    <div class="absolute -bottom-2 -right-2 w-16 h-6 skeleton rounded-full border border-white"></div>
                </div>
                <div class="text-center md:text-left space-y-2">
                    <div class="h-8 w-64 skeleton rounded-lg"></div>
                    <div class="flex gap-3">
                        <div class="h-5 w-24 skeleton rounded-lg"></div>
                        <div class="h-5 w-24 skeleton rounded-lg"></div>
                    </div>
                </div>
            </div>
            <div class="flex gap-8 items-center z-10 w-full xl:w-auto justify-center xl:justify-end">
                <div class="space-y-2 w-48">
                    <div class="h-4 w-full skeleton rounded-lg"></div>
                    <div class="h-2 w-full skeleton rounded-full"></div>
                </div>
                <div class="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                    <div class="w-16 h-16 rounded-full skeleton"></div>
                    <div class="space-y-1">
                        <div class="h-4 w-20 skeleton rounded"></div>
                        <div class="h-3 w-16 skeleton rounded"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 2. Grid de Widgets (Skeleton) -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <!-- Columna Izquierda: Action Plan & Vitals -->
            <div class="space-y-6">
                <!-- Action Plan Mock -->
                <div class="h-[220px] skeleton-teal rounded-3xl"></div>
                
                <!-- Vitals Grid -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="h-[140px] skeleton rounded-2xl"></div>
                    <div class="h-[140px] skeleton rounded-2xl"></div>
                </div>

                <!-- Next Appointment Mock -->
                <div class="h-[160px] skeleton rounded-2xl"></div>
            </div>

            <!-- Columna Derecha: Chart -->
            <div class="xl:col-span-2 flex flex-col h-full">
                <div class="glass-card p-6 h-full flex flex-col min-h-[460px]">
                    <div class="mb-6 space-y-2">
                        <div class="h-6 w-48 skeleton rounded-lg"></div>
                        <div class="h-4 w-64 skeleton rounded-lg"></div>
                    </div>
                    <div class="flex-1 w-full skeleton rounded-2xl bg-gray-50/50 border border-gray-100"></div>
                </div>
            </div>
        </div>
    </div>
  `
})
export class SkeletonProfileComponent { }
