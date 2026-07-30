"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PreRegisteredStaff, AccessStatus, SYSTEM_ROLE_LABELS } from '@/types/staff-access';
import { INITIAL_PRE_REGISTERED_STAFF } from '@/lib/mock-staff-access';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

// Modular Components
import PreRegHeader from '@/components/staff-access/PreRegHeader';
import PreRegMetrics from '@/components/staff-access/PreRegMetrics';
import PreRegFilters from '@/components/staff-access/PreRegFilters';
import PreRegTable from '@/components/staff-access/PreRegTable';
import AddPreRegModal from '@/components/staff-access/AddPreRegModal';
import DispatchInviteModal from '@/components/staff-access/DispatchInviteModal';
import DeletePasswordModal from '@/components/staff-access/DeletePasswordModal';

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
  const [isDeletePasswordModalOpen, setIsDeletePasswordModalOpen] = useState(false);
  const [staffToDeletePassword, setStaffToDeletePassword] = useState<PreRegisteredStaff | null>(null);

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

  const requestDeletePassword = (staff: PreRegisteredStaff) => {
    setStaffToDeletePassword(staff);
    setIsDeletePasswordModalOpen(true);
  };

  const confirmDeletePassword = () => {
    if (staffToDeletePassword) {
      const newCode = `MUNYAKA-${Math.floor(100 + Math.random() * 900)}`;
      setStaffList(prev => prev.map(s => s.id === staffToDeletePassword.id ? { ...s, tempAccessCode: newCode } : s));
      showSuccess(`Admin password reset for ${staffToDeletePassword.fullName}. New key: ${newCode}`);
    }
    setIsDeletePasswordModalOpen(false);
    setStaffToDeletePassword(null);
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

  const handleDeleteStaff = (id: string) => {
    setStaffList(prev => prev.filter(s => s.id !== id));
    showSuccess("Staff record deleted.");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <PreRegHeader onExport={handleExportCSV} onAddClick={() => setIsAddModalOpen(true)} />
      
      <PreRegMetrics metrics={metrics} />

      <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
        <PreRegFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      </Card>

      <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
        <div className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Access Master Ledger</CardTitle>
            <p className="text-sm text-slate-500 font-medium">Pre-approved staff credentials and activation keys.</p>
          </div>
          <Badge className="bg-indigo-50 text-indigo-700 border-none font-bold px-4 py-1.5 rounded-xl shrink-0">{filteredStaff.length} Entries</Badge>
        </div>

        <PreRegTable
          staff={filteredStaff}
          onCopyAccessCode={handleCopyAccessCode}
          onDispatchInvite={handleDispatchInvite}
          onToggleStatus={handleToggleStatus}
          onDeletePassword={requestDeletePassword}
          onDeleteStaff={handleDeleteStaff}
        />
      </Card>

      <AddPreRegModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleCreatePreRegistration} />
      <DispatchInviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} staff={selectedStaffForInvite} onConfirm={confirmSendInvite} />
      <DeletePasswordModal isOpen={isDeletePasswordModalOpen} onClose={() => setIsDeletePasswordModalOpen(false)} staff={staffToDeletePassword} onConfirm={confirmDeletePassword} />
    </div>
  );
};

export default StaffPreRegistration;