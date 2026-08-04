import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RoleType, normalizeRole } from '../models/role.model';

/**
 * Guard genérico por rol.
 * Uso: canActivate: [authGuard, roleGuard(['admin', 'doctor'])]
 * Redirige a /login si no hay sesión y a /dashboard con error si el rol no coincide.
 */
export function roleGuard(allowedRoles: RoleType[]): CanActivateFn {
    return (_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) => {
        const authService = inject(AuthService);
        const router = inject(Router);

        // El usuario se restaura de forma síncrona desde storage al iniciar (loadUserFromSession).
        const current = authService.currentUserValue;
        if (!current) {
            router.navigate(['/login'], { queryParams: { returnUrl: _state.url } });
            return false;
        }

        const role = normalizeRole(current.role);
        if (allowedRoles.includes(role)) {
            return true;
        }

        router.navigate(['/dashboard'], { queryParams: { error: 'access_denied' } });
        return false;
    };
}
