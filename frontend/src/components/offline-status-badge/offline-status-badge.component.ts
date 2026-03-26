import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OfflineMonitorService } from '../../services/offline-monitor.service';
import { SyncManagerService, SyncProgress } from '../../services/sync-manager.service';

type ConnectionState = 'online' | 'offline' | 'checking' | 'syncing';

@Component({
  selector: 'app-offline-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="offline-badge" [ngClass]="'state-' + connectionState">
      <span class="badge-icon">{{ getBadgeIcon() }}</span>
      <span class="badge-text">{{ getBadgeText() }}</span>
      <span *ngIf="syncProgress.inProgress && syncProgress.total > 0" class="sync-counter">
        ({{ syncProgress.current }}/{{ syncProgress.total }})
      </span>
    </div>
  `,
  styles: [`
    .offline-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.3s ease;
      white-space: nowrap;
    }

    .badge-icon {
      font-size: 14px;
      display: inline-block;
    }

    .sync-counter {
      font-size: 11px;
      opacity: 0.8;
    }

    .state-online {
      background-color: #d1fae5;
      color: #065f46;
      border: 1px solid #6ee7b7;
    }

    .state-offline {
      background-color: #fee2e2;
      color: #991b1b;
      border: 1px solid #fca5a5;
      animation: pulse-offline 2s infinite;
    }

    .state-checking {
      background-color: #fef3c7;
      color: #92400e;
      border: 1px solid #fcd34d;
      animation: pulse-checking 1s infinite;
    }

    .state-syncing {
      background-color: #dbeafe;
      color: #0c4a6e;
      border: 1px solid #7dd3fc;
      animation: pulse-syncing 1.5s infinite;
    }

    @keyframes pulse-offline {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    @keyframes pulse-checking {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }

    @keyframes pulse-syncing {
      0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
      50% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3); }
    }
  `]
})
export class OfflineStatusBadgeComponent implements OnInit, OnDestroy {
  connectionState: ConnectionState = 'online';
  syncProgress: SyncProgress = { inProgress: false, current: 0, total: 0 };
  private baseConnectionState: Exclude<ConnectionState, 'syncing'> = 'online';
  private isSyncing = false;

  private destroy$ = new Subject<void>();

  constructor(
    private offlineMonitor: OfflineMonitorService,
    private syncManager: SyncManagerService
  ) {}

  ngOnInit(): void {
    this.offlineMonitor.getConnectionState$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.baseConnectionState = state;
        this.updateConnectionState();
      });

    this.syncManager.getSyncProgress$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => {
        this.syncProgress = progress;
        this.isSyncing = progress.inProgress;
        this.updateConnectionState();
      });

    this.syncManager.getSyncInProgress$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(inProgress => {
        this.isSyncing = inProgress;
        this.updateConnectionState();
      });
  }

  private updateConnectionState(): void {
    this.connectionState = this.isSyncing ? 'syncing' : this.baseConnectionState;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getBadgeIcon(): string {
    switch (this.connectionState) {
      case 'online':
        return '🟢';
      case 'offline':
        return '🔴';
      case 'checking':
        return '🟡';
      case 'syncing':
        return '⟳';
      default:
        return '⚪';
    }
  }

  getBadgeText(): string {
    switch (this.connectionState) {
      case 'online':
        return 'Sincronizado';
      case 'offline':
        return 'Offline';
      case 'checking':
        return 'Conectando...';
      case 'syncing':
        return 'Sincronizando...';
      default:
        return 'Status desconhecido';
    }
  }
}
