import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './dashboard-layout/dashboard-layout.component';

export const DASHBOARD_ROUTES: Routes = [
    {
        path: '',
        component: DashboardLayoutComponent,
        children: [
            {
                path: '',
                loadComponent: () => import('./dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent)
            },
            {
                path: 'patients',
                loadComponent: () => import('./patient-list/patient-list.component').then(m => m.PatientListComponent)
            },
            {
                path: 'patients/:id',
                loadComponent: () => import('./patient-detail/patient-detail.component').then(m => m.PatientDetailComponent)
            },
            {
                path: 'alerts',
                loadComponent: () => import('../alerts/alert-panel/alert-panel.component').then(m => m.AlertPanelComponent)
            },
            {
                path: 'interventions/new',
                loadComponent: () => import('../interventions/intervention-form/intervention-form.component').then(m => m.InterventionFormComponent)
            },
            {
                path: 'reports',
                loadComponent: () => import('../reports/report-generator/report-generator.component').then(m => m.ReportGeneratorComponent)
            }
        ]
    }
];
