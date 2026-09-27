import { useState, useMemo, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  Printer,
  Trash2,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { useSchoolStore } from '@/store/useSchoolStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DEFAULT_CBC_CLUSTERS } from '@/data/initialSeedData';

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

interface TimeSlot {
  id: string;
  name: string;
  time: string;
  isBreak: boolean;
  breakType?: 'assembly' | 'tea' | 'lunch' | 'afternoon_break' | 'games';
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

  // Dynamic Learning Areas from LocalStorage / Learning Area Manager store with window storage event listening
  const [learningAreaClusters, setLearningAreaClusters] = useState(() => {
    try {
      const saved = localStorage.getItem('munyaka_cbc_learning_area_clusters');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_CBC_CLUSTERS;
  });

  // Listen for storage or custom events when learning areas are updated in Learning Areas manager
  useMemo(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('munyaka_cbc_learning_area_clusters');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLearningAreaClusters(parsed);
          }
        }
      } catch {}
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('learning_areas_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('learning_areas_updated', handleStorageChange);
    };
  }, []);

  // Map Grade to exact CBC Level ID
  const activeClusterId = useMemo(() => {
    const g = selectedGrade.toLowerCase().trim();
    if (g.includes('pp1') || g.includes('pp2') || g.includes('pre-primary') || g.includes('playgroup')) {
      return 'pre-primary';
    }
    if (g.includes('grade 1') || g.includes('grade 2') || g.includes('grade 3')) {
      return 'lower-primary';
    }
    if (g.includes('grade 4') || g.includes('grade 5') || g.includes('grade 6')) {
      return 'upper-primary';
    }
    if (g.includes('grade 7') || g.includes('grade 8') || g.includes('grade 9')) {
      return 'junior-school';
    }
    return 'upper-primary';
  }, [selectedGrade]);

  const availableSubjectsForGrade = useMemo(() => {
    const cluster = learningAreaClusters.find((c: any) => c.id === activeClusterId);
    if (cluster && Array.isArray(cluster.learningAreas) && cluster.learningAreas.length > 0) {
      return cluster.learningAreas.map((la: any) => la.name);
    }
    // Fallbacks per level if empty
    if (activeClusterId === 'pre-primary') {
      return ['Language Activities', 'Mathematical Activities', 'Environmental Activities', 'Psychomotor & Creative Activities', 'Religious Education Activities'];
    }
    if (activeClusterId === 'lower-primary') {
      return ['English Language Activities', 'Kiswahili Language Activities', 'Mathematical Activities', 'Environmental Activities', 'Hygiene and Nutrition', 'Religious Education'];
    }
    if (activeClusterId === 'junior-school') {
      return ['English', 'Kiswahili', 'Mathematics', 'Integrated Science', 'Social Studies', 'Agriculture', 'Pre-Technical Studies', 'Religious Education', 'Creative Arts and Sports'];
    }
    return ['English', 'Kiswahili', 'Mathematics', 'Science and Technology', 'Agriculture and Nutrition', 'Social Studies', 'Religious Education', 'Creative Arts', 'Physical Education'];
  }, [learningAreaClusters, activeClusterId]);

  // Timetable Configuration Settings state with TWO distinct short breaks
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('munyaka_timetable_config_dual_breaks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return {
      startTime: '08:00',
      assemblyDuration: 20,
      lessonDuration: 40,
      totalLessons: 8,
      // First Short Break (Morning Tea)
      teaDuration: 30,
      teaAfterLesson: 2,
      // Lunch Break
      lunchDuration: 60,
      lunchAfterLesson: 5,
      // Second Short Break (Afternoon Break)
      secondBreakDuration: 20,
      secondBreakAfterLesson: 7,
      // Games / Co-Curricular
      gamesDuration: 40
    };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState(config);

  // Dynamic Full Schedule Sequence Generator with TWO short breaks + Lunch + Assembly + Games
  const LESSON_SLOTS = useMemo<TimeSlot[]>(() => {
    const slots: TimeSlot[] = [];
    let currentMinutes = timeToMinutes(config.startTime || '08:00');

    const assemblyDur = Number(config.assemblyDuration) || 20;
    const lessonDur = Number(config.lessonDuration) || 40;
    const totalLessons = Number(config.totalLessons) || 8;

    const teaDur = Number(config.teaDuration) || 30;
    const teaAfter = Number(config.teaAfterLesson) || 2;

    const lunchDur = Number(config.lunchDuration) || 60;
    const lunchAfter = Number(config.lunchAfterLesson) || 5;

    const secondBreakDur = Number(config.secondBreakDuration) || 20;
    const secondBreakAfter = Number(config.secondBreakAfterLesson) || 7;

    const gamesDur = Number(config.gamesDuration) || 40;

    // 1. Morning Assembly / Registration
    if (assemblyDur > 0) {
      const asmStart = minutesToTime(currentMinutes);
      currentMinutes += assemblyDur;
      const asmEnd = minutesToTime(currentMinutes);
      slots.push({
        id: 'assembly',
        name: 'Assembly & Registration',
        time: `${asmStart} - ${asmEnd}`,
        isBreak: true,
        breakType: 'assembly'
      });
    }

    // 2. Sequential lesson building with accurate insertion of First Break, Lunch, and Second Break
    for (let lessonIndex = 1; lessonIndex <= totalLessons; lessonIndex++) {
      // First Tea Break insertion
      if (teaDur > 0 && lessonIndex === teaAfter + 1) {
        const teaStart = minutesToTime(currentMinutes);
        currentMinutes += teaDur;
        const teaEnd = minutesToTime(currentMinutes);
        slots.push({
          id: 'tea-break',
          name: 'Tea Break',
          time: `${teaStart} - ${teaEnd}`,
          isBreak: true,
          breakType: 'tea'
        });
      }

      // Lunch Break insertion
      if (lunchDur > 0 && lessonIndex === lunchAfter + 1) {
        const lunchStart = minutesToTime(currentMinutes);
        currentMinutes += lunchDur;
        const lunchEnd = minutesToTime(currentMinutes);
        slots.push({
          id: 'lunch-break',
          name: 'Lunch Break',
          time: `${lunchStart} - ${lunchEnd}`,
          isBreak: true,
          breakType: 'lunch'
        });
      }

      // Second Short Break insertion
      if (secondBreakDur > 0 && lessonIndex === secondBreakAfter + 1) {
        const sbStart = minutesToTime(currentMinutes);
        currentMinutes += secondBreakDur;
        const sbEnd = minutesToTime(currentMinutes);
        slots.push({
          id: 'afternoon-break',
          name: 'Afternoon Break',
          time: `${sbStart} - ${sbEnd}`,
          isBreak: true,
          breakType: 'afternoon_break'
        });
      }

      // Teaching Lesson period
      const lStart = minutesToTime(currentMinutes);
      currentMinutes += lessonDur;
      const lEnd = minutesToTime(currentMinutes);

      slots.push({
        id: `slot-${lessonIndex}`,
        name: `Lesson ${lessonIndex}`,
        time: `${lStart} - ${lEnd}`,
        isBreak: false
      });
    }

    // 3. Games / Co-Curricular Period at day end
    if (gamesDur > 0) {
      const gamesStart = minutesToTime(currentMinutes);
      currentMinutes += gamesDur;
      const gamesEnd = minutesToTime(currentMinutes);
      slots.push({
        id: 'games',
        name: 'Games & Co-Curricular',
        time: `${gamesStart} - ${gamesEnd}`,
        isBreak: true,
        breakType: 'games'
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

  const topScrollRef = useRef<HTMLDivElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const handleTopScroll = () => {
    if (gridScrollRef.current && topScrollRef.current) {
      gridScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleGridScroll = () => {
    if (topScrollRef.current && gridScrollRef.current) {
      topScrollRef.current.scrollLeft = gridScrollRef.current.scrollLeft;
    }
  };

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
      setChosenSubject(availableSubjectsForGrade[0] || 'Mathematics');
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
      localStorage.setItem('munyaka_timetable_config_dual_breaks', JSON.stringify(tempConfig));
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

      {/* Grid Table with Columns = Lesson Slots & Events, Rows = Days */}
      <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Active Class Schedule: <span className="text-emerald-700">{selectedClassKey}</span>
          </span>
          {isAdmin && (
            <span className="text-xs text-slate-500 font-medium">Click any lesson cell to assign subject & teacher</span>
          )}
        </div>

        {/* Synchronized Top Horizontal Scroll Track */}
        <div
          ref={topScrollRef}
          onScroll={handleTopScroll}
          className="overflow-x-auto overflow-y-hidden mb-1 bg-slate-100/90 border-b border-slate-200 py-2 px-4"
        >
          <div style={{ width: tableRef.current ? `${tableRef.current.scrollWidth}px` : '1200px', height: '1px' }} />
        </div>

        <div
          ref={gridScrollRef}
          onScroll={handleGridScroll}
          className="overflow-x-auto"
        >
          <table ref={tableRef} className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200">
                <th className="p-4 pl-6 text-xs font-bold uppercase tracking-wider text-slate-500 w-36">DAY / EVENT</th>
                {LESSON_SLOTS.map(slot => {
                  const isSpecial = slot.isBreak;
                  return (
                    <th
                      key={slot.id}
                      className={`p-4 text-xs font-bold uppercase tracking-wider text-center min-w-[150px] ${
                        isSpecial ? 'bg-amber-50/70 text-amber-900 border-x border-amber-200/50' : 'text-slate-800'
                      }`}
                    >
                      <div>{slot.name}</div>
                      <div className={`font-mono font-normal text-[10px] mt-0.5 ${isSpecial ? 'text-amber-700 font-medium' : 'text-slate-400'}`}>
                        {slot.time}
                      </div>
                    </th>
                  );
                })}
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
                      let badgeColor = 'bg-amber-50 border-amber-200 text-amber-800';
                      if (slot.breakType === 'assembly') badgeColor = 'bg-blue-50 border-blue-200 text-blue-800';
                      if (slot.breakType === 'lunch') badgeColor = 'bg-orange-50 border-orange-200 text-orange-800';
                      if (slot.breakType === 'afternoon_break') badgeColor = 'bg-amber-100 border-amber-300 text-amber-900';
                      if (slot.breakType === 'games') badgeColor = 'bg-indigo-50 border-indigo-200 text-indigo-800';

                      return (
                        <td key={slot.id} className="p-2 align-middle bg-slate-50/30 text-center">
                          <span className={`inline-flex px-2 py-1 rounded-lg border font-bold text-[10px] tracking-wide shadow-2xs ${badgeColor}`}>
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
      </div>
      </Card>

      {/* Advanced Timetable Settings Modal with Dual Short Breaks */}
      {isAdmin && isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <SlidersHorizontal size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Advanced Timetable Settings</h3>
                  <p className="text-xs text-slate-500">Configure schedule intervals & dual short breaks</p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">School Start Time</label>
                  <input
                    type="time"
                    value={tempConfig.startTime}
                    onChange={(e) => setTempConfig({ ...tempConfig, startTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Assembly Duration (Mins)</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={tempConfig.assemblyDuration}
                    onChange={(e) => setTempConfig({ ...tempConfig, assemblyDuration: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Lesson Duration (Mins)</label>
                  <input
                    type="number"
                    min="15"
                    max="90"
                    value={tempConfig.lessonDuration}
                    onChange={(e) => setTempConfig({ ...tempConfig, lessonDuration: parseInt(e.target.value) || 40 })}
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Lessons / Day</label>
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
              </div>

              {/* 1st Short Break (Tea Break) */}
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">1. First Short Break (Tea Break)</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Duration (Mins)</label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={tempConfig.teaDuration}
                      onChange={(e) => setTempConfig({ ...tempConfig, teaDuration: parseInt(e.target.value) || 30 })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">After Lesson #</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={tempConfig.teaAfterLesson}
                      onChange={(e) => setTempConfig({ ...tempConfig, teaAfterLesson: parseInt(e.target.value) || 2 })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Lunch Break */}
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">2. Lunch Break</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Duration (Mins)</label>
                    <input
                      type="number"
                      min="20"
                      max="120"
                      value={tempConfig.lunchDuration}
                      onChange={(e) => setTempConfig({ ...tempConfig, lunchDuration: parseInt(e.target.value) || 60 })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">After Lesson #</label>
                    <input
                      type="number"
                      min="3"
                      max="8"
                      value={tempConfig.lunchAfterLesson}
                      onChange={(e) => setTempConfig({ ...tempConfig, lunchAfterLesson: parseInt(e.target.value) || 5 })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 2nd Short Break (Afternoon Break) */}
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">3. Second Short Break (Afternoon Break)</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Duration (Mins)</label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={tempConfig.secondBreakDuration}
                      onChange={(e) => setTempConfig({ ...tempConfig, secondBreakDuration: parseInt(e.target.value) || 20 })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">After Lesson #</label>
                    <input
                      type="number"
                      min="4"
                      max="9"
                      value={tempConfig.secondBreakAfterLesson}
                      onChange={(e) => setTempConfig({ ...tempConfig, secondBreakAfterLesson: parseInt(e.target.value) || 7 })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Games / Co-Curricular */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Games / Co-Curricular Duration (Mins)</label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={tempConfig.gamesDuration}
                  onChange={(e) => setTempConfig({ ...tempConfig, gamesDuration: parseInt(e.target.value) || 40 })}
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
                  {availableSubjectsForGrade.map(sub => (
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
