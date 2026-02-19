import { Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
        data: { animation: 'LoginPage' }
    },
    {
        path: 'auth/register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
        data: { animation: 'RegisterPage' }
    },
    {
        path: 'auth/forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        data: { animation: 'ForgotPasswordPage' }
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
        canActivate: [AuthGuard]
    },
    {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
        canActivate: [AuthGuard],
        data: { animation: 'DashboardPage' }
    },
    {
        path: 'onboarding/iot-connection',
        loadComponent: () => import('./features/onboarding/iot-connection/iot-connection.component').then(m => m.IotConnectionComponent),
        canActivate: [AuthGuard],
        data: { animation: 'OnboardingPage' }
    },
    { path: '**', redirectTo: '/login' }
];
