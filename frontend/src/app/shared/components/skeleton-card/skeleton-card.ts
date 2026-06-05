import { Component } from '@angular/core';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  template: `
    <div class="h-full w-full rounded-2xl bg-white border border-[#E2E8F0] p-6 flex flex-col justify-between overflow-hidden relative">
      <!-- Shimmer Overlay -->
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-slate-50/50 to-transparent skew-x-[-20deg] animate-shimmer"></div>
      
      <div class="flex justify-between items-start relative z-10">
        <div class="space-y-3">
          <div class="h-2.5 w-16 bg-slate-100 rounded-full"></div>
          <div class="h-6 w-40 bg-slate-50 rounded-md"></div>
        </div>
        <div class="h-8 w-8 bg-slate-50 rounded-lg border border-slate-100/50"></div>
      </div>

      <div class="space-y-4 mt-auto relative z-10">
        <div class="flex items-end gap-2">
          <div class="h-8 w-20 bg-slate-50 rounded-lg"></div>
          <div class="h-3 w-10 bg-slate-100 rounded-full mb-1"></div>
        </div>
        <div class="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
          <div class="h-full w-1/4 bg-blue-500/10 rounded-full"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes shimmer {
      0% { transform: translateX(-200%) skewX(-20deg); }
      100% { transform: translateX(300%) skewX(-20deg); }
    }
    .animate-shimmer {
      animation: shimmer 2s infinite linear;
    }
  `]
})
export class SkeletonCardComponent { }
