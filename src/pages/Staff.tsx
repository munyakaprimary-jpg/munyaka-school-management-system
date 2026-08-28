"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  UserCheck, 
  Clock, 
  Plus,
  X,
  Save,
  AlertCircle,
  Loader2,
  Users,
  Trash2
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { showSuccess, showError } from '@/utils/toast';
import { staffService, StaffRecord, CreateStaffData } from '@/services/staffService';

const Staff = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive' | 'Pre-Registered'>('All');
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffRecord | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  // Form state for new/edit staff
  const [formData, setFormData] = useState<CreateStaffData>({
    full_name: '',
    role: '',
    phone: '',
    email: '',
    tsc_number: '',
    national_id: '',
    department: 'School Administration',
    status: 'Active'
  });
  const [formError, setFormError] = useState('');

  /**
   * Fetch all staff records from the data store and update the
   * component state. This is the single source of truth for refresh
   * operations and is called on mount, after a save, and on
   * subscription events.
   */
  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const staff = await staffService.getAllStaff();
      setStaffList(staff);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      showError('Failed to load staff directory');
      setStaffList([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load + real-time subscription to staff data changes
  useEffect(() => {
    fetchStaff();

    // Subscribe to any data changes (same-tab or cross-tab) so the
    // table re-fetches automatically when other parts of the app add,
    // edit, or delete staff records.
    const subscription = staffService.subscribeToChanges((records) => {
      setStaffList(records);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchStaff]);

  // Filter staff by Search Term & Status Tabs
  const filteredStaff = React.useMemo(() => {
    return staffList.filter(s => {
      const matchesSearch = 
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.national_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.department?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = 
        statusFilter === 'All' || 
        s.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [staffList, searchTerm, statusFilter]);

  const activeCount = React.useMemo(() => staffList.filter(s => s.status === 'Active').length, [staffList]);
  const inactiveCount = React.useMemo(() => staffList.filter(s => s.status === 'Inactive').length, [staffList]);
  const preRegCount = React.useMemo(() => staffList.filter(s => s.status === 'Pre-Registered').length, [staffList]);

  /**
   * Open the modal in "add" mode. Resets the form to its empty state
   * and clears any previous error message.
   */
  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingStaff(null);
    setFormData({
      full_name: '',
      role: '',
      phone: '',
      email: '',
      tsc_number: '',
      national_id: '',
      department: 'School Administration',
      status: 'Active'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  /**
   * Open the modal in "edit" mode and pre-fill the form with the
   * selected staff record's current values.
   */
  const handleOpenEdit = (staff: StaffRecord) => {
    setModalMode('edit');
    setEditingStaff(staff);
    setFormData({
      full_name: staff.full_name,
      role: staff.role,
      phone: staff.phone,
      email: staff.email,
      tsc_number: staff.tsc_number || '',
      national_id: staff.national_id || '',
      department: staff.department || 'School Administration',
      status: staff.status
    });
    setFormError('');
    setIsModalOpen(true);
  };

  /**
   * Validate and submit the form. Creates a new staff record when in
   * "add" mode or updates an existing one in "edit" mode. On success
   * the modal is closed and the table is re-fetched so the new/updated
   * record appears immediately.
   */
  const handleSaveStaff = async () => {
    if (!formData.full_name.trim() || !formData.role.trim()) {
      setFormError('Please fill in all required fields (Full Name, Role / Designation).');
      return;
    }

    if (!formData.email.trim() || !formData.phone.trim()) {
      setFormError('Please fill in Email and Phone Number.');
      return;
    }

    setIsSaving(true);
    setFormError('');

    try {
      if (modalMode === 'add') {
        const createData: CreateStaffData = {
          full_name: formData.full_name,
          role: formData.role,
          phone: formData.phone,
          email: formData.email,
          tsc_number: formData.tsc_number || undefined,
          national_id: formData.national_id || undefined,
          department: formData.department || 'School Administration',
          status: formData.status
        };
        
        const newStaff = await staffService.createStaff(createData);
        showSuccess(`Staff member "${newStaff.full_name}" added successfully!`);
      } else if (editingStaff) {
        await staffService.updateStaff(editingStaff.id, formData);
        showSuccess(`Staff member "${formData.full_name}" updated successfully!`);
      }

      // Close the modal and refresh the list so the user sees the
      // new or updated record in the table immediately.
      setIsModalOpen(false);
      setEditingStaff(null);
      setFormData({
        full_name: '',
        role: '',
        phone: '',
        email: '',
        tsc_number: '',
        national_id: '',
        department: 'School Administration',
        status: 'Active'
      });
      await fetchStaff();
    } catch (error: any) {
      console.error('Error saving staff:', error);
      setFormError(error.message || 'Failed to save staff member. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Close the modal and clear all form state. The error message is
   * also reset so a stale message doesn't linger between opens.
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
    setFormError('');
    setFormData({
      full_name: '',
      role: '',
      phone: '',
      email: '',
      tsc_number: '',
      national_id: '',
      department: 'School Administration',
      status: 'Active'
    });
  };

  /**
   * Delete a staff record after a confirm() prompt. Calls the data
   * service to remove the record and then refreshes the table.
   */
  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await staffService.deleteStaff(id);
      showSuccess(`Staff member "${name}" deleted successfully!`);
      await fetchStaff();
    } catch (error) {
      console.error('Error deleting staff:', error);
      showError('Failed to delete staff member');
    }
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
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
            Add Staff
          </Button>
        </div>
      </div>

      {/* Metrics Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm flex items-center gap-4 border-none">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Users size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Staff Records</p>
            <p className="text-2xl font-black text-slate-900">{staffList.length}</p>
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
          <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Inactive</p>
            <p className="text-2xl font-black text-slate-900">{inactiveCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm flex items-center gap-4 border-none">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl">
            <Key size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pre-Registered</p>
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
          {(['All', 'Active', 'Inactive', 'Pre-Registered'] as const).map((status) => (
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

      {/* Staff Data Table / Empty State / Loading Skeleton */}
      {isLoading ? (
        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
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
                  {[1,2,3].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-8 py-5 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-200" />
                          <div className="flex flex-col min-w-0">
                            <div className="h-4 w-48 bg-slate-200 rounded" />
                            <div className="h-3 w-32 bg-slate-200 rounded mt-1" />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 min-w-[180px]">
                        <div className="h-4 w-36 bg-slate-200 rounded" />
                        <div className="h-3 w-28 bg-slate-200 rounded mt-1" />
                      </td>
                      <td className="px-8 py-5 min-w-[220px]">
                        <div className="h-3 w-40 bg-slate-200 rounded mb-1" />
                        <div className="h-3 w-40 bg-slate-200 rounded" />
                      </td>
                      <td className="px-8 py-5 text-center min-w-[140px]">
                        <div className="h-5 w-24 bg-slate-200 rounded-xl mx-auto" />
                      </td>
                      <td className="px-8 py-5 text-right min-w-[120px]">
                        <div className="h-8 w-24 bg-slate-200 rounded-xl mx-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : filteredStaff.length === 0 ? (
        /* Empty State - No staff registered */
        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-16 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center">
              <Users size={48} className="text-slate-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No staff members registered yet</h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                {searchTerm || statusFilter !== 'All' 
                  ? 'No staff match the current search or filter criteria. Try adjusting your filters.'
                  : 'The staff directory is currently empty. Add your first staff member to get started.'}
              </p>
              <Button 
                className="rounded-2xl gap-2 h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100"
                onClick={handleOpenAdd}
              >
                <UserPlus size={20} /> Add New Staff Member
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        /* Staff Data Table */
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
                            {member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap truncate">
                              {member.full_name}
                            </p>
                            <p className="text-xs text-slate-400 font-medium whitespace-nowrap truncate">
                              {member.national_id ? `ID: ${member.national_id}` : 'No National ID'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-5 min-w-[180px]">
                        <p className="font-bold text-slate-800 whitespace-nowrap">{member.role}</p>
                        <p className="text-xs text-slate-400 font-medium whitespace-nowrap">
                          {member.department || 'School Administration'}
                        </p>
                      </td>

                      <td className="px-8 py-5 min-w-[220px]">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-700 whitespace-nowrap">
                            <Phone size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{member.phone}</span>
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
                            : member.status === 'Inactive'
                            ? "bg-rose-50 text-rose-700 border-none font-bold text-xs px-3 py-1 rounded-xl"
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
                            
                            <DropdownMenuItem 
                              onClick={() => handleDeleteStaff(member.id, member.full_name)}
                              className="rounded-xl gap-2 font-bold cursor-pointer text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 size={15} /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold">
                  <AlertCircle size={14} /> {formError}
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Full Name *</Label>
                <Input 
                  value={formData.full_name} 
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
                  placeholder="e.g. Jane Mwangi" 
                  className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Role / Designation *</Label>
                <Input
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  placeholder="e.g. TEACHER, ADMINISTRATOR"
                  className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Phone *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+254..."
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@school.ac.ke"
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">TSC Number (Optional)</Label>
                <Input
                  value={formData.tsc_number}
                  onChange={(e) => setFormData({...formData, tsc_number: e.target.value})}
                  placeholder="e.g. TSC-482910"
                  className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">National ID (Optional)</Label>
                <Input
                  value={formData.national_id}
                  onChange={(e) => setFormData({...formData, national_id: e.target.value})}
                  placeholder="e.g. 28374615"
                  className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Department</Label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  placeholder="e.g. Mathematics & Science"
                  className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Status</Label>
                <Select value={formData.status} onValueChange={(val: 'Active' | 'Inactive' | 'Pre-Registered') => setFormData({...formData, status: val})}>
                  <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Pre-Registered">Pre-Registered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  variant="ghost" 
                  className="flex-1 rounded-xl h-11 font-bold"
                  onClick={handleCloseModal}
                  disabled={isSaving}
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