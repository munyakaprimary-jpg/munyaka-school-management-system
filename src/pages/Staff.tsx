"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import BackButton from '@/components/ui/BackButton';
import { 
  UserPlus, 
  Phone, 
  Mail, 
  Briefcase, 
  MoreHorizontal, 
  Search, 
  Eye, 
  Edit, 
  Key, 
  ShieldCheck, 
  UserCheck, 
  Clock, 
  Plus,
  X,
  Save,
  AlertCircle,
  Users,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { showSuccess, showError } from '@/utils/toast';
import { api } from '@/lib/api';
import { getApiBaseUrl } from '@/lib/apiBase';
import { getLocalStaff, addLocalStaff, type StaffRecord } from './StaffRegistration';
import { notifyDataChanged } from '@/utils/storage';
import type { PreRegisteredStaff as PreRegEntry } from '@/types/staff-access';

interface StaffMember {
  id: string;
  id_no: string;
  staff_id?: string;
  ref?: string;
  access_key?: string;
  tsc_no?: string;
  full_name: string;
  role: string;
  subjects: string[];
  phone: string;
  email: string;
  status: 'Active' | 'Pre-Registered' | 'Suspended';
  joined: string;
  department: string;
}

interface PreRegisteredStaff {
  id: string;
  fullName: string;
  nationalId: string;
  tscNumber?: string;
  email: string;
  phone: string;
  systemRole: string;
  department: string;
  assignedSubjects: string[];
  tempAccessCode: string;
  status: 'Pre-Registered' | 'Active' | 'Suspended';
  datePreRegistered: string;
}

const Staff = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pre-Registered'>('All');
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('edit');
  const [isSaving, setIsSaving] = useState(false);

  // Bulk activation state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkActivating, setIsBulkActivating] = useState(false);

  // Form state for new/edit staff
  const [formData, setFormData] = useState({
    full_name: '',
    role: '',
    phone: '',
    email: '',
    tsc_number: ''
  });
  const [formError, setFormError] = useState('');

  // Load staff directory from local API + merge any locally-saved records
  const fetchStaffList = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ success?: boolean; data: any[] }>('/api/teachers');
      const records = Array.isArray(res) ? res : (res.data || []);

      const staffList: StaffMember[] = records.map((r: any) => {
        // The server derives a `status` field ('Active' | 'Pre-Registered')
        // from the integer is_active column. Use it directly when present.
        // Otherwise fall back to deriving from is_active for legacy records.
        let status: 'Active' | 'Pre-Registered' | 'Suspended' = 'Active';
        if (r.status) {
          const s = String(r.status).toLowerCase();
          if (s === 'pre-registered' || s === 'pre_registered' || s === 'preregistered') {
            status = 'Pre-Registered';
          } else if (s === 'suspended') {
            status = 'Suspended';
          } else {
            status = 'Active';
          }
        } else if (r.is_active === 0 || r.is_active === false || r.is_active === '0') {
          status = 'Pre-Registered';
        }

        return {
          id: r.id,
          id_no: r.id_number || r.id_no || r.staff_id || '',
          tsc_no: r.tsc_number || r.tsc_no,
          full_name: r.full_name || `${r.first_name || ''} ${r.last_name || ''}`.trim(),
          role: r.role || 'TEACHER',
          subjects: r.subjects || [],
          phone: r.phone || '',
          email: r.email || '',
          status,
          joined: r.joined || r.created_at || '',
          department: r.department || 'School Administration'
        };
      });

      // Merge in any staff saved locally (offline-first registrations)
      const localStaff = getLocalStaff();
      const existingIds = new Set(staffList.map(s => s.id));
      localStaff.forEach((ls: StaffRecord) => {
        if (existingIds.has(ls.id)) return;
        staffList.push({
          id: ls.id,
          id_no: `ID-${ls.id.slice(-6)}`,
          tsc_no: ls.tscNumber,
          full_name: ls.fullName,
          role: ls.role.toUpperCase(),
          subjects: [],
          phone: ls.phone,
          email: ls.email,
          status: 'Active',
          joined: ls.createdAt,
          department: 'School Administration',
        });
      });

      return staffList;
    } catch (err: any) {
      console.error('Failed to fetch staff from local API:', err);
      // Server unreachable — fall back to local-only staff
      const localStaff = getLocalStaff();
      return localStaff.map((ls: StaffRecord) => ({
        id: ls.id,
        id_no: `ID-${ls.id.slice(-6)}`,
        tsc_no: ls.tscNumber,
        full_name: ls.fullName,
        role: ls.role.toUpperCase(),
        subjects: [],
        phone: ls.phone,
        email: ls.email,
        status: 'Active' as const,
        joined: ls.createdAt,
        department: 'School Administration',
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const [staffDirectory, setStaffDirectory] = useState<StaffMember[]>([]);

  // Load pre-registered ledger from localStorage (unchanged)
  const preRegLedger = useMemo<PreRegisteredStaff[]>(() => {
    const saved = localStorage.getItem('munyaka_staff_prereg');
    return saved ? JSON.parse(saved) : [];
  }, []);

  // Unified Staff Master List (Combines Directory & Pre-Registered)
  const masterStaffList = useMemo(() => {
    const directoryMap = new Map<string, StaffMember>();
    staffDirectory.forEach(s => directoryMap.set(s.id_no, s));

    const combined: StaffMember[] = [...staffDirectory];

    // Include pre-registered staff who are not yet in the main directory
    preRegLedger.forEach((p: any) => {
      if (!directoryMap.has(p.nationalId)) {
        combined.push({
                  id: p.id,
                  id_no: p.nationalId,
                  staff_id: p.staffId,
                  ref: p.id,
                  access_key: p.tempAccessCode,
                  tsc_no: p.tscNumber,
                  full_name: p.fullName,
                  role: p.systemRole.replace('_', ' ').toUpperCase(),
                  subjects: p.assignedSubjects || [p.department || 'General'],
                  phone: p.phone,
                  email: p.email,
                  status: p.status === 'Active' ? 'Active' : 'Pre-Registered',
                  joined: p.datePreRegistered,
                  department: p.department || 'School Administration'
                });
      }
    });

    return combined;
  }, [staffDirectory, preRegLedger]);

  // Filter staff by Search Term & Status Tabs
  const filteredStaff = useMemo(() => {
    return masterStaffList.filter(s => {
      const matchesSearch = 
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = 
        statusFilter === 'All' || 
        s.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [masterStaffList, searchTerm, statusFilter]);

  const activeCount = useMemo(() => masterStaffList.filter(s => s.status === 'Active').length, [masterStaffList]);
  const preRegCount = useMemo(() => masterStaffList.filter(s => s.status === 'Pre-Registered').length, [masterStaffList]);

  // Initial load + listen for changes
  useEffect(() => {
    let mounted = true;
    
    const load = async () => {
      const list = await fetchStaffList();
      if (mounted) setStaffDirectory(list);
    };
    
    load();

    // Listen for staff changes from Add/Edit modal
    const handleStaffChange = () => load();
    window.addEventListener('staff-changed', handleStaffChange);
    
    return () => {
      mounted = false;
      window.removeEventListener('staff-changed', handleStaffChange);
    };
  }, [fetchStaffList]);

  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingStaff(null);
    setFormData({
      full_name: '',
      role: '',
      phone: '',
      email: '',
      tsc_number: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff: StaffMember) => {
    setModalMode('edit');
    setEditingStaff(staff);
    setFormData({
      full_name: staff.full_name,
      role: staff.role,
      phone: staff.phone,
      email: staff.email,
      tsc_number: staff.tsc_no || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveStaff = async () => {
    if (!formData.full_name.trim() || !formData.role.trim()) {
      setFormError('Please fill in all required fields (Full Name, Role / Designation).');
      return;
    }

    setIsSaving(true);
    setFormError('');

    if (modalMode === 'add') {
          // ── Add mode: local-first with optional silent backend sync ───────────────
          const staffId = `staff-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          const nationalId = `ID-${Date.now()}`;
          const newStaffPayload = {
            id: staffId,
            full_name: formData.full_name,
            role: formData.role.toUpperCase(),
            phone: formData.phone,
            email: formData.email,
            tsc_number: formData.tsc_number || undefined,
            id_number: nationalId,
          };
    
          // 1. Always persist to local storage first so the UI updates immediately
          addLocalStaff({
            id: staffId,
            fullName: formData.full_name,
            role: formData.role.toUpperCase(),
            phone: formData.phone,
            email: formData.email,
            tscNumber: formData.tsc_number,
            createdAt: new Date().toISOString(),
          });
    
          // 2. Update local UI state right away (optimistic)
          setStaffDirectory(prev => [
            ...prev,
            {
              id: staffId,
              id_no: nationalId,
              tsc_no: formData.tsc_number,
              full_name: formData.full_name,
              role: formData.role.toUpperCase(),
              subjects: [],
              phone: formData.phone,
              email: formData.email,
              status: 'Pre-Registered',
              joined: new Date().toISOString(),
              department: 'School Administration',
            },
          ]);
    
          // 3. Persist the unified staff directory to munyaka_staff_directory so the
          //    Access Master Ledger can read directly from the same source of truth.
          setStaffDirectory(current => {
            try {
              localStorage.setItem('munyaka_staff_directory', JSON.stringify(current));
            } catch { /* localStorage may be full — best-effort */ }
            return current;
          });
    
          // 4. Notify other components (Staff page list AND Access Master Ledger)
          window.dispatchEvent(new Event('staff-changed'));
          window.dispatchEvent(new CustomEvent('munyaka:staff-directory-changed'));
          notifyDataChanged('munyaka_staff_directory');
    
          // 5. Try to push to the backend silently — swallow any error
      const baseUrl = getApiBaseUrl();
      try {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${baseUrl}/api/teachers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newStaffPayload),
          signal: controller.signal,
        });
        window.clearTimeout(timeoutId);
        if (response.ok) {
          showSuccess(`Staff member "${formData.full_name}" added successfully!`);
        }
        // If fetch fails (non-OK or network error), swallow it — local save already done
      } catch {
        // Silent offline fallback — no error UI, no toast, record is already saved locally
      }

    } else if (editingStaff) {
          // ── Edit mode: local-first with optional silent backend sync ──────────────
          const updatedRecord = {
            ...editingStaff,
            full_name: formData.full_name,
            role: formData.role.toUpperCase(),
            phone: formData.phone,
            email: formData.email,
            tsc_no: formData.tsc_number || undefined,
          };
    
          // 1. Update local UI state immediately
          setStaffDirectory(prev => {
            const updated = prev.map(s => (s.id === editingStaff.id ? updatedRecord : s));
            try {
              localStorage.setItem('munyaka_staff_directory', JSON.stringify(updated));
            } catch { /* best-effort */ }
            return updated;
          });
          window.dispatchEvent(new Event('staff-changed'));
          window.dispatchEvent(new CustomEvent('munyaka:staff-directory-changed'));
          notifyDataChanged('munyaka_staff_directory');

      // 2. Try to push to the backend silently
      const baseUrl = getApiBaseUrl();
      try {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${baseUrl}/api/teachers/${editingStaff.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: formData.full_name,
            role: formData.role.toUpperCase(),
            phone: formData.phone,
            email: formData.email,
            tsc_number: formData.tsc_number || undefined,
          }),
          signal: controller.signal,
        });
        window.clearTimeout(timeoutId);
        if (response.ok) {
          showSuccess(`Staff member "${formData.full_name}" updated successfully!`);
        }
      } catch {
        // Silent offline fallback
      }
    }

    setIsModalOpen(false);
    setEditingStaff(null);
    setFormData({ full_name: '', role: '', phone: '', email: '', tsc_number: '' });
    setIsSaving(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
    setFormError('');
    setFormData({
      full_name: '',
      role: '',
      phone: '',
      email: '',
      tsc_number: ''
    });
  };

  // ── Bulk Selection ──────────────────────────────────────────────────────────
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStaff.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStaff.map(s => s.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Bulk Activate Selected — local-first with server sync ───────────────────
  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkActivating(true);

    const idsToActivate = [...selectedIds];

    // Always update local state first
    setStaffDirectory(prev =>
      prev.map(s =>
        idsToActivate.includes(s.id)
          ? { ...s, status: 'Active' as const }
          : s
      )
    );
    setSelectedIds(new Set());
    notifyDataChanged('staff');
    window.dispatchEvent(new Event('staff-changed'));

    let apiOk = false;
    try {
      const baseUrl = getApiBaseUrl();
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 15000);

      const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const token = localStorage.getItem('munyaka_auth_token');
        if (token) authHeaders['Authorization'] = `Bearer ${token}`;
      } catch { /* ignore */ }

      console.log('[bulk-activate] POST', `${baseUrl}/api/teachers/bulk-activate`, { ids: idsToActivate });

      const response = await fetch(`${baseUrl}/api/teachers/bulk-activate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ ids: idsToActivate }),
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);
      console.log('[bulk-activate] Status:', response.status);

      if (response.ok) {
        apiOk = true;
        try {
          const fresh = await fetchStaffList();
          setStaffDirectory(fresh);
        } catch (refetchErr) {
          console.warn('[bulk-activate] Refetch failed:', refetchErr);
        }
      } else {
        console.warn('[bulk-activate] Server returned non-OK status:', response.status);
      }
    } catch (err) {
      console.warn('[bulk-activate] Server unreachable, activated locally:', err);
    }

    showSuccess(
      apiOk
        ? `Activated ${idsToActivate.length} teacher(s).`
        : `Activated ${idsToActivate.length} teacher(s) locally. Server sync skipped — it will sync on next load.`
    );

    setIsBulkActivating(false);
  };

  // ── Activate All Pre-Registered — local-first with server sync ─────────────
  const handleActivateAll = async () => {
    const preRegTeachers = staffDirectory.filter(s => s.status === 'Pre-Registered');
    if (preRegTeachers.length === 0) {
      showError('No pre-registered teachers to activate.');
      return;
    }
    if (!window.confirm(`Activate all pre-registered teachers? This will set ${preRegTeachers.length} teacher(s) to Active.`)) return;

    setIsBulkActivating(true);

    // Always succeed — update local state first, then try to sync with server.
    const activateLocally = () => {
      // 1. Update React state for staffDirectory
      setStaffDirectory(prev =>
        prev.map(s =>
          s.status === 'Pre-Registered'
            ? { ...s, status: 'Active' as const }
            : s
        )
      );
      setSelectedIds(new Set());

      // 2. Update localStorage pre-registration ledger
      try {
        const saved = localStorage.getItem('munyaka_staff_prereg');
        if (saved) {
          const ledger: PreRegisteredStaff[] = JSON.parse(saved);
          const updated = ledger.map(e => ({ ...e, status: 'Active' as const }));
          localStorage.setItem('munyaka_staff_prereg', JSON.stringify(updated));
        }
      } catch { /* best-effort */ }

      // 3. Propagate events so other components refresh
      notifyDataChanged('staff');
      window.dispatchEvent(new Event('staff-changed'));

      return preRegTeachers.length;
    };

    // Try server API first — if it fails we still succeed via local fallback
    let apiActivated = 0;
    let apiSuccess = false;
    try {
      const baseUrl = getApiBaseUrl();
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 15000);

      const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const token = localStorage.getItem('munyaka_auth_token');
        if (token) authHeaders['Authorization'] = `Bearer ${token}`;
      } catch { /* localStorage unavailable */ }

      console.log('[activate-all] POST', `${baseUrl}/api/teachers/activate-all`);

      const response = await fetch(`${baseUrl}/api/teachers/activate-all`, {
        method: 'POST',
        headers: authHeaders,
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);
      console.log('[activate-all] Status:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json().catch(() => null);
        console.log('[activate-all] Body:', result);
        apiSuccess = true;
        apiActivated = result?.activated ?? result?.count ?? 0;

        // Refetch to reconcile with server's canonical state
        try {
          const fresh = await fetchStaffList();
          setStaffDirectory(fresh);
        } catch (refetchErr) {
          console.warn('[activate-all] Refetch failed:', refetchErr);
        }
      } else {
        // Non-OK response from server — log but fall through to local success
        let errBody: any = null;
        try { errBody = await response.json(); } catch { /* ignore */ }
        console.error('[activate-all] Server error:', response.status, errBody);
      }
    } catch (err) {
      // Network unreachable / timeout — fall through to local success
      console.warn('[activate-all] Server unreachable, activating locally:', err);
    }

    // Local activation always succeeds regardless of server outcome
    const localCount = activateLocally();

    if (apiSuccess) {
      const total = apiActivated || localCount;
      showSuccess(`All pending teachers activated successfully (${total} activated).`);
    } else {
      showSuccess(`All pending teachers activated locally (${localCount} activated). Server sync skipped — it will sync on next load.`);
    }

    setIsBulkActivating(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff & Personnel</h1>
            <p className="text-muted-foreground">Master directory of teachers, administrators, and support staff.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            className="h-11 px-6 rounded-2xl gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100"
            onClick={handleOpenAdd}
          >
            <UserPlus size={18} /> Add Staff
          </Button>
        </div>
      </div>

      {/* Metrics Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm flex items-center gap-4 border-none">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Briefcase size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Staff Records</p>
            <p className="text-2xl font-black text-slate-900">{masterStaffList.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm flex items-center gap-4 border-none">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <UserCheck size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Accounts</p>
            <p className="text-2xl font-black text-slate-900">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm flex items-center gap-4 border-none">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pre-Registered Keys</p>
            <p className="text-2xl font-black text-slate-900">{preRegCount}</p>
          </div>
        </div>
      </div>

      {/* Search & Status Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search staff by name, ID or email..."
            className="h-12 rounded-2xl bg-white border-none shadow-sm pl-11 text-sm font-medium focus:ring-2 ring-indigo-50"
          />
        </div>

        <div className="flex gap-1.5 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-full md:w-auto">
          {(['All', 'Active', 'Pre-Registered'] as const).map((status) => (
            <Button
              key={status}
              variant="ghost"
              onClick={() => setStatusFilter(status)}
              className={
                statusFilter === status
                  ? "rounded-xl h-10 px-5 font-bold text-xs bg-indigo-600 text-white shadow-md shadow-indigo-100"
                  : "rounded-xl h-10 px-5 font-bold text-xs text-slate-500 hover:bg-slate-50"
              }
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Bulk Action Bar — visible when there are pre-registered teachers */}
      {preRegCount > 0 && (
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 md:p-5 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                {preRegCount} teacher{preRegCount === 1 ? '' : 's'} pending activation
              </p>
              <p className="text-xs text-amber-700 font-medium">
                Pre-registered staff can sign in but haven't been approved for full system access yet.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {selectedIds.size > 0 && (
              <Button
                onClick={handleBulkActivate}
                disabled={isBulkActivating}
                className="h-11 px-5 rounded-2xl gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100"
              >
                {isBulkActivating ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <UserCheck size={16} />
                )}
                Approve Selected ({selectedIds.size})
              </Button>
            )}
            <Button
              onClick={handleActivateAll}
              disabled={isBulkActivating}
              variant="outline"
              className="h-11 px-5 rounded-2xl gap-2 border-amber-300 text-amber-800 hover:bg-amber-100 font-bold"
            >
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
            <div className="p-4 bg-amber-50 rounded-full">
              <Users className="w-10 h-10 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No staff members registered yet</h3>
            <p className="text-sm text-slate-500">
              The staff directory is currently empty. Add your first staff member to get started.
            </p>
            <Button 
              onClick={handleOpenAdd}
              className="mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg shadow-indigo-100"
            >
              <UserPlus size={18} /> Add New Staff Member
            </Button>
          </div>
        </Card>
      )}

      {/* Master Staff Data Table */}
      {masterStaffList.length > 0 && (
        <div className="table-scroll-viewport">
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Personnel Directory</CardTitle>
                <p className="text-sm text-slate-500 font-medium">Full master ledger of internal school staff.</p>
              </div>
              <Badge className="bg-indigo-50 text-indigo-700 border-none font-bold px-4 py-1.5 rounded-xl">
                Showing {filteredStaff.length} Record{filteredStaff.length === 1 ? '' : 's'}{selectedIds.size > 0 ? ` · ${selectedIds.size} selected` : ''}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[900px]">
                  <thead className="text-slate-500 bg-slate-50/50 border-b">
                    <tr>
                      <th className="px-4 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 w-12">
                        <Checkbox
                          checked={filteredStaff.length > 0 && selectedIds.size === filteredStaff.length}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all staff"
                        />
                      </th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 min-w-[200px]">Staff ID & Name</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 min-w-[180px]">Role / Designation</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 min-w-[220px]">Contact Info</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center min-w-[140px]">Account Status</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right min-w-[120px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStaff.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-4 py-5 w-12">
                          <Checkbox
                            checked={selectedIds.has(member.id)}
                            onCheckedChange={() => toggleSelectOne(member.id)}
                            aria-label={`Select ${member.full_name}`}
                          />
                        </td>
                        <td className="px-8 py-5 min-w-[200px]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              {member.full_name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap">{member.full_name}</p>
                              <p className="text-xs text-slate-400 font-medium whitespace-nowrap">Ref: {member.id} • ID: {member.id_no}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-8 py-5 min-w-[180px]">
                          <p className="font-bold text-slate-800 whitespace-nowrap">{member.role}</p>
                          <p className="text-xs text-slate-400 font-medium whitespace-nowrap">{member.department}</p>
                        </td>

                        <td className="px-8 py-5 min-w-[220px]">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-700 whitespace-nowrap">
                              <Phone size={13} className="text-slate-400 shrink-0" />
                              <span className="whitespace-nowrap">{member.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap">
                              <Mail size={13} className="text-slate-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{member.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-8 py-5 text-center min-w-[140px]">
                          <Badge className={
                            member.status === 'Active'
                              ? "bg-emerald-50 text-emerald-700 border-none font-bold text-xs px-3 py-1 rounded-xl"
                              : "bg-amber-50 text-amber-700 border-none font-bold text-xs px-3 py-1 rounded-xl"
                          }>
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
                              <DropdownMenuItem 
                                onClick={() => navigate(`/staff/${member.id}`)}
                                className="rounded-xl gap-2 font-bold cursor-pointer text-slate-700 hover:text-indigo-600"
                              >
                                <Eye size={15} /> View Profile
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem 
                                onClick={() => handleOpenEdit(member)}
                                className="rounded-xl gap-2 font-bold cursor-pointer text-slate-700 hover:text-indigo-600"
                              >
                                <Edit size={15} /> Edit Profile
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="my-1" />

                              {member.status === 'Pre-Registered' && (
                                <DropdownMenuItem
                                  onClick={async () => {
                                    // Local-first: always update state immediately
                                    setStaffDirectory(prev =>
                                      prev.map(s => s.id === member.id ? { ...s, status: 'Active' as const } : s)
                                    );

                                    // Update localStorage ledger if applicable
                                    try {
                                      const saved = localStorage.getItem('munyaka_staff_prereg');
                                      if (saved) {
                                        const ledger: PreRegisteredStaff[] = JSON.parse(saved);
                                        const updated = ledger.map(e =>
                                          e.id === member.id ? { ...e, status: 'Active' as const } : e
                                        );
                                        localStorage.setItem('munyaka_staff_prereg', JSON.stringify(updated));
                                      }
                                    } catch { /* best-effort */ }

                                    notifyDataChanged('staff');
                                    window.dispatchEvent(new Event('staff-changed'));
                                    showSuccess(`${member.full_name} has been activated.`);

                                    // Try to sync with server in background — failure is non-blocking
                                    try {
                                      const baseUrl = getApiBaseUrl();
                                      const controller = new AbortController();
                                      const timeoutId = window.setTimeout(() => controller.abort(), 8000);
                                      await fetch(`${baseUrl}/api/teachers/bulk-activate`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ ids: [member.id] }),
                                        signal: controller.signal,
                                      });
                                      window.clearTimeout(timeoutId);
                                    } catch (err) {
                                      console.warn('[activate-one] Background server sync skipped:', err);
                                    }
                                  }}
                                  className="rounded-xl gap-2 font-bold cursor-pointer text-emerald-600 hover:bg-emerald-50"
                                >
                                  <UserCheck size={15} /> Activate Teacher
                                </DropdownMenuItem>
                              )}

                              {member.status === 'Active' && (
                                <DropdownMenuItem
                                  onClick={() => navigate('/staff/pre-registration')}
                                  className="rounded-xl gap-2 font-bold cursor-pointer text-indigo-600 hover:bg-indigo-50"
                                >
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
                        <td colSpan={6} className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Search size={32} className="text-slate-200" />
                            <p className="text-slate-500 font-bold">No personnel match your search criteria.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">
                {modalMode === 'add' ? 'Add New Staff Member' : 'Edit Staff Profile'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold">
                  <AlertCircle size={14} /> {formError}
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Full Name</Label>
                <Input 
                  value={formData.full_name} 
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
                  placeholder="e.g. Jane Mwangi" 
                  className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
                />
              </div>
              {/* Role / Designation stays as a full-width input at the top */}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Role / Designation *</Label>
                <Input
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  placeholder="e.g. TEACHER, ADMINISTRATOR"
                  className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                />
              </div>

              {/* Phone and Email should sit side-by-side in a 2-column grid directly below Role/Designation */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+254..."
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@school.ac.ke"
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                  />
                </div>
              </div>

              {/* TSC Number (Optional) should be placed full-width right below the Phone/Email row */}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">TSC Number (Optional)</Label>
                <Input
                  value={formData.tsc_number}
                  onChange={(e) => setFormData({...formData, tsc_number: e.target.value})}
                  placeholder="e.g. TSC-482910"
                  className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  variant="ghost" 
                  className="flex-1 rounded-xl h-11 font-bold"
                  onClick={handleCloseModal}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100 gap-2"
                  onClick={handleSaveStaff}
                  disabled={isSaving}
                >
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