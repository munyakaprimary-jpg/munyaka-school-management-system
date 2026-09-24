import { Preferences } from '@capacitor/preferences';
import { initialSeedData } from '@/data/initialSeedData';

const SERVER_URL_KEY = 'lan_server_url';
const LEGACY_SERVER_URL_KEY = 'munyaka_lan_server_url';
const CENTRAL_DB_STORAGE_KEY = 'munyaka_central_db_cache';

export const getStoredServerUrl = (): string => {
  try {
    const primary = localStorage.getItem(SERVER_URL_KEY);
    if (primary) return primary.trim().replace(/\/+$/, '');
    const legacy = localStorage.getItem(LEGACY_SERVER_URL_KEY);
    if (legacy) {
      localStorage.setItem(SERVER_URL_KEY, legacy);
      localStorage.removeItem(LEGACY_SERVER_URL_KEY);
      return legacy.trim().replace(/\/+$/, '');
    }
  } catch {}
  return 'http://localhost:5000';
};

export const CentralDataSyncManager = {
  async fetchRemoteDump(): Promise<any | null> {
    const serverUrl = getStoredServerUrl();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${serverUrl}/api/central-db/dump`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn('[CentralDataSyncManager] Offline or server unreachable, falling back to local storage.');
    }
    return null;
  },

  async syncBatchToRemote(batchPayload: Record<string, any>): Promise<boolean> {
    const serverUrl = getStoredServerUrl();
    try {
      const res = await fetch(`${serverUrl}/api/central-db/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchPayload)
      });
      if (res.ok) {
        const json = await res.json();
        return json && json.success === true;
      }
    } catch (err) {
      console.error('[CentralDataSyncManager] Failed to sync batch to remote server:', err);
    }
    return false;
  },

  async initializeAndHydrate(): Promise<void> {
    // 1. Attempt remote dump
    const remoteData = await CentralDataSyncManager.fetchRemoteDump();
    if (remoteData) {
      // Save to localStorage & Capacitor Preferences
      localStorage.setItem(CENTRAL_DB_STORAGE_KEY, JSON.stringify(remoteData));
      try {
        await Preferences.set({ key: CENTRAL_DB_STORAGE_KEY, value: JSON.stringify(remoteData) });
      } catch {}

      // Hydrate canonical keys
      if (remoteData.students) {
        localStorage.setItem('munyaka_students', JSON.stringify(remoteData.students));
        localStorage.setItem('school_learners_data', JSON.stringify(remoteData.students));
      }
      if (remoteData.staff) {
        localStorage.setItem('munyaka_staff', JSON.stringify(remoteData.staff));
        localStorage.setItem('munyaka_staff_directory', JSON.stringify(remoteData.staff));
        localStorage.setItem('munyaka_master_staff_list', JSON.stringify(remoteData.staff));
      }
      if (remoteData.fees) {
        localStorage.setItem('munyaka_fees_records', JSON.stringify(remoteData.fees));
        localStorage.setItem('munyaka_student_fees', JSON.stringify(remoteData.fees));
      }
      if (remoteData.attendance) {
        localStorage.setItem('munyaka_attendance', JSON.stringify(remoteData.attendance));
      }
      if (remoteData.grades) {
        localStorage.setItem('munyaka_grades', JSON.stringify(remoteData.grades));
      }
      if (remoteData.examTypes) {
        localStorage.setItem('munyaka_exam_types', JSON.stringify(remoteData.examTypes));
      }
      if (remoteData.libraryBooks) {
        localStorage.setItem('munyaka_library_books', JSON.stringify(remoteData.libraryBooks));
      }
      if (remoteData.feeStructures) {
        localStorage.setItem('munyaka_fee_structures', JSON.stringify(remoteData.feeStructures));
      }
      if (remoteData.notices) {
        localStorage.setItem('munyaka_notices', JSON.stringify(remoteData.notices));
      }
      if (remoteData.settings) {
        localStorage.setItem('munyaka_system_settings_v3', JSON.stringify(remoteData.settings));
      }
      console.log('[CentralDataSyncManager] Successfully hydrated local state from remote munyaka_central_db dump.');
      return;
    }

    // 2. Fall back to local storage or initialSeedData
    const localCache = localStorage.getItem(CENTRAL_DB_STORAGE_KEY);
    if (localCache) {
      try {
        const parsed = JSON.parse(localCache);
        if (parsed && typeof parsed === 'object') {
          console.log('[CentralDataSyncManager] Loaded state from local cache.');
          return;
        }
      } catch {}
    }

    // 3. Fall back strictly to initialSeedData
    console.log('[CentralDataSyncManager] Initializing from initialSeedData.ts fallback.');
    const fallbackDb = {
      students: initialSeedData.students || [],
      staff: initialSeedData.staff || [],
      attendance: (initialSeedData as any).attendance || {},
      fees: (initialSeedData as any).fees || [],
      grades: (initialSeedData as any).grades || {},
      examTypes: (initialSeedData as any).examTypes || [],
      libraryBooks: (initialSeedData as any).libraryBooks || [],
      feeStructures: (initialSeedData as any).feeStructures || [],
      notices: (initialSeedData as any).notices || [],
      settings: (initialSeedData as any).settings || {}
    };

    localStorage.setItem(CENTRAL_DB_STORAGE_KEY, JSON.stringify(fallbackDb));
    try {
      await Preferences.set({ key: CENTRAL_DB_STORAGE_KEY, value: JSON.stringify(fallbackDb) });
    } catch {}
  },

  async persistAndSyncMutation(key: string, data: any): Promise<void> {
    // 1. Update local storage cache
    try {
      const cacheRaw = localStorage.getItem(CENTRAL_DB_STORAGE_KEY) || '{}';
      const db = JSON.parse(cacheRaw);
      db[key] = data;
      localStorage.setItem(CENTRAL_DB_STORAGE_KEY, JSON.stringify(db));
      try {
        await Preferences.set({ key: CENTRAL_DB_STORAGE_KEY, value: JSON.stringify(db) });
      } catch {}
    } catch {}

    // 2. Trigger async POST to /api/central-db/sync
    setTimeout(async () => {
      await CentralDataSyncManager.syncBatchToRemote({ [key]: data });
    }, 50);
  }
};

export default CentralDataSyncManager;
