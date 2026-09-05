/**
 * idbStore.ts — Typed IndexedDB wrapper
 *
 * Provides a clean Promise-based API for IndexedDB operations.
 * All methods return Promises and never throw synchronously.
 *
 * Usage:
 *   import { idb, idbStore } from '@/services/idbStore';
 *
 *   // Open the database
 *   await idb.open();
 *
 *   // Put / get / delete records
 *   await idb.put('myStore', { id: '1', name: 'Alice' });
 *   const record = await idb.get('myStore', '1');
 *   await idb.delete('myStore', '1');
 *
 *   // Bulk operations
 *   await idb.putMany('myStore', [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }]);
 *   const all = await idb.getAll('myStore');
 */

export interface IdbDialect {
  name: string;
  version: number;
  stores: Record<string, IdbStoreSchema>;
}

export interface IdbStoreSchema {
  keyPath: string;
  indexes?: Array<{ name: string; keyPath: string; unique?: boolean }>;
}

/** All stores the app uses */
export const IDB_SCHEMA: IdbDialect = {
  name: 'munyaka_db',
  version: 1,
  stores: {
    // ── Core entity stores ──────────────────────────────────────────────
    learners: {
      keyPath: 'id',
      indexes: [
        { name: 'grade', keyPath: 'grade' },
        { name: 'stream', keyPath: 'stream' },
        { name: 'status', keyPath: 'status' },
        { name: 'admNo', keyPath: 'admNo', unique: true },
      ],
    },
    staff: {
      keyPath: 'id',
      indexes: [
        { name: 'role', keyPath: 'role' },
        { name: 'tscNo', keyPath: 'tscNo', unique: true },
        { name: 'status', keyPath: 'status' },
      ],
    },
    staff_prereg: {
      keyPath: 'id',
      indexes: [
        { name: 'status', keyPath: 'status' },
        { name: 'email', keyPath: 'email' },
      ],
    },
    grades: {
      keyPath: 'id',
      indexes: [{ name: 'level', keyPath: 'level' }],
    },
    streams: {
      keyPath: 'id',
      indexes: [{ name: 'gradeId', keyPath: 'gradeId' }],
    },
    exam_types: {
      keyPath: 'id',
    },
    learning_areas: {
      keyPath: 'id',
      indexes: [{ name: 'clusterId', keyPath: 'clusterId' }],
    },
    learning_area_clusters: {
      keyPath: 'id',
    },
    assessment_scores: {
      keyPath: 'id',
      indexes: [
        { name: 'learnerId', keyPath: 'learnerId' },
        { name: 'examId', keyPath: 'examId' },
        { name: 'subjectId', keyPath: 'subjectId' },
        { name: 'academicYear', keyPath: 'academicYear' },
        { name: 'termId', keyPath: 'termId' },
      ],
    },
    exams: {
      keyPath: 'id',
      indexes: [
        { name: 'status', keyPath: 'status' },
        { name: 'academicYear', keyPath: 'academicYear' },
        { name: 'termId', keyPath: 'termId' },
        { name: 'gradeId', keyPath: 'gradeId' },
        { name: 'title', keyPath: 'title' },
      ],
    },
    marks_records: {
      keyPath: 'id',
      indexes: [
        { name: 'learnerId', keyPath: 'learnerId' },
        { name: 'examId', keyPath: 'examId' },
        { name: 'subjectId', keyPath: 'subjectId' },
        { name: 'academicYear', keyPath: 'academicYear' },
        { name: 'termId', keyPath: 'termId' },
      ],
    },

    // ── Financial stores ────────────────────────────────────────────────
    fee_ledgers: {
      keyPath: 'id',
      indexes: [
        { name: 'learnerId', keyPath: 'learnerId' },
        { name: 'academicYear', keyPath: 'academicYear' },
        { name: 'termId', keyPath: 'termId' },
        { name: 'status', keyPath: 'status' },
      ],
    },
    fee_structures: {
      keyPath: 'id',
      indexes: [
        { name: 'gradeId', keyPath: 'gradeId' },
        { name: 'academicYear', keyPath: 'academicYear' },
      ],
    },
    transactions: {
      keyPath: 'id',
      indexes: [
        { name: 'learnerId', keyPath: 'learnerId' },
        { name: 'type', keyPath: 'type' },
        { name: 'date', keyPath: 'date' },
      ],
    },

    // ── Attendance stores ────────────────────────────────────────────────
    attendance_v2: {
      keyPath: 'id',
      indexes: [
        { name: 'learnerId', keyPath: 'learnerId' },
        { name: 'date', keyPath: 'date' },
        { name: 'gradeId', keyPath: 'gradeId' },
        { name: 'streamId', keyPath: 'streamId' },
        { name: 'type', keyPath: 'type' },
      ],
    },
    staff_attendance: {
      keyPath: 'id',
      indexes: [
        { name: 'staffId', keyPath: 'staffId' },
        { name: 'date', keyPath: 'date' },
      ],
    },

    // ── Library stores ───────────────────────────────────────────────────
    library_books: {
      keyPath: 'id',
      indexes: [
        { name: 'status', keyPath: 'status' },
        { name: 'category', keyPath: 'category' },
        { name: 'isbn', keyPath: 'isbn' },
      ],
    },
    library_issues: {
      keyPath: 'id',
      indexes: [
        { name: 'bookId', keyPath: 'bookId' },
        { name: 'learnerId', keyPath: 'learnerId' },
        { name: 'status', keyPath: 'status' },
      ],
    },

    // ── ICT / inventory stores ───────────────────────────────────────────
    ict_assets: {
      keyPath: 'id',
      indexes: [
        { name: 'category', keyPath: 'category' },
        { name: 'status', keyPath: 'status' },
      ],
    },
    asset_logs: {
      keyPath: 'id',
      indexes: [
        { name: 'assetId', keyPath: 'assetId' },
        { name: 'type', keyPath: 'type' },
        { name: 'date', keyPath: 'date' },
      ],
    },

    // ── Communication stores ────────────────────────────────────────────
    notices: {
      keyPath: 'id',
      indexes: [
        { name: 'category', keyPath: 'category' },
        { name: 'publishedAt', keyPath: 'publishedAt' },
        { name: 'status', keyPath: 'status' },
      ],
    },
    messages: {
      keyPath: 'id',
      indexes: [
        { name: 'recipientId', keyPath: 'recipientId' },
        { name: 'senderId', keyPath: 'senderId' },
        { name: 'read', keyPath: 'read' },
      ],
    },

    // ── Portfolio / learning evidence ────────────────────────────────────
    portfolio_artifacts: {
      keyPath: 'id',
      indexes: [
        { name: 'learnerId', keyPath: 'learnerId' },
        { name: 'type', keyPath: 'type' },
        { name: 'uploadedAt', keyPath: 'uploadedAt' },
      ],
    },

    // ── Academic records ────────────────────────────────────────────────
    promotions: {
      keyPath: 'id',
      indexes: [
        { name: 'learnerId', keyPath: 'learnerId' },
        { name: 'academicYear', keyPath: 'academicYear' },
      ],
    },
    transfers: {
      keyPath: 'id',
      indexes: [
        { name: 'learnerId', keyPath: 'learnerId' },
        { name: 'status', keyPath: 'status' },
      ],
    },

    // ── Settings / meta stores ───────────────────────────────────────────
    system_settings: {
      keyPath: 'id',
    },
    subscriptions: {
      keyPath: 'id',
      indexes: [{ name: 'status', keyPath: 'status' }],
    },
    schema_meta: {
      keyPath: 'key',
    },
  },
};

// ─── Core IndexedDB operations ──────────────────────────────────────────────

class IdbStore {
  private db: IDBDatabase | null = null;
  private openPromise: Promise<IDBDatabase> | null = null;

  /**
   * Open (or reuse) the IndexedDB connection.
   */
  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.openPromise) return this.openPromise;

    this.openPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not available in this environment'));
        return;
      }

      const request = indexedDB.open(IDB_SCHEMA.name, IDB_SCHEMA.version);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        for (const [storeName, schema] of Object.entries(IDB_SCHEMA.stores)) {
          if (!db.objectStoreNames.contains(storeName)) {
            const objectStore = db.createObjectStore(storeName, {
              keyPath: schema.keyPath,
            });
            for (const idx of schema.indexes ?? []) {
              objectStore.createIndex(idx.name, idx.keyPath, { unique: idx.unique ?? false });
            }
          }
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.openPromise = null;
        resolve(this.db);
      };

      request.onerror = () => {
        this.openPromise = null;
        reject(request.error ?? new Error('IndexedDB open failed'));
      };
    });

    return this.openPromise;
  }

  /**
   * Get a single record by key.
   */
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Get all records from a store.
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result ?? []) as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Get records matching an optional key range.
   */
  async getAllByIndex<T>(
    storeName: string,
    indexName: string,
    query?: IDBValidKey | IDBKeyRange
  ): Promise<T[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const req = query !== undefined ? index.getAll(query) : index.getAll();
      req.onsuccess = () => resolve((req.result ?? []) as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Put a single record (insert or update).
   */
  async put<T extends object>(storeName: string, value: T): Promise<IDBValidKey> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Put many records in a single transaction.
   */
  async putMany<T extends object>(storeName: string, records: T[]): Promise<void> {
    if (records.length === 0) return;
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      for (const record of records) {
        store.put(record);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Delete a record by key.
   */
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Delete all records from a store.
   */
  async clearStore(storeName: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Delete multiple records by keys.
   */
  async deleteMany(storeName: string, keys: IDBValidKey[]): Promise<void> {
    if (keys.length === 0) return;
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      for (const key of keys) {
        store.delete(key);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Get a count of records in a store.
   */
  async count(storeName: string): Promise<number> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Query a single record by index.
   */
  async getByIndex<T>(
    storeName: string,
    indexName: string,
    key: IDBValidKey
  ): Promise<T | undefined> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const req = index.get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Close the database connection.
   */
  close(): void {
    this.db?.close();
    this.db = null;
    this.openPromise = null;
  }

  /**
   * Delete the entire database (useful during migrations).
   */
  async deleteDatabase(): Promise<void> {
    this.close();
    if (typeof indexedDB !== 'undefined') {
      return new Promise((resolve, reject) => {
        const req = indexedDB.deleteDatabase(IDB_SCHEMA.name);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
  }
}

/** Singleton instance */
export const idbStore = new IdbStore();
