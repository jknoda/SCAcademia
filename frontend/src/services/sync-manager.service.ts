import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { OfflineStorageService, SyncQueueEntry } from './offline-storage.service';
import { OfflineMonitorService } from './offline-monitor.service';
import { ApiService } from './api.service';

export interface SyncProgress {
  inProgress: boolean;
  current: number;
  total: number;
  batchId?: string;
  elapsedMs?: number;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: number;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SyncManagerService {
  private syncInProgress$ = new BehaviorSubject<boolean>(false);
  private syncProgress$ = new BehaviorSubject<SyncProgress>({
    inProgress: false,
    current: 0,
    total: 0
  });
  private pendingCount$ = new BehaviorSubject<number>(0);
  private syncCompleted$ = new Subject<SyncResult>();
  private conflictDetected$ = new Subject<{ resourceId: string; serverVersion: any }>();

  private readonly AUTO_SYNC_DELAY_MS = 2000; // Wait 2s after reconnection
  private readonly MAX_BATCH_SIZE = 50;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor(
    private offlineStorage: OfflineStorageService,
    private offlineMonitor: OfflineMonitorService,
    private api: ApiService
  ) {
    this.initializeAutoSync();
    this.initializePendingCountUpdate();
  }

  private generateId(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }

    return `sync-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  /**
   * Observable: is sync currently in progress
   */
  getSyncInProgress$(): Observable<boolean> {
    return this.syncInProgress$.asObservable();
  }

  /**
   * Observable: sync progress (current/total)
   */
  getSyncProgress$(): Observable<SyncProgress> {
    return this.syncProgress$.asObservable();
  }

  /**
   * Observable: count of pending operations
   */
  getPendingCount$(): Observable<number> {
    return this.pendingCount$.asObservable();
  }

  /**
   * Observable: emitted when sync completes
   */
  getSyncCompleted$(): Observable<SyncResult> {
    return this.syncCompleted$.asObservable();
  }

  /**
   * Observable: emitted when conflict is detected
   */
  getConflictDetected$(): Observable<{ resourceId: string; serverVersion: any }> {
    return this.conflictDetected$.asObservable();
  }

  /**
   * Enqueue an operation for offline persistence
   */
  async enqueueOperation(
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE',
    resource: string,
    payload: Record<string, unknown>,
    resourceId?: string
  ): Promise<string> {
    const entry: SyncQueueEntry = {
      id: this.generateId(),
      batchId: '',
      action,
      resource,
      resourceId,
      payload,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    };

    return await this.offlineStorage.putInQueue(entry);
  }

  /**
   * Start synchronization of pending operations
   */
  async startSync(): Promise<SyncResult> {
    if (this.syncInProgress$.value) {
      return { success: false, synced: 0, failed: 0, conflicts: 0, errors: ['Sync already in progress'] };
    }

    this.syncInProgress$.next(true);
    const syncStartTime = Date.now();
    let result: SyncResult = { success: true, synced: 0, failed: 0, conflicts: 0, errors: [] };

    try {
      const pending = await this.offlineStorage.getAllPending();
      
      if (pending.length === 0) {
        this.syncInProgress$.next(false);
        this.updatePendingCount();
        return { success: true, synced: 0, failed: 0, conflicts: 0 };
      }

      // Process in batches
      const batchId = this.generateId();
      const batches = this.createBatches(pending, this.MAX_BATCH_SIZE);
      let totalSynced = 0;
      let totalFailed = 0;
      let totalConflicts = 0;

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        this.syncProgress$.next({
          inProgress: true,
          current: i + 1,
          total: batches.length,
          batchId,
          elapsedMs: Date.now() - syncStartTime
        });

        try {
          const batchResult = await this.processSyncBatch(batch, batchId);
          totalSynced += batchResult.synced;
          totalFailed += batchResult.failed;
          totalConflicts += batchResult.conflicts;

          if (batchResult.errors && batchResult.errors.length > 0) {
            result.errors = result.errors || [];
            result.errors.push(...batchResult.errors);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          result.errors = result.errors || [];
          result.errors.push(`Batch ${i + 1} failed: ${errorMsg}`);
          totalFailed += batch.length;
        }
      }

      result = {
        success: totalFailed === 0,
        synced: totalSynced,
        failed: totalFailed,
        conflicts: totalConflicts,
        errors: result.errors
      };

      this.syncCompleted$.next(result);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result = { 
        success: false, 
        synced: 0, 
        failed: 0, 
        conflicts: 0,
        errors: [errorMsg]
      };
    } finally {
      this.syncInProgress$.next(false);
      this.syncProgress$.next({
        inProgress: false,
        current: 0,
        total: 0
      });
      this.updatePendingCount();
    }

    return result;
  }

  /**
   * Process a single sync batch via API
   */
  private async processSyncBatch(batch: SyncQueueEntry[], batchId: string): Promise<SyncResult> {
    const payload = {
      batch: batch.map(entry => ({
        id: entry.id,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        payload: entry.payload,
        timestamp: entry.timestamp
      })),
      clientTimestamp: Date.now()
    };

    try {
      const response = await this.api.syncBatch(payload).toPromise();

      if (!response || !response.success) {
        throw new Error('Sync failed');
      }

      // Process results and update local storage
      for (const result of response.data || []) {
        if (result.result === 'synced') {
          await this.offlineStorage.removeFromQueue(result.id);
        } else if (result.result === 'conflict') {
          this.conflictDetected$.next({
            resourceId: result.id,
            serverVersion: result.serverVersion
          });
          await this.offlineStorage.updateQueueEntry(result.id, {
            status: 'synced',
            retryCount: 0
          });
        } else if (result.result === 'failed') {
          // Schedule retry with backoff
          await this.offlineStorage.updateQueueEntry(result.id, {
            status: 'pending',
            retryCount: (await this.offlineStorage.getQueueEntry(result.id))?.retryCount ? 
              (await this.offlineStorage.getQueueEntry(result.id))!.retryCount + 1 : 1,
            nextRetry: Date.now() + Math.pow(2, ((await this.offlineStorage.getQueueEntry(result.id))?.retryCount || 0)) * 1000
          });
        }
      }

      return {
        success: response.success,
        synced: response.synced || 0,
        failed: response.failed || 0,
        conflicts: response.conflicts || 0
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Split array into chunks
   */
  private createBatches<T>(array: T[], size: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      batches.push(array.slice(i, i + size));
    }
    return batches;
  }

  /**
   * Initialize automatic sync on reconnection
   */
  private initializeAutoSync(): void {
    this.offlineMonitor.getStatusChanged$().subscribe(({ state }) => {
      if (state === 'online') {
        // Wait a bit for connection to stabilize, then start sync
        if (this.syncTimer) {
          clearTimeout(this.syncTimer);
        }
        this.syncTimer = setTimeout(() => {
          this.startSync().catch(err => console.error('Auto-sync failed:', err));
        }, this.AUTO_SYNC_DELAY_MS);
      }
    });
  }

  /**
   * Update pending count
   */
  private async updatePendingCount(): Promise<void> {
    const count = await this.offlineStorage.getPendingCount();
    this.pendingCount$.next(count);
  }

  /**
   * Initialize periodic updates of pending count
   */
  private initializePendingCountUpdate(): void {
    this.updatePendingCount();
    setInterval(() => this.updatePendingCount(), 5000); // Update every 5s
  }

  /**
   * Retry failed operations
   */
  async retryFailedOperations(): Promise<SyncResult> {
    return await this.startSync();
  }

  /**
   * Clear all queued operations (use with caution)
   */
  async clearQueue(): Promise<void> {
    await this.offlineStorage.clearQueue();
    this.updatePendingCount();
  }

  /**
   * Get pending operations (for debugging/monitoring)
   */
  async getPendingOperations(): Promise<SyncQueueEntry[]> {
    return await this.offlineStorage.getAllPending();
  }
}
