import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { adminGuard } from '../../core/guards/admin.guard';

export const HOSPITAL_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./hospital-dashboard/hospital-dashboard.component').then(m => m.HospitalDashboardComponent)
  }
];
