import { useState, useEffect, useCallback } from 'react';

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
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
  { id: crypto.randomUUID(), startTime: '08:00', endTime: '08:30', isBreak: false },
  { id: crypto.randomUUID(), startTime: '08:30', endTime: '09:10', isBreak: false },
  { id: crypto.randomUUID(), startTime: '09:10', endTime: '09:50', isBreak: false },
  { id: crypto.randomUUID(), startTime: '09:50', endTime: '10:30', isBreak: false },
  { id: crypto.randomUUID(), startTime: '10:30', endTime: '11:00', isBreak: true },
  { id: crypto.randomUUID(), startTime: '11:00', endTime: '11:40', isBreak: false },
];

const getDefaultEntries = (timeSlots: TimeSlot[]): TimetableEntry[] => {
  return timeSlots.map(slot => {
    const entry: TimetableEntry = {};
    DAYS.forEach(day => {
      entry[day] = slot.isBreak ? { id: crypto.randomUUID(), subject: 'BREAK', color: 'bg-amber-50 text-amber-700 border border-amber-100' } : null;
    });
    return entry;
  });
};

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

  // Initialize on mount
  useEffect(() => {
    initializeGradeTimetable(selectedGrade);
  }, [selectedGrade, initializeGradeTimetable]);

  const currentTimetable = (() => {
    const raw = timetables[selectedGrade] || { timeSlots: getDefaultTimeSlots(), entries: getDefaultEntries(getDefaultTimeSlots()) };
    // Always sort slots + entries together by start time before exposing to consumers
    const paired = raw.timeSlots.map((s, i) => ({ slot: s, entry: raw.entries[i] ?? Object.fromEntries(DAYS.map(day => [day, null])) }));
    paired.sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime));
    return {
      timeSlots: paired.map(p => p.slot),
      entries: paired.map(p => p.entry),
    };
  })();
  const currentGrades = grades;

  // Time Slot Management
  const addTimeSlot = useCallback((startTime: string, endTime: string, isBreak: boolean = false) => {
    const newSlot: TimeSlot = {
      id: crypto.randomUUID(),
      startTime,
      endTime,
      isBreak,
    };
    const newEntry: TimetableEntry = Object.fromEntries(
      DAYS.map(day => [
        day,
        isBreak
          ? { id: crypto.randomUUID(), subject: 'BREAK', color: 'bg-amber-50 text-amber-700 border border-amber-100' }
          : null,
      ])
    );

    setTimetables(prev => {
      const current = prev[selectedGrade] || { timeSlots: getDefaultTimeSlots(), entries: getDefaultEntries(getDefaultTimeSlots()) };

      // Pair slots with their entries so sorting keeps them aligned
      const paired = current.timeSlots.map((s, i) => ({ slot: s, entry: current.entries[i] }));
      paired.push({ slot: newSlot, entry: newEntry });
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

  const updateTimeSlot = useCallback((slotId: string, startTime: string, endTime: string, isBreak: boolean) => {
    setTimetables(prev => {
      const current = prev[selectedGrade];
      if (!current) return prev;
      const result = sortAndApply(
        current.timeSlots,
        current.entries,
        s => s.id === slotId ? { ...s, startTime, endTime, isBreak } : s
      );
      // When isBreak changes, rebuild entry cells for that slot
      result.entries = result.timeSlots.map((slot, i) => {
        const original = current.entries[i];
        if (original && original.mon && (original.mon as LessonEntry).subject === 'BREAK') {
          if (!slot.isBreak) {
            return Object.fromEntries(DAYS.map(day => [day, null]));
          }
        }
        if (slot.isBreak) {
          return Object.fromEntries(DAYS.map(day => [day, { id: crypto.randomUUID(), subject: 'BREAK', color: 'bg-amber-50 text-amber-700 border border-amber-100' }]));
        }
        return original ?? Object.fromEntries(DAYS.map(day => [day, null]));
      });
      const updated = { ...prev, [selectedGrade]: result };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [selectedGrade]);

  // Sort slots + entries together by start time, then apply a mutation to the slots array
  const sortAndApply = (
    slots: TimeSlot[],
    entries: TimetableEntry[],
    apply: (s: TimeSlot) => TimeSlot
  ): { timeSlots: TimeSlot[]; entries: TimetableEntry[] } => {
    const updated = slots.map(s => apply(s));
    const paired = slots.map((s, i) => ({ slot: updated[i], entry: entries[i] }));
    paired.sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime));
    return {
      timeSlots: paired.map(p => p.slot),
      entries: paired.map(p => p.entry),
    };
  };

  // Update only the times of a slot — auto-sorts after applying
  const updateSlotTimes = useCallback((slotId: string, startTime: string, endTime: string) => {
    setTimetables(prev => {
      const current = prev[selectedGrade];
      if (!current) return prev;
      const result = sortAndApply(
        current.timeSlots,
        current.entries,
        s => s.id === slotId ? { ...s, startTime, endTime } : s
      );
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
