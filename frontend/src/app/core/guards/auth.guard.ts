import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';

/**
 * Verifica si el JWT (access_token) existe y no ha expirado.
 * Si la sesión no es válida, borra los datos y redirige al Login.
 * 
 * SEGURIDAD: Aplica a todas las rutas bajo /dashboard y rutas protegidas.
 * Impide acceso directo por URL sin sesión activa.
 */
function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // `exp` es Unix timestamp en segundos
        return Date.now() >= payload.exp * 1000;
    } catch {
        // Si el token no es un JWT válido, trátalo como expirado
        return true;
    }
}

export const authGuard: CanActivateFn = (_route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const token = authService.getToken();

    // Sin token -> no autenticado
    if (!token) {
        router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
        });
        return false;
    }

    // Token expirado -> limpiar sesión y redirigir
    if (isTokenExpired(token)) {
        authService.logout();
        router.navigate(['/login'], {
            queryParams: { returnUrl: state.url, reason: 'session_expired' }
        });
        return false;
    }

    return true;
};

/**
 * Guard para rutas PÚBLICAS (login, registro).
 * Si el usuario YA tiene sesión válida, lo redirige al dashboard.
 */
export const publicGuard: CanActivateFn = (_route, _state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const token = authService.getToken();
    if (token && !isTokenExpired(token)) {
        router.navigate(['/dashboard']);
        return false;
    }
    return true;
};

/**
 * Guard para la ruta de verificación 2FA (/auth/2fa).
 * Solo permite el acceso si hay una verificación de dos pasos PENDIENTE:
 * - El usuario aún NO tiene sesión completa (sin access_token válido).
 * - Existe un temp_2fa_token emitido por el backend en el paso previo del login.
 * Cualquier otro acceso se redirige a /login.
 */
export const twoFactorPendingGuard: CanActivateFn = (_route, _state) => {
    const authService = inject(AuthService);
    const storageService = inject(StorageService);
    const router = inject(Router);

    // Ya autenticado (verificación completa) -> no debe estar aquí
    if (authService.getToken()) {
        router.navigate(['/dashboard']);
        return false;
    }

    // Sin temp token pendiente -> no hay verificación 2FA en curso
    if (!storageService.getItem('temp_2fa_token')) {
        router.navigate(['/login']);
        return false;
    }

    return true;
};
