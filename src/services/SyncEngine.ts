/**
 * SyncEngine for Firestore cloud synchronization.
 */
import { db } from '@/lib/firebaseClient';
import { collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';

export interface ConnectionStatus {
  isOnline: boolean;
  serverReachable: boolean;
  latency: number | null;
  lastChecked: Date;
  serverUrl: string | null;
}

export const startAutoSync = (_syncInterval = 30000, _heartbeatInterval = 60000) => {};
export const stopAutoSync = () => {};
export const setupAutoSyncOnReconnect = () => () => {};
export const subscribeToConnectionStatus = (callback: (status: ConnectionStatus) => void) => {
  callback({
    isOnline: navigator.onLine,
    serverReachable: false,
    latency: null,
    lastChecked: new Date(),
    serverUrl: null,
  });
  return () => {};
};
export const registerDevice = async (_deviceName: string) => true;

export const checkServerConnection = async (): Promise<ConnectionStatus> => ({
  isOnline: navigator.onLine,
  serverReachable: false,
  latency: null,
  lastChecked: new Date(),
  serverUrl: null,
});

/**
 * Syncs user accounts, system roles, assigned default email domains (@munyaka.sc.ke), and access permissions
 * to Firestore cloud collection `users` with composite document ID pattern `MUN-XXXX` (e.g. MUN-0001).
 */
export const syncUsersToCloud = async (): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    const rawStaffData =
      localStorage.getItem('munyaka_staff') ||
      localStorage.getItem('munyaka_staff_registry') ||
      localStorage.getItem('staff_registry') ||
      localStorage.getItem('staff_list') ||
      '[]';
    
    let staffList = JSON.parse(rawStaffData);

    // 2. Automatic Default Staff Fallback Seeding
    if (!Array.isArray(staffList) || staffList.length === 0) {
      staffList = [
        { id: 'MUN-0001', name: 'JAMES NDIKI', role: 'ICT Teacher', email: 'jndiki@munyaka.sc.ke' },
        { id: 'MUN-0002', name: 'ANN NDUTA MBUGUA', role: 'Class Teacher', email: 'annmbugua@munyaka.sc.ke' },
        { id: 'MUN-0003', name: 'JANET GATHONI KUNGU', role: 'Library Teacher', email: 'janetkungu@munyaka.sc.ke' },
        { id: 'MUN-0004', name: 'LAWRENCE NDEGWA GIOSHE', role: 'Subject Teacher', email: 'lndegwa@munyaka.sc.ke' },
        { id: 'MUN-0005', name: 'ALICE MAINA', role: 'Class Teacher', email: 'maina@munyaka.sc.ke' },
        { id: 'MUN-0006', name: 'HOGLA SANDUKI', role: 'Class Teacher', email: 'sanduki@munyaka.sc.ke' }
      ];
      localStorage.setItem('munyaka_staff', JSON.stringify(staffList));
    }

    const recordsToSync: any[] = [];

    staffList.forEach((staff: any, index: number) => {
      if (!staff) return;
      const numStr = String(index + 1).padStart(4, '0');
      const docId = staff.id && String(staff.id).startsWith('MUN-') ? staff.id : `MUN-${numStr}`;
      
      const authUser = {
        id: docId,
        userId: docId,
        fullName: staff.fullName || staff.name,
        email: staff.email || `${docId.toLowerCase()}@munyaka.sc.ke`,
        role: staff.role || 'Teacher',
        status: 'Active',
        updatedAt: new Date().toISOString()
      };

      recordsToSync.push(authUser);
    });

    localStorage.setItem('munyaka_users', JSON.stringify(recordsToSync));

    try {
      const { collection, doc, setDoc, getDocs, deleteDoc, getFirestore } = await import('firebase/firestore');
      const dbInstance = getFirestore();
      if (dbInstance) {
        // Upsert each user object into Firestore users collection using setDoc(doc(db, 'users', docId), authUser)
        for (const authUser of recordsToSync) {
          const docRef = doc(dbInstance, 'users', authUser.id);
          await setDoc(docRef, authUser, { merge: true });
        }
      }
    } catch (fbErr) {
      console.warn('Firestore sync for users offline/unavailable, saved locally to munyaka_users:', fbErr);
    }

    localStorage.setItem('cloud_users', JSON.stringify(recordsToSync));

    return { success: true, count: recordsToSync.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Users sync failed' };
  }
};

/**
 * Syncs school events and notices to Firestore cloud collection `events_notices`
 * with composite document ID pattern `event_{date}_{category}` (lowercase, spaces replaced by underscores).
 */
export const syncEventsNoticesToCloud = async (): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    const rawEvents = localStorage.getItem('munyaka_events_v2') || localStorage.getItem('munyaka_events') || '[]';
    const rawNotices = localStorage.getItem('munyaka_notices') || '[]';
    
    let eventsList: any[] = [];
    let noticesList: any[] = [];
    
    try {
      eventsList = JSON.parse(rawEvents);
    } catch {
      eventsList = [];
    }

    try {
      noticesList = JSON.parse(rawNotices);
    } catch {
      noticesList = [];
    }

    const combinedMap = new Map<string, any>();

    eventsList.forEach((e: any, idx: number) => {
      if (!e) return;
      const title = String(e?.title || e?.eventName || 'School Event').trim();
      const category = String(e?.category || e?.eventType || 'General').trim();
      const date = String(e?.date || e?.eventDate || new Date().toISOString().split('T')[0]).trim();
      const key = `${date}_${title}`.toLowerCase();
      if (!combinedMap.has(key)) {
        combinedMap.set(key, {
          ...e,
          id: e?.id || `evt_${idx + 1}`,
          title,
          category,
          date,
          type: 'event'
        });
      }
    });

    noticesList.forEach((n: any, idx: number) => {
      if (!n) return;
      const title = String(n?.title || n?.subject || 'Notice').trim();
      const category = String(n?.category || 'General').trim();
      const date = String(n?.date || n?.createdAt || new Date().toISOString().split('T')[0]).trim();
      const key = `${date}_${title}_notice`.toLowerCase();
      if (!combinedMap.has(key)) {
        combinedMap.set(key, {
          ...n,
          id: n?.id || `not_${idx + 1}`,
          title,
          category,
          date,
          type: 'notice'
        });
      }
    });

    const recordsToSync = Array.from(combinedMap.values());

    const batch = writeBatch(db);
    recordsToSync.forEach((item, idx) => {
      const dateStr = String(item?.date || '2025-05-02').toLowerCase();
      const catStr = String(item?.category || 'general').toLowerCase();
      const cleanDate = dateStr.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const cleanCat = catStr.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const docId = `event_${cleanDate}_${cleanCat}_${idx}`;

      const docRef = doc(db, 'events_notices', docId);
      batch.set(docRef, {
        ...item,
        syncedAt: new Date().toISOString()
      }, { merge: true });
    });

    if (recordsToSync.length > 0) {
      await batch.commit();
    }

    localStorage.setItem('cloud_events_notices', JSON.stringify(recordsToSync));

    return { success: true, count: recordsToSync.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Events & Notices sync failed' };
  }
};

/**
 * Builds a stable Firestore document id from a timetable grade key.
 * "Grade 4 Green" -> "grade_4_green". Slashes are stripped because Firestore
 * document ids cannot contain "/".
 */
const timetableDocId = (gradeKey: string): string => {
  const slug = String(gradeKey || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const withoutPrefix = slug.startsWith('grade_') ? slug.slice('grade_'.length) : slug;
  return `grade_${withoutPrefix || 'unknown'}`;
};

/**
 * Syncs local timetable schedules (per grade) to Firestore cloud collection `timetables`.
 * Each grade becomes one document keyed by its grade slug (e.g. `grade_4_green`);
 * the whole grade record (timeSlots + entries) is upserted.
 */
export const syncTimetablesToCloud = async (): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    const raw = localStorage.getItem('school-timetable-data') || localStorage.getItem('munyaka_timetable') || '{}';
    const local = JSON.parse(raw);
    if (!local || typeof local !== 'object') {
      return { success: false, count: 0, error: 'No local timetable data found' };
    }

    const records: { docId: string; payload: any }[] = [];
    Object.entries(local).forEach(([gradeId, record]: [string, any]) => {
      if (record && Array.isArray(record.timeSlots)) {
        records.push({
          docId: timetableDocId(gradeId),
          payload: { ...record, grade_id: gradeId, synced_at: new Date().toISOString() },
        });
      }
    });

    if (records.length === 0) {
      return { success: true, count: 0 };
    }

    const batch = writeBatch(db);
    records.forEach(({ docId, payload }) => {
      batch.set(doc(db, 'timetables', docId), payload, { merge: true });
    });

    await batch.commit();
    return { success: true, count: records.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Timetable sync failed' };
  }
};

/**
 * Fetches all timetable documents from the Firestore `timetables` collection.
 */
export const fetchTimetablesFromCloud = async (): Promise<{ success: boolean; count: number; data?: any[]; error?: string }> => {
  try {
    const snap = await getDocs(collection(db, 'timetables')).catch(() => ({ docs: [] }));
    const docs = (snap?.docs || []).map((doc: any) => ({ id: doc.id, ...doc.data() }));
    return { success: true, count: docs.length, data: docs };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Fetch timetables failed' };
  }
};
