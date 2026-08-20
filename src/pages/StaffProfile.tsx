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
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-3">
        <BackButton to="/staff" />
        <div>
          <h1 className="text-xl font-bold text-slate-900">{member.name}</h1>
          <p className="text-sm text-slate-500">Personnel record and academic assignments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          <Card className="border-none shadow-sm bg-white p-3 rounded-lg overflow-hidden text-center">
            <div className="w-12 h-12 rounded-3xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-3 text-2xl font-black shadow-xl">
              {member.name.split(' ').map(n => n[0]).join('')}
            </div>
            <h2 className="text-lg font-bold text-slate-900">{member.name}</h2>
            <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-2">{member.role}</p>
            <div className="flex justify-center gap-2 mb-3">
              <Badge className={member.status === 'Active' ? "bg-emerald-50 text-emerald-700 border-none" : "bg-slate-100 text-slate-500"}>
                {member.status}
              </Badge>
              <Badge variant="outline" className="border-slate-200">ID: {member.id_no}</Badge>
            </div>
            <div className="space-y-2 text-left text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <Calendar size={14} className="text-slate-400" />
                <span>Joined: {member.joined}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={14} className="text-slate-400" />
                <span>{member.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={14} className="text-slate-400" />
                <span>{member.email}</span>
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-sm bg-indigo-900 text-white p-3 rounded-lg">
            <div className="p-3">
              <p className="text-sm font-medium text-indigo-200">User has administrative access to assessment records.</p>
              <Button className="w-full bg-white/10 hover:bg-white/20 text-white border-none rounded-xl mt-2">
                Reset Credentials
              </Button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <Card className="border-none shadow-sm bg-white p-3 rounded-lg">
            <CardHeader className="px-3 pt-3 border-b pb-2 flex flex-row justify-between items-center">
              <CardTitle className="text-lg">Teaching Assignments</CardTitle>
              <Button variant="ghost" size="sm" className="text-indigo-600 font-bold">Edit Load</Button>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3 mb-2 text-indigo-500">
                    <Briefcase size={18} />
                    <h4 className="font-bold">Primary Learning Areas</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {member.subjects.map(s => (
                      <Badge key={s} className="bg-white text-slate-700 border-none shadow-sm text-[8px] uppercase tracking-widest">{s}</Badge>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3 mb-2 text-emerald-500">
                    <GraduationCap size={18} />
                    <h4 className="font-bold">Assigned Class</h4>
                  </div>
                  <p className="text-sm font-bold text-slate-900">Grade 4 - Blue Stream</p>
                  <p className="text-xs text-slate-500 mt-1">Total Learners: 42</p>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3 mb-2 text-emerald-500">
                  <GraduationCap size={18} />
                  <h4 className="font-bold">Assigned Class</h4>
                </div>
                <p className="text-sm font-bold text-slate-900">Grade 4 - Blue Stream</p>
                <p className="text-xs text-slate-500 mt-1">Total Learners: 42</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white p-3 rounded-lg">
            <CardHeader className="px-3 pt-3 border-b pb-2 flex flex-row justify-between items-center">
              <CardTitle className="text-lg">Compliance & Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {[
                { label: "Teaching Certificate (TSC)", status: "Verified", date: "Jan 2024" },
                { label: "Certificate of Good Conduct", status: "Verified", date: "Mar 2024" },
                { label: "Degree/Diploma Transcripts", status: "Verified", date: "Aug 2020" },
              ].map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 group hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-slate-400" />
                    <div>
                      <p className="text-sm font-bold text-slate-700">{doc.label}</p>
                      <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">{doc.date}</p>
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