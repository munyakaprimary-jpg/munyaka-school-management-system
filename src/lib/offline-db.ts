import { Capacitor } from '@capacitor/core';
import { SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

const DB_NAME = 'munyaka_offline.db';
const SYNC_QUEUE_TABLE = 'sync_queue';

export interface SyncQueueItem {
  id?: number;
  payload_type: string;
  payload: string; // JSON string
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface TeacherActionPayload {
  action: 'attendance' | 'marks' | 'staff_checkin' | 'student_registration' | 'fee_payment';
  data: any;
  timestamp: string;
  device_id: string;
  teacher_id: string;
}

class OfflineDatabase {
  private db: SQLiteDBConnection | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const sqlite = new SQLiteConnection(Capacitor);
      this.db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
      await this.db.open();
      await this.createTables();
      this.isInitialized = true;
      console.log('Offline database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize offline database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Sync queue table
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS ${SYNC_QUEUE_TABLE} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payload_type TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        retry_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Local attendance cache
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS local_attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        date TEXT NOT NULL,
        session TEXT NOT NULL,
        status TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        UNIQUE(student_id, date, session)
      )
    `);

    // Local marks cache
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS local_marks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        subject_id TEXT NOT NULL,
        exam_type TEXT NOT NULL,
        term TEXT NOT NULL,
        academic_year TEXT NOT NULL,
        score INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        UNIQUE(student_id, subject_id, exam_type, term, academic_year)
      )
    `);

    // Local staff check-in cache
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS local_staff_checkin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staff_id TEXT NOT NULL,
        date TEXT NOT NULL,
        session TEXT NOT NULL,
        status TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        location_lat REAL,
        location_lng REAL,
        synced INTEGER DEFAULT 0,
        UNIQUE(staff_id, date, session)
      )
    `);

    // Create indexes for performance
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON ${SYNC_QUEUE_TABLE}(status)`);
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON ${SYNC_QUEUE_TABLE}(created_at)`);
  }

  async addToSyncQueue(payloadType: string, payload: TeacherActionPayload): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.run(`
      INSERT INTO ${SYNC_QUEUE_TABLE} (payload_type, payload, status, retry_count, created_at, updated_at)
      VALUES (?, ?, 'PENDING', 0, datetime('now'), datetime('now'))
    `, [payloadType, JSON.stringify(payload)]);

    return result.changes?.lastId || 0;
  }

  async getPendingItems(limit: number = 50): Promise<SyncQueueItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    return await this.db.query(`
      SELECT * FROM ${SYNC_QUEUE_TABLE}
      WHERE status = 'PENDING' OR (status = 'FAILED' AND retry_count < 3)
      ORDER BY created_at ASC
      LIMIT ?
    `, [limit]) as SyncQueueItem[];
  }

  async markAsSyncing(ids: number[]): Promise<void> {
    if (!this.db || ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    await this.db.run(`
      UPDATE ${SYNC_QUEUE_TABLE}
      SET status = 'SYNCING', updated_at = datetime('now')
      WHERE id IN (${placeholders})
    `, ids);
  }

  async markAsSynced(ids: number[]): Promise<void> {
    if (!this.db || ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    await this.db.run(`
      DELETE FROM ${SYNC_QUEUE_TABLE}
      WHERE id IN (${placeholders})
    `, ids);
  }

  async markAsFailed(ids: number[]): Promise<void> {
    if (!this.db || ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    await this.db.run(`
      UPDATE ${SYNC_QUEUE_TABLE}
      SET status = 'FAILED', retry_count = retry_count + 1, updated_at = datetime('now')
      WHERE id IN (${placeholders})
    `, ids);
  }

  async getPendingCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.query(`
      SELECT COUNT(*) as count FROM ${SYNC_QUEUE_TABLE}
      WHERE status = 'PENDING' OR (status = 'FAILED' AND retry_count < 3)
    `);
    return result.values?.[0]?.count || 0;
  }

  // Local cache operations
  async saveAttendanceLocally(attendance: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.run(`
      INSERT OR REPLACE INTO local_attendance (student_id, date, session, status, timestamp, synced)
      VALUES (?, ?, ?, ?, ?, 0)
    `, [attendance.student_id, attendance.date, attendance.session, attendance.status, attendance.timestamp]);
  }

  async saveMarksLocally(marks: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.run(`
      INSERT OR REPLACE INTO local_marks (student_id, subject_id, exam_type, term, academic_year, score, timestamp, synced)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `, [marks.student_id, marks.subject_id, marks.exam_type, marks.term, marks.academic_year, marks.score, marks.timestamp]);
  }

  async saveStaffCheckinLocally(checkin: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.run(`
      INSERT OR REPLACE INTO local_staff_checkin (staff_id, date, session, status, timestamp, location_lat, location_lng, synced)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `, [checkin.staff_id, checkin.date, checkin.session, checkin.status, checkin.timestamp, checkin.location_lat, checkin.location_lng]);
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

export const offlineDB = new OfflineDatabase();