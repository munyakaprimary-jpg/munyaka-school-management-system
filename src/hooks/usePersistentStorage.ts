// ─────────────────────────────────────────────────────────────────────────────
// usePersistentStorage — React hook for persistent offline state
// ─────────────────────────────────────────────────────────────────────────────
// Provides live-synced, reactive access to every primary state store backed
// by localStorage. All mutations are immediately persisted so data survives
// app restarts, browser closes, and APK termination.
//
// Usage example:
//   const { students, addStudent, updateStudent, deleteStudent } = usePersistentStorage();
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  // Primitive read helpers
  getStudents,
  getLearningAreas,
  getPaymentRecords,
  getTransactions,
  getUserSettings,
  getSubscriptions,
  // Primitive write helpers
  setStudents,
  setLearningAreas,
  setPaymentRecords,
  setTransactions,
  setUserSettings,
  setSubscriptions,
  // Mutation helpers
  createStudent,
  updateStudent as _updateStudent,
  deleteStudent as _deleteStudent,
  createLearningArea,
  updateLearningArea,
  deleteLearningArea,
  createPaymentRecord,
  updatePaymentRecord as _updatePaymentRecord,
  deletePaymentRecord as _deletePaymentRecord,
  createSubscription,
  updateSubscription as _updateSubscription,
  deleteSubscription as _deleteSubscription,
  // Notifications
  notifyDataChanged,
  STORAGE_KEYS,
  type Student,
  type PaymentRecord,
  type UserSettings,
  type Subscription,
  type LearningAreaCluster,
} from '@/utils/storage';

// ─── Internal key → state mapping ────────────────────────────────────────────

const WATCHED_KEYS = [
  STORAGE_KEYS.STUDENTS,
  STORAGE_KEYS.STUDENTS_LEGACY,
  STORAGE_KEYS.CBC_LEARNING_AREAS,
  STORAGE_KEYS.PAYMENT_RECORDS,
  STORAGE_KEYS.TRANSACTIONS,
  STORAGE_KEYS.USER_SETTINGS,
  STORAGE_KEYS.SUBSCRIPTIONS,
  STORAGE_KEYS.STAFF,
  STORAGE_KEYS.STAFF_PREREG,
  STORAGE_KEYS.ATTENDANCE,
  STORAGE_KEYS.GRADES,
  STORAGE_KEYS.EXAM_TYPES,
  STORAGE_KEYS.ASSESSMENT_SCORES,
  STORAGE_KEYS.LIBRARY_BOOKS,
  STORAGE_KEYS.ICT_ASSETS,
];

// ─── Hook factory ────────────────────────────────────────────────────────────

function createPersistentHook<T>(
  /** Which localStorage key to subscribe to. */
  storageKey: string,
  /** Initial value if localStorage is empty. */
  initialValue: T,
  /** Optional reducer to derive the visible value from localStorage. */
  selector?: (raw: T) => T,
) {
  return function usePersistentStore() {
    const [state, setState] = useState<T>(() => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw != null) {
          const parsed = JSON.parse(raw) as T;
          return selector ? selector(parsed) : parsed;
        }
      } catch {
        /* ignore parse errors — fall through to initial */
      }
      return initialValue;
    });

    const isInternalUpdate = useRef(false);

    // ── Re-read whenever storage changes (cross-tab or internal write) ──
    useEffect(() => {
      const handleStorage = (e: StorageEvent) => {
        if (e.key === storageKey || e.key === null) {
          try {
            const raw = localStorage.getItem(storageKey);
            const value = raw != null ? (JSON.parse(raw) as T) : initialValue;
            setState(selector ? selector(value) : value);
          } catch {
            /* ignore */
          }
        }
      };

      const handleCustom = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (!detail?.key || detail.key === storageKey) {
          try {
            const raw = localStorage.getItem(storageKey);
            const value = raw != null ? (JSON.parse(raw) as T) : initialValue;
            setState(selector ? selector(value) : value);
          } catch {
            /* ignore */
          }
        }
      };

      window.addEventListener('storage', handleStorage);
      window.addEventListener('munyaka:data-changed', handleCustom);
      return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('munyaka:data-changed', handleCustom);
      };
    }, [storageKey, initialValue, selector]);

    // ── Dispatcher ──
    const set = useCallback(
      (next: T | ((prev: T) => T)) => {
        isInternalUpdate.current = true;
        setState((prev) => {
          const resolved = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next;
          try {
            localStorage.setItem(storageKey, JSON.stringify(resolved));
            notifyDataChanged(storageKey);
          } catch (err) {
            console.error(`[usePersistentStorage] Failed to persist "${storageKey}":`, err);
          }
          return resolved;
        });
      },
      [storageKey],
    );

    return { state, set } as const;
  };
}

// ─── Individual store hooks ──────────────────────────────────────────────────

/** Students store */
export const useStudentsStore = createPersistentHook<Student[]>(
  STORAGE_KEYS.STUDENTS,
  [],
);

/** CBC Learning Areas store */
export const useLearningAreasStore = createPersistentHook<LearningAreaCluster[]>(
  STORAGE_KEYS.CBC_LEARNING_AREAS,
  [],
);

/** Payment Records / Fee Ledgers store */
export const usePaymentRecordsStore = createPersistentHook<PaymentRecord[]>(
  STORAGE_KEYS.PAYMENT_RECORDS,
  [],
);

/** Transactions store */
export const useTransactionsStore = createPersistentHook<PaymentRecord[]>(
  STORAGE_KEYS.TRANSACTIONS,
  [],
);

/** User Settings store */
export const useUserSettingsStore = createPersistentHook<UserSettings>(
  STORAGE_KEYS.USER_SETTINGS,
  {} as UserSettings,
);

/** Subscriptions store */
export const useSubscriptionsStore = createPersistentHook<Subscription[]>(
  STORAGE_KEYS.SUBSCRIPTIONS,
  [],
);

// ─── Master hook — all stores in one ────────────────────────────────────────

export interface PersistentStorage {
  // Raw reactive state
  students: Student[];
  learningAreas: LearningAreaCluster[];
  paymentRecords: PaymentRecord[];
  transactions: PaymentRecord[];
  userSettings: UserSettings;
  subscriptions: Subscription[];

  // Re-read from storage
  refresh: () => void;

  // ── Students ──────────────────────────────────────────────────────────────
  addStudent: (input: Omit<Student, 'id'> & { id?: string }) => Student;
  updateStudent: (id: string, patch: Partial<Student>) => Student | null;
  deleteStudent: (id: string) => boolean;
  setStudents: (next: Student[]) => void;

  // ── CBC Learning Areas ─────────────────────────────────────────────────────
  addLearningArea: (
    clusterId: string,
    area: { name: string; type: 'Core' | 'Elective'; periodsPerWeek?: number; description?: string }
  ) => boolean;
  updateLearningArea: (
    clusterId: string,
    areaId: string,
    patch: Partial<{ name: string; type: 'Core' | 'Elective'; periodsPerWeek?: number; description?: string }>
  ) => boolean;
  deleteLearningArea: (clusterId: string, areaId: string) => boolean;
  setLearningAreas: (next: LearningAreaCluster[]) => void;

  // ── Payment Records ────────────────────────────────────────────────────────
  addPaymentRecord: (input: Omit<PaymentRecord, 'id'> & { id?: string }) => PaymentRecord;
  updatePaymentRecord: (id: string, patch: Partial<PaymentRecord>) => PaymentRecord | null;
  deletePaymentRecord: (id: string) => boolean;
  setPaymentRecords: (next: PaymentRecord[]) => void;

  // ── Transactions ───────────────────────────────────────────────────────────
  addTransaction: (tx: PaymentRecord) => boolean;
  setTransactions: (next: PaymentRecord[]) => void;

  // ── User Settings ──────────────────────────────────────────────────────────
  patchSettings: (patch: Partial<UserSettings>) => boolean;
  setSettings: (next: UserSettings) => void;

  // ── Subscriptions ─────────────────────────────────────────────────────────
  addSubscription: (input: Omit<Subscription, 'id'> & { id?: string }) => Subscription;
  updateSubscription: (id: string, patch: Partial<Subscription>) => Subscription | null;
  deleteSubscription: (id: string) => boolean;
  setSubscriptions: (next: Subscription[]) => void;
}

export function usePersistentStorage(): PersistentStorage {
  // ── Individual reactive slices ──
  const [students, setStudentsRaw] = useState<Student[]>(getStudents);
  const [learningAreas, setLearningAreasRaw] = useState<LearningAreaCluster[]>(getLearningAreas);
  const [paymentRecords, setPaymentRecordsRaw] = useState<PaymentRecord[]>(getPaymentRecords);
  const [transactions, setTransactionsRaw] = useState<PaymentRecord[]>(getTransactions);
  const [userSettings, setUserSettingsRaw] = useState<UserSettings>(getUserSettings);
  const [subscriptions, setSubscriptionsRaw] = useState<Subscription[]>(getSubscriptions);

  // ── Re-read from localStorage on external change ──
  const refreshAll = useCallback(() => {
    setStudentsRaw(getStudents());
    setLearningAreasRaw(getLearningAreas());
    setPaymentRecordsRaw(getPaymentRecords());
    setTransactionsRaw(getTransactions());
    setUserSettingsRaw(getUserSettings());
    setSubscriptionsRaw(getSubscriptions());
  }, []);

  useEffect(() => {
    const handleCustom = () => refreshAll();
    window.addEventListener('munyaka:data-changed', handleCustom);
    return () => window.removeEventListener('munyaka:data-changed', handleCustom);
  }, [refreshAll]);

  return {
    // ── Reactive state ──
    students,
    learningAreas,
    paymentRecords,
    transactions,
    userSettings,
    subscriptions,

    refresh: refreshAll,

    // ── Students ──
    addStudent: (input) => {
      const created = createStudent(input);
      refreshAll();
      return created;
    },
    updateStudent: (id, patch) => {
      const result = _updateStudent(id, patch);
      refreshAll();
      return result;
    },
    deleteStudent: (id) => {
      const result = _deleteStudent(id);
      refreshAll();
      return result;
    },
    setStudents: (next) => {
      setStudents(next);
      refreshAll();
    },

    // ── CBC Learning Areas ──
    addLearningArea: (clusterId, area) => {
      const result = createLearningArea(clusterId, area);
      refreshAll();
      return result;
    },
    updateLearningArea: (clusterId, areaId, patch) => {
      const result = updateLearningArea(clusterId, areaId, patch);
      refreshAll();
      return result;
    },
    deleteLearningArea: (clusterId, areaId) => {
      const result = deleteLearningArea(clusterId, areaId);
      refreshAll();
      return result;
    },
    setLearningAreas: (next) => {
      setLearningAreas(next);
      refreshAll();
    },

    // ── Payment Records ──
    addPaymentRecord: (input) => {
      const created = createPaymentRecord(input);
      refreshAll();
      return created;
    },
    updatePaymentRecord: (id, patch) => {
      const result = _updatePaymentRecord(id, patch);
      refreshAll();
      return result;
    },
    deletePaymentRecord: (id) => {
      const result = _deletePaymentRecord(id);
      refreshAll();
      return result;
    },
    setPaymentRecords: (next) => {
      setPaymentRecords(next);
      refreshAll();
    },

    // ── Transactions ──
    addTransaction: (tx) => {
      const current = getTransactions();
      const ok = setTransactions([...current, tx]);
      refreshAll();
      return ok;
    },
    setTransactions: (next) => {
      setTransactions(next);
      refreshAll();
    },

    // ── User Settings ──
    patchSettings: (patch) => {
      const ok = setUserSettings({ ...getUserSettings(), ...patch } as UserSettings);
      refreshAll();
      return ok;
    },
    setSettings: (next) => {
      setUserSettings(next);
      refreshAll();
    },

    // ── Subscriptions ──
    addSubscription: (input) => {
      const created = createSubscription(input);
      refreshAll();
      return created;
    },
    updateSubscription: (id, patch) => {
      const result = _updateSubscription(id, patch);
      refreshAll();
      return result;
    },
    deleteSubscription: (id) => {
      const result = _deleteSubscription(id);
      refreshAll();
      return result;
    },
    setSubscriptions: (next) => {
      setSubscriptions(next);
      refreshAll();
    },
  };
}
