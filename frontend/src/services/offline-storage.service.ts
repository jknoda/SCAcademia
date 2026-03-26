import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SyncQueueEntry {
  id: string;
  batchId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
  resource: string;
  resourceId?: string;
  payload: Record<string, unknown>;
  timestamp: number;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
  nextRetry?: number;
}

export interface SyncHistoryRecord {
  id: string;
  batchId: string;
  syncTimestamp: number;
  status: 'success' | 'partial' | 'failed';
  totalRecords: number;
  syncedCount: number;
  failedCount: number;
  durationMs: number;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'scacademia_offlineSync';
  private readonly DB_VERSION = 1;
  
  private isReady$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.initializeDatabase();
  }

  /**
   * Initialize IndexedDB with schema
   */
  private initializeDatabase(): void {
    const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB initialization failed:', request.error);
      this.isReady$.next(false);
    };

    request.onsuccess = () => {
      this.db = request.result;
      this.isReady$.next(true);
      console.log('IndexedDB initialized successfully');
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create sync_queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('batchId', 'batchId', { unique: false });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        queueStore.createIndex('resourceId', 'resourceId', { unique: false });
      }

      // Create sync_history store
      if (!db.objectStoreNames.contains('syncHistory')) {
        const historyStore = db.createObjectStore('syncHistory', { keyPath: 'id' });
        historyStore.createIndex('batchId', 'batchId', { unique: false });
        historyStore.createIndex('syncTimestamp', 'syncTimestamp', { unique: false });
      }

      // Create sync_status store (singleton)
      if (!db.objectStoreNames.contains('syncStatus')) {
        db.createObjectStore('syncStatus', { keyPath: 'key' });
      }
    };
  }

  /**
   * Wait for database to be ready
   */
  async waitForReady(): Promise<void> {
    return new Promise((resolve) => {
      if (this.db) {
        resolve();
        return;
      }
      const subscription = this.isReady$.subscribe((ready) => {
        if (ready) {
          subscription.unsubscribe();
          resolve();
        }
      });
    });
  }

  /**
   * Add entry to sync queue
   */
  async putInQueue(entry: SyncQueueEntry): Promise<string> {
    await this.waitForReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.put({
        ...entry,
        status: entry.status || 'pending'
      });

      request.onsuccess = () => resolve(request.result as string);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all pending sync operations
   */
  async getAllPending(): Promise<SyncQueueEntry[]> {
    await this.waitForReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get entry from queue by ID
   */
  async getQueueEntry(id: string): Promise<SyncQueueEntry | undefined> {
    await this.waitForReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update queue entry (for retry count, status, etc.)
   */
  async updateQueueEntry(id: string, updates: Partial<SyncQueueEntry>): Promise<void> {
    await this.waitForReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const entry = getRequest.result;
        if (!entry) {
          reject(new Error('Entry not found'));
          return;
        }

        const updated = { ...entry, ...updates };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Remove entry from queue (after successful sync)
   */
  async removeFromQueue(id: string): Promise<void> {
    await this.waitForReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all queue entries (dangerous - use with caution)
   */
  async clearQueue(): Promise<void> {
    await this.waitForReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Add entry to sync history
   */
  async addToHistory(record: SyncHistoryRecord): Promise<string> {
    await this.waitForReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncHistory'], 'readwrite');
      const store = transaction.objectStore('syncHistory');
      const request = store.add(record);

      request.onsuccess = () => resolve(request.result as string);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get sync history (last N days)
   */
  async getSyncHistory(days: number = 30): Promise<SyncHistoryRecord[]> {
    await this.waitForReady();

    return new Promise((resolve, reject) => {
      const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
      const transaction = this.db!.transaction(['syncHistory'], 'readonly');
      const store = transaction.objectStore('syncHistory');
      const index = store.index('syncTimestamp');
      const request = index.getAll(IDBKeyRange.lowerBound(cutoffTime));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clean up old history (> 30 days)
   */
  async cleanupHistory(daysToKeep: number = 30): Promise<number> {
    await this.waitForReady();

    return new Promise((resolve, reject) => {
      const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
      const transaction = this.db!.transaction(['syncHistory'], 'readwrite');
      const store = transaction.objectStore('syncHistory');
      const index = store.index('syncTimestamp');
      const range = IDBKeyRange.upperBound(cutoffTime);
      const request = index.openCursor(range);

      let deletedCount = 0;
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get/set sync status (singleton)
   */
  async getSyncStatus(): Promise<any> {
    await this.waitForReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncStatus'], 'readonly');
      const store = transaction.objectStore('syncStatus');
      const request = store.get('sync_state');

      request.onsuccess = () => resolve(request.result || {
        lastSync: null,
        nextRetry: null,
        isOnline: navigator.onLine,
        retryCount: 0
      });
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update sync status
   */
  async updateSyncStatus(status: Record<string, unknown>): Promise<void> {
    await this.waitForReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncStatus'], 'readwrite');
      const store = transaction.objectStore('syncStatus');
      const request = store.put({ key: 'sync_state', ...status });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get count of pending operations
   */
  async getPendingCount(): Promise<number> {
    const pending = await this.getAllPending();
    return pending.length;
  }

  /**
   * Check if database is available and functioning
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.waitForReady();
      return this.db !== null;
    } catch {
      return false;
    }
  }
}
