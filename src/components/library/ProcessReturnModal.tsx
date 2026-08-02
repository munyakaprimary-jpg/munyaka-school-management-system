"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from '@/components/ui/Modal';
import { BorrowLog, getLogBalance } from '@/types/library';
import { RotateCcw, AlertCircle } from 'lucide-react';

interface ProcessReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: BorrowLog | null;
  onConfirmReturn: (logId: string, qtyReturned: number, qtyLost: number) => void;
}

export const ProcessReturnModal: React.FC<ProcessReturnModalProps> = ({
  isOpen,
  onClose,
  log,
  onConfirmReturn,
}) => {
  const [returnQty, setReturnQty] = useState<number>(0);
  const [lostQty, setLostQty] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const balance = log ? getLogBalance(log) : 0;

  useEffect(() => {
    if (isOpen && log) {
      setReturnQty(getLogBalance(log));
      setLostQty(0);
      setErrorMsg("");
    }
  }, [isOpen, log]);

  if (!log) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ret = Number(returnQty) || 0;
    const lost = Number(lostQty) || 0;

    if (ret < 0 || lost < 0) {
      setErrorMsg("Quantities cannot be negative.");
      return;
    }

    if (ret + lost <= 0) {
      setErrorMsg("Please enter at least 1 returned or lost book.");
      return;
    }

    if (ret + lost > balance) {
      setErrorMsg(`Total processed (${ret + lost}) exceeds remaining balance (${balance}).`);
      return;
    }

    onConfirmReturn(log.id, ret, lost);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Process Return / Loss"
      description={`Record returned or lost books for ${log.borrowerName}`}
      maxWidth="max-w-md"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-6 text-white shadow-lg shadow-indigo-100 gap-2"
          >
            <RotateCcw size={16} /> Save Record
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
            <AlertCircle size={16} className="shrink-0" /> {errorMsg}
          </div>
        )}

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Book Title</p>
          <p className="text-sm font-bold text-slate-900">{log.bookTitle}</p>
          <p className="text-xs text-slate-500 font-medium">
            Outstanding Balance: <span className="font-bold text-indigo-600">{balance} copy(ies)</span>
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">
            Books Returned Today
          </Label>
          <Input
            type="number"
            min={0}
            max={balance}
            value={returnQty}
            onChange={(e) => {
              setReturnQty(Math.max(0, parseInt(e.target.value) || 0));
              setErrorMsg("");
            }}
            className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">
            Books Declared Lost / Damaged
          </Label>
          <Input
            type="number"
            min={0}
            max={balance}
            value={lostQty}
            onChange={(e) => {
              setLostQty(Math.max(0, parseInt(e.target.value) || 0));
              setErrorMsg("");
            }}
            className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900"
          />
        </div>
      </form>
    </Modal>
  );
};