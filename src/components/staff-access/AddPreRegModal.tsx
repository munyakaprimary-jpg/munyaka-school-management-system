"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Sparkles, Check, ChevronsUpDown, User, Info, CheckCircle2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { SystemRole, PreRegisteredStaff } from '@/types/staff-access';
import { centralGetStaff } from "@/hooks/useCentralData";
import { generateAccessKey } from "@/services/staffAccessService";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface AddPreRegModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<PreRegisteredStaff>) => void;
  existingPreRegistered?: PreRegisteredStaff[];
  existingNatIds?: Set<string>;
  existingEmails?: Set<string>;
}

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

  const directoryStaffList = useMemo<DirectoryStaffItem[]>(() => {
    const list = centralGetStaff();
    return (Array.isArray(list) ? list : []).map((s: any) => ({
      id: s.id || `T00${Math.floor(Math.random() * 900) + 100}`,
      name: s.name || s.fullName || 'Staff Member',
      nationalId: s.nationalId || '',
      email: s.email || '',
      phone: s.phone || '',
      tscNumber: s.tscNumber || '',
      systemRole: s.systemRole || s.role || 'subject_teacher',
      subjects: s.assignedSubjects || s.subjects || [],
    }));
  }, [isOpen]);

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
    const master = centralGetStaff();
    const next = master.length + 7;
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
      assignedSubjects: ["Mathematics", "Science & Tech"],
      tempAccessCode: generateAccessKey(),
      staffId: generateStaffId()
    });
  }, [isOpen]);

  const handleSelectStaffMember = (staffId: string) => {
    setSelectedStaffId(staffId);
    const found = directoryStaffList.find(s => s.id === staffId);
    if (found) {
      setFormData({
        fullName: found.name,
        nationalId: found.nationalId || "",
        tscNumber: found.tscNumber || "",
        email: found.email || "",
        phone: found.phone || "",
        systemRole: mapRoleToSystemRole(found.systemRole),
        assignedSubjects: found.subjects.length > 0 ? found.subjects : ["Mathematics", "Science & Tech"],
        tempAccessCode: formData.tempAccessCode || generateAccessKey(),
        staffId: found.id
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pre-Register Staff Access">
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="space-y-2">
          <Label>Select from Staff Directory (Optional)</Label>
          <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={comboboxOpen}
                className="w-full justify-between font-normal"
              >
                {selectedStaffId
                  ? directoryStaffList.find((s) => s.id === selectedStaffId)?.name
                  : "Search directory staff..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search name or TSC..." value={searchQuery} onValueChange={setSearchQuery} />
                <CommandList>
                  <CommandEmpty>No available staff found in directory.</CommandEmpty>
                  <CommandGroup>
                    {availableStaff.map((staff) => (
                      <CommandItem
                        key={staff.id}
                        value={`${staff.name} ${staff.tscNumber} ${staff.email}`}
                        onSelect={() => {
                          handleSelectStaffMember(staff.id);
                          setComboboxOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedStaffId === staff.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{staff.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {staff.tscNumber ? `TSC: ${staff.tscNumber}` : staff.email || staff.id}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. Jane Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staffId">Staff ID / Code</Label>
            <Input
              id="staffId"
              value={formData.staffId}
              onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
              placeholder="e.g. T001"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tscNumber">TSC Number</Label>
            <Input
              id="tscNumber"
              value={formData.tscNumber}
              onChange={(e) => setFormData({ ...formData, tscNumber: e.target.value })}
              placeholder="e.g. TSC123456"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationalId">National ID</Label>
            <Input
              id="nationalId"
              value={formData.nationalId}
              onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
              placeholder="e.g. 31234567"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="staff@munyaka.ac.ke"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0712345678"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="systemRole">System Role</Label>
          <Select
            value={formData.systemRole}
            onValueChange={(val) => setFormData({ ...formData, systemRole: val as SystemRole })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select system role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="head_teacher">Head Teacher</SelectItem>
              <SelectItem value="senior_teacher">Senior Teacher</SelectItem>
              <SelectItem value="class_teacher">Class Teacher</SelectItem>
              <SelectItem value="subject_teacher">Subject Teacher</SelectItem>
              <SelectItem value="bursar">Bursar / Accounts</SelectItem>
              <SelectItem value="support_admin">Support Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 bg-muted/50 p-3 rounded-lg border">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Generated Temporary Access Key</Label>
            <Button type="button" variant="ghost" size="sm" onClick={generateRandomKey} className="h-7 text-xs">
              <RefreshCw className="h-3 w-3 mr-1" /> Regenerate
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={formData.tempAccessCode}
              onChange={(e) => setFormData({ ...formData, tempAccessCode: e.target.value })}
              className="font-mono font-bold text-center tracking-widest text-primary bg-background"
              required
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Provide this access key to the staff member. They will be required to enter it upon first login.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            <CheckCircle2 className="h-4 w-4 mr-2" /> Save &amp; Pre-Register
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddPreRegModal;
