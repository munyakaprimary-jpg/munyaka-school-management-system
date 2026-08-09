"use client";

import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  X
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { STAFF, StaffMember } from '@/lib/mock-data';
import { PreRegisteredStaff } from '@/types/staff-access';
import { INITIAL_PRE_REGISTERED_STAFF } from '@/lib/mock-staff-access';
import { showSuccess } from '@/utils/toast';
import { useGradesStreams } from '@/hooks/useGradesStreams';

const Staff = () => {
  const navigate = useNavigate();
  const { grades, streams, isLoading } = useGradesStreams();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pre-Registered'>('All');
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Load staff directory
  const staffDirectory = useMemo<StaffMember[]>(() => {
    const saved = localStorage.getItem('munyaka_staff_directory');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return STAFF;
  }, []);

  // Load pre-registered ledger to unify accounts
  const preRegLedger = useMemo<PreRegisteredStaff[]>(() => {
    const saved = localStorage.getItem('munyaka_staff_prereg');
    return saved ? JSON.parse(saved) : INITIAL_PRE_REGISTERED_STAFF;
  }, []);

  // Unified Staff Master List (Combines Directory & Pre-Registered)
  const masterStaffList = useMemo(() => {
    const directoryMap = new Map<string, StaffMember>();
    staffDirectory.forEach(s => directoryMap.set(s.id_no, s));

    const combined: StaffMember[] = [...staffDirectory];

    // Include pre-registered staff who are not yet in the main directory
    preRegLedger.forEach(p => {
      if (!directoryMap.has(p.nationalId)) {
        combined.push({
          id: p.id,
          id_no: p.nationalId,
          tsc_no: p.tscNumber,
          name: p.fullName,
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
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
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

  const handleEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setIsEditModalOpen(true);
  };

  const handleSaveStaff = (updatedStaff: StaffMember) => {
    // Update in localStorage
    const saved = localStorage.getItem('munyaka_staff_directory');
    const staffList: StaffMember[] = saved ? JSON.parse(saved) : STAFF;
    const updatedList = staffList.map(s => s.id === updatedStaff.id ? updatedStaff : s);
    localStorage.setItem('munyaka_staff_directory', JSON.stringify(updatedList));
    
    setIsEditModalOpen(false);
    setEditingStaff(null);
    showSuccess(`Staff member "${updatedStaff.name}" updated successfully!`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 action-bar">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff & Personnel</h1>
            <p className="text-muted-foreground">Master directory of teachers, administrators, and support staff.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link to="/staff/pre-registration">
            <Button variant="outline" className="h-11 px-5 rounded-2xl border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 gap-2 shadow-sm">
              <Key size={18} /> Manage Access Keys
            </Button>
          </Link>
          <Link to="/staff/registration">
            <Button className="h-11 px-6 rounded-2xl gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100">
              <UserPlus size={18} /> Onboard Staff
            </Button>
          </Link>
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

      {/* Master Staff Data Table */}
      <div className="table-scroll-viewport">
        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-8 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Personnel Directory</CardTitle>
              <p className="text-sm text-slate-500 font-medium">Full master ledger of internal school staff.</p>
            </div>
            <Badge className="bg-indigo-50 text-indigo-700 border-none font-bold px-4 py-1.5 rounded-xl">
              Showing {filteredStaff.length} Records
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[900px]">
                <thead className="text-slate-500 bg-slate-50/50 border-b">
                  <tr>
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
                      <td className="px-8 py-5 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap">{member.name}</p>
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
                              onClick={() => handleEditStaff(member)}
                              className="rounded-xl gap-2 font-bold cursor-pointer text-slate-700 hover:text-indigo-600"
                            >
                              <Edit size={15} /> Edit Profile
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator className="my-1" />
                            
                            <DropdownMenuItem 
                              onClick={() => navigate('/staff/pre-registration')}
                              className="rounded-xl gap-2 font-bold cursor-pointer text-indigo-600 hover:bg-indigo-50"
                            >
                              <Key size={15} /> Manage Access Key
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}

                  {filteredStaff.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
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

      {/* Edit Staff Modal */}
      {isEditModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Edit Staff Profile</h3>
              <button 
                onClick={() => { setIsEditModalOpen(false); setEditingStaff(null); }}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Full Name</Label>
                <Input 
                  defaultValue={editingStaff.name}
                  className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Role / Designation</Label>
                <Input 
                  defaultValue={editingStaff.role}
                  className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Department</Label>
                <Input 
                  defaultValue={editingStaff.department}
                  className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Phone</Label>
                  <Input 
                    defaultValue={editingStaff.phone}
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Email</Label>
                  <Input 
                    type="email"
                    defaultValue={editingStaff.email}
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Staff ID</Label>
                <Input 
                  defaultValue={editingStaff.id}
                  readOnly
                  className="rounded-xl h-12 bg-slate-100 border-none font-bold text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">National ID</Label>
                <Input 
                  defaultValue={editingStaff.id_no}
                  className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">TSC Number</Label>
                <Input 
                  defaultValue={editingStaff.tsc_no || ''}
                  className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  variant="ghost" 
                  className="flex-1 rounded-xl h-11 font-bold"
                  onClick={() => { setIsEditModalOpen(false); setEditingStaff(null); }}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100"
                  onClick={() => handleSaveStaff(editingStaff)}
                >
                  Save Changes
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