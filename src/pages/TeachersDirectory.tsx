import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Edit2, Mail, Phone, Hash, BookOpen, 
  CheckCircle2, AlertCircle, X, Shield, Award, Sparkles, Filter, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

const ALL_SUBJECTS = [
  'Mathematics',
  'English',
  'Kiswahili',
  'Integrated Science',
  'Social Studies',
  'CRE',
  'IRE',
  'Creative Arts',
  'Music',
  'Physical & Health Education',
  'Agriculture',
  'Home Science',
  'Computer Science',
  'Business Studies',
  'Life Skills'
];

interface TeacherRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  tsc_number: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  subjects: string[];
  role?: string;
  staffId?: string;
}

export default function TeachersDirectory() {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherRecord | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tscNumber, setTscNumber] = useState('');
  const [status, setStatus] = useState<'Active' | 'On Leave' | 'Inactive'>('Active');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Load from munyaka_staff_db (single source of truth) with robust fallbacks
  const loadTeachers = () => {
    try {
      const keys = ['munyaka_staff_db', 'munyaka_staff_master_v1', 'munyaka_staff_directory', 'munyaka_master_staff_list', 'munyaka_staff'];
      let rawData: any[] = [];
      for (const key of keys) {
        const val = localStorage.getItem(key);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              rawData = parsed;
              break;
            }
          } catch (e) {
            // ignore JSON parse error
          }
        }
      }

      // Map raw records to standardized TeacherRecord schema
      const formatted: TeacherRecord[] = rawData.map((item, idx) => {
        const id = item.id || item.staffId || item.staff_id || `t-${idx}-${Date.now()}`;
        const name = item.name || item.fullName || item.teacherName || 'Unnamed Teacher';
        const emailVal = item.email || item.staffEmail || `${name.toLowerCase().replace(/\s+/g, '.')}@school.ac.ke`;
        const phoneVal = item.phone || item.phoneNumber || '+254 712 345 678';
        const tsc = item.tsc_number || item.tscNumber || item.tscNo || `TSC/${10000 + idx}`;
        const st = item.status === 'On Leave' || item.status === 'Inactive' ? item.status : 'Active';
        
        let subjList: string[] = [];
        if (Array.isArray(item.subjects)) subjList = item.subjects;
        else if (Array.isArray(item.assignedSubjects)) subjList = item.assignedSubjects;
        else if (typeof item.subjects === 'string') subjList = item.subjects.split(',').map((s: string) => s.trim());
        else subjList = ['Mathematics', 'English'];

        return {
          id,
          name,
          email: emailVal,
          phone: phoneVal,
          tsc_number: tsc,
          status: st,
          subjects: subjList,
          role: item.role || 'Teacher',
          staffId: item.staffId || item.staff_id || id
        };
      });

      if (formatted.length === 0) {
        // Default seed if empty
        const defaultSeeds: TeacherRecord[] = [
          {
            id: 't1',
            name: 'John Kamau',
            email: 'john.kamau@school.ac.ke',
            phone: '+254 722 111 222',
            tsc_number: 'TSC/482910',
            status: 'Active',
            subjects: ['Mathematics', 'Integrated Science', 'Computer Science'],
            role: 'Senior Teacher',
            staffId: 'T001'
          },
          {
            id: 't2',
            name: 'Jane Mwangi',
            email: 'jane.mwangi@school.ac.ke',
            phone: '+254 733 444 555',
            tsc_number: 'TSC/519283',
            status: 'Active',
            subjects: ['English', 'Kiswahili', 'Social Studies'],
            role: 'Class Teacher',
            staffId: 'T002'
          },
          {
            id: 't3',
            name: 'Dr. Peter Omondi',
            email: 'peter.omondi@school.ac.ke',
            phone: '+254 711 999 888',
            tsc_number: 'TSC/392019',
            status: 'On Leave',
            subjects: ['Agriculture', 'Music', 'Physical & Health Education'],
            role: 'Subject Teacher',
            staffId: 'T003'
          }
        ];
        setTeachers(defaultSeeds);
        localStorage.setItem('munyaka_staff_db', JSON.stringify(defaultSeeds));
      } else {
        setTeachers(formatted);
      }
    } catch (err) {
      console.error('Error loading teachers:', err);
    }
  };

  useEffect(() => {
    loadTeachers();
    const handleSync = () => loadTeachers();
    window.addEventListener('staff-changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('staff-changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Save changes to single source of truth munyaka_staff_db and notify portals
  const persistTeachers = (updatedList: TeacherRecord[]) => {
    setTeachers(updatedList);
    try {
      localStorage.setItem('munyaka_staff_db', JSON.stringify(updatedList));
      localStorage.setItem('munyaka_staff_directory', JSON.stringify(updatedList));
      localStorage.setItem('munyaka_master_staff_list', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('staff-changed'));
    } catch (e) {
      console.error('Failed to persist teachers:', e);
    }
  };

  const handleOpenAddModal = () => {
    setEditingTeacher(null);
    setFullName('');
    setEmail('');
    setPhone('+254 7');
    setTscNumber('TSC/');
    setStatus('Active');
    setSelectedSubjects(['Mathematics', 'English']);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (teacher: TeacherRecord) => {
    setEditingTeacher(teacher);
    setFullName(teacher.name);
    setEmail(teacher.email);
    setPhone(teacher.phone);
    setTscNumber(teacher.tsc_number);
    setStatus(teacher.status);
    setSelectedSubjects(teacher.subjects || []);
    setIsModalOpen(true);
  };

  const toggleSubjectPill = (subj: string) => {
    if (selectedSubjects.includes(subj)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subj));
    } else {
      setSelectedSubjects([...selectedSubjects, subj]);
    }
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Please enter Full Name');
      return;
    }
    if (!tscNumber.trim()) {
      toast.error('Please enter TSC Number');
      return;
    }

    if (editingTeacher) {
      // Update
      const updated = teachers.map(t => t.id === editingTeacher.id ? {
        ...t,
        name: fullName.trim(),
        email: email.trim() || `${fullName.toLowerCase().replace(/\s+/g, '.')}@school.ac.ke`,
        phone: phone.trim() || '+254 700 000 000',
        tsc_number: tscNumber.trim(),
        status,
        subjects: selectedSubjects
      } : t);
      persistTeachers(updated);
      toast.success(`Successfully updated teacher profile for ${fullName}`);
    } else {
      // Create new
      const newRecord: TeacherRecord = {
        id: `t-${Date.now()}`,
        name: fullName.trim(),
        email: email.trim() || `${fullName.toLowerCase().replace(/\s+/g, '.')}@school.ac.ke`,
        phone: phone.trim() || '+254 700 000 000',
        tsc_number: tscNumber.trim(),
        status,
        subjects: selectedSubjects.length > 0 ? selectedSubjects : ['Mathematics'],
        role: 'Teacher',
        staffId: `T${Math.floor(100 + Math.random() * 900)}`
      };
      persistTeachers([newRecord, ...teachers]);
      toast.success(`Successfully added new teacher: ${fullName}`);
    }
    setIsModalOpen(false);
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchesSearch = 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tsc_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || t.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [teachers, searchQuery, statusFilter]);

  const activeCount = teachers.filter(t => t.status === 'Active').length;
  const onLeaveCount = teachers.filter(t => t.status === 'On Leave').length;

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-indigo-900/40">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Synchronized Personnel DB (`munyaka_staff_db`)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Teachers & Personnel Directory</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl font-medium">
            Manage teaching staff profiles, TSC registration numbers, active teaching subjects, and duty status across portal views.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={loadTeachers}
            variant="outline" 
            size="sm" 
            className="border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Sync Records
          </Button>
          <Button 
            onClick={handleOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 px-5 py-2.5 transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Add Teacher
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Total Teachers</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{teachers.length}</h3>
              <p className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Global Portal Sync Active
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Active Teachers</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{activeCount}</h3>
              <p className="text-xs font-semibold text-slate-500 mt-1">Currently on duty & teaching</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">On Leave / Inactive</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{onLeaveCount}</h3>
              <p className="text-xs font-semibold text-amber-600 mt-1">Temporary leave or off duty</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
              <AlertCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Controls */}
      <Card className="rounded-2xl border-slate-200 shadow-sm bg-white">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by name, TSC No., email or subject..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-slate-200 focus-visible:ring-indigo-500 font-medium"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:block">Status:</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 w-full sm:w-auto">
              {['all', 'Active', 'On Leave'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                    statusFilter.toLowerCase() === st.toLowerCase() 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'all' ? 'All Status' : st}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Standardized Teachers Table */}
      <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 text-[11px] font-black uppercase tracking-wider">
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">TSC No.</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Phone</th>
                <th className="py-4 px-6">Subjects</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400 font-medium">
                    No teacher records found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-sm shadow-inner shrink-0">
                          {t.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-slate-900 font-bold">{t.name}</div>
                          <div className="text-[11px] font-medium text-slate-400">{t.role || 'Teacher'} · ID: {t.staffId || t.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-700">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                        <Hash className="w-3 h-3 text-slate-400" /> {t.tsc_number}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{t.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{t.phone}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {t.subjects && t.subjects.length > 0 ? (
                          t.subjects.map((sub, sIdx) => (
                            <span 
                              key={sIdx}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100"
                            >
                              {sub}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No subjects assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        t.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {t.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button
                        onClick={() => handleOpenEditModal(t)}
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 font-bold transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* "Add Teacher" / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 bg-slate-900 text-white border-b border-slate-800">
              <div>
                <h3 className="text-lg font-black">{editingTeacher ? 'Edit Teacher Profile' : 'Add New Teacher'}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Configure personnel credentials, TSC number, and teaching subjects</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">Full Name *</label>
                  <Input 
                    placeholder="e.g. John Kamau"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    className="rounded-xl border-slate-200 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">TSC Number *</label>
                  <Input 
                    placeholder="TSC/XXXXX"
                    value={tscNumber}
                    onChange={e => setTscNumber(e.target.value)}
                    required
                    className="rounded-xl border-slate-200 font-mono font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">Email Address</label>
                  <Input 
                    type="email"
                    placeholder="teacher@school.ac.ke"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="rounded-xl border-slate-200 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">Phone Number</label>
                  <Input 
                    placeholder="+254 7XX XXX XXX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="rounded-xl border-slate-200 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Subjects / Learning Areas ({selectedSubjects.length} selected)
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Click pills to toggle</span>
                </div>
                <div className="flex flex-wrap gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 max-h-48 overflow-y-auto">
                  {ALL_SUBJECTS.map((subj) => {
                    const isSelected = selectedSubjects.includes(subj);
                    return (
                      <button
                        type="button"
                        key={subj}
                        onClick={() => toggleSubjectPill(subj)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                          isSelected 
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm shadow-indigo-600/30' 
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3" />}
                        {subj}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 px-6"
                >
                  {editingTeacher ? 'Save Changes' : 'Create Teacher'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
