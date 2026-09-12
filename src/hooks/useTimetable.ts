import { useState, useEffect, useCallback } from 'react';

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
const GRADES_KEY = 'school-timetable-grades';

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

const DEFAULT_GRADES = [
  { id: 'grade4', name: 'Grade 4 - Blue' },
  { id: 'grade5', name: 'Grade 5 - Green' },
  { id: 'grade6', name: 'Grade 6 - Alpha' },
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
  const [grades, setGrades] = useState<{ id: string; name: string }[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_GRADES;
    const stored = localStorage.getItem(GRADES_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(GRADES_KEY, JSON.stringify(DEFAULT_GRADES));
    return DEFAULT_GRADES;
  });

  const [selectedGrade, setSelectedGrade] = useState<string>(() => {
    if (typeof window === 'undefined') return 'grade4';
    const stored = localStorage.getItem(GRADES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed[0]?.id || 'grade4';
    }
    return 'grade4';
  });

  const [timetables, setTimetables] = useState<Record<string, { timeSlots: TimeSlot[]; entries: TimetableEntry[] }>>(() => {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    return {};
  });

  // Initialize default timetable for a grade if it doesn't exist
  const initializeGradeTimetable = useCallback((gradeId: string) => {
    if (!timetables[gradeId]) {
      const timeSlots = getDefaultTimeSlots();
      const entries = getDefaultEntries(timeSlots);
      setTimetables(prev => {
        const updated = { ...prev, [gradeId]: { timeSlots, entries } };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [selectedGrade]);

  // Lesson Management
  const setLesson = useCallback((slotIndex: number, day: string, subject: string, colorClass?: string) => {
    setTimetables(prev => {
      const current = prev[selectedGrade];
      if (!current) return prev;
      const color = colorClass || SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)];
      const newEntry: LessonEntry = { id: crypto.randomUUID(), subject, color };
      const updatedEntries = current.entries.map((entry, idx) => {
        if (idx === slotIndex) {
          return { ...entry, [day]: subject === '' ? null : newEntry };
        }
        return entry;
      });
      const updated = { ...prev, [selectedGrade]: { ...current, entries: updatedEntries } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [selectedGrade]);

  const deleteLesson = useCallback((slotIndex: number, day: string) => {
    setLesson(slotIndex, day, '');
  }, [setLesson]);

  // Grade Management
  const addGrade = useCallback((id: string, name: string) => {
    const newGrade = { id, name };
    setGrades(prev => {
      const updated = [...prev, newGrade];
      localStorage.setItem(GRADES_KEY, JSON.stringify(updated));
      return updated;
    });
    initializeGradeTimetable(id);
  }, [initializeGradeTimetable]);

  const deleteGrade = useCallback((gradeId: string) => {
    setGrades(prev => {
      const updated = prev.filter(g => g.id !== gradeId);
      localStorage.setItem(GRADES_KEY, JSON.stringify(updated));
      return updated;
    });
    setTimetables(prev => {
      const updated = { ...prev };
      delete updated[gradeId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    if (selectedGrade === gradeId && grades.length > 1) {
      setSelectedGrade(grades.find(g => g.id !== gradeId)?.id || 'grade4');
    }
  }, [selectedGrade, grades]);

  return {
    grades: currentGrades,
    selectedGrade,
    setSelectedGrade,
    timeSlots: currentTimetable.timeSlots,
    entries: currentTimetable.entries,
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
