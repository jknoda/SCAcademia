import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

import { ApiService } from './api.service';
import { AuthInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', [
      'getAccessToken',
      'refreshToken',
      'setAccessToken',
      'clearTokens',
    ]);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    apiSpy.getAccessToken.and.returnValue('expired-token');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: ApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true,
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('propaga erro para requisicoes em espera quando refresh falha', fakeAsync(() => {
    const refreshSubject = new Subject<{ accessToken: string }>();
    const errors: HttpErrorResponse[] = [];

    apiSpy.refreshToken.and.returnValue(refreshSubject.asObservable());

    http.get('/secure/profile').subscribe({
      next: () => fail('A requisicao deveria falhar'),
      error: (error: HttpErrorResponse) => errors.push(error),
    });
    http.get('/secure/dashboard').subscribe({
      next: () => fail('A requisicao deveria falhar'),
      error: (error: HttpErrorResponse) => errors.push(error),
    });

    const firstRequest = httpMock.expectOne('/secure/profile');
    const secondRequest = httpMock.expectOne('/secure/dashboard');

    expect(firstRequest.request.headers.get('Authorization')).toBe('Bearer expired-token');
    expect(secondRequest.request.headers.get('Authorization')).toBe('Bearer expired-token');

    firstRequest.flush({}, { status: 401, statusText: 'Unauthorized' });
    secondRequest.flush({}, { status: 401, statusText: 'Unauthorized' });

    refreshSubject.error(new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }));
    tick();

    expect(errors.length).toBe(2);
    expect(apiSpy.clearTokens).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  }));
});