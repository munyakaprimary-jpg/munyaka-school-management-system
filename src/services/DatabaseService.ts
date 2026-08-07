import { Capacitor } from '@capacitor/core';
import { SQLiteConnection, SQLiteValues, SQLiteResult } from '@capacitor-community/sqlite';
import { Network } from '@capacitor/network';

const DB_NAME = 'school_management';
const DB_VERSION = 1;

class DatabaseService {
  private db: any = null;
  private connection: SQLiteConnection | null = null;

  async initialize(): Promise<void> {
    if (Capacitor.isNative()) {
      this.connection = new SQLiteConnection('school_management');
      this.db = await this.connection.createConnection(DB_NAME, DB_VERSION, 'no-encryption', 0);
      await this.db.open();
    } else {
      // Web fallback using IndexedDB/localStorage
      await this.initWebDB();
    }
    await this.createSyncQueueTable();
  }

  private async initWebDB(): Promise<void> {
    // Web fallback using localStorage
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
      await this.db.run(createTableSQL);
    } else {
      // Web fallback - table already exists in localStorage structure
      console.log('Sync queue table ready (web mode)');
    }
  }

  async enqueue(payloadType: string, payload: any): Promise<number> {
    const payloadStr = JSON.stringify(payload);
    const now = new Date().toISOString();

    if (this.db) {
      const result = await this.db.run(
        'INSERT INTO sync_queue (payload_type, payload, status, retry_count, created_at) VALUES (?, ?, ?, ?, ?)',
        [payloadType, payloadStr, 'PENDING', 0, now]
      );
      return result.insertId;
    } else {
      const queue = window.schoolDB.syncQueue;
      const newId = queue.length > 0 ? Math.max(...queue.map((q: any) => q.id)) + 1 : 1;
      queue.push({
        id: newId,
        payload_type: payloadType,
        payload: payloadStr,
        status: 'PENDING',
        retry_count: 0,
        created_at: now,
      });
      localStorage.setItem('sync_queue', JSON.stringify(queue));
      return newId;
    }
  }

  async getPendingQueue(limit: number = 50): Promise<any[]> {
    if (this.db) {
      const result = await this.db.query(
        'SELECT * FROM sync_queue WHERE status = ? ORDER BY created_at ASC LIMIT ?',
        ['PENDING', limit]
      );
      return result.values;
    } else {
      return window.schoolDB.syncQueue
        .filter((q: any) => q.status === 'PENDING')
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(0, limit);
    }
  }

  async getPendingCount(): Promise<number> {
    if (this.db) {
      const result = await this.db.query('SELECT COUNT(*) as count FROM sync_queue WHERE status = ?', ['PENDING']);
      return result.values[0].count;
    } else {
      return window.schoolDB.syncQueue.filter((q: any) => q.status === 'PENDING').length;
    }
  }

  async deleteSyncedItems(ids: number[]): Promise<void> {
    if (ids.length === 0) return;

    if (this.db) {
      const placeholders = ids.map(() => '?').join(',');
      await this.db.run(`DELETE FROM sync_queue WHERE id IN (${placeholders})`, ids);
    } else {
      window.schoolDB.syncQueue = window.schoolDB.syncQueue.filter(
        (q: any) => !ids.includes(q.id)
      );
      localStorage.setItem('sync_queue', JSON.stringify(window.schoolDB.syncQueue));
    }
  }

  async updateRetryCount(id: number, count: number): Promise<void> {
      if (this.db) {
        await this.db.run('UPDATE sync_queue SET retry_count = ? WHERE id = ?', [count, id]);
      } else {
        const queue = window.schoolDB.syncQueue;
        const item = queue.find((q: any) => q.id === id);
        if (item) {
          item.retry_count = count;
          localStorage.setItem('sync_queue', JSON.stringify(queue));
        }
      }
    }
  
    async updateStatus(id: number, status: string): Promise<void> {
      if (this.db) {
        await this.db.run('UPDATE sync_queue SET status = ? WHERE id = ?', [status, id]);
      } else {
        const queue = window.schoolDB.syncQueue;
        const item = queue.find((q: any) => q.id === id);
        if (item) {
          item.status = status;
          localStorage.setItem('sync_queue', JSON.stringify(queue));
        }
      }
    }

  async isOnline(): Promise<boolean> {
    if (Capacitor.isNative()) {
      const status = await Network.getStatus();
      return status.connected;
    }
    return navigator.onLine;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
    }
  }
}

// Extend Window interface for web fallback
declare global {
  interface Window {
    schoolDB: any;
  }
}

export const dbService = new DatabaseService();