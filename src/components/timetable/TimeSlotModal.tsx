import React, { useState, useEffect } from 'react';
import { X, Trash2, Edit2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SLOT_CATEGORIES } from '@/hooks/useTimetable';
import type { TimeSlot } from '@/hooks/useTimetable';

interface TimeSlotModalProps {
  open: boolean;
  onClose: () => void;
  timeSlots: TimeSlot[];
  onAdd: (startTime: string, endTime: string, category: string | null) => void;
  onUpdate: (slotId: string, startTime: string, endTime: string, category: string | null) => void;
  onDelete: (slotId: string) => void;
}

const NONE_VALUE = 'none';

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
  const [category, setCategory] = useState<string>(NONE_VALUE);
  const [customCategory, setCustomCategory] = useState('');
  const [error, setError] = useState('');
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingSlot, open]);

  // When the user clicks Edit on a slot (which lives near the bottom of the
  // scrollable list), scroll the modal content back to the top so the
  // populated edit form is actually visible.
  useEffect(() => {
    if (editingSlot && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [editingSlot]);

  const resetForm = () => {
    if (editingSlot) {
      setStartTime(editingSlot.startTime);
      setEndTime(editingSlot.endTime);
      const isPreset = SLOT_CATEGORIES.slice(1, -1).some(c => c.value === editingSlot.category);
      if (editingSlot.category && !isPreset) {
        setCategory('custom');
        setCustomCategory(editingSlot.category);
      } else if (editingSlot.category) {
        setCategory(editingSlot.category);
        setCustomCategory('');
      } else {
        setCategory(NONE_VALUE);
        setCustomCategory('');
      }
    } else {
      setStartTime('');
      setEndTime('');
      setCategory(NONE_VALUE);
      setCustomCategory('');
    }
    setError('');
  };

  if (!open) return null;

  const resolveCategory = (): string | null => {
    if (category === 'custom') return customCategory.trim() || null;
    if (category === NONE_VALUE || !category) return null;
    return category;
  };

  const handleSave = () => {
    if (!startTime || !endTime) {
      setError('Please provide both start and end times');
      return;
    }
    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }
    if (category === 'custom' && !customCategory.trim()) {
      setError('Please enter a custom name');
      return;
    }
    const finalCat = resolveCategory();
    if (editingSlot) {
      onUpdate(editingSlot.id, startTime, endTime, finalCat);
    } else {
      onAdd(startTime, endTime, finalCat);
    }
    setEditingSlot(null);
    resetForm();
  };

  const handleCancel = () => {
    setEditingSlot(null);
    resetForm();
  };

  const getCategoryLabel = (cat: string | null) => {
    if (!cat) return 'Regular Period';
    const preset = SLOT_CATEGORIES.find(c => c.value === cat);
    return preset ? preset.label : cat;
  };

  const getCategoryBadgeClass = (cat: string | null) => {
    switch (cat) {
      case 'Break':            return 'bg-amber-100 text-amber-700';
      case 'Lunch Break':      return 'bg-orange-100 text-orange-700';
      case 'Games / PE':       return 'bg-green-100 text-green-700';
      case 'Assembly':         return 'bg-purple-100 text-purple-700';
      case 'Pastoral / Clubs': return 'bg-violet-100 text-violet-700';
      default:                 return 'bg-cyan-100 text-cyan-700';
    }
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

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
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

            {/* Category Selector */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-xs font-semibold text-slate-600">Period Type</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="rounded-xl">
                  <SelectValue placeholder="Select period type…" />
                </SelectTrigger>
                <SelectContent>
                  {SLOT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom name input */}
            {category === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="customCategory" className="text-xs font-semibold text-slate-600">Custom Name</Label>
                <Input
                  id="customCategory"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Music Practice, Detention…"
                  className="rounded-xl"
                  autoFocus
                />
              </div>
            )}

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
                <Button onClick={handleCancel} variant="outline" className="rounded-xl">
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
                    <div className="flex items-center gap-3 min-w-0">
                      <Clock className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <span className="font-semibold text-slate-700 whitespace-nowrap">
                          {slot.startTime} – {slot.endTime}
                        </span>
                        {slot.category ? (
                          <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full whitespace-nowrap ${getCategoryBadgeClass(slot.category)}`}>
                            {getCategoryLabel(slot.category)}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-500 whitespace-nowrap">
                            Regular
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
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
          <Button onClick={onClose} variant="outline" className="w-full rounded-xl">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotModal;
