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
import { Search, Plus, Loader2, X, Trash2, AlertCircle, Copy, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { PreRegisteredStaff, AccessStatus, SystemRole, SYSTEM_ROLE_LABELS } from '@/types/staff-access';
import AddPreRegModal from '@/components/staff-access/AddPreRegModal';
import {
  getStaffMaster,
  addStaffMaster,
  updateStaffMaster,
  deleteStaffMaster,
  activateStaffMaster,
  initializeStaffMaster,
  STAFF_MASTER_KEY,
  type MasterStaffRecord,
} from '@/services/staffMasterService';
import { notifyDataChanged } from '@/utils/storage';

// ── Helpers ────────────────────────────────────────────────────────────────────

const initialsOf = (name: string): string =>
  name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';

/** Maps a MasterStaffRecord to the PreRegisteredStaff shape used by the UI */
function toPreReg(record: MasterStaffRecord): PreRegisteredStaff {
  return {
    id: record.id,
    staffId: record.staffId || record.id,
    fullName: record.name,
    nationalId: record.nationalId,
    email: record.email,
    phone: record.phone,
    tscNumber: record.tscNumber,
    systemRole: record.systemRole as SystemRole,
    department: record.department,
    assignedGrade: record.assignedGrade,
    assignedStream: record.assignedStream,
    assignedSubjects: record.assignedSubjects,
    gender: record.gender,
    salary: record.salary,
    joinedDate: record.joinedDate,
    emergencyContact: record.emergencyContact,
    emergencyName: record.emergencyName,
    schoolId: record.schoolId,
    tempAccessCode: record.tempAccessCode,
    status: record.status as AccessStatus,
    datePreRegistered: record.datePreRegistered,
    profileComplete: record.profileComplete,
  };
}

const StaffPreRegistration = () => {
  const navigate = useNavigate();

  // ── Staff list sourced exclusively from staffMasterService ─────────────────
  const [staffList, setStaffList] = useState<PreRegisteredStaff[]>([]);

  // ── Boot: load from staffMasterService ─────────────────────────────────────
  useEffect(() => {
    initializeStaffMaster(); // safe to call multiple times — idempotent
    const records = getStaffMaster();
    setStaffList(records.map(toPreReg));
  }, []);

  // ── Listen for external changes broadcast by staffMasterService mutations ──
  useEffect(() => {
    const refresh = () => {
      const records = getStaffMaster();
      setStaffList(records.map(toPreReg));
    };
    window.addEventListener('staff-changed', refresh);
    window.addEventListener('munyaka:staff-directory-changed', refresh);
    return () => {
      window.removeEventListener('staff-changed', refresh);
      window.removeEventListener('munyaka:staff-directory-changed', refresh);
    };
  }, []);

  // ── UI State ───────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteAuthOpen, setIsDeleteAuthOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // ── Pre-computed lookup sets for AddPreRegModal ─────────────────────────────
  const existingNatIds = useMemo(() => new Set(staffList.map(s => s.nationalId)), [staffList]);
  const existingEmails = useMemo(() => new Set(staffList.map(s => (s.email || '').toLowerCase())), [staffList]);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      const term = searchTerm.toLowerCase();
      const matchName  = s.fullName.toLowerCase().includes(term);
      const matchEmail = (s.email || '').toLowerCase().includes(term);
      const matchNatId = (s.nationalId || '').toLowerCase().includes(term);
      const matchKey   = (s.tempAccessCode || '').toLowerCase().includes(term);
      if (!matchName && !matchEmail && !matchNatId && !matchKey) return false;

      if (roleFilter !== 'all' && s.systemRole !== roleFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;

      return true;
    });
  }, [staffList, searchTerm, roleFilter, statusFilter]);

  // ── CRUD handlers ───────────────────────────────────────────────────────────
  const handleAddStaff = useCallback((formData: Partial<PreRegisteredStaff>) => {
    const name = (formData.fullName || '').trim();
    if (!name || !(formData.email || '').trim()) {
      showError('Full name and email are required.');
      return;
    }
    try {
      const record = addStaffMaster({
        name,
        nationalId: formData.nationalId || '',
        email: formData.email || '',
        phone: formData.phone || '',
        tscNumber: formData.tscNumber,
        systemRole: (formData.systemRole as MasterStaffRecord['systemRole']) || 'subject_teacher',
        department: formData.department || 'School Administration',
        assignedGrade: formData.assignedGrade,
        assignedStream: formData.assignedStream,
        assignedSubjects: formData.assignedSubjects || [],
        gender: formData.gender,
        salary: formData.salary,
        joinedDate: formData.joinedDate || new Date().toISOString().split('T')[0],
        emergencyContact: formData.emergencyContact,
        emergencyName: formData.emergencyName,
        schoolId: formData.schoolId || 'munyaka-sc',
        tempAccessCode: formData.tempAccessCode || '',
        status: 'Pre-Registered',
        datePreRegistered: formData.datePreRegistered || new Date().toISOString().split('T')[0],
        profileComplete: false,
      });
      // staffMasterService already called broadcast() — no extra notify needed
      showSuccess(`${name} pre-registered with access key ${record.tempAccessCode}`);
      setIsAddModalOpen(false);
    } catch (err) {
      showError('Failed to add staff. Please try again.');
      console.error('[StaffPreRegistration] handleAddStaff:', err);
    }
  }, []);

  const handleDeleteStaff = useCallback((id: string) => {
    try {
      const ok = deleteStaffMaster(id);
      if (ok) {
        showSuccess('Staff record deleted.');
      }
    } catch (err) {
      showError('Failed to delete staff.');
      console.error('[StaffPreRegistration] handleDeleteStaff:', err);
    }
  }, []);

  const handleActivateStaff = useCallback((id: string) => {
    try {
      const updated = activateStaffMaster(id);
      if (updated) {
        showSuccess('Staff activated successfully.');
      }
    } catch (err) {
      showError('Failed to activate staff.');
      console.error('[StaffPreRegistration] handleActivateStaff:', err);
    }
  }, []);

  // ── Auth guard for deletion ────────────────────────────────────────────────
  const openDeleteAuth = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setAuthPassword('');
    setAuthError('');
    setIsDeleteAuthOpen(true);
  };

  const confirmDelete = async () => {
    setIsVerifying(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: authPassword }),
      });
      if (res.ok) {
        setIsDeleteAuthOpen(false);
        if (deleteTarget) handleDeleteStaff(deleteTarget.id);
      } else {
        setAuthError('Incorrect password. Access denied.');
      }
    } catch {
      setAuthError('Verification failed. Try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
      'Pre-Registered': { variant: 'secondary', className: 'bg-amber-100 text-amber-800 border-amber-200 rounded-full' },
      'Active':        { variant: 'default',   className: 'bg-emerald-100 text-emerald-800 border-emerald-200 rounded-full' },
      'Inactive':      { variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-200 rounded-full' },
    };
    const cfg = map[status] || { variant: 'secondary' as const, className: 'rounded-full' };
    return <Badge variant={cfg.variant} className={cfg.className}>{status}</Badge>;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => showSuccess('Copied to clipboard!'))
      .catch(() => showError('Copy failed.'));
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-sky-50/30 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-black text-slate-900">Staff Access Master</h1>
            <p className="text-sm text-slate-500 mt-1">Manage pre-registration and system access keys</p>
          </div>
        </div>

        {/* Counter cards — always reflect staffMasterService counts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-2xl border border-amber-200 bg-amber-50/60 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-amber-700">Pre-Registered</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-black text-amber-600">{staffList.filter(s => s.status === 'Pre-Registered').length}</p></CardContent>
          </Card>
          <Card className="rounded-2xl border border-emerald-200 bg-emerald-50/60 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-emerald-700">Active</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-black text-emerald-600">{staffList.filter(s => s.status === 'Active').length}</p></CardContent>
          </Card>
          <Card className="rounded-2xl border border-slate-200 bg-slate-50/60 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-slate-600">Total</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-black text-slate-500">{staffList.length}</p></CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Search by name, email, national ID, or access key…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl border-slate-200 bg-white h-11 shadow-sm"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            )}
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-44 rounded-xl h-11 shadow-sm"><SelectValue placeholder="All Roles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {Object.entries(SYSTEM_ROLE_LABELS).map(([val, { label }]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-44 rounded-xl h-11 shadow-sm"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pre-Registered">Pre-Registered</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold h-11 px-6 gap-2 shadow-lg shadow-indigo-100"
          >
            <Plus size={18} /> Pre-Register
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredStaff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Users size={48} className="mb-3 opacity-40" />
              <p className="font-bold">No staff found</p>
              <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase text-xs tracking-wider">Staff</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase text-xs tracking-wider hidden md:table-cell">Role</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase text-xs tracking-wider hidden lg:table-cell">Access Key</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase text-xs tracking-wider hidden lg:table-cell">Email</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase text-xs tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase text-xs tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStaff.map(s => {
                  const canActivate = s.status === 'Pre-Registered';
                  return (
                    <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center flex-shrink-0">
                            {initialsOf(s.fullName)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{s.fullName}</p>
                            <p className="text-xs text-slate-400">{s.nationalId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-slate-600">{SYSTEM_ROLE_LABELS[s.systemRole]?.label ?? s.systemRole}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">
                            {s.tempAccessCode || '—'}
                          </code>
                          {s.tempAccessCode && (
                            <button onClick={() => copyToClipboard(s.tempAccessCode)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                              <Copy size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-slate-500">{s.email || '—'}</span>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(s.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {canActivate && (
                            <button
                              onClick={() => handleActivateStaff(s.id)}
                              title="Activate"
                              className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                            >
                              <ShieldCheck size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => openDeleteAuth(s.id, s.fullName)}
                            title="Delete"
                            className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-slate-400 text-center">
          Records sourced from <code className="bg-slate-100 px-1 rounded">{STAFF_MASTER_KEY}</code> — the single source of truth
        </p>
      </div>

      {/* Add Pre-Registration Modal */}
      <AddPreRegModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddStaff}
        existingPreRegistered={staffList}
        existingNatIds={existingNatIds}
        existingEmails={existingEmails}
      />

      {/* Delete Auth Modal */}
      <Modal
        isOpen={isDeleteAuthOpen}
        onClose={() => setIsDeleteAuthOpen(false)}
        title="Confirm Deletion"
        maxWidth="max-w-md"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button variant="ghost" onClick={() => setIsDeleteAuthOpen(false)} className="rounded-xl font-bold h-11 px-6">Cancel</Button>
            <Button
              onClick={confirmDelete}
              disabled={isVerifying || !authPassword}
              className="rounded-xl bg-red-600 hover:bg-red-700 font-bold h-11 px-6 gap-2"
            >
              {isVerifying ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-bold text-red-800">You are about to delete a staff record.</p>
              <p className="text-sm text-red-600 mt-1">
                This action cannot be undone. All data for <strong>{deleteTarget?.name}</strong> will be permanently removed.
              </p>
            </div>
          </div>
          <div>
            <Label className="text-xs font-black uppercase text-slate-500 tracking-widest mb-2 block">Admin Password</Label>
            <Input
              type="password"
              value={authPassword}
              onChange={e => setAuthPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && authPassword && confirmDelete()}
              placeholder="Enter admin password"
              className="rounded-xl h-12"
            />
          </div>
          {authError && <p className="text-sm text-red-600 font-medium">{authError}</p>}
        </div>
      </Modal>
    </div>
  );
};

export default StaffPreRegistration;
