/**
 * Utility functions for resolving a teacher's assigned grades and streams
 * from their teaching_load data stored in staff records.
 */

export interface TeachingLoadEntry {
  subject: string;
  grade: string;
  stream: string;
}

// Keys used by the staff/staff profile module for persisting teaching assignments
const STAFF_STORAGE_KEYS = [
  'munyaka_staff_directory',
  'munyaka_staff_prereg',
  'teachers',
  'staff',
  'staff_list',
  'staffDirectory',
  'staffList',
];

/**
 * Extract unique grade+stream pairs from a teacher's teaching_load array.
 * Normalises the stream name to title case (e.g., "BLUE" → "Blue")
 * so it can be matched against the GradesStreamsConfig stream values.
 */
const normalizeStreamName = (name: string): string => {
  if (!name) return '';
  const trimmed = String(name || '').trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

const normalizeGradeName = (name: string): string => {
  if (!name) return '';
  const trimmed = String(name || '').trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

/**
 * Read the teaching_load array for the currently logged-in user from
 * localStorage. Returns an empty array if the user is not a teacher
 * or has no teaching load configured.
 */
export const getTeacherTeachingLoad = (
  userId?: string,
  userEmail?: string
): TeachingLoadEntry[] => {
  if (!userId && !userEmail) return [];

  for (const key of STAFF_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : [];
      const found = arr.find((m: any) => {
        if (!m) return false;
        if (userId && m.id === userId) return true;
        if (userEmail) {
                  const email = (m.email || '').trim().toLowerCase();
                  if (email === String(userEmail || '').trim().toLowerCase()) return true;
                }
        return false;
      });
      if (found?.teaching_load && Array.isArray(found.teaching_load)) {
        return found.teaching_load as TeachingLoadEntry[];
      }
    } catch {
      continue;
    }
  }
  return [];
};

/**
 * Derive the list of grades a teacher is allowed to register learners into
 * based on their teaching load. Returns an empty array if the user is not
 * restricted (i.e., is an admin or has no teaching load).
 */
export const getTeacherAllowedGrades = (
  userId?: string,
  userEmail?: string,
  isAdmin?: boolean
): string[] => {
  if (isAdmin) return []; // Admins are not restricted
  const load = getTeacherTeachingLoad(userId, userEmail);
  if (load.length === 0) return []; // No load = no restriction
  const grades = Array.from(
    new Set(load.map(e => normalizeGradeName(e.grade)).filter(Boolean))
  );
  return grades;
};

/**
 * Derive the list of streams a teacher is allowed to register learners into
 * for a specific grade, based on their teaching load. Returns an empty array
 * if the user is not restricted.
 */
export const getTeacherAllowedStreamsForGrade = (
  grade: string,
  userId?: string,
  userEmail?: string,
  isAdmin?: boolean
): string[] => {
  if (isAdmin) return []; // Admins are not restricted
  const load = getTeacherTeachingLoad(userId, userEmail);
  if (load.length === 0) return []; // No load = no restriction

  const normGrade = normalizeGradeName(grade);
  const filtered = load.filter(e => normalizeGradeName(e.grade) === normGrade);
  const streams = Array.from(
    new Set(filtered.map(e => normalizeStreamName(e.stream)).filter(Boolean))
  );
  return streams;
};

/**
 * Check whether a given user has a restricted teaching load
 * (i.e., is a teacher with at least one grade/stream assignment).
 */
export const isTeacherWithRestrictedLoad = (
  userId?: string,
  userEmail?: string,
  isAdmin?: boolean
): boolean => {
  if (isAdmin) return false;
  const load = getTeacherTeachingLoad(userId, userEmail);
  return load.length > 0;
};
