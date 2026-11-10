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
  Download,
  AlertCircle,
  Fingerprint,
  Sparkles,
  Copy,
  Database,
  Key,
  Lock,
  Unlock,
  RotateCcw,
  UserX,
  Eye,
  EyeOff,
  Shield,
  Bell,
  BellOff,
  MoreVertical,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MOCK_STAFF } from '../lib/mock-data';
import { addPendingSyncItem } from '@/utils/storage';
import { useGradesAndStreams } from '../hooks/useGradesStreams';
import { mapRoleLabelToRbacKey } from '../constants/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const defaultCbcLearningAreas: any[] = [];

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
  title: string;
  rbacRole: string;
  tscNumber?: string;
  nationalId?: string;
  email: string;
  phone: string;
  subjects: string[];
  assignedClasses?: string[];
  assignedStreams?: string[];
  homeroomGrade?: string;
  homeroomStream?: string;
  allocations?: StaffAllocationRecord[];
  accessCode: string;
  teacherCode?: string;
  code?: string;
  tempAccessCode?: string;
  fullName?: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  createdAt?: string;
  // New authentication fields
  password?: string;
  lastPasswordChange?: string;
  loginEnabled?: boolean;
}

// Normalization helper to keep original access codes intact
const harmonizeStaffCodes = (staffList: any[]) => {
  return staffList.map((staff) => {
    const code = staff.accessCode || staff.code || staff.teacherCode || staff.tempAccessCode || staff.id || `MUN-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      ...staff,
      accessCode: code,
      code: code,
      teacherCode: code
    };
  });
};

// Password hashing utility (client-side SHA-256)
const hashPassword = async (plain: string): Promise<string> => {
  const encoded = new TextEncoder().encode(String(plain || '').trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const generateRandomCode = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MUN-${code}`;
};

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export default function StaffRegistry() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [showPassword, setShowPassword] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [category, setCategory] = useState<StaffCategoryRole>('Class Teacher');
  const [tscNumber, setTscNumber] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'Active' | 'On Leave' | 'Inactive'>('Active');
  const [accessCode, setAccessCode] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [assignedStreams, setAssignedStreams] = useState<string[]>([]);
  const [homeroomGrade, setHomeroomGrade] = useState('Grade 7');
  const [homeroomStream, setHomeroomStream] = useState('');
  const [allocations, setAllocations] = useState<StaffAllocationRecord[]>([]);
  const [activeSubjectForAllocation, setActiveSubjectForAllocation] = useState<string | null>(null);

  // Grades and streams configuration hook
  const { grades: availableSchoolClasses, getStreamsForGrade, streams: allGlobalStreams } = useGradesAndStreams();

  // Get relevant streams based on selected grades
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

  // Generator for Password
  const generateSecurePassword = () => {
    const newPass = generateRandomPassword();
    setPassword(newPass);
    toast.success(`Generated password: ${newPass}`);
  };

  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('munyaka_staff') || localStorage.getItem('munyaka_staff_v2');
    let loadedStaff: any[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          loadedStaff = parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    // Sanitize and deduplicate loaded list or return empty array if none
    const seenIds = new Set<string>();
    const sanitized: StaffMember[] = loadedStaff
      .filter((staff: any) => {
        const sid = String(staff?.id || staff?.staffId || staff?.staff_id || staff?.accessCode || staff?.code || '');
        return Boolean(sid);
      })
      .map((staff) => {
        let id = String(staff.id || staff.staffId || staff.staff_id || staff.accessCode || staff.code || '');
        if (!id.startsWith('MUN-')) {
          id = `MUN-${Math.floor(1000 + Math.random() * 9000)}`;
        }
        if (seenIds.has(id)) {
          id = `MUN-${Math.floor(1000 + Math.random() * 9000)}`;
        }
        seenIds.add(id);

        let cat: StaffCategoryRole = staff.category;
        if (cat === ('Teaching Staff' as any)) cat = 'Subject Teacher';
        else if (cat === ('Administration' as any)) cat = 'HOI';
        else if (cat === ('Support Staff' as any)) cat = 'Store Master';
        else if (!cat) cat = 'Class Teacher';

        const rawClasses = staff.assignedClasses || staff.classes || [];
        const cleanClasses = Array.isArray(rawClasses)
          ? rawClasses.map((c: any) => {
            if (!c) return '';
            if (typeof c === 'string') return c;
            if (typeof c === 'object') {
              return String(c.grade || c.name || c.className || `${c.subject || ''} ${c.grade || ''}${c.stream || ''}`.trim() || JSON.stringify(c));
            }
            return String(c);
          }).filter(Boolean)
        : [];

        const rawStreams = staff.assignedStreams || staff.streams || [];
        const cleanStreams = Array.isArray(rawStreams)
          ? rawStreams.map((s: any) => {
              if (!s) return '';
              if (typeof s === 'string') return s;
              if (typeof s === 'object') {
                return String(s.stream || s.name || `${s.grade || ''} ${s.stream || ''}`.trim() || JSON.stringify(s));
              }
              return String(s);
            }).filter(s => s && s !== 'Mercury')
          : [];

        const rawSubjects = staff.subjects || staff.assignedSubjects || [];
        const cleanSubjects = Array.isArray(rawSubjects)
          ? rawSubjects.map((sub: any) => {
              if (!sub) return '';
              if (typeof sub === 'string') return sub;
              if (typeof sub === 'object') {
                return String(sub.name || sub.title || sub.subject || sub.learningArea || JSON.stringify(sub));
              }
              return String(sub);
            }).filter(Boolean)
          : [];

        const defaultGrade = cleanClasses[0] || 'Grade 7';
        const defaultStream = cleanStreams[0] || '';

        const cleanAllocations = Array.isArray(staff.allocations)
          ? staff.allocations
              .filter((a: any) => a && typeof a === 'object' && a.subject)
              .map((a: any) => ({
                subject: String(a.subject),
                grade: String(a.grade || defaultGrade),
                stream: a.stream && a.stream !== 'Mercury' ? String(a.stream) : defaultStream
              }))
          : cleanSubjects.map((sub: string) => ({
              subject: sub,
              grade: defaultGrade,
              stream: defaultStream
            }));

        let code = staff.accessCode || staff.code;
        if (!code || !code.startsWith('MUN-')) {
          const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
          let randomPart = '';
          for (let i = 0; i < 4; i++) {
            randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          code = `MUN-${randomPart}`;
        }

        return {
          id,
          name: staff.name || 'Unnamed Staff',
          category: cat,
          title: staff.title || cat,
          rbacRole: staff.rbacRole || mapRoleLabelToRbacKey(cat),
          tscNumber: staff.tscNumber || (cat !== 'Bursar' && cat !== 'Store Master' ? '327775' : undefined),
          nationalId: staff.nationalId || (cat === 'Bursar' || cat === 'Store Master' ? '31452981' : undefined),
          email: staff.email || `${(staff.name || 'staff').toLowerCase().replace(/\s+/g, '.')}@munyaka.sc.ke`,
          phone: staff.phone || '+254 712 345 678',
          subjects: cleanSubjects,
          assignedClasses: cleanClasses,
          assignedStreams: cleanStreams,
          homeroomGrade: staff.homeroomGrade || defaultGrade,
          homeroomStream: staff.homeroomStream && staff.homeroomStream !== 'Mercury' ? staff.homeroomStream : defaultStream,
          allocations: cleanAllocations,
          accessCode: code,
          status: staff.status || 'Active',
          createdAt: staff.createdAt || new Date().toISOString(),
          // New auth fields with defaults
          password: staff.password || undefined,
          lastPasswordChange: staff.lastPasswordChange || undefined,
          loginEnabled: staff.loginEnabled !== false // default true
        };
      });

    return harmonizeStaffCodes(sanitized);
  });

  useEffect(() => {
    localStorage.setItem('munyaka_staff', JSON.stringify(staffList));
    // Also sync to staff_master for authentication
    localStorage.setItem('munyaka_staff_db', JSON.stringify(staffList));
    localStorage.setItem('munyaka_staff_directory', JSON.stringify(staffList));
  }, [staffList]);

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setFullName('');
    setCategory('Class Teacher');
    setTscNumber('');
    setNationalId('');
    setEmail('');
    setPhone('');
    setStatus('Active');
    setSelectedSubjects([]);
    setAssignedClasses([]);
    setAssignedStreams([]);
    setHomeroomGrade('Grade 7');
    setHomeroomStream('');
    setAllocations([]);
    setActiveSubjectForAllocation(null);
    generateSecureCode();
    setPassword(generateRandomPassword());
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFullName(staff.name);
    setCategory(staff.category);
    setTscNumber(staff.tscNumber || '');
    setNationalId(staff.nationalId || '');
    // Strip @munyaka.sc.ke or @school.ac.ke domain if present for username-only input
    let rawEmail = staff.email || '';
    if (rawEmail.includes('@')) {
      rawEmail = rawEmail.split('@')[0];
    }
    setEmail(rawEmail);
    setPhone(staff.phone);
    setStatus(staff.status);
    setAccessCode(staff.accessCode || generateRandomCode());
    setPassword(staff.password || '••••••••'); // masked
    
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

  const handleDeleteStaff = (id: string) => {
    if (confirm("Are you sure you want to remove this staff member from the system? This action cannot be undone and will permanently revoke their login access.")) {
      const keysToClean = ['munyaka_staff', 'munyaka_staff_directory', 'munyaka_user_accounts', 'munyaka_users', 'munyaka_staff_registry', 'munyaka_staff_db'];
      keysToClean.forEach(key => {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter((s: any) =>
                s && String(s.id || s.staffId || s.staff_id) !== String(id) &&
                String(s.email || '').trim().toLowerCase() !== String(id).trim().toLowerCase() &&
                String(s.username || '').trim().toLowerCase() !== String(id).trim().toLowerCase()
              );
              localStorage.setItem(key, JSON.stringify(filtered));
            }
          }
        } catch (e) {
          console.warn(`Error cleaning ${key}:`, e);
        }
      });

      const existing = JSON.parse(localStorage.getItem('munyaka_staff_directory') || localStorage.getItem('munyaka_staff') || '[]');
      const updated = existing.filter((s: any) =>
        s && String(s.id || s.staffId || s.staff_id) !== String(id) &&
        String(s.email || '').trim().toLowerCase() !== String(id).trim().toLowerCase() &&
        String(s.username || '').trim().toLowerCase() !== String(id).trim().toLowerCase()
      );
      setStaffList(updated);
      toast.success("Staff member removed successfully. Login access revoked.");

      addPendingSyncItem({
        id,
        type: 'staff',
        action: 'delete',
        payload: { id },
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Access code ${code} copied to clipboard!`);
  };

  const handleCopyPassword = (staff: StaffMember) => {
    if (staff.password && staff.password !== '••••••••') {
      navigator.clipboard.writeText(staff.password);
      toast.success('Password copied to clipboard!');
    }
  };

  const handleResetPassword = async (staff: StaffMember) => {
    const newPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(newPassword);
    
    const updatedList = staffList.map(s => 
      s.id === staff.id 
        ? { 
            ...s, 
            password: newPassword, // Store plain for display, but we also store hash
            passwordHash: hashedPassword,
            lastPasswordChange: new Date().toISOString(),
            loginEnabled: true
          } 
        : s
    );
    
    setStaffList(updatedList);
    toast.success(`Password reset for ${staff.name}. New password: ${newPassword}`);
    
    // Also update the session if this staff is currently logged in
    const currentSession = localStorage.getItem('munyaka_session');
    if (currentSession) {
      try {
        const session = JSON.parse(currentSession);
        if (session.email === staff.email || session.id === staff.id) {
          // Force re-login on next access
          localStorage.removeItem('munyaka_session');
          localStorage.removeItem('munyaka_current_user');
        }
      } catch {}
    }
  };

  const handleToggleLoginAccess = (staff: StaffMember) => {
    const newLoginEnabled = !staff.loginEnabled;
    const updatedList = staffList.map(s => 
      s.id === staff.id ? { ...s, loginEnabled: newLoginEnabled } : s
    );
    setStaffList(updatedList);
    
    if (!newLoginEnabled) {
      // Immediately revoke active session
      const currentSession = localStorage.getItem('munyaka_session');
      if (currentSession) {
        try {
          const session = JSON.parse(currentSession);
          if (session.email === staff.email || session.id === staff.id) {
            localStorage.removeItem('munyaka_session');
            localStorage.removeItem('munyaka_current_user');
            localStorage.removeItem('munyaka_auth_user');
          }
        } catch {}
      }
      toast.success(`Login access disabled for ${staff.name}. Active session revoked.`);
    } else {
      toast.success(`Login access enabled for ${staff.name}.`);
    }
  };

  const handleUpdateEmail = (staff: StaffMember, newEmail: string) => {
    const fullEmail = newEmail.includes('@') ? newEmail : `${newEmail}@munyaka.sc.ke`;
    const updatedList = staffList.map(s => 
      s.id === staff.id ? { ...s, email: fullEmail } : s
    );
    setStaffList(updatedList);
    toast.success(`Email updated for ${staff.name} to ${fullEmail}`);
  };

  const handleExportCSV = () => {
    if (!filteredStaff || filteredStaff.length === 0) {
      alert("No staff records available to export.");
      return;
    }

    const headers = ["Full Name", "TSC Number", "Email", "Role", "Phone Number", "Status", "Access Code", "Login Enabled"];
    
    const rows = filteredStaff.map(member => [
      `"${member.name || ''}"`,
      `"${member.tscNumber || member.nationalId || 'Pending Verification'}"`,
      `"${member.email || ''}"`,
      `"${member.category || 'Teacher'}"`,
      `"${member.phone || ''}"`,
      `"${member.status || 'Active'}"`,
      `"${member.accessCode || ''}"`,
      `"${member.loginEnabled !== false ? 'Yes' : 'No'}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Munyaka_Staff_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    
    const assignedRole = category;
    const TEACHING_ROLES = [
      'class_teacher',
      'subject_teacher',
      'ict_teacher',
      'lab_teacher',
      'library_teacher',
      'tools_inventory_teacher',
      'hoi',
      'dhoi',
      'admin',
      'head_teacher',
      'senior_teacher',
      'class teacher',
      'subject teacher',
      'ict teacher',
      'lab teacher',
      'library teacher'
    ];
    const isTeachingStaff = TEACHING_ROLES.includes(assignedRole) ||
                            TEACHING_ROLES.includes(category.toLowerCase()) ||
                            category.toLowerCase().includes('teacher') ||
                            category === 'HOI' || category === 'DHOI';

    if (isTeachingStaff && !tscNumber.trim()) {
      toast.error("Official TSC Number is required for teaching staff");
      return;
    }
    if (!isTeachingStaff && !nationalId.trim()) {
      toast.error("Kenyan National ID number is required for support/non-teaching staff");
      return;
    }

    const fullEmail = email.trim()
      ? (email.includes('@') ? email.trim() : `${email.trim()}@munyaka.sc.ke`)
      : `${fullName.toLowerCase().replace(/\s+/g, '.')}@munyaka.sc.ke`;

    const generatedMunId = accessCode;
    const rbacRoleKey = mapRoleLabelToRbacKey(category);
    const title = category;
    
    // Hash password for storage
    const passwordHash = await hashPassword(password);
    
    const staffRecord: StaffMember = {
      id: editingStaff ? editingStaff.id : generatedMunId,
      accessCode: accessCode,
      teacherCode: accessCode,
      code: accessCode,
      name: fullName.trim(),
      fullName: fullName.trim(),
      category,
      title,
      rbacRole: rbacRoleKey,
      email: fullEmail,
      phone: phone.trim() || '+254 712 345 678',
      tscNumber: isTeachingStaff ? tscNumber.trim() : undefined,
      nationalId: !isTeachingStaff ? nationalId.trim() : undefined,
      status,
      subjects: isTeachingStaff ? selectedSubjects : [],
      assignedClasses: isTeachingStaff ? assignedClasses : [],
      assignedStreams: isTeachingStaff ? assignedStreams : [],
      homeroomGrade: category === 'Class Teacher' ? homeroomGrade : undefined,
      homeroomStream: category === 'Class Teacher' ? homeroomStream : undefined,
      createdAt: editingStaff ? editingStaff.createdAt : new Date().toISOString(),
      // Auth fields
      password: password, // Store plain for admin visibility (in production, only hash)
      passwordHash: passwordHash,
      lastPasswordChange: new Date().toISOString(),
      loginEnabled: status === 'Active'
    };

    let updatedList: StaffMember[];
    if (editingStaff) {
      updatedList = staffList.map(s => s.id === editingStaff.id ? staffRecord : s);
      toast.success("Staff profile updated successfully");
    } else {
      updatedList = [staffRecord, ...staffList];
      toast.success("Staff member registered successfully with auto-generated auth profile");
    }

    // No separate user accounts table - staff IS the user account
    // The staff record itself contains all authentication data

    saveStaffToStorage(updatedList);

    addPendingSyncItem({
      id: staffRecord.id,
      type: 'staff',
      action: editingStaff ? 'update' : 'create',
      payload: staffRecord,
    });

    setIsModalOpen(false);
  };

  // Synchronized horizontal scrollbars
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  // Save helper function whenever list changes or new staff is added
  const saveStaffToStorage = (newList: StaffMember[]) => {
    setStaffList(newList);
    localStorage.setItem('munyaka_staff', JSON.stringify(newList));
    localStorage.setItem('munyaka_staff_v2', JSON.stringify(newList));
    localStorage.setItem('munyaka_staff_directory', JSON.stringify(newList));
    localStorage.setItem('munyaka_staff_db', JSON.stringify(newList));
  };

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
  
  // Non-teaching roles that should NOT see assigned grades/streams
  const nonTeachingRoles = ['bursar', 'store_master', 'support_staff', 'accountant', 'sec_admin'];
  
  // Refined condition to determine if staff member is teaching staff
  const isTeachingStaff = (staff: StaffMember) => {
    const category = String(staff.category || '').toLowerCase().trim();
    const rbacRole = String(staff.rbacRole || '').toLowerCase().trim();
    
    const TEACHING_ROLES = [
      'class_teacher',
      'subject_teacher',
      'ict_teacher',
      'lab_teacher',
      'library_teacher',
      'tools_inventory_teacher',
      'hoi',
      'dhoi',
      'admin',
      'class teacher',
      'subject teacher',
      'ict teacher',
      'lab teacher',
      'library teacher'
    ];

    const assignedRole = rbacRole || category;
    const isTeaching = TEACHING_ROLES.includes(assignedRole) ||
                       category.includes('teacher') ||
                       rbacRole.includes('teacher') ||
                       category === 'hoi' || category === 'dhoi' ||
                       rbacRole === 'hoi' || rbacRole === 'dhoi';

    const nonTeachingRoles = ['bursar', 'store_master', 'support_staff', 'accountant', 'sec_admin', 'store master'];
    const isNonTeaching = nonTeachingRoles.includes(category) || nonTeachingRoles.includes(rbacRole);
    
    return isTeaching && !isNonTeaching;
  };
  
  const filteredLearningAreasForClasses = useMemo(() => {
    if (!assignedClasses || assignedClasses.length === 0) {
      return availableLearningAreas;
    }

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

    if (!hasPrePrimary && !hasLowerPrimary && !hasUpperPrimary && !hasJuniorSecondary) {
      return availableLearningAreas;
    }

    const filtered = availableLearningAreas.filter(area => {
      const lower = area.toLowerCase();

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

      if (hasUpperPrimary || hasJuniorSecondary) {
        return true;
      }

      return true;
    });

    return filtered.length > 0 ? filtered : availableLearningAreas;
  }, [assignedClasses, availableLearningAreas]);

  // Filters
  const filteredStaff = useMemo(() => {
    return staffList.filter(staff => {
      const matchesSearch = 
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.tscNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const formatRoleLabel = (roleKey: string) => {
    const norm = String(roleKey || '').toLowerCase().trim();
    if (norm === 'library_teacher' || norm === 'librarian') return 'Library Teacher';
    if (norm === 'ict_teacher' || norm === 'ict') return 'ICT Teacher';
    if (norm === 'class_teacher') return 'Class Teacher';
    if (norm === 'subject_teacher') return 'Subject Teacher';
    if (norm === 'dhoi') return 'Deputy Head of Institution';
    if (norm === 'hoi' || norm === 'head_teacher') return 'Head of Institution';
    if (norm === 'bursar' || norm === 'accountant') return 'Bursar';
    if (norm === 'store_master' || norm === 'storekeeper') return 'Store Master';
    if (norm === 'lab_teacher') return 'Lab Teacher';
    return roleKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Upper Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-150 shadow-sm shadow-slate-100/50">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" /> Staff & Teacher Registry
          </h2>
          <p className="text-slate-500 text-xs mt-1">Manage teaching assignments, access codes, passwords, TSC registration, and system roles.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-sm shadow-indigo-100 border border-indigo-700"
          >
            <Plus className="w-4.5 h-4.5" /> Register New Staff
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition-all duration-200 shadow-sm"
          >
            <Download className="w-4.5 h-4.5" /> Export Staff List
          </button>
        </div>
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
          <div className="h-2 min-w-[1300px]"></div>
        </div>

        <div 
          ref={bottomScrollRef}
          onScroll={handleBottomScroll}
          className="overflow-x-auto custom-scrollbar"
        >
          <table className="w-full text-left border-collapse min-w-[1300px]">
            <thead>
              <tr className="border-b border-slate-150 bg-slate-50/70 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4 min-w-[200px] whitespace-nowrap">STAFF MEMBER</th>
                <th className="py-3.5 px-3 min-w-[170px] whitespace-nowrap">ASSIGNED ROLE / RBAC</th>
                <th className="py-3.5 px-3 min-w-[180px] whitespace-nowrap">Contact Info</th>
                <th className="py-3.5 px-3 min-w-[120px] whitespace-nowrap">Official ID / TSC No.</th>
                <th className="py-3.5 px-3 min-w-[180px] whitespace-nowrap">Subjects</th>
                <th className="py-3.5 px-3 min-w-[180px] whitespace-nowrap">Assigned Classes</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Status</th>
                <th className="py-3.5 px-4 min-w-[130px] text-center whitespace-nowrap">Access Code</th>
                <th className="py-3.5 px-4 min-w-[130px] text-center whitespace-nowrap">Login Access</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
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
                  const loginEnabled = staff.loginEnabled !== false;

                  return (
                    <tr
                      key={staff.id || `staff-${idx}`}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors duration-150 group"
                    >
                      {/* Column 1: Staff Name & Avatar */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                            {staff.name ? staff.name.split(' ').pop()?.charAt(0) : 'S'}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block text-sm group-hover:text-indigo-600 transition-colors truncate" title={staff.name}>
                              {staff.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Dedicated Role Badge */}
                      <td className="py-3.5 px-3 max-w-[170px]">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {formatRoleLabel(staff.rbacRole || staff.category)}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 max-w-[180px]">
                        <div className="space-y-0.5">
                          <span className="text-xs text-slate-700 block flex items-center gap-1 truncate" title={`${staff.email} ${staff.phone}`}>
                            <Mail className="w-3 h-3 text-slate-400" /> {staff.email}
                          </span>
                          <span className="text-xs text-slate-500 block flex items-center gap-1 truncate" title={`${staff.email} ${staff.phone}`}>
                            <Phone className="w-3 h-3 text-slate-400" /> {staff.phone}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100/70 border border-slate-200/50 px-2 py-1 rounded">
                          {staff.tscNumber || staff.nationalId || 'N/A'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 max-w-[180px]">
                        {categoryIsTeaching(staff.category) && staff.subjects && staff.subjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[280px]">
                            {staff.subjects.map((sub, sIdx) => {
                              const subName = typeof sub === 'string'
                                ? sub
                                : (sub && typeof sub === 'object'
                                    ? String((sub as any).name || (sub as any).title || (sub as any).subject || (sub as any).learningArea || JSON.stringify(sub))
                                    : String(sub));
                              return (
                                <span key={sIdx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 break-words hyphens-auto" title={subName}>
                                  {subName}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 max-w-[180px]">
                        {staff.category === 'Class Teacher' && (staff.homeroomGrade || staff.homeroomStream) ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                              {typeof staff.homeroomGrade === 'string' ? staff.homeroomGrade : 'Grade 7'} {typeof staff.homeroomStream === 'string' ? staff.homeroomStream : ''}
                            </span>
                          </div>
                        ) : categoryIsTeaching(staff.category) && ((staff.assignedClasses && staff.assignedClasses.length > 0) || (staff.assignedStreams && staff.assignedStreams.length > 0) || (staff.subjects && staff.subjects.length > 0)) ? (
                          <div className="flex flex-col gap-1.5 max-w-[220px]">
                            {staff.assignedClasses && staff.assignedClasses.length > 0 && (
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
                                    <span key={cIdx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 break-words hyphens-auto" title={formattedCls}>
                                      {formattedCls}
                                    </span>
                                  );
                                })}
                                {staff.assignedClasses.length > 3 && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                    +{staff.assignedClasses.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                            {staff.assignedStreams && staff.assignedStreams.length > 0 && (
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
                                    <span key={sIdx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100 break-words hyphens-auto" title={formattedStrm}>
                                      {formattedStrm}
                                    </span>
                                  );
                                })}
                                {staff.assignedStreams.length > 3 && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                    +{staff.assignedStreams.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.bg}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                          {statusConfig.text}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-150 px-2 py-1 rounded-lg">
                          <span className="font-mono text-xs font-bold text-slate-800 tracking-wider">
                            {staff.accessCode || staff.teacherCode || staff.code || staff.tempAccessCode || staff.id || '—'}
                          </span>
                          {(staff.accessCode || staff.teacherCode || staff.code || staff.tempAccessCode) && (
                            <button
                              onClick={() => handleCopyCode(staff.accessCode || staff.teacherCode || staff.code || staff.tempAccessCode)}
                              className="p-1 hover:bg-white rounded hover:text-indigo-600 text-slate-400 border border-transparent hover:border-slate-200 transition-all"
                              title="Copy code to clipboard"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Column: Login Access Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${loginEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full bg-current mr-1.5 ${loginEnabled ? 'animate-pulse' : ''}`}></span>
                            {loginEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </td>

                      {/* Column: Actions with Dropdown Menu */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(staff)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg transition-all"
                            title="Edit profile"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          {/* Account Management Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-lg transition-all" title="Account actions">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem 
                                className="flex items-center gap-2 text-indigo-600"
                                onClick={() => {
                                  handleCopyCode(staff.accessCode || staff.teacherCode || staff.code || staff.tempAccessCode);
                                }}
                              >
                                <Key className="w-4 h-4" />
                                Copy Access Code
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="flex items-center gap-2"
                                onClick={() => {
                                  if (staff.password && staff.password !== '••••••••') {
                                    handleCopyPassword(staff);
                                  } else {
                                    toast.info('Password is masked. Reset to generate a new one.');
                                  }
                                }}
                              >
                                <Lock className="w-4 h-4" />
                                {staff.password && staff.password !== '••••••••' ? 'Copy Password' : 'Password Masked'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="flex items-center gap-2 text-amber-600"
                                onClick={() => handleResetPassword(staff)}
                              >
                                <RotateCcw className="w-4 h-4" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="flex items-center gap-2 text-blue-600"
                                onClick={() => {
                                  const newEmail = prompt('Enter new email (username only, @munyaka.sc.ke will be added):', staff.email.split('@')[0]);
                                  if (newEmail && newEmail.trim()) {
                                    handleUpdateEmail(staff, newEmail.trim());
                                  }
                                }}
                              >
                                <Mail className="w-4 h-4" />
                                Update Email
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="flex items-center gap-2"
                                onClick={() => handleToggleLoginAccess(staff)}
                              >
                                {loginEnabled ? (
                                  <>
                                    <BellOff className="w-4 h-4 text-rose-600" />
                                    Disable Login Access
                                  </>
                                ) : (
                                  <>
                                    <Bell className="w-4 h-4 text-emerald-600" />
                                    Enable Login Access
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="flex items-center gap-2 text-rose-600"
                                onClick={() => handleDeleteStaff(staff.id)}
                              >
                                <UserX className="w-4 h-4" />
                                Remove Staff & Revoke Access
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
          <div className="bg-white rounded-2xl shadow-xl border border-slate-150 w-full max-w-3xl overflow-hidden animate-slide-up my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  {editingStaff ? "Edit Staff Profile" : "Register New Staff Member"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Fill in details below to manage system permissions, assignments, and login credentials.</p>
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
                  <div className="sm:col-span-2 p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      <div>
                        <h4 className="text-xs font-bold text-emerald-900">Assigned Homeroom Grade & Stream</h4>
                        <p className="text-[11px] text-emerald-700">Select the primary homeroom class supervised by this Class Teacher.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-emerald-800 block mb-1">Homeroom Grade</label>
                        <select
                          value={homeroomGrade}
                          onChange={(e) => setHomeroomGrade(e.target.value)}
                          className="w-full bg-white border border-emerald-300 rounded-xl py-2 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                        >
                          {availableSchoolClasses.map((cls) => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-emerald-800 block mb-1">Homeroom Stream</label>
                        <select
                          value={homeroomStream}
                          onChange={(e) => setHomeroomStream(e.target.value)}
                          className="w-full bg-white border border-emerald-300 rounded-xl py-2 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                        >
                          {availableSchoolStreams.map((strm) => (
                            <option key={strm} value={strm}>{strm}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                    {(() => {
                      const assignedRole = mapRoleLabelToRbacKey(category) || category.toLowerCase();
                      const TEACHING_ROLES = [
                        'class_teacher',
                        'subject_teacher',
                        'ict_teacher',
                        'lab_teacher',
                        'library_teacher',
                        'tools_inventory_teacher',
                        'hoi',
                        'dhoi',
                        'admin',
                        'head_teacher',
                        'senior_teacher'
                      ];
                      const isTeachingStaffRole = TEACHING_ROLES.includes(assignedRole) ||
                                                  TEACHING_ROLES.includes(category.toLowerCase()) ||
                                                  category.toLowerCase().includes('teacher') ||
                                                  category === 'HOI' || category === 'DHOI';
                      return isTeachingStaffRole ? 'Official TSC Number *' : 'Kenyan National ID Number *';
                    })()}
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder={(() => {
                        const assignedRole = mapRoleLabelToRbacKey(category) || category.toLowerCase();
                        const TEACHING_ROLES = [
                          'class_teacher',
                          'subject_teacher',
                          'ict_teacher',
                          'lab_teacher',
                          'library_teacher',
                          'tools_inventory_teacher',
                          'hoi',
                          'dhoi',
                          'admin',
                          'head_teacher',
                          'senior_teacher'
                        ];
                        const isTeachingStaffRole = TEACHING_ROLES.includes(assignedRole) ||
                                                    TEACHING_ROLES.includes(category.toLowerCase()) ||
                                                    category.toLowerCase().includes('teacher') ||
                                                    category === 'HOI' || category === 'DHOI';
                        return isTeachingStaffRole ? 'e.g. 327775' : 'e.g. 31452981';
                      })()}
                      value={(() => {
                        const assignedRole = mapRoleLabelToRbacKey(category) || category.toLowerCase();
                        const TEACHING_ROLES = [
                          'class_teacher',
                          'subject_teacher',
                          'ict_teacher',
                          'lab_teacher',
                          'library_teacher',
                          'tools_inventory_teacher',
                          'hoi',
                          'dhoi',
                          'admin',
                          'head_teacher',
                          'senior_teacher'
                        ];
                        const isTeachingStaffRole = TEACHING_ROLES.includes(assignedRole) ||
                                                    TEACHING_ROLES.includes(category.toLowerCase()) ||
                                                    category.toLowerCase().includes('teacher') ||
                                                    category === 'HOI' || category === 'DHOI';
                        return isTeachingStaffRole ? tscNumber : nationalId;
                      })()}
                      onChange={(e) => {
                        const assignedRole = mapRoleLabelToRbacKey(category) || category.toLowerCase();
                        const TEACHING_ROLES = [
                          'class_teacher',
                          'subject_teacher',
                          'ict_teacher',
                          'lab_teacher',
                          'library_teacher',
                          'tools_inventory_teacher',
                          'hoi',
                          'dhoi',
                          'admin',
                          'head_teacher',
                          'senior_teacher'
                        ];
                        const isTeachingStaffRole = TEACHING_ROLES.includes(assignedRole) ||
                                                    TEACHING_ROLES.includes(category.toLowerCase()) ||
                                                    category.toLowerCase().includes('teacher') ||
                                                    category === 'HOI' || category === 'DHOI';
                        if (isTeachingStaffRole) {
                          setTscNumber(e.target.value);
                        } else {
                          setNationalId(e.target.value);
                        }
                      }}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {(() => {
                      const assignedRole = mapRoleLabelToRbacKey(category) || category.toLowerCase();
                      const TEACHING_ROLES = [
                        'class_teacher',
                        'subject_teacher',
                        'ict_teacher',
                        'lab_teacher',
                        'library_teacher',
                        'tools_inventory_teacher',
                        'hoi',
                        'dhoi',
                        'admin',
                        'head_teacher',
                        'senior_teacher'
                      ];
                      const isTeachingStaffRole = TEACHING_ROLES.includes(assignedRole) ||
                                                  TEACHING_ROLES.includes(category.toLowerCase()) ||
                                                  category.toLowerCase().includes('teacher') ||
                                                  category === 'HOI' || category === 'DHOI';
                      return isTeachingStaffRole
                        ? 'Official Teachers Service Commission (TSC) registration number.'
                        : 'Official Kenyan National ID number for non-teaching staff.';
                    })()}
                  </p>
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

              {/* Password Row */}
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-500" /> Login Password
                </span>
                <p className="text-[11px] text-slate-500">Auto-generated secure password for staff login. Share securely with the staff member.</p>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input 
                      type={showPassword === 'modal' ? 'text' : 'password'}
                      readOnly
                      value={password}
                      className="bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-mono font-bold tracking-wider text-slate-800 text-center select-all focus:outline-none focus:ring-0 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(showPassword === 'modal' ? null : 'modal')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword === 'modal' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button 
                    type="button"
                    onClick={generateSecurePassword}
                    className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Generate New
                  </button>
                </div>
              </div>

              {/* Class & Stream Assignments Grid FIRST */}
              {isTeachingStaff({ category, tscNumber } as StaffMember) && (
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

              {/* Subjects & Learning Area Competencies */}
              {isTeachingStaff({ category, tscNumber } as StaffMember) && (
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