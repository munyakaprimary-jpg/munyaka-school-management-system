import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Printer,
  Download,
  ChevronDown,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useTimetable, LessonEntry } from '@/hooks/useTimetable';
import { useAuth } from '@/context/AuthContext';
import { isTeacherRole } from '@/utils/roleHelper';
import TimeSlotModal from '@/components/timetable/TimeSlotModal';
import LessonDrawer from '@/components/timetable/LessonDrawer';
import InlineTimeCell from '@/components/timetable/InlineTimeCell';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSchoolStore } from '@/store/useSchoolStore';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

const PRESET_SUBJECTS = [
  { name: 'Mathematics', color: 'bg-indigo-100 text-indigo-700 border border-indigo-200' },
  { name: 'English', color: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  { name: 'Kiswahili', color: 'bg-rose-100 text-rose-700 border border-rose-200' },
  { name: 'Science', color: 'bg-cyan-100 text-cyan-700 border border-cyan-200' },
  { name: 'Social Studies', color: 'bg-amber-100 text-amber-700 border border-amber-200' },
  { name: 'Religious Education', color: 'bg-violet-100 text-violet-700 border border-violet-200' },
  { name: 'Physical Education', color: 'bg-orange-100 text-orange-700 border border-orange-200' },
  { name: 'Creative Arts', color: 'bg-pink-100 text-pink-700 border border-pink-200' },
  { name: 'Music', color: 'bg-teal-100 text-teal-700 border border-teal-200' },
  { name: 'Library', color: 'bg-sky-100 text-sky-700 border border-sky-200' },
  { name: 'Computer Studies', color: 'bg-indigo-100 text-indigo-700 border border-indigo-200' },
  { name: 'Agriculture', color: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
];

const Timetable = () => {
  const { user } = useAuth();
  const currentUser = useSchoolStore(state => (state as any).currentUser || user);
  const userRole = (currentUser?.role || user?.role || '').toLowerCase();
  const isAdmin = userRole.includes('admin') || userRole.includes('head') || userRole.includes('super') || userRole.includes('principal');
  const isTeacher = userRole.includes('teacher') && !isAdmin;

  const [viewMode, setViewMode] = useState<'class' | 'my'>('class');

  const {
    selectedGrade,
    setSelectedGrade,
    grades,
    timeSlots,
    entries,
    updateEntry,
    addTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    resetTimetable,
  } = useTimetable();

  // Get staff/teachers from store for teacher name resolution
  const staff = useSchoolStore(state => state.staff);

  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [selectedCell, setSelectedCell] = useState<{ day: string; slotId: string } | null>(null);

  const handleCellClick = (day: string, slotId: string) => {
    if (!isAdmin) return; // Strict read-only for non-admins
    setSelectedCell({ day, slotId });
  };

  const currentSlotIndex = selectedCell ? timeSlots.findIndex(s => s.id === selectedCell.slotId) : -1;
  const currentEntry = (selectedCell && currentSlotIndex !== -1 && entries[currentSlotIndex]
    ? (entries[currentSlotIndex][selectedCell.day] || null)
    : null) as LessonEntry | null;

  // Parse selectedGrade to extract grade and stream
  // e.g., "Grade 4 Green" -> grade: "Grade 4", stream: "Green"
  const { grade: selectedGradeName, stream: selectedStream } = useMemo(() => {
    const parts = selectedGrade.split(' ');
    if (parts.length >= 2 && parts[0] === 'Grade') {
      // Format: "Grade X StreamName"
      const gradeNum = parts[1];
      const streamName = parts.slice(2).join(' ');
      return { grade: `Grade ${gradeNum}`, stream: streamName };
    }
    // Fallback: try to split on last space
    const lastSpace = selectedGrade.lastIndexOf(' ');
    if (lastSpace > 0) {
      return { grade: selectedGrade.substring(0, lastSpace), stream: selectedGrade.substring(lastSpace + 1) };
    }
    return { grade: selectedGrade, stream: '' };
  }, [selectedGrade]);

  // Helper to resolve teacher name from teacherId, staffId, or teacher
  const resolveTeacherName = (teacherId?: string, staffId?: string, teacherName?: string): string => {
    if (teacherName && teacherName.trim()) return teacherName;
    const lookupId = teacherId || staffId;
    if (!lookupId) return 'No Teacher';
    const teacher = staff.find((s: any) => String(s.id) === String(lookupId));
    return teacher?.name || teacher?.fullName || 'No Teacher';
  };

  // Helper to resolve subject name
  const resolveSubjectName = (subject?: string): string => {
    if (!subject || subject === 'normal') return '';
    const subjectsList = (useSchoolStore as any).getState?.()?.subjects || PRESET_SUBJECTS;
    const matched = subjectsList.find((p: any) => String(p.id) === String(subject) || String(p.name).toLowerCase() === String(subject).toLowerCase());
    if (matched) return matched.name || matched.title || subject;
    const preset = PRESET_SUBJECTS.find(p => p.name === subject);
    if (preset) return preset.name;
    return subject;
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <CalendarIcon size={14} /> School Timetable & Schedule
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            {isTeacher ? 'My Class Timetable' : 'School Timetable Management'}
          </h1>
          <p className="text-slate-500 text-sm">
            {isTeacher
              ? `Read-only weekly timetable schedule for ${selectedGrade}.`
              : 'Configure time slots, assign learning areas, and manage weekly class schedules.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isTeacher && (
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('class')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'class' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Class Schedule
              </button>
              <button
                onClick={() => setViewMode('my')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'my' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                My Schedule
              </button>
            </div>
          )}

          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-[220px] rounded-xl font-bold border-slate-200">
              <SelectValue placeholder="Select Grade / Stream" />
            </SelectTrigger>
            <SelectContent>
              {grades.map(g => (
                <SelectItem key={g.id} value={g.id} className="font-medium">
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isAdmin && (
            <Button
              onClick={() => { setEditingSlot(null); setIsSlotModalOpen(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2"
            >
              <Plus size={16} /> Manage Slots
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => window.print()}
            className="rounded-xl font-bold border-slate-200 flex items-center gap-2"
          >
            <Printer size={16} /> Print Timetable
          </Button>
        </div>
      </div>

      {/* Timetable Grid View (Days horizontally, Time slots vertically) */}
      <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 pl-6 text-xs font-bold uppercase tracking-wider text-slate-500 w-36">Day / Lesson</th>
                {timeSlots.map((slot, index) => {
                  const isCategorySlot = slot.category && slot.category !== 'normal';
                  return (
                    <th key={slot.id} className="p-4 text-xs font-bold uppercase tracking-wider text-slate-700 text-center min-w-[160px]">
                      <div>{isCategorySlot ? ((slot as any).label || slot.category.toUpperCase()) : `Lesson ${index + 1}`}</div>
                      <div className="font-mono font-normal text-[10px] text-slate-400 mt-0.5">{slot.startTime} - {slot.endTime}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DAYS.map((day, dayIndex) => {
                const dayKey = DAY_KEYS[dayIndex];
                return (
                  <tr key={day} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 align-middle bg-slate-50/50 font-bold text-slate-900 text-sm">
                      {day}
                    </td>
                    {timeSlots.map((slot, slotIndex) => {
                      const isCategorySlot = slot.category && slot.category !== 'normal';
                      if (isCategorySlot) {
                        return (
                          <td key={slot.id} className="p-3 align-middle bg-amber-50/30 text-center">
                            <span className="inline-flex px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs">
                              {(slot as any).label || slot.category.toUpperCase()}
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td key={slot.id} className="p-3 align-top border-l border-slate-100">
                          <div
                            onClick={() => isAdmin && handleCellClick(day, slot.id)}
                            className={`p-3 rounded-2xl border transition-all min-h-[90px] flex flex-col justify-center ${
                              !isAdmin
                                ? 'bg-slate-50/60 border-slate-100 cursor-default shadow-none'
                                : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer'
                            }`}
                          >
                            {(() => {
                              const entry = (entries[slotIndex]?.[dayKey] || null) as (LessonEntry & { subjectName?: string; teacherName?: string; teacherId?: string; staffId?: string; teacher?: string; title?: string; room?: string }) | null;
                              const rawSubject = entry?.subject || entry?.subjectName || entry?.title || '';
                              const displaySubject = rawSubject && rawSubject !== 'normal' ? resolveSubjectName(rawSubject) : '';
                              const rawTeacher = entry?.teacherName || entry?.teacher || resolveTeacherName(entry?.teacherId, entry?.staffId, entry?.teacherName);
                              const displayTeacher = rawTeacher && rawTeacher !== 'No Teacher' ? rawTeacher : '';

                              if (displaySubject) {
                                return (
                                  <div className="p-1">
                                    <div className="font-bold text-sm text-gray-900">{displaySubject}</div>
                                    <div className="text-xs text-gray-600">{displayTeacher || 'No Teacher'}</div>
                                    {entry?.room && (
                                      <div className="text-[9px] text-slate-400 font-mono mt-1">Room: {entry.room}</div>
                                    )}
                                  </div>
                                );
                              }
                              return <span className="text-xs text-gray-400 font-medium">{!isAdmin ? '—' : '+ Assign Lesson'}</span>;
                            })()}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Lesson Drawer / Modal for admins */}
      {isAdmin && selectedCell && (
        <LessonDrawer
          open={Boolean(selectedCell)}
          onClose={() => setSelectedCell(null)}
          day={selectedCell.day}
          slotIndex={timeSlots.findIndex(s => s.id === selectedCell.slotId)}
          timeLabel={timeSlots.find(s => s.id === selectedCell.slotId)?.startTime ? `${timeSlots.find(s => s.id === selectedCell.slotId)?.startTime} - ${timeSlots.find(s => s.id === selectedCell.slotId)?.endTime}` : ''}
          currentEntry={currentEntry}
          onSave={(subject, color, teacherId, teacherName) => {
            if (selectedCell) {
              const matchedStaff = staff.find((s: any) => String(s.id) === String(teacherId));
              const resolvedTeacher = teacherName || matchedStaff?.name || matchedStaff?.fullName || '';
              updateEntry(selectedCell.day, selectedCell.slotId, {
                subject,
                color,
                teacherId,
                teacherName: resolvedTeacher,
              });
              setSelectedCell(null);
            }
          }}
          onDelete={() => {
            if (selectedCell) {
              updateEntry(selectedCell.day, selectedCell.slotId, { subject: '' });
              setSelectedCell(null);
            }
          }}
        />
      )}

      {/* Time Slot Modal for admins */}
      {isAdmin && isSlotModalOpen && (
        <TimeSlotModal
          open={isSlotModalOpen}
          onClose={() => setIsSlotModalOpen(false)}
          timeSlots={timeSlots}
          onAdd={(startTime, endTime, category) => addTimeSlot(startTime, endTime, category || 'normal')}
          onUpdate={(slotId, startTime, endTime, category) => updateTimeSlot(slotId, startTime, endTime, category || 'normal')}
          onDelete={deleteTimeSlot}
        />
      )}
    </div>
  );
};

export default Timetable;