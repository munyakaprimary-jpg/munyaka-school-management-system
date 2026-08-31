import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SLOT_CATEGORIES } from '@/hooks/useTimetable';
import type { TimeSlot } from '@/hooks/useTimetable';

interface InlineTimeCellProps {
  slot: TimeSlot;
  periodNumber: number;
  onSave: (startTime: string, endTime: string, category: string | null) => void;
  onDelete: () => void;
}

const InlineTimeCell: React.FC<InlineTimeCellProps> = ({
  slot,
  periodNumber,
  onSave,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [startTime, setStartTime] = useState(slot.startTime);
  const [endTime, setEndTime] = useState(slot.endTime);
  const [category, setCategory] = useState<string>('none');
  const [customCategory, setCustomCategory] = useState('');
  const [error, setError] = useState('');
  const startRef = useRef<HTMLInputElement>(null);

  // Sync form state when the slot changes externally or mode exits
  useEffect(() => {
    if (!isEditing) {
      setStartTime(slot.startTime);
      setEndTime(slot.endTime);
      const isPreset = SLOT_CATEGORIES.slice(1, -1).some(c => c.value === slot.category);
      if (slot.category && !isPreset) {
        setCategory('custom');
        setCustomCategory(slot.category);
      } else if (slot.category) {
        setCategory(slot.category);
        setCustomCategory('');
      } else {
        setCategory('none');
        setCustomCategory('');
      }
      setError('');
    }
  }, [slot, isEditing]);

  // When entering edit mode, focus and pre-populate
  useEffect(() => {
    if (isEditing) {
      startRef.current?.focus();
      startRef.current?.select();
    }
  }, [isEditing]);

  const resolveCategory = (): string | null => {
    if (category === 'custom') return customCategory.trim() || null;
    if (category === 'none' || !category) return null;
    return category;
  };

  const handleSave = () => {
    if (!startTime || !endTime) {
      setError('Both times required');
      return;
    }
    if (startTime >= endTime) {
      setError('End must be after start');
      return;
    }
    if (category === 'custom' && !customCategory.trim()) {
      setError('Custom name is required');
      return;
    }
    onSave(startTime, endTime, resolveCategory());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    const isPreset = SLOT_CATEGORIES.slice(1, -1).some(c => c.value === slot.category);
    if (slot.category && !isPreset) {
      setCategory('custom');
      setCustomCategory(slot.category);
    } else if (slot.category) {
      setCategory(slot.category);
      setCustomCategory('');
    } else {
      setCategory('none');
      setCustomCategory('');
    }
    setError('');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  // ── Edit mode ──────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <td className="px-2 py-2 bg-indigo-50/60 border-2 border-indigo-300 align-top">
        <div className="flex flex-col gap-1.5">
          {/* Time inputs */}
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-indigo-200 flex items-center justify-center text-[10px] font-black text-indigo-700 flex-shrink-0">
              {periodNumber}
            </span>
            <Input
              ref={startRef}
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-7 text-xs rounded-md px-1.5"
              aria-label="Start time"
            />
            <span className="text-slate-400 text-xs shrink-0">–</span>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-7 text-xs rounded-md px-1.5"
              aria-label="End time"
            />
          </div>

          {/* Category selector */}
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-7 text-xs rounded-md px-2 flex-1">
              <SelectValue placeholder="Period type…" />
            </SelectTrigger>
            <SelectContent>
              {SLOT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Custom name input */}
          {category === 'custom' && (
            <Input
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Custom name…"
              className="h-7 text-xs rounded-md px-2"
              aria-label="Custom period name"
            />
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={handleSave}
              className="w-6 h-6 rounded-md bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center transition-colors"
              title="Save (Enter)"
              aria-label="Save"
            >
              <Check className="w-3.5 h-3.5 text-white" />
            </button>
            <button
              onClick={handleCancel}
              className="w-6 h-6 rounded-md bg-slate-300 hover:bg-slate-400 flex items-center justify-center transition-colors"
              title="Cancel (Esc)"
              aria-label="Cancel"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {error && (
            <p className="text-[10px] text-rose-600 font-semibold leading-tight">{error}</p>
          )}
        </div>
      </td>
    );
  }

  // ── Display mode ───────────────────────────────────────────────────────────
  const isCategory = !!slot.category;
  const iconColor = isCategory ? 'text-amber-600' : 'text-indigo-600';
  const iconBg = isCategory ? 'bg-amber-100' : 'bg-indigo-100';

  return (
    <td className="px-3 py-4 bg-slate-50/30 group align-middle">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            {isCategory ? (
              <span className="text-[10px]">★</span>
            ) : (
              <span className="text-[10px] font-black text-indigo-600">{periodNumber}</span>
            )}
          </div>
          <div className="flex flex-col items-start min-w-0">
            <span className="font-bold text-slate-700 text-xs whitespace-nowrap">
              {slot.startTime} – {slot.endTime}
            </span>
            {isCategory ? (
              <span className={`text-[9px] font-bold uppercase tracking-wide whitespace-nowrap ${iconColor}`}>
                {slot.category}
              </span>
            ) : (
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                Period {periodNumber}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            className="w-6 h-6 rounded-md hover:bg-indigo-100 flex items-center justify-center transition-colors"
            aria-label="Edit time slot"
            title="Edit slot"
          >
            <Pencil className="w-3 h-3 text-indigo-600" />
          </button>
          <button
            onClick={onDelete}
            className="w-6 h-6 rounded-md hover:bg-rose-100 flex items-center justify-center transition-colors"
            aria-label="Delete period"
            title="Delete period"
          >
            <X className="w-3 h-3 text-rose-500" />
          </button>
        </div>
      </div>
    </td>
  );
};

export default InlineTimeCell;
