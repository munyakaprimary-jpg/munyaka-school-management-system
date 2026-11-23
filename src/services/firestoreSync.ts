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
  if (!navigator.onLine) return;
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  const remaining: any[] = [];
  const schoolId = getActiveSchoolId();

  for (const item of queue) {
    try {
      if (item.type === "attendance") {
        const ref = doc(db, "schools", schoolId, "attendance", item.date);
        await setDoc(ref, item.data, { merge: true });
      } else if (item.type === "assessment_submission") {
        const subId = item.data.id || `${item.data.learnerId || item.data.studentId || "std"}_${Date.now()}`;
        const ref = doc(db, "schools", schoolId, "submissions", subId);
        await setDoc(ref, item.data, { merge: true });
      }
    } catch (e) {
      console.error("Failed to flush queue item:", e);
      remaining.push(item);
    }
  }

  saveOfflineQueue(remaining);
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
    const ref = doc(db, "schools", schoolId, "attendance", date);
    await setDoc(ref, payload, { merge: true });
  } catch (e) {
    const queue = getOfflineQueue();
    queue.push({ type: "attendance", date, data: payload, timestamp: Date.now() });
    saveOfflineQueue(queue);
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
      (err) => {
        console.error("Firestore attendance snapshot error:", err);
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
    const ref = doc(db, "schools", schoolId, "submissions", subId);
    await setDoc(ref, enhancedSub, { merge: true });
  } catch (e) {
    const queue = getOfflineQueue();
    queue.push({ type: "assessment_submission", data: enhancedSub, timestamp: Date.now() });
    saveOfflineQueue(queue);
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

        // Update localStorage cache
        try {
          localStorage.setItem(ASSESSMENT_SUBMISSIONS_KEY, JSON.stringify(subs));
        } catch (e) {}

        onUpdate(subs);
      },
      (err) => {
        console.error("Firestore submissions snapshot error:", err);
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
  } catch (e) {
    console.error("Error pulling attendance & submissions from Firestore:", e);
  }
}
