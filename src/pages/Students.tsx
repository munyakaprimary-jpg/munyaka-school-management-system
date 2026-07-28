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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-slate-900">Student Directory</h1><p className="text-muted-foreground">Manage learner profiles.</p></div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl border-slate-200">Export CSV</Button>
          <Button className="rounded-2xl shadow-lg bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={() => setIsRegisterOpen(true)}><Plus size={18} /> Add Student</Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><Input placeholder="Search students..." className="pl-12 h-14 rounded-3xl border-none shadow-sm bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
        <Button variant="outline" className="h-14 px-6 rounded-3xl border-none shadow-sm bg-white gap-2"><Filter size={18} /> Filters</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="rounded-[2rem] bg-white group overflow-hidden">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6"><div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors"><UserCircle size={40} /></div>
                <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical size={20} /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => navigate(`/students/${student.id}`)}>View Profile</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
              </div>
              <h3 className="text-xl font-bold text-slate-900 leading-tight mb-1">{student.name}</h3>
              <p className="text-sm font-medium text-slate-500 mb-6">ID: {student.assessment}</p>
              <div className="flex gap-2 mb-8"><Badge>Grade {student.grade}</Badge><Badge variant="secondary">{student.stream}</Badge></div>
              <div className="pt-6 border-t border-slate-50 space-y-3"><div className="flex items-center gap-3 text-sm text-slate-600"><Phone size={16} /> <span>{student.phone}</span></div><div className="flex items-center gap-3 text-sm text-slate-600"><GraduationCap size={16} /> <span>Joined: 2023</span></div></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} title="Register New Student" description="Enroll learner into the academic system." footer={<><Button variant="ghost" onClick={() => setIsRegisterOpen(false)}>Cancel</Button><Button onClick={handleRegisterStudent}><UserPlus size={16} className="mr-2" /> Register Student</Button></>} maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Full Name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" /></div><div className="space-y-2"><Label>Assessment No.</Label><Input value={assessmentNo} onChange={(e) => setAssessmentNo(e.target.value)} placeholder="A100200" className="uppercase" /></div></div>
          <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Grade</Label><Select value={gradeLevel} onValueChange={setGradeLevel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5,6,7,8].map(n => <SelectItem key={n} value={n.toString()}>Grade {n}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Stream</Label><Select value={stream} onValueChange={setStream}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Blue">Blue</SelectItem><SelectItem value="Green">Green</SelectItem></SelectContent></Select></div></div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t"><div className="space-y-2"><Label>Guardian</Label><Input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Name" /></div><div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254" /></div></div>
          <div className="space-y-2"><Label>Location</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Eldoret" /></div>
        </div>
      </Modal>
    </div>
  );
};

export default Students;