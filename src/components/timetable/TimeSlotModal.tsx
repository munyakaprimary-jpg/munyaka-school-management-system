import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Clock, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { TimeSlot } from '@/hooks/useTimetable';

interface TimeSlotModalProps {
  open: boolean;
  onClose: () => void;
  timeSlots: TimeSlot[];
  onAdd: (startTime: string, endTime: string, isBreak: boolean) => void;
  onUpdate: (slotId: string, startTime: string, endTime: string, isBreak: boolean) => void;
  onDelete: (slotId: string) => void;
}

const TimeSlotModal: React.FC<TimeSlotModalProps> = ({
  open,
  onClose,
  timeSlots,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isBreak, setIsBreak] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingSlot) {
      setStartTime(editingSlot.startTime);
      setEndTime(editingSlot.endTime);
      setIsBreak(editingSlot.isBreak);
    } else {
      setStartTime('');
      setEndTime('');
      setIsBreak(false);
    }
    setError('');
  }, [editingSlot, open]);

  if (!open) return null;

  const handleSave = () => {
    if (!startTime || !endTime) {
      setError('Please provide both start and end times');
      return;
    }
    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }

    if (editingSlot) {
      onUpdate(editingSlot.id, startTime, endTime, isBreak);
    } else {
      onAdd(startTime, endTime, isBreak);
    }
    setEditingSlot(null);
    setStartTime('');
    setEndTime('');
    setIsBreak(false);
    setError('');
  };

  const handleCancel = () => {
    setEditingSlot(null);
    setStartTime('');
    setEndTime('');
    setIsBreak(false);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Manage Time Slots</h2>
              <p className="text-sm text-slate-500">Add, edit, or remove periods</p>
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
          {/* Add/Edit Form */}
          <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              {editingSlot ? 'Edit Time Slot' : 'Add New Time Slot'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-xs font-semibold text-slate-600">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-xs font-semibold text-slate-600">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-600" />
                <Label htmlFor="isBreak" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Mark as break period
                </Label>
              </div>
              <Switch
                id="isBreak"
                checked={isBreak}
                onCheckedChange={setIsBreak}
              />
            </div>
            {error && (
              <p className="text-sm text-rose-600 font-medium">{error}</p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700"
              >
                {editingSlot ? 'Update Slot' : 'Add Slot'}
              </Button>
              {editingSlot && (
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Existing Slots List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              Current Time Slots ({timeSlots.length})
            </h3>
            {timeSlots.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No time slots yet. Add one above to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {timeSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {slot.isBreak ? (
                        <Coffee className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-indigo-600" />
                      )}
                      <span className="font-semibold text-slate-700">
                        {slot.startTime} - {slot.endTime}
                      </span>
                      {slot.isBreak && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-700">
                          BREAK
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingSlot(slot)}
                        className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                        aria-label="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-slate-500" />
                      </button>
                      <button
                        onClick={() => onDelete(slot.id)}
                        className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t bg-slate-50">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full rounded-xl"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotModal;
