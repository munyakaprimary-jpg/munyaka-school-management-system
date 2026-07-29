"use client";

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import BackButton from '@/components/ui/BackButton';
import { Search, MoreVertical, UserCircle, Phone, GraduationCap, Plus, UserPlus, Download, Loader2, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { STUDENTS as initialStudents, GRADES_DATA } from '@/lib/mock-data';
import { showSuccess } from '@/utils/toast';

const Students = () => {
  const [studentsList, setStudentsList] = useState(initialStudents);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterStream, setFilterStream] = useState("all");
  
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();

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

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      showSuccess("No learners found for the current filters.");
      return;
    }

    setIsExporting(true);
    
    setTimeout(() => {
      const headers = ["Name", "Assessment No", "Grade", "Stream", "Guardian", "Phone"];
      const rows = filteredStudents.map(s => [
        s.name,
        s.assessment,
        `Grade ${s.grade}`,
        s.stream,
        s.guardian,
        s.phone
      ]);

      const csvContent = [
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Student Directory</h1>
            <p className="text-sm text-slate-500">Manage learner profiles and class allocations.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="h-10 px-4 rounded-lg border-slate-200 bg-white text-sm font-medium gap-2 shadow-sm"
            onClick={handleExportCSV}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Export CSV
          </Button>
          <Button className="h-10 px-4 rounded-lg shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium gap-2" onClick={() => setIsRegisterOpen(true)}>
            <Plus size={16} /> Add Student
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              placeholder="Search by name/ID..." 
              className="pl-9 h-10 rounded-lg border-slate-200 bg-slate-50/50" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          
          <Select value={filterGrade} onValueChange={setFilterGrade}>
            <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50/50">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grade Levels</SelectItem>
              {GRADES_DATA.map(g => (
                <SelectItem key={g.id} value={g.name.replace(/[^0-9]/g, '')}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStream} onValueChange={setFilterStream}>
            <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50/50">
              <SelectValue placeholder="All Streams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Streams</SelectItem>
              {uniqueStreams.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="ghost" 
            className="h-10 rounded-lg text-slate-500 hover:text-slate-900 gap-2 font-medium"
            onClick={clearFilters}
          >
            <X size={16} /> Clear Filters
          </Button>
        </div>
      </Card>

      {/* Compact Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <Card key={student.id} className="rounded-xl bg-white border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all group overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-11 h-11 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <UserCircle size={24} />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-lg text-xs font-medium">
                      <DropdownMenuItem onClick={() => navigate(`/students/${student.id}`)}>View Profile</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mb-3">
                  <h3 className="text-base font-bold text-slate-900 leading-tight truncate">{student.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">ID: {student.assessment}</p>
                </div>

                <div className="flex gap-1.5 mb-4">
                  <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-md font-semibold border-indigo-200 bg-indigo-50 text-indigo-700">
                    Grade {student.grade}
                  </Badge>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 rounded-md font-medium text-slate-600 bg-slate-100">
                    {student.stream} Stream
                  </Badge>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{student.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <GraduationCap size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">Guardian: {student.guardian}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <UserCircle size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No learners found</h3>
            <p className="text-sm text-slate-500">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} title="Register New Student" description="Enroll learner into the academic system." footer={<><Button variant="ghost" className="rounded-lg h-10 px-4 text-sm font-medium" onClick={() => setIsRegisterOpen(false)}>Cancel</Button><Button className="rounded-lg h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium gap-2" onClick={handleRegisterStudent}><UserPlus size={16} /> Register Student</Button></>} maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><Label className="text-xs font-medium">Full Name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="rounded-lg h-10 text-sm" /></div><div className="space-y-1.5"><Label className="text-xs font-medium">Assessment No.</Label><Input value={assessmentNo} onChange={(e) => setAssessmentNo(e.target.value)} placeholder="A100200" className="uppercase rounded-lg h-10 text-sm" /></div></div>
          <div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><Label className="text-xs font-medium">Grade</Label><Select value={regGrade} onValueChange={setRegGrade}><SelectTrigger className="rounded-lg h-10 text-sm"><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5,6,7,8].map(n => <SelectItem key={n} value={n.toString()}>Grade {n}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label className="text-xs font-medium">Stream</Label><Select value={regStream} onValueChange={setRegStream}><SelectTrigger className="rounded-lg h-10 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Blue">Blue</SelectItem><SelectItem value="Green">Green</SelectItem></SelectContent></Select></div></div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t"><div className="space-y-1.5"><Label className="text-xs font-medium">Guardian</Label><Input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Name" className="rounded-lg h-10 text-sm" /></div><div className="space-y-1.5"><Label className="text-xs font-medium">Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254" className="rounded-lg h-10 text-sm" /></div></div>
          <div className="space-y-1.5"><Label className="text-xs font-medium">Location</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Eldoret" className="rounded-lg h-10 text-sm" /></div>
        </div>
      </Modal>
    </div>
  );
};

export default Students;