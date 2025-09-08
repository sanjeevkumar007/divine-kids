import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    return next(req).pipe(
        catchError(err => {
            console.warn('[ErrorInterceptor]', req.url, 'status', err.status, err);
            // TEMP: comment out redirect until token issue solved
            // if (err.status === 401 || err.status === 403) { ... }
            return throwError(() => err);
        })
    );
};