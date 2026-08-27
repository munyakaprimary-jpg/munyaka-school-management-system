"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { Monitor, Laptop, Keyboard, Mouse, Projector, Printer, Wifi, HardDrive, Save } from 'lucide-react';
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
    location: "Main Lab",
    quantity: 1,
    isBulk: false,
    serialNumbers: [] as string[]
  });

  const categoryOptions = [
    { value: "Laptops", label: "Laptops" },
    { value: "Tablets", label: "Tablets" },
    { value: "Projectors", label: "Projectors" },
    { value: "Networking", label: "Networking" },
    { value: "Printers", label: "Printers" }
  ];

  const requiresSerial = useMemo(() => {
    const serialCategories = ["Laptops", "Tablets", "Projectors"];
    return serialCategories.includes(formData.category);
  }, [formData.category]);

  // Update serialNumbers array when quantity changes
  useEffect(() => {
    const arr = new Array(formData.quantity).fill("");
    setFormData(prev => ({ ...prev, serialNumbers: arr }));
  }, [formData.quantity]);

  const handleSerialChange = (index: number, value: string) => {
    const arr = [...formData.serialNumbers];
    arr[index] = value;
    setFormData(prev => ({ ...prev, serialNumbers: arr }));
  };

  const handleCategoryChange = (val: ICTCategory) => {
    setFormData(prev => ({
      ...prev,
      category: val,
      isBulk: false,
      quantity: 1,
      serialNumbers: []
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetTag || !formData.name) return;

    const asset: ICTAsset = {
      id: `ict-${Date.now()}`,
      assetTag: formData.assetTag,
      name: formData.name,
      category: formData.category,
      serialNumber: formData.isBulk ? "" : (formData.serialNumbers.length > 0 ? formData.serialNumbers[0] : ""),
      status: "Active" as ICTStatus,
      location: formData.location,
      assignedTo: ""
    };

    onAdd(asset);
    onClose();
    setFormData({
      assetTag: "",
      name: "",
      category: "Laptops",
      location: "Main Lab",
      quantity: 1,
      isBulk: false,
      serialNumbers: []
    });
  };

  const renderSerialFields = () => {
    if (formData.quantity === 1) {
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Serial Number (S/N)</Label>
          <Input
            value={formData.serialNumbers[0] || ""}
            onChange={(e) => handleSerialChange(0, e.target.value)}
            placeholder="e.g. CND12345XYZ"
            className="rounded-xl h-12 bg-slate-50 border-none font-bold"
          />
        </div>
      );
    }
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Serial Numbers</Label>
        <p className="text-xs text-slate-500 font-medium">Enter one serial number per device (up to {formData.quantity} units).</p>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: formData.quantity }, (_, i) => (
            <Input
              key={i}
              type="text"
              value={formData.serialNumbers[i] || ""}
              onChange={(e) => handleSerialChange(i, e.target.value)}
              placeholder={`S/N #${i + 1}`}
              className="rounded-xl h-10 bg-slate-50 border-none font-bold text-sm"
            />
          ))}
        </div>
      </div>
    );
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
          <Button onClick={handleSubmit} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100 gap-2 text-white">
            <Save size={18} /> Save Asset
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Asset Tag ID</Label>
            <Input
              value={formData.assetTag}
              onChange={(e) => setFormData({ ...formData, assetTag: e.target.value.toUpperCase() })}
              placeholder="e.g. ICT-LP-001"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Category</Label>
            <Select value={formData.category} onValueChange={(val: any) => setFormData({ ...formData, category: val })}>
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-2xl">
                {categoryOptions.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Device Name / Model</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. HP ProBook 450 G8"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Storage Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Computer Lab 1, Server Room"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold"
            />
          </div>
        </div>

        {/* Quantity + Bulk Toggle Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">QUANTITY</Label>
            <Input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              step="1"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Asset Type</Label>
            <div className="flex items-center gap-2">
              <Input
                type="checkbox"
                checked={formData.isBulk}
                onChange={() => setFormData(prev => ({ ...prev, isBulk: !prev.isBulk }))}
                className="rounded-xl h-4 w-4 bg-slate-200 border-slate-400 focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-xs font-medium text-slate-500">
                Non-Serialized / Bulk Asset
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              When checked, serial numbers are not required. Items registered by quantity and location only.
            </p>
          </div>
        </div>

        {/* Conditional Serial Number Fields */}
        {requiresSerial && !formData.isBulk && (
          <div className="space-y-1.5">
            {renderSerialFields()}
          </div>
        )}

        {formData.isBulk && (
          <div className="space-y-1.5 pt-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Notes</Label>
            <p className="text-xs text-slate-500 font-medium">
              Items registered by quantity and location. Serial numbers not tracked for bulk consumables.
            </p>
          </div>
        )}

      </form>
    </Modal>
  );
};

export default AddICTAssetModal;