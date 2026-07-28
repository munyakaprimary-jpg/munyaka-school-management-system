"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BackButton from '@/components/ui/BackButton';
import { 
  Mail, 
  Phone, 
  Calendar,
  Briefcase,
  GraduationCap,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { STAFF } from '@/lib/mock-data';

const StaffProfile = () => {
  const member = STAFF[0]; 

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-3">
        <BackButton to="/staff" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{member.name}</h1>
          <p className="text-muted-foreground">Personnel record and academic assignments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden text-center p-10">
            <div className="w-24 h-24 rounded-3xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-6 text-3xl font-black shadow-xl shadow-indigo-100">
              {member.name.split(' ').map(n => n[0]).join('')}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{member.name}</h2>
            <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-6">{member.role}</p>
            <div className="flex justify-center gap-2 mb-8">
              <Badge className={member.status === 'Active' ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : "bg-slate-100 text-slate-500"}>
                {member.status}
              </Badge>
              <Badge variant="outline" className="border-slate-200">ID: {member.id_no}</Badge>
            </div>
            <div className="space-y-4 text-left border-t pt-8">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Calendar size={16} className="text-slate-400" />
                <span>Joined: {member.joined}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone size={16} className="text-slate-400" />
                <span>{member.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail size={16} className="text-slate-400" />
                <span>{member.email}</span>
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-[2rem] bg-indigo-900 text-white p-8 overflow-hidden relative">
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
              <ShieldCheck size={140} />
            </div>
            <CardTitle className="text-lg mb-4">Account Security</CardTitle>
            <p className="text-sm text-indigo-200 mb-6">User has administrative access to assessment records.</p>
            <Button className="w-full bg-white/10 hover:bg-white/20 text-white border-none rounded-xl">
              Reset Credentials
            </Button>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="px-8 pt-8 border-b pb-4 flex flex-row justify-between items-center">
              <CardTitle className="text-lg">Teaching Assignments</CardTitle>
              <Button variant="ghost" size="sm" className="text-indigo-600 font-bold">Edit Load</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3 mb-4 text-indigo-600">
                    <Briefcase size={20} />
                    <h4 className="font-bold">Primary Learning Areas</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {member.subjects.map(s => (
                      <Badge key={s} className="bg-white text-slate-700 border-none shadow-sm">{s}</Badge>
                    ))}
                  </div>
                </div>
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3 mb-4 text-emerald-600">
                    <GraduationCap size={20} />
                    <h4 className="font-bold">Assigned Class</h4>
                  </div>
                  <p className="text-sm font-bold text-slate-900">Grade 4 - Blue Stream</p>
                  <p className="text-xs text-slate-500 mt-1">Total Learners: 42</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="px-8 pt-8 border-b pb-4">
              <CardTitle className="text-lg">Compliance & Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {[
                { label: "Teaching Certificate (TSC)", status: "Verified", date: "Jan 2024" },
                { label: "Certificate of Good Conduct", status: "Verified", date: "Mar 2024" },
                { label: "Degree/Diploma Transcripts", status: "Verified", date: "Aug 2020" },
              ].map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 group hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-slate-400" />
                    <div>
                      <p className="text-sm font-bold text-slate-700">{doc.label}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{doc.date}</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-600 border-none">
                    {doc.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;