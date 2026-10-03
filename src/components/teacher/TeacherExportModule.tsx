import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, CheckCircle2, ShieldCheck, Database, FileText, ArrowRight, School } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { downloadFile } from '@/services/downloadService';
import { readGradesAndStreams, getStreamsForGrade } from '@/services/gradesStreamsConfig';

export const TeacherExportModule: React.FC = () => {
  const { user } = useAuth();
  
  // Dynamically load grades and streams directly from Grades & Streams menu configuration
  const config = useMemo(() => readGradesAndStreams(), []);
  const grades = config.grades;
  const streams = useMemo(() => {
    return config.streams;
  }, [config]);

  // Initialize with teacher profile or default
  const [selectedGrade, setSelectedGrade] = useState<string>(() => {
    return user?.assignedClass || user?.grade || user?.class || grades[0] || 'Grade 1';
  });

  const availableStreams = useMemo(() => {
    const s = getStreamsForGrade(selectedGrade, config);
    return s.length > 0 ? s : config.streams;
  }, [selectedGrade, config]);

  const [selectedStream, setSelectedStream] = useState<string>(() => {
    return user?.assignedStream || user?.stream || availableStreams[0] || 'Green';
  });

  const [isExporting, setIsExporting] = useState(false);

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

  const handleExport = () => {
    setIsExporting(true);
    try {
      // Store the active selection override for metadata stamping
      localStorage.setItem('munyaka_temp_export_override', JSON.stringify({
        assignedClass: selectedGrade,
        assignedStream: selectedStream
      }));

      // Trigger standard class export stamped with the exact grade and stream
      // Generate package using downloadFile
      const packageData = {
        meta: {
          exportId: 'EXP-' + Date.now(),
          timestamp: new Date().toISOString(),
          assignedClass: selectedGrade,
          assignedStream: selectedStream,
          exportedBy: user?.name || user?.username || 'Teacher'
        },
        learners: JSON.parse(localStorage.getItem('school_learners_master') || localStorage.getItem('school_learners_data') || '[]'),
        assessments: JSON.parse(localStorage.getItem('munyaka_assessments') || '[]'),
        attendance: JSON.parse(localStorage.getItem('munyaka_attendance') || '[]')
      };

      await downloadFile({
        filename: `Class_Package_${selectedGrade}_${selectedStream}_${Date.now()}.json`,
        data: JSON.stringify(packageData, null, 2),
        mimeType: 'application/json',
        successMessage: `Class package for ${selectedGrade} ${selectedStream} downloaded successfully to Downloads folder!`
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
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
          Export your roll call, lesson logs, and CBC marks with verified metadata headers for Admin Harmonization.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-5">
        {/* Record count summaries */}
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

        {/* Interactive Grade & Stream Selectors */}
        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Teacher: {user?.name || 'Class Teacher'}</span>
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-mono">
              ID: {user?.staffId || user?.id || 'TCH-001'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Grade / Class
              </Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 font-bold text-xs text-slate-800">
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g} value={g} className="text-xs font-semibold">
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Stream
              </Label>
              <Select value={selectedStream} onValueChange={setSelectedStream}>
                <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 font-bold text-xs text-slate-800">
                  <SelectValue placeholder="Select Stream" />
                </SelectTrigger>
                <SelectContent>
                  {availableStreams.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs font-semibold">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
        >
          <Download size={16} />
          <span>{isExporting ? 'Packaging Records...' : `Export Class Package (${selectedGrade} · ${selectedStream})`}</span>
        </Button>
      </CardContent>
    </Card>
  );
};

export default TeacherExportModule;
