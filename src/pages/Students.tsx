"use client";

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Search,
  Filter,
  MoreVertical,
  UserCircle,
  Phone,
  GraduationCap,
  Plus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STUDENTS } from '@/lib/mock-data';

const Students = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const { toast } = useToast();

  const filteredStudents = STUDENTS.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.assessment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddStudentOpen(false);
    toast({
      title: "Student Added",
      description: "The new student has been registered successfully.",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Student Directory</h1>
          <p className="text-muted-foreground">Manage and view detailed profiles of all enrolled learners.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl border-slate-200">
            Export CSV
          </Button>
          <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl shadow-lg shadow-indigo-100">
                <Plus size={18} className="mr-2" /> Add New Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px] rounded-3xl max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Register New Student</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddStudent} className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullname">Full Name</Label>
                      <Input id="fullname" placeholder="e.g. John Doe" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assessment">Assessment Number (KNEC)</Label>
                      <Input id="assessment" placeholder="e.g. 1002003004" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Grade Level</Label>
                      <Select required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pp1">PP1</SelectItem>
                          <SelectItem value="pp2">PP2</SelectItem>
                          {[1,2,3,4,5,6,7,8,9].map(n => (
                            <SelectItem key={n} value={n.toString()}>Grade {n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Stream</Label>
                      <Select required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Stream" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blue">Blue</SelectItem>
                          <SelectItem value="green">Green</SelectItem>
                          <SelectItem value="yellow">Yellow</SelectItem>
                          <SelectItem value="alpha">Alpha</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardian">Guardian Name</Label>
                    <Input id="guardian" placeholder="Full name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="e.g. 0712345678" required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Physical Address/Location</Label>
                    <Input id="address" placeholder="e.g. Eldoret West" />
                  </div>
                </div>
              </form>
              <div className="flex justify-end gap-3 pt-4 pb-2 border-t">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsAddStudentOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl px-8 shadow-lg shadow-primary/20" onClick={() => { handleAddStudent as any; setIsAddStudentOpen(false); }}>
                  Register Student
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                      <DropdownMenuItem className="rounded-xl font-medium">Edit Details</DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl font-medium text-red-600">Archive Student</DropdownMenuItem>
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
                    <span>Guardian: +254 712 *** ***</span>
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
    </div>
  );
};

export default Students;