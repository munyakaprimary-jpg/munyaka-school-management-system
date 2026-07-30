"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from "@/components/ui/Modal";
import BackButton from "@/components/ui/BackButton";
import { 
  UserPlus, 
  Search, 
  Key, 
  Copy, 
  Send, 
  ShieldCheck, 
  ShieldAlert, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Lock, 
  Eye, 
  Trash2, 
  Ban, 
  Check, 
  Sparkles,
  Users,
  Building2,
  Phone,
  Mail,
  FileSpreadsheet
} from 'lucide-react';
import { PreRegisteredStaff, SystemRole, AccessStatus, SYSTEM_ROLE_LABELS } from '@/types/staff-access';
import { INITIAL_PRE_REGISTERED_STAFF } from '@/lib/mock-staff-access';
import { GRADES_DATA } from '@/lib/mock-data';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const StaffPreRegistration = () => {
  const [staffList, setStaffList] = useState<PreRegisteredStaff[]>(() => {
    const saved = localStorage.getItem('munyaka_staff_prereg');
    return saved ? JSON.parse(saved) : INITIAL_PRE_REGISTERED_STAFF;
  });

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedStaffForInvite, setSelectedStaffForInvite] = useState<PreRegisteredStaff | null>(null);

  // Form states for new pre-registration
  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [tscNumber, setTscNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [systemRole, setSystemRole] = useState<SystemRole>("subject_teacher");
  const [department, setDepartment] = useState("Languages & Humanities");
  const [assignedGrade, setAssignedGrade] = useState("all");
  const [assignedStream, setAssignedStream] = useState("all");
  const [selectedSubjects, setSelectedSubjects] = useState<string>("Mathematics, Science & Tech");
  const [tempAccessCode, setTempAccessCode] = useState("");

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem('munyaka_staff_prereg', JSON.stringify(staffList));
  }, [staffList]);

  // Auto-generate random access key when opening modal
  const generateRandomKey = () => {
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    setTempAccessCode(`MUNYAKA-${randDigits}`);
  };

  const handleOpenAddModal = () => {
    generateRandomKey();
    setIsAddModalOpen(true);
  };

  // Filtered Master List
  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      const query = searchTerm.toLowerCase();
      const matchesSearch = 
        s.fullName.toLowerCase().includes(query) ||
        s.nationalId.toLowerCase().includes(query) ||
        (s.tscNumber && s.tscNumber.toLowerCase().includes(query)) ||
        s.email.toLowerCase().includes(query) ||
        s.phone.toLowerCase().includes(query) ||
        s.tempAccessCode.toLowerCase().includes(query);

      const matchesRole = roleFilter === 'all' || s.systemRole === roleFilter;
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staffList, searchTerm, roleFilter, statusFilter]);

  // Metrics calculation
  const metrics = useMemo(() => ({
    total: staffList.length,
    active: staffList.filter(s => s.status === 'Active').length,
    pending: staffList.filter(s => s.status === 'Pending Invite' || s.status === 'Pre-Registered').length,
    suspended: staffList.filter(s => s.status === 'Suspended').length
  }), [staffList]);

  // Pre-Register New Staff Handler
  const handleCreatePreRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !nationalId.trim() || !email.trim() || !phone.trim()) {
      showError("Please complete all required fields.");
      return;
    }

    // Check duplicate national ID or Email
    const exists = staffList.some(
      s => s.nationalId === nationalId.trim() || s.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (exists) {
      showError("A staff member with this National ID or Email is already pre-registered.");
      return;
    }

    const newStaff: PreRegisteredStaff = {
      id: `PR-${Math.floor(100 + Math.random() * 900)}`,
      fullName: fullName.trim(),
      nationalId: nationalId.trim(),
      tscNumber: tscNumber.trim() ? `TSC-${tscNumber.trim().replace(/^TSC-/i, '')}` : undefined,
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      systemRole,
      department,
      assignedGrade: assignedGrade !== 'all' ? assignedGrade : undefined,
      assignedStream: assignedStream !== 'all' ? assignedStream : undefined,
      assignedSubjects: selectedSubjects.split(',').map(s => s.trim()).filter(Boolean),
      tempAccessCode: tempAccessCode.trim() || `MUNYAKA-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "Pre-Registered",
      datePreRegistered: new Date().toISOString().split('T')[0]
    };

    setStaffList([newStaff, ...staffList]);
    setIsAddModalOpen(false);

    // Reset Form
    setFullName("");
    setNationalId("");
    setTscNumber("");
    setEmail("");
    setPhone("");
    setSystemRole("subject_teacher");
    setDepartment("Languages & Humanities");

    showSuccess(`Pre-registered ${newStaff.fullName}! Temporary Access Key: ${newStaff.tempAccessCode}`);
  };

  // Copy Access Key To Clipboard
  const handleCopyAccessCode = (code: string, name: string) => {
    navigator.clipboard.writeText(code);
    showSuccess(`Copied Access Key for ${name}: ${code}`);
  };

  // Dispatch Invitation via SMS/Email
  const handleDispatchInvite = (staff: PreRegisteredStaff) => {
    setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, status: 'Pending Invite' } : s));
    setSelectedStaffForInvite(staff);
    setIsInviteModalOpen(true);
  };

  const confirmSendInvite = () => {
    if (selectedStaffForInvite) {
      showSuccess(`Access Key credentials dispatched to ${selectedStaffForInvite.phone} and ${selectedStaffForInvite.email}`);
    }
    setIsInviteModalOpen(false);
  };

  // Toggle Account Activation / Suspension
  const handleToggleStatus = (id: string, currentStatus: AccessStatus) => {
    const nextStatus: AccessStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    setStaffList(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status: nextStatus,
          activatedAt: nextStatus === 'Active' ? new Date().toLocaleString() : s.activatedAt
        };
      }
      return s;
    }));
    showSuccess(`Account status updated to ${nextStatus}.`);
  };

  // Revoke Pre-Registration
  const handleRevokeStaff = (id: string, name: string) => {
    setStaffList(prev => prev.filter(s => s.id !== id));
    showSuccess(`Revoked pre-registration for ${name}.`);
  };

  // Export Pre-Registration Master Table to CSV
  const handleExportCSV = () => {
    if (filteredStaff.length === 0) {
      showError("No pre-registered staff to export.");
      return;
    }

    const row1 = "MUNYAKA PRIMARY AND JUNIOR SCHOOL";
    const row2 = "P.O. BOX 5239-30100,ELDORET";
    const row3 = "MOTTO: KNOWLEDGE POWER";
    const row4 = "SYSTEM ACCESS PRE-REGISTRATION MASTER LEDGER";
    const row5 = `DATE GENERATED: ${new Date().toLocaleDateString()}`;

    const headers = [
      "Staff Ref ID", "Full Name", "National ID", "TSC Number", 
      "Email Address", "Phone Number", "System Role", "Department", 
      "Assigned Subjects", "Temp Access Key", "Status", "Date Pre-Registered"
    ];

    const rows = filteredStaff.map(s => [
      `"${s.id}"`,
      `"${s.fullName.replace(/"/g, '""')}"`,
      `"${s.nationalId}"`,
      `"${s.tscNumber || 'N/A'}"`,
      `"${s.email}"`,
      `"${s.phone}"`,
      `"${SYSTEM_ROLE_LABELS[s.systemRole]?.label || s.systemRole}"`,
      `"${s.department}"`,
      `"${s.assignedSubjects.join('; ')}"`,
      `"${s.tempAccessCode}"`,
      `"${s.status}"`,
      `"${s.datePreRegistered}"`
    ]);

    const csvContent = [
      row1, row2, row3, row4, row5, "",
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `staff_preregistration_master_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess(`Exported ${filteredStaff.length} pre-registered staff entries.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/staff" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff Pre-Registration Master Table</h1>
            <p className="text-muted-foreground">Pre-authorize teacher system access credentials and manage activation keys.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="h-11 px-5 rounded-2xl border-slate-200 bg-white text-sm font-bold gap-2 text-slate-700 hover:bg-slate-50 shadow-sm"
            onClick={handleExportCSV}
          >
            <Download size={18} /> Export Master CSV
          </Button>
          <Button 
            className="h-11 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg shadow-indigo-100"
            onClick={handleOpenAddModal}
          >
            <UserPlus size={18} /> Pre-Register Staff
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-[2rem] bg-white border-none shadow-sm p-6 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Pre-Registered</p>
            <h3 className="text-2xl font-black text-slate-900">{metrics.total}</h3>
          </div>
        </Card>

        <Card className="rounded-[2rem] bg-white border-none shadow-sm p-6 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Accounts</p>
            <h3 className="text-2xl font-black text-emerald-600">{metrics.active}</h3>
          </div>
        </Card>

        <Card className="rounded-[2rem] bg-white border-none shadow-sm p-6 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
            <Key size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pending Activation</p>
            <h3 className="text-2xl font-black text-amber-600">{metrics.pending}</h3>
          </div>
        </Card>

        <Card className="rounded-[2rem] bg-white border-none shadow-sm p-6 flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shrink-0">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Suspended Access</p>
            <h3 className="text-2xl font-black text-rose-600">{metrics.suspended}</h3>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search by name, TSC No, National ID, email, or Key..." 
              className="pl-11 h-12 rounded-2xl bg-slate-50 border-none font-medium text-sm focus:bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 text-sm">
              <SelectValue placeholder="System Role Filter" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All System Roles</SelectItem>
              <SelectItem value="head_teacher">Head Teacher</SelectItem>
              <SelectItem value="senior_teacher">Senior Teacher</SelectItem>
              <SelectItem value="class_teacher">Class Teacher</SelectItem>
              <SelectItem value="subject_teacher">Subject Teacher</SelectItem>
              <SelectItem value="bursar">Bursar / Finance</SelectItem>
              <SelectItem value="support_admin">System Admin</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 text-sm">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pre-Registered">Pre-Registered</SelectItem>
              <SelectItem value="Pending Invite">Pending Invite</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Master Access Table */}
      <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
        <CardHeader className="p-8 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Pre-Authorized System Access Master Ledger</CardTitle>
            <p className="text-sm text-slate-500 font-medium">Pre-approved staff credentials, temporary access keys, and system permissions.</p>
          </div>
          <Badge className="bg-indigo-50 text-indigo-700 border-none font-bold px-4 py-1.5 rounded-xl">
            {filteredStaff.length} Pre-Registered Staff
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/60 border-b">
                <tr>
                  <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Staff Credentials</th>
                  <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">System Role</th>
                  <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Department / Subjects</th>
                  <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Temp Access Key</th>
                  <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Status</th>
                  <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((staff) => {
                    const roleInfo = SYSTEM_ROLE_LABELS[staff.systemRole] || SYSTEM_ROLE_LABELS.subject_teacher;
                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 font-black flex items-center justify-center text-sm shrink-0">
                              {staff.fullName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{staff.fullName}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mt-0.5">
                                <span>ID: {staff.nationalId}</span>
                                {staff.tscNumber && <span className="font-semibold text-slate-600">• {staff.tscNumber}</span>}
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium">{staff.email} • {staff.phone}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <Badge className={cn("rounded-xl font-bold border text-xs px-3 py-1", roleInfo.badgeBg, roleInfo.color)}>
                            {roleInfo.label}
                          </Badge>
                          {staff.assignedGrade && (
                            <p className="text-[11px] text-slate-500 font-bold mt-1">
                              Class: {staff.assignedGrade} {staff.assignedStream || ''}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-semibold text-slate-800 text-xs">{staff.department}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {staff.assignedSubjects.map(subj => (
                              <Badge key={subj} variant="outline" className="text-[10px] rounded-md font-semibold text-slate-600 border-slate-200 bg-white">
                                {subj}
                              </Badge>
                            ))}
                          </div>
                        </td>

                        <td className="px-6 py-5 text-center">
                          <div className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer group/code"
                            onClick={() => handleCopyAccessCode(staff.tempAccessCode, staff.fullName)}
                            title="Click to copy access key"
                          >
                            <code className="font-black text-slate-800 text-xs tracking-wider">{staff.tempAccessCode}</code>
                            <Copy size={13} className="text-slate-400 group-hover/code:text-indigo-600" />
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">Reg: {staff.datePreRegistered}</p>
                        </td>

                        <td className="px-6 py-5 text-center">
                          <Badge className={cn("rounded-xl border-none font-bold text-xs px-3 py-1",
                            staff.status === 'Active' ? "bg-emerald-50 text-emerald-700" :
                            staff.status === 'Pending Invite' ? "bg-amber-50 text-amber-700" :
                            staff.status === 'Suspended' ? "bg-rose-50 text-rose-700" :
                            "bg-blue-50 text-blue-700"
                          )}>
                            {staff.status}
                          </Badge>
                        </td>

                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-9 px-3 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 gap-1.5"
                              onClick={() => handleDispatchInvite(staff)}
                              title="Dispatch Invite Credentials"
                            >
                              <Send size={14} /> Send Key
                            </Button>

                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={cn("h-9 w-9 rounded-xl", 
                                staff.status === 'Active' 
                                  ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50" 
                                  : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                              )}
                              onClick={() => handleToggleStatus(staff.id, staff.status)}
                              title={staff.status === 'Active' ? "Suspend Access" : "Activate Access"}
                            >
                              {staff.status === 'Active' ? <Ban size={16} /> : <Check size={16} />}
                            </Button>

                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => handleRevokeStaff(staff.id, staff.fullName)}
                              title="Revoke Pre-Registration"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Users size={36} className="text-slate-200" />
                        <p className="font-bold text-slate-700">No pre-registered staff entries found matching your search.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pre-Register Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Pre-Register Staff for System Access"
        description="Authorize new teacher credentials and pre-assign system roles."
        maxWidth="max-w-2xl"
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-xl font-bold h-12 px-6"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleCreatePreRegistration}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold h-12 px-8 text-white shadow-lg shadow-indigo-100 gap-2"
            >
              <Sparkles size={18} /> Pre-Authorize Access
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreatePreRegistration} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Full Name *</Label>
              <Input 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Jane Mwangi"
                className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">National ID Number *</Label>
              <Input 
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="e.g. 28374615"
                className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">TSC Number (Optional)</Label>
              <Input 
                value={tscNumber}
                onChange={(e) => setTscNumber(e.target.value)}
                placeholder="e.g. 482910"
                className="rounded-xl h-12 bg-slate-50 border-none font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">System Access Role *</Label>
              <Select value={systemRole} onValueChange={(val: SystemRole) => setSystemRole(val)}>
                <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                  <SelectValue />
                </SelectTrigger>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. j.mwangi@munyaka.sc.ke"
                className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Phone Number *</Label>
              <Input 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +254 700 111 222"
                className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="Mathematics & Science">Mathematics & Science</SelectItem>
                  <SelectItem value="Languages & Humanities">Languages & Humanities</SelectItem>
                  <SelectItem value="Technical & Vocational">Technical & Vocational</SelectItem>
                  <SelectItem value="Creative Arts">Creative Arts</SelectItem>
                  <SelectItem value="School Administration">School Administration</SelectItem>
                  <SelectItem value="Accounts & Finance">Accounts & Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Temporary Access Key</Label>
              <div className="flex gap-2">
                <Input 
                  value={tempAccessCode}
                  onChange={(e) => setTempAccessCode(e.target.value)}
                  placeholder="MUNYAKA-XXXX"
                  className="rounded-xl h-12 bg-slate-50 border-none font-black text-slate-900 tracking-wider text-center"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-12 px-3 rounded-xl border-slate-200"
                  onClick={generateRandomKey}
                  title="Generate New Random Key"
                >
                  <RefreshCw size={16} />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Assigned Learning Areas / Subjects</Label>
            <Input 
              value={selectedSubjects}
              onChange={(e) => setSelectedSubjects(e.target.value)}
              placeholder="Comma separated (e.g. Mathematics, Science & Tech)"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold"
            />
          </div>
        </form>
      </Modal>

      {/* Dispatch Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Dispatch System Access Key"
        description="Send invitation credentials directly to teacher."
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 text-white" onClick={confirmSendInvite}>
              <Send size={16} className="mr-2" /> Dispatch Invitation
            </Button>
          </div>
        }
      >
        {selectedStaffForInvite && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Recipient</p>
              <p className="text-lg font-bold text-slate-900">{selectedStaffForInvite.fullName}</p>
              <p className="text-xs text-slate-600">{selectedStaffForInvite.email} • {selectedStaffForInvite.phone}</p>
            </div>

            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2">
              <p className="text-xs font-black uppercase text-indigo-500 tracking-widest">Message Preview</p>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                Dear {selectedStaffForInvite.fullName}, you have been pre-registered for the Munyaka Primary System Portal ({SYSTEM_ROLE_LABELS[selectedStaffForInvite.systemRole]?.label}). 
                Use your Temporary Access Key: <strong className="font-black text-indigo-700">{selectedStaffForInvite.tempAccessCode}</strong> along with your National ID ({selectedStaffForInvite.nationalId}) to activate your account.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StaffPreRegistration;