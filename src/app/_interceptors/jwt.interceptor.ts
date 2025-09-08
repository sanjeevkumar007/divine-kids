import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../common/auth-service.service';

const SKIP = ['/auth/login', '/auth/register'];

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token; // assumes AuthService exposes getter

  // Skip adding header for auth endpoints or if already present
  if (token && !SKIP.some(p => req.url.includes(p)) && !req.headers.has('Authorization')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token.trim()}`
      }
    });
  }
  return next(req);
};
