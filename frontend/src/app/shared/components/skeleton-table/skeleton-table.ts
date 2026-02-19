import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full rounded-3xl bg-white border border-gray-100 p-6 shadow-sm overflow-hidden">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6 animate-pulse">
            <div class="h-6 w-32 bg-slate-200 rounded-lg"></div>
            <div class="h-8 w-24 bg-slate-200 rounded-lg"></div>
        </div>

        <!-- Rows -->
        <div class="space-y-4">
            <div *ngFor="let i of [1,2,3,4,5]" class="flex items-center gap-4 animate-pulse">
                <div class="h-10 w-10 bg-slate-200 rounded-full flex-shrink-0"></div>
                <div class="flex-1 space-y-2">
                    <div class="h-4 w-3/4 bg-slate-200 rounded"></div>
                    <div class="h-3 w-1/2 bg-slate-100 rounded"></div>
                </div>
                <div class="h-8 w-20 bg-slate-200 rounded-lg"></div>
            </div>
        </div>
    </div>
  `
})
export class SkeletonTableComponent { }
