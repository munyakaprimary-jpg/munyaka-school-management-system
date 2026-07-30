"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackButton } from "@/components/ui/BackButton";
import { 
  UserCircle, 
  Mail, 
  Phone, 
  Calendar,
  FileText,
  CreditCard,
  ArrowLeft,
  History
} from 'lucide-react';
import { STUDENTS as initialStudents, GRADES_DATA } from '@/lib/mock-data';
import AcademicHistoryModal from '@/components/academic-history/AcademicHistoryModal';

const StudentProfile = () => {
  const student = STUDENTS[0]; 
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [locationLat, setLocationLat] = useState("");
  const [locationLng, setLocationLng] = useState("");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton to="/students" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{student.name}</h1>
            <p className="text-muted-foreground">Detailed learner profile and history.</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="rounded-xl gap-2 border-slate-200 text-slate-600 hover:bg-slate-50"
          onClick={() => setIsHistoryModalOpen(true)}
        >
          <History size={18} /> View History
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden text-center p-10">
            <div className="w-24 h-24 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-6">
              <UserCircle size={60} strokeWidth={1} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
            <p className="text-sm font-medium text-slate-400 mb-6">ID: {student.assessment}</p>
            <div className="flex justify-center gap-2 mb-8">
              <Badge className="bg-indigo-600">Grade {student.grade}</Badge>
              <Badge variant="outline">{student.stream}</Badge>
            </div>
            <div className="space-y-4 text-left border-t pt-8">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Calendar size={16} className="text-slate-400" />
                <span>Born: {student.dob}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone size={16} className="text-slate-400" />
                <span>{student.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail size={16} className="text-slate-400" />
                <span>{student.email}</span>
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
            <CardTitle className="text-lg mb-6">Quick Stats</CardTitle>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Attendance</span>
                <span className="text-sm font-bold text-emerald-600">96%</span>
              </div>
              <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[96%]" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Assessments</span>
                <span className="text-sm font-bold text-indigo-600">Exceeding</span>
              </div>
              <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full w-[85%]" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
            <CardTitle className="text-lg mb-6">Quick Stats</CardTitle>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Attendance</span>
                <span className="text-sm font-bold text-emerald-600">96%</span>
              </div>
              <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[96%]" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Assessments</span>
                <span className="text-sm font-bold text-indigo-600">Exceeding</span>
              </div>
              <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full w-[85%]" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
            <CardTitle className="text-lg mb-6">Location</CardTitle>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Latitude</Label>
              <Input 
                type="text" 
                value={locationLat} 
                onChange={(e) => setLocationLat(e.target.value)} 
                placeholder="e.g. 0.0" 
                className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
              />
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Longitude</Label>
                <Input 
                  type="text" 
                  value={locationLng} 
                  onChange={(e) => setLocationLng(e.target.value)} 
                  placeholder="e.g. 36.8" 
                  className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                <CreditCard size={24} />
              </div>
              <CardTitle className="text-lg">Fee Balance</CardTitle>
            </div>
            <p className="text-3xl font-black text-slate-900 mb-2">KES 3,000</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Total Term Fee: KES 15,000</p>
            <Button className="w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800">Record Payment</Button>
          </Card>

          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <FileText size={24} />
              </div>
              <CardTitle className="text-lg">Documents</CardTitle>
            </div>
            <div className="space-y-3">
              <Button variant="ghost" className="w-full justify-between rounded-xl h-12 bg-slate-50 border-none group">
                <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Term 3 2023 Report</span>
                <ArrowLeft size={16} className="rotate-180 text-slate-300" />
              </Button>
              <Button variant="ghost" className="w-full justify-between rounded-xl h-12 bg-slate-50 border-none group">
                <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Birth Certificate</span>
                <ArrowLeft size={16} className="rotate-180 text-slate-300" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Academic History Modal */}
      <AcademicHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        studentId={student.id}
        studentName={student.name}
      />
    </div>
  );
};

export default StudentProfile;