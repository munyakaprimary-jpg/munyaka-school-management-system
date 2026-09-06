"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import BackButton from '@/components/ui/BackButton';
import { Search, Plus, Download, Loader2, X, Eye, Trash2, Lock, AlertCircle, Mail, Copy, Send, Key, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { notifyDataChanged } from '@/utils/storage';
import { PreRegisteredStaff, AccessStatus, SYSTEM_ROLE_LABELS } from '@/types/staff-access';
import { INITIAL_PRE_REGISTERED_STAFF } from '@/lib/mock-staff-access';
import { STAFF } from '@/lib/mock-data';
import AddPreRegModal from '@/components/staff-access/AddPreRegModal';

// Directory staff entry that doesn't have a pre-registration record yet
interface UnlinkedStaffEntry {
  id: string;
  nationalId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  tscNumber?: string;
  source: 'directory' | 'mock';
  autoKey: string; // Auto-generated PR- key reference
}

/**
 * Normalises a name across every possible field variant used in staff records.
 * Falls back to email → phone → "Unnamed Staff" so we always render *something*.
 */
const resolveName = (s: Record<string, unknown>): string => {
  const first = String(s.firstName || (s as any)['first-name'] || (s as any)['first_name'] || '');
  const last  = String(s.lastName  || (s as any)['last-name']  || (s as any)['last_name']  || '');
  return String(
    s.name       || s.fullName || s.full_name ||
    (first || last ? `${first} ${last}`.trim() : null) ||
    s.email      || s.phone    || s.staffId   || 'Unnamed Staff'
  );
};

/** Builds safe display initials from a name string. */
const initialsOf = (name: string): string =>
  name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';

/** Normalises an ID across every possible field variant. */
const resolveId = (s: Record<string, unknown>): string =>
  String(
    (s as any).national_id || (s as any).id_number || (s as any).idNumber ||
    s.nationalId || s.id || s.staffId || ''
  ) || 'N/A';

const StaffPreRegistration = () => {
  const navigate = useNavigate();

  // ── Boot: scrub legacy dummy test entries from the ledger ─────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem('munyaka_staff_prereg');
      if (raw) {
        const parsed: PreRegisteredStaff[] = JSON.parse(raw);
        const before = parsed.length;
        const cleaned = parsed.filter(
          (s) =>
            !/^prereg-\d+$/i.test(s.id) &&
            !/^dummy/i.test(s.fullName || '') &&
            (s.fullName || '').toLowerCase() !== 'pre-registered staff'
        );
        if (cleaned.length < before) {
          localStorage.setItem('munyaka_staff_prereg', JSON.stringify(cleaned));
          setStaffList(cleaned);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const [staffList, setStaffList] = useState<PreRegisteredStaff[]>(() => {
    const saved = localStorage.getItem('munyaka_staff_prereg');
    return saved ? JSON.parse(saved) : INITIAL_PRE_REGISTERED_STAFF;
  });

  // Unified directory staff list — read directly from `munyaka_staff_directory`
  // (the same key Staff.tsx writes to). Falls back to STAFF seed data.
  const [directoryStaff, setDirectoryStaff] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('munyaka_staff_directory');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleteAuthOpen, setIsDeleteAuthOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [generatingKeyFor, setGeneratingKeyFor] = useState<string | null>(null);

  // Auth state for deletion
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // ── Re-read directory staff from localStorage on changes ──
  const refreshDirectory = useCallback(() => {
    try {
      const saved = localStorage.getItem('munyaka_staff_directory');
      setDirectoryStaff(saved ? JSON.parse(saved) : []);
    } catch {
      setDirectoryStaff([]);
    }
  }, []);

  useEffect(() => {
    // Initial read on mount
    refreshDirectory();

    // Listen for staff-directory and data-changed events for live sync
    const handleDirectoryChange = () => {
      refreshDirectory();
      // Also re-read the pre-registration ledger so both views stay in sync
      try {
        const saved = localStorage.getItem('munyaka_staff_prereg');
        if (saved) setStaffList(JSON.parse(saved));
      } catch { /* ignore */ }
    };
    const handleStaffChanged = () => handleDirectoryChange();

    window.addEventListener('munyaka:staff-directory-changed', handleDirectoryChange);
    window.addEventListener('staff-changed', handleStaffChanged);
    window.addEventListener('munyaka:data-changed', handleDirectoryChange);

    return () => {
      window.removeEventListener('munyaka:staff-directory-changed', handleDirectoryChange);
      window.removeEventListener('staff-changed', handleStaffChanged);
      window.removeEventListener('munyaka:data-changed', handleDirectoryChange);
    };
  }, [refreshDirectory]);

  // ── Build unified ledger entries from BOTH the directory and the ledger ──
  // Staff with a PR- entry in the ledger render as "Pre-Registered / Active".
  // Directory staff without a ledger entry are auto-rendered with status
  // "Pre-Registered" and an auto-generated PR- key reference.
  const ledgerEntries = useMemo(() => {
    type Entry =
      | { type: 'pre-registered'; data: PreRegisteredStaff }
      | { type: 'auto-linked'; data: UnlinkedStaffEntry };

    const preRegNatIds = new Set(staffList.map(s => s.nationalId));
        // Safe null-checking: email may be undefined for incomplete records
        const preRegEmails = new Set(staffList.map(s => (s.email || '').toLowerCase()));

    // Build the auto-linked list from BOTH the localStorage directory and the
    // seed STAFF data so seeded personnel like James Ndiki appear too.
    const sourceStaff: UnlinkedStaffEntry[] = [];
    directoryStaff.forEach((s: any) => {
      const natId = s.id_no || s.nationalId;
      const email = (s.email || '').toLowerCase();
      sourceStaff.push({
        id: s.id || natId,
        nationalId: natId,
        name: s.full_name || s.name || '',
        email: s.email || '',
        phone: s.phone || '',
        role: s.role || 'Staff',
        tscNumber: s.tsc_no || s.tscNumber,
        source: 'directory',
        autoKey: `PR-${s.id || natId}`,
      });
    });

    // Seed mock staff (covers personnel like James Ndiki who exist in STAFF)
    STAFF.forEach(s => {
      sourceStaff.push({
        id: s.id,
        nationalId: s.id_no,
        name: s.name || '',
        email: s.email || '',
        phone: s.phone || '',
        role: s.role || 'Staff',
        tscNumber: s.tsc_no,
        source: 'mock',
        autoKey: `PR-${s.id}`,
      });
    });

    // Deduplicate by nationalId (prefer directory over mock)
    const deduped = new Map<string, UnlinkedStaffEntry>();
    sourceStaff.forEach(entry => {
      if (!deduped.has(entry.nationalId)) deduped.set(entry.nationalId, entry);
    });

    const entries: Entry[] = [];

    // 1. Existing pre-registration ledger entries
    staffList.forEach(data => entries.push({ type: 'pre-registered', data }));

    // 2. Directory/mock staff without a ledger entry → auto-render as Pre-Registered
    deduped.forEach(data => {
      const emailLower = (data.email || '').toLowerCase();
      if (!preRegNatIds.has(data.nationalId) && !preRegEmails.has(emailLower)) {
        entries.push({ type: 'auto-linked', data });
      }
    });

    return entries;
  }, [staffList, directoryStaff]);

  // ── Filter the unified ledger entries by search/role/status ──
      // Safe null-checking: every string field is coerced through `String(... || '')`
      // so undefined / null values never throw a TypeError when their string
      // methods (toLowerCase / includes) are called.
      const filteredLedger = useMemo(() => {
        const needle = String(searchTerm || '').toLowerCase();
        return ledgerEntries.filter(entry => {
          const isPreReg = entry.type === 'pre-registered';
          const name = isPreReg
            ? (entry.data as PreRegisteredStaff).fullName
            : (entry.data as UnlinkedStaffEntry).name;
          const natId = isPreReg
            ? (entry.data as PreRegisteredStaff).nationalId
            : (entry.data as UnlinkedStaffEntry).nationalId;
          const email = isPreReg
            ? (entry.data as PreRegisteredStaff).email
            : (entry.data as UnlinkedStaffEntry).email;
  
          const matchesSearch =
            String(name || '').toLowerCase().includes(needle) ||
            String(natId || '').toLowerCase().includes(needle) ||
            String(email || '').toLowerCase().includes(needle);
  
          const matchesRole = roleFilter === 'all' ||
            (isPreReg ? (entry.data as PreRegisteredStaff).systemRole === roleFilter : false);
  
          const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'Active' && isPreReg && (entry.data as PreRegisteredStaff).status === 'Active') ||
            (statusFilter === 'Pre-Registered' && isPreReg && (entry.data as PreRegisteredStaff).status === 'Pre-Registered') ||
            (statusFilter === 'Unlinked' && !isPreReg) ||
            (statusFilter === 'Suspended' && isPreReg && (entry.data as PreRegisteredStaff).status === 'Suspended');
  
          return matchesSearch && matchesRole && matchesStatus;
        });
      }, [ledgerEntries, searchTerm, roleFilter, statusFilter]);
  
    // ── Generate Key / Invite for unlinked directory staff ──
    const handleGenerateKeyAndInvite = async (entry: UnlinkedStaffEntry) => {
      setGeneratingKeyFor(entry.id);
      await new Promise(r => setTimeout(r, 500)); // Brief delay for UX
  
      const accessCode = `MUNYAKA-${Math.floor(1000 + Math.random() * 9000)}`;
      const newPreReg: PreRegisteredStaff = {
        id: `PR-${Date.now()}`,
        staffId: `T${String(staffList.length + 7).padStart(3, '0')}`,
        fullName: entry.name,
        nationalId: entry.nationalId,
        tscNumber: entry.tscNumber,
        email: entry.email,
        phone: entry.phone,
        systemRole: 'subject_teacher',
        department: 'School Administration',
        assignedSubjects: [],
        tempAccessCode: accessCode,
        status: 'Pre-Registered',
        datePreRegistered: new Date().toISOString().split('T')[0],
      };
  
      const updatedList = [newPreReg, ...staffList];
            setStaffList(updatedList);
            localStorage.setItem('munyaka_staff_prereg', JSON.stringify(updatedList));
      
            // Mirror into munyaka_staff_directory so the Dashboard + Staff.tsx
            // both reflect this newly pre-registered record.
            try {
              const savedDir = localStorage.getItem('munyaka_staff_directory');
              const dir: any[] = savedDir ? JSON.parse(savedDir) : [];
              const directoryEntry = {
                id: newPreReg.id,
                id_no: newPreReg.nationalId,
                full_name: newPreReg.fullName,
                role: (newPreReg.systemRole || 'TEACHER').replace('_', ' ').toUpperCase(),
                systemRole: newPreReg.systemRole,
                department: newPreReg.department || 'School Administration',
                phone: newPreReg.phone,
                email: newPreReg.email,
                status: newPreReg.status,
                is_active: 0,
                tsc_no: newPreReg.tscNumber,
              };
              if (!dir.some(e => e.id === directoryEntry.id)) {
                dir.unshift(directoryEntry);
              }
              localStorage.setItem('munyaka_staff_directory', JSON.stringify(dir));
            } catch (err) {
              console.error('[StaffPreRegistration] Failed to mirror directory:', err);
            }
      
            notifyDataChanged('munyaka_staff_prereg');
            notifyDataChanged('munyaka_staff_directory');
      setGeneratingKeyFor(null);
      showSuccess(`Access key generated for "${entry.name}"! Invite dispatched.`);
    };
  
    const handleAddStaff = (staffData: Partial<PreRegisteredStaff>) => {
          const newStaff: PreRegisteredStaff = {
            id: `PR-${Date.now()}`,
            staffId: staffData.staffId || `T${String(staffList.length + 7).padStart(3, '0')}`,
            fullName: staffData.fullName || "",
            nationalId: staffData.nationalId || "",
            tscNumber: staffData.tscNumber,
            email: staffData.email || "",
            phone: staffData.phone || "",
            systemRole: staffData.systemRole || "subject_teacher",
            department: (staffData as any).department || "",
            assignedGrade: staffData.assignedGrade,
            assignedStream: staffData.assignedStream,
            assignedSubjects: staffData.assignedSubjects || [],
            tempAccessCode: staffData.tempAccessCode || "",
            status: "Pre-Registered" as AccessStatus,
            datePreRegistered: new Date().toISOString().split('T')[0],
          };
    
          const updatedList = [newStaff, ...staffList];
          setStaffList(updatedList);
          localStorage.setItem('munyaka_staff_prereg', JSON.stringify(updatedList));
    
          // Also write to `munyaka_staff_directory` so that:
          //   (a) `useCentralData` / Dashboard sees the new staff immediately
          //   (b) `Staff.tsx` directory merges include this record without a
          //       page-reload gap
          try {
            const savedDir = localStorage.getItem('munyaka_staff_directory');
            const dir: any[] = savedDir ? JSON.parse(savedDir) : [];
            const directoryEntry = {
              id: newStaff.id,
              id_no: newStaff.nationalId,
              full_name: newStaff.fullName,
              role: (newStaff.systemRole || 'TEACHER').replace('_', ' ').toUpperCase(),
              systemRole: newStaff.systemRole,
              department: newStaff.department || 'School Administration',
              phone: newStaff.phone,
              email: newStaff.email,
              status: newStaff.status,
              is_active: 0,
              tsc_no: newStaff.tscNumber,
            };
            // Avoid duplicates (idempotent)
            if (!dir.some(e => e.id === directoryEntry.id)) {
              dir.unshift(directoryEntry);
            }
            localStorage.setItem('munyaka_staff_directory', JSON.stringify(dir));
          } catch (err) {
            console.error('[StaffPreRegistration] Failed to update staff directory:', err);
          }
    
          notifyDataChanged('munyaka_staff_prereg');
          notifyDataChanged('munyaka_staff_directory');
          setIsAddModalOpen(false);
          showSuccess(`Staff member "${newStaff.fullName}" pre-registered successfully!`);
        };

  const requestDelete = (staff: PreRegisteredStaff) => {
    setDeleteTarget({ id: staff.id, name: staff.fullName });
    setAuthPassword("");
    setAuthError("");
    setIsDeleteAuthOpen(true);
  };

  const handleVerifyAuth = async () => {
    if (!String(authPassword || '').trim()) {
          setAuthError("Password is required");
          return;
        }

    setIsVerifying(true);
    setAuthError("");
    
    await new Promise(r => setTimeout(r, 600));

    const currentAdminPass = localStorage.getItem('munyaka_admin_pass') || 'munyaka5239';

    if (authPassword === currentAdminPass) {
      if (deleteTarget) {
        const updatedList = staffList.filter(s => s.id !== deleteTarget.id);
        setStaffList(updatedList);
        localStorage.setItem('munyaka_staff_prereg', JSON.stringify(updatedList));
        notifyDataChanged('munyaka_staff_prereg');
        showSuccess(`Staff "${deleteTarget.name}" deleted successfully.`);
      }
      setIsDeleteAuthOpen(false);
      setDeleteTarget(null);
      setAuthPassword("");
    } else {
      setAuthError("Invalid admin password");
      showError("Authorization failed");
      setAuthPassword("");
    }
    setIsVerifying(false);
  };

  const handleExportCSV = () => {
      if (filteredLedger.length === 0) {
        showSuccess("No records found for the current filters.");
        return;
      }
  
      setIsExporting(true);
  
      setTimeout(() => {
        const headers = ["Staff Ref ID", "Full Name", "National ID", "Email", "Role / System Role", "Access Key", "Status"];
        const rows = filteredLedger.map(entry => {
          if (entry.type === 'pre-registered') {
            const s = entry.data as PreRegisteredStaff;
            return [
              s.id,
              s.fullName,
              s.nationalId,
              s.email,
              s.systemRole,
              s.tempAccessCode,
              s.status
            ];
          } else {
            const s = entry.data as UnlinkedStaffEntry;
            return [
              s.autoKey,
              s.name,
              s.nationalId,
              s.email,
              s.role,
              s.autoKey + ' (auto-generated)',
              'Pre-Registered'
            ];
          }
        });
  
        const csvContent = [
          "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
          "P.O. BOX 5239-30100,ELDORET",
          "MOTTO: KNOWLEDGE POWER",
          "",
          headers.join(","),
          ...rows.map(r => r.join(","))
        ].join("\n");
  
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `staff_access_master_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
  
        setIsExporting(false);
        showSuccess(`Exported ${filteredLedger.length} staff records to CSV`);
      }, 800);
    };

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div className="flex items-center gap-3">
          <BackButton fallback="/staff" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff Pre-Registration</h1>
            <p className="text-muted-foreground">Pre-authorize teacher system access credentials and manage activation keys.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="h-11 px-5 rounded-2xl border-slate-200 bg-white text-sm font-bold gap-2 shadow-sm hover:bg-slate-50 transition-colors"
            onClick={handleExportCSV}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            Export CSV
          </Button>
          
          <Button
            variant="default"
            className="h-11 px-6 rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold gap-2 transition-all active:scale-95"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={18} /> Onboard Staff
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search by name/ID..." 
              className="pl-11 h-12 rounded-2xl border-none bg-slate-50 font-medium" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Role</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">All System Roles</SelectItem>
                {Object.keys(SYSTEM_ROLE_LABELS).map(role => (
                  <SelectItem key={role} value={role}>
                    {SYSTEM_ROLE_LABELS[role as keyof typeof SYSTEM_ROLE_LABELS].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Pre-Registered">Pre-Registered</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
                <SelectItem value="Unlinked">Unlinked (No Key)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            variant="ghost" 
            className="h-12 rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 gap-2 font-bold transition-colors"
            onClick={clearFilters}
          >
            <X size={18} /> Clear Filters
          </Button>
        </div>
      </Card>

      {/* Staff Table Section */}
      <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
        <CardHeader className="p-8 border-b flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Access Master Ledger</CardTitle>
                    <p className="text-sm text-slate-500 font-medium">Pre-approved credentials, activation keys, and unlinked personnel directory.</p>
                  </div>
          <Badge className="bg-indigo-50 text-indigo-700 border-none font-bold px-4 py-1.5 rounded-xl">
                      {filteredLedger.length} Records
                    </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-slate-500 bg-slate-50/50 border-b">
                <tr>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Staff Credentials</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">System Role</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Registered Email</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Temp Access Key</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Status</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                              {filteredLedger.map((entry) => {
                                if (entry.type === 'pre-registered') {
                                                                                                  const staff = entry.data;
                                                                                                  const roleInfo = SYSTEM_ROLE_LABELS[staff.systemRole] || SYSTEM_ROLE_LABELS.subject_teacher;
                                                                                                  const displayName = resolveName(staff as any);
                                                                                                  const avatarInitials = initialsOf(displayName);
                                                                                                  const displayId = resolveId(staff as any);
                                                                                                  const displayRole = roleInfo.label || 'Pending Assignment';
                                                                                                  const displayEmail = staff.email || 'No Email Provided';
                                                                                                  return (
                                                                                                    <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                                                                                                      <td className="px-8 py-5">
                                                                                                        <div className="flex items-center gap-3">
                                                                                                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                                                                            {avatarInitials}
                                                                                                          </div>
                                                                                                          <div className="flex flex-col min-w-0">
                                                                                                            <p className="font-bold text-slate-900 whitespace-nowrap">{displayName}</p>
                                                                                                            <p className="text-xs text-slate-400 font-medium whitespace-nowrap">Ref: {staff.id || staff.ref || 'N/A'} • ID: {displayId}</p>
                                                                                                          </div>
                                                                                                        </div>
                                                                                                      </td>
                                                                      <td className="px-8 py-5">
                                                                        <Badge className={`rounded-xl font-bold border text-xs px-3 py-1 ${roleInfo.badgeBg} ${roleInfo.color}`}>{displayRole}</Badge>
                                                                      </td>
                                                                      <td className="px-8 py-5">
                                                                                                                                              <div className="flex items-center gap-2 text-slate-700">
                                                                                                                                                <Mail size={14} className="text-slate-400 shrink-0" />
                                                                                                                                                <span className="font-medium truncate max-w-[200px]">{displayEmail}</span>
                                                                                                                                              </div>
                                                                                                                                            </td>
                                                                                                                                            <td className="px-8 py-5 text-center">
                                                                                                                                              <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer" onClick={() => {
                                                                          navigator.clipboard.writeText(staff.tempAccessCode);
                                                                          showSuccess(`Copied Key: ${staff.tempAccessCode}`);
                                                                        }}>
                                                                          <code className="font-bold text-slate-800 text-xs">{staff.tempAccessCode}</code>
                                                                          <Copy size={13} className="text-slate-400" />
                                                                        </div>
                                                                      </td>
                                                                      <td className="px-8 py-5 text-center">
                                                                        <Badge className={`rounded-xl border-none font-bold text-xs px-3 py-1 ${staff.status === 'Active' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{staff.status}</Badge>
                                                                      </td>
                                                                      <td className="px-8 py-5 text-right">
                                                                        <div className="flex items-center justify-end gap-1.5">
                                                                          <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-9 px-3 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 gap-1.5"
                                                                            onClick={() => showSuccess(`Access key ${staff.tempAccessCode} dispatched to ${staff.email}`)}
                                                                          >
                                                                            <Send size={14} /> Send Key
                                                                          </Button>
                                                                          <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                                                            onClick={() => requestDelete(staff)}
                                                                            title="Delete Pre-Registration"
                                                                          >
                                                                            <Trash2 size={16} />
                                                                          </Button>
                                                                        </div>
                                                                      </td>
                                                                    </tr>
                                                                  );
                                                                }
              
                                // Auto-linked directory staff (no ledger entry yet)
                                                                                                const unlinked = entry.data;
                                                                                                const displayName = resolveName(unlinked as any);
                                                                                                const avatarInitials = initialsOf(displayName);
                                                                                                const displayId = resolveId(unlinked as any);
                                                                                                const displayRole = unlinked.role || 'Pending Assignment';
                                                                                                const displayEmail = unlinked.email || 'No Email Provided';
                                                                                                return (
                                                                                                  <tr key={`auto-${unlinked.id}`} className="hover:bg-amber-50/40 transition-colors">
                                                                                                    <td className="px-8 py-5">
                                                                                                      <div className="flex items-center gap-3">
                                                                                                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                                                                          {avatarInitials}
                                                                                                        </div>
                                                                                                        <div className="flex flex-col min-w-0">
                                                                                                          <p className="font-bold text-slate-900 whitespace-nowrap">{displayName}</p>
                                                                                                          <p className="text-xs text-slate-400 font-medium whitespace-nowrap">Ref: {unlinked.id || 'N/A'} • ID: {displayId}</p>
                                                                                                        </div>
                                                                                                      </div>
                                                                                                    </td>
                                                                                                    <td className="px-8 py-5">
                                                                                                      <Badge className="rounded-xl font-bold border text-xs px-3 py-1 bg-slate-100 text-slate-700 border-slate-200">
                                                                                                        {displayRole}
                                                                                                      </Badge>
                                                                                                    </td>
                                                                                                    <td className="px-8 py-5">
                                                                                                      <div className="flex items-center gap-2 text-slate-700">
                                                                                                        <Mail size={14} className="text-slate-400 shrink-0" />
                                                                                                        <span className="font-medium truncate max-w-[200px]">{displayEmail}</span>
                                                                                                      </div>
                                                                                                    </td>
                                                                    <td className="px-8 py-5 text-center">
                                                                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-400 text-xs font-bold border border-dashed border-slate-200">
                                                                        <Key size={12} /> {unlinked.autoKey}
                                                                      </span>
                                                                    </td>
                                                                    <td className="px-8 py-5 text-center">
                                                                      <Badge className="rounded-xl border-none font-bold text-xs px-3 py-1 bg-rose-50 text-rose-700">
                                                                        Pre-Registered
                                                                      </Badge>
                                                                    </td>
                                                                    <td className="px-8 py-5 text-right">
                                                                      <div className="flex items-center justify-end gap-1.5">
                                                                        <Button
                                                                          variant="ghost"
                                                                          size="sm"
                                                                          className="h-9 px-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 gap-1.5 shadow-md shadow-indigo-100"
                                                                          disabled={generatingKeyFor === unlinked.id}
                                                                          onClick={() => handleGenerateKeyAndInvite(unlinked)}
                                                                          title="Generate Key / Invite"
                                                                        >
                                                                          {generatingKeyFor === unlinked.id ? (
                                                                            <Loader2 className="animate-spin" size={14} />
                                                                          ) : (
                                                                            <Sparkles size={14} />
                                                                          )}
                                                                          Generate Key / Invite
                                                                        </Button>
                                                                      </div>
                                                                    </td>
                                                                  </tr>
                                                                );
                              })}
                              {filteredLedger.length === 0 && (
                                <tr>
                                  <td colSpan={6} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                      <Users size={32} className="text-slate-200" />
                                      <p className="text-slate-500 font-bold">No personnel records match the current filters.</p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Staff Modal */}
      <AddPreRegModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddStaff}
        existingPreRegistered={staffList}
      />

      {/* Admin Auth Modal for Deletion */}
      <Modal
        isOpen={isDeleteAuthOpen}
        onClose={() => setIsDeleteAuthOpen(false)}
        title="Admin Authorization Required"
        description={`Enter your admin password to delete "${deleteTarget?.name}".`}
        footer={
          <>
            <Button variant="ghost" className="rounded-xl font-bold flex-1" onClick={() => setIsDeleteAuthOpen(false)}>Cancel</Button>
            <Button 
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex-1" 
              onClick={handleVerifyAuth}
              disabled={isVerifying}
            >
              {isVerifying ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Authorize Delete
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {authError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold animate-in slide-in-from-top-2">
              <AlertCircle size={14} /> {authError}
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Admin Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                type="password" 
                value={authPassword} 
                onChange={(e) => { setAuthPassword(e.target.value); setAuthError(""); }} 
                placeholder="••••••••" 
                className="pl-10 rounded-xl h-12 bg-slate-50 border-none font-bold"
                autoFocus
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StaffPreRegistration;