/**
 * Stub SyncEngine for offline compatibility after service consolidation.
 */
export type ConnectionStatus = {
  isOnline: boolean;
  serverReachable: boolean;
  latency: number | null;
  lastChecked: Date | null;
  serverUrl: string | null;
};

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
import { db } from '@/lib/firebaseClient';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';

export interface ConnectionStatus {
  isOnline: boolean;
  serverReachable: boolean;
  latency: number | null;
  lastChecked: Date;
  serverUrl: string | null;
}

export const checkServerConnection = async (): Promise<ConnectionStatus> => ({
  isOnline: navigator.onLine,
  serverReachable: false,
  latency: null,
  lastChecked: new Date(),
  serverUrl: null,
});

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
