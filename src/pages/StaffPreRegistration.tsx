"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Modal from '@/components/ui/Modal';
import BackButton from '@/components/ui/BackButton';
import { Search, Plus, Download, Loader2, X } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { PreRegisteredStaff, AccessStatus } from '@/types/staff-access';
import { INITIAL_PRE_REGISTERED_STAFF } from '@/lib/mock-staff-access';

// Modular sub-components
import PreRegHeader from '@/components/staff-access/PreRegHeader';
import PreRegMetrics from '@/components/staff-access/PreRegMetrics';
import AddPreRegModal from '@/components/staff-access/AddPreRegModal';
import DispatchInviteModal from '@/components/staff-access/DispatchInviteModal';
import StaffPreRegTable from '@/components/staff-access/StaffPreRegTable';
import StaffPreRegFilters from '@/components/staff-access/StaffPreRegFilters';
import AuthModal from '@/components/staff-access/AuthModal';

const StaffPreRegistration = () => {
  const [staffList, setStaffList] = useState<PreRegisteredStaff[]>(() => {
    const saved = localStorage.getItem('munyaka_staff_prereg');
    return saved ? JSON.parse(saved) : INITIAL_PRE_REGISTERED_STAFF;
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleteAuthOpen, setIsDeleteAuthOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isSuspendAuthOpen, setIsSuspendAuthOpen] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<{ id: string; name: string } | null>(null);
  const [isSendKeyOpen, setIsSendKeyOpen] = useState(false);
  const [sendKeyTarget, setSendKeyTarget] = useState<PreRegisteredStaff | null>(null);
  
  // Auth state for deletion and suspension
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [authAction, setAuthAction] = useState<'delete' | 'suspend' | null>(null);

  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           s.nationalId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           s.tempAccessCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           s.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || s.systemRole === roleFilter;
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staffList, searchTerm, roleFilter, statusFilter]);

  const metrics = useMemo(() => ({
    total: staffList.length,
    active: staffList.filter(s => s.status === 'Active').length,
    pending: staffList.filter(s => s.status === 'Pending Invite').length,
    suspended: staffList.filter(s => s.status === 'Suspended').length,
  }), [staffList]);

  const handleAddStaff = (data: Partial<PreRegisteredStaff>) => {
    const newStaff: PreRegisteredStaff = {
      id: `PR-${Date.now()}`,
      fullName: data.fullName || "",
      nationalId: data.nationalId || "",
      tscNumber: data.tscNumber,
      email: data.email || "",
      phone: data.phone || "",
      systemRole: data.systemRole || "subject_teacher",
      department: data.department || "",
      assignedSubjects: data.assignedSubjects || "",
      tempAccessCode: data.tempAccessCode || "",
      status: "Pre-Registered" as AccessStatus,
      datePreRegistered: new Date().toLocaleDateString(),
    };
    setStaffList([newStaff, ...staffList]);
    setIsAddModalOpen(false);
    showSuccess(`Staff member "${newStaff.fullName}" pre-registered successfully!`);
  };

  const handleSendKey = (staff: PreRegisteredStaff) => {
    setSendKeyTarget(staff);
    setIsSendKeyOpen(true);
  };

  const handleConfirmDispatch = () => {
    if (sendKeyTarget) {
      setStaffList(prev => prev.map(s => 
        s.id === sendKeyTarget.id ? { ...s, status: 'Pending Invite' as AccessStatus } : s
      ));
      showSuccess(`Invitation dispatched to ${sendKeyTarget.fullName}!`);
    }
    setIsSendKeyOpen(false);
    setSendKeyTarget(null);
  };

  const requestDelete = (staff: PreRegisteredStaff) => {
    setDeleteTarget({ id: staff.id, name: staff.fullName });
    setAuthPassword("");
    setAuthError("");
    setAuthAction('delete');
    setIsDeleteAuthOpen(true);
  };

  const requestSuspend = (staff: PreRegisteredStaff) => {
    setSuspendTarget({ id: staff.id, name: staff.fullName });
    setAuthPassword("");
    setAuthError("");
    setAuthAction('suspend');
    setIsSuspendAuthOpen(true);
  };

  const handleVerifyAuth = async () => {
    if (!authPassword.trim()) {
      setAuthError("Password is required");
      return;
    }

    setIsVerifying(true);
    setAuthError("");
    
    await new Promise(r => setTimeout(r, 600));

    const currentAdminPass = localStorage.getItem('munyaka_admin_pass') || 'admin123';

    if (authPassword === currentAdminPass) {
      if (authAction === 'delete' && deleteTarget) {
        setStaffList(prev => prev.filter(s => s.id !== deleteTarget.id));
        showSuccess(`Staff "${deleteTarget.name}" deleted successfully.`);
      } else if (authAction === 'suspend' && suspendTarget) {
        setStaffList(prev => prev.map(s => 
          s.id === suspendTarget.id 
            ? { ...s, status: s.status === 'Suspended' ? 'Active' : 'Suspended' }
            : s
        ));
        showSuccess(`Staff "${suspendTarget.name}" status updated.`);
      }
      setIsDeleteAuthOpen(false);
      setIsSuspendAuthOpen(false);
      setDeleteTarget(null);
      setSuspendTarget(null);
      setAuthPassword("");
    } else {
      setAuthError("Invalid admin password");
      showError("Authorization failed");
      setAuthPassword("");
    }
    setIsVerifying(false);
  };

  const handleExportCSV = () => {
    if (filteredStaff.length === 0) {
      showSuccess("No records found for the current filters.");
      return;
    }

    setIsExporting(true);
    
    setTimeout(() => {
      const headers = ["Staff Ref ID", "Full Name", "National ID", "Email", "Role", "Access Key", "Status"];
      const rows = filteredStaff.map(s => [
        s.id,
        s.fullName,
        s.nationalId,
        s.email,
        s.systemRole,
        s.tempAccessCode,
        s.status
      ]);

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
      showSuccess(`Exported ${filteredStaff.length} staff records to CSV`);
    }, 800);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <PreRegHeader onExport={handleExportCSV} onAddClick={() => setIsAddModalOpen(true)} />

      <PreRegMetrics metrics={metrics} />

      <StaffPreRegFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onClearFilters={clearFilters}
      />

      <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
        <CardHeader className="p-8 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Access Master Ledger</CardTitle>
            <p className="text-sm text-slate-500 font-medium">Pre-approved staff credentials and activation keys.</p>
          </div>
          <Badge className="bg-indigo-50 text-indigo-700 border-none font-bold px-4 py-1.5 rounded-xl">
            {filteredStaff.length} Active Records
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <StaffPreRegTable
            staffList={staffList}
            filteredStaff={filteredStaff}
            onSendKey={handleSendKey}
            onDelete={requestDelete}
          />
        </CardContent>
      </Card>

      {/* Add Staff Modal */}
      <AddPreRegModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddStaff}
      />

      {/* Dispatch Invite Modal */}
      <DispatchInviteModal
        isOpen={isSendKeyOpen}
        onClose={() => { setIsSendKeyOpen(false); setSendKeyTarget(null); }}
        staff={sendKeyTarget}
        onConfirm={handleConfirmDispatch}
      />

      {/* Auth Modal for Deletion */}
      <AuthModal
        isOpen={isDeleteAuthOpen}
        onClose={() => { setIsDeleteAuthOpen(false); setDeleteTarget(null); setAuthPassword(""); setAuthError(""); }}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authError={authError}
        setAuthError={setAuthError}
        isVerifying={isVerifying}
        onVerify={handleVerifyAuth}
        targetName={deleteTarget?.name || null}
        actionType="delete"
      />
    </div>
  );
};

export default StaffPreRegistration;