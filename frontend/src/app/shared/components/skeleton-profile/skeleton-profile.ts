import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-pulse">
        <!-- Header Banner -->
        <div class="h-48 w-full bg-slate-200 rounded-3xl relative overflow-hidden">
            <div class="absolute bottom-6 left-6 flex items-end gap-4">
                <div class="h-24 w-24 bg-slate-300 rounded-3xl border-4 border-white"></div>
                <div class="space-y-2 mb-2">
                    <div class="h-8 w-48 bg-slate-300 rounded-lg"></div>
                    <div class="h-4 w-32 bg-slate-300 rounded-lg"></div>
                </div>
            </div>
        </div>

        <!-- Grid Content -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="h-64 bg-slate-100 rounded-3xl"></div>
            <div class="h-64 bg-slate-100 rounded-3xl"></div>
            <div class="h-64 bg-slate-100 rounded-3xl"></div>
        </div>
    </div>
  `
})
export class SkeletonProfileComponent { }
