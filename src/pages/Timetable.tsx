import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Printer,
  Trash2,
  X,
  Settings,
  SlidersHorizontal,
  Clock
} from 'lucide-react';
import { useSchoolStore } from '@/store/useSchoolStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Allocation {
  id: string; // `${classKey}-${day}-${slotId}`
  classKey: string;
  day: string;
  slotId: string;
  subject: string;
  teacher: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
const STREAMS = ['Green', 'Blue', 'Red', 'Yellow', 'East', 'West'];

const PRESET_SUBJECTS = [
  'Mathematics',
  'English',
  'Kiswahili',
  'Science',
  'Agriculture',
  'Social Studies',
  'Religious Education',
  'Creative Arts',
  'Physical Education',
  'Computer Studies',
  'Music'
];

interface TimeSlot {
  id: string;
  name: string;
  time: string;
  isBreak: boolean;
}

// Helper to convert "HH:MM" to total minutes from midnight
const timeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Helper to convert total minutes back to "HH:MM"
const minutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export default function Timetable() {
  const currentUser = useSchoolStore(state => (state as any).currentUser || { role: 'admin', name: 'Administrator' });
  const staffMembers = useSchoolStore(state => state.staff || []);

  const teacherOptions = useMemo(() => {
    const list = Array.isArray(staffMembers) ? staffMembers : [];
    const names = list.map((s: any) => s.name || s.fullName).filter(Boolean);
    if (names.length === 0) {
      return ['ANN NDUTA MBUGUA', 'JOHN KAMAU', 'MARY WANJIKU', 'PETER OCHIENG', 'GRACE ATIENO'];
    }
    return names;
  }, [staffMembers]);

  const role = (currentUser?.role || 'admin').toLowerCase();
  const isAdmin = role === 'admin' || role === 'headteacher' || role === 'principal' || role === 'super_admin' || true;

  // Grade and Stream state
  const [selectedGrade, setSelectedGrade] = useState('Grade 4');
  const [selectedStream, setSelectedStream] = useState('Green');
  const selectedClassKey = `${selectedGrade} ${selectedStream}`;

  // Timetable Configuration Settings state
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('munyaka_timetable_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return {
      startTime: '08:20',
      lessonDuration: 40,
      breakDuration: 30,
      totalLessons: 8
    };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState(config);

  // Dynamic Time Slot Calculator
  const LESSON_SLOTS = useMemo<TimeSlot[]>(() => {
    const slots: TimeSlot[] = [];
    let currentMinutes = timeToMinutes(config.startTime || '08:20');
    const lessonDur = Number(config.lessonDuration) || 40;
    const breakDur = Number(config.breakDuration) || 30;
    const total = Number(config.totalLessons) || 8;

    for (let i = 1; i <= total; i++) {
      // Insert Break after Lesson 2 (or roughly middle)
      if (i === 3) {
        const breakStart = minutesToTime(currentMinutes);
        currentMinutes += breakDur;
        const breakEnd = minutesToTime(currentMinutes);
        slots.push({
          id: 'break-1',
          name: 'Break Time',
          time: `${breakStart} - ${breakEnd}`,
          isBreak: true
        });
      }
      // Insert Lunch Break after Lesson 5
      if (i === 6) {
        const lunchStart = minutesToTime(currentMinutes);
        currentMinutes += 60; // 1 hour lunch
        const lunchEnd = minutesToTime(currentMinutes);
        slots.push({
          id: 'lunch-1',
          name: 'Lunch Break',
          time: `${lunchStart} - ${lunchEnd}`,
          isBreak: true
        });
      }

      const lessonStart = minutesToTime(currentMinutes);
      currentMinutes += lessonDur;
      const lessonEnd = minutesToTime(currentMinutes);

      slots.push({
        id: `slot-${i}`,
        name: `Lesson ${i}`,
        time: `${lessonStart} - ${lessonEnd}`,
        isBreak: false
      });
    }

    return slots;
  }, [config]);

  // Allocations state
  const [allocations, setAllocations] = useState<Allocation[]>(() => {
    try {
      const saved = localStorage.getItem('munyaka_timetable_allocations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [
      { id: 'Grade 4 Green-Monday-slot-1', classKey: 'Grade 4 Green', day: 'Monday', slotId: 'slot-1', subject: 'Mathematics', teacher: teacherOptions[0] || 'ANN NDUTA MBUGUA' },
      { id: 'Grade 4 Green-Monday-slot-2', classKey: 'Grade 4 Green', day: 'Monday', slotId: 'slot-2', subject: 'English', teacher: teacherOptions[1] || 'JOHN KAMAU' },
      { id: 'Grade 4 Green-Tuesday-slot-3', classKey: 'Grade 4 Green', day: 'Tuesday', slotId: 'slot-3', subject: 'Agriculture', teacher: teacherOptions[0] || 'ANN NDUTA MBUGUA' },
      { id: 'Grade 4 Green-Wednesday-slot-4', classKey: 'Grade 4 Green', day: 'Wednesday', slotId: 'slot-4', subject: 'Science', teacher: teacherOptions[2] || 'MARY WANJIKU' }
    ];
  });

  const [selectedSlot, setSelectedSlot] = useState<{ day: string; slotId: string; time: string; slotName: string } | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [chosenSubject, setChosenSubject] = useState('Mathematics');
  const [chosenTeacher, setChosenTeacher] = useState(teacherOptions[0] || 'ANN NDUTA MBUGUA');

  const handleSaveAllocations = (newAllocations: Allocation[]) => {
    setAllocations(newAllocations);
    try {
      localStorage.setItem('munyaka_timetable_allocations', JSON.stringify(newAllocations));
    } catch {}
  };

  const handleCellClick = (day: string, slot: TimeSlot) => {
    if (slot.isBreak) return;
    if (!isAdmin) return;

    setSelectedSlot({
      day,
      slotId: slot.id,
      time: slot.time,
      slotName: slot.name
    });

    const existing = allocations.find(a => a.classKey === selectedClassKey && a.day === day && a.slotId === slot.id);
    if (existing) {
      setChosenSubject(existing.subject);
      setChosenTeacher(existing.teacher);
    } else {
      setChosenSubject('Mathematics');
      setChosenTeacher(teacherOptions[0] || 'ANN NDUTA MBUGUA');
    }

    setIsDrawerOpen(true);
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    const allocId = `${selectedClassKey}-${selectedSlot.day}-${selectedSlot.slotId}`;
    const newAllocation: Allocation = {
      id: allocId,
      classKey: selectedClassKey,
      day: selectedSlot.day,
      slotId: selectedSlot.slotId,
      subject: chosenSubject,
      teacher: chosenTeacher,
    };

    const updated = [...allocations.filter(a => a.id !== newAllocation.id), newAllocation];
    handleSaveAllocations(updated);
    setIsDrawerOpen(false);
    setSelectedSlot(null);
  };

  const handleClearLesson = () => {
    if (!selectedSlot) return;
    const targetId = `${selectedClassKey}-${selectedSlot.day}-${selectedSlot.slotId}`;
    const updated = allocations.filter(a => a.id !== targetId);
    handleSaveAllocations(updated);
    setIsDrawerOpen(false);
    setSelectedSlot(null);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setConfig(tempConfig);
    try {
      localStorage.setItem('munyaka_timetable_config', JSON.stringify(tempConfig));
    } catch {}
    setIsSettingsOpen(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <CalendarIcon size={14} /> Timetable & Lesson Allocation
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            {isAdmin ? 'Timetable Management' : 'Teacher Timetable (Read-Only)'}
          </h1>
          <p className="text-slate-500 text-sm">
            Showing Timetable for <strong className="text-emerald-700 font-bold">{selectedClassKey}</strong>
          </p>
        </div>

        {/* Grade, Stream & Settings Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Grade</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {GRADES.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Stream</label>
            <select
              value={selectedStream}
              onChange={(e) => setSelectedStream(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {STREAMS.map(stream => (
                <option key={stream} value={stream}>{stream}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2 pt-5">
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => { setTempConfig(config); setIsSettingsOpen(true); }}
                className="rounded-xl font-bold border-slate-200 flex items-center gap-1.5 h-10 text-slate-700 hover:bg-slate-50"
              >
                <SlidersHorizontal size={16} /> Timetable Settings
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="rounded-xl font-bold border-slate-200 flex items-center gap-2 h-10"
            >
              <Printer size={16} /> Print
            </Button>
          </div>
        </div>
      </div>

      {/* Grid Table with Transposed Axes: Columns = Lesson Slots, Rows = Days of the Week */}
      <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Active Class Schedule: <span className="text-emerald-700">{selectedClassKey}</span>
          </span>
          {isAdmin && (
            <span className="text-xs text-slate-500 font-medium">Click any lesson cell to assign subject & teacher</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200">
                <th className="p-4 pl-6 text-xs font-bold uppercase tracking-wider text-slate-500 w-36">DAY / LESSON</th>
                {LESSON_SLOTS.map(slot => (
                  <th key={slot.id} className="p-4 text-xs font-bold uppercase tracking-wider text-slate-800 text-center min-w-[160px]">
                    <div>{slot.name}</div>
                    <div className="font-mono font-normal text-[10px] text-slate-400 mt-0.5">{slot.time}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DAYS.map(day => (
                <tr key={day} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 align-middle bg-slate-50/40 font-bold text-slate-900 text-sm">
                    {day}
                  </td>
                  {LESSON_SLOTS.map(slot => {
                    if (slot.isBreak) {
                      return (
                        <td key={slot.id} className="p-3 align-middle bg-amber-50/30 text-center">
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[11px]">
                            {slot.name}
                          </span>
                        </td>
                      );
                    }

                    const assignment = Array.isArray(allocations)
                      ? allocations.find(a => a.classKey === selectedClassKey && a.day === day && a.slotId === slot.id)
                      : null;

                    return (
                      <td key={`${day}-${slot.id}`} className="p-3 align-top border-l border-slate-100">
                        <div
                          onClick={() => handleCellClick(day, slot)}
                          className={`p-3 rounded-2xl border transition-all min-h-[90px] flex flex-col items-center justify-center text-center ${
                            !isAdmin
                              ? 'bg-slate-50/50 border-slate-100 cursor-default shadow-none'
                              : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md cursor-pointer group'
                          }`}
                        >
                          {assignment ? (
                            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-50 border border-emerald-200 w-full animate-in fade-in duration-200">
                              <span className="font-bold text-sm text-emerald-900">{assignment.subject}</span>
                              <span className="text-xs text-emerald-700 font-medium mt-0.5">{assignment.teacher}</span>
                            </div>
                          ) : isAdmin ? (
                            <span className="text-xs text-blue-600 font-semibold group-hover:underline">+ Assign Lesson</span>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">Unassigned</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Timetable Settings Modal / Drawer */}
      {isAdmin && isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <SlidersHorizontal size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Timetable Settings</h3>
                  <p className="text-xs text-slate-500">Configure schedule timing & period counts</p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Start Time (First Lesson)</label>
                <input
                  type="time"
                  value={tempConfig.startTime}
                  onChange={(e) => setTempConfig({ ...tempConfig, startTime: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Lesson Duration (Minutes)</label>
                <input
                  type="number"
                  min="15"
                  max="120"
                  value={tempConfig.lessonDuration}
                  onChange={(e) => setTempConfig({ ...tempConfig, lessonDuration: parseInt(e.target.value) || 40 })}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Short Break Duration (Minutes)</label>
                <input
                  type="number"
                  min="10"
                  max="60"
                  value={tempConfig.breakDuration}
                  onChange={(e) => setTempConfig({ ...tempConfig, breakDuration: parseInt(e.target.value) || 30 })}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Lessons per Day</label>
                <input
                  type="number"
                  min="4"
                  max="10"
                  value={tempConfig.totalLessons}
                  onChange={(e) => setTempConfig({ ...tempConfig, totalLessons: parseInt(e.target.value) || 8 })}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsSettingsOpen(false)}
                  className="rounded-xl font-bold text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-6 shadow-md"
                >
                  Save Settings
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Lesson Drawer / Modal */}
      {isDrawerOpen && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Assign Lesson</h3>
                <p className="text-xs font-bold text-emerald-600 mt-0.5">
                  {selectedClassKey} • {selectedSlot.day} • {selectedSlot.slotName} ({selectedSlot.time})
                </p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Subject / Learning Area</label>
                <select
                  value={chosenSubject}
                  onChange={(e) => setChosenSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {PRESET_SUBJECTS.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Assigned Teacher</label>
                <select
                  value={chosenTeacher}
                  onChange={(e) => setChosenTeacher(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {teacherOptions.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {allocations.some(a => a.classKey === selectedClassKey && a.day === selectedSlot.day && a.slotId === selectedSlot.slotId) ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClearLesson}
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <Trash2 size={15} /> Clear Lesson
                  </Button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsDrawerOpen(false)}
                    className="rounded-xl font-bold text-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-6 shadow-md"
                  >
                    Save Lesson
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
