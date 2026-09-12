import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { INITIAL_SEED_DATA } from '@/data/initialSeedData';

const StudentProfile = () => {
  const { id } = useParams<{ id: string }>();
  // ... existing state and handlers

  // Add birthCertificateNo to the student data structure
  const student = useMemo(() => {
    const found = INITIAL_SEED_DATA.students.find(s => s.id === id);
    if (!found) return INITIAL_SEED_DATA.students[0];
    // Ensure birthCertificateNo is included (fallback to undefined for legacy data)
    return {
      ...found,
      birthCertificateNo: (found as any).birthCertificateNo || undefined,
    };
  }, [id]);

  // ... rest of the component

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header with back button */}
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
        <div className="flex gap-2 overflow-x-auto shrink-0">
          <Button
            variant="outline"
            className="rounded-xl gap-2 border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={() => setIsHistoryModalOpen(true)}
          >
            <History size={18} /> View History
          </Button>
          <Button
            variant="outline"
            className="rounded-xl gap-2 border-rose-200 text-rose-600 hover:bg-rose-50"
            onClick={() => setIsTransferOpen(true)}
          >
            <UserX size={18} /> Transfer Student
          </Button>
        </div>
      </div>

      {/* Profile details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ... existing profile card ... */}

        {/* Add Birth Certificate No to the profile details section */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden text-center p-10">
            <div className="w-24 h-24 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-6">
              <UserCircle size={60} strokeWidth={1} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
            <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-6">ID: {student.admNo}</p>
            <div className="flex justify-center gap-2 mb-8">
              <Badge className="bg-indigo-600">{student.grade}</Badge>
              <Badge variant="outline">{student.stream}</Badge>
            </div>
            <div className="space-y-4 text-left border-t pt-8">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Hash size={16} className="text-slate-400" />
                <span>Assessment No: <strong>{student.admNo}</strong></span>
              </div>
              {(student as any).birthCertificateNo && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Hash size={16} className="text-slate-400" />
                  <span>Birth Cert No: <strong>{(student as any).birthCertificateNo}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Calendar size={16} className="text-slate-400" />
                <span>Born: {student.dob}</span>
              </div>
              {/* ... rest of contact info ... */}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};