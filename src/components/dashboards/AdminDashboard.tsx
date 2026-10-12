import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CentralDataService, getMasterData, getLearners, getStaff } from '../../services/centralDataService';
import { useSchoolStore } from '../../store/useSchoolStore';
import { getStoredLearners } from '../../utils/learnersStore';
import { calculateSystemIntegrity } from '../../utils/systemHealth';
import { countStaffByType, getStaffCategory, getStaffTypeBadge } from '../../utils/staffUtils';
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
  const [health, setHealth] = useState(calculateSystemIntegrity());

  const [localStaff, setLocalStaff] = useState<any[]>([]);
  const [reactiveLearners, setReactiveLearners] = useState<any[]>([]);

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

      // Robust staff classification using keyword-based helpers
      const staffList = db.staff || [];
      const { teaching: teachingStaffCount, support: supportStaffCount, unknown } = countStaffByType(staffList);

      setLocalStaff(staff);
      setReactiveLearners(learners);
      setLearnersCount(learners.length);
      setTeachingCount(teachingStaffCount > 0 ? teachingStaffCount : metrics.teachingCount);
      setNonTeachingCount(supportStaffCount);
    } catch (e) {
      console.error('Error refreshing dashboard metrics:', e);
    }
  }, []);

  const refreshHealth = useCallback(() => {
    setHealth(calculateSystemIntegrity());
  }, []);

  useEffect(() => {
    // Initial load
    refreshDashboardMetrics();
    refreshHealth();

    // Listen for live global mutations
    window.addEventListener('munyaka_data_changed', refreshDashboardMetrics);
    window.addEventListener('storage', refreshDashboardMetrics);
    window.addEventListener('munyaka:data-changed', refreshDashboardMetrics);
    window.addEventListener('staff-changed', refreshDashboardMetrics);
    window.addEventListener('munyaka_learners_updated', refreshDashboardMetrics);
    window.addEventListener('munyaka_data_changed', refreshHealth);
    window.addEventListener('storage', refreshHealth);

    return () => {
      window.removeEventListener('munyaka_data_changed', refreshDashboardMetrics);
      window.removeEventListener('storage', refreshDashboardMetrics);
      window.removeEventListener('munyaka:data-changed', refreshDashboardMetrics);
      window.removeEventListener('staff-changed', refreshDashboardMetrics);
      window.removeEventListener('munyaka_learners_updated', refreshDashboardMetrics);
      window.removeEventListener('munyaka_data_changed', refreshHealth);
      window.removeEventListener('storage', refreshHealth);
    };
  }, [refreshDashboardMetrics, refreshHealth]);

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
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden space-y-6">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Top Header Section */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-700/60 text-emerald-200 border border-emerald-500/30">
              ✨ CBC Competency-Based Curriculum Admin Control Center
            </span>
            <h1 className="text-2xl md:text-3xl font-bold mt-2">Munyaka Primary School Dashboard</h1>
            <p className="text-emerald-100/80 text-sm mt-1">
              Real-time administrative overview, learner enrollments, CBC assessments, and staff metrics.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => navigate('/central-data')}
              className="px-4 py-2 bg-white text-emerald-900 font-semibold text-sm rounded-lg shadow hover:bg-emerald-50 transition"
            >
              Central Master Export & Sync →
            </Button>
            <Button
              onClick={() => navigate('/students')}
              className="px-4 py-2 bg-emerald-700/80 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg border border-emerald-500/40 transition"
            >
              Manage Learners ({totalStudents})
            </Button>
          </div>
        </div>

        {/* Integrated 4-Card Compact Grid */}
        <div className="bg-emerald-900/40 backdrop-blur-md rounded-xl p-4 border border-emerald-500/30">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* Card 1: Total Learners */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 text-white">
              <div className="text-xs text-emerald-200 font-medium">Total Learners</div>
              <div className="text-2xl font-bold my-1">{totalStudents}</div>
              <div className="text-[11px] text-emerald-300/80">Primary: {primaryCount} | Junior: {juniorCount}</div>
            </div>

            {/* Card 2: Teaching Staff */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 text-white">
              <div className="text-xs text-emerald-200 font-medium">Teaching Staff</div>
              <div className="text-2xl font-bold my-1">{teachingCount || staffSource.length}</div>
              <div className="text-[11px] text-emerald-300/80">CBC Certified Instructors</div>
            </div>

            {/* Card 3: Non-Teaching Staff */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 text-white">
              <div className="text-xs text-emerald-200 font-medium">Support Staff</div>
              <div className="text-2xl font-bold my-1">{nonTeachingCount}</div>
              <div className="text-[11px] text-emerald-300/80">Operational & Admin</div>
            </div>

            {/* Card 4: System Integrity */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 text-white">
              <div className="text-xs text-emerald-200 font-medium">System Integrity</div>
              <div className="text-2xl font-bold my-1">{health.score}%</div>
              <div className="text-[11px] text-emerald-300/80">{health.statusText}</div>
            </div>
          </div>
        </div>
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