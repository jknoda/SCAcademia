import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authReq = this.addAuthHeader(req);

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && this.shouldAttemptRefresh(authReq.url)) {
          return this.handle401Error(authReq, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addAuthHeader(req: HttpRequest<any>): HttpRequest<any> {
    const token = this.api.getAccessToken();
    if (!token || this.isTokenlessEndpoint(req.url)) {
      return req;
    }

    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter((token): token is string => token !== null),
        take(1),
        switchMap((token) => next.handle(this.setAuthHeader(req, token)))
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    return this.api.refreshToken().pipe(
      switchMap((response) => {
        this.isRefreshing = false;
        this.api.setAccessToken(response.accessToken);
        this.refreshTokenSubject.next(response.accessToken);
        return next.handle(this.setAuthHeader(req, response.accessToken));
      }),
      catchError((refreshError) => {
        this.isRefreshing = false;
        this.api.clearTokens();
        this.refreshTokenSubject.next(null);
        this.router.navigate(['/login']);
        return throwError(() => refreshError);
      })
    );
  }

  private setAuthHeader(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private shouldAttemptRefresh(url: string): boolean {
    return !url.includes('/auth/login') && !url.includes('/auth/refresh');
  }

  private isTokenlessEndpoint(url: string): boolean {
    return (
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/setup/init') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password')
    );
  }
}
