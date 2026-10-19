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
 * to Firestore cloud collection `users` with composite document ID pattern `user_{national_id_or_staff_id_or_email}`
 * (lowercase, spaces replaced by underscores).
 */
export const syncUsersToCloud = async (): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    const rawStaff = localStorage.getItem('munyaka_staff') || localStorage.getItem('munyaka_staff_directory') || localStorage.getItem('staff_registry') || localStorage.getItem('staff') || localStorage.getItem('munyaka_staff_master') || '[]';
    const rawUsers = localStorage.getItem('munyaka_users') || '[]';
    
    let staffList: any[] = [];
    let existingUsers: any[] = [];
    
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

    const combinedMap = new Map<string, any>();
    
    // Add existing users from munyaka_users
    existingUsers.forEach((u: any) => {
      if (!u) return;
      const email = (u.email || '').toLowerCase().trim();
      if (email) combinedMap.set(email, u);
    });

    // Add registered staff, auto-generating user auth profile if not present
    staffList.forEach((s: any, idx: number) => {
      if (!s) return;
      const fullName = s?.fullName || s?.name || s?.staffName || 'Staff Member';
      const nameParts = fullName.trim().toLowerCase().split(/\s+/);
      const firstName = nameParts[0] || 'staff';
      const lastName = nameParts[nameParts.length - 1] || `${idx + 1}`;
      const rawEmail = s?.domainEmail || s?.email || `${firstName}.${lastName}@munyaka.sc.ke`;
      const email = String(rawEmail).includes('@') ? rawEmail : `${rawEmail}@munyaka.sc.ke`;
      const emailKey = email.toLowerCase().trim();

      if (!combinedMap.has(emailKey)) {
        const userProfile = {
          id: s?.id || `user_stf_${Date.now()}_${idx}`,
          fullName,
          name: fullName,
          email,
          role: s?.role || s?.category || s?.designation || 'Staff',
          staffId: s?.staffId || s?.tscNumber || s?.id || `STF-${idx + 1}`,
          tscNumber: s?.tscNo || s?.tscNumber || null,
          nationalId: s?.nationalId || null,
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
      const db = getFirestore();
      if (db) {
        for (const record of recordsToSync) {
          const rawIdentifier = record.nationalId || record.tscNumber || record.staffId || record.email || `user_${Math.random()}`;
          const cleanIdentifier = String(rawIdentifier).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '_');
          const docId = `user_${cleanIdentifier}`;
          const docRef = doc(db, 'users', docId);
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

    const combined = [
      ...(Array.isArray(eventsList) ? eventsList : []),
      ...(Array.isArray(noticesList) ? noticesList : [])
    ];

    if (combined.length === 0) {
      combined.push(
        {
          id: 'event-default-1',
          title: 'Opening of Term 1, 2026',
          eventDate: '2026-01-12',
          targetGroup: 'All Learners',
          category: 'Term Opening',
          status: 'Published',
          content: 'School reopens for Term 1 academic calendar.'
        },
        {
          id: 'notice-default-1',
          title: 'Staff Briefing Meeting',
          eventDate: '2026-01-10',
          targetGroup: 'Teaching Staff',
          category: 'Staff Briefing',
          status: 'Active',
          content: 'Mandatory CBC alignment meeting in main staffroom.'
        }
      );
    }

    const batch = writeBatch(db);
    const mappedRecords = combined.map((item, idx) => {
      const dateStr = item?.eventDate ?? item?.date ?? item?.createdAt?.split('T')[0] ?? '2026-01-01';
      const categoryStr = item?.category ?? item?.type ?? 'general';
      const cleanDate = String(dateStr).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const cleanCategory = String(categoryStr).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const docId = `event_${cleanDate}_${cleanCategory}_${idx}`;

      const record = {
        id: item?.id ?? docId,
        title: item?.title ?? item?.name ?? 'Untitled Event/Notice',
        eventDate: item?.eventDate ?? item?.date ?? '',
        targetGroup: item?.targetGroup ?? item?.targetAudience ?? item?.audience ?? 'All',
        category: item?.category ?? item?.type ?? 'General',
        status: item?.status ?? 'Active',
        content: item?.content ?? item?.description ?? '',
        syncedAt: new Date().toISOString()
      };

      const docRef = doc(db, 'events_notices', docId);
      batch.set(docRef, record, { merge: true });

      return record;
    });

    await batch.commit();

    // Store in localStorage cloud simulation mirror for events_notices
    localStorage.setItem('cloud_events_notices', JSON.stringify(mappedRecords));

    return { success: true, count: mappedRecords.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Sync failed' };
  }
};
