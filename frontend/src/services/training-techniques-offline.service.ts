import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

export type TechniqueOfflineOperationType =
  | 'select'
  | 'deselect'
  | 'add-custom'
  | 'save-preset'
  | 'apply-preset';

export interface TechniqueOfflineOperation {
  id?: number;
  type: TechniqueOfflineOperationType;
  sessionId: string;
  payload: any;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class TrainingTechniquesOfflineService {
  private readonly dbName = 'scacademia-offline';
  private readonly storeName = 'session-technique-ops';
  private readonly dbVersion = 1;

  constructor(private api: ApiService) {}

  async enqueue(operation: Omit<TechniqueOfflineOperation, 'createdAt'>): Promise<void> {
    const db = await this.openDb();
    await this.txAdd(db, {
      ...operation,
      createdAt: new Date().toISOString(),
    });
  }

  async flush(sessionId?: string): Promise<{ processed: number; remaining: number }> {
    const db = await this.openDb();
    const all = await this.txGetAll(db);

    const pending = sessionId ? all.filter((item) => item.sessionId === sessionId) : all;

    let processed = 0;
    for (const op of pending) {
      try {
        await this.execute(op);
        if (typeof op.id === 'number') {
          await this.txDelete(db, op.id);
        }
        processed += 1;
      } catch {
        // Stop at first failure to preserve order.
        break;
      }
    }

    const remaining = (await this.txGetAll(db)).length;
    return { processed, remaining };
  }

  private async execute(op: TechniqueOfflineOperation): Promise<void> {
    switch (op.type) {
      case 'select':
        await firstValueFrom(this.api.selectTechnique(op.sessionId, op.payload.techniqueId));
        break;
      case 'deselect':
        await firstValueFrom(this.api.deselectTechnique(op.sessionId, op.payload.techniqueId));
        break;
      case 'add-custom':
        await firstValueFrom(this.api.addCustomTechnique(op.sessionId, op.payload.name));
        break;
      case 'save-preset':
        await firstValueFrom(this.api.saveTechniquePreset(op.payload));
        break;
      case 'apply-preset':
        await firstValueFrom(this.api.applyTechniquePreset(op.sessionId, op.payload.presetId));
        break;
      default:
        break;
    }
  }

  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('sessionId', 'sessionId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  private txAdd(db: IDBDatabase, value: TechniqueOfflineOperation): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();
      tx.objectStore(this.storeName).add(value);
    });
  }

  private txGetAll(db: IDBDatabase): Promise<TechniqueOfflineOperation[]> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      tx.onerror = () => reject(tx.error);
      const request = tx.objectStore(this.storeName).getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve((request.result as TechniqueOfflineOperation[]) || []);
    });
  }

  private txDelete(db: IDBDatabase, id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();
      tx.objectStore(this.storeName).delete(id);
    });
  }
}
