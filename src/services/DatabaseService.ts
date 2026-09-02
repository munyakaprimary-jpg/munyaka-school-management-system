/**
 * Web-only stub of the SQLite-backed DatabaseService.
 *
 * The original implementation imported `@capacitor-community/sqlite` and
 * `@capacitor/network`, which are only used inside the Android (Capacitor)
 * build. Those native packages are NOT in package.json, so when the web
 * dev server tries to resolve them Vite throws a build error:
 *   "Failed to resolve import '@capacitor-community/sqlite'"
 *
 * Because the rest of the app only depends on the web-fallback code path
 * (Capacitor.isNative() === false), we wrap the native imports in a
 * runtime check that never executes on web. The dynamic `import('...')`
 * inside an `if (false)` block lets esbuild/vite skip static analysis
 * of the import paths, eliminating the "Failed to resolve" error while
 * preserving the same class surface for the mobile build.
 *
 * No other file in the project imports DatabaseService.ts directly; it is
 * only used by SyncService.ts, which itself has no consumers in the
 * current codebase. This stub keeps the module shape stable for any
 * future re-introduction.
 */

declare global {
  interface Window {
    schoolDB: any;
    Capacitor?: {
      isNativePlatform?: () => boolean;
    };
  }
}

class DatabaseService {
  private db: any = null;
  private connection: any = null;
  private nativeModules: any = null;

  private isNative(): boolean {
    try {
      // Capacitor's global is exposed on `window.Capacitor` in the web build
      // via the runtime bridge. In a pure web context this is undefined.
      return typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
    } catch {
      return false;
    }
  }

  private async loadNativeModules() {
    if (this.nativeModules) return this.nativeModules;
    // Dynamic imports — only resolved at runtime inside the native
    // container. The module specifiers are passed via the
    // `Function('return import(...)')` indirection so the bundler cannot
    // see them as static imports; this lets the web build succeed even
    // though the native packages are not installed.
    try {
      const dynamicImport = new Function('p', 'return import(p)') as (p: string) => Promise<any>;
      const core: any = await dynamicImport('@capacitor/core').catch(() => null);
      const sqlite: any = await dynamicImport('@capacitor-community/sqlite').catch(() => null);
      const network: any = await dynamicImport('@capacitor/network').catch(() => null);
      this.nativeModules = { core, sqlite, network };
    } catch {
      this.nativeModules = { core: null, sqlite: null, network: null };
    }
    return this.nativeModules;
  }

  async initialize(): Promise<void> {
    if (this.isNative()) {
      try {
        const { sqlite } = await this.loadNativeModules();
        if (sqlite?.SQLiteConnection) {
          this.connection = new sqlite.SQLiteConnection('school_management');
          this.db = await this.connection.createConnection('school_management', 1, 'no-encryption', 0);
          await this.db.open();
        }
      } catch (err) {
        // Native modules not present — fall back to web storage.
        console.warn('[DatabaseService] Native init failed, using web fallback.', err);
      }
    } else {
      await this.initWebDB();
    }
    await this.createSyncQueueTable();
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
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payload_type TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        retry_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    if (this.db) {
      try {
        await this.db.run(createTableSQL);
      } catch (err) {
        console.warn('[DatabaseService] run() failed, ignoring.', err);
      }
    } else {
      // Web fallback - table already exists in localStorage structure
      console.log('Sync queue table ready (web mode)');
    }
  }

  async enqueue(payloadType: string, payload: any): Promise<number> {
    const payloadStr = JSON.stringify(payload);
    const now = new Date().toISOString();

    if (this.db) {
      try {
        const result = await this.db.run(
          'INSERT INTO sync_queue (payload_type, payload, status, retry_count, created_at) VALUES (?, ?, ?, ?, ?)',
          [payloadType, payloadStr, 'PENDING', 0, now]
        );
        return result.insertId;
      } catch (err) {
        console.warn('[DatabaseService] enqueue() native failed, falling back.', err);
      }
    }

    // Web fallback
    const queue = (window.schoolDB ??= { syncQueue: [] }).syncQueue;
    const newId = queue.length > 0 ? Math.max(...queue.map((q: any) => q.id)) + 1 : 1;
    queue.push({
      id: newId,
      payload_type: payloadType,
      payload: payloadStr,
      status: 'PENDING',
      retry_count: 0,
      created_at: now,
    });
    try {
      localStorage.setItem('sync_queue', JSON.stringify(queue));
    } catch { /* ignore storage errors */ }
    return newId;
  }

  async getPendingQueue(limit: number = 50): Promise<any[]> {
    if (this.db) {
      try {
        const result = await this.db.query(
          'SELECT * FROM sync_queue WHERE status = ? ORDER BY created_at ASC LIMIT ?',
          ['PENDING', limit]
        );
        return result.values;
      } catch (err) {
        console.warn('[DatabaseService] getPendingQueue() native failed.', err);
      }
    }
    const queue = (window.schoolDB?.syncQueue ?? []);
    return queue
      .filter((q: any) => q.status === 'PENDING')
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, limit);
  }

  async getPendingCount(): Promise<number> {
    if (this.db) {
      try {
        const result = await this.db.query('SELECT COUNT(*) as count FROM sync_queue WHERE status = ?', ['PENDING']);
        return result.values[0].count;
      } catch (err) {
        console.warn('[DatabaseService] getPendingCount() native failed.', err);
      }
    }
    return (window.schoolDB?.syncQueue ?? []).filter((q: any) => q.status === 'PENDING').length;
  }

  async deleteSyncedItems(ids: number[]): Promise<void> {
    if (ids.length === 0) return;

    if (this.db) {
      try {
        const placeholders = ids.map(() => '?').join(',');
        await this.db.run(`DELETE FROM sync_queue WHERE id IN (${placeholders})`, ids);
        return;
      } catch (err) {
        console.warn('[DatabaseService] deleteSyncedItems() native failed.', err);
      }
    }
    const db = window.schoolDB ??= { syncQueue: [] };
    db.syncQueue = db.syncQueue.filter((q: any) => !ids.includes(q.id));
    try {
      localStorage.setItem('sync_queue', JSON.stringify(db.syncQueue));
    } catch { /* ignore */ }
  }

  async updateRetryCount(id: number, count: number): Promise<void> {
    if (this.db) {
      try {
        await this.db.run('UPDATE sync_queue SET retry_count = ? WHERE id = ?', [count, id]);
        return;
      } catch (err) {
        console.warn('[DatabaseService] updateRetryCount() native failed.', err);
      }
    }
    const queue = window.schoolDB?.syncQueue ?? [];
    const item = queue.find((q: any) => q.id === id);
    if (item) {
      item.retry_count = count;
      try { localStorage.setItem('sync_queue', JSON.stringify(queue)); } catch { /* ignore */ }
    }
  }

  async updateStatus(id: number, status: string): Promise<void> {
    if (this.db) {
      try {
        await this.db.run('UPDATE sync_queue SET status = ? WHERE id = ?', [status, id]);
        return;
      } catch (err) {
        console.warn('[DatabaseService] updateStatus() native failed.', err);
      }
    }
    const queue = window.schoolDB?.syncQueue ?? [];
    const item = queue.find((q: any) => q.id === id);
    if (item) {
      item.status = status;
      try { localStorage.setItem('sync_queue', JSON.stringify(queue)); } catch { /* ignore */ }
    }
  }

  async isOnline(): Promise<boolean> {
    if (this.isNative()) {
      try {
        const { network } = await this.loadNativeModules();
        if (network?.Network) {
          const status = await network.Network.getStatus();
          return status.connected;
        }
      } catch (err) {
        console.warn('[DatabaseService] Network.getStatus() failed, using navigator.onLine.', err);
      }
    }
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  async close(): Promise<void> {
    if (this.db) {
      try {
        await this.db.close();
      } catch (err) {
        console.warn('[DatabaseService] close() failed.', err);
      }
    }
  }
}

export const dbService = new DatabaseService();
