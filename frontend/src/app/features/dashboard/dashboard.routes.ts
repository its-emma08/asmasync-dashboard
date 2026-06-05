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
                data: { breadcrumb: 'Pacientes' },
                loadComponent: () => import('./patient-list/patient-list.component').then(m => m.PatientListComponent)
            },
            {
                path: 'patients/new',
                data: { breadcrumb: 'Nuevo Paciente' },
                loadComponent: () => import('./patient-form/patient-form.component').then(m => m.PatientFormComponent),
                canDeactivate: [pendingChangesGuard]
            },
            {
                // BUG-002 fix: edit/:id must come before :id to prevent :id from matching 'edit'
                path: 'patients/edit/:id',
                data: { breadcrumb: 'Editar Paciente' },
                loadComponent: () => import('./patient-form/patient-form.component').then(m => m.PatientFormComponent),
                canDeactivate: [pendingChangesGuard]
            },
            {
                path: 'patients/:id/clinical-history',
                data: { breadcrumb: 'Historia Clínica' },
                loadComponent: () => import('../reports/clinical-history/clinical-history.component').then(m => m.ClinicalHistoryComponent)
            },
            {
                path: 'patients/:id',
                data: { breadcrumb: 'Detalle' },
                loadComponent: () => import('./patient-detail/patient-detail.component').then(m => m.PatientDetailComponent)
            },
            {
                path: 'calendar',
                data: { breadcrumb: 'Calendario' },
                loadComponent: () => import('../calendar/schedule/schedule.component').then(m => m.ScheduleComponent)
            },
            {
                path: 'alerts',
                data: { breadcrumb: 'Alertas' },
                loadComponent: () => import('../alerts/alert-panel/alert-panel.component').then(m => m.AlertPanelComponent)
            },
            {
                path: 'interventions/new',
                data: { breadcrumb: 'Nueva Intervención' },
                loadComponent: () => import('../interventions/intervention-form/intervention-form.component').then(m => m.InterventionFormComponent),
                canDeactivate: [pendingChangesGuard]
            },
            {
                path: 'reports',
                data: { breadcrumb: 'Reportes' },
                loadComponent: () => import('../reports/report-generator/report-generator.component').then(m => m.ReportGeneratorComponent)
            },
            {
                path: 'profile',
                data: { breadcrumb: 'Perfil' },
                loadComponent: () => import('../profile/profile.component').then(m => m.ProfileComponent)
            },
            {
                path: 'help',
                data: { breadcrumb: 'Ayuda' },
                loadComponent: () => import('./help/help.component').then(m => m.HelpComponent)
            },
            {
                path: 'settings',
                data: { breadcrumb: 'Configuración' },
                loadComponent: () => import('../settings/settings.component').then(m => m.SettingsComponent)
            },
            {
                path: 'hospital',
                data: { breadcrumb: 'Hospital' },
                loadChildren: () => import('../hospital/hospital.routes').then(m => m.HOSPITAL_ROUTES)
            }
        ]
    }
];
