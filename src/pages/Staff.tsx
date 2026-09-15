"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import BackButton from '@/components/ui/BackButton';
import {
  UserPlus, Phone, Mail, Briefcase, MoreHorizontal, Search,
  Eye, Edit, Key, ShieldCheck, UserCheck, Clock, Plus,
  X, Save, AlertCircle, Users, Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { showSuccess, showError, dismissToast } from '@/utils/toast';
import {
  getStaffMaster,
  addStaffMaster,
  updateStaffMaster,
  activateStaffMaster,
  bulkActivateStaffMaster,
  initializeStaffMaster,
  TEACHING_SYSTEM_ROLES,
  mapDesignationToSystemRole,
  isNonTeachingDesignation,
  isLibrarianDesignation,
  type MasterStaffRecord,
  type MasterSystemRole,
} from '@/services/staffMasterService';
import { DualScrollContainer } from '@/hooks/useHorizontalScroll';
import { SYSTEM_ROLE_LABELS } from '@/types/staff-access';

const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

interface StaffMember {
  id: string;
  id_no: string;
  staff_id?: string;
  ref?: string;
  access_key?: string;
  tsc_no?: string;
  full_name: string;
  role: string;
  systemRole?: string;
  subjects: string[];
  phone: string;
  email: string;
  status: 'Active' | 'Pre-Registered' | 'Suspended';
  joined: string;
  department: string;
}

const systemRoleToLabel: Record<string, string> = {
  head_teacher:   'Head Teacher',
  senior_teacher: 'Senior Teacher',
  class_teacher:  'Class Teacher',
  subject_teacher: 'Subject Teacher',
  bursar:         'Bursar',
  support_admin:   'System Admin',
};

// Helper to get default department based on system role
const getDepartmentForRole = (systemRole: string): string => {
  switch (systemRole) {
    case 'librarian': return 'Library';
    case 'bursar': return 'Finance';
    case 'storekeeper': return 'Procurement';
    case 'lab_assistant': return 'Science';
    case 'ict_technician': return 'ICT';
    case 'support_staff': return 'Administration';
    case 'support_admin': return 'Administration';
    default: return 'School Administration';
  }
};

function masterToStaffMember(r: MasterStaffRecord): StaffMember {
  return {
    id: r.id,
    id_no: r.nationalId,
    staff_id: r.staffId,
    access_key: r.tempAccessCode,
    tsc_no: r.tscNumber,
    full_name: r.name,
    role: r.role || SYSTEM_ROLE_LABELS[r.systemRole]?.label || 'Teacher',
    systemRole: r.systemRole,
    subjects: r.assignedSubjects ?? [],
    phone: r.phone,
    email: r.email,
    status: (r.status === 'Active' ? 'Active' : r.status === 'Suspended' ? 'Suspended' : 'Pre-Registered') as StaffMember['status'],
    joined: r.joinedDate || '',
    department: r.department || 'School Administration',
  };
}

const Staff = () => {
  const navigate = useNavigate();

  // ── Source of truth: staffMasterService ─────────────────────────────────────
  const [masterRecords, setMasterRecords] = useState<MasterStaffRecord[]>([]);

  useEffect(() => {
    initializeStaffMaster();
    setMasterRecords(getStaffMaster());
  }, []);

  // Keep in sync with mutations from any component
  useEffect(() => {
    const refresh = () => setMasterRecords(getStaffMaster());
    window.addEventListener('staff-changed', refresh);
    window.addEventListener('munyaka:staff-directory-changed', refresh);
    return () => {
      window.removeEventListener('staff-changed', refresh);
      window.removeEventListener('munyaka:staff-directory-changed', refresh);
    };
  }, []);

  // ── Derive display list from master ───────────────────────────────────────────
  const masterStaffList = useMemo<StaffMember[]>(
    () => masterRecords.map(masterToStaffMember),
    [masterRecords]
  );

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pre-Registered'>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Teaching' | 'Non-Teaching'>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkActivating, setIsBulkActivating] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', role: '', systemRole: '', phone: '', email: '', tsc_number: '' });
  const [formError, setFormError] = useState('');
  const [showTeachingFields, setShowTeachingFields] = useState(true);

  // ── Filter ───────────────────────────────────────────────────────────────────
  const filteredStaff = useMemo(() => {
    const needle = String(searchTerm || '').toLowerCase();
    return masterStaffList.filter(s => {
      const matchesSearch =
        String(s.full_name || '').toLowerCase().includes(needle) ||
        String(s.id || '').toLowerCase().includes(needle) ||
        String(s.id_no || '').toLowerCase().includes(needle) ||
        String(s.email || '').toLowerCase().includes(needle) ||
        String(s.role || '').toLowerCase().includes(needle);
      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      
      // Category filter: Teaching vs Non-Teaching
      const isTeaching = s.systemRole ? TEACHING_SYSTEM_ROLES.includes(s.systemRole as any) : false;
      const matchesCategory =
        categoryFilter === 'All' ||
        (categoryFilter === 'Teaching' && isTeaching) ||
        (categoryFilter === 'Non-Teaching' && !isTeaching);
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [masterStaffList, searchTerm, statusFilter, categoryFilter]);

  const isPending = (s: StaffMember): boolean => s.status !== 'Active';
  const activeCount  = useMemo(() => masterStaffList.filter(s => !isPending(s)).length, [masterStaffList]);
  const preRegCount  = useMemo(() => masterStaffList.filter(isPending).length, [masterStaffList]);

  // ── Modal handlers ───────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingStaff(null);
    setFormData({ full_name: '', role: '', systemRole: 'subject_teacher', phone: '', email: '', tsc_number: '' });
    setShowTeachingFields(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff: StaffMember) => {
    setModalMode('edit');
    setEditingStaff(staff);
    const designation = (staff.role || '').toUpperCase().trim();
    const isNonTeaching = isNonTeachingDesignation(designation);
    setShowTeachingFields(!isNonTeaching);
    setFormData({
      full_name: staff.full_name,
      role: staff.role,
      systemRole: staff.systemRole || 'subject_teacher',
      phone: staff.phone,
      email: staff.email,
      tsc_number: staff.tsc_no || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
    setFormError('');
    setFormData({ full_name: '', role: '', systemRole: '', phone: '', email: '', tsc_number: '' });
    setShowTeachingFields(true);
  };

  // Handle role/designation changes and sync system role
  const handleRoleChange = (designation: string) => {
    const mappedRole = mapDesignationToSystemRole(designation);
    const isNonTeaching = mappedRole ? isNonTeachingDesignation(designation) : false;
    
    setFormData(prev => ({
      ...prev,
      role: designation,
      systemRole: mappedRole || prev.systemRole,
    }));
    setShowTeachingFields(!isNonTeaching);
  };

  const handleSaveStaff = () => {
    if (!String(formData.full_name || '').trim() || !String(formData.role || '').trim()) {
      setFormError('Please fill in all required fields (Full Name, Role / Designation).');
      return;
    }

    setIsSaving(true);
    setFormError('');

    const designation = formData.role.toUpperCase().trim();
    const mappedSystemRole = mapDesignationToSystemRole(designation);
    const isNonTeaching = mappedSystemRole ? isNonTeachingDesignation(designation) : false;

    if (modalMode === 'add') {
      const natId = `ID-${Date.now()}`;
      try {
        const resolvedSystemRole: MasterSystemRole = mappedSystemRole || 'subject_teacher';
        addStaffMaster({
          name: formData.full_name.trim(),
          nationalId: natId,
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          tscNumber: formData.tsc_number.trim() || undefined,
          role: designation,
          systemRole: resolvedSystemRole,
          department: isNonTeaching ? getDepartmentForRole(resolvedSystemRole) : 'School Administration',
          // Clear teaching-specific fields for non-teaching staff
          assignedGrade: isNonTeaching ? undefined : undefined,
          assignedStream: isNonTeaching ? undefined : undefined,
          assignedSubjects: isNonTeaching ? [] : [],
          status: 'Pre-Registered',
        });
        
        // Notify other components & refresh state
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('munyaka_data_changed'));
        
        setIsModalOpen(false);
        setStaffList(getStaffMaster());
        showSuccess(`Staff member "${formData.full_name}" added and pre-registered.`);
      } catch (err) {
        showError('Failed to add staff. Please try again.');
        console.error('[Staff] handleSaveStaff (add):', err);
        setIsSaving(false);
        return;
      }
    } else if (editingStaff) {
      try {
        const resolvedSystemRole: MasterSystemRole = mappedSystemRole || (formData.systemRole as MasterSystemRole) || 'subject_teacher';
        const updatePayload: Partial<MasterStaffRecord> = {
          name: formData.full_name.trim(),
          role: designation,
          systemRole: resolvedSystemRole,
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          tscNumber: formData.tsc_number.trim() || undefined,
          department: isNonTeaching ? getDepartmentForRole(resolvedSystemRole) : 'School Administration',
        };

        // Clear teaching-specific fields for non-teaching staff
        if (isNonTeaching) {
          updatePayload.assignedGrade = undefined;
          updatePayload.assignedStream = undefined;
          updatePayload.assignedSubjects = [];
        }

        updateStaffMaster(editingStaff.id, updatePayload);
        
        // Notify other components & refresh state
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('munyaka_data_changed'));
        
        setIsModalOpen(false);
        setStaffList(getStaffMaster());
        showSuccess(`Staff member "${formData.full_name}" updated successfully.`);
      } catch (err) {
        showError('Failed to update staff. Please try again.');
        console.error('[Staff] handleSaveStaff (edit):', err);
        setIsSaving(false);
        return;
      }
    }

    setIsModalOpen(false);
    setEditingStaff(null);
    setFormData({ full_name: '', role: '', systemRole: '', phone: '', email: '', tsc_number: '' });
    setShowTeachingFields(true);
    setIsSaving(false);
  };

  // ── Bulk activation — via staffMasterService ─────────────────────────────────
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStaff.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredStaff.map(s => s.id)));
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkActivating(true);
    const ids = [...selectedIds];
    try {
      bulkActivateStaffMaster(ids);
      dismissToast();
      showSuccess(`Activated ${ids.length} staff member(s).`);
    } catch (err) {
      showError('Failed to activate staff.');
      console.error('[Staff] handleBulkActivate:', err);
    } finally {
      setSelectedIds(new Set());
      setIsBulkActivating(false);
    }
  };

  const handleActivateAll = async () => {
    const pending = masterStaffList.filter(isPending);
    if (pending.length === 0) { dismissToast(); showError('No pre-registered staff to activate.'); return; }
    if (!window.confirm(`Activate all ${pending.length} pre-registered staff member(s)?`)) return;
    setIsBulkActivating(true);
    try {
      bulkActivateStaffMaster(pending.map(s => s.id));
      dismissToast();
      showSuccess(`All ${pending.length} pending staff activated.`);
    } catch (err) {
      showError('Failed to activate all staff.');
      console.error('[Staff] handleActivateAll:', err);
    } finally {
      setIsBulkActivating(false);
    }
  };

  const handleActivateOne = (member: StaffMember) => {
    try {
      activateStaffMaster(member.id);
      dismissToast();
      showSuccess(`${member.full_name} has been activated.`);
    } catch (err) {
      showError('Failed to activate staff.');
      console.error('[Staff] handleActivateOne:', err);
    }
  };

  const initialsOf = (name: string): string =>
    String(name || 'PR').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-3 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Page Header - stacks on mobile */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 action-bar w-full max-w-full">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <BackButton parentPath="/" />
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 whitespace-normal break-words">Staff &amp; Personnel</h1>
            <p className="text-muted-foreground break-words hyphens-auto">Master directory of teachers, administrators, and support staff.</p>
          </div>
        </div>
        <Button className="h-11 px-6 rounded-2xl gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100 w-full sm:w-auto" onClick={handleOpenAdd}>
          <UserPlus size={18} /> Add Staff
        </Button>
      </div>

      {/* Metrics - responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="rounded-[2rem] shadow-sm flex items-center gap-4 p-6 border-none">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl"><Briefcase size={22} /></div>
          <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Staff Records</p><p className="text-2xl font-black text-slate-900">{masterStaffList.length}</p></div>
        </Card>
        <Card className="rounded-[2rem] shadow-sm flex items-center gap-4 p-6 border-none">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl"><UserCheck size={22} /></div>
          <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Accounts</p><p className="text-2xl font-black text-slate-900">{activeCount}</p></div>
        </Card>
        <Card className="rounded-[2rem] shadow-sm flex items-center gap-4 p-6 border-none">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl"><Clock size={22} /></div>
          <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pre-Registered Keys</p><p className="text-2xl font-black text-slate-900">{preRegCount}</p></div>
        </Card>
      </div>

      {/* Search & Status Filter - stacks on mobile */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 w-full max-w-full">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search staff by name, ID or email..."
            className="h-12 rounded-2xl bg-white border-none shadow-sm pl-11 text-sm font-medium focus:ring-2 ring-indigo-50" />
        </div>
        <div className="flex flex-wrap gap-1.5 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-full sm:w-auto">
          {(['All', 'Active', 'Pre-Registered'] as const).map(status => (
            <Button key={status} variant="ghost" onClick={() => setStatusFilter(status)}
              className={statusFilter === status ? "rounded-xl h-10 px-5 font-bold text-xs bg-indigo-600 text-white shadow-md shadow-indigo-100" : "rounded-xl h-10 px-5 font-bold text-xs text-slate-500 hover:bg-slate-50"}>
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Category Filter: Teaching vs Non-Teaching */}
      <div className="flex items-center gap-3 p-1.5 bg-slate-100 rounded-2xl w-fit mx-auto md:mx-0">
        {(['All', 'Teaching', 'Non-Teaching'] as const).map(cat => (
          <Button key={cat} variant="ghost" onClick={() => setCategoryFilter(cat)}
            className={categoryFilter === cat
              ? "rounded-xl h-9 px-4 font-bold text-xs bg-white text-indigo-600 shadow-sm border border-indigo-100"
              : "rounded-xl h-9 px-4 font-bold text-xs text-slate-500 hover:bg-white hover:text-slate-700"}>
            {cat === 'All' ? 'All Staff' : cat === 'Teaching' ? '👩‍🏫 Teaching Staff' : '👔 Non-Teaching Staff'}
          </Button>
        ))}
      </div>

      {/* Bulk Action Bar */}
      {preRegCount > 0 && (
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 md:p-5 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0"><ShieldCheck size={20} /></div>
            <div>
              <p className="text-sm font-bold text-amber-900">{preRegCount} staff member{preRegCount === 1 ? '' : 's'} pending activation</p>
              <p className="text-xs text-amber-700 font-medium">Pre-registered staff can sign in but haven't been approved for full system access yet.</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {selectedIds.size > 0 && (
              <Button onClick={handleBulkActivate} disabled={isBulkActivating}
                className="h-11 px-5 rounded-2xl gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100">
                {isBulkActivating ? <Loader2 className="animate-spin" size={16} /> : <UserCheck size={16} />}
                Approve Selected ({selectedIds.size})
              </Button>
            )}
            <Button onClick={handleActivateAll} disabled={isBulkActivating} variant="outline"
              className="h-11 px-5 rounded-2xl gap-2 border-amber-300 text-amber-800 hover:bg-amber-100 font-bold">
              {isBulkActivating ? <Loader2 className="animate-spin" size={16} /> : <UserCheck size={16} />}
              Activate All
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {masterStaffList.length === 0 && (
        <Card className="rounded-xl bg-white border border-slate-200/80 shadow-sm p-12 text-center">
          <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
            <div className="p-4 bg-amber-50 rounded-full"><Users className="w-10 h-10 text-amber-500" /></div>
            <h3 className="text-lg font-bold text-slate-900">No staff members registered yet</h3>
            <p className="text-sm text-slate-500">The staff directory is currently empty. Add your first staff member to get started.</p>
            <Button onClick={handleOpenAdd} className="mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg shadow-indigo-100">
              <UserPlus size={18} /> Add New Staff Member
            </Button>
          </div>
        </Card>
      )}

      {/* Data Table */}
      {masterStaffList.length > 0 && (
        <div>
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Personnel Directory</CardTitle>
                <p className="text-sm text-slate-500 font-medium">Full master ledger of internal school staff.</p>
              </div>
              <Badge className="bg-indigo-50 text-indigo-700 border-none font-bold px-4 py-1.5 rounded-xl">
                {filteredStaff.length} Record{filteredStaff.length === 1 ? '' : 's'}
                {selectedIds.size > 0 ? ` · ${selectedIds.size} selected` : ''}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-2">
                <DualScrollContainer>
                  <table className="w-full text-sm text-left min-w-[900px]">
                  <thead className="text-slate-500 bg-slate-50/50 border-b">
                    <tr>
                      <th className="px-4 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 w-12">
                        <Checkbox checked={filteredStaff.length > 0 && selectedIds.size === filteredStaff.length} onCheckedChange={toggleSelectAll} aria-label="Select all staff" />
                      </th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 min-w-[200px]">Staff Name</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 min-w-[140px]">Staff ID / TSC NO</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 min-w-[180px]">System Role</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 min-w-[220px]">Registered Email</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 min-w-[140px]">Temp Access Code</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right min-w-[120px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStaff.map(member => (
                      <tr key={member.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-4 py-5 w-12">
                          <Checkbox checked={selectedIds.has(member.id)} onCheckedChange={() => toggleSelectOne(member.id)} aria-label={`Select ${member.full_name}`} />
                        </td>
                        <td className="px-8 py-5 min-w-[200px]">
                                                  <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                      {initialsOf(member.full_name)}
                                                    </div>
                                                    <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap">{toTitleCase(member.full_name)}</span>
                                                  </div>
                                                </td>
                        <td className="px-8 py-5 min-w-[140px]">
                                                  <span className="font-mono text-xs font-bold text-slate-700 whitespace-nowrap">
                                                    {(() => {
                                                      // Priority: tscNumber (actual TSC) > nationalId (ID) — do NOT use staffId/login placeholder
                                                      const tscNumber = (member as any).tscNo || member.tsc_no;
                                                      const nationalId = (member as any).nationalId;
                                                      const validId = tscNumber || nationalId;
                                                      if (validId && !String(validId).toUpperCase().startsWith('MUNYAKA-')) {
                                                        return validId;
                                                      }
                                                      return '—';
                                                    })()}
                                                  </span>
                                                </td>
                        <td className="px-8 py-5 min-w-[180px]">
                                                  <p className="font-bold text-slate-800 whitespace-nowrap">{toTitleCase(member.role || 'Pending Assignment')}</p>
                                                  <p className="text-xs text-slate-400 font-medium whitespace-nowrap">{toTitleCase(member.department)}</p>
                                                </td>
                        <td className="px-8 py-5 min-w-[220px]">
                          <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{member.email || 'No Email Provided'}</span>
                        </td>
                        <td className="px-8 py-5 min-w-[140px]">
                          <span className="font-mono text-xs font-bold text-amber-600 whitespace-nowrap">
                            {(member as any).ref || (member as any).accessCode || (member as any).tempAccessCode || '—'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center min-w-[140px]">
                          <Badge className={member.status === 'Active' ? "bg-emerald-50 text-emerald-700 border-none font-bold text-xs px-3 py-1 rounded-xl" : "bg-amber-50 text-amber-700 border-none font-bold text-xs px-3 py-1 rounded-xl"}>
                            {member.status}
                          </Badge>
                        </td>
                        <td className="px-8 py-5 text-right min-w-[120px]">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-slate-400 hover:text-slate-600">
                                <MoreHorizontal size={18} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[180px] shadow-xl border-slate-100">
                              <DropdownMenuItem onClick={() => navigate(`/staff/${member.id}`)}
                                className="rounded-xl gap-2 font-bold cursor-pointer text-slate-700 hover:text-indigo-600">
                                <Eye size={15} /> View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEdit(member)}
                                className="rounded-xl gap-2 font-bold cursor-pointer text-slate-700 hover:text-indigo-600">
                                <Edit size={15} /> Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1" />
                              {isPending(member) && (
                                <DropdownMenuItem onClick={() => handleActivateOne(member)}
                                  className="rounded-xl gap-2 font-bold cursor-pointer text-emerald-600 hover:bg-emerald-50">
                                  <UserCheck size={15} /> Activate Staff
                                </DropdownMenuItem>
                              )}
                              {!isPending(member) && (
                                <DropdownMenuItem onClick={() => navigate('/staff/pre-registration')}
                                  className="rounded-xl gap-2 font-bold cursor-pointer text-indigo-600 hover:bg-indigo-50">
                                  <Key size={15} /> Manage Access Keys
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                    {filteredStaff.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Search size={32} className="text-slate-200" />
                            <p className="text-slate-500 font-bold">No personnel match your search criteria.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </DualScrollContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">{modalMode === 'add' ? 'Add New Staff Member' : 'Edit Staff Profile'}</h3>
              <button onClick={handleCloseModal} className="p-1 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold">
                  <AlertCircle size={14} /> {formError}
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Full Name</Label>
                <Input value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Jane Mwangi" className="rounded-xl h-12 bg-slate-50 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Role / Designation *</Label>
                <Input
                  value={formData.role}
                  onChange={e => handleRoleChange(e.target.value)}
                  placeholder="e.g. TEACHER, LIBRARIAN, ADMINISTRATOR"
                  className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                />
                {formData.systemRole && (
                  <p className="text-xs text-slate-500 font-medium">
                    System role: <span className="font-bold text-indigo-600">{formData.systemRole}</span>
                    {!showTeachingFields && (
                      <span className="text-amber-600 ml-1">(Non-teaching access)</span>
                    )}
                  </p>
                )}
                {!showTeachingFields && (
                  <p className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-1">
                    <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    Non-teaching designation — teaching fields will be cleared on save
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Phone</Label>
                  <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+254..." className="rounded-xl h-12 bg-slate-50 border-none font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Email</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@school.ac.ke" className="rounded-xl h-12 bg-slate-50 border-none font-bold" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">TSC Number (Optional)</Label>
                <Input value={formData.tsc_number} onChange={e => setFormData({ ...formData, tsc_number: e.target.value })}
                  placeholder="e.g. TSC-482910" className="rounded-xl h-12 bg-slate-50 border-none font-bold" />
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="ghost" className="flex-1 rounded-xl h-11 font-bold" onClick={handleCloseModal}>Cancel</Button>
                <Button onClick={handleSaveStaff} disabled={isSaving}
                  className="flex-1 rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100 gap-2">
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {modalMode === 'add' ? 'Add Staff' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
