import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

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
