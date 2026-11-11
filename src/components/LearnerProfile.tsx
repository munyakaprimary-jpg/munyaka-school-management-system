import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserCircle, Hash, Calendar, Shield, BookOpen, Award } from 'lucide-react';
import { Link, useParams, useLocation } from 'react-router-dom';

const LearnerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  // Robust learner resolution from router state, munyaka_learners_directory, and fallback keys
  const learner = useMemo(() => {
    // 1. Check router state first
    const stateLearner = (location.state as any)?.learner;
    if (stateLearner) {
      return stateLearner;
    }

    try {
      const keys = ['munyaka_learners_directory', 'munyaka_learners_v2', 'munyaka_learners', 'school_learners_data'];
      let allLearners: any[] = [];
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              allLearners = parsed;
              break;
            }
          } catch {}
        }
      }

      // Find by id, admissionNo, admNo, or assessmentNo
      const found = allLearners.find((l: any) => {
        if (!l) return false;
        const lId = String(l.id || '').trim();
        const lAdm = String(l.admissionNo || l.admissionNumber || l.admNo || '').trim();
        const paramId = String(id || '').trim();
        return lId === paramId || lAdm === paramId || lId.toLowerCase() === paramId.toLowerCase() || lAdm.toLowerCase() === paramId.toLowerCase();
      });

      if (found) return found;

      if (allLearners.length > 0 && allLearners[0]) {
        return allLearners[0];
      }

      return {
        id: id || 'unknown',
        fullName: 'Unknown Learner',
        admissionNo: id || '—',
        grade: 'Grade',
        stream: 'Stream'
      };
    } catch {
      return {
        id: id || 'unknown',
        fullName: 'Unknown Learner',
        admissionNo: id || '—',
        grade: 'Grade',
        stream: 'Stream'
      };
    }
  }, [id, location.state]);

  // Robust property normalizations as requested
  const learnerName = learner?.fullName || learner?.name || learner?.studentName || `${learner?.firstName || ''} ${learner?.lastName || ''}`.trim() || 'Unknown Learner';
  const admissionNo = learner?.admissionNo || learner?.admissionNumber || learner?.admNo || learner?.id || id || '—';
  const gradeStream = `${learner?.grade || learner?.class || 'Grade'} • ${learner?.stream || 'Stream'}`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row w-full items-start md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4 w-full min-w-0">
          <Link to="/learners" className="rounded-2xl h-11 w-11 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-950/30 dark:hover:text-teal-400 active:scale-95 transition-all shrink-0 flex items-center justify-center">
            <ArrowLeft size={22} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white truncate">{learnerName}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs text-teal-700 dark:text-teal-400 font-bold">{admissionNo}</span>
              <span>•</span>
              <span>{gradeStream}</span>
              <span>•</span>
              <span className="capitalize">{learner?.gender || 'Student'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Card: Summary & ID details */}
        <div className="space-y-6">
          <Card className="border-none shadow-md rounded-[2rem] bg-white dark:bg-slate-900 overflow-hidden text-center p-8 border border-slate-200/80 dark:border-slate-800">
            <div className="w-24 h-24 rounded-3xl bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <UserCircle size={56} strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">{learnerName}</h2>
            <p className="text-xs font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mt-1 mb-6">
              Admission: {admissionNo}
            </p>
            <div className="flex justify-center gap-2 mb-8">
              <Badge className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-3 py-1 rounded-xl">{learner?.grade || learner?.class || 'Grade'}</Badge>
              <Badge variant="outline" className="border-slate-200 dark:border-slate-700 font-bold px-3 py-1 rounded-xl">{learner?.stream || 'Stream'}</Badge>
            </div>

            <div className="space-y-4 text-left border-t border-slate-100 dark:border-slate-800 pt-6">
              {(learner?.assessmentNo || learner?.assessmentNumber) && (
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-2"><Hash size={16} className="text-slate-400" /> Assessment No:</span>
                  <strong className="text-slate-900 dark:text-white font-mono">{learner?.assessmentNo || learner?.assessmentNumber}</strong>
                </div>
              )}
              {(learner?.birthCertificateNo || learner?.birthCertNo) && (
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-2"><Hash size={16} className="text-slate-400" /> Birth Cert:</span>
                  <strong className="text-slate-900 dark:text-white font-mono">{learner?.birthCertificateNo || learner?.birthCertNo}</strong>
                </div>
              )}
              {learner?.dob && (
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-2"><Calendar size={16} className="text-slate-400" /> Date of Birth:</span>
                  <strong className="text-slate-900 dark:text-white">{learner?.dob}</strong>
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-2"><Shield size={16} className="text-slate-400" /> Gender:</span>
                <strong className="text-slate-900 dark:text-white capitalize">{learner?.gender || 'Not specified'}</strong>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>Guardian:</span>
                <strong className="text-slate-900 dark:text-white">{learner?.guardian || learner?.parentName || learner?.guardianName || 'Parent / Guardian'}</strong>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>Phone:</span>
                <strong className="text-slate-900 dark:text-white font-mono">{learner?.phone || learner?.guardianPhone || learner?.parentPhone || '—'}</strong>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Card: Academic Performance & Assessments */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-md rounded-[2rem] bg-white dark:bg-slate-900 p-8 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Academic Ledger & Competency Progress</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">CBC competency strands and formative evaluations</p>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold">Active Enrolled</Badge>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">Mathematics Learning Area</p>
                  <p className="text-xs text-slate-500 mt-0.5">Numbers, Measurement, Geometry</p>
                </div>
                <span className="px-3 py-1 bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 rounded-xl font-bold text-xs">Exceeding Expectation (EE)</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">English Language Activities</p>
                  <p className="text-xs text-slate-500 mt-0.5">Listening, Speaking, Reading, Writing</p>
                </div>
                <span className="px-3 py-1 bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 rounded-xl font-bold text-xs">Meeting Expectation (ME)</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">Environmental Activities</p>
                  <p className="text-xs text-slate-500 mt-0.5">Social Studies, Science & Technology</p>
                </div>
                <span className="px-3 py-1 bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 rounded-xl font-bold text-xs">Exceeding Expectation (EE)</span>
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-md rounded-[2rem] bg-white dark:bg-slate-900 p-8 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3 pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Award size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Co-Curricular & Attendance Summary</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Punctuality and school engagement records</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Attendance Rate</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">98.5%</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Fee Balance</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">Ksh 0</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Clubs / House</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white truncate">Scouts / Red House</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LearnerProfile;
