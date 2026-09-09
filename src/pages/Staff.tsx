import React, { useState, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Filter, Shield, Mail, Phone, 
  CheckCircle2, XCircle, Edit, Trash2, MoreHorizontal, 
  FileSpreadsheet, Download, RefreshCw, KeyRound, UserCheck, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { useStaffData } from '@/hooks/useStaffData';
import { toTitleCase, toRoleTitleCase } from '@/utils/staffFormatting';
import { StaffMember } from '@/services/staffMasterService';
import { toast } from 'sonner';

export default function Staff() {
  const { staff, loading, error, refreshStaff, addStaffMember, updateStaffMember, deleteStaffMember, toggleActiveStatus } = useStaffData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  
  // Add/Edit Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    tsc_number: '',
    role: 'teacher',
    system_role: 'teacher',
    department: 'Academics',
    status: 'active' as 'active' | 'inactive'
  });

  // Filtered staff list using unified data source
  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const name = member.name || '';
      const email = member.email || '';
      const tsc = member.tsc_number || member.staff_id || '';
      const dept = member.department || '';
      
      const matchesSearch = 
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tsc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.toLowerCase().includes(searchTerm.toLowerCase());

      const memberRole = (member.system_role || member.role || '').toLowerCase();
      const matchesRole = roleFilter === 'all' || memberRole === roleFilter.toLowerCase();
      const matchesDept = departmentFilter === 'all' || dept.toLowerCase() === departmentFilter.toLowerCase();

      return matchesSearch && matchesRole && matchesDept;
    });
  }, [staff, searchTerm, roleFilter, departmentFilter]);

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      tsc_number: '',
      role: 'teacher',
      system_role: 'teacher',
      department: 'Academics',
      status: 'active'
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setFormData({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      tsc_number: member.tsc_number || member.staff_id || '',
      role: member.role || 'teacher',
      system_role: member.system_role || member.role || 'teacher',
      department: member.department || 'Academics',
      status: member.status || 'active'
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter staff name');
      return;
    }

    try {
      const formattedName = toTitleCase(formData.name);
      const payload = {
        name: formattedName,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        tsc_number: formData.tsc_number.trim() || `TSC-${Math.floor(100000 + Math.random() * 900000)}`,
        staff_id: formData.tsc_number.trim() || `TSC-${Math.floor(100000 + Math.random() * 900000)}`,
        role: formData.role,
        system_role: formData.system_role,
        department: toTitleCase(formData.department),
        status: formData.status,
      };

      if (editingStaff) {
        await updateStaffMember(editingStaff.id, payload);
        toast.success(`Successfully updated ${formattedName}`);
      } else {
        await addStaffMember(payload);
        toast.success(`Successfully added ${formattedName}`);
      }
      setIsDialogOpen(false);
      refreshStaff();
    } catch (err: any) {
      console.error('Error saving staff:', err);
      toast.error(err?.message || 'Failed to save staff member');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from the staff directory?`)) {
      try {
        await deleteStaffMember(id);
        toast.success(`Removed ${name}`);
        refreshStaff();
      } catch (err: any) {
        toast.error('Failed to delete staff member');
      }
    }
  };

  const handleToggleStatus = async (id: string, name: string) => {
    try {
      await toggleActiveStatus(id);
      toast.success(`Updated status for ${name}`);
      refreshStaff();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <Users className="w-7 h-7" />
            </div>
            Staff Directory
          </h1>
          <p className="text-slate-500 mt-1">
            Manage school personnel records, TSC identification numbers, roles, and departmental assignments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => refreshStaff()}
            className="border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Metrics / Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-indigo-50/50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Staff</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{staff.length}</h3>
              </div>
              <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-emerald-50/50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active Personnel</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {staff.filter(s => s.status === 'active').length}
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-blue-50/50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Teachers / Tutors</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {staff.filter(s => (s.system_role || s.role || '').toLowerCase().includes('teacher')).length}
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                <Award className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-purple-50/50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Support &amp; Admin</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {staff.filter(s => !(s.system_role || s.role || '').toLowerCase().includes('teacher')).length}
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                <Shield className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, TSC No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200 bg-slate-50/50 focus-visible:bg-white"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[160px] border-slate-200 bg-slate-50/50">
                    <SelectValue placeholder="Filter Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="librarian">Librarian</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="support_staff">Support Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px] border-slate-200 bg-slate-50/50">
                  <SelectValue placeholder="Filter Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="academics">Academics</SelectItem>
                  <SelectItem value="administration">Administration</SelectItem>
                  <SelectItem value="library">Library</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Staff Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/75 border-b border-slate-200">
              <TableRow>
                <TableHead className="font-semibold text-slate-700 py-4 px-6">Staff Member</TableHead>
                <TableHead className="font-semibold text-slate-700 py-4 px-6">TSC No. / Staff ID</TableHead>
                <TableHead className="font-semibold text-slate-700 py-4 px-6">System Role</TableHead>
                <TableHead className="font-semibold text-slate-700 py-4 px-6">Department</TableHead>
                <TableHead className="font-semibold text-slate-700 py-4 px-6">Contact</TableHead>
                <TableHead className="font-semibold text-slate-700 py-4 px-6">Status</TableHead>
                <TableHead className="font-semibold text-slate-700 py-4 px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                      <p>Loading staff directory records...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-10 h-10 text-slate-300" />
                      <p className="font-medium text-slate-700">No staff members found</p>
                      <p className="text-sm text-slate-400">Try adjusting your search criteria or add a new staff member.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((member) => {
                  const formattedName = toTitleCase(member.name);
                  const normalizedRole = toRoleTitleCase(member.system_role || member.role);
                  const formattedDept = toTitleCase(member.department || 'Academics');
                  const tscDisplay = member.tsc_number || member.staff_id || 'TSC Pending';

                  return (
                    <TableRow key={member.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shadow-inner">
                            {formattedName ? formattedName.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{formattedName}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {member.email || 'No email recorded'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-4 px-6">
                        <div className="font-mono text-xs font-semibold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md inline-block">
                          {tscDisplay}
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-6">
                        <Badge variant="outline" className="font-medium bg-indigo-50/50 text-indigo-700 border-indigo-200">
                          {normalizedRole}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-4 px-6 text-slate-700 font-medium text-sm">
                        {formattedDept}
                      </TableCell>

                      <TableCell className="py-4 px-6">
                        <div className="text-xs text-slate-600 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {member.phone || 'No phone'}
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-6">
                        <button 
                          onClick={() => handleToggleStatus(member.id, formattedName)}
                          className="focus:outline-none"
                        >
                          <Badge 
                            variant={member.status === 'active' ? 'default' : 'secondary'}
                            className={`cursor-pointer transition-all ${
                              member.status === 'active' 
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200' 
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200'
                            }`}
                          >
                            {member.status === 'active' ? (
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                                Inactive
                              </span>
                            )}
                          </Badge>
                        </button>
                      </TableCell>

                      <TableCell className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenEdit(member)}
                            className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(member.id, formattedName)}
                            className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </DialogTitle>
            <DialogDescription>
              {editingStaff ? 'Update staff profile details and system access credentials.' : 'Register a new staff member into the unified school master directory.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name <span className="text-rose-500">*</span></Label>
              <Input
                id="name"
                placeholder="e.g. Mary Wairimu"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tsc_number">TSC No. / Staff ID</Label>
                <Input
                  id="tsc_number"
                  placeholder="e.g. TSC-456789"
                  value={formData.tsc_number}
                  onChange={(e) => setFormData({ ...formData, tsc_number: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="e.g. +254 712 345 678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g. mary.wairimu@munyaka.ac.ke"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="system_role">System Role</Label>
                <Select 
                  value={formData.system_role} 
                  onValueChange={(val) => setFormData({ ...formData, system_role: val, role: val })}
                >
                  <SelectTrigger id="system_role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="head_teacher">Head Teacher</SelectItem>
                    <SelectItem value="librarian">Librarian</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="support_staff">Support Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="e.g. Academics"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Account Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(val: 'active' | 'inactive') => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {editingStaff ? 'Save Changes' : 'Register Staff'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
