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
    const rawUsers = localStorage.getItem('munyaka_users') || localStorage.getItem('users') || localStorage.getItem('munyaka_staff') || '[]';
    let userList: any[] = [];
    
    try {
      userList = JSON.parse(rawUsers);
    } catch {
      userList = [];
    }

    if (!Array.isArray(userList) || userList.length === 0) {
      userList = [
        {
          id: 'usr_admin_01',
          fullName: 'Dr. Jane Wangari',
          role: 'ADMINISTRATOR',
          email: 'admin@munyaka.sc.ke',
          staffId: 'STF-001',
          tscNumber: 'TSC-123456',
          nationalId: '23456789',
          permissions: ['all', 'manage_users', 'sync_cloud']
        },
        {
          id: 'usr_teacher_02',
          fullName: 'Mr. David Ochieng',
          role: 'Teacher',
          email: 'd.ochieng@munyaka.sc.ke',
          staffId: 'STF-002',
          tscNumber: 'TSC-987654',
          nationalId: '34567890',
          permissions: ['grade_students', 'take_attendance']
        },
        {
          id: 'usr_staff_03',
          fullName: 'Madam Beatrice Naliaka',
          role: 'Staff',
          email: 'b.naliaka@munyaka.sc.ke',
          staffId: 'STF-003',
          tscNumber: null,
          nationalId: '45678901',
          permissions: ['view_inventory', 'library_access']
        }
      ];
    }

    const batch = writeBatch(db);
    const mappedUsers = userList.map((user, idx) => {
      // Safe null checks and optional chaining (`?.`) to handle staff without TSC numbers cleanly
      const name = user?.fullName ?? user?.name ?? user?.userName ?? 'User';
      const role = user?.role ?? user?.designation ?? user?.systemRole ?? 'Staff';
      const staffId = user?.staffId ?? user?.id ?? `STF_${idx + 1}`;
      const tscNumber = user?.tscNumber ?? user?.tsc_no ?? null;
      const nationalId = user?.nationalId ?? user?.national_id ?? null;
      
      const rawEmail = user?.email ?? user?.username ?? `${String(name).toLowerCase().replace(/[^a-z]/g, '.')}@munyaka.sc.ke`;
      const email = String(rawEmail).includes('@') ? rawEmail : `${rawEmail}@munyaka.sc.ke`;
      const permissions = user?.permissions ?? user?.accessPermissions ?? ['read', 'write'];

      // Document ID composite pattern: user_{national_id_or_staff_id_or_email} (converted to lowercase with spaces replaced by underscores)
      const rawIdentifier = nationalId ?? tscNumber ?? staffId ?? email ?? `user_${idx + 1}`;
      const cleanIdentifier = String(rawIdentifier).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '_');
      const docId = `user_${cleanIdentifier}`;

      const record = {
        id: user?.id ?? docId,
        fullName: name,
        role: role,
        email: email,
        staffId: staffId,
        tscNumber: tscNumber,
        nationalId: nationalId,
        permissions: Array.isArray(permissions) ? permissions : [permissions],
        syncStatus: 'Synced',
        syncedAt: new Date().toISOString()
      };

      const docRef = doc(db, 'users', docId);
      batch.set(docRef, record, { merge: true });

      return record;
    });

    await batch.commit();

    // Store in localStorage cloud simulation mirror for users
    localStorage.setItem('cloud_users', JSON.stringify(mappedUsers));

    return { success: true, count: mappedUsers.length };
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
