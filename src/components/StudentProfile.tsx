import React, { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserCircle, Hash, Calendar } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";

interface SeedStudent {
  id: string;
  name: string;
  admNo: string;
  assessmentNo?: string;
  birthCertificateNo?: string;
  dob?: string;
  grade: string;
  stream: string;
  gender: string;
  guardian: string;
  phone: string;
  status?: string;
  schoolId?: string;
}

const StudentProfile = () => {
  const { id } = useParams<{ id: string }>();

  // ── Read the active learner from localStorage (the single source of truth).
  // No seed data fallback — if the ID isn't in localStorage the empty state
  // is shown instead of silently rendering a phantom student.
  const student = useMemo<SeedStudent | null>(() => {
    if (!id) return null;
    try {
      const raw = localStorage.getItem('school_learners_data');
      if (!raw) return null;
      const parsed: SeedStudent[] = JSON.parse(raw);
      const found = parsed.find(s => s.id === id || s.admNo === id);
      if (!found) return null;
      return {
        ...found,
        birthCertificateNo: (found as any).birthCertificateNo,
        dob: (found as any).dob,
      };
    } catch {
      return null;
    }
  }, [id]);

  if (!student) {
    return (
      <div className="w-full max-w-full overflow-x-hidden px-4 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3">
          <Link to="/students" className="rounded-2xl h-10 w-10 text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all shrink-0 flex items-center justify-center">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Learner Not Found</h1>
            <p className="text-sm text-slate-500">No learner with ID <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">{id}</code> exists in the school roster.</p>
          </div>
        </div>
        <Card className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <UserCircle size={48} className="text-slate-300" />
            </div>
            <p className="font-bold text-slate-700">This learner record does not exist.</p>
            <p className="text-sm text-slate-500">The student may have been removed or the ID is incorrect.</p>
            <Link to="/students">
              <Button className="mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                Back to Learners
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row w-full items-start md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-3 w-full min-w-0">
          <Link to="/students" className="rounded-2xl h-10 w-10 text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all shrink-0 flex items-center justify-center">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-slate-900 truncate break-words whitespace-nowrap">{student.name}</h1>
            <p className="text-sm font-medium text-slate-600 truncate break-words whitespace-nowrap">Detailed learner profile and history</p>
          </div>
        </div>
      </div>

      {/* Profile card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden text-center p-10">
            <div className="w-24 h-24 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-6">
              <UserCircle size={60} strokeWidth={1} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
            <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-6">
              {student.admNo || student.id}
            </p>
            <div className="flex justify-center gap-2 mb-8">
              <Badge className="bg-indigo-600">{student.grade}</Badge>
              <Badge variant="outline">{student.stream}</Badge>
            </div>
            <div className="space-y-4 text-left border-t pt-8">
              {student.assessmentNo && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Hash size={16} className="text-slate-400" />
                  <span>Assessment No: <strong>{student.assessmentNo}</strong></span>
                </div>
              )}
              {student.birthCertificateNo && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Hash size={16} className="text-slate-400" />
                  <span>Birth Cert No: <strong>{student.birthCertificateNo}</strong></span>
                </div>
              )}
              {student.dob && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Calendar size={16} className="text-slate-400" />
                  <span>Born: <strong>{student.dob}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span>Gender: <strong>{student.gender}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span>Guardian: <strong>{student.guardian}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span>Phone: <strong>{student.phone}</strong></span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
