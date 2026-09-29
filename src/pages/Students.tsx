import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import BackButton from '@/components/ui/BackButton';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Lock, 
  AlertCircle, 
  Loader2, 
  FileSpreadsheet, 
  ArrowUpDown,
  UserCheck
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { readGradesAndStreams } from '@/services/gradesStreamsConfig';

const STUDENTS_STORAGE_KEY = 'munyaka_students';
const CENTRAL_DB_KEY = 'munyaka_central_db';
const API_BASE_URL = '/api';

const generateAdmissionNumber = (grade: string) => {
  const match = grade.match(/(\d+)/);
  const num = match ? match[1] : '1';
  const randomSeq = Math.floor(1000 + Math.random() * 9000);
  return `Mny/${num}/${randomSeq}`;
};

export default function Students() {
  const [students, setStudents] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const central = localStorage.getItem(CENTRAL_DB_KEY);
      if (central) {
        const parsedCentral = JSON.parse(central);
        if (Array.isArray(parsedCentral.students) && parsedCentral.students.length > 0) {
          return parsedCentral.students;
        }
      }
    } catch {}
    return [
      {
        id: 's-101',
        name: 'Amina Kiprop',
        fullName: 'Amina Kiprop',
        admissionNumber: 'Mny/6/4821',
        admNo: 'Mny/6/4821',
        assessmentNo: 'ASS-827361',
        gender: 'Female',
        dateOfBirth: '2013-05-14',
        dob: '2013-05-14',
        grade: 'Grade 6',
        class: 'Grade 6',
        stream: 'BLUE',
        parentName: 'Sarah Kiprop',
        guardian: 'Sarah Kiprop',
        phoneNumber: '+254 712 345 678',
        parentPhone: '+254 712 345 678'
      },
      {
        id: 's-102',
        name: 'Brian Omondi',
        fullName: 'Brian Omondi',
        admissionNumber: 'Mny/6/9132',
        admNo: 'Mny/6/9132',
        assessmentNo: 'ASS-827362',
        gender: 'Male',
        dateOfBirth: '2013-11-22',
        dob: '2013-11-22',
        grade: 'Grade 6',
        class: 'Grade 6',
        stream: 'BLUE',
        parentName: 'James Omondi',
        guardian: 'James Omondi',
        phoneNumber: '+254 722 987 654',
        parentPhone: '+254 722 987 654'
      }
    ];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [streamFilter, setStreamFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<any | null>(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [assessmentNumber, setAssessmentNumber] = useState('');
  const [grade, setGrade] = useState('Grade 6');
  const [stream, setStream] = useState('BLUE');
  const [gender, setGender] = useState('Female');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [parentName, setParentName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Synchronized scroll refs for the table
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const tableContentRef = useRef<HTMLTableElement>(null);
  const [tableWidth, setTableWidth] = useState(1050);

  useEffect(() => {
    if (tableContentRef.current) {
      setTableWidth(tableContentRef.current.scrollWidth || 1050);
    }
  }, [students, gradeFilter, streamFilter, searchTerm]);

  const handleTopScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      if (tableScrollRef.current.scrollLeft !== topScrollRef.current.scrollLeft) {
        tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
      }
    }
  };

  const handleTableScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      if (topScrollRef.current.scrollLeft !== tableScrollRef.current.scrollLeft) {
        topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
      }
    }
  };

  // Dynamic grades & streams config
  const gradesConfig = useMemo(() => readGradesAndStreams(), []);
  const availableGrades = gradesConfig.grades.length > 0 ? gradesConfig.grades : ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
  const availableStreams = gradesConfig.streams.length > 0 ? gradesConfig.streams : ['BLUE', 'RED', 'GREEN', 'YELLOW'];

  // Persist students
  useEffect(() => {
    try {
      localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
    } catch {}
  }, [students]);

  const resetForm = () => {
    setEditingId(null);
    setFullName('');
    setAdmissionNumber('');
    setAssessmentNumber('');
    setGrade('Grade 6');
    setStream('BLUE');
    setGender('Female');
    setDateOfBirth('');
    setParentName('');
    setPhoneNumber('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditClick = (student: any) => {
    setEditingId(student.id || student.admissionNumber);
    setFullName(student.name || student.fullName || '');
    setAdmissionNumber(student.admissionNumber || student.admNo || '');
    setAssessmentNumber(student.assessmentNo || student.assessmentNumber || '');
    setGrade(student.grade || student.class || 'Grade 6');
    setStream(student.stream || 'BLUE');
    setGender(student.gender || 'Female');
    setDateOfBirth(student.dateOfBirth || student.dob || student.birthDate || '');
    setParentName(student.parentName || student.guardian || '');
    setPhoneNumber(student.parentPhone || student.phoneNumber || student.phone || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showError("Please enter full name.");
      return;
    }

    setIsSaving(true);
    try {
      const studentData = {
        id: editingId || `learner-${Date.now()}`,
        name: fullName.trim(),
        fullName: fullName.trim(),
        admissionNumber: admissionNumber || generateAdmissionNumber(grade),
        admNo: admissionNumber || generateAdmissionNumber(grade),
        assessmentNo: assessmentNumber.trim(),
        dateOfBirth: dateOfBirth,
        dob: dateOfBirth,
        birthDate: dateOfBirth,
        gender,
        grade,
        class: grade,
        stream,
        parentName: parentName.trim(),
        guardian: parentName.trim(),
        phoneNumber: phoneNumber.trim(),
        parentPhone: phoneNumber.trim(),
        phone: phoneNumber.trim(),
        updatedAt: new Date().toISOString()
      };

      let updated = [];
      if (editingId) {
        updated = students.map(s => (s.id === editingId || s.admissionNumber === admissionNumber) ? { ...s, ...studentData } : s);
        showSuccess("Learner record updated successfully!");
      } else {
        updated = [studentData, ...students];
        showSuccess("Learner registered successfully!");
      }

      setStudents(updated);

      try {
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updated));
        const centralData = JSON.parse(localStorage.getItem(CENTRAL_DB_KEY) || '{}');
        centralData.students = updated;
        localStorage.setItem(CENTRAL_DB_KEY, JSON.stringify(centralData));
        window.dispatchEvent(new CustomEvent('central-data-updated', { detail: { students: updated } }));
      } catch {}

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      showError("Failed to save learner record.");
    } finally {
      setIsSaving(false);
    }
  };

  const requestDelete = (student: any) => {
    setPendingDelete(student);
    setAuthPassword('');
    setAuthError('');
    setIsAuthOpen(true);
  };

  const handleVerifyAuth = async () => {
    if (!authPassword) {
      setAuthError("Password is required");
      return;
    }

    setIsVerifying(true);
    await new Promise(r => setTimeout(r, 600));
    const currentAdminPass = localStorage.getItem('munyaka_admin_pass') || 'munyaka5239';

    if (authPassword === currentAdminPass) {
      if (pendingDelete) {
        const targetId = pendingDelete.id || pendingDelete.admissionNumber;
        const updated = students.filter(s => (s.id || s.admissionNumber) !== targetId);
        setStudents(updated);
        try {
          localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        showSuccess("Learner deleted successfully.");
      }
      setIsAuthOpen(false);
      setPendingDelete(null);
    } else {
      setAuthError("Invalid admin password");
      showError("Authorization failed");
    }
    setIsVerifying(false);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const name = (s.name || s.fullName || '').toLowerCase();
      const adm = (s.admissionNumber || s.admNo || '').toLowerCase();
      const ass = (s.assessmentNo || s.assessmentNumber || '').toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase()) || adm.includes(searchTerm.toLowerCase()) || ass.includes(searchTerm.toLowerCase());
      
      const sGrade = s.grade || s.class || '';
      const matchesGrade = gradeFilter === 'all' || sGrade.toLowerCase() === gradeFilter.toLowerCase();

      const sStream = s.stream || '';
      const matchesStream = streamFilter === 'all' || sStream.toLowerCase() === streamFilter.toLowerCase();

      const sGender = s.gender || '';
      const matchesGender = genderFilter === 'all' || sGender.toLowerCase() === genderFilter.toLowerCase();

      return matchesSearch && matchesGrade && matchesStream && matchesGender;
    });
  }, [students, searchTerm, gradeFilter, streamFilter, genderFilter]);

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-3 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header action bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton parentPath="/" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Learners Directory</h1>
            <p className="text-xs sm:text-sm text-slate-500">Manage student enrollment, personal details, and records.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleOpenAdd}
            className="rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 gap-2 font-bold text-xs sm:text-sm"
          >
            <Plus size={18} /> Add Learner
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <Card className="border-none shadow-sm rounded-2xl bg-white p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, admission, assessment..."
              className="pl-10 rounded-xl h-11 text-xs font-medium border-slate-200"
            />
          </div>
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="rounded-xl h-11 text-xs font-medium border-slate-200">
              <SelectValue placeholder="Filter Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {availableGrades.map(g => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={streamFilter} onValueChange={setStreamFilter}>
            <SelectTrigger className="rounded-xl h-11 text-xs font-medium border-slate-200">
              <SelectValue placeholder="Filter Stream" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Streams</SelectItem>
              {availableStreams.map(st => (
                <SelectItem key={st} value={st}>{st}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="rounded-xl h-11 text-xs font-medium border-slate-200">
              <SelectValue placeholder="Filter Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Learners Table Container with Top Horizontal Scrollbar */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-700 text-base">No learner records found.</p>
            <p className="text-xs text-slate-400 mt-1">Click <strong>+ Add Learner</strong> to register a new student.</p>
          </div>
        ) : (
          <div>
            {/* Top Synchronized Horizontal Scrollbar */}
            <div
              ref={topScrollRef}
              onScroll={handleTopScroll}
              className="overflow-x-auto overflow-y-hidden bg-slate-100/90 border-b border-slate-200 scrollbar-thin scrollbar-thumb-slate-300"
              style={{ height: '14px' }}
            >
              <div style={{ width: `${Math.max(tableWidth, 980)}px`, height: '1px' }} />
            </div>

            <div
              ref={tableScrollRef}
              onScroll={handleTableScroll}
              className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300"
            >
              <table ref={tableContentRef} className="w-full text-left border-collapse min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-tight">
                    <th className="px-2.5 py-2 text-left whitespace-nowrap">ADMISSION NO.</th>
                    <th className="px-2.5 py-2 text-left whitespace-nowrap">ASSESSMENT NO.</th>
                    <th className="px-2.5 py-2 text-left">FULL NAME</th>
                    <th className="px-2.5 py-2 text-left whitespace-nowrap">GRADE & STREAM</th>
                    <th className="px-2.5 py-2 text-left whitespace-nowrap">GENDER</th>
                    <th className="px-2.5 py-2 text-left whitespace-nowrap">DOB</th>
                    <th className="px-2.5 py-2 text-left">PARENT / GUARDIAN</th>
                    <th className="px-2.5 py-2 text-left whitespace-nowrap">PHONE NUMBER</th>
                    <th className="px-2.5 py-2 text-right whitespace-nowrap">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredStudents.map((student, idx) => {
                    const sId = student.id || student.admissionNumber || student.admNo || idx;
                    const sName = student.name || student.fullName || 'Unnamed Learner';
                    const sAdm = student.admissionNumber || student.admNo || '—';
                    const sAss = student.assessmentNo || student.assessmentNumber || student.assessment || student.assNo || '—';
                    const sGender = student.gender || 'Male';
                    const sDobRaw = student.dateOfBirth || student.dob || student.birthDate || '';
                    let sDob = '—';
                    if (sDobRaw) {
                      try {
                        const cleanDate = sDobRaw.includes('T') ? sDobRaw.split('T')[0] : sDobRaw;
                        const parts = cleanDate.split('-');
                        if (parts.length === 3 && parts[0].length === 4) {
                          const [yyyy, mm, dd] = parts;
                          const dateObj = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
                          if (!isNaN(dateObj.getTime())) {
                            sDob = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                          } else {
                            sDob = cleanDate;
                          }
                        } else {
                          const d = new Date(sDobRaw);
                          if (!isNaN(d.getTime())) {
                            sDob = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                          } else {
                            sDob = sDobRaw;
                          }
                        }
                      } catch {
                        sDob = sDobRaw;
                      }
                    }
                    const sParent = student.parentName || student.guardian || '—';
                    const sPhone = student.parentPhone || student.phoneNumber || student.phone || '—';
                    const sStreamRaw = student.stream || 'BLUE';
                    const sStream = /North|South|East|West/i.test(sStreamRaw) ? 'BLUE' : sStreamRaw;

                    return (
                      <tr key={sId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-2.5 py-2 font-mono text-[11px] font-semibold text-indigo-600 whitespace-nowrap">{sAdm}</td>
                        <td className="px-2.5 py-2 font-mono text-[11px] text-slate-500 whitespace-nowrap">{sAss}</td>
                        <td className="px-2.5 py-2 font-bold text-slate-900 truncate max-w-[150px]" title={sName}>
                          <Link to={`/students/${sId}`} className="hover:text-indigo-600 transition-colors">
                            {sName}
                          </Link>
                        </td>
                        <td className="px-2.5 py-2 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {student.grade || student.class} ({sStream})
                          </span>
                        </td>
                        <td className="px-2.5 py-2 text-slate-700 whitespace-nowrap">{sGender}</td>
                        <td className="px-2.5 py-2 font-mono text-slate-600 whitespace-nowrap">{sDob}</td>
                        <td className="px-2.5 py-2 text-slate-700 truncate max-w-[130px]" title={sParent}>{sParent}</td>
                        <td className="px-2.5 py-2 font-mono text-slate-700 whitespace-nowrap">{sPhone}</td>
                        <td className="px-2.5 py-2 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditClick(student)}
                              className="p-1 hover:bg-indigo-50 rounded text-indigo-600 transition-colors"
                              title="Edit Learner"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => requestDelete(student)}
                              className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors"
                              title="Delete Learner"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Learner Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Learner Record' : 'Register New Learner'}
        description="Enter learner particulars, grade assignment, and parent contact details."
        footer={
          <>
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100"
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              {editingId ? 'Save Changes' : 'Register Learner'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 uppercase">Full Name *</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Doe"
              className="rounded-xl h-12 border-slate-200"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase">Admission Number</Label>
              <Input
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
                placeholder="Leave blank to auto-generate"
                className="rounded-xl h-12 border-slate-200 font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase">Assessment Number</Label>
              <Input
                value={assessmentNumber}
                onChange={(e) => setAssessmentNumber(e.target.value)}
                placeholder="e.g. ASS-827361"
                className="rounded-xl h-12 border-slate-200 font-mono text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase">Grade Level</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="rounded-xl h-12 border-slate-200">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {availableGrades.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase">Stream</Label>
              <Select value={stream} onValueChange={setStream}>
                <SelectTrigger className="rounded-xl h-12 border-slate-200">
                  <SelectValue placeholder="Select stream" />
                </SelectTrigger>
                <SelectContent>
                  {availableStreams.map(st => (
                    <SelectItem key={st} value={st}>{st}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="rounded-xl h-12 border-slate-200">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 uppercase">Date of Birth</Label>
            <Input
              type="date"
              name="dateOfBirth"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="rounded-xl h-12 border-slate-200"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase">Parent / Guardian Name</Label>
              <Input
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Parent full name"
                className="rounded-xl h-12 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase">Phone Number</Label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+254 700 000 000"
                className="rounded-xl h-12 border-slate-200 font-mono text-xs"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Admin Password Verification Modal */}
      <Modal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        title="Admin Verification"
        description="Please enter the admin password to confirm deletion of this learner record."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAuthOpen(false)} className="rounded-xl font-bold flex-1">Cancel</Button>
            <Button
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex-1"
              onClick={handleVerifyAuth}
              disabled={isVerifying}
            >
              {isVerifying ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Confirm Delete
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {authError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold animate-in slide-in-from-top-2">
              <AlertCircle size={14} /> {authError}
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Admin Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                type="password"
                value={authPassword}
                onChange={(e) => { setAuthPassword(e.target.value); if (authError) setAuthError(''); }}
                placeholder="••••••••"
                className="pl-10 rounded-xl h-12 bg-slate-50 border-none font-bold"
                autoFocus
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
