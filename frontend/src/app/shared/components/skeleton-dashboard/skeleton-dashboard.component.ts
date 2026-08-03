import { Component } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton-dashboard.component.html',
  styleUrls: ['./skeleton-dashboard.component.scss'],
  animations: [
    trigger('skeletonFadeOut', [
      transition(':leave', [
        style({ opacity: 1, transform: 'scale(1)' }),
        animate('120ms ease-out', 
          style({ opacity: 0 }))

      ])
    ])
  ]
})
export class SkeletonDashboardComponent {}
