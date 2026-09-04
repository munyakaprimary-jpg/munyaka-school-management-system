// @ts-nocheck — Capacitor native plugins are conditionally loaded only in native builds

// ─────────────────────────────────────────────────────────────────────────────
// NOTE: The @capacitor-community/sqlite plugin is NOT installed in this build.
// All SQLite references are guarded with Capacitor.isNative() checks so this
// file NEVER throws at runtime in the browser.  The native path is a stub
// kept as documentation for future mobile builds that opt into SQLite storage.
// ─────────────────────────────────────────────────────────────────────────────

// Placeholder type for when the plugin is installed (avoids TS errors without
// adding a compile-time dependency)
type SQLiteConnection = any;

const DB_NAME = 'school_management';
const DB_VERSION = 1;

class DatabaseService {
  private db: any = null;
  private connection: SQLiteConnection | null = null;

  async initialize(): Promise<void> {
    if (this._isCapacitorNative()) {
      // NOTE: @capacitor-community/sqlite is not installed.
      // When installed, uncomment and import the plugin:
      //
      //   import { SQLiteConnection } from '@capacitor-community/sqlite';
      //   this.connection = new SQLiteConnection();
      //   this.db = await this.connection.createConnection({
      //     name: DB_NAME,
      //     version: DB_VERSION,
      //   });
      //   await this.db.open();
      console.info('[DatabaseService] Native SQLite not configured — using web fallback.');
    }
    await this.initWebDB();
    await this.createSyncQueueTable();
  }

  /** True only when running as a native Capacitor build with the sqlite plugin. */
  private _isCapacitorNative(): boolean {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Capacitor } = require('@capacitor/core');
      return Capacitor.isNative?.() === true;
    } catch {
      return false;
    }
  }

  private async initWebDB(): Promise<void> {
    if (!window.schoolDB) {
      window.schoolDB = {
        syncQueue: JSON.parse(localStorage.getItem('sync_queue') || '[]'),
        teachers: JSON.parse(localStorage.getItem('teachers') || '[]'),
        students: JSON.parse(localStorage.getItem('students') || '[]'),
        attendance: JSON.parse(localStorage.getItem('attendance') || '[]'),
        marks: JSON.parse(localStorage.getItem('marks') || '[]'),
        checkins: JSON.parse(localStorage.getItem('checkins') || '[]'),
      };
    }
  }

  private async createSyncQueueTable(): Promise<void> {
    // Web fallback: table structure lives in JS objects, not SQL.
    // No-op — the syncQueue array in schoolDB is ready immediately.
    console.debug('[DatabaseService] Sync queue table ready (web mode)');
  }

  async enqueue(payloadType: string, payload: any): Promise<number> {
    const payloadStr = JSON.stringify(payload);
    const now = new Date().toISOString();

    const queue = window.schoolDB.syncQueue;
    const newId = queue.length > 0 ? Math.max(...queue.map((q: any) => q.id)) + 1 : 1;
    queue.push({
      id: newId,
      payload_type: payloadType,
      payload: payloadStr,
      device_id: null,
      status: 'PENDING',
      retry_count: 0,
      created_at: now,
    });
    localStorage.setItem('sync_queue', JSON.stringify(queue));
    return newId;
  }

  async getPendingQueue(limit: number = 50): Promise<any[]> {
    return window.schoolDB.syncQueue
      .filter((q: any) => q.status === 'PENDING')
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, limit);
  }

  async getPendingCount(): Promise<number> {
    return window.schoolDB.syncQueue.filter((q: any) => q.status === 'PENDING').length;
  }

  async deleteSyncedItems(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    window.schoolDB.syncQueue = window.schoolDB.syncQueue.filter((q: any) => !ids.includes(q.id));
    localStorage.setItem('sync_queue', JSON.stringify(window.schoolDB.syncQueue));
  }

  async updateRetryCount(id: number, count: number): Promise<void> {
    const queue = window.schoolDB.syncQueue;
    const item = queue.find((q: any) => q.id === id);
    if (item) {
      item.retry_count = count;
      localStorage.setItem('sync_queue', JSON.stringify(queue));
    }
  }

  async updateStatus(id: number, status: string): Promise<void> {
    const queue = window.schoolDB.syncQueue;
    const item = queue.find((q: any) => q.id === id);
    if (item) {
      item.status = status;
      localStorage.setItem('sync_queue', JSON.stringify(queue));
    }
  }

  async isOnline(): Promise<boolean> {
    return navigator.onLine;
  }

  async close(): Promise<void> {
    // No-op for web storage
  }
}

// Extend Window interface for web fallback
declare global {
  interface Window {
    schoolDB: any;
  }
}

export const dbService = new DatabaseService();
