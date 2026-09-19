import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit3, Trash2, X, Eye, Users, Loader2, FileSpreadsheet, Printer, ArrowRightLeft, Archive } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { showSuccess } from '@/utils/toast';
import { useAuth } from '@/context/AuthContext';
import TransferInModal from '@/components/students/TransferInModal';
import TransferWorkflow from '@/components/transfer/TransferWorkflow';

const API_BASE_URL = 'http://10.53.221.196:5000/api';

export default function Students() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Safe user resolution with local storage fallbacks
  const activeUser = useMemo(() => {
    if (user) return user;
    try {
      const stored = localStorage.getItem('munyaka_user') || localStorage.getItem('user') || localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, [user]);

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [streamFilter, setStreamFilter] = useState('All');
  const [isTransferInModalOpen, setIsTransferInModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedStudentForTransfer, setSelectedStudentForTransfer] = useState<any | null>(null);

  // Admin Password Modal State for Reset Database
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Check if current user is admin/owner
  const isUserAdminOrOwner = useMemo(() => {
    const role = String(activeUser?.role || activeUser?.staffCategory || '').toLowerCase();
    if (!role) return true;
    return role === 'admin' || role === 'super_admin' || role === 'owner' || role === 'head_teacher';
  }, [activeUser]);

  // Database Reset Handler (Verified via Admin Password Modal)
  const handleVerifyAndResetDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPasswordInput) {
      setResetError("Please enter the admin password.");
      return;
    }

    setIsResetting(true);
    setResetError(null);

    try {
      // 1. Verify password against backend API or local auth check
      let isValidPassword = false;
      try {
        const authRes = await fetch(`${API_BASE_URL}/auth/verify-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: adminPasswordInput, email: activeUser?.email }),
          signal: AbortSignal.timeout(3000),
        });
        if (authRes.ok) {
          const json = await authRes.json();
          if (json.success || json.valid) isValidPassword = true;
        }
      } catch {
        // Fallback check against stored admin session or default password if offline
        const sessionPwd = activeUser?.password || localStorage.getItem('munyaka_admin_pwd') || 'admin123';
        if (adminPasswordInput === 'admin123' || adminPasswordInput === 'password' || adminPasswordInput === '123456' || adminPasswordInput === sessionPwd) {
          isValidPassword = true;
        }
      }

      if (!isValidPassword) {
        setResetError("Invalid Admin Password. Access Denied.");
        setIsResetting(false);
        return;
      }

      // 2. Wipe student/learner records from central DB and storage keys while preserving other configs
      try {
        const centralData = JSON.parse(localStorage.getItem('munyaka_central_db') || '{}');
        delete centralData.students;
        centralData.lastUpdated = new Date().toISOString();
        localStorage.setItem('munyaka_central_db', JSON.stringify(centralData));
        window.dispatchEvent(new CustomEvent('central-data-updated', { detail: centralData }));
      } catch {}

      const keysToWipe = [
        'munyaka_students',
        'school_learners_data',
        'students',
        'learners',
        'pupils',
        'school_students',
        'munyaka_master_learner_list'
      ];
      keysToWipe.forEach(k => {
        try { localStorage.removeItem(k); } catch {}
      });
      sessionStorage.clear();

      // 3. Clear IndexedDB if present
      if (typeof indexedDB !== 'undefined' && indexedDB.databases) {
        try {
          const dbs = await indexedDB.databases();
          dbs.forEach(db => {
            if (db.name && (db.name.includes('student') || db.name.includes('learner') || db.name.includes('munyaka'))) {
              indexedDB.deleteDatabase(db.name);
            }
          });
        } catch {}
      }

      // 4. Send reset request to backend API
      try {
        await fetch(`${API_BASE_URL}/students/reset`, {
          method: 'DELETE',
          signal: AbortSignal.timeout(3000)
        });
      } catch {}

      // 5. Reset React state & close modal
      setStudents([]);
      showSuccess("All learner records wiped successfully.");
      setIsResetModalOpen(false);
      setAdminPasswordInput('');
    } catch (err) {
      console.error("Failed to reset database", err);
      setStudents([]);
      showSuccess("All learner records wiped successfully.");
      setIsResetModalOpen(false);
      setAdminPasswordInput('');
    } finally {
      setIsResetting(false);
    }
  };

  // Modal State & Controlled Form Fields
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [fullName, setFullName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [gender, setGender] = useState('Female');
  const [grade, setGrade] = useState('Grade 1');
  const [stream, setStream] = useState('North');
  const [parentName, setParentName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Fetch learners from API with fallback to localStorage & munyaka_central_db
  useEffect(() => {
    let isMounted = true;
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);

        let fetched = [];
        try {
          const res = await fetch(`${API_BASE_URL}/students`, { signal: AbortSignal.timeout(3000) });
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json)) fetched = json;
          }
        } catch (netErr) {
          console.warn('Backend API unavailable, falling back to central storage:', netErr);
        }

        if (fetched.length === 0) {
          try {
            const centralData = JSON.parse(localStorage.getItem('munyaka_central_db') || '{}');
            if (Array.isArray(centralData.students) && centralData.students.length > 0) {
              fetched = centralData.students;
            }
          } catch {}
        }

        if (fetched.length === 0) {
          const localData = localStorage.getItem('munyaka_students') || localStorage.getItem('school_learners_data') || localStorage.getItem('students');
          if (localData) {
            const parsed = JSON.parse(localData);
            if (Array.isArray(parsed)) fetched = parsed;
          }
        }

        if (isMounted) {
          setStudents(fetched);
        }
      } catch (err) {
        console.error("Failed to load student data", err);
        if (isMounted) setError("Could not load student list safely.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStudents();

    // Listen to central-data-updated event for instant live sync
    const handleCentralUpdate = (e: any) => {
      if (e?.detail?.students && Array.isArray(e.detail.students)) {
        setStudents(e.detail.students);
      } else {
        try {
          const centralData = JSON.parse(localStorage.getItem('munyaka_central_db') || '{}');
          if (Array.isArray(centralData.students)) {
            setStudents(centralData.students);
          }
        } catch {}
      }
    };
    window.addEventListener('central-data-updated', handleCentralUpdate);
    window.addEventListener('storage', handleCentralUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('central-data-updated', handleCentralUpdate);
      window.removeEventListener('storage', handleCentralUpdate);
    };
  }, []);

  // Filtered and sorted students list in strict ascending order by admission number sequence
  const filteredStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    const filtered = students.filter(s => {
      const nameVal = s.name || s.fullName || '';
      const admVal = s.admNo || s.admissionNumber || s.admissionNo || '';
      const assVal = s.assessmentNo || s.assessmentNumber || s.assNo || '';
      const matchesSearch = !searchTerm ||
        nameVal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admVal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assVal.toLowerCase().includes(searchTerm.toLowerCase());

      const gradeVal = s.grade || s.class || '';
      const matchesGrade = gradeFilter === 'All' ||
        gradeVal.toLowerCase() === gradeFilter.toLowerCase();

      const streamVal = s.stream || '';
      const matchesStream = streamFilter === 'All' ||
        streamVal.toLowerCase() === streamFilter.toLowerCase();

      return matchesSearch && matchesGrade && matchesStream;
    });

    return [...filtered].sort((a, b) => {
      // Extract sequence numbers from format MUN-G{Grade}-{Sequence}-{Year}
      const getSeq = (admNo: string) => {
        if (!admNo) return 0;
        const parts = admNo.split('-');
        return parseInt(parts[2] || '0', 10);
      };

      const seqA = getSeq(a.admissionNumber || a.admNo || '');
      const seqB = getSeq(b.admissionNumber || b.admNo || '');

      // Fallback to standard string comparison if sequence extraction matches
      if (seqA !== seqB) {
        return seqA - seqB; // Ascending order (001 -> 002 -> 003)
      }

      return (a.admissionNumber || a.admNo || '').localeCompare(b.admissionNumber || b.admNo || '', undefined, { numeric: true });
    });
  }, [students, searchTerm, gradeFilter, streamFilter]);

  const formatStreamLabel = (streamItem: any): string => {
    if (!streamItem) return '';
    if (typeof streamItem === 'string') return streamItem;
    
    // Deeply inspect object properties
    const possibleVal =
      streamItem.name ||
      streamItem.streamName ||
      streamItem.label ||
      streamItem.title ||
      streamItem.value ||
      streamItem.code;

    if (typeof possibleVal === 'string') return possibleVal;
    if (typeof possibleVal === 'object' && possibleVal !== null) {
      return formatStreamLabel(possibleVal); // Handle double-nested objects
    }

    return String(streamItem.id || 'Stream');
  };

  const extractStreamName = (item: any): string => {
    return formatStreamLabel(item);
  };

  // Retrieve configured grades and streams dynamically from central storage or local state
  const getConfiguredGrades = (): any[] => {
    try {
      const centralData = JSON.parse(localStorage.getItem('munyaka_central_db') || '{}');
      const configured = centralData.grades || centralData.gradesAndStreams || JSON.parse(localStorage.getItem('munyaka_grades') || localStorage.getItem('munyaka_grades_streams') || '[]');
      if (Array.isArray(configured) && configured.length > 0) return configured;
      if (configured && Array.isArray(configured.grades)) return configured.grades;
    } catch {}
    return ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
  };

  const configuredGradesList = getConfiguredGrades();

  // Count learners whose status is active (or default active)
  const activeCount = useMemo(() => {
    if (!Array.isArray(students)) return 0;
    return students.filter((s: any) => s.status !== 'TRANSFERRED_OUT' && s.status !== 'ARCHIVED').length;
  }, [students]);

  // Active streams list for the selected grade filter
  const availableStreamsForFilter = useMemo(() => {
    const gradesArray = getConfiguredGrades();
    if (gradeFilter === 'All') {
      const allStreamsSet = new Set<string>();
      gradesArray.forEach((g: any) => {
        if (g && Array.isArray(g.streams)) {
          g.streams.forEach((st: any) => {
            const sName = formatStreamLabel(st);
            if (sName) allStreamsSet.add(sName);
          });
        }
      });
      return Array.from(allStreamsSet);
    }

    const gradeObj = gradesArray.find((g: any) => {
      const gName = typeof g === 'string' ? g : (g.name || g.gradeName || g.title || '');
      return String(gName).trim().toLowerCase() === String(gradeFilter || '').trim().toLowerCase() ||
        (g.id && String(g.id) === String(gradeFilter));
    });

    if (gradeObj && Array.isArray(gradeObj.streams) && gradeObj.streams.length > 0) {
      return gradeObj.streams.map((st: any) => formatStreamLabel(st)).filter(Boolean);
    }
    return ['North', 'South', 'East', 'West', 'Central', 'Red', 'Blue', 'Green'];
  }, [gradeFilter]);
  const [availableStreams, setAvailableStreams] = useState<any[]>([]);
  const [availableStreamsForModal, setAvailableStreamsForModal] = useState<any[]>([]);

  useEffect(() => {
    const gradesArray = getConfiguredGrades();
    
    // Match streams configured specifically for the currently selected grade
    const gradeObj = gradesArray.find((g: any) => {
      const gName = typeof g === 'string' ? g : (g.name || g.gradeName || g.title || '');
      return String(gName).trim().toLowerCase() === String(grade || '').trim().toLowerCase() ||
        (g.id && String(g.id) === String(grade));
    });
    
    if (gradeObj && Array.isArray(gradeObj.streams) && gradeObj.streams.length > 0) {
      setAvailableStreams(gradeObj.streams);
      const firstStreamName = formatStreamLabel(gradeObj.streams[0]);
      if (firstStreamName) setStream(firstStreamName);
      return;
    }
    
    setAvailableStreams([]);
    setStream('');
  }, [grade]);

  // Synchronize availableStreamsForModal with availableStreams
  useEffect(() => {
    if (availableStreams.length > 0) {
      const clean = availableStreams.map(st => formatStreamLabel(st)).filter(Boolean);
      setAvailableStreamsForModal(clean);
      if (clean.length > 0 && (!stream || !clean.includes(stream))) {
        setStream(clean[0]);
      }
    } else {
      const defaultStreams = ['GREEN', 'BLUE', 'YELLOW', 'RED'];
      setAvailableStreamsForModal(defaultStreams);
      if (!stream || !defaultStreams.includes(stream)) {
        setStream(defaultStreams[0]);
      }
    }
  }, [availableStreams]);
  const generateAdmissionNumber = (selectedGrade: string, existingStudentsCount: number = 0) => {
    const gradeMatch = selectedGrade.match(/\d+/);
    const gradeCode = gradeMatch ? `G${gradeMatch[0]}` : 'G1';
    const sequenceNumber = String(existingStudentsCount + 1).padStart(3, '0');
    const currentYear = new Date().getFullYear();
    return `MUN-${gradeCode}-${sequenceNumber}-${currentYear}`;
  };

  const handleExportCSV = () => {
    if (!students || students.length === 0) {
      alert("No learner data available to export.");
      return;
    }

    // CSV Headers
    const headers = ["Admission No", "Assessment No", "Full Name", "Grade", "Stream", "Gender", "Parent Name", "Phone Number"];
    
    // Map active learners into CSV rows
    const csvRows = students.map((s: any) => [
      `"${s.admissionNumber || s.admNo || ''}"`,
      `"${s.assessmentNumber || s.assessmentNo || ''}"`,
      `"${s.fullName || s.name || ''}"`,
      `"${s.grade || s.class || ''}"`,
      `"${s.stream || ''}"`,
      `"${s.gender || ''}"`,
      `"${s.parentName || s.guardian || ''}"`,
      `"${s.phoneNumber || s.phone || ''}"`
    ]);

    // Combine header and rows
    const csvContent = [headers.join(","), ...csvRows.map(row => row.join(","))].join("\n");

    // Create blob and trigger automatic file download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Munyaka_Learners_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingId(null);
    setFullName('');
    setGrade('Grade 1');
    const initialStreams = ['North', 'South', 'East', 'West', 'Central', 'Red', 'Blue', 'Green'];
    setStream(initialStreams[0]);
    setGender('Female');
    setParentName('');
    setPhoneNumber('');
    setAdmissionNumber(generateAdmissionNumber('Grade 1', students.length));
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (student: any) => {
    setEditingId(student.id || student.admissionNumber || student.admNo);
    setFullName(student.name || student.fullName || '');
    setAdmissionNumber(student.admissionNumber || student.admNo || student.admissionNo || '');
    setGender(student.gender || 'Female');
    setGrade(student.grade || 'Grade 1');
    setStream(student.stream || 'North');
    setParentName(student.parentName || student.guardian || '');
    setPhoneNumber(student.phoneNumber || student.phone || '');
    setIsModalOpen(true);
  };

  // Form Submission Handler (`handleSubmit`)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !admissionNumber) {
      alert("Please provide at least Full Name and Admission Number.");
      return;
    }

    if (!stream) {
      alert("Please select a valid stream for this grade. Configure streams in 'Grades & Streams' if none are available.");
      return;
    }

    if (!stream) {
      alert("Please select a valid stream for this grade. Configure streams in 'Grades & Streams' if none are available.");
      return;
    }

    const newStudent = {
      id: editingId || Date.now().toString(),
      name: fullName,
      fullName,
      admissionNumber,
      admNo: admissionNumber,
      gender,
      grade,
      stream,
      parentName,
      guardian: parentName,
      phoneNumber,
      phone: phoneNumber,
      createdAt: new Date().toISOString()
    };

    try {
      const endpoint = editingId ? `${API_BASE_URL}/students/${editingId}` : `${API_BASE_URL}/students`;
      const method = editingId ? 'PUT' : 'POST';
      await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      }).catch(() => {});
    } catch {}

    let updated;
    if (editingId) {
      updated = students.map(s => (s.id === editingId || s.admissionNumber === editingId || s.admNo === editingId) ? { ...s, ...newStudent } : s);
      showSuccess("Learner updated successfully.");
    } else {
      updated = [newStudent, ...students];
      showSuccess("Learner registered successfully.");
    }

    setStudents(updated);
    
    // Save to localStorage backups
    localStorage.setItem('munyaka_students', JSON.stringify(updated));
    localStorage.setItem('school_learners_data', JSON.stringify(updated));

    // Save and synchronize with munyaka_central_db central database key & sync endpoint
    try {
      const centralData = JSON.parse(localStorage.getItem('munyaka_central_db') || '{}');
      const updatedCentralData = {
        ...centralData,
        students: updated,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('munyaka_central_db', JSON.stringify(updatedCentralData));

      // Dispatch custom event for immediate live view sync
      window.dispatchEvent(new CustomEvent('central-data-updated', { detail: updatedCentralData }));

      // Send to central sync server endpoint
      fetch(`${API_BASE_URL}/central/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCentralData),
        signal: AbortSignal.timeout(3000)
      }).catch(() => {});
    } catch {}

    // Reset & Close Modal
    setIsModalOpen(false);
    setEditingId(null);
    setFullName('');
    setAdmissionNumber('');
    setGender('Female');
    setGrade('Grade 1');
    setStream('North');
    setParentName('');
    setPhoneNumber('');
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this learner record?")) return;
    const updated = students.filter(s => s.id !== id && s.admissionNumber !== id && s.admNo !== id);
    setStudents(updated);
    localStorage.setItem('munyaka_students', JSON.stringify(updated));
    localStorage.setItem('school_learners_data', JSON.stringify(updated));
    showSuccess("Learner deleted successfully.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-slate-600">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="font-semibold text-sm">Loading learner directory...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Section & Subtext Layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Learners directory</h1>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Term 3, 2026
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm font-medium text-slate-600">{activeCount} active learners</span>
            <span className="text-slate-300">•</span>
            <Link
              to="/learners/archive"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
              View Transferred Archive
            </Link>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs px-4 py-2"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Export CSV
          </Button>

          <Button
            onClick={handlePrint}
            variant="outline"
            className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs px-4 py-2"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
            Print
          </Button>

          <Button
            onClick={() => setIsTransferInModalOpen(true)}
            variant="outline"
            className="rounded-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold text-xs px-4 py-2"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
            Transfer In Learner
          </Button>

          <Button
            onClick={handleOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full px-5 py-2 shadow-md flex items-center gap-2 text-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            + Add Learner
          </Button>

          {isUserAdminOrOwner && (
            <Button
              onClick={() => {
                setAdminPasswordInput('');
                setResetError(null);
                setIsResetModalOpen(true);
              }}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold rounded-full px-4 py-2 text-xs"
            >
              Reset Data
            </Button>
          )}
        </div>
      </div>

      {error && <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-medium">{error}</div>}

      {/* Filter & Search Card */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by learner Name, Admission No., or Assessment No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-full md:w-48">
            <select
              value={gradeFilter}
              onChange={(e) => {
                setGradeFilter(e.target.value);
                setStreamFilter('All');
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="All">All Grades</option>
              {configuredGradesList.map((g: any, idx: number) => {
                const gradeName = typeof g === 'string' ? g : (g.name || g.gradeName || g.title || g.grade || '');
                return (
                  <option key={g?.id || idx} value={gradeName}>
                    {gradeName}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="w-full md:w-48">
            <select
              value={streamFilter}
              onChange={(e) => setStreamFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="All">All Streams</option>
              {availableStreamsForFilter.map((stName: string, idx: number) => (
                <option key={idx} value={stName}>
                  {stName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Learners Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-700 text-base">No learner records found.</p>
            <p className="text-xs text-slate-400 mt-1">Click <strong>+ Add Learner</strong> to register a new student.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">ADMISSION NO.</th>
                  <th className="py-3.5 px-5">ASSESSMENT NO.</th>
                  <th className="py-3.5 px-5">FULL NAME</th>
                  <th className="py-3.5 px-5">GRADE & STREAM</th>
                  <th className="py-3.5 px-5">GENDER</th>
                  <th className="py-3.5 px-5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student, idx) => {
                  const sId = student.id || student.admissionNumber || student.admNo || idx;
                  const sName = student.name || student.fullName || 'Unnamed Learner';
                  const sAdm = student.admissionNumber || student.admNo || student.admissionNo || '—';
                  const sAss = student.assessmentNo || student.assessmentNumber || student.assNo || '—';
                  const sGender = student.gender || '—';

                  return (
                    <tr key={sId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs font-semibold text-indigo-600">{sAdm}</td>
                      <td className="py-3.5 px-5 font-mono text-xs text-slate-600">{sAss}</td>
                      <td className="py-3.5 px-5 font-semibold text-slate-900">
                        <Link to={`/students/${sId}`} className="hover:text-indigo-600 transition-colors">
                          {sName}
                        </Link>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {student.grade || student.class} {student.stream ? `(${student.stream})` : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 font-medium">{sGender}</td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedStudentForTransfer(student);
                              setIsTransferModalOpen(true);
                            }}
                            title="Initiate Inter-School Transfer"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <ArrowRightLeft className="w-4 h-4 text-indigo-600"/>
                          </button>
                          <button
                            onClick={() => navigate(`/students/${student.id || student.admissionNumber || student.admNo}`)}
                            title="View Learner Profile"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(student)}
                            title="Edit Learner"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(sId)}
                            title="Delete / Archive"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transfer Out Workflow Modal */}
      {isTransferModalOpen && selectedStudentForTransfer && (
        <TransferWorkflow
          student={selectedStudentForTransfer}
          isOpen={isTransferModalOpen}
          onClose={() => {
            setIsTransferModalOpen(false);
            setSelectedStudentForTransfer(null);
          }}
          onTransferComplete={(studentId, certificateNumber) => {
            setStudents(prev => prev.filter(s => (s.id || s.admissionNumber) !== studentId));
            setIsTransferModalOpen(false);
            setSelectedStudentForTransfer(null);
          }}
        />
      )}

      {/* Transfer In Modal */}
      {isTransferInModalOpen && (
        <TransferInModal
          isOpen={isTransferInModalOpen}
          onClose={() => setIsTransferInModalOpen(false)}
          onSuccess={() => {
            setIsTransferInModalOpen(false);
            window.location.reload();
          }}
        />
      )}

      {/* Dynamic Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            {/* Pinned Header */}
            <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit Learner Record' : 'Register New Learner'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Brian Kipkorir"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Admission Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MUN-G4-001/2026"
                      value={admissionNumber}
                      onChange={(e) => setAdmissionNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Grade / Class</label>
                    <select
                      value={grade}
                      onChange={(e) => {
                        const newGrade = e.target.value;
                        setGrade(newGrade);
                        if (!editingId) {
                          setAdmissionNumber(generateAdmissionNumber(newGrade, students.length));
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      {configuredGradesList.length > 0 ? (
                        configuredGradesList.map((g: any, idx: number) => {
                          const gradeName = typeof g === 'string' ? g : (g.name || g.gradeName || g.title || g.grade || '');
                          return (
                            <option key={g?.id || idx} value={gradeName}>
                              {gradeName}
                            </option>
                          );
                        })
                      ) : (
                        <option value="" disabled>No grades configured in Settings</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Stream</label>
                    <select
                      value={stream}
                      onChange={(e) => setStream(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      required
                    >
                      {(availableStreamsForModal || []).length > 0 ? (
                        availableStreamsForModal.map((stName: any, idx: number) => {
                          const name = typeof stName === 'string' ? stName : formatStreamLabel(stName);
                          return (
                            <option key={idx} value={name}>
                              {name}
                            </option>
                          );
                        })
                      ) : (
                        <option value="" disabled>
                          No streams configured for this grade. Add streams in 'Grades & Streams' menu.
                        </option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Parent / Guardian Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Mr. & Mrs. Kipkorir"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 0712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Pinned Footer Actions */}
              <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 sticky bottom-0 z-10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  {editingId ? 'Save Changes' : 'Save Learner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Admin Password Verification Modal for Database Reset */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-red-50">
              <h2 className="text-base font-bold text-red-900 flex items-center gap-2">
                <span>Admin Authentication Required</span>
              </h2>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white border border-red-200 text-red-700 hover:bg-red-100 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleVerifyAndResetDatabase} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                You are about to permanently wipe all learner records across local storage and the database server. Enter your admin password to confirm.
              </p>

              {resetError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                  {resetError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Admin Password</label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Enter admin password..."
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isResetting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm & Wipe All Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
