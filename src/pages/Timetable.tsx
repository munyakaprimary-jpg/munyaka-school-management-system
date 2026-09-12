"use client";

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Clock, Settings2, Plus } from 'lucide-react';
import { useTimetable } from '@/hooks/useTimetable';
import TimeSlotModal from '@/components/timetable/TimeSlotModal';
import LessonDrawer from '@/components/timetable/LessonDrawer';
import InlineTimeCell from '@/components/timetable/InlineTimeCell';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; labelBg: string }> = {
  'Break':            { bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200',    labelBg: 'bg-amber-100' },
  'Lunch Break':     { bg: 'bg-orange-50',   text: 'text-orange-700',   border: 'border-orange-200',   labelBg: 'bg-orange-100' },
  'Games / PE':       { bg: 'bg-green-50',    text: 'text-green-700',    border: 'border-green-200',    labelBg: 'bg-green-100' },
  'Assembly':         { bg: 'bg-purple-50',   text: 'text-purple-700',   border: 'border-purple-200',   labelBg: 'bg-purple-100' },
  'Pastoral / Clubs': { bg: 'bg-violet-50',   text: 'text-violet-700',   border: 'border-violet-200',   labelBg: 'bg-violet-100' },
};

const getCategoryStyle = (category: string | null) => {
  if (!category) return null;
  return CATEGORY_STYLES[category] ?? { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', labelBg: 'bg-cyan-100' };
};

const Timetable = () => {
  const {
    grades,
    selectedGrade,
    setSelectedGrade,
    timeSlots,
    entries,
    addTimeSlot,
    updateTimeSlot,
    updateSlotTimes,
    deleteTimeSlot,
    setLesson,
    deleteLesson,
  } = useTimetable();

  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [lessonDrawerOpen, setLessonDrawerOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ slotIndex: number; day: string } | null>(null);

  const handleCellClick = (slotIndex: number, day: string) => {
    setSelectedCell({ slotIndex, day });
    setLessonDrawerOpen(true);
  };

  const handleSaveLesson = (subject: string, colorClass?: string) => {
    if (selectedCell) {
      setLesson(selectedCell.slotIndex, selectedCell.day, subject, colorClass);
      setLessonDrawerOpen(false);
      setSelectedCell(null);
    }
  };

  const handleDeleteLesson = () => {
    if (selectedCell) {
      deleteLesson(selectedCell.slotIndex, selectedCell.day);
      setLessonDrawerOpen(false);
      setSelectedCell(null);
    }
  };

  const selectedSlot = selectedCell ? timeSlots[selectedCell.slotIndex] : null;
  const currentEntry = selectedCell && entries[selectedCell.slotIndex]
    ? entries[selectedCell.slotIndex][selectedCell.day]
    : null;

  const timeLabel = selectedSlot
    ? `${selectedSlot.startTime} – ${selectedSlot.endTime}`
    : '';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">School Timetable</h1>
          <p className="text-muted-foreground">Manage and view weekly schedules for different grades.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" className="rounded-xl" onClick={() => window.print()}>
            <Printer size={18} className="mr-2" /> Print
          </Button>
          <Button
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
            onClick={() => setSlotModalOpen(true)}
          >
            <Settings2 size={18} className="mr-2" /> Manage Slots
          </Button>
        </div>
      </div>

      {/* Grade Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
          <SelectTrigger className="rounded-2xl h-12 bg-white border-none shadow-sm">
            <SelectValue placeholder="Select Grade" />
          </SelectTrigger>
          <SelectContent>
            {grades.map((grade) => (
              <SelectItem key={grade.id} value={grade.id}>
                {grade.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timetable Grid */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b">
                  <th className="px-4 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px] w-44">
                    <div className="flex items-center justify-center gap-1.5">
                      <Clock size={12} /> Time
                    </div>
                  </th>
                  {DAY_LABELS.map((day) => (
                    <th key={day} className="px-4 py-5 font-black text-slate-900 uppercase tracking-widest text-[10px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timeSlots.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16">
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center">
                          <Clock className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-slate-600 font-semibold">No time slots configured</p>
                          <p className="text-slate-400 text-sm mt-1">Click "Manage Slots" to add your first period</p>
                        </div>
                        <Button onClick={() => setSlotModalOpen(true)} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                          <Plus size={16} className="mr-2" /> Add Time Slot
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  timeSlots.map((slot, slotIndex) => {
                    const isCategory = !!slot.category;
                    const catStyle = getCategoryStyle(slot.category);

                    if (isCategory) {
                      // ── Special category row: full-width spanning label ──────────────
                      return (
                        <tr key={slot.id} className="hover:opacity-95 transition-opacity">
                          <InlineTimeCell
                            slot={slot}
                            periodNumber={slotIndex + 1}
                            onSave={(st, et, cat) => updateSlotTimes(slot.id, st, et, cat)}
                            onDelete={() => deleteTimeSlot(slot.id)}
                          />
                          <td
                            colSpan={5}
                            className={`px-4 py-5 border-l border-slate-100 ${catStyle?.bg ?? 'bg-slate-50'}`}
                          >
                            <div className="flex items-center justify-center gap-4">
                              <span className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-2xl text-sm font-bold border ${catStyle?.labelBg ?? 'bg-slate-100'} ${catStyle?.border ?? 'border-slate-200'} ${catStyle?.text ?? 'text-slate-600'}`}>
                                <span>★</span>
                                {slot.category}
                              </span>
                              <span className={`text-xs font-semibold ${catStyle?.text ?? 'text-slate-500'}`}>
                                {slot.startTime} – {slot.endTime}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    // ── Regular lesson row ─────────────────────────────────────────
                    return (
                      <tr key={slot.id} className="hover:bg-slate-50/30 transition-colors">
                        <InlineTimeCell
                          slot={slot}
                          periodNumber={slotIndex + 1}
                          onSave={(st, et, cat) => updateSlotTimes(slot.id, st, et, cat)}
                          onDelete={() => deleteTimeSlot(slot.id)}
                        />
                        {DAYS.map((day) => {
                          const entry = entries[slotIndex]?.[day];
                          return (
                            <td key={day} className="px-3 py-3">
                              <button
                                onClick={() => handleCellClick(slotIndex, day)}
                                className={`w-full min-h-[64px] p-2.5 rounded-2xl text-xs font-bold transition-all hover:scale-[1.02] hover:shadow-md ${
                                  entry?.color || 'bg-slate-100 text-slate-400 hover:bg-indigo-50'
                                }`}
                              >
                                <span className="block truncate">
                                  {entry?.subject || (
                                    <span className="flex items-center justify-center gap-1 text-slate-400">
                                      <Plus size={12} /> Add
                                    </span>
                                  )}
                                </span>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 px-2">
        <span className="font-semibold">Tip:</span>
        <span>Click any lesson cell to assign a subject. Hover the time column to inline-edit a period or change its type (regular, break, lunch, etc.).</span>
      </div>

      {/* Modals */}
      <TimeSlotModal
        open={slotModalOpen}
        onClose={() => setSlotModalOpen(false)}
        timeSlots={timeSlots}
        onAdd={addTimeSlot}
        onUpdate={updateTimeSlot}
        onDelete={deleteTimeSlot}
      />

      <LessonDrawer
        open={lessonDrawerOpen}
        onClose={() => {
          setLessonDrawerOpen(false);
          setSelectedCell(null);
        }}
        day={selectedCell?.day || null}
        slotIndex={selectedCell?.slotIndex ?? null}
        timeLabel={timeLabel}
        currentEntry={currentEntry}
        onSave={handleSaveLesson}
        onDelete={handleDeleteLesson}
      />
    </div>
  );
};

export default Timetable;
