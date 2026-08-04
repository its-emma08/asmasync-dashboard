import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';

export const HOSPITAL_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('./hospital-dashboard/hospital-dashboard.component').then(m => m.HospitalDashboardComponent)
  }
];
