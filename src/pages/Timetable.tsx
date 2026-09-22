import { useState } from 'react';
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
import { useTimetable } from '@/hooks/useTimetable';
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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const Timetable = () => {
  const { user } = useAuth();
  const userRole = user?.role || '';
  const isTeacher = isTeacherRole(userRole, user?.staffCategory, user?.specialties) || 
    String(userRole).toLowerCase().includes('teacher') || String(userRole).toLowerCase().includes('class_teacher');

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

  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [selectedCell, setSelectedCell] = useState<{ day: string; slotId: string } | null>(null);

  const handleCellClick = (day: string, slotId: string) => {
    if (isTeacher) return; // Strict read-only for teachers
    setSelectedCell({ day, slotId });
  };

  const currentEntry = selectedCell
    ? entries.find(e => e.day === selectedCell.day && e.slotId === selectedCell.slotId)
    : null;

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
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-[180px] rounded-xl font-bold border-slate-200">
              <SelectValue placeholder="Select Grade" />
            </SelectTrigger>
            <SelectContent>
              {grades.map(g => (
                <SelectItem key={g.id} value={g.name} className="font-medium">
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!isTeacher && (
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

      {/* Timetable Grid View */}
      <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 pl-6 text-xs font-bold uppercase tracking-wider text-slate-500 w-36">Time / Day</th>
                {DAYS.map(day => (
                  <th key={day} className="p-4 text-xs font-bold uppercase tracking-wider text-slate-700 text-center">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timeSlots.map(slot => {
                const isCategorySlot = slot.category && slot.category !== 'normal';
                if (isCategorySlot) {
                  return (
                    <tr key={slot.id} className="bg-slate-50/80">
                      <td className="p-4 pl-6 font-mono text-xs text-slate-500">
                        {slot.startTime} - {slot.endTime}
                      </td>
                      <td colSpan={DAYS.length} className="p-4 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs">
                          <Clock size={14} /> {slot.label || slot.category.toUpperCase()} ({slot.startTime} - {slot.endTime})
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={slot.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 align-top">
                      <div className="font-bold text-slate-800 text-sm">{slot.label || 'Lesson'}</div>
                      <div className="font-mono text-xs text-slate-400 mt-0.5">{slot.startTime} - {slot.endTime}</div>
                    </td>
                    {DAYS.map(day => {
                      const entry = entries.find(e => e.day === day && e.slotId === slot.id);
                      return (
                        <td key={day} className="p-3 align-top border-l border-slate-100">
                          <div
                            onClick={() => handleCellClick(day, slot.id)}
                            className={`p-3 rounded-2xl border transition-all ${
                              isTeacher 
                                ? 'bg-slate-50/60 border-slate-100 cursor-default shadow-none' 
                                : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer'
                            }`}
                          >
                            {entry?.subject ? (
                              <div className="space-y-1">
                                <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                                  <span>{entry.subject}</span>
                                  {!isTeacher && <Badge className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0">Active</Badge>}
                                </div>
                                {entry.teacher && (
                                  <div className="text-xs text-slate-500 font-medium">{entry.teacher}</div>
                                )}
                                {entry.room && (
                                  <div className="text-[10px] text-slate-400 font-mono">Room: {entry.room}</div>
                                )}
                              </div>
                            ) : (
                              <div className="py-2 text-center text-slate-300 text-xs font-medium">
                                {isTeacher ? '—' : '+ Assign Lesson'}
                              </div>
                            )}
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
      {!isTeacher && selectedCell && (
        <LessonDrawer
          isOpen={Boolean(selectedCell)}
          onClose={() => setSelectedCell(null)}
          day={selectedCell.day}
          slotId={selectedCell.slotId}
          entry={currentEntry}
          onSave={updates => {
            if (selectedCell) {
              updateEntry(selectedCell.day, selectedCell.slotId, updates);
              setSelectedCell(null);
            }
          }}
        />
      )}

      {/* Time Slot Modal for admins */}
      {!isTeacher && isSlotModalOpen && (
        <TimeSlotModal
          isOpen={isSlotModalOpen}
          onClose={() => setIsSlotModalOpen(false)}
          timeSlots={timeSlots}
          onAddSlot={addTimeSlot}
          onUpdateSlot={updateTimeSlot}
          onDeleteSlot={deleteTimeSlot}
        />
      )}
    </div>
  );
};

export default Timetable;
