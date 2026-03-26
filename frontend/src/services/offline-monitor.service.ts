import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject, interval, Observable } from 'rxjs';
import { switchMap, debounceTime } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

type ConnectionState = 'online' | 'offline' | 'checking';

@Injectable({
  providedIn: 'root'
})
export class OfflineMonitorService {
  private isOnline$ = new BehaviorSubject<boolean>(navigator.onLine);
  private connectionState$ = new BehaviorSubject<ConnectionState>(
    navigator.onLine ? 'online' : 'offline'
  );
  private statusChanged$ = new Subject<{ state: ConnectionState; timestamp: number }>();

  private readonly HEALTH_CHECK_URL = '/api/health';
  private readonly HEALTH_CHECK_TIMEOUT = 2000; // ms
  private readonly HEALTH_CHECK_INTERVAL = 10000; // Check every 10s when offline

  constructor(
    private ngZone: NgZone,
    private http: HttpClient
  ) {
    this.initializeOnlineOfflineListeners();
    this.initializePeriodicHealthCheck();
  }

  /**
   * Observable of current online state
   */
  getIsOnline$(): Observable<boolean> {
    return this.isOnline$.asObservable();
  }

  /**
   * Observable of connection state transitions
   */
  getStatusChanged$(): Observable<{ state: ConnectionState; timestamp: number }> {
    return this.statusChanged$.asObservable();
  }

  /**
   * Observable of connection state (online/offline/checking)
   */
  getConnectionState$(): Observable<ConnectionState> {
    return this.connectionState$.asObservable();
  }

  /**
   * Get current online status synchronously
   */
  isOnline(): boolean {
    return this.isOnline$.value;
  }

  /**
   * Get current connection state synchronously
   */
  getConnectionState(): ConnectionState {
    return this.connectionState$.value;
  }

  /**
   * Manually check connection (returns promise)
   */
  async checkConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.HEALTH_CHECK_TIMEOUT);

      const response = await fetch(this.HEALTH_CHECK_URL, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Wait for connection to be established
   */
  async waitForConnection(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isOnline$.value) {
        resolve();
        return;
      }

      const subscription = this.isOnline$.subscribe((isOnline) => {
        if (isOnline) {
          subscription.unsubscribe();
          resolve();
        }
      });
    });
  }

  /**
   * Initialize native browser online/offline event listeners
   */
  private initializeOnlineOfflineListeners(): void {
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('online', () => {
        this.ngZone.run(() => this.handleOnline());
      });

      window.addEventListener('offline', () => {
        this.ngZone.run(() => this.handleOffline());
      });
    });
  }

  /**
   * Initialize periodic health checks when offline
   */
  private initializePeriodicHealthCheck(): void {
    this.ngZone.runOutsideAngular(() => {
      this.isOnline$
        .pipe(
          switchMap((isOnline) => {
            if (isOnline) {
              return interval(0); // No need to check when already online
            }
            return interval(this.HEALTH_CHECK_INTERVAL);
          }),
          debounceTime(500)
        )
        .subscribe(() => {
          this.ngZone.run(async () => {
            if (!this.isOnline$.value) {
              const isConnected = await this.checkConnection();
              if (isConnected) {
                this.handleOnline();
              }
            }
          });
        });
    });
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    this.connectionState$.next('checking');

    // Brief check to confirm connection before transitioning to online
    setTimeout(async () => {
      const isConnected = await this.checkConnection();
      
      if (isConnected) {
        this.isOnline$.next(true);
        this.connectionState$.next('online');
        this.statusChanged$.next({
          state: 'online',
          timestamp: Date.now()
        });
      } else {
        // Check failed, stay offline
        this.connectionState$.next('offline');
      }
    }, 1000); // Wait 1s for connection to stabilize
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    this.isOnline$.next(false);
    this.connectionState$.next('offline');
    this.statusChanged$.next({
      state: 'offline',
      timestamp: Date.now()
    });
  }
}
