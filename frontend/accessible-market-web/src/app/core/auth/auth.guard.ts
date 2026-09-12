import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.restoreSession().pipe(
    map((authenticated) =>
      authenticated
        ? true
        : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }),
    ),
  );
};

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = (route.data?.['roles'] as readonly string[] | undefined) ?? [];

  return auth.restoreSession().pipe(
    map((authenticated) => {
      if (!authenticated) {
        return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
      }

      if (allowedRoles.length === 0 || auth.hasAnyRole(allowedRoles)) {
        return true;
      }

      return router.createUrlTree(['/account'], { queryParams: { accessDenied: '1' } });
    }),
  );
};
