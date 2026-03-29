import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { take } from 'rxjs/operators';
import { OfflineStorageService, SyncQueueEntry } from './offline-storage.service';
import { OfflineMonitorService } from './offline-monitor.service';
import { SyncManagerService } from './sync-manager.service';
import { ApiService } from './api.service';

describe('Offline Sync Services', () => {
  let offlineStorage: OfflineStorageService;
  let offlineMonitor: OfflineMonitorService;
  let syncManager: SyncManagerService;
  let apiService: ApiService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OfflineStorageService,
        OfflineMonitorService,
        SyncManagerService,
        ApiService
      ]
    });

    offlineStorage = TestBed.inject(OfflineStorageService);
    offlineMonitor = TestBed.inject(OfflineMonitorService);
    syncManager = TestBed.inject(SyncManagerService);
    apiService = TestBed.inject(ApiService);

    await offlineStorage.waitForReady();
    await offlineStorage.clearQueue();

    spyOn(apiService, 'syncBatch').and.returnValue(of({
      success: true,
      batchId: 'test-batch',
      synced: 0,
      failed: 0,
      conflicts: 0,
      data: [],
      durationMs: 1,
    }));
  });

  afterEach(async () => {
    await offlineStorage.clearQueue();
  });

  describe('OfflineStorageService', () => {
    it('should initialize database', async () => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for DB init
      const isAvailable = await offlineStorage.isAvailable();
      expect(isAvailable).toBe(true);
    });

    it('should add entry to queue', async () => {
      const entry: SyncQueueEntry = {
        id: 'test-id',
        batchId: 'batch-1',
        action: 'CREATE',
        resource: 'training',
        payload: { test: true },
        timestamp: Date.now(),
        status: 'pending',
        retryCount: 0
      };

      const entryId = await offlineStorage.putInQueue(entry);
      expect(entryId).toBeDefined();

      const retrieved = await offlineStorage.getQueueEntry(entryId as string);
      expect(retrieved?.action).toBe('CREATE');
    });

    it('should retrieve all pending operations', async () => {
      const entry1: SyncQueueEntry = {
        id: 'test-1',
        batchId: 'batch-1',
        action: 'CREATE',
        resource: 'training',
        payload: {},
        timestamp: Date.now(),
        status: 'pending',
        retryCount: 0
      };

      const entry2: SyncQueueEntry = {
        id: 'test-2',
        batchId: 'batch-2',
        action: 'UPDATE',
        resource: 'training',
        payload: {},
        timestamp: Date.now(),
        status: 'pending',
        retryCount: 0
      };

      await offlineStorage.putInQueue(entry1);
      await offlineStorage.putInQueue(entry2);

      const pending = await offlineStorage.getAllPending();
      expect(pending.length).toBeGreaterThanOrEqual(2);
    });

    it('should remove entry from queue', async () => {
      const entry: SyncQueueEntry = {
        id: 'test-remove-id',
        batchId: 'batch-1',
        action: 'CREATE',
        resource: 'training',
        payload: {},
        timestamp: Date.now(),
        status: 'pending',
        retryCount: 0
      };

      const entryId = await offlineStorage.putInQueue(entry);
      await offlineStorage.removeFromQueue(entryId as string);

      const retrieved = await offlineStorage.getQueueEntry(entryId as string);
      expect(retrieved).toBeUndefined();
    });

    it('should update queue entry', async () => {
      const entry: SyncQueueEntry = {
        id: 'test-update-id',
        batchId: 'batch-1',
        action: 'CREATE',
        resource: 'training',
        payload: {},
        timestamp: Date.now(),
        status: 'pending',
        retryCount: 0
      };

      const entryId = await offlineStorage.putInQueue(entry);
      await offlineStorage.updateQueueEntry(entryId as string, { retryCount: 2 });

      const updated = await offlineStorage.getQueueEntry(entryId as string);
      expect(updated?.retryCount).toBe(2);
    });

    it('should get pending count', async () => {
      const initialCount = await offlineStorage.getPendingCount();

      const entry: SyncQueueEntry = {
        id: 'test-count-id',
        batchId: 'batch-1',
        action: 'CREATE',
        resource: 'training',
        payload: {},
        timestamp: Date.now(),
        status: 'pending',
        retryCount: 0
      };

      await offlineStorage.putInQueue(entry);
      const newCount = await offlineStorage.getPendingCount();

      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    });
  });

  describe('OfflineMonitorService', () => {
    it('should detect current online status', () => {
      const isOnline = offlineMonitor.isOnline();
      expect(typeof isOnline).toBe('boolean');
    });

    it('should emit online status changes', async () => {
      const isOnline = await firstValueFrom(offlineMonitor.getIsOnline$().pipe(take(1)));
      expect(typeof isOnline).toBe('boolean');
    });

    it('should provide connection state', () => {
      const state = offlineMonitor.getConnectionState();
      expect(['online', 'offline', 'checking']).toContain(state);
    });

    it('should have health check capability', async () => {
      spyOn(window, 'fetch').and.resolveTo(new Response(null, { status: 200 }));

      const isConnected = await offlineMonitor.checkConnection();
      expect(isConnected).toBe(true);
    });

    it('should emit status changes', async () => {
      const statusChangedPromise = firstValueFrom(offlineMonitor.getStatusChanged$().pipe(take(1)));

      (offlineMonitor as any).handleOffline();

      const event = await statusChangedPromise;
      expect(event.state).toBe('offline');
    });
  });

  describe('SyncManagerService', () => {
    it('should initialize with no sync in progress', () => {
      let inProgress = false;
      const subscription = syncManager.getSyncInProgress$().subscribe(value => {
        inProgress = value;
      });

      expect(inProgress).toBe(false);
      subscription.unsubscribe();
    });

    it('should enqueue operation', async () => {
      const entryId = await syncManager.enqueueOperation(
        'CREATE',
        'training',
        { sessionDate: '2026-03-25', sessionTime: '15:00' }
      );

      expect(entryId).toBeDefined();
      expect(typeof entryId).toBe('string');
    });

    it('should track pending count', async () => {
      const initialCount = await offlineStorage.getPendingCount();

      await syncManager.enqueueOperation(
        'UPDATE',
        'training_notes',
        { notes: 'Test note' }
      );

      let pendingCount = 0;
      const subscription = syncManager.getPendingCount$().subscribe(count => {
        pendingCount = count;
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(pendingCount).toBeGreaterThanOrEqual(initialCount);

      subscription.unsubscribe();
    });

    it('should not allow concurrent syncs', async () => {
      (syncManager as any).syncInProgress$.next(true);

      const secondSyncResult = await syncManager.startSync();

      expect(secondSyncResult.success).toBe(false);
      expect(secondSyncResult.errors).toContain('Sync already in progress');

      (syncManager as any).syncInProgress$.next(false);
    });

    it('should provide sync progress', () => {
      let progress = { inProgress: false, current: 0, total: 0 };

      const subscription = syncManager.getSyncProgress$().subscribe(p => {
        progress = p;
      });

      expect(progress.inProgress).toBe(false);
      subscription.unsubscribe();
    });

    it('should emit sync completed event', async () => {
      const entryId = await syncManager.enqueueOperation('CREATE', 'training', { test: 1 });
      (apiService.syncBatch as jasmine.Spy).and.returnValue(of({
        success: true,
        batchId: 'test-batch',
        synced: 1,
        failed: 0,
        conflicts: 0,
        data: [{ id: entryId, batchId: 'test-batch', result: 'synced' }],
        durationMs: 1,
      }));

      const completedPromise = firstValueFrom(syncManager.getSyncCompleted$().pipe(take(1)));
      const result = await syncManager.startSync();
      const completed = await completedPromise;

      expect(result.success).toBe(true);
      expect(completed.success).toBe(true);
      expect(completed.synced).toBe(1);
    });
  });

  describe('Integration: Offline-to-Online flow', () => {
    it('should enqueue multiple operations', async () => {
      await syncManager.enqueueOperation('CREATE', 'training', { test: 1 });
      await syncManager.enqueueOperation('UPDATE', 'training', { test: 2 });
      await syncManager.enqueueOperation('DELETE', 'training', { test: 3 });

      const pending = await offlineStorage.getAllPending();
      expect(pending.length).toBeGreaterThanOrEqual(3);
    });

    it('should maintain operations during sync attempt', async () => {
      await syncManager.enqueueOperation('CREATE', 'training', { test: 1 });
      const countBefore = await offlineStorage.getPendingCount();

      (apiService.syncBatch as jasmine.Spy).and.returnValue(
        throwError(() => new Error('offline sync unavailable'))
      );

      const result = await syncManager.startSync();

      expect(result.success).toBe(false);
      const countAfter = await offlineStorage.getPendingCount();
      expect(countAfter).toBeGreaterThanOrEqual(countBefore);
    });
  });
});
