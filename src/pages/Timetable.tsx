"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Modal from '@/components/ui/Modal';
import { 
  Calendar, 
  Printer, 
  Download, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Grid,
  Settings
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '08:00 - 08:40',
  '08:40 - 09:20',
  '09:20 - 10:00',
  '10:00 - 10:40',
  '10:40 - 11:20',
  '11:20 - 12:00',
  '12:00 - 12:40',
  '12:40 - 13:20',
  '13:20 - 14:00',
  '14:00 - 14:40',
  '14:40 - 15:20',
];

// Default fallback data
const DEFAULT_GRADES = [
  { id: '1', name: 'Grade 1' },
  { id: '2', name: 'Grade 2' },
  { id: '3', name: 'Grade 3' },
  { id: '4', name: 'Grade 4' },
  { id: '5', name: 'Grade 5' },
  { id: '6', name: 'Grade 6' },
  { id: '7', name: 'Grade 7' },
  { id: '8', name: 'Grade 8' },
  { id: '9', name: 'Grade 9' },
];

const DEFAULT_STREAMS = [
  { id: 'blue', name: 'Blue' },
  { id: 'red', name: 'Red' },
  { id: 'green', name: 'Green' },
  { id: 'yellow', name: 'Yellow' },
  { id: 'alpha', name: 'Alpha' },
  { id: 'beta', name: 'Beta' },
];

const STORAGE_KEYS = {
  GRADES: 'munyaka_portal_grades',
  STREAMS: 'munyaka_portal_streams',
  TIMETABLE: 'munyaka_portal_timetable',
};

interface TimetableEntry {
  id: string;
  gradeId: string;
  streamId: string;
  day: string;
  timeSlot: string;
  subject: string;
  teacher?: string;
  room?: string;
}

interface Grade {
  id: string;
  name: string;
}

interface Stream {
  id: string;
  name: string;
}

const Timetable = () => {
  // State for grades and streams from settings
  const [grades, setGrades] = useState<Grade[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GRADES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading grades from localStorage:', e);
    }
    return DEFAULT_GRADES;
  });

  const [streams, setStreams] = useState<Stream[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STREAMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading streams from localStorage:', e);
    }
    return DEFAULT_STREAMS;
  });

  // Listen for storage changes to keep in sync with settings
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.GRADES) {
        try {
          const parsed = JSON.parse(e.newValue || '[]');
          if (Array.isArray(parsed) && parsed.length > 0) setGrades(parsed);
        } catch (err) {
          console.error('Error parsing grades from storage event:', err);
        }
      }
      if (e.key === STORAGE_KEYS.STREAMS) {
        try {
          const parsed = JSON.parse(e.newValue || '[]');
          if (Array.isArray(parsed) && parsed.length > 0) setStreams(parsed);
        } catch (err) {
          console.error('Error parsing streams from storage event:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Timetable data state
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TIMETABLE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading timetable from localStorage:', e);
    }
    return [];
  });

  // Persist timetable to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(timetableData));
  }, [timetableData]);

  // View state
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [selectedStreamId, setSelectedStreamId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for modal
  const [formData, setFormData] = useState({
    gradeId: '',
    streamId: '',
    day: 'Monday',
    timeSlot: TIME_SLOTS[0],
    subject: '',
    teacher: '',
    room: '',
  });

  // Initialize selections
  useEffect(() => {
    if (grades.length > 0 && !selectedGradeId) {
      setSelectedGradeId(grades[0].id);
    }
  }, [grades, selectedGradeId]);

  useEffect(() => {
    if (streams.length > 0 && !selectedStreamId) {
      setSelectedStreamId(streams[0].id);
    }
  }, [streams, selectedStreamId]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isModalOpen) {
      if (editingEntry) {
        setFormData({
          gradeId: editingEntry.gradeId,
          streamId: editingEntry.streamId,
          day: editingEntry.day,
          timeSlot: editingEntry.timeSlot,
          subject: editingEntry.subject,
          teacher: editingEntry.teacher || '',
          room: editingEntry.room || '',
        });
      } else {
        setFormData({
          gradeId: selectedGradeId,
          streamId: selectedStreamId,
          day: 'Monday',
          timeSlot: TIME_SLOTS[0],
          subject: '',
          teacher: '',
          room: '',
        });
      }
    } else {
      setEditingEntry(null);
      setFormData({
        gradeId: selectedGradeId,
        streamId: selectedStreamId,
        day: 'Monday',
        timeSlot: TIME_SLOTS[0],
        subject: '',
        teacher: '',
        room: '',
      });
    }
  }, [isModalOpen, editingEntry, selectedGradeId, selectedStreamId]);

  // Filtered entries for current grade/stream
  const filteredEntries = useMemo(() => {
    return timetableData.filter(
      entry => entry.gradeId === selectedGradeId && entry.streamId === selectedStreamId
    );
  }, [timetableData, selectedGradeId, selectedStreamId]);

  // Build grid data for display
  const gridData = useMemo(() => {
    const grid: Record<string, Record<string, TimetableEntry | null>> = {};
    DAYS.forEach(day => {
      grid[day] = {};
      TIME_SLOTS.forEach(slot => {
        grid[day][slot] = null;
      });
    });
    filteredEntries.forEach(entry => {
      if (grid[entry.day] && grid[entry.day][entry.timeSlot] !== undefined) {
        grid[entry.day][entry.timeSlot] = entry;
      }
    });
    return grid;
  }, [filteredEntries]);

  const selectedGrade = grades.find(g => g.id === selectedGradeId);
  const selectedStream = streams.find(s => s.id === selectedStreamId);

  const handleOpenModal = (entry?: TimetableEntry) => {
    if (entry) {
      setEditingEntry(entry);
    } else {
      setEditingEntry(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEntry = async () => {
    if (!formData.subject.trim()) {
      showError('Please enter a subject/activity');
      return;
    }

    setIsSaving(true);
    await new Promise(r => setTimeout(r, 300));

    if (editingEntry) {
      // Update existing
      setTimetableData(prev =>
        prev.map(e => e.id === editingEntry.id ? { ...e, ...formData } : e)
      );
      showSuccess('Schedule updated successfully');
    } else {
      // Create new
      const newEntry: TimetableEntry = {
        id: `tt-${Date.now()}`,
        ...formData,
      };
      setTimetableData(prev => [...prev, newEntry]);
      showSuccess('Schedule added successfully');
    }

    setIsSaving(false);
    handleCloseModal();
  };

  const handleDeleteEntry = (id: string) => {
    if (confirm('Are you sure you want to delete this schedule entry?')) {
      setTimetableData(prev => prev.filter(e => e.id !== id));
      showSuccess('Schedule entry deleted');
    }
  };

  const handleExportCSV = () => {
    if (filteredEntries.length === 0) {
      showError('No schedule entries to export');
      return;
    }

    const headers = ['Grade', 'Stream', 'Day', 'Time Slot', 'Subject', 'Teacher', 'Room'];
    const rows = filteredEntries.map(entry => [
      selectedGrade?.name || entry.gradeId,
      selectedStream?.name || entry.streamId,
      entry.day,
      entry.timeSlot,
      entry.subject,
      entry.teacher || '',
      entry.room || '',
    ]);

    const csvContent = [
      `Timetable - ${selectedGrade?.name} ${selectedStream?.name}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timetable_${selectedGrade?.name}_${selectedStream?.name}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess('Timetable exported to CSV');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">School Timetable</h1>
          <p className="text-muted-foreground">Manage weekly schedules for all grades and streams.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            className="rounded-xl border-slate-200 bg-white gap-2" 
            onClick={handlePrint}
          >
            <Printer size={18} /> Print
          </Button>
          <Button 
            variant="outline" 
            className="rounded-xl border-slate-200 bg-white gap-2" 
            onClick={handleExportCSV}
          >
            <Download size={18} /> Export CSV
          </Button>
          <Button 
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-lg shadow-indigo-100" 
            onClick={() => handleOpenModal()}
          >
            <Plus size={18} /> Manage Schedule
          </Button>
        </div>
      </div>

      {/* Grade & Stream Selectors */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Grade</Label>
            <Select value={selectedGradeId} onValueChange={setSelectedGradeId}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {grades.map(grade => (
                  <SelectItem key={grade.id} value={grade.id}>{grade.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Stream</Label>
            <Select value={selectedStreamId} onValueChange={setSelectedStreamId}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                <SelectValue placeholder="Select Stream" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {streams.map(stream => (
                  <SelectItem key={stream.id} value={stream.id}>{stream.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Total Slots</Label>
            <div className="h-12 rounded-xl bg-indigo-50 border-none font-black text-2xl flex items-center justify-center text-indigo-700">
              {filteredEntries.length}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Subjects</Label>
            <div className="h-12 rounded-xl bg-emerald-50 border-none font-black text-2xl flex items-center justify-center text-emerald-700">
              {new Set(filteredEntries.map(e => e.subject)).size}
            </div>
          </div>
        </div>
      </Card>

      {/* Timetable Grid */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <CardHeader className="p-6 border-b bg-slate-50/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black text-slate-900">
              {selectedGrade?.name} - {selectedStream?.name} Stream
            </CardTitle>
            <p className="text-sm text-slate-500 font-medium">Weekly Schedule Overview</p>
          </div>
          {filteredEntries.length > 0 && (
            <Badge className="bg-indigo-50 text-indigo-700 border-none font-bold px-4 py-1.5 rounded-xl">
              {filteredEntries.length} Scheduled Slots
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
              <thead className="bg-slate-50/50 border-b">
                <tr>
                  <th className="sticky left-0 bg-slate-50/50 z-10 px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 border-r w-40">
                    Time Slot
                  </th>
                  {DAYS.map(day => (
                    <th key={day} className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center border-r min-w-[180px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot, slotIndex) => (
                  <tr key={slot} className={slotIndex % 2 === 0 ? 'bg-slate-50/30' : ''}>
                    <td className="sticky left-0 bg-white z-10 px-6 py-4 font-bold text-slate-700 border-r w-40">
                      {slot}
                    </td>
                    {DAYS.map(day => {
                      const entry = gridData[day]?.[slot];
                      return (
                        <td key={day} className="px-3 py-3 border-r min-w-[180px] max-h-[100px]">
                          {entry ? (
                            <div 
                              className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => handleOpenModal(entry)}
                            >
                              <p className="font-bold text-indigo-900 text-sm truncate">{entry.subject}</p>
                              {entry.teacher && (
                                <p className="text-[10px] text-slate-500 truncate">{entry.teacher}</p>
                              )}
                              {entry.room && (
                                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" /> {entry.room}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="h-full min-h-[60px] flex items-center justify-center">
                              <span className="text-slate-200 text-[10px]">—</span>
                            </div>
                          )}
                        </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Manage Schedule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingEntry ? "Edit Schedule Entry" : "Add Schedule Entry"}
        description="Create or modify a timetable slot for the selected grade and stream."
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="ghost" onClick={handleCloseModal} className="rounded-xl font-bold h-11 px-6">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEntry} 
              disabled={isSaving}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold h-11 px-8 text-white shadow-lg shadow-indigo-100 gap-2"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {editingEntry ? 'Update Entry' : 'Add Entry'}
            </Button>
          </div>
        }
      >
        <form onSubmit={e => { e.preventDefault(); handleSaveEntry(); }} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Grade</Label>
              <Select value={formData.gradeId} onValueChange={val => handleFormChange('gradeId', val)}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {grades.map(grade => (
                    <SelectItem key={grade.id} value={grade.id}>{grade.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Stream</Label>
              <Select value={formData.streamId} onValueChange={val => handleFormChange('streamId', val)}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                  <SelectValue placeholder="Select Stream" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {streams.map(stream => (
                    <SelectItem key={stream.id} value={stream.id}>{stream.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Day</Label>
              <Select value={formData.day} onValueChange={val => handleFormChange('day', val)}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {DAYS.map(day => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Time Slot</Label>
              <Select value={formData.timeSlot} onValueChange={val => handleFormChange('timeSlot', val)}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {TIME_SLOTS.map(slot => (
                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Subject / Activity</Label>
            <Input 
              value={formData.subject} 
              onChange={e => handleFormChange('subject', e.target.value)} 
              placeholder="e.g. Mathematics, English, Science" 
              className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Teacher (Optional)</Label>
              <Input 
                value={formData.teacher} 
                onChange={e => handleFormChange('teacher', e.target.value)} 
                placeholder="e.g. Mr. Kamau" 
                className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Room (Optional)</Label>
              <Input 
                value={formData.room} 
                onChange={e => handleFormChange('room', e.target.value)} 
                placeholder="e.g. Room 101, Lab 2" 
                className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Timetable;