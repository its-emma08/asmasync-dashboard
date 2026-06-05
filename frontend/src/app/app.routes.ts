import { Routes } from '@angular/router';

import { authGuard, publicGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
        canActivate: [publicGuard],
        data: { animation: 'LoginPage' }
    },
    {
        path: 'auth/register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
        canActivate: [publicGuard],
        data: { animation: 'RegisterPage' }
    },
    {
        path: 'auth/forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        data: { animation: 'ForgotPasswordPage' }
    },
    {
        // Ruta de activación para doctores invitados por el administrador.
        // Supabase redirige aquí después del clic en el magic link de invitación.
        path: 'auth/invite-complete',
        loadComponent: () => import('./features/auth/invite-complete/invite-complete.component').then(m => m.InviteCompleteComponent),
        data: { animation: 'InviteCompletePage' }
    },
    {
        path: 'auth/2fa',
        loadComponent: () => import('./features/auth/two-factor/two-factor.component').then(m => m.TwoFactorComponent),
        data: { animation: 'TwoFactorPage' }
    },
    {
        path: 'auth/change-password',
        loadComponent: () => import('./features/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent),
        data: { animation: 'ChangePasswordPage' },
        canActivate: [authGuard]
    },
    {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
        canActivate: [authGuard],
        data: { animation: 'DashboardPage', breadcrumb: 'Tablero' }
    },
    {
        path: 'onboarding/iot-connection',
        loadComponent: () => import('./features/onboarding/iot-connection/iot-connection.component').then(m => m.IotConnectionComponent),
        canActivate: [authGuard],
        data: { animation: 'OnboardingPage' }
    },
    { path: '**', redirectTo: '/login' }
];
