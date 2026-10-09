import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Key, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  BookOpen, 
  Shield, 
  Copy, 
  Check,
  UserCheck,
  Building2,
  BadgeCheck,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { defaultCbcLearningAreas } from '@/data/defaultCbcLearningAreas';

export interface StaffMember {
  id: string;
  name: string;
  category: 'Teaching Staff' | 'Administration' | 'Support Staff';
  tscNumber: string;
  email: string;
  phone: string;
  subjects: string[];
  accessCode: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  createdAt?: string;
}

const STORAGE_KEY = 'munyaka_staff_db';

export default function StaffRegistry() {
  const { toast } = useToast();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [category, setCategory] = useState<'Teaching Staff' | 'Administration' | 'Support Staff'>('Teaching Staff');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tscNumber, setTscNumber] = useState('');
  const [status, setStatus] = useState<'Active' | 'On Leave' | 'Inactive'>('Active');
  const [accessCode, setAccessCode] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Load staff database on mount
  useEffect(() => {
    loadStaffData();
  }, []);

  const loadStaffData = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setStaffList(parsed);
          return;
        }
      }
    } catch (err) {
      console.error('Error loading staff registry:', err);
    }
    // Initialize empty array as requested
    setStaffList([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  };

  const saveStaffData = (newList: StaffMember[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      setStaffList(newList);
    } catch (err) {
      console.error('Error saving staff registry:', err);
    }
  };

  const generateSecureCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'STF-';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAccessCode(code);
  };

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setFullName('');
    setCategory('Teaching Staff');
    setEmail('');
    setPhone('');
    setTscNumber('');
    setStatus('Active');
    setSelectedSubjects([]);
    generateSecureCode();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFullName(staff.name);
    setCategory(staff.category);
    setEmail(staff.email);
    setPhone(staff.phone);
    setTscNumber(staff.tscNumber);
    setStatus(staff.status);
    setAccessCode(staff.accessCode || generateRandomCode());
    setSelectedSubjects(staff.subjects || []);
    setIsModalOpen(true);
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'STF-';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleToggleSubject = (subjectName: string) => {
    if (selectedSubjects.includes(subjectName)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subjectName));
    } else {
      setSelectedSubjects([...selectedSubjects, subjectName]);
    }
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({ title: 'Validation Error', description: 'Please enter staff full name.', variant: 'destructive' });
      return;
    }
    if (!tscNumber.trim()) {
      toast({ title: 'Validation Error', description: 'Please enter TSC or Identification Number.', variant: 'destructive' });
      return;
    }

    const staffRecord: StaffMember = {
      id: editingStaff ? editingStaff.id : `staff_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: fullName.trim(),
      category,
      email: email.trim() || `${fullName.toLowerCase().replace(/\s+/g, '.')}@school.ac.ke`,
      phone: phone.trim() || '+254 712 345 678',
      tscNumber: tscNumber.trim(),
      status,
      accessCode: accessCode || generateRandomCode(),
      subjects: category === 'Teaching Staff' ? selectedSubjects : [],
      createdAt: editingStaff ? editingStaff.createdAt : new Date().toISOString()
    };

    let updatedList: StaffMember[];
    if (editingStaff) {
      updatedList = staffList.map(s => s.id === editingStaff.id ? staffRecord : s);
      toast({ title: 'Staff Updated', description: `Successfully updated ${staffRecord.name}.` });
    } else {
      updatedList = [staffRecord, ...staffList];
      toast({ title: 'Staff Added', description: `Successfully registered ${staffRecord.name} in the master directory.` });
    }

    saveStaffData(updatedList);
    setIsModalOpen(false);
  };

  const handleDeleteStaff = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from the staff registry?`)) {
      const updatedList = staffList.filter(s => s.id !== id);
      saveStaffData(updatedList);
      toast({ title: 'Staff Removed', description: `${name} has been removed from the registry.` });
    }
  };

  const copyCodeToClipboard = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    toast({ title: 'Access Code Copied', description: `Copied code ${code} to clipboard.` });
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  // Extract unique learning areas names for subject pill grid
  const availableLearningAreas = Array.isArray(defaultCbcLearningAreas) && defaultCbcLearningAreas.length > 0
    ? defaultCbcLearningAreas.map((la: any) => typeof la === 'string' ? la : (la.name || la.title || 'Learning Area'))
    : [
        'Mathematics',
        'English Language',
        'Kiswahili Lugha',
        'Science and Technology',
        'Social Studies',
        'Religious Education (CRE/IRE/HRE)',
        'Creative Arts',
        'Physical Education and Sports',
        'Agriculture and Nutrition',
        'Pre-Technical Studies'
      ];

  const filteredStaff = staffList.filter(staff => {
    const matchesSearch = 
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.tscNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.phone.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || staff.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in pb-20">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl border border-indigo-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Staff Registry</h1>
            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/30 font-mono text-xs">
              {staffList.length} Total
            </Badge>
          </div>
          <p className="text-slate-400 text-sm">
            Master directory of teachers, administrators, and support staff · {staffList.length} staff
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleOpenAddModal}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Staff</span>
          </Button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by name, TSC/ID, email or phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-950/80 border-slate-800 text-slate-200 placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {['all', 'Teaching Staff', 'Administration', 'Support Staff'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  categoryFilter === cat 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {cat === 'all' ? 'All Staff' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Staff Table Card */}
      <Card className="bg-slate-900/80 border-slate-800 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table style={{ tableLayout: 'fixed' }} className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-5 w-[22%]">Name</th>
                <th className="py-4 px-4 w-[10%]">Role / Category</th>
                <th className="py-4 px-4 w-[10%]">TSC / ID No.</th>
                <th className="py-4 px-4 w-[13%]">Email</th>
                <th className="py-4 px-4 w-[10%]">Phone</th>
                <th className="py-4 px-4 w-[13%]">Subjects</th>
                <th className="py-4 px-4 w-[6%]">Access Code</th>
                <th className="py-4 px-4 w-[6%]">Status</th>
                <th className="py-4 px-5 text-right w-[10%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
                      <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Users className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-white">No staff members found</h3>
                      <p className="text-slate-400 text-xs">
                        {staffList.length === 0 
                          ? "Your master staff registry is currently empty. Click '+ Add Staff' above to register teachers, administration, or support staff."
                          : "No staff members match your search criteria or active category filter."}
                      </p>
                      {staffList.length === 0 && (
                        <Button 
                          onClick={handleOpenAddModal}
                          className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1.5" /> Register First Staff Member
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">{staff.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">ID: {staff.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className={`font-semibold text-xs ${
                        staff.category === 'Teaching Staff' 
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                          : staff.category === 'Administration'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {staff.category}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-slate-300">
                      {staff.tscNumber}
                    </td>
                    <td className="py-4 px-4 text-slate-300 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[180px]">{staff.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-300 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{staff.phone}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {staff.category === 'Teaching Staff' && staff.subjects && staff.subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {staff.subjects.slice(0, 2).map((sub, sIdx) => (
                            <span key={sIdx} className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-md font-medium border border-slate-700">
                              {sub}
                            </span>
                          ))}
                          {staff.subjects.length > 2 && (
                            <span className="bg-indigo-950 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-md font-semibold border border-indigo-800/60">
                              +{staff.subjects.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs italic">N/A</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 w-fit">
                        <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="font-mono text-xs font-bold text-amber-300 tracking-wider">{staff.accessCode}</span>
                        <button
                          onClick={() => copyCodeToClipboard(staff.id, staff.accessCode)}
                          className="text-slate-400 hover:text-white transition-colors ml-1 p-0.5 rounded hover:bg-slate-800"
                          title="Copy Access Code"
                        >
                          {copiedCodeId === staff.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        staff.status === 'Active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                          : staff.status === 'On Leave'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          staff.status === 'Active' ? 'bg-emerald-400 animate-pulse' : staff.status === 'On Leave' ? 'bg-amber-400' : 'bg-rose-400'
                        }`} />
                        {staff.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditModal(staff)}
                          className="h-8 w-8 text-slate-400 hover:text-white hover:bg-indigo-600/20 rounded-lg"
                          title="Edit Staff Member"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteStaff(staff.id, staff.name)}
                          className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg"
                          title="Delete Staff Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Staff Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                <Users className="w-4 h-4" />
              </div>
              {editingStaff ? 'Edit Staff Member' : 'Register New Staff Member'}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Fill in the staff credentials, category, and subject competencies for the master school directory.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveStaff} className="space-y-5 pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Full Name *</Label>
                <Input
                  placeholder="e.g. John Kamau"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-200 rounded-xl focus-visible:ring-indigo-500"
                  required
                />
              </div>

              {/* Staff Category */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Staff Category *</Label>
                <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    <SelectItem value="Teaching Staff">Teaching Staff</SelectItem>
                    <SelectItem value="Administration">Administration</SelectItem>
                    <SelectItem value="Support Staff">Support Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* TSC / ID No */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">TSC / Identification Number *</Label>
                <Input
                  placeholder="e.g. TSC/984521 or ID 31452981"
                  value={tscNumber}
                  onChange={(e) => setTscNumber(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-200 rounded-xl font-mono focus-visible:ring-indigo-500"
                  required
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Employment Status *</Label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 rounded-xl">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Email Address</Label>
                <Input
                  type="email"
                  placeholder="staff@school.ac.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-200 rounded-xl focus-visible:ring-indigo-500"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Phone Number</Label>
                <Input
                  placeholder="+254 712 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-200 rounded-xl focus-visible:ring-indigo-500"
                />
              </div>
            </div>

            {/* Access Code generation row */}
            <div className="space-y-1.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-400" /> Portal Login Access Code
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateSecureCode}
                  className="h-7 text-xs bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                >
                  Generate New Code
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-amber-300 font-mono font-bold tracking-widest text-base rounded-xl"
                  placeholder="STF-XXXXX"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Staff member will use this secure access code to log into their staff portal.
              </p>
            </div>

            {/* Subjects Grid (Conditionally shown or optional for Teaching Staff) */}
            {category === 'Teaching Staff' && (
              <div className="space-y-2 bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-400" /> Subject & Learning Area Competencies
                  </Label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {selectedSubjects.length} selected
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Click learning areas below to toggle staff teaching allocations.
                </p>
                <div className="flex flex-wrap gap-2 pt-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                  {availableLearningAreas.map((sub: string, sIdx: number) => {
                    const isSelected = selectedSubjects.includes(sub);
                    return (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => handleToggleSubject(sub)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        {sub} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <DialogFooter className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30"
              >
                {editingStaff ? 'Save Changes' : 'Register Staff Member'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
