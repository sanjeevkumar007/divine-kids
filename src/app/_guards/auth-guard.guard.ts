import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../common/auth-service.service';

export const authGuard: CanActivateFn = (_r, s) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token;
  console.log('[Guard] state:', s.url, 'token present?', !!token, 'raw token:', token);

  if (!token) {
    console.log('[Guard] NO TOKEN -> /auth');
    router.navigate(['/auth'], { queryParams: { returnUrl: s.url } });
    return false;
  }

  // TEMP: skip expiry check to isolate issue
  console.log('[Guard] allow navigation');
  return true;
};
