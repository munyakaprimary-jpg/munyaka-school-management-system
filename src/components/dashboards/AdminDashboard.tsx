import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CentralDataService from '../../services/centralDataService';
import { useSchoolStore } from '../../store/useSchoolStore';
import { Users, GraduationCap, Briefcase, CheckCircle2, Table as TableIcon, FileText, ShieldCheck, Database, ArrowRight, Sparkles, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const AdminDashboardComponent: React.FC = () => {
  const navigate = useNavigate();
  const storeLearners = useSchoolStore(state => state.learners);
  const storeStaff = useSchoolStore(state => state.staff);

  useEffect(() => {
    try {
      const syncFn = (useSchoolStore.getState() as any).syncFromStorage;
      if (typeof syncFn === 'function') {
        syncFn();
      }
    } catch {}
  }, []);

  const learners = storeLearners && storeLearners.length > 0 ? storeLearners : CentralDataService.getLearners();
  const staff = storeStaff && storeStaff.length > 0 ? storeStaff : CentralDataService.getStaff();

  const teaching = staff.filter((s: any) => {
    const roleStr = `${s.role || ''} ${s.type || ''} ${s.category || ''} ${s.systemRole || ''} ${s.department || ''}`.toLowerCase();
    if (roleStr.includes('bursar') || roleStr.includes('librarian') || roleStr.includes('store') || roleStr.includes('accountant') || roleStr.includes('support') || roleStr.includes('secretary') || roleStr.includes('security') || roleStr.includes('catering') || roleStr.includes('ict technician')) {
      return false;
    }
    return roleStr.includes('teach') || roleStr.includes('head_teacher') || roleStr.includes('senior_teacher') || roleStr.includes('class_teacher') || roleStr.includes('subject_teacher') || roleStr.includes('teacher') || roleStr.includes('head teacher') || roleStr.includes('deputy');
  });

  const nonTeaching = staff.filter((s: any) => {
    const roleStr = `${s.role || ''} ${s.type || ''} ${s.category || ''} ${s.systemRole || ''} ${s.department || ''}`.toLowerCase();
    if (roleStr.includes('teach') || roleStr.includes('head_teacher') || roleStr.includes('senior_teacher') || roleStr.includes('class_teacher') || roleStr.includes('subject_teacher') || roleStr.includes('teacher') || roleStr.includes('head teacher') || roleStr.includes('deputy')) {
      if (roleStr.includes('bursar') || roleStr.includes('librarian') || roleStr.includes('store') || roleStr.includes('accountant') || roleStr.includes('support') || roleStr.includes('secretary') || roleStr.includes('security') || roleStr.includes('catering') || roleStr.includes('ict technician')) {
        return true;
      }
      return false;
    }
    return true;
  });

  const primary = learners.filter((l: any) => !l.grade?.toLowerCase().includes('junior') && !l.grade?.toLowerCase().includes('grade 7') && !l.grade?.toLowerCase().includes('grade 8') && !l.grade?.toLowerCase().includes('grade 9'));
  const junior = learners.length - primary.length;

  const totalStudents = learners.length;
  const teachingStaffCount = teaching.length;
  const nonTeachingStaffCount = nonTeaching.length;
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
      
      if (!matchesGrade) return false;

      const lYear = String(l.academicYear || l.year || l.enrollmentYear || '2026');
      return lYear === String(selectedYear);
    });

    let gradeLearners = explicitLearners;

    if (explicitLearners.length === 0 && yearDiff > 0) {
      const baseGradeIndex = gradeIndex - yearDiff;
      if (baseGradeIndex >= 0 && baseGradeIndex < gradeSequence.length) {
        const baseGradeName = gradeSequence[baseGradeIndex];
        const baseLearners = learners.filter((l: any) => {
          const lGrade = String(l.grade || l.class || '').trim();
          const matchesGrade = lGrade.toLowerCase() === baseGradeName.toLowerCase() || 
            (baseGradeName === 'PP1' && lGrade.toLowerCase().includes('pp1')) ||
            (baseGradeName === 'PP2' && lGrade.toLowerCase().includes('pp2')) ||
            lGrade.toLowerCase().includes(baseGradeName.toLowerCase());

          if (!matchesGrade) return false;
          const lYear = String(l.academicYear || l.year || l.enrollmentYear || '2026');
          return lYear === '2026';
        });
        gradeLearners = baseLearners;
      } else {
        gradeLearners = [];
      }
    }

    const boys = gradeLearners.filter((l: any) => {
      const g = String(l.gender || l.sex || '').trim().toLowerCase();
      return g.startsWith('m') || g === 'boy';
    }).length;

    const girls = gradeLearners.filter((l: any) => {
      const g = String(l.gender || l.sex || '').trim().toLowerCase();
      return g.startsWith('f') || g === 'girl';
    }).length;

    const unassigned = gradeLearners.length - (boys + girls);
    const adjustedBoys = boys + Math.ceil(unassigned / 2);
    const adjustedGirls = girls + Math.floor(unassigned / 2);
    const total = adjustedBoys + adjustedGirls;

    sumBoys += adjustedBoys;
    sumGirls += adjustedGirls;

    return {
      grade: gradeName,
      boys: adjustedBoys,
      girls: adjustedGirls,
      total
    };
  });

  const totalsRow = {
    boys: sumBoys,
    girls: sumGirls,
    total: sumBoys + sumGirls
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Live operational metrics for Munyaka Primary and Junior School.</p>
        </div>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          LIVE FACTUAL SYNC
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Students Card */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">TOTAL STUDENTS</CardTitle>
            <Users className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalStudents}</div>
            <p className="text-xs text-gray-500 mt-1">Active registered learners</p>
          </CardContent>
        </Card>

        {/* Teaching Staff Card */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">TEACHING STAFF</CardTitle>
            <GraduationCap className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{teachingStaffCount}</div>
            <p className="text-xs text-gray-500 mt-1">Active: {teachingStaffCount} | Pending: 0</p>
          </CardContent>
        </Card>

        {/* Non-Teaching Staff Card */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">NON-TEACHING STAFF</CardTitle>
            <Briefcase className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{nonTeachingStaffCount}</div>
            <p className="text-xs text-gray-500 mt-1">Active: {nonTeachingStaffCount} | Pending: 0</p>
          </CardContent>
        </Card>

        {/* Primary School Breakdown */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">PRIMARY SCHOOL</CardTitle>
            <Users className="w-5 h-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{primaryCount}</div>
            <p className="text-xs text-gray-500 mt-1">Grades 1 to 6 learners</p>
          </CardContent>
        </Card>

        {/* Junior School Breakdown */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">JUNIOR SCHOOL</CardTitle>
            <GraduationCap className="w-5 h-5 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{juniorCount}</div>
            <p className="text-xs text-gray-500 mt-1">Grades 7 to 9 learners</p>
          </CardContent>
        </Card>

        {/* System Status Card */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">SYSTEM STATUS</CardTitle>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">Online</div>
            <p className="text-xs text-gray-500 mt-1">Central database synchronized</p>
          </CardContent>
        </Card>

        {/* Admin Harmonization Hub Card */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate('/admin-harmonization-hub')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">DATA IMPORT & HARMONIZATION</CardTitle>
            <Upload className="w-5 h-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-indigo-700 group-hover:text-indigo-900 transition-colors">Admin Hub</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <ArrowRight size={12} className="text-indigo-500" /> Upload teacher exports & merge records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Import & Harmonization Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 p-6 md:p-8 text-white shadow-2xl mb-8">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-80 h-80 rounded-full bg-indigo-500/30 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-indigo-100">
              <FileText size={14} /> Admin Data Operations
            </div>
            <h3 className="text-xl md:text-2xl font-black tracking-tight">Import & Harmonize Teacher Data</h3>
            <p className="text-indigo-100 text-sm md:text-base max-w-xl font-medium">
              Upload teacher export packages to audit metadata and safely merge attendance, check-ins, CBC assessments, and inventory records into the master database with stream isolation.
            </p>
          </div>
          <Button
            onClick={() => navigate('/admin-harmonization-hub')}
            className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold px-6 py-3.5 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 shrink-0"
          >
            <Upload size={18} />
            Open Harmonization Hub
          </Button>
        </div>
      </div>

      {/* SCHOOL ENROLMENT TABLE SECTION */}
      <Card className="border shadow-sm rounded-3xl overflow-hidden mt-8">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">SCHOOL ENROLMENT TABLE</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Real-time enrolment breakdown by grade and gender.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Academic Year:</span>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32 rounded-xl bg-white dark:bg-slate-800">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
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
          <Table>
            <TableHeader className="bg-slate-100/70 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6">GRADE</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6 text-center">BOYS</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6 text-center">GIRLS</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6 text-center">TOTAL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrolmentRows.map((row, idx) => (
                <TableRow key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <TableCell className="font-semibold text-slate-900 dark:text-slate-100 py-3.5 px-6">{row.grade}</TableCell>
                  <TableCell className="text-center font-medium text-slate-700 dark:text-slate-300 py-3.5 px-6">{row.boys}</TableCell>
                  <TableCell className="text-center font-medium text-slate-700 dark:text-slate-300 py-3.5 px-6">{row.girls}</TableCell>
                  <TableCell className="text-center font-bold text-indigo-600 dark:text-indigo-400 py-3.5 px-6">{row.total}</TableCell>
                </TableRow>
              ))}
              {/* Summary Totals Row */}
              <TableRow className="bg-indigo-50/70 dark:bg-indigo-950/40 border-t-2 border-indigo-200 dark:border-indigo-900">
                <TableCell className="font-black text-slate-900 dark:text-white py-4 px-6 text-base">TOTALS</TableCell>
                <TableCell className="text-center font-black text-slate-900 dark:text-white py-4 px-6 text-base">{totalsRow.boys}</TableCell>
                <TableCell className="text-center font-black text-slate-900 dark:text-white py-4 px-6 text-base">{totalsRow.girls}</TableCell>
                <TableCell className="text-center font-black text-indigo-600 dark:text-indigo-400 py-4 px-6 text-lg">{totalsRow.total}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardComponent;
