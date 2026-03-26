import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OfflineMonitorService } from '../services/offline-monitor.service';
import { SyncManagerService } from '../services/sync-manager.service';

@Injectable()
export class OfflineSyncInterceptor implements HttpInterceptor {
  private readonly OFFLINE_ROUTES = [
    { method: 'POST', pattern: /\/trainings\/start$/ },
    { method: 'POST', pattern: /\/trainings\/\w+\/attendance$/ },
    { method: 'POST', pattern: /\/trainings\/\w+\/techniques$/ },
    { method: 'PUT', pattern: /\/trainings\/\w+\/notes$/ },
    { method: 'POST', pattern: /\/trainings\/\w+\/confirm$/ },
    { method: 'PUT', pattern: /\/trainings\/\w+$/ },
    { method: 'DELETE', pattern: /\/trainings\/\w+$/ },
    { method: 'PATCH', pattern: /\/trainings\/\w+\/restore$/ }
  ];

  constructor(
    private offlineMonitor: OfflineMonitorService,
    private syncManager: SyncManagerService
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Check if error is connection-related
        if (this.isNetworkError(error) && !this.offlineMonitor.isOnline()) {
          // Try to enqueue the request
          if (this.canEnqueue(req)) {
            return this.enqueueAndReturnOfflineSuccess(req);
          }
        }

        return throwError(error);
      })
    );
  }

  /**
   * Determine if error is network-related
   */
  private isNetworkError(error: HttpErrorResponse): boolean {
    // Network errors typically have status 0
    return error.status === 0 || 
           error.error instanceof ProgressEvent ||
           error.error instanceof Error;
  }

  /**
   * Check if this request can be enqueued for offline sync
   */
  private canEnqueue(req: HttpRequest<any>): boolean {
    const url = req.url;
    
    return this.OFFLINE_ROUTES.some(route => 
      route.method === req.method && route.pattern.test(url)
    );
  }

  /**
   * Enqueue request and return a successful offline response
   */
  private enqueueAndReturnOfflineSuccess(req: HttpRequest<any>): Observable<HttpEvent<any>> {
    // Extract resource type from URL
    const resource = this.extractResource(req.url);
    const resourceId = this.extractResourceId(req.url);
    const action = this.mapMethodToAction(req.method);

    // Enqueue for later sync
    return new Observable(observer => {
      this.syncManager.enqueueOperation(
        action as any,
        resource,
        req.body || {},
        resourceId
      ).then(() => {
        // Return a mock success response
        const mockResponse: any = {
          success: true,
          queued_locally: true,
          message: 'Operação salva localmente e sincronizará quando conectar',
          data: {
            operation_enqueued: true,
            resource,
            action
          }
        };

        observer.next({
          body: mockResponse,
          headers: req.headers,
          status: 200,
          statusText: 'OK',
          type: 4, // HttpResponse type
          url: req.url
        } as any);

        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Extract resource type from URL
   */
  private extractResource(url: string): string {
    if (url.includes('/trainings/start')) return 'training';
    if (url.includes('/notes')) return 'training_notes';
    if (url.includes('/techniques')) return 'training_technique';
    if (url.includes('/attendance')) return 'training_attendance';
    if (url.includes('/confirm')) return 'training';
    return 'training';
  }

  /**
   * Extract resource ID from URL
   */
  private extractResourceId(url: string): string | undefined {
    // Match pattern: /trainings/{uuid}
    const match = url.match(/\/trainings\/([a-f0-9-]{36})/);
    return match ? match[1] : undefined;
  }

  /**
   * Map HTTP method to sync action
   */
  private mapMethodToAction(method: string): string {
    switch (method.toUpperCase()) {
      case 'POST':
        return 'CREATE';
      case 'PUT':
      case 'PATCH':
        return 'UPDATE';
      case 'DELETE':
        return 'DELETE';
      default:
        return 'CREATE';
    }
  }
}
