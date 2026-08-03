"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { Monitor, Save, AlertCircle } from 'lucide-react';
import { ICTAsset, ICTCategory, ICTStatus } from '@/types/ict';

interface AddICTAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (asset: ICTAsset) => void;
}

const AddICTAssetModal = ({ isOpen, onClose, onAdd }: AddICTAssetModalProps) => {
  const [formData, setFormData] = useState({
    assetTag: "",
    name: "",
    category: "Laptops" as ICTCategory,
    serialNumber: "",
    location: "Main Lab",
    status: "Active" as ICTStatus
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetTag || !formData.name || !formData.serialNumber) return;

    onAdd({
      ...formData,
      id: `ict-${Date.now()}`,
    });
    onClose();
    setFormData({
      assetTag: "",
      name: "",
      category: "Laptops",
      serialNumber: "",
      location: "Main Lab",
      status: "Active"
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register ICT Hardware"
      description="Enter device specifications and identifying serial numbers."
      footer={
        <div className="flex gap-2 justify-end w-full">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
          <Button onClick={handleSubmit} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100 gap-2">
            <Save size={18} /> Save Asset
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Asset Tag ID</Label>
            <Input 
              value={formData.assetTag} 
              onChange={e => setFormData({...formData, assetTag: e.target.value.toUpperCase()})}
              placeholder="e.g. ICT-LP-001"
              className="h-12 rounded-xl bg-slate-50 border-none font-bold"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Category</Label>
            <Select value={formData.category} onValueChange={(val: ICTCategory) => setFormData({...formData, category: val})}>
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Laptops">Laptops</SelectItem>
                <SelectItem value="Tablets">Tablets</SelectItem>
                <SelectItem value="Projectors">Projectors</SelectItem>
                <SelectItem value="Networking">Networking</SelectItem>
                <SelectItem value="Printers">Printers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Device Name / Model</Label>
          <Input 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})}
            placeholder="e.g. HP ProBook 450 G8"
            className="h-12 rounded-xl bg-slate-50 border-none font-bold"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Serial Number (S/N)</Label>
          <Input 
            value={formData.serialNumber} 
            onChange={e => setFormData({...formData, serialNumber: e.target.value})}
            placeholder="Manufacturer unique ID"
            className="h-12 rounded-xl bg-slate-50 border-none font-bold"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Storage Location</Label>
          <Input 
            value={formData.location} 
            onChange={e => setFormData({...formData, location: e.target.value})}
            placeholder="e.g. Computer Lab 1, Server Room"
            className="h-12 rounded-xl bg-slate-50 border-none font-bold"
          />
        </div>
      </form>
    </Modal>
  );
};

export default AddICTAssetModal;