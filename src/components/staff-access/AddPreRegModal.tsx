"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Sparkles, Search, Check, ChevronsUpDown, User, Info, CheckCircle2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { SystemRole, PreRegisteredStaff } from '@/types/staff-access';
import type { StaffMember } from '@/lib/mock-data';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface AddPreRegModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<PreRegisteredStaff>) => void;
  existingPreRegistered?: PreRegisteredStaff[];
}

const mapRoleToSystemRole = (role: string): SystemRole => {
  // Safe null-checking: role may be undefined when called with staff?.role
  const normalized = (role || '').toLowerCase();
  if (normalized.includes('head') || normalized.includes('principal')) return 'head_teacher';
  if (normalized.includes('senior')) return 'senior_teacher';
  if (normalized.includes('class')) return 'class_teacher';
  if (normalized.includes('bursar') || normalized.includes('account')) return 'bursar';
  if (normalized.includes('admin')) return 'support_admin';
  return 'subject_teacher';
};

const AddPreRegModal = ({ isOpen, onClose, onSubmit, existingPreRegistered = [] }: AddPreRegModalProps) => {
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    nationalId: "",
    tscNumber: "",
    email: "",
    phone: "",
    systemRole: "subject_teacher" as SystemRole,
    assignedSubjects: ["Mathematics", "Science & Tech"],
    tempAccessCode: "",
    staffId: ""
  });

  // Get available directory staff members from localStorage; empty when none.
  const directoryStaffList = useMemo<StaffMember[]>(() => {
    const saved = localStorage?.getItem('munyaka_staff_directory') ?? null;
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  }, [isOpen]);

  // Exclude staff members who ALREADY have a pre-registration record
  const availableStaff = useMemo(() => {
    // Safe null-checking: email may be undefined for incomplete directory records
        const preRegEmailSet = new Set(existingPreRegistered.map(s => (s.email || '').toLowerCase()));
        const preRegNatIdSet = new Set(existingPreRegistered.map(s => s.nationalId));
    
        return directoryStaffList.filter(s =>
          !preRegEmailSet.has((s.email || '').toLowerCase()) &&
          !preRegNatIdSet.has(s.id_no)
        );
  }, [directoryStaffList, existingPreRegistered]);

  const generateRandomKey = () => {
      // Clean short key: PR-XXXXXX  (6 uppercase alphanumeric chars)
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
      let key = 'PR-';
      for (let i = 0; i < 6; i++) {
        key += chars[Math.floor(Math.random() * chars.length)];
      }
      setFormData(prev => ({ ...prev, tempAccessCode: key }));
    };
  
    /** Pure key generator (no state setter) — used for initial form values. */
    const generateAccessKey = (): string => {
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
      let key = 'PR-';
      for (let i = 0; i < 6; i++) {
        key += chars[Math.floor(Math.random() * chars.length)];
      }
      return key;
    };

  const generateStaffId = () => {
    // T007, T008, ... — deterministic per existing ledger length
    let ledger: PreRegisteredStaff[] = [];
    try {
      const saved = localStorage.getItem('munyaka_staff_prereg');
      if (saved) ledger = JSON.parse(saved);
    } catch { /* ignore */ }
    const next = ledger.length + 7; // start at T007 to avoid colliding with seeded IDs
    return `T${String(next).padStart(3, '0')}`;
  };

  useEffect(() => {
    if (isOpen) {
      generateRandomKey();
      setSelectedStaffId("");
      setSearchQuery("");
      setFormData({
        fullName: "",
        nationalId: "",
        tscNumber: "",
        email: "",
        phone: "",
        systemRole: "subject_teacher",
        assignedSubjects: ["Mathematics", "Science & Tech"],
        tempAccessCode: generateAccessKey(),
        staffId: generateStaffId()
      });
    }
  }, [isOpen]);

  // Handle Selection from Combobox: AUTOFILL
  const handleSelectStaff = (staff: StaffMember) => {
    setSelectedStaffId(staff.id);
    setComboboxOpen(false);

    setFormData(prev => ({
          ...prev,
          fullName: staff?.name ?? "",
          nationalId: staff?.id_no ?? "",
          tscNumber: staff?.tsc_no || "",
          email: staff?.email ?? "",
          phone: staff?.phone ?? "",
          systemRole: mapRoleToSystemRole(staff?.role ?? ""),
          assignedSubjects: staff?.subjects ? staff.subjects : ["Mathematics", "Science & Tech"]
        }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!String(formData.fullName || '').trim() || !String(formData.email || '').trim()) return;
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pre-Register Staff for System Access"
      description="Select staff member from Directory to autofill credentials or enter details manually."
      maxWidth="max-w-2xl"
      footer={
        <div className="flex gap-2 justify-end w-full">
          <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold h-12 px-6">Cancel</Button>
          <Button onClick={handleSubmit} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold h-12 px-8 text-white shadow-lg shadow-indigo-100 gap-2">
            <Sparkles size={18} /> Pre-Authorize Access
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Searchable Combobox Selection */}
        <div className="space-y-2 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-black uppercase tracking-widest text-indigo-900">
              1. Search Staff Directory (Autofill)
            </Label>
            {selectedStaffId && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={13} /> Autofilled from Directory
              </span>
            )}
          </div>

          <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={comboboxOpen}
                className="w-full justify-between h-12 rounded-xl bg-white border-slate-200 text-left font-bold text-slate-800"
              >
                {selectedStaffId ? (
                  <div className="flex items-center gap-2 truncate">
                    <User size={16} className="text-indigo-600 shrink-0" />
                    <span>{formData.fullName || 'Pre-Registered Staff'} ({formData.nationalId || 'No ID'})</span>
                  </div>
                ) : (
                  <span className="text-slate-400 font-normal">Type staff name or National ID to search...</span>
                )}
                <ChevronsUpDown size={16} className="ml-2 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] p-0 rounded-2xl shadow-xl border-slate-200" align="start">
              <Command>
                <CommandInput placeholder="Search by name, ID or role..." className="h-12 font-medium" />
                <CommandList className="max-h-60 p-1">
                  <CommandEmpty className="py-6 text-center text-xs font-bold text-slate-400">
                    No eligible staff found in Directory.
                  </CommandEmpty>
                  <CommandGroup heading="Available Staff Members">
                    {availableStaff.map((staff) => (
                                          <CommandItem
                                            key={staff.id}
                                            value={`${staff?.name ?? ''} ${staff?.id_no ?? ''} ${staff?.email ?? ''}`}
                                            onSelect={() => handleSelectStaff(staff)}
                                            className="rounded-xl p-3 cursor-pointer hover:bg-slate-50 flex items-center justify-between"
                                          >
                                            <div>
                                              <p className="font-bold text-slate-900 text-sm">{staff?.name ?? ''}</p>
                                              <p className="text-xs text-slate-500 font-medium">ID: {staff?.id_no ?? ''} • {staff?.role ?? ''} • {staff?.email ?? ''}</p>
                                            </div>
                                            <Check
                                              className={cn(
                                                "h-4 w-4 text-indigo-600",
                                                selectedStaffId === staff.id ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                          </CommandItem>
                                        ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {availableStaff.length === 0 && (
            <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1 mt-1">
              <Info size={12} /> All staff members in the directory already have pre-registered access records.
            </p>
          )}
        </div>

        {/* Form Inputs (Autofilled or Manual) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Full Name *</Label>
            <Input 
              value={formData.fullName} 
              onChange={e => setFormData({...formData, fullName: e.target.value})} 
              placeholder="e.g. Jane Mwangi" 
              className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-900" 
              required 
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">National ID Number *</Label>
            <Input 
              value={formData.nationalId} 
              onChange={e => setFormData({...formData, nationalId: e.target.value})} 
              placeholder="e.g. 28374615" 
              className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-900" 
              required 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">TSC Number (Optional)</Label>
            <Input 
              value={formData.tscNumber} 
              onChange={e => setFormData({...formData, tscNumber: e.target.value})} 
              placeholder="e.g. TSC-482910" 
              className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-900" 
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">System Access Role *</Label>
            <Select value={formData.systemRole} onValueChange={(val: SystemRole) => setFormData({...formData, systemRole: val})}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-900"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="subject_teacher">Subject Teacher</SelectItem>
                <SelectItem value="class_teacher">Class Teacher</SelectItem>
                <SelectItem value="senior_teacher">Senior Teacher</SelectItem>
                <SelectItem value="head_teacher">Head Teacher</SelectItem>
                <SelectItem value="bursar">Bursar / Accounts</SelectItem>
                <SelectItem value="support_admin">System Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Official Email *</Label>
            <Input 
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              placeholder="e.g. jane@email.com" 
              className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-900" 
              required 
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Phone Number *</Label>
            <Input 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              placeholder="+254..." 
              className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-900" 
              required 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Access Key</Label>
            <div className="flex gap-2">
              <Input value={formData.tempAccessCode} readOnly className="rounded-xl h-12 bg-slate-50 border-none font-black text-center text-indigo-700" />
              <Button type="button" variant="outline" className="h-12 px-3 rounded-xl border-slate-200" onClick={generateRandomKey}><RefreshCw size={16} /></Button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddPreRegModal;