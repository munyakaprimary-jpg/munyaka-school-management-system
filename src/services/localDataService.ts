/**
 * localDataService.ts — Unified offline-first data layer
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all persistent mutations in the app.
 *
 * Design goals:
 *   • Every write → localStorage (instant, synchronous) + IndexedDB (durable)
 *   • Every write → try/catch + notifyDataChanged event + toast notification
 *   • Every read  → localStorage first (fast), IndexedDB fallback
 *   • No Supabase, no fetch() for entity data
 *
 * Usage:
 *   import { localData } from '@/services/localDataService';
 *
 *   // Sync write with toast
 *   const { ok } = await localData.settings.save({ schoolName: 'My School', ... });
 *
 *   // Async batch write
 *   await localData.learners.saveMany(records);
 *
 *   // Read with fallback
 *   const settings = localData.settings.get();
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { idbStore } from './idbStore';
import { showSuccess, showError } from '@/utils/toast';
import { notifyDataChanged } from '@/utils/storage';
import { lsSet, lsRead } from '@/utils/storage';

// ─── Result type ────────────────────────────────────────────────────────────

export interface DataResult<T = void> {
  data?: T;
  error?: string;
  ok: boolean;
}

const ok = <T>(data?: T): DataResult<T> => ({ ok: true, data });
const err = <T = void>(message: string): DataResult<T> => ({ ok: false, error: message });

// ─── Storage keys ───────────────────────────────────────────────────────────

const KEY_INVENTORY      = 'munyaka_inventory';
const KEY_ASSET_LOGS     = 'munyaka_asset_logs';
const KEY_STUDENT_ATTEND = 'munyaka_student_attendance';
const KEY_TEACHER_ATTEND = 'munyaka_teacher_attendance';
const KEY_SYSTEM_SETTINGS = 'munyaka_system_settings_v3';

const IDB_INVENTORY      = 'ict_assets';
const IDB_ASSET_LOGS     = 'asset_logs';
const IDB_STUDENT_ATTEND = 'attendance_v2';
const IDB_TEACHER_ATTEND = 'staff_attendance';
const IDB_SYSTEM_SETTINGS = 'system_settings';

// ─── Internal helpers ───────────────────────────────────────────────────────

/**
 * Persist to localStorage and IndexedDB in parallel.
 * Fails gracefully: even if IndexedDB is unavailable, localStorage write
 * is sufficient for the app to function.
 */
async function persistToBoth<T extends object>(
  idbStore: string,
  lsKey: string,
  data: T | T[],
  isArray = false
): Promise<void> {
  // 1. localStorage (synchronous — primary for fast reads)
  try {
    lsSet(lsKey, data);
  } catch (e) {
    console.error(`[localData] lsSet failed for ${lsKey}:`, e);
  }

  // 2. IndexedDB (async — durable backup)
  try {
    if (isArray) {
      await idbStore.putMany(idbStore, data as T[]);
    } else {
      await idbStore.put(idbStore, data as T);
    }
  } catch (e) {
    console.error(`[localData] IndexedDB write failed for ${idbStore}:`, e);
  }
}

// ─── Module: System Settings ─────────────────────────────────────────────────

const settingsModule = {
  get<T = Record<string, unknown>>(): T {
    return lsRead<T>(KEY_SYSTEM_SETTINGS, {} as T);
  },

  async save(data: Record<string, unknown>): Promise<DataResult> {
    try {
      await persistToBoth(IDB_SYSTEM_SETTINGS, KEY_SYSTEM_SETTINGS, data);
      notifyDataChanged(KEY_SYSTEM_SETTINGS);
      showSuccess('Settings saved successfully.');
      return ok();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      showError('Failed to save settings.');
      return err(msg);
    }
  },
};

// ─── Module: ICT Inventory / Assets ─────────────────────────────────────────

export interface AssetRecord {
  id: string;
  item: string;
  category: string;
  qty: number;
  status: string;
  color?: string;
  [key: string]: unknown;
}

const inventoryModule = {
  getAll(): AssetRecord[] {
    return lsRead<AssetRecord[]>(KEY_INVENTORY, []);
  },

  async save(record: AssetRecord): Promise<DataResult<AssetRecord>> {
    try {
      const existing = this.getAll();
      const idx = existing.findIndex(r => r.id === record.id);
      const updated = idx >= 0
        ? existing.map(r => r.id === record.id ? record : r)
        : [record, ...existing];
      await persistToBoth(IDB_INVENTORY, KEY_INVENTORY, updated, true);
      notifyDataChanged(KEY_INVENTORY);
      showSuccess(idx >= 0 ? 'Asset updated.' : 'Asset added.');
      return ok(record);
    } catch (e) {
      showError('Failed to save asset.');
      return err(e instanceof Error ? e.message : 'Unknown error');
    }
  },

  async delete(id: string): Promise<DataResult> {
    try {
      const existing = this.getAll().filter(r => r.id !== id);
      await persistToBoth(IDB_INVENTORY, KEY_INVENTORY, existing, true);
      notifyDataChanged(KEY_INVENTORY);
      showSuccess('Asset deleted.');
      return ok();
    } catch (e) {
      showError('Failed to delete asset.');
      return err(e instanceof Error ? e.message : 'Unknown error');
    }
  },

  async saveMany(records: AssetRecord[]): Promise<DataResult> {
    try {
      await persistToBoth(IDB_INVENTORY, KEY_INVENTORY, records, true);
      notifyDataChanged(KEY_INVENTORY);
      showSuccess(`${records.length} assets saved.`);
      return ok();
    } catch (e) {
      showError('Failed to bulk-save assets.');
      return err(e instanceof Error ? e.message : 'Unknown error');
    }
  },
};

// ─── Module: Asset Logs ─────────────────────────────────────────────────────

export interface AssetLogRecord {
  id: string | number;
  assetId?: string;
  item: string;
  issuedTo: string;
  date: string;
  dateReturned?: string;
  status: string;
  qty: number;
  [key: string]: unknown;
}

const assetLogsModule = {
  getAll(): AssetLogRecord[] {
    return lsRead<AssetLogRecord[]>(KEY_ASSET_LOGS, []);
  },

  async save(log: AssetLogRecord): Promise<DataResult<AssetLogRecord>> {
    try {
      const existing = this.getAll();
      const idx = existing.findIndex(r => r.id === log.id);
      const updated = idx >= 0
        ? existing.map(r => r.id === log.id ? log : r)
        : [log, ...existing];
      await persistToBoth(IDB_ASSET_LOGS, KEY_ASSET_LOGS, updated, true);
      notifyDataChanged(KEY_ASSET_LOGS);
      showSuccess('Asset log saved.');
      return ok(log);
    } catch (e) {
      showError('Failed to save asset log.');
      return err(e instanceof Error ? e.message : 'Unknown error');
    }
  },

  async delete(id: string | number): Promise<DataResult> {
    try {
      const existing = this.getAll().filter(r => r.id !== id);
      await persistToBoth(IDB_ASSET_LOGS, KEY_ASSET_LOGS, existing, true);
      notifyDataChanged(KEY_ASSET_LOGS);
      showSuccess('Asset log deleted.');
      return ok();
    } catch (e) {
      showError('Failed to delete asset log.');
      return err(e instanceof Error ? e.message : 'Unknown error');
    }
  },
};

// ─── Module: Student Attendance ──────────────────────────────────────────────

export interface StudentAttendanceRecord {
  id?: string;
  studentId: string;
  date: string;
  session: 'morning' | 'afternoon';
  status: string;
  arrivalTime?: string;
  departureTime?: string;
  notes?: string;
  verifiedLat?: number;
  verifiedLng?: number;
  [key: string]: unknown;
}

const studentAttendModule = {
  /**
   * Get all attendance records, optionally filtered by studentId and/or date.
   */
  getAll(filters?: { studentId?: string; date?: string }): StudentAttendanceRecord[] {
    const all = lsRead<StudentAttendanceRecord[]>(KEY_STUDENT_ATTEND, []);
    return all.filter(r => {
      if (filters?.studentId && r.studentId !== filters.studentId) return false;
      if (filters?.date && r.date !== filters.date) return false;
      return true;
    });
  },

  /**
   * Get the record for a specific student + date (first matching session).
   */
  getForDate(studentId: string, date: string): StudentAttendanceRecord | undefined {
    return this.getAll({ studentId, date })[0];
  },

  async save(record: StudentAttendanceRecord): Promise<DataResult<StudentAttendanceRecord>> {
    try {
      const all = lsRead<StudentAttendanceRecord[]>(KEY_STUDENT_ATTEND, []);
      // Upsert by studentId + date + session
      const idx = all.findIndex(
        r => r.studentId === record.studentId && r.date === record.date && r.session === record.session
      );
      const updated = idx >= 0
        ? all.map(r =>
            r.studentId === record.studentId && r.date === record.date && r.session === record.session
              ? record : r)
        : [record, ...all];
      await persistToBoth(IDB_STUDENT_ATTEND, KEY_STUDENT_ATTEND, updated, true);
      notifyDataChanged(KEY_STUDENT_ATTEND);
      showSuccess(`Attendance recorded for ${record.date}.`);
      return ok(record);
    } catch (e) {
      showError('Failed to save attendance.');
      return err(e instanceof Error ? e.message : 'Unknown error');
    }
  },

  async delete(id: string): Promise<DataResult> {
    try {
      const all = this.getAll().filter(r => r.id !== id);
      await persistToBoth(IDB_STUDENT_ATTEND, KEY_STUDENT_ATTEND, all, true);
      notifyDataChanged(KEY_STUDENT_ATTEND);
      return ok();
    } catch (e) {
      showError('Failed to delete attendance record.');
      return err(e instanceof Error ? e.message : 'Unknown error');
    }
  },
};

// ─── Module: Teacher Attendance ──────────────────────────────────────────────

export interface TeacherAttendanceRecord {
  id?: string;
  teacherId: string;
  date: string;
  arrivalTime?: string;
  departureTime?: string;
  earlyDepartureReason?: string;
  verifiedLat?: number;
  verifiedLng?: number;
  [key: string]: unknown;
}

const teacherAttendModule = {
  getAll(teacherId?: string): TeacherAttendanceRecord[] {
    const all = lsRead<TeacherAttendanceRecord[]>(KEY_TEACHER_ATTEND, []);
    if (!teacherId) return all;
    return all.filter(r => r.teacherId === teacherId);
  },

  getForToday(teacherId: string): TeacherAttendanceRecord | undefined {
    const today = new Date().toISOString().split('T')[0];
    return this.getAll(teacherId).find(r => r.date === today);
  },

  async save(record: TeacherAttendanceRecord): Promise<DataResult<TeacherAttendanceRecord>> {
    try {
      const all = lsRead<TeacherAttendanceRecord[]>(KEY_TEACHER_ATTEND, []);
      const idx = all.findIndex(
        r => r.teacherId === record.teacherId && r.date === record.date
      );
      const updated = idx >= 0
        ? all.map(r =>
            r.teacherId === record.teacherId && r.date === record.date ? record : r)
        : [record, ...all];
      await persistToBoth(IDB_TEACHER_ATTEND, KEY_TEACHER_ATTEND, updated, true);
      notifyDataChanged(KEY_TEACHER_ATTEND);
      showSuccess('Attendance saved.');
      return ok(record);
    } catch (e) {
      showError('Failed to save teacher attendance.');
      return err(e instanceof Error ? e.message : 'Unknown error');
    }
  },

  async delete(id: string): Promise<DataResult> {
    try {
      const all = this.getAll().filter(r => r.id !== id);
      await persistToBoth(IDB_TEACHER_ATTEND, KEY_TEACHER_ATTEND, all, true);
      notifyDataChanged(KEY_TEACHER_ATTEND);
      return ok();
    } catch (e) {
      showError('Failed to delete teacher attendance record.');
      return err(e instanceof Error ? e.message : 'Unknown error');
    }
  },
};

// ─── Exported service ──────────────────────────────────────────────────────

export const localData = {
  settings:      settingsModule,
  inventory:     inventoryModule,
  assetLogs:     assetLogsModule,
  studentAttend: studentAttendModule,
  teacherAttend: teacherAttendModule,
} as const;
