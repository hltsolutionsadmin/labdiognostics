import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { AuthSignalService } from './auth-signal.service';

export class AuthTokenInterceptor implements HttpInterceptor {
  private readonly auth = inject(AuthSignalService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.auth.accessToken();

    if (!token) {
      return next.handle(req);
    }

    const isProtected = req.url.includes('/api/');
    if (!isProtected) {
      return next.handle(req);
    }

    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    return next.handle(authReq).pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse) {
          throw err;
        }
        throw err;
      })
    );
  }
}

