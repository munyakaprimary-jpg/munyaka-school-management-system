import React, { useState, useRef, useEffect } from 'react';
import { Clock, Coffee, Check, X, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { TimeSlot } from '@/hooks/useTimetable';

interface InlineTimeCellProps {
  slot: TimeSlot;
  periodNumber: number;
  onSave: (startTime: string, endTime: string) => void;
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
  const [error, setError] = useState('');
  const startRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setStartTime(slot.startTime);
      setEndTime(slot.endTime);
      setError('');
    }
  }, [slot.startTime, slot.endTime, isEditing]);

  useEffect(() => {
    if (isEditing) {
      startRef.current?.focus();
      startRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (!startTime || !endTime) {
      setError('Both times required');
      return;
    }
    if (startTime >= endTime) {
      setError('End must be after start');
      return;
    }
    onSave(startTime, endTime);
    setIsEditing(false);
    setError('');
  };

  const handleCancel = () => {
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setError('');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (isEditing) {
    return (
      <td className="px-2 py-2 bg-indigo-50/50 border-2 border-indigo-300">
        <div className="flex flex-col gap-1.5">
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
            />
            <span className="text-slate-400 text-xs">-</span>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-7 text-xs rounded-md px-1.5"
            />
          </div>
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={handleSave}
              className="w-6 h-6 rounded-md bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center transition-colors"
              title="Save (Enter)"
            >
              <Check className="w-3.5 h-3.5 text-white" />
            </button>
            <button
              onClick={handleCancel}
              className="w-6 h-6 rounded-md bg-slate-300 hover:bg-slate-400 flex items-center justify-center transition-colors"
              title="Cancel (Esc)"
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

  return (
    <td className="px-3 py-4 bg-slate-50/30 group">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
            slot.isBreak ? 'bg-amber-100' : 'bg-indigo-100'
          }`}>
            {slot.isBreak ? (
              <Coffee className="w-3 h-3 text-amber-600" />
            ) : (
              <span className="text-[10px] font-black text-indigo-600">{periodNumber}</span>
            )}
          </div>
          <div className="flex flex-col items-start min-w-0">
            <span className="font-bold text-slate-700 text-xs whitespace-nowrap">
              {slot.startTime} - {slot.endTime}
            </span>
            {slot.isBreak && (
              <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wide">Break</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            className="w-6 h-6 rounded-md hover:bg-indigo-100 flex items-center justify-center transition-colors"
            title="Edit time"
            aria-label="Edit time slot"
          >
            <Pencil className="w-3 h-3 text-indigo-600" />
          </button>
          <button
            onClick={onDelete}
            className="w-6 h-6 rounded-md hover:bg-rose-100 flex items-center justify-center transition-colors"
            title="Delete period"
            aria-label="Delete period"
          >
            <X className="w-3 h-3 text-rose-500" />
          </button>
        </div>
      </div>
    </td>
  );
};

export default InlineTimeCell;
