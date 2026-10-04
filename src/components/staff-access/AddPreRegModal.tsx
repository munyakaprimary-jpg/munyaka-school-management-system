"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Sparkles, Check, ChevronsUpDown, User, Info, CheckCircle2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { getStaffMaster } from "@/services/staffMasterService";
import { SystemRole, PreRegisteredStaff } from '@/types/staff-access';
import { readGradesAndStreams, getStreamsForGrade } from "@/services/gradesStreamsConfig";
import { generateAccessKey } from "@/services/staffAccessService";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface AddPreRegModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<PreRegisteredStaff>) => void;
  /** Staff already in staffMasterService — used to filter duplicates */
  existingPreRegistered?: PreRegisteredStaff[];
  existingNatIds?: Set<string>;
  /** Emails already in staffMasterService */
  existingEmails?: Set<string>;
}

// Combobox item derived from a MasterStaffRecord
interface DirectoryStaffItem {
  id: string;
  name: string;
  nationalId: string;
  email: string;
  phone: string;
  tscNumber?: string;
  systemRole: string;
  subjects: string[];
}

const mapRoleToSystemRole = (role: string): SystemRole => {
  const normalized = (role || '').toLowerCase();
  if (normalized.includes('head') || normalized.includes('principal')) return 'head_teacher';
  if (normalized.includes('senior')) return 'senior_teacher';
  if (normalized.includes('class')) return 'class_teacher';
  if (normalized.includes('bursar') || normalized.includes('account')) return 'bursar';
  if (normalized.includes('admin')) return 'support_admin';
  return 'subject_teacher';
};

const AddPreRegModal = ({
  isOpen,
  onClose,
  onSubmit,
  existingPreRegistered = [],
  existingNatIds = new Set(),
  existingEmails = new Set(),
}: AddPreRegModalProps) => {
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
    const [gradesStreamsConfig, setGradesStreamsConfig] = useState<{ grades: string[]; streams: string[]; gradeStreamMap: Record<string, string[]> }>({ grades: [], streams: [], gradeStreamMap: {} });
  
    const [formData, setFormData] = useState({
    fullName: "",
    nationalId: "",
    tscNumber: "",
    email: "",
    phone: "",
    systemRole: "Class Teacher" as string,
    assignedGrade: "Grade 4",
    assignedStream: "Green",
    assignedClassId: "grade-4",
    assignedStreamId: "green",
    assignedSubjects: ["Mathematics", "Science & Tech"],
    tempAccessCode: "",
    staffId: ""
  });

  // ── Directory staff sourced exclusively from staffMasterService ───────────────
  const directoryStaffList = useMemo<DirectoryStaffItem[]>(() => {
    return getStaffMaster().map(r => ({
      id: r.id,
      name: r.name,
      nationalId: r.nationalId,
      email: r.email,
      phone: r.phone,
      tscNumber: r.tscNumber,
      systemRole: r.systemRole,
      subjects: r.assignedSubjects ?? [],
    }));
  }, [isOpen]); // re-read every time modal opens

  // Exclude staff who already have a pre-registration record
  const availableStaff = useMemo(() => {
    return directoryStaffList.filter(s => {
      const alreadyExists = existingPreRegistered.some(p =>
        (s.nationalId && p.nationalId === s.nationalId) ||
        (s.email && p.email?.toLowerCase() === s.email?.toLowerCase()) ||
        (p.fullName?.toLowerCase() === s.name?.toLowerCase()) ||
        (p.staffId && s.id && p.staffId === s.id)
      );
      return !alreadyExists;
    });
  }, [directoryStaffList, existingPreRegistered]);

  const generateRandomKey = () => {
    setFormData(prev => ({ ...prev, tempAccessCode: generateAccessKey() }));
  };

  const generateStaffId = () => {
    const master = getStaffMaster();
    const next = master.length + 7; // start at T007 to avoid collisions
    return `T${String(next).padStart(3, '0')}`;
  };

  useEffect(() => {
  if (!isOpen) return;
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
    assignedGrade: "Grade 4",
    assignedStream: "Green",
    assignedClassId: "grade-4",
    assignedStreamId: "green",
    assignedSubjects: ["Mathematics", "Science & Tech"],
    tempAccessCode: generateAccessKey(),
    staffId: generateStaffId()
  });
}, [isOpen]);

  // Autofill from combobox selection
  const handleSelectStaff = (staff: DirectoryStaffItem) => {
    setSelectedStaffId(staff.id);
    setComboboxOpen(false);
    setFormData(prev => ({
      ...prev,
      fullName: staff.name,
      nationalId: staff.nationalId,
      tscNumber: staff.tscNumber || "",
      email: staff.email,
      phone: staff.phone,
      systemRole: mapRoleToSystemRole(staff.systemRole),
      assignedSubjects: staff.subjects.length > 0 ? staff.subjects : ["Mathematics", "Science & Tech"],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!String(formData.fullName || '').trim() || !String(formData.email || '').trim()) return;
    onSubmit({
      ...formData,
      systemRole: (formData.systemRole === 'Class Teacher' ? 'class_teacher' : formData.systemRole) as SystemRole
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pre-Register Staff for System Access"
      description="Select staff from the Directory to autofill credentials, or enter details manually."
      maxWidth="max-w-2xl"
      footer={
        <div className="flex gap-2 justify-end w-full">
          <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold h-12 px-6">Cancel</Button>
          <Button onClick={handleSubmit}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold h-12 px-8 text-white shadow-lg shadow-indigo-100 gap-2">
            <Sparkles size={18} /> Pre-Authorize Access
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Searchable Combobox */}
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
                  <span className="text-slate-400 font-normal">Type staff name or National ID to search…</span>
                )}
                <ChevronsUpDown size={16} className="ml-2 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] p-0 rounded-2xl shadow-xl border-slate-200" align="start">
              <Command>
                <CommandInput placeholder="Search by name, ID or role…" className="h-12 font-medium"
                  value={searchQuery} onValueChange={setSearchQuery} />
                <CommandList className="max-h-60 p-1">
                  <CommandEmpty className="py-6 text-center text-xs font-bold text-slate-400">
                    No eligible staff found in Directory.
                  </CommandEmpty>
                  <CommandGroup heading="Available Staff Members">
                    {availableStaff.map(staff => (
                      <CommandItem
                        key={staff.id}
                        value={`${staff.name} ${staff.nationalId} ${staff.email}`}
                        onSelect={() => handleSelectStaff(staff)}
                        className="rounded-xl p-3 cursor-pointer hover:bg-slate-50 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{staff.name}</p>
                          <p className="text-xs text-slate-500 font-medium">
                            ID: {staff.nationalId} &bull; {staff.systemRole} &bull; {staff.email}
                          </p>
                        </div>
                        <Check className={cn("h-4 w-4 text-indigo-600", selectedStaffId === staff.id ? "opacity-100" : "opacity-0")} />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {availableStaff.length === 0 && (
            <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1 mt-1">
              <Info size={12} /> All staff in the directory already have pre-registered access records.
            </p>
          )}
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Full Name *</Label>
            <Input value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. Jane Mwangi" className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-900" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">National ID Number *</Label>
            <Input value={formData.nationalId} onChange={e => setFormData({ ...formData, nationalId: e.target.value })}
              placeholder="e.g. 28374615" className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-900" required />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">TSC Number (Optional)</Label>
            <Input value={formData.tscNumber} onChange={e => setFormData({ ...formData, tscNumber: e.target.value })}
              placeholder="e.g. TSC-482910" className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-900" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">System Access Role *</Label>
            <Select value={formData.systemRole} onValueChange={(val: string) => setFormData({ ...formData, systemRole: val })}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-900"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="subject_teacher">Subject Teacher</SelectItem>
                <SelectItem value="class_teacher">Class Teacher</SelectItem>
                <SelectItem value="Class Teacher">Class Teacher (Display)</SelectItem>
                <SelectItem value="senior_teacher">Senior Teacher</SelectItem>
                <SelectItem value="head_teacher">Head Teacher</SelectItem>
                <SelectItem value="bursar">Bursar / Accounts</SelectItem>
                <SelectItem value="support_admin">System Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Conditional Stream & Grade Selector for Class Teachers */}
        {(formData.systemRole === 'Class Teacher' || formData.systemRole === 'class_teacher' || String(formData.systemRole).toLowerCase().includes('class')) && (
          <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4 min-h-[110px]">
            <h4 className="text-xs font-black uppercase text-indigo-900 tracking-wider flex items-center gap-1.5">
              <span>🏫 Assign Class & Stream *</span>
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Grade / Class</Label>
                {(() => {
                  const config = readGradesAndStreams();
                  const gradesList = config.grades.length > 0 ? config.grades : ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"];
                  return (
                    <Select
                      value={formData.assignedGrade}
                      onValueChange={val => {
                        setFormData(prev => ({
                          ...prev,
                          assignedGrade: val,
                          assignedClassId: val.toLowerCase().replace(/\s+/g, '-')
                        }));
                      }}
                    >
                      <SelectTrigger className="rounded-xl h-11 bg-white border-slate-200 font-bold text-slate-900"><SelectValue placeholder="Select grade" /></SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {gradesList.map((g: string) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                })()}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Stream</Label>
                {(() => {
                  const config = readGradesAndStreams();
                  const rawStreams = getStreamsForGrade(formData.assignedGrade, config);
                  const availableStreams = rawStreams.length > 0 ? rawStreams : (config.streams.length > 0 ? config.streams : ["Green", "Blue", "Gold", "Red", "North", "East"]);
                  return (
                    <Select
                      value={formData.assignedStream}
                      onValueChange={val => {
                        setFormData(prev => ({
                          ...prev,
                          assignedStream: val,
                          assignedStreamId: val.toLowerCase()
                        }));
                      }}
                    >
                      <SelectTrigger className="rounded-xl h-11 bg-white border-slate-200 font-bold text-slate-900">
                        <SelectValue placeholder={!formData.assignedGrade ? "Select grade first..." : (availableStreams.length === 0 ? "(No streams configured)" : "Choose stream...")} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {availableStreams.length === 0 ? (
                          <div className="py-2 px-3 text-xs text-slate-400 text-center font-medium">(No streams configured)</div>
                        ) : (
                          availableStreams.map((streamName: string) => {
                            const cleanName = streamName.replace(/stream/gi, '').trim() || streamName;
                            const displayLabel = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
                            return (
                              <SelectItem key={streamName} value={streamName}>
                                {displayLabel}
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Official Email *</Label>
            <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. jane@email.com" className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-900" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Phone Number *</Label>
            <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+254…" className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-900" required />
          </div>
        </div>

        {/* Access Key — always MUNYAKA-XXXX, generated via staffAccessService */}
        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Access Key</Label>
          <div className="flex gap-2">
            <Input value={formData.tempAccessCode} readOnly
              className="rounded-xl h-12 bg-slate-50 border-none font-black text-center text-indigo-700" />
            <Button type="button" variant="outline" className="h-12 px-3 rounded-xl border-slate-200" onClick={generateRandomKey}>
              <RefreshCw size={16} />
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddPreRegModal;
