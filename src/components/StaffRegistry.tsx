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
import { isTeachingStaff, isSupportStaff, getStaffTypeBadge } from '@/utils/staffUtils';
import { useGradesAndStreams } from '../hooks/useGradesStreams';
import { CentralDataService } from '@/services/centralDataService';

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
  role?: string;
  designation?: string;
  specificRole?: string;
  type?: string;
  tscNumber: string;
  email: string;
  phone: string;
  subjects: string[];
  assignedClasses?: string[];
  assignedStreams?: string[];
  assignedClass?: string;
  homeroomGrade?: string;
  homeroomStream?: string;
  allocations?: StaffAllocationRecord[];
  accessCode: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  createdAt?: string;
  [key: string]: any;
}

export default function StaffRegistry() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Load RBAC settings dynamically from CentralDataService / munyaka_central_db
  const [rbacSettings, setRbacSettings] = useState<any>(() => {
    try {
      const db = CentralDataService.getDB();
      return db.settings?.rbac || {
        roles: [
          { name: 'HOI', category: 'Teaching', portalAccess: '/dashboard', permissions: ['all'] },
          { name: 'DHOI', category: 'Teaching', portalAccess: '/dashboard', permissions: ['all'] },
          { name: 'Class Teacher', category: 'Teaching', portalAccess: '/learners', permissions: ['view_learners', 'edit_learners'] },
          { name: 'Subject Teacher', category: 'Teaching', portalAccess: '/assessments', permissions: ['view_assessments'] },
          { name: 'ICT Teacher', category: 'Teaching', portalAccess: '/dashboard', permissions: ['manage_ict'] },
          { name: 'Library Teacher', category: 'Teaching', portalAccess: '/library', permissions: ['manage_library'] },
          { name: 'Bursar', category: 'Support', portalAccess: '/fees', permissions: ['manage_fees'] },
          { name: 'Store Master', category: 'Support', portalAccess: '/inventory', permissions: ['manage_inventory'] }
        ]
      };
    } catch {
      return {
        roles: [
          { name: 'HOI', category: 'Teaching', portalAccess: '/dashboard', permissions: ['all'] },
          { name: 'DHOI', category: 'Teaching', portalAccess: '/dashboard', permissions: ['all'] },
          { name: 'Class Teacher', category: 'Teaching', portalAccess: '/learners', permissions: ['view_learners', 'edit_learners'] },
          { name: 'Subject Teacher', category: 'Teaching', portalAccess: '/assessments', permissions: ['view_assessments'] },
          { name: 'ICT Teacher', category: 'Teaching', portalAccess: '/dashboard', permissions: ['manage_ict'] },
          { name: 'Library Teacher', category: 'Teaching', portalAccess: '/library', permissions: ['manage_library'] },
          { name: 'Bursar', category: 'Support', portalAccess: '/fees', permissions: ['manage_fees'] },
          { name: 'Store Master', category: 'Support', portalAccess: '/inventory', permissions: ['manage_inventory'] }
        ]
      };
    }
  });

  const getStaffRBAC = (roleName: string) => {
    const db = (CentralDataService.getDB() || {}) as any;
    const rbacRoles = db.settings?.rbac?.roles || rbacSettings?.roles || [];
    const lowerRole = (roleName || '').toLowerCase();

    const match = rbacRoles.find((r: any) => r.name?.toLowerCase() === lowerRole);
    if (match) return match;

    const isSupport = ['bursar', 'store master', 'secretary', 'cook', 'security', 'driver', 'groundskeeper']
      .some(k => lowerRole.includes(k));

    return {
      category: isSupport ? 'Support' : 'Teaching',
      portalAccess: isSupport ? '/fees' : '/dashboard'
    };
  };
  const [fullName, setFullName] = useState('');
  const [category, setCategory] = useState<StaffCategoryRole>('Class Teacher');
  const [tscNumber, setTscNumber] = useState('');
  const [email, setEmail] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'Active' | 'On Leave' | 'Inactive'>('Active');
  const [accessCode, setAccessCode] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [assignedStreams, setAssignedStreams] = useState<string[]>([]);
  const [homeroomGrade, setHomeroomGrade] = useState('Grade 7');
  const [homeroomStream, setHomeroomStream] = useState('');
  // Structured subject & class allocation records: e.g. { subject: "Mathematics", grade: "Grade 7", stream: "East" }
  const [allocations, setAllocations] = useState<StaffAllocationRecord[]>([]);

  // Active subject being configured for grade/stream matrix
  const [activeSubjectForAllocation, setActiveSubjectForAllocation] = useState<string | null>(null);

  // Grades and streams configuration hook
  const { grades: availableSchoolClasses, getStreamsForGrade, streams: allGlobalStreams } = useGradesAndStreams();

  const getGradeAndStreamData = () => {
    const db = CentralDataService.getDB() || {};
    
    // Search across potential database arrays where Grade & Stream menu saves data
    const rawClasses = db.gradeStreams || db.classes || db.schoolClasses || db.settings?.classes || db.settings?.gradesAndStreams || [];

    // Extract unique grade names
    const gradeSet = new Set<string>();
    const streamsByGrade: Record<string, Set<string>> = {};

    if (Array.isArray(rawClasses) && rawClasses.length > 0) {
      rawClasses.forEach((item: any) => {
        const gName = (item.grade || item.gradeName || item.name || '').toString().trim();
        const sName = (item.stream || item.streamName || '').toString().trim();

        if (gName) {
          gradeSet.add(gName);
          if (!streamsByGrade[gName]) {
            streamsByGrade[gName] = new Set<string>();
          }
          if (sName) streamsByGrade[gName].add(sName);
          if (Array.isArray(item.streams)) {
            item.streams.forEach((s: any) => {
              const str = typeof s === 'string' ? s : s.name;
              if (str) streamsByGrade[gName].add(str);
            });
          }
        }
      });
    }

    // Also include grades from availableSchoolClasses and gradeStreamsMap as fallbacks
    if (availableSchoolClasses && availableSchoolClasses.length > 0) {
      availableSchoolClasses.forEach(g => gradeSet.add(g));
    }

    const availableGrades = Array.from(gradeSet);
    return { availableGrades, streamsByGrade };
  };

  const { availableGrades, streamsByGrade } = getGradeAndStreamData();
  const selectedGrade = homeroomGrade || '';
  
  // Get streams specifically assigned to the selected grade
  const activeStreams = selectedGrade && streamsByGrade[selectedGrade] && streamsByGrade[selectedGrade].size > 0
    ? Array.from(streamsByGrade[selectedGrade])
    : (gradeStreamsMap[selectedGrade] || getStreamsForGrade(selectedGrade) || allGlobalStreams || ['East', 'West']);

  // Load configured grade streams map from CentralDataService if available

  const handleHomeroomGradeChange = (newGrade: string) => {
    const newGradeStreams = streamsByGrade[newGrade] && streamsByGrade[newGrade].size > 0
      ? Array.from(streamsByGrade[newGrade])
      : (gradeStreamsMap[newGrade] || getStreamsForGrade(newGrade) || allGlobalStreams || ['East', 'West']);
    const currentStreamValid = Array.isArray(newGradeStreams) && newGradeStreams.includes(homeroomStream);
    setHomeroomGrade(newGrade);
    if (!currentStreamValid && Array.isArray(newGradeStreams) && newGradeStreams.length > 0) {
      setHomeroomStream(newGradeStreams[0]);
    } else if (!currentStreamValid) {
      setHomeroomStream('');
    }
  };

  // Get relevant streams based on selected grades (or all global streams if none selected)
  const availableSchoolStreams = useMemo(() => {
    if (!assignedClasses || assignedClasses.length === 0) {
      return allGlobalStreams && allGlobalStreams.length > 0 ? allGlobalStreams : [];
    }
    const streamSet = new Set<string>();
    assignedClasses.forEach(cls => {
      const streamsForThisGrade = getStreamsForGrade(cls);
      if (streamsForThisGrade && streamsForThisGrade.length > 0) {
        streamsForThisGrade.forEach(s => streamSet.add(s));
      }
    });
    return Array.from(streamSet);
  }, [assignedClasses, getStreamsForGrade, allGlobalStreams]);

  // Generator for Access Code
  const generateSecureCode = () => {
    setAccessCode(generateRandomCode());
  };

  useEffect(() => {
    const loadData = () => {
      try {
        const db = CentralDataService.getDB();
        if (db.settings?.rbac) {
          setRbacSettings(db.settings.rbac);
        }
      } catch {}

      // Load from local storage without fallback to mock data
      const stored = localStorage.getItem('munyaka_staff') || localStorage.getItem('munyaka_master_staff_list') || localStorage.getItem('munyaka_staff_directory');
      let loadedStaff: any[] = [];
      if (stored) {
        try {
          loadedStaff = JSON.parse(stored);
          if (!Array.isArray(loadedStaff)) {
            loadedStaff = [];
          }
        } catch (e) {
          loadedStaff = [];
        }
      } else {
        loadedStaff = [];
      }

      // Sanitize loaded list
      const seenIds = new Set<string>();
      const sanitized: StaffMember[] = loadedStaff.map((staff, idx) => {
        let id = staff.id || `staff_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`;
        if (seenIds.has(id)) {
          id = `staff_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`;
        }
        seenIds.add(id);

        let cat: StaffCategoryRole = staff.category;
        if (cat === ('Teaching Staff' as any)) cat = 'Subject Teacher';
        else if (cat === ('Administration' as any)) cat = 'HOI';
        else if (cat === ('Support Staff' as any)) cat = 'Store Master';
        else if (!cat) cat = 'Class Teacher';

        const isNonTeaching = cat === 'Bursar' || cat === 'Store Master';

        const rawClasses = staff.assignedClasses || staff.classes || [];
        const cleanClasses = !isNonTeaching && Array.isArray(rawClasses)
          ? rawClasses.map((c: any) => {
              if (!c) return '';
              if (typeof c === 'string') return c;
              if (typeof c === 'object') {
                return String(c.grade || c.name || c.className || `${c.subject || ''} ${c.grade || ''}${c.stream || ''}`.trim() || JSON.stringify(c));
              }
              return String(c);
            }).filter(Boolean)
          : ['Unassigned'];

        const rawStreams = staff.assignedStreams || staff.streams || [];
        const cleanStreams = !isNonTeaching && Array.isArray(rawStreams)
          ? rawStreams.map((s: any) => {
              if (!s) return '';
              if (typeof s === 'string') return s;
              if (typeof s === 'object') {
                return String(s.stream || s.name || `${s.grade || ''} ${s.stream || ''}`.trim() || JSON.stringify(s));
              }
              return String(s);
            }).filter(s => s && s !== 'Mercury')
          : ['Unassigned'];

        const rawSubjects = staff.subjects || staff.assignedSubjects || [];
        const cleanSubjects = !isNonTeaching && Array.isArray(rawSubjects)
          ? rawSubjects.map((sub: any) => {
              if (!sub) return '';
              if (typeof sub === 'string') return sub;
              if (typeof sub === 'object') {
                return String(sub.name || sub.title || sub.subject || sub.learningArea || JSON.stringify(sub));
              }
              return String(sub);
            }).filter(Boolean)
          : [];

        const defaultGrade = cleanClasses[0] || 'Unassigned';
        const defaultStream = cleanStreams[0] || 'Unassigned';

        const cleanAllocations = !isNonTeaching && Array.isArray(staff.allocations)
          ? staff.allocations
              .filter((a: any) => a && typeof a === 'object' && a.subject)
              .map((a: any) => ({
                subject: String(a.subject),
                grade: String(a.grade || defaultGrade),
                stream: a.stream && a.stream !== 'Mercury' ? String(a.stream) : defaultStream
              }))
          : [];

        let code = staff.accessCode;
        if (!code || !code.startsWith('MUN-')) {
          const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
          let randomPart = '';
          for (let i = 0; i < 4; i++) {
            randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          code = `MUN-${randomPart}`;
        }

        const rawName = staff.name || staff.fullName || 'UNNAMED STAFF';
        const formattedName = String(rawName).trim().toUpperCase();

        return {
          id,
          name: formattedName,
          category: cat,
          tscNumber: staff.tscNumber || 'N/A',
          email: staff.email || '',
          phone: staff.phone || '',
          subjects: cleanSubjects,
          assignedClasses: cleanClasses,
          assignedStreams: cleanStreams,
          homeroomGrade: !isNonTeaching ? (staff.homeroomGrade || defaultGrade) : 'Unassigned',
          homeroomStream: !isNonTeaching ? (staff.homeroomStream && staff.homeroomStream !== 'Mercury' ? staff.homeroomStream : defaultStream) : 'Unassigned',
          allocations: cleanAllocations,
          accessCode: code,
          status: staff.status || 'Active',
          createdAt: staff.createdAt || new Date().toISOString()
        };
      });

      setStaffList(sanitized);
      localStorage.setItem('munyaka_staff', JSON.stringify(sanitized));
      localStorage.setItem('munyaka_staff_registry', JSON.stringify(sanitized));
      localStorage.setItem('munyaka_master_staff_list', JSON.stringify(sanitized));
      localStorage.setItem('munyaka_staff_directory', JSON.stringify(sanitized));
    };

    loadData();
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
    setHomeroomGrade('Unassigned');
    setHomeroomStream('Unassigned');
    setAllocations([]);
    setActiveSubjectForAllocation(null);
    generateSecureCode();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFullName(staff.name ? staff.name.toUpperCase() : '');
    setCategory(staff.category);
    setTscNumber(staff.tscNumber);
    const loadedEmail = staff.email || '';
    setEmail(loadedEmail);
    setPhone(staff.phone || '');
    setStatus(staff.status);
    setAccessCode(staff.accessCode || generateRandomCode());
    
    const loadedSubs = staff.subjects || [];
    setSelectedSubjects(loadedSubs);

    const loadedClasses = staff.assignedClasses || [];
    setAssignedClasses(loadedClasses);

    // Validate loaded streams against valid streams for the loaded classes from central configuration
    const validStreamsSet = new Set<string>();
    loadedClasses.forEach(cls => {
      const streamsForGrade = getStreamsForGrade(cls);
      if (streamsForGrade && streamsForGrade.length > 0) {
        streamsForGrade.forEach(s => validStreamsSet.add(s));
      }
    });

    const rawLoadedStreams = staff.assignedStreams || [];
    const sanitizedStreams = rawLoadedStreams.filter(strm => {
      // If validStreamsSet is populated, only keep streams that belong to the grade. If empty, keep non-legacy.
      if (validStreamsSet.size > 0) {
        return validStreamsSet.has(strm);
      }
      return strm && strm !== 'Mercury';
    });

    setAssignedStreams(sanitizedStreams);
    setHomeroomGrade(staff.homeroomGrade || loadedClasses[0] || 'Grade 7');
    setHomeroomStream(staff.homeroomStream && staff.homeroomStream !== 'Mercury' ? staff.homeroomStream : (sanitizedStreams[0] || ''));
    
    let loadedAllocs: StaffAllocationRecord[] = [];
    if (Array.isArray(staff.allocations) && staff.allocations.length > 0) {
      loadedAllocs = staff.allocations.map(a => ({
        subject: a.subject,
        grade: a.grade || loadedClasses[0] || 'Grade 7',
        stream: a.stream && a.stream !== 'Mercury' ? a.stream : (sanitizedStreams[0] || '')
      }));
    } else {
      // Build default allocations if none existed
      loadedSubs.forEach(sub => {
        loadedAllocs.push({
          subject: sub,
          grade: loadedClasses[0] || 'Grade 4',
          stream: sanitizedStreams[0] || ''
        });
      });
    }
    setAllocations(loadedAllocs);
    setActiveSubjectForAllocation(loadedSubs[0] || null);
    setIsModalOpen(true);
  };

  const handleToggleSubject = (subjectName: string) => {
    if (selectedSubjects.includes(subjectName)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subjectName));
    } else {
      setSelectedSubjects([...selectedSubjects, subjectName]);
    }
  };

  const handleToggleClass = (className: string) => {
    if (assignedClasses.includes(className)) {
      setAssignedClasses(assignedClasses.filter(c => c !== className));
    } else {
      setAssignedClasses([...assignedClasses, className]);
    }
  };

  const handleToggleStream = (streamName: string) => {
    if (assignedStreams.includes(streamName)) {
      setAssignedStreams(assignedStreams.filter(s => s !== streamName));
    } else {
      setAssignedStreams([...assignedStreams, streamName]);
    }
  };

  function generateRandomCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `MUN-${code}`;
  }

  const handleDeleteStaff = (id: string) => {
    if (window.confirm("PERMANENT ACTION: Are you sure you want to permanently delete this record? This cannot be undone.")) {
      const existing = JSON.parse(localStorage.getItem('munyaka_master_staff_list') || localStorage.getItem('munyaka_staff') || '[]');
      const filtered = existing.filter((item: any) => item.id !== id && item.tscNumber !== id && item.tscNo !== id && item.accessCode !== id);
      localStorage.setItem('munyaka_master_staff_list', JSON.stringify(filtered));
      localStorage.setItem('munyaka_staff_directory', JSON.stringify(filtered));
      localStorage.setItem('munyaka_staff', JSON.stringify(filtered));
      localStorage.setItem('munyaka_staff_db', JSON.stringify(filtered));

      window.dispatchEvent(new Event('munyaka_data_changed'));
      window.dispatchEvent(new Event('central_db_updated'));
      window.dispatchEvent(new Event('staff-changed'));
      
      const updated = staffList.filter((item: any) => item.id !== id && item.tscNumber !== id && item.tscNo !== id && item.accessCode !== id);
      setStaffList(updated);
      toast.success("Staff member permanently deleted");
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

    const formattedName = fullName.trim().toUpperCase();
    const cleanEmailInput = (email || `${formattedName.toLowerCase().replace(/\s+/g, '')}@munyaka.sc.ke`).trim().toLowerCase();
    const finalCode = (accessCode || generateRandomCode()).trim().replace(/\s+/g, '').toUpperCase();
    
    // SAFE CLEAN IMPLEMENTATION FOR UNASSIGNED CLASSES:
    // Read class values directly from form state:
    // - If assignedClass is empty, set it strictly to 'Unassigned'.
    // - If assignedClasses is empty or empty array, set it strictly to ['Unassigned'].
    const isTeachingRole = isTeachingStaff(category, category);
    const isSupportRole = isSupportStaff(category, category);
    const finalAssignedClasses = isTeachingRole && assignedClasses && assignedClasses.length > 0 ? assignedClasses : ['Unassigned'];
    const finalAssignedStreams = isTeachingRole && assignedStreams && assignedStreams.length > 0 ? assignedStreams : ['Unassigned'];
    const finalHomeroomGrade = isTeachingRole && homeroomGrade && homeroomGrade.trim() !== '' ? homeroomGrade : 'Unassigned';
    const finalHomeroomStream = isTeachingRole && homeroomStream && homeroomStream.trim() !== '' ? homeroomStream : 'Unassigned';

    const newStaff = {
      id: editingStaff ? editingStaff.id : `STF-${Date.now()}`,
      name: formattedName,
      category: category || (isTeachingRole ? 'Teacher' : 'Support Staff'),
      designation: category || (isTeachingRole ? 'Class Teacher' : 'Support Staff'),
      specificRole: category || (isTeachingRole ? 'Class Teacher' : 'Support Staff'),
      email: cleanEmailInput,
      phone: phone.trim() || '',
      tscNumber: tscNumber.trim() || '',
      status: status || 'Active',
      accessCode: finalCode,
      role: category || (isTeachingRole ? 'Teacher' : 'Support Staff'),
      type: isTeachingRole ? 'teaching' : 'support',
      subjects: isTeachingRole ? selectedSubjects : ['Mathematics', 'English'],
      assignedClasses: finalAssignedClasses,
      assignedStreams: finalAssignedStreams,
      homeroomGrade: finalHomeroomGrade,
      homeroomStream: finalHomeroomStream,
      assignedClass: finalAssignedClasses[0] || 'Unassigned',
      createdAt: editingStaff ? editingStaff.createdAt : new Date().toISOString()
    };

    const existingStaff = JSON.parse(localStorage.getItem('munyaka_master_staff_list') || localStorage.getItem('munyaka_staff') || '[]');
    
    // Deduplicate by email or ID before pushing
    const isDuplicate = existingStaff.some((s: any) =>
      s.email?.toLowerCase() === newStaff.email?.toLowerCase() || (editingStaff && s.id === editingStaff.id)
    );

    let updatedList;
    if (editingStaff) {
      updatedList = existingStaff.map((s: any) =>
        s.id === editingStaff.id || s.email?.toLowerCase() === newStaff.email?.toLowerCase() ? { ...s, ...newStaff } : s
      );
      toast.success("Staff profile updated successfully");
    } else if (isDuplicate) {
      updatedList = existingStaff.map((s: any) =>
        s.email?.toLowerCase() === newStaff.email?.toLowerCase() ? { ...s, ...newStaff } : s
      );
      toast.success("Staff member updated successfully");
    } else {
      updatedList = [...existingStaff, newStaff];
      toast.success("Staff member registered successfully");
    }

    // Save updated array to all target master keys
    localStorage.setItem('munyaka_master_staff_list', JSON.stringify(updatedList));
    localStorage.setItem('munyaka_staff_directory', JSON.stringify(updatedList));
    localStorage.setItem('munyaka_staff', JSON.stringify(updatedList));
    localStorage.setItem('munyaka_staff_db', JSON.stringify(updatedList));

    window.dispatchEvent(new Event('munyaka_data_changed'));
    window.dispatchEvent(new Event('central_db_updated'));

    setStaffList(updatedList);

    // Dispatch window event so Central Data and Dashboard re-count immediately
    window.dispatchEvent(new Event('munyaka_data_changed'));
    window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key: 'munyaka_master_staff_list' } }));
    window.dispatchEvent(new Event('staff-changed'));

    console.log('--- NEW STAFF SUCCESSFULLY SAVED ---', newStaff);

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
                <th className="py-3.5 px-3 min-w-[180px]">EMAIL</th>
                <th className="py-3.5 px-3 min-w-[150px]">PHONE NUMBER</th>
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
                  <td colSpan={9} className="py-12 text-center text-slate-400">
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
                            {(staff.name || 'S').trim().charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block text-sm group-hover:text-indigo-600 transition-colors">
                              {staff.name ? staff.name.toUpperCase() : ''}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                (staff.role || '').toLowerCase().includes('bursar') ||
                                (staff.role || '').toLowerCase().includes('cook') ||
                                (staff.role || '').toLowerCase().includes('security') ||
                                (staff.role || '').toLowerCase().includes('master')
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : (staff.role || '').toLowerCase().includes('ict')
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : (staff.role || '').toLowerCase().includes('library')
                                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {staff.role || staff.designation || 'Unassigned'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="text-xs text-slate-700 block flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" /> {staff.email}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="text-xs text-slate-600 block flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {staff.phone}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100/70 border border-slate-200/50 px-2 py-1 rounded">
                          {staff.tscNumber || 'N/A'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        {categoryIsTeaching(staff.category) && staff.subjects && staff.subjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[280px]">
                            {staff.subjects.map((sub, sIdx) => {
                              const subName = typeof sub === 'string'
                                ? sub
                                : (sub && typeof sub === 'object'
                                    ? String((sub as any).name || (sub as any).title || (sub as any).subject || (sub as any).learningArea || JSON.stringify(sub))
                                    : String(sub));
                              return (
                                <span key={sIdx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  {subName}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        {staff.category === 'Class Teacher' && (staff.homeroomGrade || staff.homeroomStream) ? (
                          <div className="flex items-center gap-1.5">
                            {(() => {
                              const hasValidGrade = staff.homeroomGrade && staff.homeroomGrade !== 'Unassigned';
                              const hasValidStream = staff.homeroomStream && staff.homeroomStream !== 'Unassigned';
                              if (hasValidGrade || hasValidStream) {
                                return (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                                    {hasValidGrade ? staff.homeroomGrade : ''} {hasValidStream ? staff.homeroomStream : ''}
                                  </span>
                                );
                              }
                              return (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  Unassigned
                                </span>
                              );
                            })()}
                          </div>
                        ) : categoryIsTeaching(staff.category) && ((staff.assignedClasses && staff.assignedClasses.length > 0 && staff.assignedClasses[0] !== 'Unassigned') || (staff.assignedStreams && staff.assignedStreams.length > 0 && staff.assignedStreams[0] !== 'Unassigned') || (staff.subjects && staff.subjects.length > 0)) ? (
                          <div className="flex flex-col gap-1.5 max-w-[220px]">
                            {staff.assignedClasses && staff.assignedClasses.length > 0 && staff.assignedClasses[0] !== 'Unassigned' && (
                              <div className="flex flex-wrap gap-1">
                                {staff.assignedClasses.slice(0, 3).map((cls, cIdx) => {
                                  let formattedCls = '';
                                  if (typeof cls === 'string') {
                                    formattedCls = cls;
                                  } else if (cls && typeof cls === 'object') {
                                    const item = cls as any;
                                    formattedCls = typeof item === 'object' ? `${item.subject || ''} (${item.grade || ''}${item.stream || ''})`.trim() : String(item);
                                    if (!formattedCls) formattedCls = JSON.stringify(item);
                                  } else {
                                    formattedCls = String(cls);
                                  }
                                  return (
                                    <span key={cIdx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                      {formattedCls}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            {staff.assignedStreams && staff.assignedStreams.length > 0 && staff.assignedStreams[0] !== 'Unassigned' && (
                              <div className="flex flex-wrap gap-1">
                                {staff.assignedStreams.slice(0, 3).map((strm, sIdx) => {
                                  let formattedStrm = '';
                                  if (typeof strm === 'string') {
                                    formattedStrm = strm;
                                  } else if (strm && typeof strm === 'object') {
                                    const item = strm as any;
                                    formattedStrm = typeof item === 'object' ? `${item.subject || ''} (${item.grade || ''}${item.stream || ''})`.trim() : String(item);
                                    if (!formattedStrm) formattedStrm = JSON.stringify(item);
                                  } else {
                                    formattedStrm = String(strm);
                                  }
                                  return (
                                    <span key={sIdx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                      {formattedStrm}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Unassigned
                          </span>
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

                {/* Conditional Homeroom Grade & Stream Selector for Class Teacher */}
                {category === 'Class Teacher' && (
                  <div className="sm:col-span-2 bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/60 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-900 font-semibold text-sm">
                      <span className="text-base">🎓</span> Assigned Homeroom Grade & Stream
                    </div>

                    {/* Grade Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-emerald-800 mb-1">
                        Grade
                      </label>
                      <select
                        value={homeroomGrade || ''}
                        onChange={(e) => handleHomeroomGradeChange(e.target.value)}
                        className="w-full p-2.5 bg-white border border-emerald-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">-- Select Grade --</option>
                        {availableGrades.map((g: string) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    {/* Stream Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-emerald-800 mb-1">
                        Stream
                      </label>
                      <select
                        value={homeroomStream || ''}
                        onChange={(e) => setHomeroomStream(e.target.value)}
                        className="w-full p-2.5 bg-white border border-emerald-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                        disabled={!homeroomGrade}
                      >
                        <option value="">-- Select Stream --</option>
                        {activeStreams.map((s: string) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

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
                  <div className="flex rounded-xl shadow-sm border border-slate-200 overflow-hidden bg-white">
                    <input
                      type="text"
                      placeholder="e.g. jndiki"
                      value={email.includes('@') ? email.split('@')[0] : email}
                      onChange={(e) => {
                        const rawVal = e.target.value.trim().split('@')[0];
                        const fullEmail = rawVal ? `${rawVal}@munyaka.sc.ke` : '';
                        setEmail(fullEmail);
                      }}
                      className="flex-1 p-2.5 border-0 focus:ring-0 focus:outline-none text-sm text-slate-700 bg-transparent"
                    />
                    <span className="inline-flex items-center px-3 bg-slate-50 text-slate-500 text-xs font-medium border-l border-slate-200">
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

              {/* Class & Stream Assignments Grid FIRST (so grades/streams are chosen before subjects) */}
              {category !== 'Bursar' && category !== 'Store Master' && (
                <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-500" /> Assigned Grades & Streams
                    </h4>
                    <span className="text-xs text-slate-500 font-medium bg-white px-2 py-1 rounded-full border border-slate-100">
                      {assignedClasses.length} class(es), {assignedStreams.length} stream(s) selected
                    </span>
                  </div>
                  
                  {/* Classes/Grades selection */}
                  <div>
                    <span className="text-xs font-semibold text-slate-500 block mb-2">Select Grades / Classes <span className="text-rose-500">*</span></span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                      {availableSchoolClasses.map((cls) => {
                        const isSelected = assignedClasses.includes(cls);
                        return (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => handleToggleClass(cls)}
                            className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs font-medium transition-all duration-200 border ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm shadow-emerald-100/50'
                                : 'bg-white border-slate-150 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                              isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="truncate">{cls}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Streams selection */}
                  <div className="border-t border-slate-100 pt-3">
                    <span className="text-xs font-semibold text-slate-500 block mb-2">Select Streams <span className="text-rose-500">*</span></span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1">
                      {availableSchoolStreams.map((strm) => {
                        const isSelected = assignedStreams.includes(strm);
                        return (
                          <button
                            key={strm}
                            type="button"
                            onClick={() => handleToggleStream(strm)}
                            className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs font-medium transition-all duration-200 border ${
                              isSelected
                                ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm shadow-amber-100/50'
                                : 'bg-white border-slate-150 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                              isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="truncate">{strm}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Subjects & Learning Area Competencies (Dynamically mapped and bound to selected Grade and Stream) */}
              {category !== 'Bursar' && category !== 'Store Master' && (
                <div className="space-y-3 bg-indigo-50/30 p-4 rounded-xl border border-indigo-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-500" /> Subject & Learning Area Competencies (Grade & Stream Bound)
                      </h4>
                      <p className="text-[11px] text-indigo-600 font-medium mt-0.5">
                        {assignedClasses.length > 0 && assignedStreams.length > 0
                          ? `Allocations bound to: ${assignedClasses.join(', ')} [${assignedStreams.join(', ')}]`
                          : 'Select at least one Grade and Stream above to bind subject allocations.'}
                      </p>
                    </div>
                    <span className="text-xs text-indigo-700 font-bold bg-indigo-100 px-2 py-1 rounded-full border border-indigo-200">
                      {selectedSubjects.length} selected
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1 custom-scrollbar">
                    {filteredLearningAreasForClasses.map((sub) => {
                      const isSelected = selectedSubjects.includes(sub);
                      const primaryGrade = assignedClasses[0] || homeroomGrade || 'Grade 7';
                      const primaryStream = assignedStreams[0] || homeroomStream || availableSchoolStreams[0] || 'Mercury';
                      return (
                        <div
                          key={sub}
                          onClick={() => handleToggleSubject(sub)}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs font-medium transition-all duration-200 border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                              isSelected ? 'bg-white border-white text-indigo-600' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="truncate font-semibold">{sub}</span>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-700/80 text-indigo-100 border border-indigo-500/50 whitespace-nowrap">
                              {primaryGrade} {assignedStreams.length > 0 ? assignedStreams.join(', ') : ''}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
