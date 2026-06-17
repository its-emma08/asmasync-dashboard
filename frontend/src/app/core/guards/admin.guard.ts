import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take } from 'rxjs/operators';

export const adminGuard: CanActivateFn = (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    filter(user => user !== null),
    take(1),
    map(user => {
      if (user && user.role === 'admin') {
        return true;
      }
      router.navigate(['/dashboard'], { queryParams: { error: 'access_denied' } });
      return false;
    })
  );
};
