import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import {
  HealthAlertHint,
  HealthComponentSnapshot,
  HealthComponentStatus,
  HealthHistoryResponse,
  HealthMonitorWindow,
  HealthSnapshotResponse,
} from '../../types';

@Component({
  selector: 'app-admin-health-monitor',
  standalone: false,
  templateUrl: './admin-health-monitor.component.html',
  styleUrls: ['./admin-health-monitor.component.scss'],
})
export class AdminHealthMonitorComponent implements OnInit, OnDestroy {
  snapshot: HealthSnapshotResponse | null = null;
  history: HealthHistoryResponse | null = null;
  components: HealthComponentSnapshot[] = [];
  alerts: HealthAlertHint[] = [];
  selectedWindow: HealthMonitorWindow = '24h';

  isLoading = false;
  isHistoryLoading = false;
  isRefreshing = false;
  errorMessage = '';
  historyError = '';

  private destroy$ = new Subject<void>();
  private pollTimer: number | null = null;
  private pollIntervalMs = 15000;
  private consecutiveErrors = 0;
  private hadOfflineState = false;

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSnapshot(false);
    this.loadHistory('24h');
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  openBackup(): void {
    this.router.navigate(['/admin/backup']);
  }

  openTargetPath(targetPath: string): void {
    this.router.navigate([targetPath]);
  }

  refresh(): void {
    this.loadSnapshot(true);
    this.loadHistory(this.selectedWindow, true);
  }

  selectWindow(window: HealthMonitorWindow): void {
    this.selectedWindow = window;
    this.loadHistory(window);
  }

  getStatusClass(status: HealthComponentStatus): string {
    switch (status) {
      case 'offline':
        return 'status-offline';
      case 'degraded':
        return 'status-degraded';
      case 'warning':
        return 'status-warning';
      default:
        return 'status-ok';
    }
  }

  getStatusIcon(status: HealthComponentStatus): string {
    switch (status) {
      case 'offline':
        return '🔴';
      case 'degraded':
        return '🟡';
      case 'warning':
        return '🟠';
      default:
        return '🟢';
    }
  }

  hasBackupAttention(): boolean {
    const storage = this.components.find((component) => component.id === 'storage');
    return !!storage && (storage.status === 'warning' || storage.status === 'degraded' || storage.status === 'offline');
  }

  formatDateTime(value: string | undefined): string {
    if (!value) {
      return '-';
    }
    return new Date(value).toLocaleString('pt-BR');
  }

  private startPolling(): void {
    if (this.pollTimer !== null) {
      return;
    }

    this.pollTimer = window.setInterval(() => {
      if (document.hidden) {
        return;
      }

      this.loadSnapshot(true);
      if (this.selectedWindow === '24h') {
        this.loadHistory('24h', true);
      }
    }, this.pollIntervalMs);
  }

  private stopPolling(): void {
    if (this.pollTimer !== null) {
      window.clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private loadSnapshot(silent: boolean): void {
    if (silent && this.isRefreshing) {
      return;
    }

    if (!silent) {
      this.isLoading = true;
      this.errorMessage = '';
    } else {
      this.isRefreshing = true;
    }

    this.api
      .getAdminHealthMonitor()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.snapshot = response;
          this.components = response.components || [];
          this.alerts = response.alerts || [];
          this.isLoading = false;
          this.isRefreshing = false;

          const hasOffline = this.components.some((component) => component.status === 'offline');
          if (hasOffline && !this.hadOfflineState && !document.hidden) {
            this.playCriticalBeep();
          }
          this.hadOfflineState = hasOffline;

          this.consecutiveErrors = 0;
          if (this.pollIntervalMs !== 15000) {
            this.pollIntervalMs = 15000;
            this.restartPollingWithBackoff();
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.isRefreshing = false;
          this.errorMessage = error?.error?.error || 'Erro ao carregar status de saude do sistema.';
          this.consecutiveErrors += 1;
          this.pollIntervalMs = Math.min(60000, 15000 + this.consecutiveErrors * 5000);
          this.restartPollingWithBackoff();
        },
      });
  }

  private loadHistory(window: HealthMonitorWindow, silent: boolean = false): void {
    if (!silent) {
      this.isHistoryLoading = true;
      this.historyError = '';
    }

    this.api
      .getAdminHealthMonitorHistory(window)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.history = response;
          this.isHistoryLoading = false;
        },
        error: (error) => {
          this.isHistoryLoading = false;
          this.historyError = error?.error?.error || 'Erro ao carregar historico de metricas.';
        },
      });
  }

  private restartPollingWithBackoff(): void {
    this.stopPolling();
    this.startPolling();
  }

  private playCriticalBeep(): void {
    try {
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch {
      // Silent fallback for browsers that block autoplay/audio context.
    }
  }
}
