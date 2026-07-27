"use client";

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  UserCircle, 
  Phone,
  GraduationCap,
  Plus,
  X,
  UserPlus
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { STUDENTS as initialStudents } from '@/lib/mock-data';
import { showSuccess } from '@/utils/toast';

const Students = () => {
  const [studentsList, setStudentsList] = useState(initialStudents);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const navigate = useNavigate();

  // Registration Form State
  const [fullName, setFullName] = useState("");
  const [assessmentNo, setAssessmentNo] = useState("");
  const [gradeLevel, setGradeLevel] = useState("4");
  const [stream, setStream] = useState("Blue");
  const [guardianName, setGuardianName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const filteredStudents = studentsList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.assessment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRegisterStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !assessmentNo.trim()) return;

    const newStudent = {
      id: (studentsList.length + 1).toString(),
      name: fullName.trim(),
      assessment: assessmentNo.trim().toUpperCase(),
      grade: gradeLevel,
      stream: stream,
      gender: "M",
      dob: "2014-01-01",
      guardian: guardianName.trim() || "Guardian",
      phone: phone.trim() || "+254 700 000 000",
      email: "guardian@email.com",
      health: "None",
      needs: "None"
    };

    setStudentsList([newStudent, ...studentsList]);
    setIsRegisterOpen(false);

    // Reset Form
    setFullName("");
    setAssessmentNo("");
    setGradeLevel("4");
    setStream("Blue");
    setGuardianName("");
    setPhone("");
    setAddress("");

    showSuccess(`Student ${newStudent.name} registered successfully!`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Student Directory</h1>
          <p className="text-muted-foreground">Manage and view detailed profiles of all enrolled learners.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl border-slate-200">
            Export CSV
          </Button>
          <Button 
            className="rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 gap-2 font-bold"
            onClick={() => setIsRegisterOpen(true)}
          >
            <Plus size={18} /> Add New Student
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search by name, ID or assessment number..." 
            className="pl-12 h-14 rounded-3xl border-none shadow-sm bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-14 px-6 rounded-3xl border-none shadow-sm bg-white gap-2 text-slate-600 font-bold">
          <Filter size={18} /> Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-white group overflow-hidden">
            <CardContent className="p-0">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                    <UserCircle size={40} strokeWidth={1.5} />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreVertical size={20} className="text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl p-2">
                      <Link to={`/students/${student.id}`}>
                        <DropdownMenuItem className="rounded-xl font-medium">View Profile</DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem 
                        className="rounded-xl font-medium"
                        onClick={() => navigate(`/students/${student.id}`)}
                      >
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="rounded-xl font-medium text-red-600"
                        onClick={() => {
                          setStudentsList(studentsList.filter(s => s.id !== student.id));
                          showSuccess(`${student.name} archived successfully`);
                        }}
                      >
                        Archive Student
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1 mb-6">
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">{student.name}</h3>
                  <p className="text-sm font-medium text-slate-500">ID: {student.assessment}</p>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none px-3 py-1 rounded-lg font-bold">
                    Grade {student.grade}
                  </Badge>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none px-3 py-1 rounded-lg font-bold">
                    {student.stream}
                  </Badge>
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone size={16} className="text-slate-400" />
                    <span>Guardian: {student.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <GraduationCap size={16} className="text-slate-400" />
                    <span>Joined: Jan 2023</span>
                  </div>
                </div>
              </div>
              
              <Link to={`/students/${student.id}`}>
                <div className="bg-slate-50/80 px-8 py-4 flex justify-between items-center group-hover:bg-indigo-600 group-hover:text-white transition-all cursor-pointer">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-100">View Full Profile</span>
                  <span className="text-xs font-bold text-emerald-600 group-hover:text-white flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:bg-white" /> Active
                  </span>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Student Registration Centered Modal */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="w-[92vw] sm:max-w-xl rounded-[2rem] p-6 sm:p-8 bg-white border-none shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-5 top-5 rounded-full h-9 w-9 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10"
            onClick={() => setIsRegisterOpen(false)}
          >
            <X size={18} />
          </Button>

          <DialogHeader className="pr-8">
            <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                <UserPlus size={22} />
              </div>
              Register New Student
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm mt-1">
              Fill in the learner's details to enroll them into the school registry.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegisterStudent} className="space-y-5 pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Full Name</Label>
                <Input 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  className="rounded-xl h-12 bg-slate-50/50 border-slate-200 focus:bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Assessment Number (KNEC)</Label>
                <Input 
                  value={assessmentNo}
                  onChange={(e) => setAssessmentNo(e.target.value)}
                  placeholder="e.g. A1002003"
                  required
                  className="rounded-xl h-12 uppercase bg-slate-50/50 border-slate-200 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Grade Level</Label>
                <Select value={gradeLevel} onValueChange={setGradeLevel}>
                  <SelectTrigger className="rounded-xl h-12 bg-slate-50/50 border-slate-200">
                    <SelectValue placeholder="Select Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PP1">PP1</SelectItem>
                    <SelectItem value="PP2">PP2</SelectItem>
                    {[1,2,3,4,5,6,7,8,9].map(n => (
                      <SelectItem key={n} value={n.toString()}>Grade {n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Stream</Label>
                <Select value={stream} onValueChange={setStream}>
                  <SelectTrigger className="rounded-xl h-12 bg-slate-50/50 border-slate-200">
                    <SelectValue placeholder="Select Stream" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Blue">Blue</SelectItem>
                    <SelectItem value="Green">Green</SelectItem>
                    <SelectItem value="Yellow">Yellow</SelectItem>
                    <SelectItem value="Alpha">Alpha</SelectItem>
                    <SelectItem value="Beta">Beta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Guardian Name</Label>
                <Input 
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="e.g. Samuel Kiptoo"
                  required
                  className="rounded-xl h-12 bg-slate-50/50 border-slate-200 focus:bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Phone Number</Label>
                <Input 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +254 712 345 678"
                  required
                  className="rounded-xl h-12 bg-slate-50/50 border-slate-200 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Physical Address / Location</Label>
              <Input 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Eldoret West"
                className="rounded-xl h-12 bg-slate-50/50 border-slate-200 focus:bg-white"
              />
            </div>

            <DialogFooter className="pt-4 flex flex-row gap-3 justify-end">
              <Button 
                type="button" 
                variant="ghost" 
                className="rounded-xl font-bold h-12 px-6 text-slate-600 hover:bg-slate-100"
                onClick={() => setIsRegisterOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold h-12 px-8 shadow-lg shadow-indigo-100 text-white"
              >
                Register Student
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Students;