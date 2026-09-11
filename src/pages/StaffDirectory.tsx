import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  UserPlus, 
  Key, 
  Search, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  RefreshCw,
  Mail,
  UserCheck
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface StaffRecord {
  id: string;
  staffId: string;
  staffName: string;
  registeredEmail: string;
  systemRole: string;
  tempAccessCode: string;
  isActive: boolean;
}

const DEFAULT_STAFF_RECORDS: StaffRecord[] = [
  {
    id: 'SUP-001',
    staffId: 'TSC-883920',
    staffName: 'Mary Wanjiku',
    registeredEmail: 'mary.wanjiku@munyaka.sc.ke',
    systemRole: 'Teacher',
    tempAccessCode: 'MUNYAKA-5721',
    isActive: true
  },
  {
    id: 'SUP-002',
    staffId: 'MUNYAKA-1001',
    staffName: 'Grace Njeri',
    registeredEmail: 'grace.njeri@munyaka.sc.ke',
    systemRole: 'Head Teacher',
    tempAccessCode: 'MUNYAKA-1001',
    isActive: true
  },
  {
    id: 'SUP-003',
    staffId: 'MUNYAKA-4005',
    staffName: 'David Kiprotich',
    registeredEmail: 'david.kiprotich@munyaka.sc.ke',
    systemRole: 'Support Staff',
    tempAccessCode: 'MUNYAKA-4005',
    isActive: true
  }
];

export default function StaffDirectory() {
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffRecord | null>(null);

  // Form states
  const [staffName, setStaffName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [systemRole, setSystemRole] = useState('Teacher');
  const [tempAccessCode, setTempAccessCode] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('munyaka_staff');
      let data = [];
      if (raw) {
        try { data = JSON.parse(raw); } catch { data = []; }
      }
      if (!Array.isArray(data) || data.length === 0) {
        data = DEFAULT_STAFF_RECORDS;
        localStorage.setItem('munyaka_staff', JSON.stringify(data));
        localStorage.setItem('munyaka_personnel', JSON.stringify(data));
      }

      // Normalize records to the required standardized schema
      const normalized: StaffRecord[] = data.map((s: any, index: number) => ({
        id: s.id || `SUP-00${index + 1}`,
        staffId: s.staffId || s.tscNo || `TSC-${Math.floor(100000 + Math.random() * 900000)}`,
        staffName: s.staffName || s.name || 'Staff Member',
        registeredEmail: s.registeredEmail || s.email || '',
        systemRole: s.systemRole || s.role || 'Teacher',
        tempAccessCode: s.tempAccessCode || s.accessCode || `MUNYAKA-${Math.floor(1000 + Math.random() * 9000)}`,
        isActive: s.isActive !== undefined ? Boolean(s.isActive) : true
      }));

      setStaffList(normalized);
    } catch (err) {
      console.error('[StaffDirectory] Failed to load staff:', err);
      setStaffList(DEFAULT_STAFF_RECORDS);
    }
  }, []);

  const saveToStorage = (updatedList: StaffRecord[]) => {
    try {
      localStorage.setItem('munyaka_staff', JSON.stringify(updatedList));
      localStorage.setItem('munyaka_personnel', JSON.stringify(updatedList));
      setStaffList(updatedList);
    } catch (err) {
      console.error('[StaffDirectory] Failed to save staff:', err);
      showError('Failed to save staff records');
    }
  };

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setStaffName('');
    setStaffId(`TSC-${Math.floor(100000 + Math.random() * 900000)}`);
    setRegisteredEmail('');
    setSystemRole('Teacher');
    setTempAccessCode(`MUNYAKA-${Math.floor(1000 + Math.random() * 9000)}`);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: StaffRecord) => {
    setEditingStaff(record);
    setStaffName(record.staffName);
    setStaffId(record.staffId);
    setRegisteredEmail(record.registeredEmail);
    setSystemRole(record.systemRole);
    setTempAccessCode(record.tempAccessCode);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !registeredEmail.trim()) {
      showError('Please fill in Name and Email Address');
      return;
    }

    if (editingStaff) {
      const updated = staffList.map(s => s.id === editingStaff.id ? {
        ...s,
        staffName: staffName.trim(),
        staffId: staffId.trim() || s.staffId,
        registeredEmail: registeredEmail.trim().toLowerCase(),
        systemRole,
        tempAccessCode: tempAccessCode.trim() || s.tempAccessCode
      } : s);
      saveToStorage(updated);
      showSuccess(`Updated staff: ${staffName}`);
    } else {
      const newRecord: StaffRecord = {
        id: `SUP-00${staffList.length + 1}`,
        staffId: staffId.trim() || `TSC-${Math.floor(100000 + Math.random() * 900000)}`,
        staffName: staffName.trim(),
        registeredEmail: registeredEmail.trim().toLowerCase(),
        systemRole,
        tempAccessCode: tempAccessCode.trim() || `MUNYAKA-${Math.floor(1000 + Math.random() * 9000)}`,
        isActive: true
      };
      saveToStorage([newRecord, ...staffList]);
      showSuccess(`Successfully registered ${staffName}`);
    }

    setIsModalOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    const updated = staffList.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s);
    saveToStorage(updated);
    showSuccess('Staff status updated');
  };

  const handleResetCode = (id: string) => {
    const newCode = `MUNYAKA-${Math.floor(1000 + Math.random() * 9000)}`;
    const updated = staffList.map(s => s.id === id ? { ...s, tempAccessCode: newCode } : s);
    saveToStorage(updated);
    showSuccess(`Reset access code to: ${newCode}`);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    const updated = staffList.filter(s => s.id !== id);
    saveToStorage(updated);
    showSuccess('Staff member deleted');
  };

  const filteredStaff = staffList.filter(s => 
    s.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.registeredEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.systemRole.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-wider mb-2">
            <Shield size={14} /> Personnel Directory
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Staff & Personnel Management</h1>
          <p className="text-slate-500 text-sm font-medium">Manage standardized staff records, access codes, and permissions.</p>
        </div>
        <Button onClick={handleOpenAdd} className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg shadow-indigo-100">
          <UserPlus size={18} /> Add New Staff
        </Button>
      </div>

      {/* Search & Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
          <Search size={20} className="text-slate-400 shrink-0" />
          <Input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, TSC/Staff ID, or role..."
            className="border-none bg-transparent font-medium text-slate-800 focus-visible:ring-0 placeholder:text-slate-400"
          />
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between px-6">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Staff</span>
          <span className="text-xl font-black text-indigo-600">{staffList.length}</span>
        </div>
      </div>

      {/* Staff Table */}
      <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-5 whitespace-nowrap">Staff Name</th>
                  <th className="py-3 px-5 whitespace-nowrap">Staff / TSC ID</th>
                  <th className="py-3 px-5 whitespace-nowrap">Email Address</th>
                  <th className="py-3 px-5 whitespace-nowrap">Role</th>
                  <th className="py-3 px-5 whitespace-nowrap">Access Code</th>
                  <th className="py-3 px-5 whitespace-nowrap">Status</th>
                  <th className="py-3 px-5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 font-medium whitespace-nowrap">
                      No staff records found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-5 font-semibold text-slate-900 flex items-center gap-2.5 whitespace-nowrap">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-black text-[11px] flex items-center justify-center shrink-0">
                          {staff.staffName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[13px]">{staff.staffName}</span>
                      </td>
                      <td className="py-3 px-5 text-slate-500 font-mono text-[11px] font-bold whitespace-nowrap">{staff.staffId}</td>
                      <td className="py-3 px-5 text-slate-600 text-xs whitespace-nowrap">{staff.registeredEmail}</td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        <Badge variant="outline" className="font-bold text-[11px] py-0.5 px-2 bg-indigo-50/50 text-indigo-700 border-indigo-100">
                          {staff.systemRole}
                        </Badge>
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 font-mono text-[11px] font-bold text-slate-700">
                          <Key size={11} className="text-slate-400" />
                          <span>{staff.tempAccessCode}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        {staff.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                            <CheckCircle2 size={11} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold">
                            <XCircle size={11} /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <div className="flex flex-row items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetCode(staff.id)}
                            title="Reset Access Code"
                            className="h-7 w-7 p-0 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                          >
                            <RefreshCw size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(staff.id)}
                            title={staff.isActive ? "Deactivate" : "Activate"}
                            className="h-7 w-7 p-0 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                          >
                            <UserCheck size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(staff)}
                            title="Edit Staff"
                            className="h-7 w-7 p-0 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                          >
                            <Edit3 size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(staff.id)}
                            title="Delete Staff"
                            className="h-7 w-7 p-0 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 md:p-8 bg-white border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">
              {editingStaff ? 'Edit Staff Record' : 'Register New Staff Member'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Full Name</Label>
              <Input
                value={staffName}
                onChange={e => setStaffName(e.target.value)}
                placeholder="e.g. Mary Wanjiku"
                className="h-12 rounded-xl bg-slate-50 border-none font-bold text-base focus:bg-white focus:ring-2 focus:ring-indigo-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Staff / TSC ID</Label>
              <Input
                value={staffId}
                onChange={e => setStaffId(e.target.value)}
                placeholder="e.g. TSC-883920"
                className="h-12 rounded-xl bg-slate-50 border-none font-bold text-base focus:bg-white focus:ring-2 focus:ring-indigo-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Email Address</Label>
              <Input
                type="email"
                value={registeredEmail}
                onChange={e => setRegisteredEmail(e.target.value)}
                placeholder="e.g. mary.wanjiku@munyaka.sc.ke"
                className="h-12 rounded-xl bg-slate-50 border-none font-bold text-base focus:bg-white focus:ring-2 focus:ring-indigo-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-wider text-slate-400">System Role</Label>
              <Select value={systemRole} onValueChange={setSystemRole}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold text-base focus:ring-2 focus:ring-indigo-200">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl">
                  <SelectItem value="Teacher" className="font-bold">Teacher</SelectItem>
                  <SelectItem value="Head Teacher" className="font-bold">Head Teacher</SelectItem>
                  <SelectItem value="Support Staff" className="font-bold">Support Staff</SelectItem>
                  <SelectItem value="Librarian" className="font-bold">Librarian</SelectItem>
                  <SelectItem value="Admin" className="font-bold">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Temporary Access Code</Label>
              <Input
                value={tempAccessCode}
                onChange={e => setTempAccessCode(e.target.value)}
                placeholder="e.g. MUNYAKA-5721"
                className="h-12 rounded-xl bg-slate-50 border-none font-bold text-base font-mono focus:bg-white focus:ring-2 focus:ring-indigo-200"
                required
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-12 rounded-xl font-bold border-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 shadow-lg shadow-indigo-100"
              >
                {editingStaff ? 'Save Changes' : 'Register Staff'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
