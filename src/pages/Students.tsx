"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import BackButton from '@/components/ui/BackButton';
import { Search, Filter, MoreVertical, UserCircle, Phone, GraduationCap, Plus, UserPlus, UserX } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { STUDENTS as initialStudents } from '@/lib/mock-data';
import { showSuccess } from '@/utils/toast';
import { TransferStudent } from '@/types/transfer';

const Students = () => {
  const [studentsList, setStudentsList] = useState<TransferStudent[]>(initialStudents as TransferStudent[]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<TransferStudent | null>(null);
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
    const newStudent: TransferStudent = { 
      id: (studentsList.length + 1).toString(), 
      name: fullName.trim(), 
      assessment: assessmentNo.trim().toUpperCase(), 
      grade: gradeLevel, 
      stream: stream, 
      gender: "M", 
      dob: "2014-01-01", 
      admissionDate: "2019-01-15",
      guardian: guardianName.trim(), 
      phone: phone.trim(), 
      email: "g@email.com", 
      health: "None", 
      needs: "None",
      status: "Active",
      feeBalance: 0
    };
    setStudentsList([newStudent, ...studentsList]);
    setIsRegisterOpen(false);
    setFullName(""); setAssessmentNo(""); setGuardianName(""); setPhone("");
    showSuccess(`Student ${newStudent.name} registered!`);
  };

  const handleTransferStudent = (student: TransferStudent) => {
    setSelectedStudent(student);
    setIsTransferModalOpen(true);
  };

  const handleTransferSubmit = (transferData: any) => {
    if (selectedStudent) {
      const updatedStudent = { ...selectedStudent, status: 'Transferred' as const };
      setStudentsList(studentsList.map(s => s.id === selectedStudent.id ? updatedStudent : s));
      setIsTransferModalOpen(false);
      setSelectedStudent(null);
      showSuccess(`Transfer initiated for ${selectedStudent.name}. Clearance certificate generated.`);
    }
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
                    <DropdownMenuItem onClick={() => handleTransferStudent(student)}>Transfer Student</DropdownMenuItem>
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
                <Badge className={cn(
                  student.status === 'Active' 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : "bg-slate-100 text-slate-500 border-slate-200"
                )}>
                  {student.status}
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
          <div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><Label className="text-xs font-medium">Grade</Label><Select value={gradeLevel} onValueChange={setGradeLevel}><SelectTrigger className="rounded-lg h-10 text-sm"><SelectValue placeholder="Select Grade" /></SelectTrigger><SelectContent>{[1,2,3,4,5,6,7,8].map(n => <SelectItem key={n} value={n.toString()}>Grade {n}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label className="text-xs font-medium">Stream</Label><Select value={stream} onValueChange={setStream}><SelectTrigger className="rounded-lg h-10 text-sm"><SelectValue placeholder="Select Stream" /></SelectTrigger><SelectContent><SelectItem value="Blue">Blue</SelectItem><SelectItem value="Green">Green</SelectItem></SelectContent></Select></div></div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t"><div className="space-y-1.5"><Label className="text-xs font-medium">Guardian</Label><Input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Name" className="rounded-lg h-10 text-sm" /></div><div className="space-y-1.5"><Label className="text-xs font-medium">Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254" className="rounded-lg h-10 text-sm" /></div></div>
          <div className="space-y-1.5"><Label className="text-xs font-medium">Location</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Eldoret" className="rounded-lg h-10 text-sm" /></div>
        </div>
      </Modal>

      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Transfer Student" description="Initiate student transfer process with clearance requirements" footer={<><Button variant="ghost" className="rounded-lg h-10 px-4 text-sm font-medium" onClick={() => setIsTransferModalOpen(false)}>Cancel</Button><Button className="rounded-lg h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium gap-2" onClick={() => {}}><UserX size={16} /> Execute Transfer & Generate Certificate</Button></>} maxWidth="max-w-xl">
        <div className="space-y-4">
          {selectedStudent && (
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4">Student Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Student Name</p>
                  <p className="font-bold text-slate-900">{selectedStudent.name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Assessment ID</p>
                  <p className="font-bold text-slate-900">{selectedStudent.assessment}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current Grade</p>
                  <p className="font-bold text-slate-900">{selectedStudent.grade} - {selectedStudent.stream}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Admission Date</p>
                  <p className="font-bold text-slate-900">{selectedStudent.admissionDate}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date of Exit</Label>
              <Input type="date" className="rounded-lg h-12 bg-slate-50 border-slate-100" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Destination School</Label>
              <Input placeholder="e.g., St. Mary's School, Nairobi" className="rounded-lg h-12 bg-slate-50 border-slate-100" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reason for Transfer</Label>
              <Input placeholder="e.g., Family relocation, job transfer" className="rounded-lg h-12 bg-slate-50 border-slate-100" />
            </div>
          </div>

          <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="text-amber-600 shrink-0" size={24} />
              <h3 className="font-bold text-amber-800">Financial Clearance Status</h3>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-slate-700">Outstanding Fee Balance</p>
                <p className="text-2xl font-black text-amber-600">KES 3,000</p>
              </div>
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 rounded-lg font-bold">PENDING</Badge>
            </div>

            <div className="bg-amber-100/50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    Attention: This student has an outstanding fee balance of KES 3,000.
                  </p>
                  <p className="text-xs font-medium text-amber-700 mt-1">
                    Ensure clearance or settlement before issuing final documents.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Students;