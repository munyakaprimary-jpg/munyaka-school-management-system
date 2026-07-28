"use client";

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { Search, Filter, MoreVertical, UserCircle, Phone, GraduationCap, Plus, UserPlus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { STUDENTS as initialStudents } from '@/lib/mock-data';
import { showSuccess } from '@/utils/toast';

const Students = () => {
  const [studentsList, setStudentsList] = useState(initialStudents);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [assessmentNo, setAssessmentNo] = useState("");
  const [gradeLevel, setGradeLevel] = useState("4");
  const [stream, setStream] = useState("Blue");
  const [guardianName, setGuardianName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const filteredStudents = studentsList.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.assessment.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleRegisterStudent = () => {
    if (!fullName.trim() || !assessmentNo.trim()) return;
    const newStudent = { id: (studentsList.length + 1).toString(), name: fullName.trim(), assessment: assessmentNo.trim().toUpperCase(), grade: gradeLevel, stream: stream, gender: "M", dob: "2014-01-01", guardian: guardianName.trim(), phone: phone.trim(), email: "g@email.com", health: "None", needs: "None" };
    setStudentsList([newStudent, ...studentsList]);
    setIsRegisterOpen(false);
    setFullName(""); setAssessmentNo(""); setGuardianName(""); setPhone("");
    showSuccess(`Student ${newStudent.name} registered!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Student Directory</h1>
          <p className="text-sm text-slate-500">Manage learner profiles and class allocations.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-10 px-4 rounded-lg border-slate-200 bg-white text-sm font-medium">Export CSV</Button>
          <Button className="h-10 px-4 rounded-lg shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium gap-2" onClick={() => setIsRegisterOpen(true)}>
            <Plus size={16} /> Add Student
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input placeholder="Search students by name or assessment no..." className="pl-9 h-10 rounded-lg border-slate-200 shadow-sm bg-white text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Button variant="outline" className="h-10 px-4 rounded-lg border-slate-200 bg-white gap-2 text-sm text-slate-700">
          <Filter size={16} /> Filters
        </Button>
      </div>

      {/* Compact Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredStudents.map((student) => (
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
        ))}
      </div>

      <Modal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} title="Register New Student" description="Enroll learner into the academic system." footer={<><Button variant="ghost" className="rounded-lg h-10 px-4 text-sm font-medium" onClick={() => setIsRegisterOpen(false)}>Cancel</Button><Button className="rounded-lg h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium gap-2" onClick={handleRegisterStudent}><UserPlus size={16} /> Register Student</Button></>} maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><Label className="text-xs font-medium">Full Name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="rounded-lg h-10 text-sm" /></div><div className="space-y-1.5"><Label className="text-xs font-medium">Assessment No.</Label><Input value={assessmentNo} onChange={(e) => setAssessmentNo(e.target.value)} placeholder="A100200" className="uppercase rounded-lg h-10 text-sm" /></div></div>
          <div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><Label className="text-xs font-medium">Grade</Label><Select value={gradeLevel} onValueChange={setGradeLevel}><SelectTrigger className="rounded-lg h-10 text-sm"><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5,6,7,8].map(n => <SelectItem key={n} value={n.toString()}>Grade {n}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label className="text-xs font-medium">Stream</Label><Select value={stream} onValueChange={setStream}><SelectTrigger className="rounded-lg h-10 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Blue">Blue</SelectItem><SelectItem value="Green">Green</SelectItem></SelectContent></Select></div></div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t"><div className="space-y-1.5"><Label className="text-xs font-medium">Guardian</Label><Input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Name" className="rounded-lg h-10 text-sm" /></div><div className="space-y-1.5"><Label className="text-xs font-medium">Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254" className="rounded-lg h-10 text-sm" /></div></div>
          <div className="space-y-1.5"><Label className="text-xs font-medium">Location</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Eldoret" className="rounded-lg h-10 text-sm" /></div>
        </div>
      </Modal>
    </div>
  );
};

export default Students;