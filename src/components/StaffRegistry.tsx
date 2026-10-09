import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  BookOpen, 
  GraduationCap, 
  User, 
  Mail, 
  Phone, 
  Award, 
  FileSpreadsheet, 
  AlertCircle, 
  Fingerprint, 
  Sparkles,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { defaultCbcLearningAreas, MOCK_STAFF } from '../lib/mock-data';

export type StaffCategoryRole =
  | 'Class Teacher'
  | 'Subject Teacher'
  | 'ICT Teacher'
  | 'Lab Teacher'
  | 'Bursar'
  | 'Library Teacher'
  | 'HOI'
  | 'DHOI'
  | 'Store Master';

export interface StaffAllocationRecord {
  subject: string;
  grade: string;
  stream: string;
}

export interface StaffMember {
  id: string;
  name: string;
  category: StaffCategoryRole;
  tscNumber: string;
  email: string;
  phone: string;
  subjects: string[];
  assignedClasses?: string[];
  assignedStreams?: string[];
  allocations?: StaffAllocationRecord[];
  accessCode: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  createdAt?: string;
}

export default function StaffRegistry() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [category, setCategory] = useState<StaffCategoryRole>('Class Teacher');
  const [tscNumber, setTscNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'Active' | 'On Leave' | 'Inactive'>('Active');
  const [accessCode, setAccessCode] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [assignedStreams, setAssignedStreams] = useState<string[]>([]);
  // Structured subject & class allocation records: e.g. { subject: "Mathematics", grade: "Grade 7", stream: "Mercury" }
  const [allocations, setAllocations] = useState<StaffAllocationRecord[]>([]);

  // Active subject being configured for grade/stream matrix
  const [activeSubjectForAllocation, setActiveSubjectForAllocation] = useState<string | null>(null);

  // Generator for Access Code
  const generateSecureCode = () => {
    setAccessCode(generateRandomCode());
  };

  useEffect(() => {
    // Load from local storage or fallback to mock data
    const stored = localStorage.getItem('munyaka_staff');
    let loadedStaff: any[] = [];
    if (stored) {
      try {
        loadedStaff = JSON.parse(stored);
      } catch (e) {
        loadedStaff = MOCK_STAFF;
      }
    } else {
      loadedStaff = MOCK_STAFF;
    }

    // Sanitize and deduplicate loaded list to guarantee unique IDs, clean categories, and remove duplicates/dashes
    const seenIds = new Set<string>();
    const sanitized: StaffMember[] = loadedStaff.map((staff, idx) => {
      let id = staff.id || `staff_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`;
      if (seenIds.has(id)) {
        id = `staff_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`;
      }
      seenIds.add(id);

      let cat: StaffCategoryRole = staff.category;
      if (cat === 'Teaching Staff' as any) cat = 'Subject Teacher';
      else if (cat === 'Administration' as any) cat = 'HOI';
      else if (cat === 'Support Staff' as any) cat = 'Store Master';
      else if (!cat) cat = 'Class Teacher';

      return {
        id,
        name: staff.name || 'Unnamed Staff',
        category: cat,
        tscNumber: staff.tscNumber || 'N/A',
        email: staff.email || `${(staff.name || 'staff').toLowerCase().replace(/\s+/g, '.')}@munyaka.sc.ke`,
        phone: staff.phone || '+254 712 345 678',
        subjects: staff.subjects || [],
        assignedClasses: staff.assignedClasses || [],
        assignedStreams: staff.assignedStreams || [],
        allocations: Array.isArray(staff.allocations)
          ? staff.allocations.filter((a: any) => a && typeof a === 'object' && a.subject)
          : (staff.subjects || []).map((sub: string) => ({
              subject: sub,
              grade: (staff.assignedClasses || [])[0] || 'Grade 4',
              stream: (staff.assignedStreams || [])[0] || 'Blue'
            })),
        accessCode: staff.accessCode || Math.random().toString(36).substring(2, 7).toUpperCase(),
        status: staff.status || 'Active',
        createdAt: staff.createdAt || new Date().toISOString()
      };
    });

    setStaffList(sanitized);
    localStorage.setItem('munyaka_staff', JSON.stringify(sanitized));
  }, []);

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setFullName('');
    setCategory('Class Teacher');
    setTscNumber('');
    setEmail('');
    setPhone('');
    setStatus('Active');
    setSelectedSubjects([]);
    setAssignedClasses([]);
    setAssignedStreams([]);
    setAllocations([]);
    setActiveSubjectForAllocation(null);
    generateSecureCode();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFullName(staff.name);
    setCategory(staff.category);
    setTscNumber(staff.tscNumber);
    // Strip @munyaka.sc.ke or @school.ac.ke domain if present for username-only input
    let rawEmail = staff.email || '';
    if (rawEmail.includes('@')) {
      rawEmail = rawEmail.split('@')[0];
    }
    setEmail(rawEmail);
    setPhone(staff.phone);
    setStatus(staff.status);
    setAccessCode(staff.accessCode || generateRandomCode());
    
    const loadedSubs = staff.subjects || [];
    setSelectedSubjects(loadedSubs);
    setAssignedClasses(staff.assignedClasses || []);
    setAssignedStreams(staff.assignedStreams || []);
    
    let loadedAllocs: StaffAllocationRecord[] = [];
    if (Array.isArray(staff.allocations) && staff.allocations.length > 0) {
      loadedAllocs = staff.allocations;
    } else {
      // Build default allocations if none existed
      loadedSubs.forEach(sub => {
        loadedAllocs.push({
          subject: sub,
          grade: (staff.assignedClasses || [])[0] || 'Grade 4',
          stream: (staff.assignedStreams || [])[0] || 'Blue'
        });
      });
    }
    setAllocations(loadedAllocs);
    setActiveSubjectForAllocation(loadedSubs[0] || null);
    setIsModalOpen(true);
  };

  const handleToggleSubject = (subjectName: string) => {
    let nextSubjects: string[];
    let nextAllocations = [...allocations];

    if (selectedSubjects.includes(subjectName)) {
      nextSubjects = selectedSubjects.filter(s => s !== subjectName);
      nextAllocations = nextAllocations.filter(a => a.subject !== subjectName);
      if (activeSubjectForAllocation === subjectName) {
        setActiveSubjectForAllocation(nextSubjects[0] || null);
      }
    } else {
      nextSubjects = [...selectedSubjects, subjectName];
      // Add default allocation for this subject with first available grade/stream or defaults
      const defaultGrade = availableSchoolClasses[2] || 'Grade 4';
      const defaultStream = availableSchoolStreams[0] || 'Blue';
      nextAllocations.push({
        subject: subjectName,
        grade: defaultGrade,
        stream: defaultStream
      });
      if (!activeSubjectForAllocation) {
        setActiveSubjectForAllocation(subjectName);
      }
    }

    setSelectedSubjects(nextSubjects);
    setAllocations(nextAllocations);

    // Also sync legacy assignedClasses and assignedStreams for backward compatibility
    const uniqueGrades = Array.from(new Set(nextAllocations.map(a => a.grade).filter(Boolean)));
    const uniqueStreams = Array.from(new Set(nextAllocations.map(a => a.stream).filter(Boolean)));
    setAssignedClasses(uniqueGrades);
    setAssignedStreams(uniqueStreams);
  };

  const handleUpdateAllocation = (subject: string, grade: string, stream: string) => {
    const existingIdx = allocations.findIndex(a => a.subject === subject);
    let nextAllocations = [...allocations];
    if (existingIdx >= 0) {
      nextAllocations[existingIdx] = { subject, grade, stream };
    } else {
      nextAllocations.push({ subject, grade, stream });
    }
    setAllocations(nextAllocations);

    // Sync legacy assignedClasses / assignedStreams
    const uniqueGrades = Array.from(new Set(nextAllocations.map(a => a.grade).filter(Boolean)));
    const uniqueStreams = Array.from(new Set(nextAllocations.map(a => a.stream).filter(Boolean)));
    setAssignedClasses(uniqueGrades);
    setAssignedStreams(uniqueStreams);
  };

  const handleToggleGradeForActiveSubject = (grade: string) => {
    if (!activeSubjectForAllocation) {
      toast.error("Please select a subject first");
      return;
    }
    const currentAlloc = allocations.find(a => a.subject === activeSubjectForAllocation);
    const currentStream = currentAlloc?.stream || availableSchoolStreams[0] || 'Blue';
    handleUpdateAllocation(activeSubjectForAllocation, grade, currentStream);
  };

  const handleToggleStreamForActiveSubject = (stream: string) => {
    if (!activeSubjectForAllocation) {
      toast.error("Please select a subject first");
      return;
    }
    const currentAlloc = allocations.find(a => a.subject === activeSubjectForAllocation);
    const currentGrade = currentAlloc?.grade || availableSchoolClasses[2] || 'Grade 4';
    handleUpdateAllocation(activeSubjectForAllocation, currentGrade, stream);
  };

  function generateRandomCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  const handleDeleteStaff = (id: string) => {
    if (confirm("Are you sure you want to remove this staff member from the system? This action cannot be undone.")) {
      const updated = staffList.filter(s => s.id !== id);
      setStaffList(updated);
      localStorage.setItem('munyaka_staff', JSON.stringify(updated));
      toast.success("Staff member removed successfully");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Access code ${code} copied to clipboard!`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (category !== 'Bursar' && category !== 'Store Master' && !tscNumber.trim()) {
      toast.error("TSC Registration Number is required for this staff role");
      return;
    }

    const fullEmail = email.trim()
      ? (email.includes('@') ? email.trim() : `${email.trim()}@munyaka.sc.ke`)
      : `${fullName.toLowerCase().replace(/\s+/g, '.')}@munyaka.sc.ke`;

    const staffRecord: StaffMember = {
      id: editingStaff ? editingStaff.id : `staff_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: fullName.trim(),
      category,
      email: fullEmail,
      phone: phone.trim() || '+254 712 345 678',
      tscNumber: tscNumber.trim(),
      status,
      accessCode: accessCode || generateRandomCode(),
      subjects: category !== 'Bursar' && category !== 'Store Master' ? selectedSubjects : [],
      assignedClasses: category !== 'Bursar' && category !== 'Store Master' ? assignedClasses : [],
      assignedStreams: category !== 'Bursar' && category !== 'Store Master' ? assignedStreams : [],
      allocations: category !== 'Bursar' && category !== 'Store Master' ? allocations : [],
      createdAt: editingStaff ? editingStaff.createdAt : new Date().toISOString()
    };

    let updatedList: StaffMember[];
    if (editingStaff) {
      updatedList = staffList.map(s => s.id === editingStaff.id ? staffRecord : s);
      toast.success("Staff profile updated successfully");
    } else {
      updatedList = [staffRecord, ...staffList];
      toast.success("Staff member registered successfully");
    }

    setStaffList(updatedList);
    localStorage.setItem('munyaka_staff', JSON.stringify(updatedList));
    setIsModalOpen(false);
  };

  // Synchronized horizontal scrollbars
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  const handleTopScroll = () => {
    if (topScrollRef.current && bottomScrollRef.current) {
      bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleBottomScroll = () => {
    if (topScrollRef.current && bottomScrollRef.current) {
      topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
    }
  };

  // Extract unique learning areas names for subject pill grid
  const availableLearningAreas = Array.isArray(defaultCbcLearningAreas) && defaultCbcLearningAreas.length > 0
    ? defaultCbcLearningAreas.map((la: any) => {
        if (!la) return 'Learning Area';
        if (typeof la === 'string') return la;
        if (typeof la === 'object') {
          return String(la.name || la.title || la.subject || la.label || JSON.stringify(la));
        }
        return String(la);
      })
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

  const availableSchoolClasses = [
    'PP1', 'PP2',
    'Grade 1', 'Grade 2', 'Grade 3',
    'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9'
  ];

  const availableSchoolStreams = [
    'Blue', 'Red', 'Green', 'East', 'West'
  ];

  // Helper function to check if a category is a teaching role
  const categoryIsTeaching = (cat: string) => {
    return cat !== 'Bursar' && cat !== 'Store Master';
  };
  const filteredLearningAreasForClasses = useMemo(() => {
    // If no classes selected, show all available learning areas
    if (!assignedClasses || assignedClasses.length === 0) {
      return availableLearningAreas;
    }

    // Determine highest or relevant grade tier
    let hasPrePrimary = false;
    let hasLowerPrimary = false;
    let hasUpperPrimary = false;
    let hasJuniorSecondary = false;

    assignedClasses.forEach(cls => {
      const upperCls = cls.toUpperCase();
      if (upperCls.includes('PP1') || upperCls.includes('PP2') || upperCls.includes('PRE-PRIMARY')) {
        hasPrePrimary = true;
      }
      if (upperCls.includes('GRADE 1') || upperCls.includes('GRADE 2') || upperCls.includes('GRADE 3')) {
        hasLowerPrimary = true;
      }
      if (upperCls.includes('GRADE 4') || upperCls.includes('GRADE 5') || upperCls.includes('GRADE 6')) {
        hasUpperPrimary = true;
      }
      if (upperCls.includes('GRADE 7') || upperCls.includes('GRADE 8') || upperCls.includes('GRADE 9') || upperCls.includes('JUNIOR')) {
        hasJuniorSecondary = true;
      }
    });

    // Fallback if none matched specifically
    if (!hasPrePrimary && !hasLowerPrimary && !hasUpperPrimary && !hasJuniorSecondary) {
      return availableLearningAreas;
    }

    // Filter available learning areas according to CBC curriculum tiers
    const filtered = availableLearningAreas.filter(area => {
      const lower = area.toLowerCase();

      // Pre-Primary & Lower Primary focus on foundational activities (Math, Language, Environmental, Creative, Religious)
      if ((hasPrePrimary || hasLowerPrimary) && !hasUpperPrimary && !hasJuniorSecondary) {
        return (
          lower.includes('math') ||
          lower.includes('english') ||
          lower.includes('kiswahili') ||
          lower.includes('language') ||
          lower.includes('lugha') ||
          lower.includes('environmental') ||
          lower.includes('hygiene') ||
          lower.includes('nutrition') ||
          lower.includes('religious') ||
          lower.includes('cre') ||
          lower.includes('ire') ||
          lower.includes('hre') ||
          lower.includes('movement') ||
          lower.includes('creative') ||
          lower.includes('music') ||
          lower.includes('art')
        );
      }

      // Upper Primary & Junior Secondary include Science, Social Studies, Agriculture, Pre-Technical, Computer Science
      if (hasUpperPrimary || hasJuniorSecondary) {
        return true; // All subjects apply or tailored
      }

      return true;
    });

    // If filter was too restrictive, return all to prevent empty states
    return filtered.length > 0 ? filtered : availableLearningAreas;
  }, [assignedClasses, availableLearningAreas]);

  // Filters
  const filteredStaff = useMemo(() => {
    return staffList.filter(staff => {
      const matchesSearch = 
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.tscNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'All' || staff.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' || staff.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [staffList, searchQuery, categoryFilter, statusFilter]);

  const getStatusBadgeConfig = (statusStr: string) => {
    switch (statusStr) {
      case 'Active':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Active' };
      case 'On Leave':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'On Leave' };
      case 'Inactive':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'Inactive' };
      default:
        return { bg: 'bg-slate-50 text-slate-700 border-slate-200', text: 'Unknown' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-150 shadow-sm shadow-slate-100/50">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" /> Staff & Teacher Registry
          </h2>
          <p className="text-slate-500 text-xs mt-1">Manage teaching assignments, access codes, TSC registration, and system roles.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-sm shadow-indigo-100 border border-indigo-700"
        >
          <Plus className="w-4.5 h-4.5" /> Register New Staff
        </button>
      </div>

      {/* Filters and Search Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, TSC number, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
          >
            <option value="All">All Roles</option>
            <option value="Class Teacher">Class Teacher</option>
            <option value="Subject Teacher">Subject Teacher</option>
            <option value="ICT Teacher">ICT Teacher</option>
            <option value="Lab Teacher">Lab Teacher</option>
            <option value="Bursar">Bursar</option>
            <option value="Library Teacher">Library Teacher</option>
            <option value="HOI">HOI</option>
            <option value="DHOI">DHOI</option>
            <option value="Store Master">Store Master</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table Wrapper with Synchronized Double-Scrollbars */}
      <div className="bg-white rounded-2xl border border-slate-150 shadow-sm shadow-slate-100 overflow-hidden">
        {/* Top Scrollbar (Visible only when overflowing) */}
        <div 
          ref={topScrollRef}
          onScroll={handleTopScroll}
          className="overflow-x-auto border-b border-slate-100 bg-slate-50/50 custom-scrollbar"
        >
          <div className="h-2 min-w-[1200px]"></div>
        </div>

        <div 
          ref={bottomScrollRef}
          onScroll={handleBottomScroll}
          className="overflow-x-auto custom-scrollbar"
        >
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="border-b border-slate-150 bg-slate-50/70 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4 min-w-[220px]">Staff Member</th>
                <th className="py-3.5 px-3 min-w-[150px]">Contact Info</th>
                <th className="py-3.5 px-3 min-w-[120px]">TSC No. / ID No.</th>
                <th className="py-3.5 px-3 min-w-[180px]">Subjects</th>
                <th className="py-3.5 px-3 min-w-[150px]">Assigned Classes</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 min-w-[130px] text-center">Access Code</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <span className="font-medium text-slate-500">No staff members found matching criteria</span>
                      <span className="text-xs text-slate-400">Try adjusting your keyword searches or filter parameters.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff, idx) => {
                  const statusConfig = getStatusBadgeConfig(staff.status);
                  return (
                    <tr 
                      key={staff.id || `staff-${idx}`}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors duration-150 group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                            {staff.name ? staff.name.split(' ').pop()?.charAt(0) : 'S'}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block text-sm group-hover:text-indigo-600 transition-colors">
                              {staff.name}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: {staff.id || `STF-${idx + 1}`}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border mt-1 ${
                                staff.category === 'HOI' || staff.category === 'DHOI'
                                  ? 'bg-amber-50 text-amber-700 border-amber-150'
                                  : staff.category === 'Bursar' || staff.category === 'Store Master'
                                    ? 'bg-slate-50 text-slate-700 border-slate-150'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-150'
                              }`}>
                                {staff.category || 'Class Teacher'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          <span className="text-xs text-slate-700 block flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" /> {staff.email}
                          </span>
                          <span className="text-xs text-slate-500 block flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {staff.phone}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100/70 border border-slate-200/50 px-2 py-1 rounded">
                          {staff.tscNumber || 'N/A'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        {categoryIsTeaching(staff.category) && staff.subjects && staff.subjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {staff.subjects.slice(0, 2).map((sub, sIdx) => {
                              const subName = typeof sub === 'string' ? sub : (sub && typeof sub === 'object' ? String((sub as any).name || (sub as any).title || (sub as any).subject || JSON.stringify(sub)) : String(sub));
                              return (
                                <span key={sIdx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  {subName}
                                </span>
                              );
                            })}
                            {staff.subjects.length > 2 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                +{staff.subjects.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        {categoryIsTeaching(staff.category) && ((staff.allocations && staff.allocations.length > 0) || (staff.assignedClasses && staff.assignedClasses.length > 0) || (staff.subjects && staff.subjects.length > 0)) ? (
                          <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                            {/* Render structured allocations cleanly: "Mathematics (Grade 7 Mercury)" */}
                            {staff.allocations && staff.allocations.length > 0 ? (
                              staff.allocations.slice(0, 4).map((alloc, aIdx) => {
                                const subj = typeof alloc === 'string' ? alloc : (alloc?.subject || '');
                                const grade = alloc?.grade || '';
                                const stream = alloc?.stream || '';
                                const classLoc = [grade, stream].filter(Boolean).join(' ');
                                const displayText = subj && classLoc ? `${subj} (${classLoc})` : (subj || classLoc);
                                return (
                                  <span key={aIdx} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                                    {displayText || 'General Allocation'}
                                  </span>
                                );
                              })
                            ) : staff.assignedClasses && staff.assignedClasses.length > 0 ? (
                              staff.assignedClasses.slice(0, 4).map((cls, cIdx) => {
                                const strm = (staff.assignedStreams || [])[cIdx] || (staff.assignedStreams || [])[0] || '';
                                const displayText = [cls, strm].filter(Boolean).join(' ');
                                return (
                                  <span key={cIdx} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                                    {displayText}
                                  </span>
                                );
                              })
                            ) : staff.subjects && staff.subjects.length > 0 ? (
                              staff.subjects.slice(0, 3).map((sub, sIdx) => (
                                <span key={sIdx} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  {sub}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                            
                            {((staff.allocations?.length || 0) > 4 || (staff.assignedClasses?.length || 0) > 4) && (
                              <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                +{Math.max((staff.allocations?.length || 0), (staff.assignedClasses?.length || 0)) - 4} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.bg}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                          {statusConfig.text}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-150 px-2 py-1 rounded-lg">
                          <span className="font-mono text-xs font-bold text-slate-800 tracking-wider">
                            {staff.accessCode || '—'}
                          </span>
                          {staff.accessCode && (
                            <button 
                              onClick={() => handleCopyCode(staff.accessCode)}
                              className="p-1 hover:bg-white rounded hover:text-indigo-600 text-slate-400 border border-transparent hover:border-slate-200 transition-all"
                              title="Copy code to clipboard"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(staff)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg transition-all"
                            title="Edit profile"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(staff.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all"
                            title="Remove staff"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register/Edit Staff Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-150 w-full max-w-2xl overflow-hidden animate-slide-up my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  {editingStaff ? "Edit Staff Profile" : "Register New Staff Member"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Fill in details below to manage system permissions and assignments.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-200 hover:border-slate-300 flex items-center justify-center text-slate-400 hover:text-slate-600 bg-white transition-all text-lg font-medium"
              >
                &times;
              </button>
            </div>

            {/* Modal Form Scroll Area */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1 custom-scrollbar">
              
              {/* Profile details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Full Name <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="e.g. Mrs. Mary Atieno"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Staff Category / Role <span className="text-rose-500">*</span></label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as StaffCategoryRole)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  >
                    <option value="Class Teacher">Class Teacher</option>
                    <option value="Subject Teacher">Subject Teacher</option>
                    <option value="ICT Teacher">ICT Teacher</option>
                    <option value="Lab Teacher">Lab Teacher</option>
                    <option value="Bursar">Bursar</option>
                    <option value="Library Teacher">Library Teacher</option>
                    <option value="HOI">HOI</option>
                    <option value="DHOI">DHOI</option>
                    <option value="Store Master">Store Master</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                    National ID / TSC No.
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. TSC/984521 or ID 31452981"
                      value={tscNumber}
                      onChange={(e) => setTscNumber(e.target.value)}
                      required={category !== 'Bursar' && category !== 'Store Master'}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Email Address</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="e.g. mary.atieno"
                      value={email}
                      onChange={(e) => {
                        // Remove any accidental @munyaka.sc.ke typed by user so we don't duplicate domain
                        let val = e.target.value;
                        if (val.includes('@')) {
                          val = val.split('@')[0];
                        }
                        setEmail(val);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-l-xl py-2 pl-9 pr-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                    <span className="bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl px-3 py-2 text-xs font-semibold text-slate-500 select-none whitespace-nowrap">
                      @munyaka.sc.ke
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="tel" 
                      placeholder="e.g. +254 722 890 123"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Secure Portal Access Code Row */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-indigo-500 animate-pulse" /> Secure Access Code
                </span>
                <p className="text-[11px] text-slate-500">Provide this code to the staff member so they can authenticate and record marks under their profile.</p>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly
                    value={accessCode}
                    className="bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-mono font-bold tracking-wider text-slate-800 text-center w-36 select-all focus:outline-none focus:ring-0"
                  />
                  <button 
                    type="button"
                    onClick={generateSecureCode}
                    className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    Generate New Code
                  </button>
                </div>
              </div>

              {/* Restructured Subject & Class Allocation Workflow */}
              {category !== 'Bursar' && category !== 'Store Master' && (
                <div className="space-y-4 bg-slate-50/70 p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen className="w-4.5 h-4.5 text-indigo-600" /> Subject & Class Allocations
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Step 1: Select subjects taught. Step 2: Configure grade and stream for each subject.
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                      {selectedSubjects.length} Subject(s) Selected
                    </span>
                  </div>

                  {/* 1. Subject Selection Grid */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-2">
                      1. Select Subjects Taught <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1 custom-scrollbar">
                      {availableLearningAreas.map((sub) => {
                        const isSelected = selectedSubjects.includes(sub);
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => handleToggleSubject(sub)}
                            className={`flex items-center gap-2 p-2 rounded-xl text-left text-xs font-medium transition-all duration-200 border ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-200'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                              isSelected ? 'bg-white border-white text-indigo-600' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="truncate">{sub}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Grade & Stream Assignment Per Subject */}
                  {selectedSubjects.length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-slate-200/60">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 block">
                          2. Assign Grade & Stream per Subject
                        </label>
                        <span className="text-[11px] text-slate-500">
                          Click a subject tab below to configure its classes
                        </span>
                      </div>

                      {/* Subject tabs */}
                      <div className="flex flex-wrap gap-1.5 bg-white p-2 rounded-xl border border-slate-200">
                        {selectedSubjects.map(sub => {
                          const isActive = activeSubjectForAllocation === sub;
                          const alloc = allocations.find(a => a.subject === sub);
                          const gradeBadge = alloc?.grade || 'No Grade';
                          const streamBadge = alloc?.stream || 'No Stream';
                          return (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => setActiveSubjectForAllocation(sub)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 border ${
                                isActive
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-2xs font-semibold'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <span>{sub}</span>
                              <span className="text-[10px] bg-white px-1.5 py-0.5 rounded text-slate-500 border border-slate-200 font-mono">
                                {gradeBadge} {streamBadge}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Subject Configuration Panel */}
                      {activeSubjectForAllocation && (
                        <div className="bg-white p-4 rounded-xl border border-indigo-150 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                              <GraduationCap className="w-4 h-4 text-indigo-600" />
                              Configuring Grade & Stream for: <span className="underline">{activeSubjectForAllocation}</span>
                            </span>
                            {(() => {
                              const curr = allocations.find(a => a.subject === activeSubjectForAllocation);
                              return (
                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                                  {curr?.grade || 'Select Grade'} — {curr?.stream || 'Select Stream'}
                                </span>
                              );
                            })()}
                          </div>

                          {/* Grade Selector */}
                          <div>
                            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 uppercase tracking-wider">Select Grade</span>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                              {availableSchoolClasses.map(cls => {
                                const curr = allocations.find(a => a.subject === activeSubjectForAllocation);
                                const isSelected = curr?.grade === cls;
                                return (
                                  <button
                                    key={cls}
                                    type="button"
                                    onClick={() => handleToggleGradeForActiveSubject(cls)}
                                    className={`py-1.5 px-2 rounded-lg text-xs font-medium text-center transition-all border ${
                                      isSelected
                                        ? 'bg-emerald-600 border-emerald-600 text-white font-semibold shadow-2xs'
                                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-300'
                                    }`}
                                  >
                                    {cls}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Stream Selector */}
                          <div className="pt-1">
                            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 uppercase tracking-wider">Select Stream</span>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                              {availableSchoolStreams.map(strm => {
                                const curr = allocations.find(a => a.subject === activeSubjectForAllocation);
                                const isSelected = curr?.stream === strm;
                                return (
                                  <button
                                    key={strm}
                                    type="button"
                                    onClick={() => handleToggleStreamForActiveSubject(strm)}
                                    className={`py-1.5 px-2 rounded-lg text-xs font-medium text-center transition-all border ${
                                      isSelected
                                        ? 'bg-amber-600 border-amber-600 text-white font-semibold shadow-2xs'
                                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-amber-300'
                                    }`}
                                  >
                                    {strm}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </form>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 border border-indigo-700 text-white text-sm font-semibold rounded-xl hover:shadow shadow-indigo-100 transition-all"
              >
                {editingStaff ? "Save Changes" : "Register Staff"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
