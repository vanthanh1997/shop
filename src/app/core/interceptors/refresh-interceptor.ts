import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { SKIP_AUTH } from '@core/api/http-context';
import { AuthStore } from '@core/auth/auth-store';
import { TokenStorage } from '@core/auth/token-storage';

export const RETRY_ATTEMPTED = new HttpContextToken<boolean>(() => false);

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_AUTH)) {
    return next(req);
  }

  if (req.context.get(RETRY_ATTEMPTED)) {
    return next(req);
  }

  const authStore = inject(AuthStore);
  const tokens = inject(TokenStorage);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== HttpStatusCode.Unauthorized) {
        return throwError(() => error);
      }
      if (tokens.refreshToken === null) {
        return throwError(() => error);
      }

      return authStore.refreshAccessToken().pipe(
        switchMap((accessToken) =>
          next(
            req.clone({
              context: req.context.set(RETRY_ATTEMPTED, true).set(SKIP_AUTH, true),
              setHeaders: { Authorization: `Bearer ${accessToken}` },
            }),
          ),
        ),
        catchError(() =>

          throwError(() => error),
        ),
      );
    }),
  );
};
