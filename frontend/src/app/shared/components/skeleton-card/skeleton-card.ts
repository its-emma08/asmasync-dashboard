import { Component } from '@angular/core';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  template: `
    <div class="h-full w-full rounded-3xl bg-white border border-gray-100 p-6 animate-pulse flex flex-col justify-between shadow-sm">
      <div class="flex justify-between items-start">
        <div class="h-4 w-24 bg-slate-200 rounded-lg"></div>
        <div class="h-8 w-8 bg-slate-200 rounded-full"></div>
      </div>
      <div class="space-y-3 mt-4">
        <div class="h-8 w-16 bg-slate-300 rounded-lg"></div>
        <div class="h-4 w-32 bg-slate-200 rounded-lg"></div>
      </div>
    </div>
  `
})
export class SkeletonCardComponent { }
