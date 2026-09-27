import React, { useState, useEffect } from 'react';
import { X, Trash2, BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { LessonEntry } from '@/hooks/useTimetable';
import { getTeachingStaffFromLocalStorage } from '@/hooks/useTimetable';

interface LessonDrawerProps {
  open: boolean;
  onClose: () => void;
  day: string | null;
  slotIndex: number | null;
  timeLabel: string;
  currentEntry: LessonEntry | null;
  isReadOnly?: boolean;
  onSave: (subject: string, colorClass?: string, teacherId?: string, teacherName?: string) => void;
  onDelete: () => void;
}

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

const DAY_LABELS: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
};

const LessonDrawer: React.FC<LessonDrawerProps> = ({
  open,
  onClose,
  day,
  slotIndex,
  timeLabel,
  currentEntry,
  isReadOnly = false,
  onSave,
  onDelete,
}) => {
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [assignedTeacherId, setAssignedTeacherId] = useState<string>('');
  const [assignedTeacherName, setAssignedTeacherName] = useState<string>('');
  const teachingStaff = getTeachingStaffFromLocalStorage();

  useEffect(() => {
    if (open) {
      if (currentEntry && !PRESET_SUBJECTS.find(p => p.name === currentEntry.subject)) {
        setIsCustom(true);
        setCustomSubject(currentEntry.subject);
        setSubject('');
      } else {
        setIsCustom(false);
        setCustomSubject('');
        setSubject(currentEntry?.subject || '');
      }
      if (currentEntry?.teacherId) {
        setAssignedTeacherId(currentEntry.teacherId);
        setAssignedTeacherName(currentEntry.teacherName || '');
      } else {
        setAssignedTeacherId('');
        setAssignedTeacherName('');
      }
    }
  }, [open, currentEntry]);

  if (!open || !day || slotIndex === null) return null;

  const handleSave = () => {
    const finalSubject = isCustom ? String(customSubject || '').trim() : subject;
    if (!finalSubject) return;
    const preset = PRESET_SUBJECTS.find(p => p.name === finalSubject);
    const selectedTeacherObj = teachingStaff.find(s => s.id === assignedTeacherId);
    const finalTeacherName = selectedTeacherObj?.name || assignedTeacherName || '';
    onSave(finalSubject, preset?.color, assignedTeacherId || undefined, finalTeacherName || undefined);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isReadOnly ? 'bg-slate-100' : 'bg-emerald-100'}`}>
              {isReadOnly ? (
                <BookOpen className="w-5 h-5 text-slate-400" />
              ) : (
                <BookOpen className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isReadOnly ? 'Lesson Details' : 'Assign Lesson'}
              </h2>
              <p className="text-xs text-slate-500">{DAY_LABELS[day]} • {timeLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Current lesson */}
          {currentEntry ? (
            <div className="bg-slate-50 rounded-2xl p-4">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Current Lesson</Label>
              <div className="mt-2 flex items-center justify-between">
                <span className={`inline-block px-3 py-1.5 rounded-xl text-sm font-bold ${currentEntry.color}`}>
                  {currentEntry.subject}
                </span>
                {!isReadOnly && (
                  <button
                    onClick={onDelete}
                    className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                )}
              </div>
            </div>
          ) : !isReadOnly && (
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-sm text-slate-500 text-center">No lesson assigned yet.</p>
            </div>
          )}

          {/* Preset subjects */}
          {!isReadOnly && (
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Choose a Subject</Label>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {PRESET_SUBJECTS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setSubject(preset.name);
                      setIsCustom(false);
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all ${preset.color} ${
                      !isCustom && subject === preset.name
                        ? 'ring-2 ring-offset-2 ring-indigo-500 scale-[0.98]'
                        : 'hover:scale-[1.02]'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom subject */}
          {!isReadOnly && (
            <div className="border-t pt-5">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Custom Subject</Label>
                <button
                  onClick={() => setIsCustom(!isCustom)}
                  className={`text-xs font-semibold ${isCustom ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'} transition-colors`}
                >
                  {isCustom ? 'Using custom' : '+ Use custom'}
                </button>
              </div>
              {isCustom && (
                <Input
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Enter custom subject name..."
                  className="rounded-xl"
                  autoFocus
                />
              )}
            </div>
          )}

          {/* Teacher assignment */}
          {!isReadOnly && (
            <div className="border-t pt-5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Assign Teacher</Label>
              <div className="mt-3">
                <Select
                  value={assignedTeacherId}
                  onValueChange={(value) => {
                    setAssignedTeacherId(value);
                    const selected = teachingStaff.find(s => s.id === value);
                    setAssignedTeacherName(selected?.name || '');
                  }}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select a teacher..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teachingStaff.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-500">No teaching staff found</div>
                    ) : (
                      teachingStaff.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Read-only notice */}
          {isReadOnly && !currentEntry && (
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-sm text-slate-500 text-center">No lesson assigned.</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-slate-50 flex gap-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 rounded-xl"
          >
            {isReadOnly ? 'Close' : 'Cancel'}
          </Button>
          {!isReadOnly && (
            <Button
              onClick={handleSave}
              disabled={isCustom ? !String(customSubject || '').trim() : !subject}
              className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700"
            >
              Save Lesson
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default LessonDrawer;
