"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { ArrowDownLeft, AlertCircle } from 'lucide-react';

interface ActiveLoan {
  id: string | number;
  item: string;
  issuedTo: string;
  qty: number;
}

interface ReceiveAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReceive: (data: { logId: string | number; qtyReturned: number; condition: string; notes?: string; returnDate?: string }) => void;
  activeLoans: ActiveLoan[];
}

const ReceiveAssetModal = ({ isOpen, onClose, onReceive, activeLoans }: ReceiveAssetModalProps) => {
  const [selectedLogId, setSelectedLogId] = useState<string>("");
  const [qtyReturned, setQtyReturned] = useState("");
  const [condition, setCondition] = useState("Good Condition");
  const [notes, setNotes] = useState("");
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState("");

  const selectedLoan = activeLoans.find(l => l.id.toString() === selectedLogId);

  useEffect(() => {
    if (!isOpen) {
      setSelectedLogId("");
      setQtyReturned("");
      setCondition("Good Condition");
      setNotes("");
      setReturnDate(new Date().toISOString().split('T')[0]);
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLogId) return setError("Please select an active loan to return.");
    
    const numQty = parseInt(qtyReturned);
    if (isNaN(numQty) || numQty <= 0) return setError("Please enter a valid return quantity.");
    
    if (selectedLoan && numQty > selectedLoan.qty) {
      return setError(`Return quantity cannot exceed issued amount (${selectedLoan.qty}).`);
    }

    onReceive({
      logId: selectedLogId,
      qtyReturned: numQty,
      condition,
      notes: (notes ?? '').trim() || undefined,
      returnDate: returnDate || undefined
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Receive / Return Tool"
      description="Record returned assets and assess their current condition."
      footer={
        <div className="flex gap-2 justify-end w-full">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100 gap-2"
          >
            <ArrowDownLeft size={18} /> Process Return
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Active Loan / Issued Item</Label>
          <Select value={selectedLogId} onValueChange={setSelectedLogId}>
            <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
              <SelectValue placeholder="Choose issued record..." />
            </SelectTrigger>
            <SelectContent>
              {activeLoans.length > 0 ? (
                activeLoans.map(loan => (
                  <SelectItem key={loan.id} value={loan.id.toString()}>
                    {loan.issuedTo}: {loan.item} ({loan.qty} issued)
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No active loans found</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Qty Returned</Label>
            <Input 
              type="number" 
              min="1"
              value={qtyReturned} 
              onChange={e => setQtyReturned(e.target.value)}
              placeholder="e.g. 5"
              className="h-12 rounded-xl bg-slate-50 border-none font-bold"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Item Condition</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Good Condition">Good Condition</SelectItem>
                <SelectItem value="Needs Repair">Needs Repair</SelectItem>
                <SelectItem value="Damaged">Damaged</SelectItem>
                <SelectItem value="Lost">Lost / Unaccounted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Return Date</Label>
          <Input 
            type="date" 
            value={returnDate} 
            onChange={e => setReturnDate(e.target.value)}
            className="h-12 rounded-xl bg-slate-50 border-none font-bold"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Notes / Remarks</Label>
          <Textarea 
            value={notes} 
            onChange={e => setNotes(e.target.value)}
            placeholder="Specify any wear and tear or resolution details..."
            className="rounded-xl bg-slate-50 border-none min-h-[80px]"
          />
        </div>
      </form>
    </Modal>
  );
};

export default ReceiveAssetModal;