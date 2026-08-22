import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from "@/components/ui/Modal";
import BackButton from "@/components/ui/BackButton";
import { Search, Plus, UserPlus, Download, Loader2, X, Eye, Trash2, Lock, AlertCircle, History, UserX, Edit3 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from "@/lib/utils";
import { sortGrades } from '@/utils/gradeSort';

// 1. Declare all state variables at the VERY TOP of the component
const [filterGrade, setFilterGrade] = useState(() => 'all');
const [filterStream, setFilterStream] = useState(() => 'all');
const [searchTerm, setSearchTerm] = useState('');
const [students, setStudents] = useState(() => {
  try {
    const raw = localStorage.getItem('munyaka_students') || localStorage.getItem('munyaka_learners');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
});

// 2. Derive/Filter data AFTER all state variables are fully declared
const filteredStudents = useMemo(() => {
  if (!Array.isArray(students)) return [];
  return students.filter((student: any) => {
    const matchSearch = !searchTerm || 
      (student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.admNo && student.admNo.toString().includes(searchTerm));
    const matchGrade = !filterGrade || filterGrade === 'all' || student.class === filterGrade || student.grade === filterGrade;
    const matchStream = !filterStream || filterStream === 'all' || student.stream === filterStream;
    return matchSearch && matchGrade && matchStream;
  });
}, [students, searchTerm, filterGrade, filterStream]);

// Other state declarations
const [isRegisterOpen, setIsRegisterOpen] = useState(false);
const [isExporting, setIsExporting] = useState(false);
const navigate = useNavigate();

// Admin Auth Deletion State
const [isAuthOpen, setIsAuthOpen] = useState(false);
const [authPassword, setAuthPassword] = useState("");
const [authError, setAuthError] = useState("");
const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string } | null>(null);

// History and Transfer Modals State
const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
const [isTransferOpen, setIsTransferOpen] = useState(false);
const [isEditOpen, setIsEditOpen] = useState(false);
const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

// Registration Form State
const [fullName, setFullName] = useState("");
const [assessmentNo, setAssessmentNo] = useState("");
const [regGrade, setRegGrade] = useState("");
const [regStream, setRegStream] = useState("");
const [guardianName, setGuardianName] = useState("");
const [phone, setPhone] = useState("");
const [address, setAddress] = useState("");

// Edit Form State
const [editId, setEditId] = useState("");
const [editFullName, setEditFullName] = useState("");
const [editAssessmentNo, setEditAssessmentNo] = useState("");
const [editGrade, setEditGrade] = useState("");
const [editStream, setEditStream] = useState("");
const [editGuardianName, setEditGuardianName] = useState("");
const [editPhone, setEditPhone] = useState("");

// Get dynamic grades list from localStorage ('munyaka_grades') or GRADES_DATA
const gradesList = useMemo(() => {
  const savedGrades = localStorage.getItem('munyaka_grades');
  let list = [...students].map((s: any) => ({ name: s.grade || s.gradeLevel || 'Grade 1', id: s.id || s.id_no || String(s.id) }));
  if (savedGrades) {
    try {
      list = JSON.parse(savedGrades);
    } catch (e) {
      console.error(e);
    }
  }
  return sortGrades(list);
}, [students]);

// Precompute the numeric string from the filterGrade for efficient comparison
const filterGradeNumber = useMemo(() => {
  if (filterGrade === "all" || !filterGrade) return null;
  const match = filterGrade.match(/\d+/);
  return match ? match[0] : null;
}, [filterGrade]);

// Dynamically get streams for the selected grade
const availableStreams = useMemo(() => {
  if (!regGrade) return [];
  const grade = gradesList.find((g: any) => g.name.toLowerCase() === `grade ${regGrade.toLowerCase()}` || g.name.toLowerCase() === regGrade.toLowerCase() || g.id === regGrade);
  return grade ? grade.streams.map((s: any) => s.name) : [];
}, [regGrade, gradesList]);

// Reset stream when grade changes and no longer matches available streams
useEffect(() => {
  if (regStream && availableStreams.length > 0 && !availableStreams.includes(regStream)) {
    setRegStream(availableStreams[0]);
  }
}, [regGrade, availableStreams, regGrade]);

// Get unique streams for the filter dropdown (case-insensitive deduplication, Title Case display)
const uniqueStreams = useMemo(() => {
  const streams = new Set<string>();
  gradesList.forEach((g: any) => g.streams.forEach((s: any) => {
    if (s.name) streams.add(s.name.trim().toLowerCase());
  }));
  return Array.from(streams)
    .map(stream => stream.replace(/(^\w|-\w)/g, c => c.toUpperCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'accent' }));
}, [gradesList]);

const [filterGrade2, setFilterGrade2] = useState('all'); // duplicate maybe remove
const [filterStream2, setFilterStream2] = useState('all'); // duplicate maybe remove

// Use safe filtered students
const finalFilteredStudents = useMemo(() => filteredStudents, [filteredStudents]);

const handleRegisterStudent = () => {
  if (!fullName.trim() || !assessmentNo.trim() || !regGrade || !regStream) return;
  const newStudent = {
    id: (students.length + 1).toString(),
    name: fullName.trim(),
    assessment: assessmentNo.trim().toUpperCase(),
    grade: regGrade,
    stream: regStream,
    gender: "M",
    dob: "2014-01-01",
    guardian: guardianName.trim(),
    phone: phone.trim(),
    email: "g@email.com",
    health: "None",
    needs: "None",
    feeBalance: 0,
    status: "Active" as const,
    dateOfAdmission: "2020-01-15",
    coCurricularActivities: ""
  };
  setStudents([newStudent, ...students]);
  setIsRegisterOpen(false);
  setFullName("");
  setAssessmentNo("");
  setRegGrade("");
  setRegStream("");
  setGuardianName("");
  setPhone("");
  setAddress("");
  showSuccess(`Student ${newStudent.name} registered!`);
};

const handleEditStudent = (student: any) => {
  setEditId(student.id);
  setEditFullName(student.name);
  setEditAssessmentNo(student.assessment);
  setEditGrade(student.grade);
  setEditStream(student.stream);
  setEditGuardianName(student.guardian || "");
  setEditPhone(student.phone || "");
  setIsEditOpen(true);
};

const handleUpdateStudent = () => {
  if (!editFullName.trim() || !editAssessmentNo.trim() || !editGrade || !editStream) return;
  const updatedList = students.map((s: any) => {
    if (s.id === editId) {
      return {
        ...s,
        name: editFullName.trim(),
        assessment: editAssessmentNo.trim().toUpperCase(),
        grade: editGrade,
        stream: editStream,
        guardian: editGuardianName.trim(),
        phone: editPhone.trim()
      };
    }
    return s;
  });
  setStudents(updatedList);
  setIsEditOpen(false);
  showSuccess(`Student "${editFullName}" updated successfully!`);
};

const requestDeleteStudent = (student: { id: string; name: string }) => {
  setStudentToDelete(student);
  setAuthPassword("");
  setAuthError("");
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
    if (studentToDelete) {
      setStudents(prev => prev.filter((s: any) => s.id !== studentToDelete.id));
      showSuccess(`Student "${studentToDelete.name}" deleted successfully.`);
    }
    setIsAuthOpen(false);
    setStudentToDelete(null);
  } else {
    setAuthError("Invalid admin password");
    showError("Authorization failed");
  }
  setIsVerifying(false);
};

const handleViewHistory = (student: any) => {
  setSelectedStudent(student);
  setIsHistoryModalOpen(true);
};

const handleTransferStudent = (student: any) => {
  const studentWithTransferInfo: any = {
    id: student.id,
    name: student.name,
    assessment: student.assessment,
    grade: student.grade,
    stream: student.stream,
    gender: student.gender,
    dob: student.dob,
    guardian: student.guardian,
    phone: student.phone,
    email: student.email,
    health: student.health,
    needs: student.needs,
    feeBalance: student.feeBalance || 0,
    status: student.status || 'Active',
    dateOfAdmission: student.dateOfAdmission || '2020-01-15',
    coCurricularActivities: student.coCurricularActivities || '',
    examType: student.examType || 'Regular'
  };
  setSelectedStudent(studentWithTransferInfo);
  setIsTransferOpen(true);
};

const handleExportCSV = () => {
  const filtered = finalFilteredStudents;
  if (filtered.length === 0) {
    showSuccess("No learners found for the current filters.");
    return;
  }

  setIsExporting(true);

  setTimeout(() => {
    const row1 = "MUNYAKA PRIMARY AND JUNIOR SCHOOL";
    const row2 = "P.O. Box 5239-30100,ELDORET";
    const row3 = "MOTTO: KNOWLEDGE POWER";

    const activeGrade = filterGrade !== "all" ? filterGrade : "All Grades";
    const activeStream = filterStream !== "all" ? filterStream : "All Streams";
    const activeTerm = "Term 1";

    const row4 = `GRADE ${activeGrade}, STREAM ${activeStream}, YEAR ${new Date().getFullYear()}, TERM ${activeTerm}`;

    const headers = ["Name", "Assessment No.", "Grade", "Stream", "Guardian", "Phone"];
    const rows = filtered.map(s => [
      `"${s.name.replace(/\"/g, '\"\"')}"`,
      `"${s.assessment.replace(/\"/g, '\"\"')}"`,
      `\"Grade ${s.grade}\"`,
      `"${s.stream.replace(/\"/g, '\"\"')}"`,
      `"${s.guardian.replace(/\"/g, '\"\"')}"`,
      `"${s.phone.replace(/\"/g, '\"\"')}"`
    ]);

    const csvContent = [row1, row2, row3, row4, "", headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const fileName = filterGrade !== "all" || filterStream !== "all"
      ? `learners_${filterGrade !== "all" ? 'grade_' + filterGrade.replace(/\s+/g, '_') : ''}${filterStream !== "all" ? '_stream_' + filterStream : ''}.csv`
      : `all_learners_${new Date().toISOString().split('T')[0]}.csv`;

    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExporting(false);
    showSuccess(`Exported ${filtered.length} learners to CSV`);
  }, 800);
};

const clearFilters = () => {
  setSearchTerm("");
  setFilterGrade("all");
  setFilterStream("all");
};

// Render
return (
  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 action-bar">
      <div className="flex items-center gap-3">
        <BackButton fallback="/" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Student Directory</h1>
          <p className="text-muted-foreground">Manage learner profiles and class allocations.</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="h-11 px-6 rounded-2xl border-slate-200 bg-white text-sm font-bold gap-2 shadow-sm hover:bg-slate-50 transition-colors"
          onClick={handleExportCSV}
          disabled={isExporting}
        >
          {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
          Export CSV
        </Button>
        <Button className="h-11 px-6 rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold gap-2 transition-all active:scale-95" onClick={() => setIsRegisterOpen(true)}>
          <Plus size={18} /> Add Student
        </Button>
      </div>
    </div>

    <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Search by name/ID..."
            className="pl-11 h-12 rounded-2xl border-none bg-slate-50 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Grade</Label>
          <Select value={filterGrade} onValueChange={setFilterGrade}>
            <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-700">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Grade Levels</SelectItem>
              {gradesList.map((g: any) => (
                <SelectItem key={g.id} value={g.name}>
                  {g.name}
                </SelectItem>
              ))
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Stream</Label>
          <Select value={filterStream} onValueChange={setFilterStream}>
            <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-700">
              <SelectValue placeholder="All Streams" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Streams</SelectItem>
              {uniqueStreams.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="ghost"
          className="h-12 rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 gap-2 font-bold transition-colors"
          onClick={clearFilters}
        >
          <X size={18} /> Clear Filters
        </Button>
      </div>
    </Card>

    <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
      <CardHeader className="p-8 border-b flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Learner Master List</CardTitle>
          <p className="text-sm text-slate-500 font-medium">Tabular view for bulk student management.</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold px-4 py-1.5 rounded-xl">
          {finalFilteredStudents.length} Active Records
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 bg-slate-50/50 border-b">
              <tr>
                <th className="whitespace-nowrap text-xs p-2">Learner Name</th>
                <th className="whitespace-nowrap text-xs p-2">Assessment ID</th>
                <th className="whitespace-nowrap text-xs p-2">Class Level</th>
                <th className="whitespace-nowrap text-xs p-2">Stream</th>
                <th className="whitespace-nowrap text-xs p-2">Guardian Contact</th>
                <th className="whitespace-nowrap text-xs p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {finalFilteredStudents.length > 0 ? (
                finalFilteredStudents.map((student: any) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="text-xs font-medium whitespace-nowrap p-2 min-w-[120px]">
                      <p className="text-xs font-medium whitespace-nowrap">{student.name}</p>
                    </td>
                    <td className="whitespace-nowrap text-xs p-2">
                      <code className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-lg uppercase">{student.assessment}</code>
                    </td>
                    <td className="whitespace-nowrap text-xs p-2">
                      <span className="font-bold text-slate-700">Grade {student.grade}</span>
                    </td>
                    <td className="whitespace-nowrap text-xs p-2">
                      <Badge variant="outline" className="text-[10px] whitespace-nowrap rounded-lg border-slate-200 text-slate-600 font-bold">
                        {student.stream}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap text-xs p-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{student.phone}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{student.guardian}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-xs p-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            handleViewHistory(student);
                          }}
                          title="View History"
                        >
                          <History size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            handleEditStudent(student);
                          }}
                          title="Edit Student"
                        >
                          <Edit3 size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            handleTransferStudent(student);
                          }}
                          title="Transfer Student"
                        >
                          <UserX size={18} className="text-rose-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          onClick={() => requestDeleteStudent({ id: student.id, name: student.name })}
                          title="Delete Record"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Search size={32} className="text-slate-200" />
                      <p className="text-slate-500 font-bold">No records match the current criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Register New Student Modal - Dynamically linked to Grades & Streams */}
      <Modal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} title="Register New Student" description="Enroll learner into the academic system." footer={<><Button variant="ghost" className="rounded-xl h-12 px-6 font-bold" onClick={() => setIsRegisterOpen(false)}>Cancel</Button><Button className="rounded-xl h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black gap-2 shadow-lg shadow-indigo-100" onClick={handleRegisterStudent}><UserPlus size={18} /> Register Student</Button></>} maxWidth="max-w-xl">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Full Name</Label>
              <Input value={fullName} onChange={(e: any) => setFullName(e.target.value)} placeholder="John Doe" className="rounded-xl h-12 bg-slate-50 border-none font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Assessment No.</Label>
              <Input value={assessmentNo} onChange={(e: any) => setAssessmentNo(e.target.value)} placeholder="A100200" className="uppercase rounded-xl h-12 bg-slate-50 border-none font-bold" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Grade Level</Label>
              <Select value={regGrade} onValueChange={(val: any) => { setRegGrade(val); setRegStream(''); }}>
                <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {gradesList.map((g: any) => (
                    <SelectItem key={g.id} value={g.name}>
                      {g.name} ({g.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Stream</Label>
              <Select value={regStream} onValueChange={setRegStream} disabled={!regGrade || availableStreams.length === 0}>
                <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder={!regGrade ? "Select grade first..." : availableStreams.length === 0 ? "No streams available" : "Choose stream..."} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {availableStreams.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Guardian Name</Label>
              <Input value={guardianName} onChange={(e: any) => setGuardianName(e.target.value)} placeholder="Name" className="rounded-xl h-12 bg-slate-50 border-none font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Phone</Label>
              <Input value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="+254" className="rounded-xl h-12 bg-slate-50 border-none font-bold" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Physical Location</Label>
            <Input value={address} onChange={(e: any) => setAddress(e.target.value)} placeholder="Eldoret" className="rounded-xl h-12 bg-slate-50 border-none font-bold" />
          </div>
        </div>
      </Modal>

      {/* Edit Student Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Student Record" description="Modify learner details in the academic system." footer={<><Button variant="ghost" className="rounded-xl h-12 px-6 font-bold" onClick={() => setIsEditOpen(false)}>Cancel</Button><Button className="rounded-xl h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black gap-2 shadow-lg shadow-indigo-100" onClick={handleUpdateStudent}><Edit3 size={18} /> Save Changes</Button></>} maxWidth="max-w-xl">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Full Name</Label>
              <Input value={editFullName} onChange={(e: any) => setEditFullName(e.target.value)} placeholder="John Doe" className="rounded-xl h-12 bg-slate-50 border-none font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Assessment No.</Label>
              <Input value={editAssessmentNo} onChange={(e: any) => setEditAssessmentNo(e.target.value)} placeholder="A100200" className="uppercase rounded-xl h-12 bg-slate-50 border-none font-bold" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Grade Level</Label>
              <Select value={editGrade} onValueChange={(val: any) => { setEditGrade(val); setEditStream(''); }}>
                <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {gradesList.map((g: any) => (
                    <SelectItem key={g.id} value={g.name}>
                      {g.name} ({g.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Stream</Label>
              <Select value={editStream} onValueChange={setEditStream} disabled={!editGrade || editAvailableStreams.length === 0}>
                <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder={!editGrade ? "Select grade first..." : editAvailableStreams.length === 0 ? "No streams available" : "Choose stream..."} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {editAvailableStreams.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Guardian Name</Label>
              <Input value={editGuardianName} onChange={(e: any) => setEditGuardianName(e.target.value)} placeholder="Name" className="rounded-xl h-12 bg-slate-50 border-none font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Phone</Label>
              <Input value={editPhone} onChange={(e: any) => setEditPhone(e.target.value)} placeholder="+254" className="rounded-xl h-12 bg-slate-50 border-none font-bold" />
            </div>
          </div>
        </div>
      </Modal>

      {/* Admin Verification Modal for Deletion */}
      <Modal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        title="Admin Authorization Required"
        description={`Enter your admin password to delete learner record for "${studentToDelete?.name}".`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAuthOpen(false)} className="rounded-xl font-bold">Cancel</Button>
            <Button
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-8"
              onClick={handleVerifyAuth}
              disabled={isVerifying}
            >
              {isVerifying ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Authorize Delete
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
                onChange={(e: any) => { setAuthPassword(e.target.value); setAuthError(""); }}
                placeholder="••••••••"
                className="pl-10 rounded-xl h-12 bg-slate-50 border-none font-bold"
                autoFocus
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Academic History Modal */}
      <AcademicHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} studentId={selectedStudent?.id || ''} studentName={selectedStudent?.name || ''} />

      {/* Transfer Workflow Modal */}
      <TransferWorkflow isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} student={selectedStudent as any} onTransferComplete={(studentId: any, certificateNumber: any) => {
        setIsTransferOpen(false);
        setSelectedStudent(null);
        showSuccess(`Transfer completed! Certificate ${certificateNumber} generated.`);
      }} />
    </div>
  );
};

export default Students;