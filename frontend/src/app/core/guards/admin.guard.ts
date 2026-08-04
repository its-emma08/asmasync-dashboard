import { CanActivateFn } from '@angular/router';
import { roleGuard } from './role.guard';

/** Guard para rutas exclusivas de administradores. */
export const adminGuard: CanActivateFn = roleGuard(['admin']);