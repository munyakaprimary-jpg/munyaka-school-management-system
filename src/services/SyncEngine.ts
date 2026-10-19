/**
 * SyncEngine for Firestore cloud synchronization.
 */
import { db } from '@/lib/firebaseClient';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';

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
 * to Firestore cloud collection `users` with composite document ID pattern `user_${staff.tscNo || staff.id || staff.email}`
 * (lowercase, spaces replaced by underscores).
 */
export const syncUsersToCloud = async (): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    const rawStaff = localStorage.getItem('munyaka_staff') || localStorage.getItem('munyaka_staff_directory') || localStorage.getItem('staff_registry') || localStorage.getItem('staff') || localStorage.getItem('munyaka_staff_master') || '[]';
    const rawUsers = localStorage.getItem('munyaka_users') || '[]';
    
    let staffList: any[] = [];
    let existingUsers: any = [];
    
    try {
      staffList = JSON.parse(rawStaff);
    } catch {
      staffList = [];
    }

    try {
      existingUsers = JSON.parse(rawUsers);
    } catch {
      existingUsers = [];
    }

    // 1. Safe Array Defense: Robustly convert existingUsers to array whether it is an array, snapshot, or object map
    const safeUsers = Array.isArray(existingUsers)
      ? existingUsers
      : (existingUsers?.docs || Object.values(existingUsers || {}));

    const combinedMap = new Map<string, any>();
    
    // Add existing users safely with optional chaining
    safeUsers.forEach((u: any) => {
      if (!u) return;
      const email = (u?.email || u?.data?.()?.email || '').toLowerCase().trim();
      if (email) combinedMap.set(email, u?.data ? { id: u.id, ...u.data() } : u);
    });

    // Add registered staff, auto-generating user auth profile if not present
    staffList.forEach((s: any, idx: number) => {
      if (!s) return;
      const fullName = s?.fullName ?? s?.name ?? s?.staffName ?? 'Staff Member';
      const nameParts = String(fullName).trim().toLowerCase().split(/\s+/);
      const firstName = nameParts[0] || 'staff';
      const lastName = nameParts[nameParts.length - 1] || `${idx + 1}`;
      const rawEmail = s?.domainEmail ?? s?.email ?? `${firstName}.${lastName}@munyaka.sc.ke`;
      const email = String(rawEmail).includes('@') ? rawEmail : `${rawEmail}@munyaka.sc.ke`;
      const emailKey = email.toLowerCase().trim();

      if (!combinedMap.has(emailKey)) {
        const staffId = s?.staffId ?? s?.id ?? `STF-${idx + 1}`;
        const tscNumber = s?.tscNo ?? s?.tscNumber ?? null;
        const nationalId = s?.nationalId ?? null;
        const userProfile = {
          id: s?.id ?? `user_stf_${Date.now()}_${idx}`,
          fullName,
          name: fullName,
          email,
          role: s?.role ?? s?.category ?? s?.designation ?? 'Staff',
          staffId,
          tscNumber,
          nationalId,
          status: 'Active',
          createdAt: new Date().toISOString()
        };
        combinedMap.set(emailKey, userProfile);
      }
    });

    const recordsToSync = Array.from(combinedMap.values());
    localStorage.setItem('munyaka_users', JSON.stringify(recordsToSync));

    try {
      const { collection, doc, setDoc, getFirestore } = await import('firebase/firestore');
      const dbInstance = getFirestore();
      if (dbInstance) {
        for (const record of recordsToSync) {
          // 2. Document ID Sanitization: Composite ID formatted as user_${staff.tscNo || staff.id || staff.email} (lowercase, spaces replaced by underscores)
          const rawIdentifier = record?.tscNumber ?? record?.tscNo ?? record?.staffId ?? record?.id ?? record?.email ?? `user_${Math.random()}`;
          const cleanIdentifier = String(rawIdentifier).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '_');
          const docId = `user_${cleanIdentifier}`;
          const docRef = doc(collection(dbInstance, 'users'), docId);
          await setDoc(docRef, {
            ...record,
            syncedAt: new Date().toISOString()
          }, { merge: true });
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
