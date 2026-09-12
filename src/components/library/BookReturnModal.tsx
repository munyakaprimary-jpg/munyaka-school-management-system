"use client";

import React, { useState, useMemo } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BookAllocation, ConditionReturnStatus } from '@/types/library';

interface BookReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyLogs: BookAllocation[];
  onProcessReturn: (logId: string, condition: ConditionReturnStatus, notes: string) => void;
}

export const BookReturnModal: React.FC<BookReturnModalProps> = ({
  isOpen,
  onClose,
  historyLogs,
  onProcessReturn
}) => {
  const [selectedLogId, setSelectedLogId] = useState<string>('');
  const [condition, setCondition] = useState<ConditionReturnStatus>('Good');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredLogs = useMemo(() => {
    return historyLogs.filter(log => log.id === selectedLogId);
  }, [historyLogs, selectedLogId]);

  const selectedLog = selectedLogId ? historyLogs.find(log => log.id === selectedLogId) : null;

  const handleSelectLog = (logId: string) => {
    setSelectedLogId(logId);
    setCondition('Good');
    setNotes('');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLogId) {
      setErrorMsg('Please select a log entry first.');
      return;
    }

    if (!['Good', 'Damaged', 'Lost', 'Pending'].includes(condition)) {
      setErrorMsg('Invalid condition selected.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onProcessReturn(selectedLogId, condition, String(notes || '').trim());
      setIsSubmitting(false);
      setSelectedLogId('');
      setCondition('Good');
      setNotes('');
      setErrorMsg('');
      onClose();
    } catch (err) {
      setErrorMsg('Failed to process return.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedLogId('');
    setCondition('Good');
    setNotes('');
    setErrorMsg('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Process Book Return"
      description="Mark book as returned or lost and record condition."
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button variant="ghost" onClick={handleCancel} className="rounded-xl font-bold">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedLogId || isSubmitting}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100 gap-2 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Process Return
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
            <AlertCircle size={16} className="shrink-0" /> {errorMsg}
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Select Log Entry</Label>
          <div className="relative">
            <Select value={selectedLogId} onValueChange={setSelectedLogId}>
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {filteredLogs.map(log => (
                  <SelectItem key={log.id} value={log.id}>
                    {log.borrower_name} — {log.book_title} ({log.grade} {log.stream})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Condition on Return</Label>
            <Select value={condition} onValueChange={(val) => setCondition(val as ConditionReturnStatus)}>
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Damaged">Damaged</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Notes / Remarks</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Torn pages, cover missing, etc."
              className="rounded-xl bg-slate-50 border-none min-h-[80px] font-bold"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
