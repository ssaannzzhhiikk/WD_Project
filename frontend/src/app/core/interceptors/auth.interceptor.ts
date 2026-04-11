import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const isLoginRequest = request.url.includes(API_ENDPOINTS.auth.login);
  const isExternalAirRequest =
    request.url.includes('/almaty-air/') || request.url.includes('api.air.org.kz');

  const authenticatedRequest =
    token && !isLoginRequest && !isExternalAirRequest
      ? request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        })
      : request;

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isLoginRequest && !isExternalAirRequest) {
        authService.handleUnauthorized();
      }

      return throwError(() => error);
    }),
  );
};
