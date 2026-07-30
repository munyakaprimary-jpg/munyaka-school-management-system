"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Copy, Send, Ban, Check, Trash2, Mail } from 'lucide-react';
import { PreRegisteredStaff, AccessStatus, SYSTEM_ROLE_LABELS } from '@/types/staff-access';
import { INITIAL_PRE_REGISTERED_STAFF } from '@/lib/mock-staff-access';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

// Modular Components
import PreRegHeader from '@/components/staff-access/PreRegHeader';
import PreRegMetrics from '@/components/staff-access/PreRegMetrics';
import AddPreRegModal from '@/components/staff-access/AddPreRegModal';
import DispatchInviteModal from '@/components/staff-access/DispatchInviteModal';

const StaffPreRegistration = () => {
  const [staffList, setStaffList] = useState<PreRegisteredStaff[]>(() => {
    const saved = localStorage.getItem('munyaka_staff_prereg');
    return saved ? JSON.parse(saved) : INITIAL_PRE_REGISTERED_STAFF;
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedStaffForInvite, setSelectedStaffForInvite] = useState<PreRegisteredStaff | null>(null);

  useEffect(() => {
    localStorage.setItem('munyaka_staff_prereg', JSON.stringify(staffList));
  }, [staffList]);

  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      const query = searchTerm.toLowerCase();
      const matchesSearch = s.fullName.toLowerCase().includes(query) || s.nationalId.toLowerCase().includes(query) || s.tempAccessCode.toLowerCase().includes(query) || s.email.toLowerCase().includes(query);
      const matchesRole = roleFilter === 'all' || s.systemRole === roleFilter;
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staffList, searchTerm, roleFilter, statusFilter]);

  const metrics = useMemo(() => ({
    total: staffList.length,
    active: staffList.filter(s => s.status === 'Active').length,
    pending: staffList.filter(s => s.status === 'Pending Invite' || s.status === 'Pre-Registered').length,
    suspended: staffList.filter(s => s.status === 'Suspended').length
  }), [staffList]);

  const handleCreatePreRegistration = (data: any) => {
    const exists = staffList.some(s => s.nationalId === data.nationalId || s.email.toLowerCase() === data.email.toLowerCase());
    if (exists) {
      showError("A staff member with this National ID or Email is already pre-registered.");
      return;
    }

    const newStaff: PreRegisteredStaff = {
      id: `PR-${Math.floor(100 + Math.random() * 900)}`,
      fullName: data.fullName.trim(),
      nationalId: data.nationalId.trim(),
      tscNumber: data.tscNumber.trim() ? `TSC-${data.tscNumber.trim()}` : undefined,
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      systemRole: data.systemRole,
      department: data.department,
      assignedSubjects: data.assignedSubjects.split(',').map((s: string) => s.trim()).filter(Boolean),
      tempAccessCode: data.tempAccessCode,
      status: "Pre-Registered",
      datePreRegistered: new Date().toISOString().split('T')[0]
    };

    setStaffList([newStaff, ...staffList]);
    setIsAddModalOpen(false);
    showSuccess(`Pre-registered ${newStaff.fullName}! Key: ${newStaff.tempAccessCode}`);
  };

  const handleCopyAccessCode = (code: string, name: string) => {
    navigator.clipboard.writeText(code);
    showSuccess(`Copied Access Key for ${name}`);
  };

  const handleDispatchInvite = (staff: PreRegisteredStaff) => {
    setSelectedStaffForInvite(staff);
    setIsInviteModalOpen(true);
  };

  const confirmSendInvite = () => {
    if (selectedStaffForInvite) {
      setStaffList(prev => prev.map(s => s.id === selectedStaffForInvite.id ? { ...s, status: 'Pending Invite' } : s));
      showSuccess(`Invitation dispatched to ${selectedStaffForInvite.fullName}`);
    }
    setIsInviteModalOpen(false);
  };

  const handleToggleStatus = (id: string, currentStatus: AccessStatus) => {
    const nextStatus: AccessStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    setStaffList(prev => prev.map(s => s.id === id ? { ...s, status: nextStatus } : s));
    showSuccess(`Account updated to ${nextStatus}.`);
  };

  const handleExportCSV = () => {
    const headers = ["Staff Ref ID", "Full Name", "National ID", "Email", "Role", "Access Key", "Status"];
    const rows = filteredStaff.map(s => [s.id, s.fullName, s.nationalId, s.email, s.systemRole, s.tempAccessCode, s.status]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "staff_access_master.csv";
    link.click();
    showSuccess("Master CSV exported.");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <PreRegHeader onExport={handleExportCSV} onAddClick={() => setIsAddModalOpen(true)} />
      
      <PreRegMetrics metrics={metrics} />

      <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input placeholder="Search staff or keys..." className="pl-11 h-12 rounded-2xl bg-slate-50 border-none font-medium" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 text-sm"><SelectValue placeholder="All Roles" /></SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All System Roles</SelectItem>
              {Object.keys(SYSTEM_ROLE_LABELS).map(role => (
                <SelectItem key={role} value={role}>{SYSTEM_ROLE_LABELS[role as keyof typeof SYSTEM_ROLE_LABELS].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 text-sm"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pre-Registered">Pre-Registered</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
        {/* Scrollable Header & Table Container */}
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[1100px]">
            {/* Header Section - Scrolls with Table */}
            <div className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Access Master Ledger</CardTitle>
                <p className="text-sm text-slate-500 font-medium">Pre-approved staff credentials and activation keys.</p>
              </div>
              <Badge className="bg-indigo-50 text-indigo-700 border-none font-bold px-4 py-1.5 rounded-xl shrink-0">{filteredStaff.length} Entries</Badge>
            </div>

            {/* Table Section */}
            <div className="p-0">
              <table className="w-full text-sm text-left min-w-[1100px]">
                <thead className="bg-slate-50/60 border-b sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Staff Credentials</th>
                    <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">System Role</th>
                    <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Registered Email</th>
                    <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Temp Access Key</th>
                    <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Status</th>
                    <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map((staff) => {
                    const roleInfo = SYSTEM_ROLE_LABELS[staff.systemRole] || SYSTEM_ROLE_LABELS.subject_teacher;
                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-900">{staff.fullName}</p>
                          <p className="text-xs text-slate-400 font-medium">ID: {staff.nationalId}</p>
                        </td>
                        <td className="px-6 py-5">
                          <Badge className={cn("rounded-xl font-bold border text-xs px-3 py-1", roleInfo.badgeBg, roleInfo.color)}>{roleInfo.label}</Badge>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-slate-700">
                            <Mail size={14} className="text-slate-400 shrink-0" />
                            <span className="font-medium truncate max-w-[200px]">{staff.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer" onClick={() => handleCopyAccessCode(staff.tempAccessCode, staff.fullName)}>
                            <code className="font-black text-slate-800 text-xs">{staff.tempAccessCode}</code>
                            <Copy size={13} className="text-slate-400" />
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <Badge className={cn("rounded-xl border-none font-bold text-xs px-3 py-1", staff.status === 'Active' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{staff.status}</Badge>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button variant="ghost" size="sm" className="h-9 px-3 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 gap-1.5" onClick={() => handleDispatchInvite(staff)}><Send size={14} /> Send Key</Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-amber-600" onClick={() => handleToggleStatus(staff.id, staff.status)}>{staff.status === 'Active' ? <Ban size={16} /> : <Check size={16} />}</Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-600" onClick={() => setStaffList(prev => prev.filter(s => s.id !== staff.id))}><Trash2 size={16} /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      <AddPreRegModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleCreatePreRegistration} />
      <DispatchInviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} staff={selectedStaffForInvite} onConfirm={confirmSendInvite} />
    </div>
  );
};

export default StaffPreRegistration;