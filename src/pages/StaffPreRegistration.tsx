"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from "@/components/ui/Modal";
import BackButton from "@/components/ui/BackButton";
import { Search, Plus, Download, Loader2, X, Eye, Trash2, Lock, AlertCircle } from 'lucide-react';
import { STUDENTS as initialStudents, GRADES_DATA } from '@/lib/mock-data';
import { showSuccess, showError } from '@/utils/toast';
import { PreRegisteredStaff, AccessStatus, SYSTEM_ROLE_LABELS } from '@/types/staff-access';
import { INITIAL_PRE_REGISTERED_STAFF } from '@/lib/mock-staff-access';

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
  
  // Auth state for deletion
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Registration Form State
  const [fullName, setFullName] = useState("");
  const [assessmentNo, setAssessmentNo] = useState("");
  const [regGrade, setRegGrade] = useState("4");
  const [regStream, setRegStream] = useState("Blue");
  const [guardianName, setGuardianName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Get unique streams for the filter dropdown
  const uniqueStreams = useMemo(() => {
    const streams = new Set<string>();
    GRADES_DATA.forEach(g => g.streams.forEach(s => streams.add(s.name)));
    return Array.from(streams).sort();
  }, []);

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

  const handleRegisterStudent = () => {
    if (!fullName.trim() || !assessmentNo.trim()) return;
    const newStudent = { 
      id: (staffList.length + 1).toString(), 
      name: fullName.trim(), 
      assessment: assessmentNo.trim().toUpperCase(), 
      grade: regGrade, 
      stream: regStream, 
      gender: "M", 
      dob: "2014-01-01", 
      guardian: guardianName.trim(), 
      phone: phone.trim(), 
      email: "g@email.com", 
      health: "None", 
      needs: "None" 
    };
    setStaffList([newStudent, ...staffList]);
    setIsRegisterOpen(false);
    setFullName(""); setAssessmentNo(""); setGuardianName(""); setPhone("");
    showSuccess(`Student ${newStudent.name} registered!`);
  };

  const requestDelete = (staff: PreRegisteredStaff) => {
    setDeleteTarget({ id: staff.id, name: staff.fullName });
    setAuthPassword("");
    setAuthError("");
    setIsDeleteAuthOpen(true);
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
      if (deleteTarget) {
        setStaffList(prev => prev.filter(s => s.id !== deleteTarget.id));
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff Pre-Registration</h1>
            <p className="text-muted-foreground">Pre-authorize teacher system access credentials and manage activation keys.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="h-11 px-6 rounded-2xl border-slate-200 bg-white text-sm font-bold gap-2 shadow-sm hover:bg-slate-50 transition-colors"
            onClick={handleExportCSV}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            Export CSV
          </Button>
          <Button 
            className="h-11 px-6 rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold gap-2 transition-all active:scale-95"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={18} /> Add Staff
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
                <SelectItem value="Pre-Registered">Pre-Registered</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
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
            <p className="text-sm text-slate-500 font-medium">Pre-approved staff credentials and activation keys.</p>
          </div>
          <Badge className="bg-indigo-50 text-indigo-700 border-none font-bold px-4 py-1.5 rounded-xl">
            {filteredStaff.length} Active Records
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
                {filteredStaff.map((staff) => {
                  const roleInfo = SYSTEM_ROLE_LABELS[staff.systemRole] || SYSTEM_ROLE_LABELS.subject_teacher;
                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{staff.fullName}</p>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">ID: {staff.nationalId}</p>
                      </td>
                      <td className="px-8 py-5">
                        <Badge className={cn("rounded-xl font-bold border text-xs px-3 py-1", roleInfo.badgeBg, roleInfo.color)}>
                          {roleInfo.label}
                        </Badge>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Mail size={14} className="text-slate-400 shrink-0" />
                          <span className="font-medium">{staff.email}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer" onClick={() => navigator.clipboard.writeText(staff.tempAccessCode)}>
                          <code className="font-bold text-slate-800 text-xs">{staff.tempAccessCode}</code>
                          <Copy size={13} className="text-slate-400 cursor-pointer" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(staff.tempAccessCode); }} />
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <Badge className={cn("rounded-xl border-none font-bold text-xs px-3 py-1", staff.status === 'Active' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{staff.status}</Badge>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 px-3 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 gap-1.5"
                            onClick={() => {}}
                          >
                            <Send size={14} /> Send Key
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                            onClick={() => requestDelete(staff)}
                          >
                            <Lock size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            onClick={() => {}}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Search size={32} className="text-slate-200" />
                        <p className="text-slate-500 font-bold">No records match the current criteria.</p>
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
  );
};

export default StaffPreRegistration;