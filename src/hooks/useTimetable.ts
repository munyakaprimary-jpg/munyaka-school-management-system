import { useState, useEffect, useCallback } from 'react';
import { readGradesAndStreams } from '@/services/gradesStreamsConfig';
import { CentralDataService } from '@/services/centralDataService';

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  category: string | null; // null = regular period; string = special category name
}

export interface LessonEntry {
  id: string;
  subject: string;
  color: string;
  teacherId?: string;
  teacherName?: string;
}

export interface TimetableEntry {
  [day: string]: LessonEntry | null;
}

export interface GradeTimetable {
  gradeId: string;
  gradeName: string;
  timeSlots: TimeSlot[];
  entries: TimetableEntry[];
}

export const SLOT_CATEGORIES = [
  { value: 'none', label: 'Regular Period' },
  { value: 'Break', label: 'Break' },
  { value: 'Lunch Break', label: 'Lunch Break' },
  { value: 'Games / PE', label: 'Games / PE' },
  { value: 'Assembly', label: 'Assembly' },
  { value: 'Pastoral / Clubs', label: 'Pastoral / Clubs' },
  { value: 'custom', label: 'Custom…' },
] as const;

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Break':              { bg: 'bg-amber-50',    text: 'text-amber-700', border: 'border-amber-200' },
  'Lunch Break':       { bg: 'bg-orange-50',   text: 'text-orange-700', border: 'border-orange-200' },
  'Games / PE':        { bg: 'bg-green-50',    text: 'text-green-700', border: 'border-green-200' },
  'Assembly':          { bg: 'bg-purple-50',   text: 'text-purple-700', border: 'border-purple-200' },
  'Pastoral / Clubs':  { bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-200' },
};

const getCategoryColor = (category: string | null): { bg: string; text: string; border: string } => {
  if (!category) return { bg: 'bg-slate-100', text: 'text-slate-400', border: 'border-slate-200' };
  return CATEGORY_COLORS[category] ?? { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' };
};

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
const STORAGE_KEY = 'school-timetable-data';
const EXPORT_STORAGE_KEY = 'munyaka_timetable';

export interface TeachingStaffMember {
  id: string;
  name: string;
}

const TEACHING_SYSTEM_ROLES = new Set([
  'head_teacher', 'deputy_head_teacher', 'senior_teacher', 'class_teacher', 'subject_teacher', 'ict_teacher',
]);
const TEACHER_ROLE_KEYWORDS = /(teacher|head teacher|principal)/i;
const NON_TEACHING_ROLE_KEYWORDS = /(bursar|librarian|storekeeper|lab assistant|support staff|ict technician|admin)/i;

const isTeachingStaffRecord = (record: any): boolean => {
  if (!record) return false;
  if (record.isTeacher === true) return true;
  const systemRole = (record.systemRole || '').toLowerCase().trim();
  if (TEACHING_SYSTEM_ROLES.has(systemRole)) return true;
  const role = (record.role || '').toUpperCase().trim();
  if (NON_TEACHING_ROLE_KEYWORDS.test(record.role || '')) return false;
  if (TEACHER_ROLE_KEYWORDS.test(record.role || '')) return true;
  return false;
};

export const getTeachingStaffFromLocalStorage = (): TeachingStaffMember[] => {
  try {
    const raw = CentralDataService.getData<any[]>('munyaka_staff', []);
    if (Array.isArray(raw) && raw.length > 0) {
      const filtered = raw.filter(isTeachingStaffRecord).filter((s: any) => s.id && s.name);
      if (filtered.length > 0) {
        return filtered.map((s: any) => ({ id: String(s.id), name: String(s.name) }));
      }
    }
    const ls = window.localStorage;
    if (!ls) return [];
    const keys = ['munyaka_staff', 'munyaka_staff_directory', 'munyaka_master_staff_list'];
    for (const key of keys) {
      const raw = ls.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter(isTeachingStaffRecord).filter((s: any) => s.id && s.name);
          if (filtered.length > 0) {
            return filtered.map((s: any) => ({ id: String(s.id), name: String(s.name) }));
          }
        }
      }
    }
    return [];
  } catch {
    return [];
  }
};

const persistTimetable = (updated: Record<string, { timeSlots: TimeSlot[]; entries: TimetableEntry[] }>) => {
  try {
    CentralDataService.setData(STORAGE_KEY, updated);
    CentralDataService.setData(EXPORT_STORAGE_KEY, updated);
    const json = JSON.stringify(updated);
    const ls = window.localStorage;
    ls?.setItem(STORAGE_KEY, json);
    ls?.setItem(EXPORT_STORAGE_KEY, json);
  } catch (err) {
    console.error('[useTimetable] Failed to persist timetable:', err);
  }
};

const SUBJECT_COLORS = [
  'bg-indigo-100 text-indigo-700 border border-indigo-200',
  'bg-emerald-100 text-emerald-700 border border-emerald-200',
  'bg-amber-100 text-amber-700 border border-amber-200',
  'bg-rose-100 text-rose-700 border border-rose-200',
  'bg-cyan-100 text-cyan-700 border border-cyan-200',
  'bg-violet-100 text-violet-700 border border-violet-200',
  'bg-pink-100 text-pink-700 border border-pink-200',
  'bg-teal-100 text-teal-700 border border-teal-200',
  'bg-orange-100 text-orange-700 border border-orange-200',
  'bg-sky-100 text-sky-700 border border-sky-200',
];

const getDefaultTimeSlots = (): TimeSlot[] => [
  { id: crypto.randomUUID(), startTime: '08:00', endTime: '08:30', category: null },
  { id: crypto.randomUUID(), startTime: '08:30', endTime: '09:10', category: null },
  { id: crypto.randomUUID(), startTime: '09:10', endTime: '09:50', category: null },
  { id: crypto.randomUUID(), startTime: '09:50', endTime: '10:30', category: null },
  { id: crypto.randomUUID(), startTime: '10:30', endTime: '11:00', category: 'Break' },
  { id: crypto.randomUUID(), startTime: '11:00', endTime: '11:40', category: null },
  { id: crypto.randomUUID(), startTime: '12:00', endTime: '13:00', category: 'Lunch Break' },
];

const makeEntryForSlot = (slot: TimeSlot): TimetableEntry => {
  const color = getCategoryColor(slot.category);
  return Object.fromEntries(
    DAYS.map(day => [
      day,
      slot.category
        ? { id: crypto.randomUUID(), subject: slot.category, color: `${color.bg} ${color.text} border ${color.border}` }
        : null,
    ])
  );
};

const getDefaultEntries = (timeSlots: TimeSlot[]): TimetableEntry[] =>
  timeSlots.map(makeEntryForSlot);

export function useTimetable() {
  const config = readGradesAndStreams();
  const configGrades = config.grades;
  const configStreamsMap = config.gradeStreamMap;

  // Generate grades list dynamically from Grades & Streams menu
  const grades = (() => {
    const list: { id: string; name: string }[] = [];
    configGrades.forEach(g => {
      const matchKey = g.toLowerCase().replace(/[^a-z0-9]/g, '');
      const streamsForGrade = configStreamsMap[matchKey] || [];
      if (streamsForGrade.length > 0) {
        streamsForGrade.forEach(s => {
          const name = `${g} - ${s}`;
          const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
          list.push({ id, name });
        });
      } else {
        const id = g.toLowerCase().replace(/[^a-z0-9]/g, '-');
        list.push({ id, name: g });
      }
    });
    if (list.length === 0) {
      return [
        { id: 'grade-4-blue', name: 'Grade 4 - Blue' },
        { id: 'grade-5-blue', name: 'Grade 5 - Blue' },
      ];
    }
    return list;
  })();

  const [selectedGrade, setSelectedGrade] = useState<string>(() => grades[0]?.id || 'grade-4-blue');

  // Ensure selectedGrade is valid when grades change
  useEffect(() => {
    if (!grades.some(g => g.id === selectedGrade) && grades.length > 0) {
      setSelectedGrade(grades[0].id);
    }
  }, [grades, selectedGrade]);

  const [timetables, setTimetables] = useState<Record<string, { timeSlots: TimeSlot[]; entries: TimetableEntry[] }>>(() => {
    try {
      const central = CentralDataService.getData<Record<string, { timeSlots: TimeSlot[]; entries: TimetableEntry[] }>>(STORAGE_KEY, {});
      if (central && Object.keys(central).length > 0) return central;
      const centralExport = CentralDataService.getData<Record<string, { timeSlots: TimeSlot[]; entries: TimetableEntry[] }>>(EXPORT_STORAGE_KEY, {});
      if (centralExport && Object.keys(centralExport).length > 0) return centralExport;

      const ls = window.localStorage;
      const stored = ls?.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          CentralDataService.setData(STORAGE_KEY, parsed);
          CentralDataService.setData(EXPORT_STORAGE_KEY, parsed);
          return parsed;
        }
      }
    } catch { /* ignore corrupt data */ }
    return {};
  });

  // Initialize default timetable for a grade if it doesn't exist
  const initializeGradeTimetable = useCallback((gradeId: string) => {
    if (!timetables[gradeId]) {
      const timeSlots = getDefaultTimeSlots();
      const entries = getDefaultEntries(timeSlots);
      setTimetables(prev => {
        const updated = { ...prev, [gradeId]: { timeSlots, entries } };
        persistTimetable(updated);
        return updated;
      });
    }
  }, [timetables]);

  useEffect(() => {
    initializeGradeTimetable(selectedGrade);
  }, [selectedGrade, initializeGradeTimetable]);

  const currentTimetable = (() => {
    const raw = timetables[selectedGrade] || { timeSlots: getDefaultTimeSlots(), entries: getDefaultEntries(getDefaultTimeSlots()) };
    const paired = raw.timeSlots.map((s, i) => ({
      slot: s,
      entry: raw.entries[i] ?? Object.fromEntries(DAYS.map(day => [day, null])),
    }));
    paired.sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime));
    return {
      timeSlots: paired.map(p => p.slot),
      entries: paired.map(p => p.entry),
    };
  })();
  const currentGrades = grades;

  // Sort slots + entries together by start time, then apply a mutation to the slots array
  const sortAndApply = (
    slots: TimeSlot[],
    entries: TimetableEntry[],
    apply: (s: TimeSlot) => TimeSlot
  ): { timeSlots: TimeSlot[]; entries: TimetableEntry[] } => {
    const updated = slots.map(s => apply(s));
    const paired = slots.map((s, i) => ({ slot: updated[i], entry: entries[i] ?? Object.fromEntries(DAYS.map(day => [day, null])) }));
    paired.sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime));
    return {
      timeSlots: paired.map(p => p.slot),
      entries: paired.map(p => p.entry),
    };
  };

  // Time Slot Management
  const addTimeSlot = useCallback((startTime: string, endTime: string, category: string | null = null) => {
    const newSlot: TimeSlot = { id: crypto.randomUUID(), startTime, endTime, category };

    setTimetables(prev => {
      const current = prev[selectedGrade] || { timeSlots: getDefaultTimeSlots(), entries: getDefaultEntries(getDefaultTimeSlots()) };
      const paired = current.timeSlots.map((s, i) => ({ slot: s, entry: current.entries[i] }));
      paired.push({ slot: newSlot, entry: makeEntryForSlot(newSlot) });
      paired.sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime));
      const updatedTimetable = {
        timeSlots: paired.map(p => p.slot),
        entries: paired.map(p => p.entry),
      };
      const updated = { ...prev, [selectedGrade]: updatedTimetable };
      persistTimetable(updated);
      return updated;
    });
  }, [selectedGrade]);

  const updateTimeSlot = useCallback((slotId: string, startTime: string, endTime: string, category: string | null) => {
    setTimetables(prev => {
      const current = prev[selectedGrade];
      if (!current) return prev;
      const result = sortAndApply(
        current.timeSlots,
        current.entries,
        s => s.id === slotId ? { ...s, startTime, endTime, category } : s
      );
      // Rebuild entries for the slot(s) that changed category
      result.entries = result.timeSlots.map((slot, i) => {
        const original = current.entries[i] ?? Object.fromEntries(DAYS.map(day => [day, null]));
        if (slot.category !== current.timeSlots[i]?.category) {
          return makeEntryForSlot(slot);
        }
        return original;
      });
      const updated = { ...prev, [selectedGrade]: result };
      persistTimetable(updated);
      return updated;
    });
  }, [selectedGrade]);

  const updateSlotTimes = useCallback((slotId: string, startTime: string, endTime: string, category?: string | null) => {
    setTimetables(prev => {
      const current = prev[selectedGrade];
      if (!current) return prev;
      const result = sortAndApply(
        current.timeSlots,
        current.entries,
        s => s.id === slotId ? { ...s, startTime, endTime, category: category !== undefined ? category : s.category } : s
      );
      // If the category changed for this slot, rebuild the entry row
      result.entries = result.timeSlots.map((slot, i) => {
        const original = current.entries[i] ?? Object.fromEntries(DAYS.map(day => [day, null]));
        const wasCategory = !!current.timeSlots[i]?.category;
        const isCategory = !!slot.category;
        if (wasCategory !== isCategory || current.timeSlots[i]?.category !== slot.category) {
          return makeEntryForSlot(slot);
        }
        return original;
      });
      const updated = { ...prev, [selectedGrade]: result };
      persistTimetable(updated);
      return updated;
    });
  }, [selectedGrade]);

  const deleteTimeSlot = useCallback((slotId: string) => {
    setTimetables(prev => {
      const current = prev[selectedGrade];
      if (!current) return prev;
      const slotIndex = current.timeSlots.findIndex(s => s.id === slotId);
      if (slotIndex === -1) return prev;
      const updated = {
        ...prev,
        [selectedGrade]: {
          timeSlots: current.timeSlots.filter(s => s.id !== slotId),
          entries: current.entries.filter((_, i) => i !== slotIndex),
        },
      };
      persistTimetable(updated);
      return updated;
    });
  }, [selectedGrade]);

  // Lesson Management
  const setLesson = useCallback((slotIndex: number, day: string, subject: string, colorClass?: string, teacherId?: string, teacherName?: string) => {
      setTimetables(prev => {
        const current = prev[selectedGrade];
        if (!current) return prev;
        const color = colorClass || SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)];
        const newEntry: LessonEntry = { id: crypto.randomUUID(), subject, color, ...(teacherId ? { teacherId } : {}), ...(teacherName ? { teacherName } : {}) };
        const updatedEntries = current.entries.map((entry, idx) => {
          if (idx === slotIndex) {
            return { ...entry, [day]: subject === '' ? null : newEntry };
          }
          return entry;
        });
        const updated = { ...prev, [selectedGrade]: { ...current, entries: updatedEntries } };
        persistTimetable(updated);
        return updated;
      });
    }, [selectedGrade]);

  const deleteLesson = useCallback((slotIndex: number, day: string) => {
    setLesson(slotIndex, day, '');
  }, [setLesson]);

  // Grade Management
  const addGrade = useCallback((id: string, name: string) => {
    // Handled in Grades & Streams menu
  }, []);

  const deleteGrade = useCallback((gradeId: string) => {
    // Handled in Grades & Streams menu
  }, []);

  return {
    grades: currentGrades,
    selectedGrade,
    setSelectedGrade,
    timeSlots: currentTimetable.timeSlots,
    entries: currentTimetable.entries,
    updateEntry: (day: string, slotId: string, updates: { subject: string; color?: string; teacherId?: string; teacherName?: string }) => {
      setTimetables(prev => {
        const current = prev[selectedGrade];
        if (!current) return prev;
        const slotIdx = current.timeSlots.findIndex(s => s.id === slotId);
        if (slotIdx === -1) return prev;
        const color = updates.color || SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)];
        const newEntry: LessonEntry | null = updates.subject ? {
          id: crypto.randomUUID(),
          subject: updates.subject,
          color,
          teacherId: updates.teacherId,
          teacherName: updates.teacherName,
        } : null;

        const updatedEntries = current.entries.map((entry, idx) => {
          if (idx === slotIdx) {
            return { ...entry, [day]: newEntry };
          }
          return entry;
        });
        const updated = { ...prev, [selectedGrade]: { ...current, entries: updatedEntries } };
        persistTimetable(updated);
        return updated;
      });
    },
    resetTimetable: () => {
      setTimetables(prev => {
        const updated = {
          ...prev,
          [selectedGrade]: {
            timeSlots: getDefaultTimeSlots(),
            entries: getDefaultEntries(getDefaultTimeSlots()),
          },
        };
        persistTimetable(updated);
        return updated;
      });
    },
    addTimeSlot,
    updateTimeSlot,
    updateSlotTimes,
    deleteTimeSlot,
    setLesson,
    deleteLesson,
    addGrade,
    deleteGrade,
    DAYS,
    SUBJECT_COLORS,
  };
}
