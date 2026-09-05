"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { Send, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { AssetItem } from '@/pages/Inventory';

interface IssueAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssue: (data: { assetId: string; issuedTo: string; qty: number; returnDate?: string; remarks?: string }) => void;
  assets: AssetItem[];
}

const IssueAssetModal = ({ isOpen, onClose, onIssue, assets }: IssueAssetModalProps) => {
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [issuedTo, setIssuedTo] = useState("");
  const [qty, setQty] = useState("1");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");

  const selectedAsset = assets.find(a => a.id === selectedAssetId);

  useEffect(() => {
    if (!isOpen) {
      setSelectedAssetId("");
      setIssuedTo("");
      setQty("1");
      setReturnDate("");
      setRemarks("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) return setError("Please select an asset.");
    if (!String(issuedTo || '').trim()) return setError("Please specify who the asset is being issued to.");
    
    const numQty = parseInt(qty);
    if (isNaN(numQty) || numQty <= 0) return setError("Please enter a valid quantity.");
    
    if (selectedAsset && numQty > selectedAsset.qty) {
      return setError(`Insufficient stock. Only ${selectedAsset.qty} available.`);
    }

    onIssue({
      assetId: selectedAssetId,
      issuedTo: issuedTo.trim(),
      qty: numQty,
      returnDate: returnDate || undefined,
      remarks: remarks.trim() || undefined
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Issue Tool / Asset"
      description="Record the distribution of school resources to staff or departments."
      footer={
        <div className="flex gap-2 justify-end w-full">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100 gap-2"
          >
            <Send size={16} /> Complete Issuance
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
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Select Asset from Stock</Label>
          <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
            <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
              <SelectValue placeholder="Choose tool..." />
            </SelectTrigger>
            <SelectContent>
              {assets.map(asset => (
                <SelectItem key={asset.id} value={asset.id}>
                  {asset.item} ({asset.qty} Available)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Issued To (Name/Dept)</Label>
          <Input 
            value={issuedTo} 
            onChange={e => setIssuedTo(e.target.value)}
            placeholder="e.g. Mr. Kamau / Science Dept"
            className="h-12 rounded-xl bg-slate-50 border-none font-bold"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Quantity</Label>
            <Input 
              type="number" 
              min="1"
              value={qty} 
              onChange={e => setQty(e.target.value)}
              className="h-12 rounded-xl bg-slate-50 border-none font-bold"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Issue Date</Label>
            <Input 
              type="date" 
              value={issueDate} 
              onChange={e => setIssueDate(e.target.value)}
              className="h-12 rounded-xl bg-slate-50 border-none font-bold"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Expected Return Date (Optional)</Label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              type="date" 
              value={returnDate} 
              onChange={e => setReturnDate(e.target.value)}
              className="h-12 pl-10 rounded-xl bg-slate-50 border-none font-bold"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Remarks / Condition</Label>
          <Textarea 
            value={remarks} 
            onChange={e => setRemarks(e.target.value)}
            placeholder="Condition of tool or specific kit details..."
            className="rounded-xl bg-slate-50 border-none min-h-[80px]"
          />
        </div>
      </form>
    </Modal>
  );
};

export default IssueAssetModal;