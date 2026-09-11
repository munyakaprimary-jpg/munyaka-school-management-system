import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  UserPlus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  Eye,
  Mail,
  BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';

interface StaffRecord {
  id: string;
  staffId: string;
  staffName: string;
  registeredEmail: string;
  systemRole: string;
  subjects?: string;
  isActive: boolean;
}

const DEFAULT_LEARNING_AREAS = [
  'Mathematics',
  'English Language',
  'Kiswahili Lugha',
  'Science & Technology',
  'Agriculture & Nutrition',
  'Social Studies',
  'Creative Arts & Sports',
  'Religious Education'
];

const DEFAULT_STAFF_RECORDS: StaffRecord[] = [
  {
    id: 'SUP-001',
    staffId: 'TSC-883920',
    staffName: 'Mary Wanjiku',
    registeredEmail: 'mary.wanjiku@munyaka.sc.ke',
    systemRole: 'Teacher',
    subjects: 'Mathematics, Science & Technology',
    isActive: true
  },
  {
    id: 'SUP-002',
    staffId: 'MUNYAKA-1001',
    staffName: 'Grace Njeri',
    registeredEmail: 'grace.njeri@munyaka.sc.ke',
    systemRole: 'Head Teacher',
    subjects: 'School Management',
    isActive: true
  },
  {
    id: 'SUP-003',
    staffId: 'MUNYAKA-4005',
    staffName: 'David Kiprotich',
    registeredEmail: 'david.kiprotich@munyaka.sc.ke',
    systemRole: 'Support Staff',
    subjects: 'Maintenance & Security',
    isActive: true
  }
];

export default function StaffDirectory() {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffRecord | null>(null);

  // View Modal state
  const [selectedStaff, setSelectedStaff] = useState<StaffRecord | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Form states (HR focused)
  const [staffName, setStaffName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [systemRole, setSystemRole] = useState('Teacher');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [availableLearningAreas, setAvailableLearningAreas] = useState<string[]>(DEFAULT_LEARNING_AREAS);

  // Load learning areas and staff on mount
  useEffect(() => {
    try {
      const rawAreas = localStorage.getItem('munyaka_learning_areas');
      if (rawAreas) {
        const parsed = JSON.parse(rawAreas);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const subjectList = parsed.flatMap((item: any) => {
            if (typeof item === 'string') return item;
            if (item.subjects && Array.isArray(item.subjects)) {
              return item.subjects.map((s: any) => typeof s === 'string' ? s : (s.name || s.title || ''));
            }
            if (item.learningAreas && Array.isArray(item.learningAreas)) {
              return item.learningAreas.map((s: any) => typeof s === 'string' ? s : (s.name || s.title || ''));
            }
            if (item.name || item.title) return item.name || item.title;
            return [];
          });

          const excludedLevels = ['Pre-Primary', 'Lower Primary', 'Upper Primary', 'Junior Secondary', 'Junior School'];
          const uniqueSubjects = Array.from(new Set(subjectList)).filter(
            (subject) => typeof subject === 'string' && subject.trim().length > 0 && !excludedLevels.includes(subject)
          );

          if (uniqueSubjects.length > 0) {
            setAvailableLearningAreas(uniqueSubjects as string[]);
          }
        }
      }
    } catch (err) {
      console.error('[StaffDirectory] Failed to load learning areas:', err);
    }

    try {
      const raw = localStorage.getItem('munyaka_staff');
      let data = [];
      if (raw) {
        try { data = JSON.parse(raw); } catch { data = []; }
      }
      if (!Array.isArray(data) || data.length === 0) {
        data = DEFAULT_STAFF_RECORDS;
        localStorage.setItem('munyaka_staff', JSON.stringify(data));
      }

      const normalized: StaffRecord[] = data.map((s: any, index: number) => ({
        id: s.id || `SUP-00${index + 1}`,
        staffId: s.staffId || s.tscNo || s.tscNumber || `TSC-${Math.floor(100000 + Math.random() * 900000)}`,
        staffName: s.staffName || s.name || s.fullName || 'Staff Member',
        registeredEmail: s.registeredEmail || s.email || '',
        systemRole: s.systemRole || s.role || 'Teacher',
        subjects: s.subjects || s.department || 'General',
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
      const raw = localStorage.getItem('munyaka_staff');
      let existing = [];
      if (raw) { try { existing = JSON.parse(raw); } catch {} }

      const merged = updatedList.map(newItem => {
        const found = existing.find((e: any) => e.id === newItem.id || e.staffId === newItem.staffId || e.email === newItem.registeredEmail);
        return {
          ...(found || {}),
          ...newItem,
          tempAccessCode: found?.tempAccessCode || found?.accessCode || 'MUNYAKA-2026'
        };
      });

      localStorage.setItem('munyaka_staff', JSON.stringify(merged));
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
    setSelectedSubjects([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: StaffRecord) => {
    setEditingStaff(record);
    setStaffName(record.staffName);
    setStaffId(record.staffId);
    setRegisteredEmail(record.registeredEmail);
    setSystemRole(record.systemRole);
    
    // Split existing comma-separated subjects into array
    const existingSubs = record.subjects ? record.subjects.split(',').map(s => s.trim()).filter(Boolean) : [];
    setSelectedSubjects(existingSubs);
    setIsModalOpen(true);
  };

  const handleViewProfile = (record: StaffRecord) => {
    const targetId = record.id || record.staffId;
    const foundStaff = staffList.find((s) => 
      s.id === targetId || 
      s.staffId === targetId || 
      s.registeredEmail === targetId
    ) || record;

    setSelectedStaff(foundStaff);
    setIsViewModalOpen(true);
  };

  const handleCheckboxToggle = (area: string) => {
    if (selectedSubjects.includes(area)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== area));
    } else {
      setSelectedSubjects([...selectedSubjects, area]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !registeredEmail.trim()) {
      showError('Please fill in Name and Email Address');
      return;
    }

    const subjectsString = selectedSubjects.length > 0 ? selectedSubjects.join(', ') : 'General';

    try {
      const raw = localStorage.getItem('munyaka_staff');
      let staffListStored = [];
      if (raw) {
        try { staffListStored = JSON.parse(raw); } catch { staffListStored = []; }
      }

      if (editingStaff) {
        const updated = staffListStored.map((s: any) => {
          if (s.id === editingStaff.id || s.staffId === editingStaff.staffId) {
            return {
              ...s,
              staffName: staffName.trim(),
              name: staffName.trim(),
              staffId: staffId.trim() || s.staffId,
              registeredEmail: registeredEmail.trim().toLowerCase(),
              email: registeredEmail.trim().toLowerCase(),
              systemRole,
              role: systemRole,
              subjects: subjectsString
            };
          }
          return s;
        });
        localStorage.setItem('munyaka_staff', JSON.stringify(updated));
        
        const normalized: StaffRecord[] = updated.map((s: any, index: number) => ({
          id: s.id || `SUP-00${index + 1}`,
          staffId: s.staffId || s.tscNo || s.tscNumber || `TSC-${Math.floor(100000 + Math.random() * 900000)}`,
          staffName: s.staffName || s.name || s.fullName || 'Staff Member',
          registeredEmail: s.registeredEmail || s.email || '',
          systemRole: s.systemRole || s.role || 'Teacher',
          subjects: s.subjects || s.department || 'General',
          isActive: s.isActive !== undefined ? Boolean(s.isActive) : true
        }));
        setStaffList(normalized);
        showSuccess(`Updated staff HR profile: ${staffName}`);
      } else {
        const newCode = `MUNYAKA-${Math.floor(1000 + Math.random() * 9000)}`;
        const newRecord = {
          id: `SUP-00${staffListStored.length + 1}`,
          staffId: staffId.trim() || `TSC-${Math.floor(100000 + Math.random() * 900000)}`,
          staffName: staffName.trim(),
          name: staffName.trim(),
          registeredEmail: registeredEmail.trim().toLowerCase(),
          email: registeredEmail.trim().toLowerCase(),
          systemRole,
          role: systemRole,
          subjects: subjectsString,
          tempAccessCode: newCode,
          accessCode: newCode,
          isActive: true
        };

        const updated = [newRecord, ...staffListStored];
        localStorage.setItem('munyaka_staff', JSON.stringify(updated));

        const normalized: StaffRecord[] = updated.map((s: any, index: number) => ({
          id: s.id || `SUP-00${index + 1}`,
          staffId: s.staffId || s.tscNo || s.tscNumber || `TSC-${Math.floor(100000 + Math.random() * 900000)}`,
          staffName: s.staffName || s.name || s.fullName || 'Staff Member',
          registeredEmail: s.registeredEmail || s.email || '',
          systemRole: s.systemRole || s.role || 'Teacher',
          subjects: s.subjects || s.department || 'General',
          isActive: s.isActive !== undefined ? Boolean(s.isActive) : true
        }));
        setStaffList(normalized);
        showSuccess(`Successfully registered ${staffName} (Access Code: ${newCode})`);
      }

      setStaffName('');
      setStaffId('');
      setRegisteredEmail('');
      setSelectedSubjects([]);
      setIsModalOpen(false);
    } catch (err) {
      console.error('[StaffDirectory] Save failed:', err);
      showError('Failed to save staff record');
    }
  };

  const handleToggleStatus = (id: string) => {
    const updated = staffList.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s);
    saveToStorage(updated);
    showSuccess('Staff status updated');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this staff record?')) return;
    const updated = staffList.filter(s => s.id !== id);
    saveToStorage(updated);
    showSuccess('Staff member deleted');
  };

  const filteredStaff = staffList.filter(s => 
    s.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.registeredEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.systemRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.subjects && s.subjects.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-wider mb-2">
            <Users size={14} /> Human Resources
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Staff Directory & HR Profiles</h1>
          <p className="text-slate-500 text-sm font-medium">Manage staff personal details, subjects, and employment profiles.</p>
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
            placeholder="Search by name, email, ID, subjects, or role..."
            className="border-none bg-transparent font-medium text-slate-800 focus-visible:ring-0 placeholder:text-slate-400 text-xs"
          />
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between px-6">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Active Staff</span>
          <span className="text-xl font-black text-indigo-600">{staffList.filter(s => s.isActive).length}</span>
        </div>
      </div>

      {/* Staff Table - HR Focused */}
      <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 px-4 whitespace-nowrap">Staff Name</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Staff / TSC ID</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Email Address</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Role</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Subjects</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">Actions</th>
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
                      <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2.5 whitespace-nowrap">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-black text-[11px] flex items-center justify-center shrink-0">
                          {staff.staffName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[13px] font-semibold">{staff.staffName}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">{staff.staffId}</td>
                      <td className="py-3 px-4 text-xs text-gray-600 whitespace-nowrap">{staff.registeredEmail}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="outline" className="font-bold text-[11px] py-0.5 px-2 rounded-full bg-indigo-50/50 text-indigo-700 border-indigo-100">
                          {staff.systemRole}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap font-bold">
                        {staff.subjects || 'General'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {staff.isActive ? (
                          <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                            <CheckCircle2 size={11} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold">
                            <XCircle size={11} /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex flex-row items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewProfile(staff)}
                            title="View Full Profile"
                            className="h-7 w-7 p-0 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                          >
                            <Eye size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(staff)}
                            title="Edit HR Profile"
                            className="h-7 w-7 p-0 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                          >
                            <Edit3 size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(staff.id)}
                            title="Delete Record"
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

      {/* View Staff Profile Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6 md:p-8 bg-white border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-sm flex items-center justify-center shrink-0">
                {selectedStaff?.staffName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div>{selectedStaff?.staffName}</div>
                <div className="text-xs font-medium text-slate-500">{selectedStaff?.systemRole}</div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedStaff && (
            <div className="space-y-4 mt-4 text-sm">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Staff / TSC ID</span>
                  <span className="font-mono font-bold text-slate-800">{selectedStaff.staffId}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Account Status</span>
                  {selectedStaff.isActive ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 size={14}/> Active</span>
                  ) : (
                    <span className="text-rose-600 font-bold flex items-center gap-1"><XCircle size={14}/> Inactive</span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                  <Mail size={18} className="text-slate-400 shrink-0" />
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Email Address</div>
                    <div className="font-bold text-slate-800">{selectedStaff.registeredEmail}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                  <BookOpen size={18} className="text-slate-400 shrink-0" />
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assigned Subjects / Learning Areas</div>
                    <div className="font-bold text-slate-800">{selectedStaff.subjects || 'General'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              onClick={() => setIsViewModalOpen(false)}
              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
            >
              Close Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit HR Profile / Add Staff Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-hidden rounded-3xl p-6 md:p-8 bg-white border-none shadow-2xl flex flex-col">
          <DialogHeader className="shrink-0 pb-2">
            <DialogTitle className="text-xl font-black text-slate-900">
              {editingStaff ? 'Edit Staff HR Profile' : 'Add New Staff Member'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
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
              <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Role</Label>
              <Select value={systemRole} onValueChange={setSystemRole}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold text-base focus:ring-2 focus:ring-indigo-200">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl">
                  <SelectItem value="Teacher" className="font-bold">Teacher</SelectItem>
                  <SelectItem value="Head Teacher" className="font-bold">Head Teacher</SelectItem>
                  <SelectItem value="Support Staff" className="font-bold">Support Staff</SelectItem>
                  <SelectItem value="Librarian" className="font-bold">Librarian</SelectItem>
                  <SelectItem value="Bursar" className="font-bold">Bursar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Learning Areas Multi-Select Checkboxes */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-wider text-slate-400">
                Assigned Learning Areas / Subjects
              </Label>
              <div className="p-3 bg-slate-50 rounded-2xl max-h-44 overflow-y-auto space-y-2 border border-slate-100">
                {availableLearningAreas.map((area) => {
                  const isChecked = selectedSubjects.includes(area);
                  return (
                    <label
                      key={area}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-white cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => handleCheckboxToggle(area)}
                      />
                      <span className="text-xs font-bold text-slate-700">{area}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Select one or more learning areas taught by this staff member.
              </p>
            </div>

            <DialogFooter className="pt-4 pb-2 shrink-0 bg-white">
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
                {editingStaff ? 'Save HR Profile' : 'Register Staff'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
