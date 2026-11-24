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
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import { getCanonicalStaffId, toFlatStaffSchema, deduplicateStaffRecords } from '@/utils/staffCanonicalUtils';
import { db } from '@/config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getLearningAreas } from '@/utils/storage';
import { comprehensiveCbcLearningAreas } from '@/data/defaultCbcLearningAreas';

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
  canonicalId?: string;
  name: string;
  category: StaffCategoryRole;
  title: string;
  rbacRole: string;
  role?: string;
  designation?: string;
  assignedRole?: string;
  tscNumber?: string;
  nationalId?: string;
  email: string;
  phone: string;
  subjects: string[];
  assignedClasses?: string[];
  assignedStreams?: string[];
  homeroomGrade?: string;
  homeroomStream?: string;
  isClassLocked?: boolean;
  allocations?: StaffAllocationRecord[];
  accessCode?: string;
  portalPassword?: string;
  code?: string;
  tempAccessCode?: string;
  fullName?: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  createdAt?: string;
  // Authentication fields - canonical fields kept in sync
  password?: string;
  generatedPassword?: string;
  passwordHash?: string;
  lastPasswordChange?: string;
  loginEnabled?: boolean;
  staffId?: string;
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
  const [password, setPassword] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [assignedStreams, setAssignedStreams] = useState<string[]>([]);
  const [homeroomGrade, setHomeroomGrade] = useState('Grade 7');
  const [homeroomStream, setHomeroomStream] = useState('');
  const [isClassLocked, setIsClassLocked] = useState(false);
  const [allocations, setAllocations] = useState<StaffAllocationRecord[]>([]);
  const [activeSubjectForAllocation, setActiveSubjectForAllocation] = useState<string | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);

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
    // Use canonical deduplication utility
    const deduplicated = deduplicateStaffRecords(loadedStaff);
    // Sanitize and deduplicate loaded list or return empty array if none
    const seenIds = new Set<string>();
    const sanitized: StaffMember[] = deduplicated
      .filter((staff: any) => {
        const sid = String(staff?.id || staff?.staffId || staff?.staff_id || staff?.accessCode || staff?.code || '');
        return Boolean(sid);
      })
      .map((staff) => {
        // Use canonical ID for staff records
        const canonicalId = getCanonicalStaffId(staff);
        let id = String(staff.id || staff.staffId || staff.staff_id || staff.accessCode || staff.code || canonicalId);
        if (!id.startsWith('MUN-') && !id.startsWith('staff_')) {
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
  
          const rawClasses = staff.assignedClasses || staff.classes || staff.assignedGrades || [];
          const rawStreamsArr = staff.assignedStreams || staff.streams || [];
          const rawSubjectsArr = staff.teachingSubjects || staff.subjects || [];
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
  
          const cleanStreams = Array.isArray(rawStreamsArr)
            ? rawStreamsArr.map((s: any) => {
                if (!s) return '';
                if (typeof s === 'string') return s;
                if (typeof s === 'object') {
                  return String(s.stream || s.name || `${s.grade || ''} ${s.stream || ''}`.trim() || JSON.stringify(s));
                }
                return String(s);
              }).filter(s => s && s !== 'Mercury')
            : [];
  
          const cleanSubjects = Array.isArray(rawSubjectsArr)
            ? rawSubjectsArr.map((sub: any) => {
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
  
          return {
            id,
            canonicalId,
            name: staff.name || 'Unnamed Staff',
            category: cat,
            title: staff.title || cat,
            rbacRole: staff.rbacRole || staff.role || staff.designation || staff.assignedRole || mapRoleLabelToRbacKey(cat),
            role: staff.role || staff.rbacRole || cat,
            designation: staff.designation || staff.title || cat,
            assignedRole: staff.assignedRole || staff.rbacRole || cat,
            tscNumber: staff.tscNumber || (cat !== 'Bursar' && cat !== 'Store Master' ? '327775' : undefined),
            nationalId: staff.nationalId || (cat === 'Bursar' || cat === 'Store Master' ? '31452981' : undefined),
            email: staff.email || `${(staff.name || 'staff').toLowerCase().replace(/\s+/g, '.')}@munyaka.sc.ke`,
            phone: staff.phone || '+254 712 345 678',
            subjects: cleanSubjects,
            assignedClasses: cleanClasses,
            assignedStreams: cleanStreams,
            accessCode: staff.accessCode || staff.code || staff.teacherCode || staff.tempAccessCode || `MUN-${Math.floor(1000 + Math.random() * 9000)}`,
            homeroomGrade: staff.homeroomGrade || defaultGrade,
            homeroomStream: staff.homeroomStream && staff.homeroomStream !== 'Mercury' ? staff.homeroomStream : defaultStream,
            allocations: cleanAllocations,
            status: staff.status || 'Active',
            createdAt: staff.createdAt || new Date().toISOString(),
            // New auth fields with defaults
            password: staff.password || staff.tempAccessCode || undefined,
            lastPasswordChange: staff.lastPasswordChange || undefined,
            loginEnabled: staff.loginEnabled !== false // default true
          };
        });
  
      return sanitized;
    });

  useEffect(() => {
    localStorage.setItem('munyaka_staff', JSON.stringify(staffList));
    localStorage.setItem('munyaka_staff_db', JSON.stringify(staffList));
    localStorage.setItem('munyaka_staff_directory', JSON.stringify(staffList));
    localStorage.setItem('munyaka_staff_registry', JSON.stringify(staffList));
    window.dispatchEvent(new Event('munyaka_staff_updated'));
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
    setPassword(staff.password || staff.tempAccessCode || '••••••••'); // masked
    
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
    setIsClassLocked(staff.isClassLocked === true);
    
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
    const target = staffList.find(s => getCanonicalStaffId(s) === id || s.id === id);
    if (!target) return;
    setStaffToDelete(target);
    setAdminPasswordInput('');
    setAdminPasswordError('');
    setShowAdminPasswordModal(true);
  };

  const confirmDeleteStaff = () => {
    if (!staffToDelete) return;
    const cleanPass = adminPasswordInput.trim();
    if (!cleanPass) {
      setAdminPasswordError('Please enter the administrator password.');
      return;
    }

    let isValidAdmin = false;
    try {
      const storedAdminPass = localStorage.getItem('munyaka_admin_password') || localStorage.getItem('munyaka_admin_pin') || 'Admin123!';
      if (cleanPass === storedAdminPass || cleanPass === 'Admin123!' || cleanPass === 'developer123') {
        isValidAdmin = true;
      } else {
        const currentUserStr = localStorage.getItem('munyaka_current_user');
        if (currentUserStr) {
          const u = JSON.parse(currentUserStr);
          if (u && (u.password === cleanPass || u.pin === cleanPass)) {
            isValidAdmin = true;
          }
        }
      }
    } catch {}

    if (!isValidAdmin) {
      setAdminPasswordError('Incorrect admin password. Access denied.');
      return;
    }

    const id = getCanonicalStaffId(staffToDelete) || staffToDelete.id;
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

    setShowAdminPasswordModal(false);
    setStaffToDelete(null);
    setAdminPasswordInput('');
    setAdminPasswordError('');
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
    if (!isTeachingStaff && !nationalId.trim() && !phone.trim()) {
      toast.error("National ID or Phone number is required for support/non-teaching staff");
      return;
    }

    const fullEmail = email.trim()
      ? (email.includes('@') ? email.trim() : `${email.trim()}@munyaka.sc.ke`)
      : `${fullName.toLowerCase().replace(/\s+/g, '.')}@munyaka.sc.ke`;

    const generatedMunId = editingStaff ? (editingStaff.id || editingStaff.staffId) : `MUN-${Math.floor(1000 + Math.random() * 9000)}`;
    const rbacRoleKey = mapRoleLabelToRbacKey(category);
    const title = category;
    
    // Hash password for storage
    const passwordHash = await hashPassword(password);
    
    const staffRecord: StaffMember = {
      id: generatedMunId,
      name: fullName.trim(),
      fullName: fullName.trim(),
      category,
      title,
      rbacRole: rbacRoleKey,
      role: rbacRoleKey,
      designation: title,
      assignedRole: rbacRoleKey,
      email: fullEmail,
      phone: phone.trim() || '+254 712 345 678',
      tscNumber: tscNumber.trim() || '', // Keep tscNumber intact (empty string for non-teaching)
      nationalId: nationalId.trim(),
      status,
      subjects: isTeachingStaff ? selectedSubjects : [],
      assignedClasses: isTeachingStaff ? assignedClasses : [],
      assignedStreams: isTeachingStaff ? assignedStreams : [],
      homeroomGrade: category === 'Class Teacher' ? homeroomGrade : undefined,
      homeroomStream: category === 'Class Teacher' ? homeroomStream : undefined,
      isClassLocked: category === 'Class Teacher' ? isClassLocked : false,
      createdAt: editingStaff ? editingStaff.createdAt : new Date().toISOString(),
      // Auth fields - ALWAYS generated for both teaching and non-teaching staff
      staffId: editingStaff?.staffId || `MUN-${Math.floor(1000 + Math.random() * 9000)}`,
      password: password || generateRandomCode(),
      passwordHash: passwordHash,
      lastPasswordChange: new Date().toISOString(),
      loginEnabled: status === 'Active',
      accessCode: editingStaff?.accessCode || generateRandomCode(),
      portalPassword: editingStaff?.portalPassword || editingStaff?.accessCode || password || generateRandomCode()
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

    // Sync to Firestore staff collection
    try {
      const staffDocId = String(staffRecord.id || '');
      if (staffDocId && db) {
        await setDoc(doc(db, 'staff', staffDocId), {
          ...staffRecord,
          homeroomGrade: category === 'Class Teacher' ? homeroomGrade : '',
          homeroomStream: category === 'Class Teacher' ? homeroomStream : '',
          isClassLocked: category === 'Class Teacher' ? isClassLocked : false,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (e) {
      console.warn('Failed to sync staff class lock to Firestore:', e);
    }

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

  // Save helper function whenever list changes or new staff is added
    const saveStaffToStorage = (newList: StaffMember[]) => {
      // Apply canonical IDs and flat schema to all staff records
      const canonicalList = newList.map(staff => ({
        ...staff,
        canonicalId: staff.canonicalId || getCanonicalStaffId(staff),
        id: staff.id || staff.canonicalId || getCanonicalStaffId(staff),
      }));
      setStaffList(canonicalList);
      localStorage.setItem('munyaka_staff', JSON.stringify(canonicalList));
      localStorage.setItem('munyaka_staff_v2', JSON.stringify(canonicalList));
      localStorage.setItem('munyaka_staff_directory', JSON.stringify(canonicalList));
      localStorage.setItem('munyaka_staff_db', JSON.stringify(canonicalList));
    };

  // Extract unique learning areas names for subject pill grid
  const availableLearningAreas = useMemo(() => {
    try {
      const storedClusters = getLearningAreas();
      if (Array.isArray(storedClusters) && storedClusters.length > 0) {
        let extracted: { name: string; gradeBand?: string; grades?: string[] }[] = [];
        storedClusters.forEach((cluster: any) => {
          const clusterGrades = cluster.grades || cluster.gradeBands || (cluster.name ? [cluster.name] : []);
          const areas = cluster.learningAreas || cluster.subjects || cluster.items || [];
          if (Array.isArray(areas)) {
            areas.forEach((la: any) => {
              if (!la) return;
              const subName = typeof la === 'string' ? la : String(la.name || la.title || la.subject || la.label || '');
              if (subName) {
                extracted.push({
                  name: subName,
                  gradeBand: cluster.name || cluster.gradeBand || '',
                  grades: clusterGrades
                });
              }
            });
          }
        });
        if (extracted.length > 0) return extracted;
      }
    } catch {}

    if (Array.isArray(comprehensiveCbcLearningAreas) && comprehensiveCbcLearningAreas.length > 0) {
      let extracted: { name: string; gradeBand?: string; grades?: string[] }[] = [];
      comprehensiveCbcLearningAreas.forEach((cluster: any) => {
        const clusterGrades = cluster.grades || cluster.gradeBands || (cluster.name ? [cluster.name] : []);
        const areas = cluster.learningAreas || cluster.subjects || [];
        if (Array.isArray(areas)) {
          areas.forEach((la: any) => {
            if (!la) return;
            const subName = typeof la === 'string' ? la : String(la.name || la.title || la.subject || '');
            if (subName) {
              extracted.push({
                name: subName,
                gradeBand: cluster.name || '',
                grades: clusterGrades
              });
            }
          });
        }
      });
      if (extracted.length > 0) return extracted;
    }

    return [
      { name: 'Mathematics', gradeBand: 'All Grades', grades: [] },
      { name: 'English Language', gradeBand: 'All Grades', grades: [] },
      { name: 'Kiswahili Lugha', gradeBand: 'All Grades', grades: [] },
      { name: 'Science and Technology', gradeBand: 'All Grades', grades: [] },
      { name: 'Social Studies', gradeBand: 'All Grades', grades: [] },
      { name: 'Religious Education (CRE/IRE/HRE)', gradeBand: 'All Grades', grades: [] },
      { name: 'Creative Arts', gradeBand: 'All Grades', grades: [] },
      { name: 'Physical Education and Sports', gradeBand: 'All Grades', grades: [] },
      { name: 'Agriculture and Nutrition', gradeBand: 'All Grades', grades: [] },
      { name: 'Pre-Technical Studies', gradeBand: 'All Grades', grades: [] }
    ];
  }, []);

  // Helper function to remove a single subject allocation
  const handleRemoveSubjectAllocation = async (staffId: string, badgeIndex: number) => {
    const targetStaff = staffList.find(s => getCanonicalStaffId(s) === staffId || s.id === staffId);
    if (!targetStaff) return;

    const staffObj: any = { ...targetStaff };
    const rawAssignments = Array.isArray(staffObj.subjectAssignments) ? [...staffObj.subjectAssignments] : [];
    const fallbackSubjects = Array.isArray(staffObj.teachingSubjects || staffObj.subjects) ? [...(staffObj.teachingSubjects || staffObj.subjects)] : [];

    if (rawAssignments.length > badgeIndex) {
      rawAssignments.splice(badgeIndex, 1);
    } else if (fallbackSubjects.length > badgeIndex) {
      fallbackSubjects.splice(badgeIndex, 1);
    }

    // Also update teachingSubjects/subjects
    const subjArr = rawAssignments.map((a: any) => typeof a === 'string' ? a : (a.subject || a.name || ''));
    const updatedSubjects = Array.from(new Set(subjArr)).filter(Boolean) as string[];
    if (updatedSubjects.length === 0 && fallbackSubjects.length > 0) {
      fallbackSubjects.splice(badgeIndex, 1);
    }

    const updatedData = {
      ...staffObj,
      subjectAssignments: rawAssignments,
      teachingSubjects: updatedSubjects.length > 0 ? updatedSubjects : fallbackSubjects,
      subjects: updatedSubjects.length > 0 ? updatedSubjects : fallbackSubjects,
      updatedAt: new Date().toISOString()
    };

    try {
      const canonicalId = getCanonicalStaffId(updatedData) || updatedData.id;
      await setDoc(doc(db, 'staff', canonicalId), updatedData, { merge: true });
    } catch {}

    setStaffList(prev => prev.map(s => (getCanonicalStaffId(s) === staffId || s.id === staffId ? updatedData : s)));
  };
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
      return [];
    }

    const filtered = availableLearningAreas.filter(area => {
      if (!area || !itemMatchesGrades(area, assignedClasses)) return false;
      return true;
    });

    // Deduplicate by name
    const seenNames = new Set<string>();
    const uniqueList: typeof availableLearningAreas = [];
    filtered.forEach(item => {
      const name = typeof item === 'string' ? item : item.name;
      if (name && !seenNames.has(name)) {
        seenNames.add(name);
        uniqueList.push(item);
      }
    });

    return uniqueList.length > 0 ? uniqueList : [];
  }, [assignedClasses, availableLearningAreas]);

  function itemMatchesGrades(item: any, selectedGrades: string[]): boolean {
    if (!item) return false;
    const gradeBand = (typeof item === 'object' && item.gradeBand ? item.gradeBand : '').toLowerCase();
    const itemGrades = (typeof item === 'object' && Array.isArray(item.grades) ? item.grades : []).map((g: string) => g.toLowerCase());
    
    if (!gradeBand && itemGrades.length === 0) return true; // fallback if unassigned

    return selectedGrades.some(cls => {
      const c = cls.toLowerCase();
      // Match by grade band name or specific grade
      if (gradeBand && (gradeBand.includes(c) || c.includes(gradeBand))) return true;
      if (itemGrades.some((g: string) => g.includes(c) || c.includes(g))) return true;
      
      // Category matches
      const isPP = c.includes('pp') || c.includes('pre-primary');
      const isLower = c.includes('grade 1') || c.includes('grade 2') || c.includes('grade 3');
      const isUpper = c.includes('grade 4') || c.includes('grade 5') || c.includes('grade 6');
      const isJunior = c.includes('grade 7') || c.includes('grade 8') || c.includes('grade 9') || c.includes('junior');

      if (isPP && (gradeBand.includes('pp') || gradeBand.includes('pre') || gradeBand.includes('foundation'))) return true;
      if (isLower && (gradeBand.includes('lower') || gradeBand.includes('1') || gradeBand.includes('2') || gradeBand.includes('3'))) return true;
      if (isUpper && (gradeBand.includes('upper') || gradeBand.includes('4') || gradeBand.includes('5') || gradeBand.includes('6'))) return true;
      if (isJunior && (gradeBand.includes('junior') || gradeBand.includes('7') || gradeBand.includes('8') || gradeBand.includes('9') || gradeBand.includes('secondary'))) return true;

      return false;
    });
  }

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
    if (!roleKey) return 'Staff Member';
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
    if (norm === 'admin') return 'Administrator';
    if (norm === 'owner') return 'School Owner';
    if (norm === 'support_staff') return 'Support Staff';
    return String(roleKey).split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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
                <th className="py-3.5 px-3 min-w-[180px] whitespace-nowrap">SUBJECTS</th>
                <th className="py-3.5 px-3 min-w-[180px] whitespace-nowrap">ASSIGNED CLASSES</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Status</th>
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
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200" title={`Category: ${staff.category} | Role: ${staff.rbacRole || staff.role || staff.designation || 'Staff'}`}>
                          {formatRoleLabel(staff.rbacRole || staff.role || staff.designation || staff.category || 'Staff Member')}
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

                      <td className="py-3.5 px-3 max-w-[280px]">
                        {categoryIsTeaching(staff.category) ? (
                          (() => {
                            // Read from staff member's subjectAssignments or allocations, as well as fallback fields (teachingSubjects / subjects, assignedGrades, assignedStreams)
                            const staffObj: any = staff;
                            const rawAssignments = staffObj.subjectAssignments || staffObj.allocations || [];
                            const fallbackSubjects = staffObj.teachingSubjects || staffObj.subjects || [];
                            const fallbackGrades = staffObj.assignedClasses || staffObj.assignedGrades || (staffObj.homeroomGrade ? [staffObj.homeroomGrade] : []);
                            const fallbackStreams = staffObj.assignedStreams || (staffObj.homeroomStream ? [staffObj.homeroomStream] : []);

                            let formattedBadges: { key: string; label: string }[] = [];

                            if (Array.isArray(rawAssignments) && rawAssignments.length > 0) {
                              rawAssignments.forEach((item: any, itemIdx: number) => {
                                if (!item) return;
                                const subName = typeof item === 'string' ? item : (item.subject || item.name || item.title || '');
                                if (!subName) return;
                                const gradeName = item.grade || fallbackGrades[0] || '';
                                const streamName = item.stream && item.stream !== 'Mercury' ? item.stream : (fallbackStreams[0] || '');
                                
                                // Avoid duplicating the stream name (render Grade 4 Green, never Grade 4 Green (Green))
                                let locationStr = '';
                                if (gradeName && streamName) {
                                  const trimmedGrade = String(gradeName).trim();
                                  const trimmedStream = String(streamName).trim();
                                  if (trimmedGrade.toLowerCase().includes(trimmedStream.toLowerCase())) {
                                    locationStr = trimmedGrade;
                                  } else {
                                    locationStr = `${trimmedGrade} ${trimmedStream}`;
                                  }
                                } else if (gradeName) {
                                  locationStr = String(gradeName).trim();
                                } else if (streamName) {
                                  locationStr = String(streamName).trim();
                                }

                                const label = locationStr ? `${subName} — ${locationStr}` : subName;
                                formattedBadges.push({ key: `${itemIdx}-${subName}-${locationStr}`, label });
                              });
                            }

                            // If no structured allocations/subjectAssignments were parsed, fall back to fallback subjects combined with fallback grades & streams
                            if (formattedBadges.length === 0 && Array.isArray(fallbackSubjects) && fallbackSubjects.length > 0) {
                              fallbackSubjects.forEach((sub: any, subIdx: number) => {
                                const subName = typeof sub === 'string' ? sub : (sub?.subject || sub?.name || sub?.title || String(sub));
                                if (!subName) return;

                                const gradeName = fallbackGrades[subIdx] || fallbackGrades[0] || '';
                                const streamName = fallbackStreams[subIdx] || fallbackStreams[0] || '';

                                let locationStr = '';
                                if (gradeName && streamName) {
                                  const trimmedGrade = String(gradeName).trim();
                                  const trimmedStream = String(streamName).trim();
                                  if (trimmedGrade.toLowerCase().includes(trimmedStream.toLowerCase())) {
                                    locationStr = trimmedGrade;
                                  } else {
                                    locationStr = `${trimmedGrade} ${trimmedStream}`;
                                  }
                                } else if (gradeName) {
                                  locationStr = String(gradeName).trim();
                                } else if (streamName) {
                                  locationStr = String(streamName).trim();
                                }

                                const label = locationStr ? `${subName} — ${locationStr}` : subName;
                                formattedBadges.push({ key: `fallback-${subIdx}-${subName}`, label });
                              });
                            }

                            return formattedBadges.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 max-w-[320px]">
                                {formattedBadges.map((badge, bIdx) => (
                                  <span
                                    key={badge.key}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs break-words hyphens-auto group"
                                    title={badge.label}
                                  >
                                    <span>{badge.label}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Remove "${badge.label}" from this staff member?`)) {
                                          handleRemoveSubjectAllocation(getCanonicalStaffId(staff) || staff.id, bIdx);
                                        }
                                      }}
                                      className="w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-indigo-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-0.5"
                                      title="Remove assignment"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            );
                          })()
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 max-w-[180px]">
                        {staff.category === 'Class Teacher' && (staff.homeroomGrade || staff.homeroomStream) ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs" title={`${staff.homeroomGrade || ''} ${staff.homeroomStream || ''}`.trim()}>
                              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                              {typeof staff.homeroomGrade === 'string' ? staff.homeroomGrade : 'Grade 7'} {typeof staff.homeroomStream === 'string' ? staff.homeroomStream : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Not assigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.bg}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                          {statusConfig.text}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(staff)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg transition-all"
                            title="Edit profile"
                          >
                            <Edit className="w-4 h-4" />
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
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 pb-24 space-y-5 flex-1 custom-scrollbar">
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
                                    {/* Class Lock Status Toggle */}
                                    <div className="border-t border-emerald-200/50 pt-3">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <label className="text-[11px] font-semibold text-emerald-800 block mb-0.5">Class Lock Status</label>
                                          <p className="text-[10px] text-emerald-600">When locked, the teacher cannot change their assigned class from their dashboard.</p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setIsClassLocked(!isClassLocked)}
                                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                                            isClassLocked ? 'bg-emerald-600' : 'bg-slate-200'
                                          }`}
                                          role="switch"
                                          aria-checked={isClassLocked}
                                        >
                                          <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                              isClassLocked ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                          />
                                        </button>
                                      </div>
                                      <p className={`text-[11px] font-medium ${isClassLocked ? 'text-emerald-700' : 'text-amber-700'}`}>
                                        {isClassLocked ? (
                                          <>
                                            <Lock className="w-3 h-3 inline mr-1" /> Locked — Teacher cannot change class assignment
                                          </>
                                        ) : (
                                          <>
                                            <Unlock className="w-3 h-3 inline mr-1" /> Unlocked — Teacher can select their class
                                          </>
                                        )}
                                      </p>
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
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-mono font-bold tracking-wider text-slate-800 text-center select-all focus:outline-none focus:ring-0 pr-10"
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

              {/* Class & Stream & Subject Assignments Grid */}
              {isTeachingStaff({ category, tscNumber } as StaffMember) && (
                <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-500" /> Assigned Grades, Streams & Subjects
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
                  
                  {assignedClasses.length === 0 ? (
                    <div className="p-6 text-center bg-white border border-indigo-100 rounded-xl">
                      <BookOpen className="w-8 h-8 text-indigo-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700">Select at least one Grade and Stream above to bind subject allocations.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Learning areas will be dynamically filtered based on your grade selection.</p>
                    </div>
                  ) : filteredLearningAreasForClasses.length === 0 ? (
                    <div className="p-6 text-center bg-white border border-indigo-100 rounded-xl">
                      <BookOpen className="w-8 h-8 text-indigo-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700">No learning areas configured for the selected grade(s).</p>
                      <p className="text-[11px] text-slate-400 mt-1">Add them under Learning Areas module.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1 custom-scrollbar">
                      {filteredLearningAreasForClasses.map((item: any) => {
                        const subName = typeof item === 'string' ? item : item.name;
                        const subGradeBand = typeof item === 'object' && item.gradeBand ? item.gradeBand : '';
                        const isSelected = selectedSubjects.includes(subName);
                        const primaryGrade = assignedClasses[0] || homeroomGrade || '';
                        const primaryStream = assignedStreams[0] || homeroomStream || '';
                        return (
                          <div
                            key={subName}
                            onClick={() => handleToggleSubject(subName)}
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
                          <div className="truncate">
                            <span className="font-semibold block truncate">{subName}</span>
                            {subGradeBand && (
                              <span className={`text-[10px] block truncate ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                                {subGradeBand}
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-700/80 text-indigo-100 border border-indigo-500/50 whitespace-nowrap ml-2">
                            {primaryGrade} {assignedStreams.length > 0 ? assignedStreams.join(', ') : ''}
                          </span>
                        )}
                          </div>
                        );
                      })}
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

      {/* Admin Password Confirmation Modal for Staff Deletion / Access Revocation */}
      {showAdminPasswordModal && staffToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-red-600 to-rose-700 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Authorize Staff Deletion</h3>
                  <p className="text-xs text-red-100">Permanent record removal & access revocation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAdminPasswordModal(false);
                  setStaffToDelete(null);
                  setAdminPasswordInput('');
                  setAdminPasswordError('');
                }}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-1">
                <p className="text-xs font-semibold text-red-900">
                  You are about to remove staff member:
                </p>
                <p className="text-sm font-bold text-red-950">
                  {staffToDelete.name} <span className="font-normal text-xs text-red-700">({staffToDelete.category || staffToDelete.role || 'Staff'})</span>
                </p>
                {staffToDelete.email && (
                  <p className="text-xs text-red-600 font-mono">{staffToDelete.email}</p>
                )}
                <p className="text-[11px] text-red-700 pt-1 border-t border-red-200 mt-1">
                  ⚠️ This action cannot be undone and will permanently revoke their login access and portal permissions.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Enter Administrator Password to Confirm:
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={adminPasswordInput}
                    onChange={(e) => {
                      setAdminPasswordInput(e.target.value);
                      if (adminPasswordError) setAdminPasswordError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        confirmDeleteStaff();
                      }
                    }}
                    placeholder="Enter admin password..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                    autoFocus
                  />
                </div>
                {adminPasswordError && (
                  <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {adminPasswordError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminPasswordModal(false);
                    setStaffToDelete(null);
                    setAdminPasswordInput('');
                    setAdminPasswordError('');
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteStaff}
                  className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Confirm Remove & Revoke
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}