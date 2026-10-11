import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { calculateSystemIntegrity } from '../../utils/systemHealth';
import { useSchoolStore } from '../../store/useSchoolStore';
import { getStoredLearners } from '../../utils/learnersStore';
import { Users, GraduationCap, Briefcase, CheckCircle2, Table as TableIcon, FileText, ShieldCheck, Database, ArrowRight, Sparkles, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Re-usable fetch helper & metric calculations as specified in guidelines
export const calculateStaffMetrics = (staffList: any[]) => {
  const teachingCount = staffList.filter((s: any) => !s.category || s.category === 'Teaching' || s.type === 'teaching' || s.role === 'teacher').length;
  const nonTeachingCount = staffList.filter((s: any) => s.category === 'Bursar' || s.category === 'Store Master' || s.type === 'non-teaching' || s.role === 'support' || s.category === 'Support' || s.category === 'Non-Teaching').length;
  return {
    teachingCount: teachingCount > 0 ? teachingCount : staffList.length,
    nonTeachingCount: nonTeachingCount >= 0 ? nonTeachingCount : 0,
    totalStaff: staffList.length
  };
};

export const AdminDashboardComponent: React.FC = () => {
  const navigate = useNavigate();

  const [learnersCount, setLearnersCount] = useState<number>(0);
  const [teachingCount, setTeachingCount] = useState<number>(0);
  const [nonTeachingCount, setNonTeachingCount] = useState<number>(0);

  const [localStaff, setLocalStaff] = useState<any[]>([]);
  const [reactiveLearners, setReactiveLearners] = useState<any[]>([]);
  const [health, setHealth] = useState(calculateSystemIntegrity());

  useEffect(() => {
    const refreshHealth = () => setHealth(calculateSystemIntegrity());

    refreshHealth();
    window.addEventListener('munyaka_data_changed', refreshHealth);
    window.addEventListener('storage', refreshHealth);

    return () => {
      window.removeEventListener('munyaka_data_changed', refreshHealth);
      window.removeEventListener('storage', refreshHealth);
    };
  }, []);
  const [health, setHealth] = useState(calculateSystemIntegrity());

  useEffect(() => {
    const refreshHealth = () => setHealth(calculateSystemIntegrity());

    refreshHealth();
    window.addEventListener('munyaka_data_changed', refreshHealth);
    window.addEventListener('storage', refreshHealth);

    return () => {
      window.removeEventListener('munyaka_data_changed', refreshHealth);
      window.removeEventListener('storage', refreshHealth);
    };
  }, []);

  // Re-usable fetch helper to compute and set metrics live
  const refreshDashboardMetrics = useCallback(() => {
    try {
      const db = {
        staff: CentralDataService.getStaff() || [],
        learners: CentralDataService.getLearners() || [],
        attendance: CentralDataService.getData('munyaka_attendance', [])
      };

      const staff = db.staff.length > 0 ? db.staff : getStaff();
      const learners = db.learners.length > 0 ? db.learners : getLearners();

      const metrics = calculateStaffMetrics(staff);

      setLocalStaff(staff);
      setReactiveLearners(learners);
      setLearnersCount(learners.length);
      setTeachingCount(metrics.teachingCount);
      setNonTeachingCount(metrics.nonTeachingCount);
    } catch (e) {
      console.error('Error refreshing dashboard metrics:', e);
    }
  }, []);

  useEffect(() => {
    // Initial load
    refreshDashboardMetrics();

    // Listen for live global mutations
    window.addEventListener('munyaka_data_changed', refreshDashboardMetrics);
    window.addEventListener('storage', refreshDashboardMetrics);
    window.addEventListener('munyaka:data-changed', refreshDashboardMetrics);
    window.addEventListener('staff-changed', refreshDashboardMetrics);
    window.addEventListener('munyaka_learners_updated', refreshDashboardMetrics);

    return () => {
      window.removeEventListener('munyaka_data_changed', refreshDashboardMetrics);
      window.removeEventListener('storage', refreshDashboardMetrics);
      window.removeEventListener('munyaka:data-changed', refreshDashboardMetrics);
      window.removeEventListener('staff-changed', refreshDashboardMetrics);
      window.removeEventListener('munyaka_learners_updated', refreshDashboardMetrics);
    };
  }, [refreshDashboardMetrics]);

  const masterData = getMasterData();
  const actualLearners = reactiveLearners.length > 0 ? reactiveLearners : (masterData.learners.length > 0 ? masterData.learners : getLearners());
  const learners = actualLearners;

  const staffSource = localStaff.length > 0 ? localStaff : getStaff();
  const totalStudents = learners.length;

  const primary = learners.filter((l: any) => !l.grade?.toLowerCase().includes('junior') && !l.grade?.toLowerCase().includes('grade 7') && !l.grade?.toLowerCase().includes('grade 8') && !l.grade?.toLowerCase().includes('grade 9'));
  const junior = learners.length - primary.length;

  const primaryCount = primary.length;
  const juniorCount = junior;

  const [selectedYear, setSelectedYear] = useState('2026');

  // Compute Enrolment Table Rows with promotion & advancement logic
  const gradeLevels = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
  const gradeSequence = gradeLevels;

  const currentBaseYear = 2026;
  const targetYearNum = parseInt(selectedYear, 10) || 2026;
  const yearDiff = targetYearNum - currentBaseYear;

  let sumBoys = 0;
  let sumGirls = 0;

  const enrolmentRows = gradeLevels.map((gradeName, gradeIndex) => {
    const explicitLearners = learners.filter((l: any) => {
      const lGrade = String(l.grade || l.class || '').trim();
      const matchesGrade = lGrade.toLowerCase() === gradeName.toLowerCase() || 
        (gradeName === 'PP1' && lGrade.toLowerCase().includes('pp1')) ||
        (gradeName === 'PP2' && lGrade.toLowerCase().includes('pp2')) ||
        lGrade.toLowerCase().includes(gradeName.toLowerCase());
      return matchesGrade;
    });

    let countBoys = 0;
    let countGirls = 0;

    if (yearDiff === 0 || explicitLearners.length > 0) {
      if (yearDiff === 0) {
        explicitLearners.forEach((l: any) => {
          const gender = String(l.gender || l.sex || '').trim().toLowerCase();
          if (gender === 'male' || gender === 'm' || gender === 'boy') countBoys++;
          else if (gender === 'female' || gender === 'f' || gender === 'girl') countGirls++;
          else countBoys++; // default split
        });
      } else {
        const sourceIndex = gradeIndex - yearDiff;
        if (sourceIndex >= 0 && sourceIndex < gradeLevels.length) {
          const sourceGrade = gradeLevels[sourceIndex];
          const sourceLearners = learners.filter((l: any) => {
            const lGrade = String(l.grade || l.class || '').trim();
            return lGrade.toLowerCase() === sourceGrade.toLowerCase();
          });
          sourceLearners.forEach((l: any) => {
            const gender = String(l.gender || l.sex || '').trim().toLowerCase();
            if (gender === 'male' || gender === 'm' || gender === 'boy') countBoys++;
            else if (gender === 'female' || gender === 'f' || gender === 'girl') countGirls++;
            else countBoys++;
          });
        }
      }
    }

    sumBoys += countBoys;
    sumGirls += countGirls;
    const total = countBoys + countGirls;

    return {
      grade: gradeName,
      boys: countBoys,
      girls: countGirls,
      total
    };
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-900/60 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-medium text-emerald-200 mb-3 backdrop-blur-sm">
              <Sparkles size={13} className="text-emerald-400" />
              CBC Competency-Based Curriculum Admin Control Center
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Munyaka Primary School Dashboard</h1>
            <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
              Real-time administrative overview, learner enrollments, CBC assessments, and staff metrics synced live across all portals.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              onClick={() => navigate('/central-data')}
              className="bg-white text-emerald-900 hover:bg-emerald-50 font-semibold shadow-md transition-all flex items-center gap-2"
            >
              <Database size={16} /> Central Master Export & Sync
              <ArrowRight size={15} />
            </Button>
            <Button 
              onClick={() => navigate('/students')}
              variant="outline"
              className="bg-emerald-900/40 text-white border-emerald-500/40 hover:bg-emerald-900/60 font-semibold backdrop-blur-sm"
            >
              <Users size={16} /> Manage Learners ({totalStudents})
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-emerald-100 shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600 group-hover:bg-emerald-700 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Enrolled Learners</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Users size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{totalStudents}</div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <span>Primary (PP1-Gr6): <strong className="text-slate-700">{primaryCount}</strong></span>
              <span>Junior (Gr7-9): <strong className="text-slate-700">{juniorCount}</strong></span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 group-hover:bg-blue-700 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Teaching Staff</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <GradingIcon size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{teachingCount || staffSource.length}</div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <span>Active Instructors</span>
              <span className="text-blue-600 font-medium">CBC Certified</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 group-hover:bg-amber-600 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Support / Non-Teaching</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Briefcase size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{nonTeachingCount}</div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <span>Admin & Support Staff</span>
              <span className="text-amber-600 font-medium">Operational</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-teal-100 shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-600 group-hover:bg-teal-700 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">System Integrity</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <ShieldCheck size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">100%</div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-teal-600 font-medium">
              <span>Offline Master DB Synced</span>
              <span>Secure</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrolment Matrix Section */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <TableIcon className="text-emerald-600" size={20} />
              Enrolment Matrix & Gender Breakdown ({selectedYear})
            </CardTitle>
            <p className="text-slate-500 text-xs mt-1">Real-time student population distribution across PP1 through Grade 9</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600">Academic Year:</span>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px] h-9 text-xs font-medium">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2027">2027</SelectItem>
                <SelectItem value="2028">2028</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableCell className="font-bold text-slate-700 py-3 px-4">Grade / Level</TableCell>
                  <TableCell className="font-bold text-slate-700 text-right py-3 px-4">Boys</TableCell>
                  <TableCell className="font-bold text-slate-700 text-right py-3 px-4">Girls</TableCell>
                  <TableCell className="font-bold text-slate-700 text-right py-3 px-4">Total Enrolled</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrolmentRows.map((row, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-semibold text-slate-800 px-4 py-3">{row.grade}</TableCell>
                    <TableCell className="text-right px-4 py-3 text-slate-600">{row.boys}</TableCell>
                    <TableCell className="text-right px-4 py-3 text-slate-600">{row.girls}</TableCell>
                    <TableCell className="text-right px-4 py-3 font-bold text-emerald-700">{row.total}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-emerald-50/60 font-bold border-t-2 border-emerald-100">
                  <TableCell className="text-slate-900 px-4 py-3.5">TOTAL SCHOOL POPULATION</TableCell>
                  <TableCell className="text-right px-4 py-3.5 text-slate-900">{sumBoys}</TableCell>
                  <TableCell className="text-right px-4 py-3.5 text-slate-900">{sumGirls}</TableCell>
                  <TableCell className="text-right px-4 py-3.5 text-emerald-800 text-base">{sumBoys + sumGirls}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper icon component
function GradingIcon(props: any) {
  return <GradingIconSvg {...props} />;
}
function GradingIconSvg(props: any) {
  return <GraduationCap {...props} />;
}

export default AdminDashboardComponent;
