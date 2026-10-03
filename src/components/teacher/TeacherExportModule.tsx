import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, CheckCircle2, ShieldCheck, Database, FileText, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { TeacherExportModal } from './TeacherExportModal';

export const TeacherExportModule: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch counts of teacher records in offline local state
  const attendanceCount = (() => {
    try {
      const records = JSON.parse(localStorage.getItem('munyaka_attendance_records') || '[]');
      return Array.isArray(records) ? records.length : 0;
    } catch {
      return 0;
    }
  })();

  const marksCount = (() => {
    try {
      const records = JSON.parse(localStorage.getItem('marked_student_submissions') || '[]');
      return Array.isArray(records) ? records.length : 0;
    } catch {
      return 0;
    }
  })();

  const checkInsCount = (() => {
    try {
      const records = JSON.parse(localStorage.getItem('munyaka_teacher_checkins') || '[]');
      return Array.isArray(records) ? records.length : 0;
    } catch {
      return 0;
    }
  })();

  return (
    <>
      <Card className="rounded-3xl border-slate-200 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 shadow-sm overflow-hidden font-sans">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 font-bold uppercase tracking-wider text-[10px]">
              Offline Batch Export
            </Badge>
            <ShieldCheck size={18} className="text-indigo-600" />
          </div>
          <CardTitle className="text-xl font-black text-slate-900 mt-2">
            Export Class Master Package
          </CardTitle>
          <CardDescription className="text-xs text-slate-600">
            Export your roll call, lesson logs, and CBC marks with signed metadata headers for Admin Harmonization.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-0 space-y-5">
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
            <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="block text-lg font-black text-indigo-700">{attendanceCount}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Roll Call</span>
            </div>
            <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="block text-lg font-black text-purple-700">{marksCount}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Marks</span>
            </div>
            <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="block text-lg font-black text-emerald-700">{checkInsCount}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Check-Ins</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-800">Teacher: {user?.name || 'Class Teacher'}</div>
              <div className="text-[11px] text-slate-400 font-mono">Slot: {user?.grade || user?.class || 'Grade 1'} · Stream: {user?.stream || 'North'}</div>
            </div>
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
          >
            <Download size={16} />
            <span>Export Class Package</span>
          </Button>
        </CardContent>
      </Card>

      <TeacherExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultGrade={user?.grade || user?.class || 'Grade 1'}
        defaultStream={user?.stream || 'North'}
      />
    </>
  );
};
