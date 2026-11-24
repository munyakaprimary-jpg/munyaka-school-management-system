import { db } from "../config/firebase";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  getDoc,
  Timestamp,
} from "firebase/firestore";

const OFFLINE_QUEUE_KEY = "jamlyan_firestore_sync_queue_v1";
const ROLL_CALL_KEY = "roll_call";
const ASSESSMENT_SUBMISSIONS_KEY = "assessment_submissions";
const LEARNER_PROFILES_KEY = "munyaka_learners";
const MARKS_KEY = "munyaka_marks";

export interface AttendanceRecordNormalized {
  learnerId: string;
  learnerName: string;
  morningStatus: string;
  afternoonStatus: string;
  remarks?: string;
  date: string;
  [key: string]: any;
}

export interface AttendanceSavePayload {
  date: string;
  records: any[];
  locks: { morning: boolean; afternoon: boolean };
}

export interface AssessmentSubmissionPayload {
  id?: string;
  learnerId?: string;
  studentId?: string;
  assessmentId?: string;
  title?: string;
  score?: number;
  total?: number;
  submittedAt?: string;
  [key: string]: any;
}

export interface LearnerProfilePayload {
  id?: string;
  admissionNumber?: string;
  name?: string;
  fullName?: string;
  classGrade?: string;
  stream?: string;
  gender?: string;
  dateOfBirth?: string;
  parentPhone?: string;
  parentName?: string;
  [key: string]: any;
}

export interface MarksPayload {
  id?: string;
  learnerId?: string;
  studentId?: string;
  examId?: string;
  subject?: string;
  marks?: number;
  totalMarks?: number;
  grade?: string;
  term?: string;
  year?: string;
  [key: string]: any;
}

export function getActiveSchoolId(): string {
  try {
    const stored = localStorage.getItem("active_school_id") || localStorage.getItem("schoolId");
    if (stored) return stored;
  } catch (e) {
    // ignore
  }
  return "munyaka-primary-js";
}

export function normalizeStatus(val: any): string {
  if (!val) return "Present";
  const s = String(val).trim().toLowerCase();
  if (s === "present" || s === "p" || s === "yes" || s === "true" || s === "1") return "Present";
  if (s === "absent" || s === "a" || s === "no" || s === "false" || s === "0") return "Absent";
  if (s === "late" || s === "l" || s === "t") return "Late";
  if (s === "excused" || s === "e" || s === "ex") return "Excused";
  return String(val);
}

export function normalizeAttendanceRecord(raw: any, date: string): AttendanceRecordNormalized {
  const learnerId = String(raw.learnerId || raw.studentId || raw.admissionNo || raw.id || "unknown");
  const learnerName = String(raw.learnerName || raw.name || raw.studentName || raw.fullName || "Learner");
  
  const morningRaw = raw.morningStatus || raw.morning || raw.am || raw.statusMorning || "Present";
  const afternoonRaw = raw.afternoonStatus || raw.afternoon || raw.pm || raw.statusAfternoon || "Present";

  return {
    ...raw,
    learnerId,
    learnerName,
    morningStatus: normalizeStatus(morningRaw),
    afternoonStatus: normalizeStatus(afternoonRaw),
    remarks: String(raw.remarks || raw.comment || raw.note || ""),
    date: String(raw.date || date),
  };
}

// Queue handling for offline capability
function getOfflineQueue(): any[] {
  try {
    const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveOfflineQueue(queue: any[]) {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    // ignore
  }
}

export async function flushOfflineQueue(): Promise<void> {
  if (!navigator.onLine) {
    setSyncState({ state: 'offline', errorMessage: null });
    return;
  }
  const queue = getOfflineQueue();
  if (queue.length === 0) {
    setSyncState({ state: 'synced', errorMessage: null, lastSync: new Date().toISOString() });
    return;
  }

  setSyncState({ state: 'syncing', errorMessage: null });
  const remaining: any[] = [];
  const schoolId = getActiveSchoolId();
  let lastError: string | null = null;

  for (const item of queue) {
    try {
      if (item.type === "attendance") {
        const ref = doc(db, "schools", schoolId, "attendance", item.date);
        await setDoc(ref, item.data, { merge: true });
      } else if (item.type === "assessment_submission") {
        const subId = item.data.id || `${item.data.learnerId || item.data.studentId || "std"}_${Date.now()}`;
        const ref = doc(db, "schools", schoolId, "submissions", subId);
        await setDoc(ref, item.data, { merge: true });
      } else if (item.type === "learner_profile") {
        const learnerId = item.data.id || item.data.admissionNumber || `learner_${Date.now()}`;
        const ref = doc(db, "schools", schoolId, "learners", learnerId);
        await setDoc(ref, item.data, { merge: true });
      } else if (item.type === "marks") {
        const marksId = item.data.id || `${item.data.learnerId || item.data.studentId || "std"}_${item.data.examId || "exam"}_${Date.now()}`;
        const ref = doc(db, "schools", schoolId, "marks", marksId);
        await setDoc(ref, item.data, { merge: true });
      } else if (item.type === "quote_settings") {
        const ref = doc(db, "schools", schoolId, "settings", "login_quote");
        await setDoc(ref, item.data, { merge: true });
      }
    } catch (e: any) {
      console.error("Failed to flush queue item:", e);
      lastError = e?.code || e?.message || "Sync failed";
      remaining.push(item);
    }
  }

  saveOfflineQueue(remaining);

  if (remaining.length === 0) {
    setSyncState({ state: 'synced', errorMessage: null, lastSync: new Date().toISOString() });
  } else {
    setSyncState({ state: 'error', errorMessage: lastError || "Some items failed to sync" });
  }
}

// Attendance sync
export async function saveAttendanceRecordsAndLocks({ date, records, locks }: AttendanceSavePayload): Promise<void> {
  const schoolId = getActiveSchoolId();
  const normalizedRecords = (records || []).map((r) => normalizeAttendanceRecord(r, date));

  // 1. Update localStorage
  try {
    const existingRollCallStr = localStorage.getItem(ROLL_CALL_KEY);
    let allRollCall: Record<string, any[]> = {};
    if (existingRollCallStr) {
      try {
        allRollCall = JSON.parse(existingRollCallStr);
      } catch (e) {}
    }
    allRollCall[date] = normalizedRecords;
    localStorage.setItem(ROLL_CALL_KEY, JSON.stringify(allRollCall));

    const submittedKey = `submitted_${date}`;
    localStorage.setItem(submittedKey, JSON.stringify(locks));
  } catch (e) {
    console.error("Error saving attendance to localStorage:", e);
  }

  const payload = {
    schoolId,
    date,
    records: normalizedRecords,
    locks,
    updatedAt: new Date().toISOString(),
  };

  // 2. Write to Firestore or queue
  try {
    if (!navigator.onLine) {
      throw new Error("Offline");
    }
    setSyncState({ state: 'syncing', errorMessage: null });
    const ref = doc(db, "schools", schoolId, "attendance", date);
    await setDoc(ref, payload, { merge: true });
    setSyncState({ state: 'synced', errorMessage: null, lastSync: new Date().toISOString() });
  } catch (e: any) {
    const queue = getOfflineQueue();
    queue.push({ type: "attendance", date, data: payload, timestamp: Date.now() });
    saveOfflineQueue(queue);
    setSyncState({
      state: !navigator.onLine ? 'offline' : 'error',
      errorMessage: !navigator.onLine ? null : (e?.code || e?.message || "Sync failed"),
    });
  }
}

export function subscribeSchoolAttendance(
  date: string,
  onUpdate: (data: { records: any[]; locks: { morning: boolean; afternoon: boolean } }) => void
): () => void {
  const schoolId = getActiveSchoolId();

  // Load initial from localStorage immediately
  try {
    const allRollCallStr = localStorage.getItem(ROLL_CALL_KEY);
    if (allRollCallStr) {
      const allRollCall = JSON.parse(allRollCallStr);
      if (allRollCall[date]) {
        const locksStr = localStorage.getItem(`submitted_${date}`);
        const locks = locksStr ? JSON.parse(locksStr) : { morning: false, afternoon: false };
        onUpdate({ records: allRollCall[date], locks });
      }
    }
  } catch (e) {}

  try {
    const ref = doc(db, "schools", schoolId, "attendance", date);
    const unsubscribe = onSnapshot(
      ref,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.records) {
            const records = data.records;
            const locks = data.locks || { morning: false, afternoon: false };

            // Update localStorage cache
            try {
              const allRollCallStr = localStorage.getItem(ROLL_CALL_KEY);
              const allRollCall = allRollCallStr ? JSON.parse(allRollCallStr) : {};
              allRollCall[date] = records;
              localStorage.setItem(ROLL_CALL_KEY, JSON.stringify(allRollCall));
              localStorage.setItem(`submitted_${date}`, JSON.stringify(locks));
            } catch (e) {}

            onUpdate({ records, locks });
          }
        }
      },
      (err: any) => {
        console.error("Firestore attendance snapshot error:", err);
        setSyncState({
          state: !navigator.onLine ? 'offline' : 'error',
          errorMessage: !navigator.onLine ? null : (err?.code || err?.message || "Snapshot error"),
        });
      }
    );
    return () => unsubscribe();
  } catch (e) {
    return () => {};
  }
}

// Assessment Submissions sync
export async function saveAssessmentSubmission(sub: AssessmentSubmissionPayload): Promise<void> {
  const schoolId = getActiveSchoolId();
  const subId = sub.id || `${sub.learnerId || sub.studentId || "std"}_${sub.assessmentId || "exam"}_${Date.now()}`;
  const enhancedSub = {
    ...sub,
    id: subId,
    submittedAt: sub.submittedAt || new Date().toISOString(),
  };

  // 1. Save to localStorage
  try {
    const existingStr = localStorage.getItem(ASSESSMENT_SUBMISSIONS_KEY);
    let subs: any[] = [];
    if (existingStr) {
      try {
        subs = JSON.parse(existingStr);
      } catch (e) {}
    }
    const idx = subs.findIndex((s: any) => s.id === subId || (s.learnerId === enhancedSub.learnerId && s.assessmentId === enhancedSub.assessmentId));
    if (idx >= 0) {
      subs[idx] = enhancedSub;
    } else {
      subs.push(enhancedSub);
    }
    localStorage.setItem(ASSESSMENT_SUBMISSIONS_KEY, JSON.stringify(subs));
  } catch (e) {
    console.error("Error saving assessment submission to localStorage:", e);
  }

  // 2. Save to Firestore or queue
  try {
    if (!navigator.onLine) {
      throw new Error("Offline");
    }
    setSyncState({ state: 'syncing', errorMessage: null });
    const ref = doc(db, "schools", schoolId, "submissions", subId);
    await setDoc(ref, enhancedSub, { merge: true });
    setSyncState({ state: 'synced', errorMessage: null, lastSync: new Date().toISOString() });
  } catch (e: any) {
    const queue = getOfflineQueue();
    queue.push({ type: "assessment_submission", data: enhancedSub, timestamp: Date.now() });
    saveOfflineQueue(queue);
    setSyncState({
      state: !navigator.onLine ? 'offline' : 'error',
      errorMessage: !navigator.onLine ? null : (e?.code || e?.message || "Sync failed"),
    });
  }
}

export function subscribeAssessmentSubmissions(onUpdate: (subs: any[]) => void): () => void {
  const schoolId = getActiveSchoolId();

  // Load from localStorage first
  try {
    const existingStr = localStorage.getItem(ASSESSMENT_SUBMISSIONS_KEY);
    if (existingStr) {
      onUpdate(JSON.parse(existingStr));
    }
  } catch (e) {}

  try {
    const colRef = collection(db, "schools", schoolId, "submissions");
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const subs: any[] = [];
        snapshot.forEach((doc) => {
          subs.push(doc.data());
        });

        // Merge with any unsynced local queue items (offline entries)
        try {
          const queue = getOfflineQueue();
          const offlineSubs = queue
            .filter((item) => item.type === "assessment_submission")
            .map((item) => item.data);
          
          // Merge: offline entries take precedence (they're newer)
          const merged = [...subs];
          for (const offline of offlineSubs) {
            const idx = merged.findIndex((s) => s.id === offline.id || (s.learnerId === offline.learnerId && s.assessmentId === offline.assessmentId));
            if (idx >= 0) {
              merged[idx] = offline;
            } else {
              merged.push(offline);
            }
          }

          // Update localStorage cache with merged data
          localStorage.setItem(ASSESSMENT_SUBMISSIONS_KEY, JSON.stringify(merged));
          onUpdate(merged);
        } catch (e) {
          // Fallback to cloud-only
          localStorage.setItem(ASSESSMENT_SUBMISSIONS_KEY, JSON.stringify(subs));
          onUpdate(subs);
        }
      },
      (err: any) => {
        console.error("Firestore submissions snapshot error:", err);
        setSyncState({
          state: !navigator.onLine ? 'offline' : 'error',
          errorMessage: !navigator.onLine ? null : (err?.code || err?.message || "Snapshot error"),
        });
      }
    );
    return () => unsubscribe();
  } catch (e) {
    return () => {};
  }
}

// Learner Profiles sync
export async function saveLearnerProfile(learner: LearnerProfilePayload): Promise<void> {
  const schoolId = getActiveSchoolId();
  const learnerId = learner.id || learner.admissionNumber || `learner_${Date.now()}`;
  const enhancedLearner = {
    ...learner,
    id: learnerId,
    updatedAt: new Date().toISOString(),
  };

  // 1. Save to localStorage
  try {
    const existingStr = localStorage.getItem(LEARNER_PROFILES_KEY);
    let learners: any[] = [];
    if (existingStr) {
      try {
        learners = JSON.parse(existingStr);
      } catch (e) {}
    }
    const idx = learners.findIndex((l: any) => l.id === learnerId || l.admissionNumber === enhancedLearner.admissionNumber);
    if (idx >= 0) {
      learners[idx] = enhancedLearner;
    } else {
      learners.push(enhancedLearner);
    }
    localStorage.setItem(LEARNER_PROFILES_KEY, JSON.stringify(learners));
  } catch (e) {
    console.error("Error saving learner profile to localStorage:", e);
  }

  // 2. Save to Firestore or queue
  try {
    if (!navigator.onLine) {
      throw new Error("Offline");
    }
    setSyncState({ state: 'syncing', errorMessage: null });
    const ref = doc(db, "schools", schoolId, "learners", learnerId);
    await setDoc(ref, enhancedLearner, { merge: true });
    setSyncState({ state: 'synced', errorMessage: null, lastSync: new Date().toISOString() });
  } catch (e: any) {
    const queue = getOfflineQueue();
    queue.push({ type: "learner_profile", data: enhancedLearner, timestamp: Date.now() });
    saveOfflineQueue(queue);
    setSyncState({
      state: !navigator.onLine ? 'offline' : 'error',
      errorMessage: !navigator.onLine ? null : (e?.code || e?.message || "Sync failed"),
    });
  }
}

export function subscribeLearnerProfiles(onUpdate: (learners: any[]) => void): () => void {
  const schoolId = getActiveSchoolId();

  // Load from localStorage first
  try {
    const existingStr = localStorage.getItem(LEARNER_PROFILES_KEY);
    if (existingStr) {
      onUpdate(JSON.parse(existingStr));
    }
  } catch (e) {}

  try {
    const colRef = collection(db, "schools", schoolId, "learners");
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const learners: any[] = [];
        snapshot.forEach((doc) => {
          learners.push(doc.data());
        });

        // Merge with any unsynced local queue items (offline entries)
        try {
          const queue = getOfflineQueue();
          const offlineLearners = queue
            .filter((item) => item.type === "learner_profile")
            .map((item) => item.data);
          
          // Merge: offline entries take precedence (they're newer)
          const merged = [...learners];
          for (const offline of offlineLearners) {
            const idx = merged.findIndex((l) => l.id === offline.id || l.admissionNumber === offline.admissionNumber);
            if (idx >= 0) {
              merged[idx] = offline;
            } else {
              merged.push(offline);
            }
          }

          // Update localStorage cache with merged data
          localStorage.setItem(LEARNER_PROFILES_KEY, JSON.stringify(merged));
          onUpdate(merged);
        } catch (e) {
          // Fallback to cloud-only
          localStorage.setItem(LEARNER_PROFILES_KEY, JSON.stringify(learners));
          onUpdate(learners);
        }
      },
      (err: any) => {
        console.error("Firestore learners snapshot error:", err);
        setSyncState({
          state: !navigator.onLine ? 'offline' : 'error',
          errorMessage: !navigator.onLine ? null : (err?.code || err?.message || "Snapshot error"),
        });
      }
    );
    return () => unsubscribe();
  } catch (e) {
    return () => {};
  }
}

// Marks sync
export async function saveMarks(marks: MarksPayload): Promise<void> {
  const schoolId = getActiveSchoolId();
  const marksId = marks.id || `${marks.learnerId || marks.studentId || "std"}_${marks.examId || "exam"}_${Date.now()}`;
  const enhancedMarks = {
    ...marks,
    id: marksId,
    updatedAt: new Date().toISOString(),
  };

  // 1. Save to localStorage
  try {
    const existingStr = localStorage.getItem(MARKS_KEY);
    let marksList: any[] = [];
    if (existingStr) {
      try {
        marksList = JSON.parse(existingStr);
      } catch (e) {}
    }
    const idx = marksList.findIndex((m: any) => m.id === marksId || (m.learnerId === enhancedMarks.learnerId && m.examId === enhancedMarks.examId && m.subject === enhancedMarks.subject));
    if (idx >= 0) {
      marksList[idx] = enhancedMarks;
    } else {
      marksList.push(enhancedMarks);
    }
    localStorage.setItem(MARKS_KEY, JSON.stringify(marksList));
  } catch (e) {
    console.error("Error saving marks to localStorage:", e);
  }

  // 2. Save to Firestore or queue
  try {
    if (!navigator.onLine) {
      throw new Error("Offline");
    }
    setSyncState({ state: 'syncing', errorMessage: null });
    const ref = doc(db, "schools", schoolId, "marks", marksId);
    await setDoc(ref, enhancedMarks, { merge: true });
    setSyncState({ state: 'synced', errorMessage: null, lastSync: new Date().toISOString() });
  } catch (e: any) {
    const queue = getOfflineQueue();
    queue.push({ type: "marks", data: enhancedMarks, timestamp: Date.now() });
    saveOfflineQueue(queue);
    setSyncState({
      state: !navigator.onLine ? 'offline' : 'error',
      errorMessage: !navigator.onLine ? null : (e?.code || e?.message || "Sync failed"),
    });
  }
}

export function subscribeMarks(onUpdate: (marks: any[]) => void): () => void {
  const schoolId = getActiveSchoolId();

  // Load from localStorage first
  try {
    const existingStr = localStorage.getItem(MARKS_KEY);
    if (existingStr) {
      onUpdate(JSON.parse(existingStr));
    }
  } catch (e) {}

  try {
    const colRef = collection(db, "schools", schoolId, "marks");
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const marks: any[] = [];
        snapshot.forEach((doc) => {
          marks.push(doc.data());
        });

        // Merge with any unsynced local queue items (offline entries)
        try {
          const queue = getOfflineQueue();
          const offlineMarks = queue
            .filter((item) => item.type === "marks")
            .map((item) => item.data);
          
          // Merge: offline entries take precedence (they're newer)
          const merged = [...marks];
          for (const offline of offlineMarks) {
            const idx = merged.findIndex((m) => m.id === offline.id || (m.learnerId === offline.learnerId && m.examId === offline.examId && m.subject === offline.subject));
            if (idx >= 0) {
              merged[idx] = offline;
            } else {
              merged.push(offline);
            }
          }

          // Update localStorage cache with merged data
          localStorage.setItem(MARKS_KEY, JSON.stringify(merged));
          onUpdate(merged);
        } catch (e) {
          // Fallback to cloud-only
          localStorage.setItem(MARKS_KEY, JSON.stringify(marks));
          onUpdate(marks);
        }
      },
      (err: any) => {
        console.error("Firestore marks snapshot error:", err);
        setSyncState({
          state: !navigator.onLine ? 'offline' : 'error',
          errorMessage: !navigator.onLine ? null : (err?.code || err?.message || "Snapshot error"),
        });
      }
    );
    return () => unsubscribe();
  } catch (e) {
    return () => {};
  }
}

export async function pullOnceAttendanceAndSubmissions(date?: string): Promise<void> {
  await flushOfflineQueue();
  const schoolId = getActiveSchoolId();
  const targetDate = date || new Date().toISOString().split("T")[0];

  try {
    // Pull attendance for targetDate
    const attRef = doc(db, "schools", schoolId, "attendance", targetDate);
    const attSnap = await getDoc(attRef);
    if (attSnap.exists()) {
      const data = attSnap.data();
      if (data && data.records) {
        const allRollCallStr = localStorage.getItem(ROLL_CALL_KEY);
        const allRollCall = allRollCallStr ? JSON.parse(allRollCallStr) : {};
        allRollCall[targetDate] = data.records;
        localStorage.setItem(ROLL_CALL_KEY, JSON.stringify(allRollCall));
        if (data.locks) {
          localStorage.setItem(`submitted_${targetDate}`, JSON.stringify(data.locks));
        }
      }
    }

    // Pull all submissions
    const subColRef = collection(db, "schools", schoolId, "submissions");
    const subSnap = await getDocs(subColRef);
    const subs: any[] = [];
    subSnap.forEach((d) => subs.push(d.data()));
    if (subs.length > 0) {
      localStorage.setItem(ASSESSMENT_SUBMISSIONS_KEY, JSON.stringify(subs));
    }

    // Pull all learners
    const learnerColRef = collection(db, "schools", schoolId, "learners");
    const learnerSnap = await getDocs(learnerColRef);
    const learners: any[] = [];
    learnerSnap.forEach((d) => learners.push(d.data()));
    if (learners.length > 0) {
      localStorage.setItem(LEARNER_PROFILES_KEY, JSON.stringify(learners));
    }

    // Pull all marks
    const marksColRef = collection(db, "schools", schoolId, "marks");
    const marksSnap = await getDocs(marksColRef);
    const marks: any[] = [];
    marksSnap.forEach((d) => marks.push(d.data()));
    if (marks.length > 0) {
      localStorage.setItem(MARKS_KEY, JSON.stringify(marks));
    }

    // Pull quote / styling settings
    const quoteRef = doc(db, "schools", schoolId, "settings", "login_quote");
    const quoteSnap = await getDoc(quoteRef);
    if (quoteSnap.exists()) {
      const qData = quoteSnap.data();
      if (qData) {
        if (qData.quote) localStorage.setItem("munyaka_login_quote", qData.quote);
        if (qData.author) localStorage.setItem("munyaka_login_author", qData.author);
        if (qData.textTransform) localStorage.setItem("munyaka_login_quote_transform", qData.textTransform);
        if (qData.accentColor) localStorage.setItem("munyaka_login_quote_color", qData.accentColor);
        if (qData.theme) localStorage.setItem("munyaka_login_quote_theme", qData.theme);
      }
    }
  } catch (e) {
    console.error("Error pulling attendance, submissions, learners, marks & quote from Firestore:", e);
  }
}

// Quote & Styling sync
export interface QuoteSettingsPayload {
  quote?: string;
  author?: string;
  textTransform?: string;
  accentColor?: string;
  theme?: string;
  [key: string]: any;
}

export async function saveQuoteSettings(payload: QuoteSettingsPayload): Promise<void> {
  const schoolId = getActiveSchoolId();
 
  // Save to localStorage cache
  try {
    if (payload.quote !== undefined) localStorage.setItem("munyaka_login_quote", payload.quote);
    if (payload.author !== undefined) localStorage.setItem("munyaka_login_author", payload.author);
    if (payload.textTransform !== undefined) localStorage.setItem("munyaka_login_quote_transform", payload.textTransform);
    if (payload.accentColor !== undefined) localStorage.setItem("munyaka_login_quote_color", payload.accentColor);
    if (payload.theme !== undefined) localStorage.setItem("munyaka_login_quote_theme", payload.theme);
    localStorage.setItem("munyaka_login_quote_settings", JSON.stringify(payload));
  } catch (e) {}

  // Save to Firestore or queue
    try {
      if (!navigator.onLine) {
        throw new Error("Offline");
      }
      setSyncState({ state: 'syncing', errorMessage: null });
      const ref = doc(db, "schools", schoolId, "settings", "login_quote");
      await setDoc(ref, { ...payload, updatedAt: new Date().toISOString() }, { merge: true });
      setSyncState({ state: 'synced', errorMessage: null, lastSync: new Date().toISOString() });
    } catch (e: any) {
      const queue = getOfflineQueue();
      queue.push({ type: "quote_settings", data: payload, timestamp: Date.now() });
      saveOfflineQueue(queue);
      setSyncState({
        state: !navigator.onLine ? 'offline' : 'error',
        errorMessage: !navigator.onLine ? null : (e?.code || e?.message || "Sync failed"),
      });
    }
  }

export function subscribeQuoteSettings(onUpdate: (payload: QuoteSettingsPayload) => void): () => void {
  const schoolId = getActiveSchoolId();

  // Load from localStorage first
  try {
    const cached = {
      quote: localStorage.getItem("munyaka_login_quote"),
      author: localStorage.getItem("munyaka_login_author"),
      textTransform: localStorage.getItem("munyaka_login_quote_transform"),
      accentColor: localStorage.getItem("munyaka_login_quote_color"),
      theme: localStorage.getItem("munyaka_login_quote_theme"),
    };
    if (cached.quote || cached.author) {
      onUpdate(cached);
    }
  } catch (e) {}

  try {
    const ref = doc(db, "schools", schoolId, "settings", "login_quote");
    const unsubscribe = onSnapshot(
      ref,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data) {
            try {
              if (data.quote) localStorage.setItem("munyaka_login_quote", data.quote);
              if (data.author) localStorage.setItem("munyaka_login_author", data.author);
              if (data.textTransform) localStorage.setItem("munyaka_login_quote_transform", data.textTransform);
              if (data.accentColor) localStorage.setItem("munyaka_login_quote_color", data.accentColor);
              if (data.theme) localStorage.setItem("munyaka_login_quote_theme", data.theme);
              localStorage.setItem("munyaka_login_quote_settings", JSON.stringify(data));
            } catch (e) {}
            onUpdate(data);
          }
        }
      },
      (err: any) => {
        console.error("Firestore quote settings snapshot error:", err);
        setSyncState({
          state: !navigator.onLine ? 'offline' : 'error',
          errorMessage: !navigator.onLine ? null : (err?.code || err?.message || "Snapshot error"),
        });
      }
    );
    return () => unsubscribe();
  } catch (e) {
    return () => {};
  }
}

// Sync status helpers
export function getSyncQueueLength(): number {
  return getOfflineQueue().length;
}

export function isOnline(): boolean {
  return navigator.onLine;
}

// ── Sync State Manager ────────────────────────────────────────────────────────
// Exposes a reactive sync state (synced | syncing | offline | error) with
// error message and queued item count so any UI can surface sync status.

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error';

export interface SyncStatus {
  state: SyncState;
  queuedCount: number;
  errorMessage: string | null;
  lastSync: string | null;
}

const SYNC_STATE_KEY = 'munyaka_sync_state_v1';

let currentSyncState: SyncStatus = {
  state: 'synced',
  queuedCount: 0,
  errorMessage: null,
  lastSync: null,
};

const listeners: Array<(status: SyncStatus) => void> = [];

function persistState(status: SyncStatus) {
  try {
    localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(status));
  } catch (e) {
    // ignore
  }
}

function notifyListeners() {
  const snapshot = { ...currentSyncState };
  for (const listener of listeners) {
    try {
      listener(snapshot);
    } catch (e) {
      // ignore listener errors
    }
  }
}

export function setSyncState(partial: Partial<SyncStatus>) {
  currentSyncState = { ...currentSyncState, ...partial };
  currentSyncState.queuedCount = getOfflineQueue().length;
  persistState(currentSyncState);
  notifyListeners();
}

export function getSyncState(): SyncStatus {
  return { ...currentSyncState };
}

export function subscribeSyncState(listener: (status: SyncStatus) => void): () => void {
  listeners.push(listener);
  // Emit current state immediately
  try {
    listener({ ...currentSyncState });
  } catch (e) {
    // ignore
  }
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function initializeSyncState() {
  try {
    const stored = localStorage.getItem(SYNC_STATE_KEY);
    if (stored) {
      currentSyncState = JSON.parse(stored);
    }
  } catch (e) {
    // ignore
  }
  currentSyncState.queuedCount = getOfflineQueue().length;
  notifyListeners();

  // Listen for online/offline changes
  const handleOnline = () => {
    setSyncState({ state: 'synced', errorMessage: null });
  };
  const handleOffline = () => {
    setSyncState({ state: 'offline', errorMessage: null });
  };
  const handleQueueUpdated = () => {
    setSyncState({ queuedCount: getOfflineQueue().length });
  };
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  window.addEventListener('sync-queue-updated', handleQueueUpdated);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    window.removeEventListener('sync-queue-updated', handleQueueUpdated);
  };
}