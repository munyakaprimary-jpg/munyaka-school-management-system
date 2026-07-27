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
            className="rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 gap-2"
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
        <Button variant="outline" className="h-14 px-6 rounded-3xl border-none shadow-sm bg-white gap-2 text-slate-600">
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

      {/* Student Registration Modal */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="sm:max-w-xl rounded-3xl p-8 relative max-h-[90vh] overflow-y-auto">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 rounded-full h-8 w-8 text-slate-400 hover:text-slate-600"
            onClick={() => setIsRegisterOpen(false)}
          >
            <X size={16} />
          </Button>

          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <UserPlus className="text-indigo-600" size={24} />
              Register New Student
            </DialogTitle>
            <DialogDescription>
              Enter learner details to enroll them into the academic system.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegisterStudent} className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>Assessment Number (KNEC)</Label>
                <Input 
                  value={assessmentNo}
                  onChange={(e) => setAssessmentNo(e.target.value)}
                  placeholder="e.g. A1002003"
                  required
                  className="rounded-xl h-12 uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grade Level</Label>
                <Select value={gradeLevel} onValueChange={setGradeLevel}>
                  <SelectTrigger className="rounded-xl h-12">
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

              <div className="space-y-2">
                <Label>Stream</Label>
                <Select value={stream} onValueChange={setStream}>
                  <SelectTrigger className="rounded-xl h-12">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-2">
                <Label>Guardian Name</Label>
                <Input 
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="e.g. Samuel Kiptoo"
                  required
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +254 712 345 678"
                  required
                  className="rounded-xl h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Physical Address / Location</Label>
              <Input 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Eldoret West"
                className="rounded-xl h-12"
              />
            </div>

            <DialogFooter className="pt-4 flex gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                className="rounded-xl font-bold flex-1"
                onClick={() => setIsRegisterOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 flex-1 shadow-lg shadow-indigo-100"
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