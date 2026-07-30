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
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ opacity: 0, transform: 'scale(1.02)' }))
      ])
    ])
  ]
})
export class SkeletonDashboardComponent {}
