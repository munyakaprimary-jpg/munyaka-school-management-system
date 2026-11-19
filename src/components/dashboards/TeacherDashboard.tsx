import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  ClipboardCheck,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  Megaphone,
  Lock,
  Bell,
  Clock,
  BookmarkCheck,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { readGradesAndStreams, getStreamsForGrade } from '@/services/gradesStreamsConfig';
import { getStaffMaster } from '@/services/staffMasterService';
import { useCentralData } from '@/hooks/useCentralData';
import TeacherExportModule from '@/components/teacher/TeacherExportModule';
import TeacherSyncQrGenerator from '@/components/teacher/TeacherSyncQrGenerator';
import { getFormattedRoleLabel } from '@/utils/staffRoleUtils';
import { getCanonicalStaffId } from '@/utils/staffCanonicalUtils';
import { matchesBoundClass, getTeacherBoundClass } from '@/utils/classLockUtils';
import { db } from '@/config/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Dynamic User Profile details from session
  const displayName = user?.name || (user as any)?.username || 'Staff Member';
  const userRole = user?.role || 'Staff Member';
  const centralData = useCentralData();
  const students = (centralData as any)?.students || [];
  const marks = (centralData as any)?.marks || [];
  const notices = (centralData as any)?.notices || [];
  const settings = (centralData as any)?.settings || {};

  const teacherName = user?.name || (user as any)?.username || 'Teacher';
  
  // Unique storage key per teacher for class lock persistence
  const lockStorageKey = `munyaka_teacher_class_lock_${String(user?.id || user?.email || teacherName).toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  
  const teacherRole = user?.role || 'subject_teacher';
  const staffTitle = String((user as any)?.title || (user as any)?.category || '');
  const title = staffTitle.toLowerCase();
  
  // Robust Role Matching for Library Teacher / Librarian with Foolproof Name Fallback
  const currUserObj = (() => {
    try {
      return JSON.parse(localStorage.getItem('munyaka_current_user') || '{}');
    } catch {
      return {};
    }
  })();

  // Available dynamic grades and streams configuration with live sync listener
  const [gradesStreamsConfig, setGradesStreamsConfig] = React.useState(() => readGradesAndStreams());

  React.useEffect(() => {
    const handleStorageChange = () => {
      setGradesStreamsConfig(readGradesAndStreams());
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(() => {
      setGradesStreamsConfig(readGradesAndStreams());
    }, 1500);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  const allDynamicClassOptions = React.useMemo(() => {
    const list: string[] = [];
    gradesStreamsConfig.grades.forEach(grade => {
      const streamsForGrade = getStreamsForGrade(grade, gradesStreamsConfig);
      if (streamsForGrade.length > 0) {
        streamsForGrade.forEach(stream => {
          list.push(`${grade} ${stream}`);
        });
      } else {
        list.push(`${grade} Blue`);
        list.push(`${grade} Green`);
      }
    });
    return list.length > 0 ? list : [
      'Grade 1 Blue', 'Grade 1 Green',
      'Grade 2 Blue', 'Grade 2 Green',
      'Grade 3 Blue', 'Grade 3 Green',
      'Grade 4 Blue', 'Grade 4 Green',
      'Grade 5 Blue', 'Grade 5 Green',
      'Grade 6 Blue', 'Grade 6 Green',
      'Grade 7 Blue', 'Grade 8 Blue', 'Grade 9 Blue'
    ];
  }, [gradesStreamsConfig]);
  const [selectedClassState, setSelectedClassState] = React.useState<string>(() => {
    return currUserObj.assignedClass || (user as any)?.assignedClass || (user as any)?.gradeStream || (user as any)?.assignedGrade || 'Grade 4 Blue';
  });
  const selectedClass = selectedClassState;
  const setSelectedClass = setSelectedClassState;

  // Live-sync against Staff Directory to ensure true role is always respected
  const activeEmail = String(currUserObj.email || user?.email || '').trim().toLowerCase();
  const activeStaffId = String(currUserObj.staff_id || currUserObj.staffId || user?.staff_id || '').trim();
  let trueStaffRecord: any = null;
  try {
    const staffMaster = getStaffMaster();
    trueStaffRecord = staffMaster.find(s =>
      (activeEmail && String(s.email || '').trim().toLowerCase() === activeEmail) ||
      (activeStaffId && String(s.staffId || '').trim() === activeStaffId) ||
      (currUserObj.name && String(s.name || '').trim().toUpperCase() === String(currUserObj.name).trim().toUpperCase())
    );
  } catch {}

  const resolvedSysRole = String(trueStaffRecord?.systemRole || trueStaffRecord?.role || currUserObj.rbacRole || currUserObj.role || '').trim();
  const normalizedRole = resolvedSysRole.toUpperCase().replace(/\s+/g, '_');
  const normalizedRoleLower = normalizedRole.toLowerCase();

  const userName = String(currUserObj.name || currUserObj.fullName || trueStaffRecord?.name || user?.name || '').toUpperCase();
  const assignedDept = String(trueStaffRecord?.department || currUserObj.assignedDepartment || currUserObj.department || '').toLowerCase();
  
  const isLibraryStaff =
    normalizedRoleLower.includes('library') ||
    assignedDept.includes('library') ||
    userName.includes('JANET GATHONI');

  const isIctStaff =
    normalizedRoleLower.includes('ict') ||
    normalizedRoleLower.includes('it') ||
    assignedDept.includes('ict') ||
    userName.includes('JAMES NDIKI');

  const hasAssignedClass = Boolean(selectedClassState && selectedClassState !== 'No Class Assigned');

  const isClassTeacher = hasAssignedClass && !isLibraryStaff && !isIctStaff;
  const assignedClassLabel = selectedClassState || (isLibraryStaff ? 'Library & Media Center' : isIctStaff ? 'ICT Department' : 'No Class Assigned');
  
  const welcomeSubtitle = isLibraryStaff
    ? `You are signed in as ${teacherName} (Staff). Your dashboard is assigned to Library & Resource Management.`
    : isIctStaff
    ? `You are signed in as ${teacherName} (Staff). Your dashboard is assigned to ICT Lab & Digital Learning Management.`
    : isClassTeacher
    ? `You are signed in as ${teacherName} (Staff). Your dashboard is strictly restricted to assigned class (${assignedClassLabel}) data (Mathematics, Science & Technology, and Integrated Science).`
    : `You are signed in as ${teacherName} (Staff). Your dashboard is assigned to Specialist Educator & Subject Management (Mathematics, Science & Technology, and Integrated Science).`;

  // Robust normalizer helper: strips "GRADE" case-insensitively, trims spaces, and standardizes streams
  const normalizeGradeAndStream = (gradeStr: string, streamStr: string) => {
    const cleanGrade = String(gradeStr || '')
      .replace(/grade/gi, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .trim()
      .toUpperCase();
    const cleanStream = String(streamStr || '')
      .trim()
      .toUpperCase();
    return { cleanGrade, cleanStream, combined: `${cleanGrade} ${cleanStream}`.trim() };
  };

  // ICT Teacher / ICT Technician Analytics Dashboard View
  if (isIctStaff) {
    const [devices, setDevices] = React.useState<any[]>([]);

    const fetchIctInventory = () => {
      const keys = ['munyaka_ict_devices', 'munyaka_devices', 'ict_inventory', 'devices_list', 'munyaka_inventory'];
      for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed;
            }
          } catch {
            // ignore
          }
        }
      }
      return [
        { id: 'DEV-001', name: 'Student Chromebook 01', category: 'Laptop', status: 'Active', condition: 'Good', location: 'ICT Lab A' },
        { id: 'DEV-002', name: 'Student Chromebook 02', category: 'Laptop', status: 'Active', condition: 'Good', location: 'ICT Lab A' },
        { id: 'DEV-003', name: 'Teacher Projector Unit', category: 'Projector', status: 'In Repair', condition: 'Fair', location: 'Main Hall' },
        { id: 'DEV-004', name: 'Computer Lab Desktop 01', category: 'Desktop', status: 'Active', condition: 'Excellent', location: 'Computer Lab 1' },
      ];
    };

    const loadIctData = () => {
      setDevices(fetchIctInventory());
    };

    React.useEffect(() => {
      loadIctData();
      const handleStorageChange = (e: StorageEvent) => {
        if (!e.key || e.key.includes('ict') || e.key.includes('device') || e.key.includes('inventory')) {
          loadIctData();
        }
      };
      window.addEventListener('storage', handleStorageChange);
      const interval = setInterval(loadIctData, 2000);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }, []);

    const totalDevices = devices.length;
    const activeDevices = devices.filter(d => String(d.status || '').toLowerCase() === 'active' || String(d.status || '').toLowerCase() === 'operational').length;
    const underMaintenance = devices.filter(d => String(d.status || '').toLowerCase().includes('repair') || String(d.status || '').toLowerCase().includes('maintenance') || String(d.status || '').toLowerCase().includes('damaged')).length;

    // Unified learners list (combining localStorage cache and central DB)
    const allLearners = React.useMemo(() => {
      const list: any[] = [];
      try {
        const centralDb = JSON.parse(localStorage.getItem('munyaka_central_db') || '{}');
        if (Array.isArray(centralDb?.learners)) {
          list.push(...centralDb.learners);
        }
      } catch {}
      for (const key of ['munyaka_learners', 'munyaka_learners_directory', 'munyaka_learners_v2', 'munyaka_students', 'students', 'learners', 'school_students']) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              list.push(...parsed);
            }
          }
        } catch {}
      }
      if (Array.isArray(students)) list.push(...students);

      // Deduplicate by ID / admission number
      const seen = new Set();
      return list.filter(l => {
        const id = String(l?.id || l?.admissionNumber || l?.admNo || l?.uuid || l?.admission_no || Math.random());
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    }, [students]);

    // Parse grade and stream from activeAssignedClass (e.g. "Grade 4 Green")
    const [gradePart, streamPart] = React.useMemo(() => {
      const parts = assignedClassLabel.trim().split(/\s+/);
      if (parts.length >= 2) {
        return [parts.slice(0, parts.length - 1).join(' '), parts[parts.length - 1]];
      }
      return [assignedClassLabel, ''];
    }, [assignedClassLabel]);

    // Exact & normalized matching learners across directory sources for ICT / Specialist view
    const classStudents = React.useMemo(() => {
      if (!assignedClassLabel || assignedClassLabel === 'No Class Assigned') return [];
      const normTarget = normalizeGradeAndStream(gradePart, streamPart);

      return allLearners.filter((s: any) => {
        const lGradeRaw = String(s?.grade || s?.currentGrade || s?.gradeLevel || s?.class || '').trim();
        const lStreamRaw = String(s?.stream || '').trim();
        const lNorm = normalizeGradeAndStream(lGradeRaw, lStreamRaw);

        const gradeMatches = lNorm.cleanGrade === normTarget.cleanGrade ||
                             lNorm.cleanGrade.includes(normTarget.cleanGrade) ||
                             normTarget.cleanGrade.includes(lNorm.cleanGrade);
        
        const streamMatches = !normTarget.cleanStream ||
                              !lNorm.cleanStream ||
                              lNorm.cleanStream === normTarget.cleanStream ||
                              lNorm.cleanStream.includes(normTarget.cleanStream) ||
                              normTarget.cleanStream.includes(lNorm.cleanStream);

        const combinedMatches = lNorm.combined.includes(normTarget.combined) ||
                                normTarget.combined.includes(lNorm.combined);

        return (gradeMatches && streamMatches) || combinedMatches;
      });
    }, [allLearners, assignedClassLabel, gradePart, streamPart]);
  
    const totalLearners = classStudents.length;
  
    // Live attendance calculation for today
    const todayStr = new Date().toISOString().split('T')[0];
    const { attendanceToday, attendanceRate } = React.useMemo(() => {
      if (totalLearners === 0) return { attendanceToday: 0, attendanceRate: 0 };
      let present = 0;
      const enrolledIds = new Set(classStudents.map((l: any) => String(l.id || l.admissionNumber || l.admNo)));
  
      const v2Key = `munyaka_attendance_v2_${gradePart.replace(/\s+/g, '_')}_${streamPart}_${todayStr}`;
      const v2Data = localStorage.getItem(v2Key);
      if (v2Data) {
        try {
          const parsedV2 = JSON.parse(v2Data);
          if (Array.isArray(parsedV2)) {
            present = parsedV2.filter((rec: any) =>
              (enrolledIds.has(String(rec.learnerId || rec.id)) || enrolledIds.has(String(rec.admissionNumber))) &&
              (rec.status === 'present' || rec.status === 'Present' || rec.present === true)
            ).length;
          } else if (parsedV2 && typeof parsedV2 === 'object') {
            for (const [id, valEntry] of Object.entries(parsedV2)) {
              const val: any = valEntry;
              if (enrolledIds.has(id) && (val?.status === 'present' || val?.status === 'Present' || val === true || val?.present === true)) {
                present++;
              }
            }
          }
        } catch {}
      }
  
      if (present === 0) {
        try {
          const attRecords = JSON.parse(localStorage.getItem('munyaka_attendance_records') || '[]');
          const todayRecs = attRecords.filter((rec: any) => {
            const recDate = String(rec.date || '').split('T')[0];
            const recGrade = String(rec.grade || rec.class || '').trim().toUpperCase();
            const recStream = String(rec.stream || '').trim().toUpperCase();
            return recDate === todayStr && (recGrade.includes(gradePart.toUpperCase()) || gradePart.toUpperCase().includes(recGrade)) && (!streamPart || recStream.includes(streamPart.toUpperCase()));
          });
          if (todayRecs.length > 0) {
            present = todayRecs.filter((rec: any) => rec.status === 'present' || rec.status === 'Present' || rec.present === true).length;
          }
        } catch {}
      }
  
      const rate = totalLearners > 0 ? Math.round((present / totalLearners) * 100) : 0;
      return { attendanceToday: present, attendanceRate: rate };
    }, [classStudents, totalLearners, gradePart, streamPart, todayStr]);

    return (
      <div className="space-y-8 pb-12 max-w-6xl mx-auto px-4">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          <div className="space-y-3 relative z-10 max-w-2xl">
            <Badge className="bg-white/20 text-white font-bold uppercase text-[10px]">ICT Lab & Devices Management Hub</Badge>
            <h1 className="text-2xl md:text-3xl font-black">Welcome, {teacherName}!</h1>
            <p className="text-blue-100 text-sm md:text-base font-medium leading-relaxed">
              Live performance metrics for school computer labs, Chromebook inventory, and digital learning hardware.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 mt-6 relative z-10">
            <Button
              onClick={() => {
                navigate('/ict-lab');
                window.location.href = '/ict-lab';
              }}
              className="bg-white text-blue-950 hover:bg-blue-50 font-black px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
            >
              Open ICT & Device Inventory <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 4 Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Total ICT Assets</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                  {totalDevices} Units
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900">
                {activeDevices} Operational
              </h3>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {devices.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No ICT devices registered.</p>
                ) : (
                  devices.map((dev: any, idx: number) => {
                    const devName = dev.name || dev.itemName || dev.model || 'Device';
                    const devStatus = dev.status || 'Active';
                    return (
                      <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                        <span className="font-medium text-gray-800 truncate max-w-[200px]">{idx + 1}. {devName}</span>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {devStatus}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Hardware Inventory</span>
              <Button onClick={() => navigate('/ict-lab')} variant="link" className="p-0 h-auto text-xs font-bold text-blue-600 hover:text-blue-700">
                Manage Devices &rarr;
              </Button>
            </div>
          </Card>

          <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Devices</p>
              <h3 className="text-3xl font-black text-slate-900">{activeDevices}</h3>
              <p className="text-xs text-emerald-600 font-bold">Ready for Student Use</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </Card>

          <Card className={`border shadow-sm rounded-2xl bg-white p-6 flex items-center justify-between ${underMaintenance > 0 ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200/80'}`}>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Maintenance / Repair</p>
              <h3 className={`text-3xl font-black ${underMaintenance > 0 ? 'text-amber-700' : 'text-slate-900'}`}>{underMaintenance}</h3>
              <p className={`text-xs font-bold ${underMaintenance > 0 ? 'text-amber-600' : 'text-slate-500'}`}>Units in Servicing</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${underMaintenance > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
              <AlertCircle className="w-6 h-6" />
            </div>
          </Card>

          <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">ICT Labs</p>
              <h3 className="text-3xl font-black text-slate-900">2</h3>
              <p className="text-xs text-indigo-600 font-bold">Computer Labs Open</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </Card>
        </div>

        {/* Quick Access / Recent Activity Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-6 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" /> ICT Hardware & Lab Status
              </h3>
              <Button onClick={() => navigate('/inventory')} variant="outline" size="sm" className="text-xs font-bold rounded-xl">
                Open Device Registry
              </Button>
            </div>
            <div className="space-y-2">
              {devices.length > 0 ? (
                devices.slice(0, 5).map((d: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-900">{d.name || d.itemName || 'Device'}</p>
                      <p className="text-slate-500 text-[11px]">Location: {d.location || 'ICT Lab A'} ({d.category || 'Hardware'})</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${String(d.status || '').toLowerCase() === 'active' || String(d.status || '').toLowerCase() === 'operational' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {d.status || 'Active'}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">Condition: {d.condition || 'Good'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
                  No active ICT assets found.
                </div>
              )}
            </div>
          </Card>

          <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white p-6 space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" /> ICT Lab Quick Links
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Manage Chromebook allocations, report maintenance needs, and monitor computer lab schedules for learners.
            </p>
            <div className="space-y-2 pt-2">
              <Button onClick={() => navigate('/inventory')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl justify-start">
                <BookOpen className="w-4 h-4 mr-2" /> Open Device Inventory
              </Button>
              <Button onClick={() => navigate('/timetable')} variant="outline" className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs rounded-xl justify-start">
                <Calendar className="w-4 h-4 mr-2" /> Lab Timetable & Schedules
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Library Teacher / Librarian Analytics Dashboard View
  if (isLibraryStaff) {
    const [books, setBooks] = React.useState<any[]>([]);
    const [circulation, setCirculation] = React.useState<any[]>([]);
    const [eResources, setEResources] = React.useState<any[]>([]);

    const LIBRARY_STORAGE_KEY = 'munyaka_library_books';
    const CIRCULATION_STORAGE_KEY = 'munyaka_library_circulation';
    const ERESOURCES_STORAGE_KEY = 'munyaka_library_eresources';

    const fetchDashboardInventory = () => {
              const keys = ['munyaka_library_inventory', 'munyaka_library_books', 'library_inventory', 'library_books'];
              for (const key of keys) {
                const raw = localStorage.getItem(key);
                if (raw) {
                  try {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      return parsed;
                    }
                  } catch (e) {
                    // skip parse errors
                  }
                }
              }
              return [];
            };

    const getLibraryCirculation = () => {
      try {
        const primary = localStorage.getItem(CIRCULATION_STORAGE_KEY);
        if (primary) return JSON.parse(primary);

        const secondary = localStorage.getItem('munyaka_library_loans');
        if (secondary) return JSON.parse(secondary);

        return [];
      } catch {
        return [];
      }
    };

    const getLibraryEResources = () => {
      try {
        const primary = localStorage.getItem(ERESOURCES_STORAGE_KEY);
        if (primary) return JSON.parse(primary);

        const secondary = localStorage.getItem('munyaka_study_materials');
        if (secondary) return JSON.parse(secondary);

        return [];
      } catch {
        return [];
      }
    };

    const loadLibraryData = () => {
          setBooks(fetchDashboardInventory());
          setCirculation(getLibraryCirculation());
          setEResources(getLibraryEResources());
        };

    React.useEffect(() => {
      loadLibraryData();
      const handleStorageChange = (e: StorageEvent) => {
        if (!e.key || e.key.includes('library') || e.key.includes('study')) {
          loadLibraryData();
        }
      };
      window.addEventListener('storage', handleStorageChange);
      const interval = setInterval(loadLibraryData, 2000);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }, []);

    const getStoredLibraryStock = () => {
      try {
        const raw = localStorage.getItem('munyaka_library_inventory') ||
                      localStorage.getItem('munyaka_library_books') ||
                      localStorage.getItem('library_inventory');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (err) {
        console.error('Error reading stock:', err);
      }
      return [];
    };

    const liveStockItems = getStoredLibraryStock();

    // Calculate total physical volume sum across all items
    const totalVolumeSum = liveStockItems.reduce((acc: number, item: any) => {
      return acc + Number(item.quantity || item.copies || item.stock || 1);
    }, 0);

    const todayDate = new Date();
    const totalTitles = books.length;
    const totalVolumes = books.reduce((acc: number, item: any) => {
      return acc + (Number(item.quantity || item.copies || item.stock || item.totalCopies || 1));
    }, 0);

    const activeLoans = circulation.filter((c: any) => {
      const st = String(c?.status || '').toUpperCase();
      return st === 'ISSUED' || st === 'ACTIVE' || st === 'BORROWED' || !c?.returnDate;
    }).length;

    const overdueReturns = circulation.filter((c: any) => {
      const st = String(c?.status || '').toUpperCase();
      const isIssued = st === 'ISSUED' || st === 'ACTIVE' || st === 'BORROWED' || !c?.returnDate;
      const due = c?.dueDate || c?.returnDeadline;
      return isIssued && due && new Date(due) < todayDate;
    }).length;

    const digitalResourcesCount = eResources.length;

    return (
      <div className="space-y-8 pb-12 max-w-6xl mx-auto px-4">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          <div className="space-y-3 relative z-10 max-w-2xl">
            <Badge className="bg-white/20 text-white font-bold uppercase text-[10px]">Library & E-Resources Analytics Hub</Badge>
            <h1 className="text-2xl md:text-3xl font-black">Welcome, {teacherName}!</h1>
            <p className="text-emerald-100 text-sm md:text-base font-medium leading-relaxed">
              Live performance metrics for school textbook inventory, active circulation rates, and digital study resources.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 mt-6 relative z-10">
            <Button
              onClick={() => navigate('/library')}
              className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold rounded-xl shadow-sm flex items-center gap-2"
            >
              Open Library Workstation <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 4 Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Total Book Stock</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                  {totalVolumeSum} vols total
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900">
                {liveStockItems.length} Unique Titles
              </h3>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {liveStockItems.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No books cataloged yet.</p>
                ) : (
                  liveStockItems.map((book: any, idx: number) => {
                    const title = book.title || book.name || book.bookTitle || 'Untitled';
                    const qty = Number(book.quantity || book.copies || book.stock || 1);
                    return (
                      <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                        <span className="font-medium text-gray-800 truncate max-w-[220px]">{idx + 1}. {title}</span>
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {qty} vols
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Catalogued Inventory</span>
              <Button onClick={() => navigate('/library')} variant="link" className="p-0 h-auto text-xs font-bold text-emerald-600 hover:text-emerald-700">
                Manage Stock &rarr;
              </Button>
            </div>
          </Card>

          <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Issued Books</p>
              <h3 className="text-3xl font-black text-slate-900">{activeLoans}</h3>
              <p className="text-xs text-blue-600 font-bold">Active Circulation Loans</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookmarkCheck className="w-6 h-6" />
            </div>
          </Card>

          <Card className={`border shadow-sm rounded-2xl bg-white p-6 flex items-center justify-between ${overdueReturns > 0 ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200/80'}`}>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue Returns</p>
              <h3 className={`text-3xl font-black ${overdueReturns > 0 ? 'text-amber-700' : 'text-slate-900'}`}>{overdueReturns}</h3>
              <p className={`text-xs font-bold ${overdueReturns > 0 ? 'text-amber-600' : 'text-slate-500'}`}>Requires Follow-up</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${overdueReturns > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
              <AlertCircle className="w-6 h-6" />
            </div>
          </Card>

          <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Digital E-Resources</p>
              <h3 className="text-3xl font-black text-slate-900">{digitalResourcesCount}</h3>
              <p className="text-xs text-indigo-600 font-bold">Uploaded PDFs & Media</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </Card>
        </div>

        {/* Quick Access / Recent Activity Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-6 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" /> Recent Circulation Activity
              </h3>
              <Button onClick={() => navigate('/library')} variant="outline" size="sm" className="text-xs font-bold rounded-xl">
                View All Circulation
              </Button>
            </div>
            <div className="space-y-2">
              {circulation.length > 0 ? (
                circulation.slice(0, 5).map((c: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-900">{c.bookTitle || c.title || 'Textbook Loan'}</p>
                      <p className="text-slate-500 text-[11px]">Borrower: {c.borrowerName || c.learnerName || 'Student'} ({c.grade || 'Grade'})</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${c.status === 'ISSUED' || c.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {c.status || 'Active'}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">Due: {c.dueDate || c.returnDate || 'N/A'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
                  No active circulation records found in local storage.
                </div>
              )}
            </div>
          </Card>

          <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" /> Library Quick Links
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Easily manage textbook inventory, record new book arrivals, or upload digital CBC reading guides for learners.
            </p>
            <div className="space-y-2 pt-2">
              <Button onClick={() => navigate('/library')} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl justify-start">
                <BookOpen className="w-4 h-4 mr-2" /> Open Library Workstation
              </Button>
              <Button onClick={() => navigate('/study-corner')} variant="outline" className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs rounded-xl justify-start">
                <FileText className="w-4 h-4 mr-2" /> Study Corner & E-Resources
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Safely guard layout frame or specialized staff with no homeroom (unless staff/teacher role)
  if (!hasAssignedClass && (title.includes('ict') || title.includes('bursar') || title.includes('accountant') || title.includes('support')) && !normalizedRole.includes('staff') && !normalizedRole.includes('teacher')) {
    return (
      <div className="space-y-8 pb-12 max-w-5xl mx-auto px-4">
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="space-y-3 relative z-10">
            <Badge className="bg-white/20 text-white font-bold uppercase text-[10px]">Specialized Staff Portal</Badge>
            <h1 className="text-2xl md:text-3xl font-black">Welcome, {teacherName}!</h1>
            <p className="text-emerald-100 text-sm md:text-base max-w-xl font-medium">
              You are signed in as <span className="font-bold underline">{teacherName}</span> ({staffTitle || teacherRole}). Access your specialized departmental workstation below.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 mt-6 relative z-10">
            {title.includes('library') ? (
              <Button onClick={() => navigate('/library')} className="bg-white text-emerald-800 font-bold rounded-xl">Open Library Management</Button>
            ) : title.includes('ict') ? (
              <Button onClick={() => navigate('/ict-lab')} className="bg-white text-emerald-800 font-bold rounded-xl">Open ICT Lab Inventory</Button>
            ) : title.includes('bursar') || title.includes('accountant') ? (
              <Button onClick={() => navigate('/fees')} className="bg-white text-emerald-800 font-bold rounded-xl">Open Fee Collections & Ledger</Button>
            ) : (
              <>
                <Button onClick={() => navigate('/staff/attendance')} className="bg-white text-emerald-800 font-bold rounded-xl">Staff Attendance</Button>
                <Button onClick={() => navigate('/notices')} className="bg-teal-600 text-white font-bold rounded-xl border border-teal-400">School Notices</Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentUserObj = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('munyaka_current_user') || '{}');
    } catch {
      return {};
    }
  }, []);

  // Allow teacher to select class if unassigned, but ENFORCE strict class lock if assigned or locked
  const matchedStaffRecord = React.useMemo(() => {
    try {
      const centralDb = JSON.parse(localStorage.getItem('munyaka_central_db') || '{}');
      const staffList = centralDb.staff || centralDb.teachers || [];
      const userId = String(user?.id || currentUserObj.id || currentUserObj.email || '');
      const userEmail = String(user?.email || currentUserObj.email || '').toLowerCase();
      const userNameKey = String(teacherName).toLowerCase();
      return staffList.find((st: any) => {
        const stId = String(st.id || st.staffId || st.tscNo || '');
        const stEmail = String(st.email || '').toLowerCase();
        const stName = String(st.name || st.fullName || st.username || '').toLowerCase();
        return (userId && stId === userId) || (userEmail && stEmail === userEmail) || (userNameKey && stName.includes(userNameKey));
      }) || {};
    } catch {
      return {};
    }
  }, [user, currentUserObj, teacherName]);

  const assignedClassesRaw = matchedStaffRecord?.assignedClasses || matchedStaffRecord?.assignedClass || (user as any)?.assignedClasses || currentUserObj.assignedClasses || [];
  const defaultAssignedClass = Array.isArray(assignedClassesRaw) && assignedClassesRaw.length > 0
    ? assignedClassesRaw[0]
    : String(matchedStaffRecord?.assignedGrade || matchedStaffRecord?.grade || (user as any)?.assignedClass || (user as any)?.gradeStream || currentUserObj.assignedClass || currentUserObj.gradeStream || '');

  // 1. Initialize selectedClass as "" (empty string) and isLocked as false by default
  const [selectedClassOverride, setSelectedClassOverride] = React.useState<string | null>(() => {
    try {
      const storedLock = localStorage.getItem(lockStorageKey);
      if (storedLock) return storedLock;
    } catch {}

    // 2. Only auto-bind & lock from explicit staff profile fields
    const explicitAssignment =
      matchedStaffRecord?.lockedClass ||
      currentUserObj.lockedClass ||
      matchedStaffRecord?.assignedClass ||
      currentUserObj.assignedClass ||
      (matchedStaffRecord?.homeroomGrade && matchedStaffRecord?.homeroomStream ? `${matchedStaffRecord.homeroomGrade} ${matchedStaffRecord.homeroomStream}` : '') ||
      (currentUserObj.homeroomGrade && currentUserObj.homeroomStream ? `${currentUserObj.homeroomGrade} ${currentUserObj.homeroomStream}` : '') ||
      (Array.isArray(matchedStaffRecord?.assignedClasses) && matchedStaffRecord.assignedClasses[0] ? matchedStaffRecord.assignedClasses[0] : '') ||
      (Array.isArray(currentUserObj.assignedClasses) && currentUserObj.assignedClasses[0] ? currentUserObj.assignedClasses[0] : '') ||
      '';

    // Ignore generic placeholder "Grade 1 Blue" unless explicitly present in their record
    if (explicitAssignment && explicitAssignment !== 'Grade 1 Blue') {
      return explicitAssignment;
    }

    return null;
  });

  // If no explicit class is assigned in Firestore/profile, keep empty so teacher selects
  const activeAssignedClass = selectedClassOverride !== null ? selectedClassOverride : '';
  const isClassLocked = Boolean(selectedClassOverride && selectedClassOverride !== '');
  const fullClassTitle = activeAssignedClass ? activeAssignedClass : 'No Class Assigned';

  // Automatically lock class and persist to localStorage & staff record when chosen or assigned
  const handleClassSelectionLock = async (val: string) => {
    setSelectedClassOverride(val);
    setSelectedClass(val);
    try {
      localStorage.setItem(lockStorageKey, val);
    } catch {}
    // Persist to staff record & Firestore
    try {
      const staffDocId = String(matchedStaffRecord?.id || matchedStaffRecord?.staffId || currentUserObj.id || user?.id || '');
      if (staffDocId) {
        await setDoc(doc(db, 'staff', staffDocId), {
          assignedClass: val,
          lockedClass: val,
          isClassLocked: true,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (e) {
      console.warn('Failed to persist class lock to Firestore:', e);
    }
  };

  // 4. Admin/Debug Reset Option to unlock class
  const handleResetClassLock = async () => {
    const pin = prompt('Enter Admin PIN to reset teacher class lock:');
    if (pin !== '1234' && pin !== '0000' && pin !== 'admin') {
      if (pin !== null) alert('Incorrect Admin PIN.');
      return;
    }
    setSelectedClassOverride('');
    setSelectedClass('');
    try {
      localStorage.removeItem(lockStorageKey);
    } catch {}
    try {
      const staffDocId = String(matchedStaffRecord?.id || matchedStaffRecord?.staffId || currentUserObj.id || user?.id || '');
      if (staffDocId) {
        await setDoc(doc(db, 'staff', staffDocId), {
          assignedClass: '',
          lockedClass: '',
          isClassLocked: false,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch {}
    alert('Class lock successfully reset. You can now select a new class.');
  };

  // Restrict dropdown options strictly to teacher's assigned allocations (assignedClasses / assignedStreams / homeroom)
  const allowedClassOptions = React.useMemo(() => {
    const list: string[] = [];
    if (Array.isArray(assignedClassesRaw) && assignedClassesRaw.length > 0) {
      assignedClassesRaw.forEach((c: string) => {
        if (c && !list.includes(c)) list.push(c);
      });
    }
    if (matchedStaffRecord?.homeroomGrade && matchedStaffRecord?.homeroomStream) {
      const home = `${matchedStaffRecord.homeroomGrade} ${matchedStaffRecord.homeroomStream}`;
      if (!list.includes(home)) list.push(home);
    }
    if (defaultAssignedClass && !list.includes(defaultAssignedClass)) {
      list.push(defaultAssignedClass);
    }
    // If no assigned allocations found, fallback to all dynamic options
    return list.length > 0 ? list : allDynamicClassOptions;
  }, [assignedClassesRaw, matchedStaffRecord, defaultAssignedClass, allDynamicClassOptions]);

  // Load learners from all possible unified sources (Firestore central DB and offline localStorage caches)
  const allLearners = React.useMemo(() => {
    const list: any[] = [];
    try {
      const centralDb = JSON.parse(localStorage.getItem('munyaka_central_db') || '{}');
      if (Array.isArray(centralDb?.learners)) {
        list.push(...centralDb.learners);
      }
    } catch {}
    for (const key of ['munyaka_learners', 'munyaka_learners_directory', 'munyaka_learners_v2', 'munyaka_students', 'students', 'learners', 'school_students']) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            list.push(...parsed);
          }
        }
      } catch {}
    }
    if (Array.isArray(students)) list.push(...students);

    // Deduplicate by ID / admission number
    const seen = new Set();
    return list.filter(l => {
      const id = String(l?.id || l?.admissionNumber || l?.admNo || l?.uuid || l?.admission_no || Math.random());
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [students, activeAssignedClass]);

// Parse active assigned class and normalize
  const activeClassNorm = React.useMemo(() => {
    const raw = String(fullClassTitle || '').trim();
    if (!raw || raw === 'No Class Assigned') return { cleanGrade: '', cleanStream: '', combined: '' };
    const parts = raw.split(/\s+/);
    let g = '';
    let s = '';
    if (parts.length >= 2) {
      s = parts[parts.length - 1];
      g = parts.slice(0, parts.length - 1).join(' ');
    } else {
      g = raw;
    }
    return normalizeGradeAndStream(g, s);
  }, [fullClassTitle]);

  const gradePart = activeClassNorm.cleanGrade;
  const streamPart = activeClassNorm.cleanStream;

  // Exact & normalized matching learners across directory sources
  const classStudents = React.useMemo(() => {
    if (!fullClassTitle || fullClassTitle === 'No Class Assigned') return [];
    return allLearners.filter((s: any) => matchesBoundClass(s, fullClassTitle));
  }, [allLearners, fullClassTitle]);

  const totalLearners = classStudents.length;

  // Live attendance calculation for today from munyaka_central_db.attendance or v2 session registers
  const todayStr = new Date().toISOString().split('T')[0];
  const { attendanceToday, attendanceRate } = React.useMemo(() => {
    if (totalLearners === 0) return { attendanceToday: 0, attendanceRate: 0 };
    let present = 0;
    const enrolledIds = new Set(classStudents.map((l: any) => String(l.id || l.admissionNumber || l.admNo)));

    // Try v2 session key
    const v2Key = `munyaka_attendance_v2_${gradePart.replace(/\s+/g, '_')}_${streamPart}_${todayStr}`;
    const v2Data = localStorage.getItem(v2Key);
    if (v2Data) {
      try {
        const parsedV2 = JSON.parse(v2Data);
        if (Array.isArray(parsedV2)) {
          present = parsedV2.filter((rec: any) =>
            (enrolledIds.has(String(rec.learnerId || rec.id)) || enrolledIds.has(String(rec.admissionNumber))) &&
            (rec.status === 'present' || rec.status === 'Present' || rec.present === true)
          ).length;
        } else if (parsedV2 && typeof parsedV2 === 'object') {
          for (const [id, valEntry] of Object.entries(parsedV2)) {
            const val: any = valEntry;
            if (enrolledIds.has(id) && (val?.status === 'present' || val?.status === 'Present' || val === true || val?.present === true)) {
              present++;
            }
          }
        }
      } catch {}
    }

    if (present === 0) {
      try {
        const attRecords = JSON.parse(localStorage.getItem('munyaka_attendance_records') || '[]');
        const todayRecs = attRecords.filter((rec: any) => {
          const recDate = String(rec.date || '').split('T')[0];
          const recGrade = String(rec.grade || rec.class || '').trim().toLowerCase();
          const recStream = String(rec.stream || '').trim().toLowerCase();
          return recDate === todayStr && (recGrade.includes(gradePart.toLowerCase()) || gradePart.toLowerCase().includes(recGrade)) && (!streamPart || recStream.includes(streamPart.toLowerCase()));
        });
        if (todayRecs.length > 0) {
          present = todayRecs.filter((rec: any) => rec.status === 'present' || rec.status === 'Present' || rec.present === true).length;
        }
      } catch {}
    }

    const rate = totalLearners > 0 ? Math.round((present / totalLearners) * 100) : 0;
    return { attendanceToday: present, attendanceRate: rate };
  }, [classStudents, totalLearners, gradePart, streamPart, todayStr]);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Hero Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white hover:bg-white/30 border-none font-bold uppercase tracking-wider text-[10px]">
              {user?.role ? user.role.toUpperCase() + ' DASHBOARD' : 'STAFF DASHBOARD'}
            </Badge>
            <Badge variant="outline" className="bg-emerald-500/30 text-emerald-200 border-emerald-400 font-bold text-[10px] flex items-center gap-1">
              <Lock className="w-3 h-3" /> Locked Class: {fullClassTitle}
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Welcome back, {teacherName}!
          </h1>
          <p className="text-blue-100 text-sm md:text-base max-w-xl font-medium">
            Your data entry is strictly locked to <strong className="text-white underline">{fullClassTitle}</strong>. Cross-grade access is locked.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Button
            onClick={() => navigate('/attendance')}
            className="bg-white text-indigo-700 hover:bg-blue-50 font-bold rounded-xl shadow-sm"
          >
            <ClipboardCheck className="w-4 h-4 mr-2 text-indigo-600" />
            Mark Attendance ({fullClassTitle})
          </Button>
          <Button
            onClick={() => navigate('/assessments')}
            className="bg-indigo-600 text-white hover:bg-indigo-500 font-bold rounded-xl border border-indigo-400 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-white" />
            Enter Exam Marks ({fullClassTitle})
          </Button>
          <TeacherSyncQrGenerator
            grade={gradePart}
            stream={streamPart}
            className="bg-emerald-600 text-white hover:bg-emerald-500 font-bold rounded-xl shadow-sm flex items-center gap-2"
          />
          <Button
            onClick={() => navigate('/teacher-export')}
            className="bg-emerald-600 text-white hover:bg-emerald-500 font-bold rounded-xl shadow-sm"
          >
            <Sparkles className="w-4 h-4 mr-2 text-white" />
            Export Teacher Sync Package (.json)
          </Button>
        </div>
      </div>

      {/* Quick Metrics & Strict Class Lock Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strict Class Lock Card */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700 shadow-xl col-span-1 lg:col-span-1 flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-extrabold tracking-wider bg-teal-800 px-2 py-0.5 rounded text-teal-200">
                {getFormattedRoleLabel(teacherRole)}
              </span>
              {isClassLocked ? (
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-400 font-bold text-xs flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" /> LOCKED
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-400 font-bold text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-400" /> UNBOUND
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-black text-white">Assigned Homeroom Lock</CardTitle>
              {isClassLocked && (
                <button
                  onClick={handleResetClassLock}
                  className="text-xs text-amber-300 hover:text-white underline font-semibold transition-colors"
                >
                  Reset Lock (Admin PIN)
                </button>
              )}
            </div>
            <CardDescription className="text-slate-300 text-xs">
              {isClassLocked ? `Strictly bound to ${fullClassTitle}. All data entry is restricted.` : `Please select your assigned class and stream to lock your session.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Bound Class & Stream</span>
                <span className={isClassLocked ? "text-emerald-400 font-bold flex items-center gap-1" : "text-amber-400 font-bold flex items-center gap-1"}>
                  {isClassLocked ? <><Lock className="w-3 h-3" /> Locked</> : <><AlertCircle className="w-3 h-3" /> Select Class</>}
                </span>
              </div>
              <Select
                value={activeAssignedClass}
                onValueChange={(val) => {
                  handleClassSelectionLock(val);
                }}
                disabled={isClassLocked}
              >
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white font-bold rounded-xl h-10">
                  <SelectValue placeholder="-- Select Your Class & Stream --" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {allowedClassOptions.map((cls: string) => (
                    <SelectItem key={cls} value={cls} className="font-bold focus:bg-teal-800 focus:text-white">
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-start gap-2 text-xs text-amber-200/90 bg-amber-950/40 p-3 rounded-xl border border-amber-800/50">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>{isClassLocked ? 'Cross-grade selection is disabled. Contact Admin to reassign or unlock your teaching stream.' : 'Select your class above to bind your session and unlock student registers & assessments.'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric Card 2: Total Learners */}
        <Card className="bg-white/90 backdrop-blur-sm border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Enrolled Learners ({fullClassTitle})</CardTitle>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {totalLearners}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Registered learners in your assigned class stream
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full font-bold border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl"
              onClick={() => navigate('/learners')}
            >
              View Class Learners <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Metric Card 3: Roll Call & Attendance */}
        <Card className="bg-white/90 backdrop-blur-sm border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Today's Attendance Rate</CardTitle>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {attendanceRate}%
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {attendanceToday} of {totalLearners} learners present today
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl"
              onClick={() => navigate('/attendance')}
            >
              Mark Roll Call <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Action Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Teacher Export & Records Module */}
          <TeacherExportModule />
        </div>

        {/* Sidebar Announcements & Quick Notice */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-6">
            <CardHeader className="px-0 pt-0 pb-4 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                <Megaphone className="text-indigo-600" size={18} />
                School Notices & Events
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/notices')} className="text-xs text-indigo-600 font-bold hover:bg-indigo-50 h-8 px-2">
                View All
              </Button>
            </CardHeader>
            <CardContent className="px-0 pt-4 space-y-3">
              {notices && notices.length > 0 ? (
                notices.slice(0, 3).map((notice: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600">{notice.category || 'Announcement'}</span>
                      <span className="text-[10px] text-slate-400">{notice.date || 'Today'}</span>
                    </div>
                    <h5 className="font-bold text-xs text-slate-900">{notice.title || notice.subject}</h5>
                    <p className="text-xs text-slate-600 line-clamp-2">{notice.content || notice.message}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                  No active notices or announcements at this time.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-indigo-900 text-white p-6">
            <div className="space-y-3">
              <Badge className="bg-indigo-700 text-indigo-100 border-none text-[10px] font-bold">
                CBC Compliance
              </Badge>
              <h3 className="font-black text-lg">Strand Assessment Guidelines</h3>
              <p className="text-xs text-indigo-200 leading-relaxed">
                Remember to input formative scores across all 5 strands before end-of-term lock. Contact the Academic Registrar or DHOI if you encounter any discrepancies.
              </p>
              <Button
                onClick={() => navigate('/digital-hub')}
                variant="outline"
                className="w-full bg-white/10 text-white hover:bg-white/20 border-white/20 font-bold text-xs rounded-xl"
              >
                Access Digital Hub
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
