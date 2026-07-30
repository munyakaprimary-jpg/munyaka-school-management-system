"use client";

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import BackButton from '@/components/ui/BackButton';
import { Search, Plus, UserPlus, Download, Loader2, X, Eye, Trash2, Lock, AlertCircle } from 'lucide-react';
import { STUDENTS as initialStudents, GRADES_DATA } from '@/lib/mock-data';
import { showSuccess, showError } from '@/utils/toast';

const Students = () => {
  const [studentsList, setStudentsList] = useState(initialStudents);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterStream, setFilterStream] = useState("all");
  
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();

  // Admin Auth Deletion State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string } | null>(null);

  // Registration Form State
  const [fullName, setFullName] = useState("");
  const [assessmentNo, setAssessmentNo] = useState("");
  const [regGrade, setRegGrade] = useState("4");
  const [regStream, setRegStream] = useState("Blue");
  const [guardianName, setGuardianName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Get unique streams for the filter dropdown
  const uniqueStreams = useMemo(() => {
    const streams = new Set<string>();
    GRADES_DATA.forEach(g => g.streams.forEach(s => streams.add(s.name)));
    return Array.from(streams).sort();
  }, []);

  const filteredStudents = useMemo(() => {
    return studentsList.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           s.assessment.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = filterGrade === "all" || s.grade === filterGrade;
      const matchesStream = filterStream === "all" || s.stream === filterStream;
      return matchesSearch && matchesGrade && matchesStream;
    });
  }, [studentsList, searchTerm, filterGrade, filterStream]);

  const handleRegisterStudent = () => {
    if (!fullName.trim() || !assessmentNo.trim()) return;
    const newStudent = { 
      id: (studentsList.length + 1).toString(), 
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
      needs: "None" 
    };
    setStudentsList([newStudent, ...studentsList]);
    setIsRegisterOpen(false);
    setFullName(""); setAssessmentNo(""); setGuardianName(""); setPhone("");
    showSuccess(`Student ${newStudent.name} registered!`);
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

    const currentAdminPass = localStorage.getItem('munyaka_admin_pass') || 'admin123';

    if (authPassword === currentAdminPass) {
      if (studentToDelete) {
        setStudentsList(prev => prev.filter(s => s.id !== studentToDelete.id));
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

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      showSuccess("No learners found for the current filters.");
      return;
    }

    setIsExporting(true);
    
    setTimeout(() => {
      const row1 = "MUNYAKA PRIMARY AND JUNIOR SCHOOL";
      const row2 = "P.O. BOX 5239-30100,ELDORET";
      const row3 = "MOTTO: KNOWLEDGE POWER";
      
      const activeGrade = filterGrade !== "all" ? `Grade ${filterGrade}` : "All Grades";
      const activeStream = filterStream !== "all" ? filterStream : "All Streams";
      const activeTerm = "Term 1";

      const row4 = `GRADE ${activeGrade}, STREAM ${activeStream}, YEAR ${new Date().getFullYear()}, TERM ${activeTerm}`;

      const headers = ["Name", "Assessment No", "Grade", "Stream", "Guardian", "Phone"];
      const rows = filteredStudents.map(s => [
        `"${s.name.replace(/"/g, '""')}"`,
        `"${s.assessment.replace(/"/g, '""')}"`,
        `"Grade ${s.grade}"`,
        `"${s.stream.replace(/"/g, '""')}"`,
        `"${s.guardian.replace(/"/g, '""')}"`,
        `"${s.phone.replace(/"/g, '""')}"`
      ]);

      const csvContent = [
        row1,
        row2,
        row3,
        row4,
        "",
        headers.join(","),
        ...rows.map(r => r.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      
      const fileName = filterGrade !== "all" || filterStream !== "all" 
        ? `learners_${filterGrade !== "all" ? 'grade_' + filterGrade : ''}${filterStream !== "all" ? '_stream_' + filterStream : ''}.csv`
        : `all_learners_${new Date().toISOString().split('T')[0]}.csv`;

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsExporting(false);
      showSuccess(`Exported ${filteredStudents.length} learners to CSV`);
    }, 800);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterGrade("all");
    setFilterStream("all");
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

      {/* Filters Card */}
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
              <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">All Grade Levels</SelectItem>
                {GRADES_DATA.map(g => (
                  <SelectItem key={g.id} value={g.name.replace(/[^0-9]/g, '')}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Stream</Label>
            <Select value={filterStream} onValueChange={setFilterStream}>
              <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder="All Streams" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
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

      {/* Learners Table Section */}
      <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
        <CardHeader className="p-8 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Learner Master List</CardTitle>
            <p className="text-sm text-slate-500 font-medium">Tabular view for bulk student management.</p>
          </div>
          <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold px-4 py-1.5 rounded-xl">
            {filteredStudents.length} Active Records
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-slate-500 bg-slate-50/50 border-b">
                <tr>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Learner Name</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Assessment ID</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Class Level</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Stream</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Guardian Contact</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{student.name}</p>
                    </td>
                    <td className="px-8 py-5">
                      <code className="text-xs font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-lg uppercase">{student.assessment}</code>
                    </td>
                    <td className="px-8 py-5">
                      <span className="font-bold text-slate-700">Grade {student.grade}</span>
                    </td>
                    <td className="px-8 py-5">
                      <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-600 font-bold">
                        {student.stream}
                      </Badge>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{student.phone}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{student.guardian}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          onClick={() => navigate(`/students/${student.id}`)}
                          title="View Profile"
                        >
                          <Eye size={18} />
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
                ))}
                {filteredStudents.length === 0 && (
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
        </CardContent>
      </Card>

      {/* Register Modal */}
      <Modal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} title="Register New Student" description="Enroll learner into the academic system." footer={<><Button variant="ghost" className="rounded-xl h-12 px-6 font-bold" onClick={() => setIsRegisterOpen(false)}>Cancel</Button><Button className="rounded-xl h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black gap-2 shadow-lg shadow-indigo-100" onClick={handleRegisterStudent}><UserPlus size={18} /> Register Student</Button></>} maxWidth="max-w-xl">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="rounded-xl h-12 bg-slate-50 border-none font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Assessment No.</Label>
              <Input value={assessmentNo} onChange={(e) => setAssessmentNo(e.target.value)} placeholder="A100200" className="uppercase rounded-xl h-12 bg-slate-50 border-none font-bold" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Grade Level</Label>
              <Select value={regGrade} onValueChange={setRegGrade}>
                <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {[1,2,3,4,5,6,7,8].map(n => <SelectItem key={n} value={n.toString()}>Grade {n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Stream</Label>
              <Select value={regStream} onValueChange={setRegStream}>
                <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Blue">Blue</SelectItem>
                  <SelectItem value="Green">Green</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Guardian Name</Label>
              <Input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Name" className="rounded-xl h-12 bg-slate-50 border-none font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254" className="rounded-xl h-12 bg-slate-50 border-none font-bold" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Physical Location</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Eldoret" className="rounded-xl h-12 bg-slate-50 border-none font-bold" />
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
                onChange={(e) => { setAuthPassword(e.target.value); setAuthError(""); }} 
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
};

export default Students;