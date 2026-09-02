import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const authenticatedRequest = withBearerToken(request, auth.accessToken);

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || isSessionEntryPoint(request.url)) {
        return throwError(() => error);
      }

      return auth.refreshSession().pipe(
        switchMap((refreshed) => {
          const refreshedToken = auth.accessToken;
          return refreshed && refreshedToken
            ? next(withBearerToken(request, refreshedToken))
            : throwError(() => error);
        }),
      );
    }),
  );
};

function withBearerToken(request: HttpRequest<unknown>, accessToken: string | null): HttpRequest<unknown> {
  if (!accessToken || !request.url.startsWith('/api/') || isSessionEntryPoint(request.url)) {
    return request;
  }

  return request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } });
}

function isSessionEntryPoint(url: string): boolean {
  return ['/login', '/register', '/refresh', '/forgot-password', '/reset-password']
    .some((endpoint) => url.endsWith(endpoint));
}
