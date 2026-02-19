import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './dashboard-layout/dashboard-layout.component';
import { pendingChangesGuard } from '../../core/guards/pending-changes.guard';

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
                path: 'patients/new',
                loadComponent: () => import('./patient-form/patient-form.component').then(m => m.PatientFormComponent),
                canDeactivate: [pendingChangesGuard]
            },
            {
                path: 'patients/:id/clinical-history',
                loadComponent: () => import('../reports/clinical-history/clinical-history.component').then(m => m.ClinicalHistoryComponent)
            },
            {
                path: 'patients/:id',
                loadComponent: () => import('./patient-detail/patient-detail.component').then(m => m.PatientDetailComponent)
            },
            {
                path: 'patients/edit/:id',
                loadComponent: () => import('./patient-form/patient-form.component').then(m => m.PatientFormComponent),
                canDeactivate: [pendingChangesGuard]
            },
            {
                path: 'calendar',
                loadComponent: () => import('../calendar/schedule/schedule.component').then(m => m.ScheduleComponent)
            },
            {
                path: 'alerts',
                loadComponent: () => import('../alerts/alert-panel/alert-panel.component').then(m => m.AlertPanelComponent)
            },
            {
                path: 'interventions/new',
                loadComponent: () => import('../interventions/intervention-form/intervention-form.component').then(m => m.InterventionFormComponent),
                canDeactivate: [pendingChangesGuard]
            },
            {
                path: 'reports',
                loadComponent: () => import('../reports/report-generator/report-generator.component').then(m => m.ReportGeneratorComponent)
            },
            {
                path: 'profile',
                loadComponent: () => import('../profile/profile.component').then(m => m.ProfileComponent)
            },
            {
                path: 'help',
                loadComponent: () => import('./help/help.component').then(m => m.HelpComponent)
            },
            {
                path: 'settings',
                loadComponent: () => import('../settings/settings.component').then(m => m.SettingsComponent)
            }
        ]
    }
];
