/**
 * Shared grades & streams configuration reader.
 *
 * Reads the authoritative grades/streams data written by the Grades & Streams
 * setter module (GradesStreams.tsx → localStorage key `'munyaka_grades'`).
 * All pages that need live grade/stream options should import from here instead
 * of reading from static mock-data files.
 */

export interface GradesStreamsConfig {
  grades: string[];
  streams: string[];
  /** Maps a normalised grade key (e.g. "grade4", "pp1") → list of stream names */
  gradeStreamMap: Record<string, string[]>;
}

// Supported localStorage keys (checked in priority order).
// `configured_streams` is the canonical name across the project; the
// historical `munyaka_*` keys are still read so user data isn't lost when
// the key naming is unified.
const STORAGE_KEYS = [
  'configured_streams',
  'munyaka_grades',
  'munyaka_grades_streams',
  'munyaka_grades_streams_data',
  'gradeStreamSettings',
  'school_grades_streams_data',
];

function normaliseGradeName(name: string): string {
  if (!name) return '';
  const t = String(name || '').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : '';
}

function normaliseStreamName(name: string): string {
  if (!name) return '';
  const t = String(name || '').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : '';
}

function getGradeMatchKey(name: string): string {
  if (!name) return '';
  const t = String(name || '').trim().toLowerCase();
  if (t === 'pp1' || t === 'pp2') return t;
  const m = t.match(/(\d+)/);
  if (m) return `grade${m[1]}`;
  return t.replace(/\s+/g, '');
}

import { sortGradesAscending } from "../utils/gradeSort";

function sortCaseInsensitive(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });
}

/** Read the current grades/streams configuration from localStorage. */
export function readGradesAndStreams(): GradesStreamsConfig {
  try {
    let raw: any = null;
    for (const key of STORAGE_KEYS) {
      const val = localStorage.getItem(key);
      if (val) {
        const parsed = JSON.parse(val);
        if (parsed) {
          raw = parsed;
          break;
        }
      }
    }

    const gradesSet = new Set<string>();
    const gradeStreamMap: Record<string, string[]> = {};

    if (Array.isArray(raw)) {
      raw.forEach((item: any) => {
        if (!item || typeof item !== 'object') return;
        const rawName = item.name || item.grade || item.label;
        if (!rawName) return;

        const normalisedGrade = normaliseGradeName(String(rawName));
        const matchKey = getGradeMatchKey(normalisedGrade);
        gradesSet.add(normalisedGrade);

        const rawStreams: any[] = item.streams || item.classes || [];
        const perGradeStreams: string[] = [];
        rawStreams.forEach((s: any) => {
          const sName = typeof s === 'string' ? s : (s?.name ?? s?.label);
          if (sName) {
            const n = normaliseStreamName(String(sName));
            if (n) perGradeStreams.push(n);
          }
        });

        if (perGradeStreams.length > 0) {
          gradeStreamMap[matchKey] = perGradeStreams;
        }
      });
    }

    // Build the global unique streams list from gradeStreamMap
    const streamsSet = new Set<string>();
    Object.values(gradeStreamMap).forEach((s) => s.forEach((st) => streamsSet.add(st)));

    return {
      grades: sortGradesAscending(Array.from(gradesSet)),
      streams: Array.from(streamsSet).sort(sortCaseInsensitive),
      gradeStreamMap,
    };
  } catch {
    return { grades: [], streams: [], gradeStreamMap: {} };
  }
}

/**
 * Get the list of streams available for a given grade key.
 * Returns an empty array if the grade is not found.
 */
export function getStreamsForGrade(gradeName: string, config: GradesStreamsConfig): string[] {
  const key = getGradeMatchKey(gradeName);
  return (config.gradeStreamMap[key] ?? []).slice().sort(sortCaseInsensitive);
}
