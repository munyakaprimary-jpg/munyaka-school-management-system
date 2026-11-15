import React, { useState, useEffect } from 'react';
import {
  Users, CheckCircle2, XCircle, Clock, AlertCircle, Save, Calendar,
  Filter, Search, RefreshCw, ShieldCheck, Unlock, Lock, CheckSquare,
  FileText, Download, Award, ChevronDown, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { getStoredLearners } from '@/utils/learnersStore';
import { mergeStoredLearners } from '@/utils/learnerStorageMerge';

interface Learner {
  id?: string;
  admissionNo?: string;
  admissionNumber?: string;
  name?: string;
  fullName?: string;
  learnerName?: string;
  grade?: string;
  classLevel?: string;
  stream?: string;
}

export default function Attendance() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [grades, setGrades] = useState<string[]>([]);
  const [streams, setStreams] = useState<string[]>([]);
  
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStream, setSelectedStream] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeSession, setActiveSession] = useState<'morning' | 'afternoon'>('morning');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bypassCutoff, setBypassCutoff] = useState<boolean>(true);
  
  // Independent Manual Attendance Locks
  const [manualMorningLock, setManualMorningLock] = useState<boolean>(() => {
    return localStorage.getItem('manual_morning_lock') === 'true';
  });
  const [manualAfternoonLock, setManualAfternoonLock] = useState<boolean>(() => {
    return localStorage.getItem('manual_afternoon_lock') === 'true';
  });

  // Configurable Cutoff Time Settings (From and To ranges)
  const [morningFromTime, setMorningFromTime] = useState<string>(() => {
    return localStorage.getItem('attendance_morning_from') || '08:00';
  });
  const [morningCutoffTime, setMorningCutoffTime] = useState<string>(() => {
    return localStorage.getItem('attendance_morning_cutoff') || '09:40';
  });
  const [afternoonFromTime, setAfternoonFromTime] = useState<string>(() => {
    return localStorage.getItem('attendance_afternoon_from') || '14:00';
  });
  const [afternoonCutoffTime, setAfternoonCutoffTime] = useState<string>(() => {
    return localStorage.getItem('attendance_afternoon_cutoff') || '17:00';
  });
  
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { morning: string; afternoon: string; remarks: string }>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [historicalRecords, setHistoricalRecords] = useState<any[]>([]);

  // Time Lock & Role check helper
  const { user } = useAuth();
  const roleStr = String((user as any)?.role || '');
  const isAdmin = roleStr === 'admin' || roleStr === 'head_teacher' || roleStr === 'owner' || user?.email?.includes('admin');

  // Helper function to convert "HH:MM" string to minutes from midnight
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = (timeStr || '00:00').split(':').map(Number);
    return (isNaN(hours) ? 0 : hours) * 60 + (isNaN(minutes) ? 0 : minutes);
  };

  const checkSessionLockStatus = (
    morningFromStr = '08:00',
    morningCutoffStr = '09:40',
    afternoonFromStr = '14:00',
    afternoonCutoffStr = '17:00',
    isBypassed = false,
    manualMorningOverride?: 'Locked' | 'Unlocked',
    manualAfternoonOverride?: 'Locked' | 'Unlocked'
  ) => {
    if (isBypassed) {
      return { isMorningOpen: true, isAfternoonOpen: true };
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const morningStartMinutes = timeToMinutes(morningFromStr);
    const morningCutoffMinutes = timeToMinutes(morningCutoffStr);

    const afternoonStartMinutes = timeToMinutes(afternoonFromStr);
    const afternoonCutoffMinutes = timeToMinutes(afternoonCutoffStr);

    // Evaluate Morning Status: strict between Morning From and Morning To
    let isMorningOpen = currentMinutes >= morningStartMinutes && currentMinutes <= morningCutoffMinutes;
    if (manualMorningOverride === 'Unlocked') isMorningOpen = true;
    if (manualMorningOverride === 'Locked') isMorningOpen = false;

    // Evaluate Afternoon Status: strict between Afternoon From and Afternoon To
    let isAfternoonOpen = currentMinutes >= afternoonStartMinutes && currentMinutes <= afternoonCutoffMinutes;
    if (manualAfternoonOverride === 'Unlocked') isAfternoonOpen = true;
    if (manualAfternoonOverride === 'Locked') isAfternoonOpen = false;

    return { isMorningOpen, isAfternoonOpen };
  };

  const checkIsLocked = (session: 'morning' | 'afternoon') => {
    const manualMorning = manualMorningLock ? 'Locked' : (bypassCutoff ? 'Unlocked' : undefined);
    const manualAfternoon = manualAfternoonLock ? 'Locked' : (bypassCutoff ? 'Unlocked' : undefined);

    const { isMorningOpen, isAfternoonOpen } = checkSessionLockStatus(
      morningFromTime,
      morningCutoffTime,
      afternoonFromTime,
      afternoonCutoffTime,
      bypassCutoff,
      manualMorning,
      manualAfternoon
    );

    if (session === 'morning') return !isMorningOpen;
    return !isAfternoonOpen;
  };

  const { isMorningOpen, isAfternoonOpen } = checkSessionLockStatus(
    morningFromTime,
    morningCutoffTime,
    afternoonFromTime,
    afternoonCutoffTime,
    bypassCutoff,
    manualMorningLock ? 'Locked' : undefined,
    manualAfternoonLock ? 'Locked' : undefined
  );

  const morningLocked = !isMorningOpen;
  const afternoonLocked = !isAfternoonOpen;

  const handleMorningFromChange = (newVal: string) => {
    setMorningFromTime(newVal);
    localStorage.setItem('attendance_morning_from', newVal);
    toast.success(`Morning start time updated to ${newVal}`);
  };

  const handleMorningCutoffChange = (newVal: string) => {
    setMorningCutoffTime(newVal);
    localStorage.setItem('attendance_morning_cutoff', newVal);
    toast.success(`Morning cutoff time updated to ${newVal}`);
  };

  const handleAfternoonFromChange = (newVal: string) => {
    setAfternoonFromTime(newVal);
    localStorage.setItem('attendance_afternoon_from', newVal);
    toast.success(`Afternoon start time updated to ${newVal}`);
  };

  const handleAfternoonCutoffChange = (newVal: string) => {
    setAfternoonCutoffTime(newVal);
    localStorage.setItem('attendance_afternoon_cutoff', newVal);
    toast.success(`Afternoon cutoff time updated to ${newVal}`);
  };

  const toggleManualMorningLock = () => {
    const nextVal = !manualMorningLock;
    setManualMorningLock(nextVal);
    if (nextVal) {
      toast.success('Morning session manually locked.');
    } else {
      toast.success('Morning session unlocked / returning to schedule.');
    }
  };

  const toggleManualAfternoonLock = () => {
    const nextVal = !manualAfternoonLock;
    setManualAfternoonLock(nextVal);
    if (nextVal) {
      toast.success('Afternoon session manually locked.');
    } else {
      toast.success('Afternoon session unlocked / returning to schedule.');
    }
  };
    setManualMorningLock(nextVal);
    localStorage.setItem('manual_morning_lock', String(nextVal));
    toast.success(nextVal ? 'Manual Morning Attendance Lock enabled.' : 'Manual Morning Attendance Lock released.');
  };

  const toggleManualAfternoonLock = () => {
    const nextVal = !manualAfternoonLock;
    setManualAfternoonLock(nextVal);
    localStorage.setItem('manual_afternoon_lock', String(nextVal));
    toast.success(nextVal ? 'Manual Afternoon Attendance Lock enabled.' : 'Manual Afternoon Attendance Lock released.');
  };

  // 1. Master State Synchronization: Pull from primary master learners store
  useEffect(() => {
    loadMasterLearners();
    loadRollCallRecords();

    // Listen for storage changes across modules
    const handleStorageChange = () => {
      loadMasterLearners();
      loadRollCallRecords();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('munyaka:data-changed', handleStorageChange);
    window.addEventListener('munyaka_learners_updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('munyaka:data-changed', handleStorageChange);
      window.removeEventListener('munyaka_learners_updated', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (learners.length > 0) {
      loadRollCallRecords();
    }
  }, [selectedDate, selectedGrade, selectedStream, learners]);

  const loadMasterLearners = () => {
    try {
      // 1. Try unified mergeStoredLearners
      let list: Learner[] = [];
      try {
        const storedFromHelper = mergeStoredLearners();
        if (Array.isArray(storedFromHelper) && storedFromHelper.length > 0) {
          list = storedFromHelper;
        }
      } catch (err) {}

      // 2. Fallback to getStoredLearners or direct keys
      if (list.length === 0) {
        try {
          const direct = getStoredLearners();
          if (Array.isArray(direct) && direct.length > 0) {
            list = direct;
          }
        } catch (e) {}
      }

      if (list.length === 0) {
        const raw = localStorage.getItem('munyaka_learners') || localStorage.getItem('munyaka_students');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const items = Array.isArray(parsed) ? parsed : (parsed.learners || parsed.students || parsed.data || []);
            if (Array.isArray(items)) {
              list = items;
            }
          } catch (e) {}
        }
      }

      setLearners(list);

      // Extract unique grades & streams from both master learners AND Grades & Streams settings
      const gradeSet = new Set<string>();
      const streamSet = new Set<string>();

      // 1. Pull from Grades & Streams settings if available
      try {
        const savedGradesSetting = localStorage.getItem('munyaka_grades') || localStorage.getItem('configured_streams');
        if (savedGradesSetting) {
          const parsedGrades = JSON.parse(savedGradesSetting);
          if (Array.isArray(parsedGrades)) {
            parsedGrades.forEach((g: any) => {
              if (g) {
                const gName = g.name || g.id;
                if (gName) {
                  gradeSet.add(String(gName).trim().toUpperCase());
                }
                if (Array.isArray(g.streams)) {
                  g.streams.forEach((s: any) => {
                    const sName = s?.name || s?.id || s;
                    if (sName) {
                      streamSet.add(String(sName).trim());
                    }
                  });
                }
              }
            });
          }
        }
      } catch (err) {}

      list.forEach((l: any) => {
        const g = l.grade || l.classLevel || l.gradeId;
        const s = l.stream || l.streamId;
        if (g && String(g).trim()) {
          const normG = String(g).trim().toUpperCase();
          gradeSet.add(normG);
        }
        if (s && String(s).trim()) streamSet.add(String(s).trim());
      });

      const sortedGrades = Array.from(gradeSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      const sortedStreams = Array.from(streamSet).sort();

      setGrades(sortedGrades);
      setStreams(sortedStreams);
    } catch (err) {
      console.error('Failed to load master learners directory:', err);
      toast.error('Failed to load registered learners from master directory.');
    }
  };

  const loadRollCallRecords = () => {
    try {
      const rawRollCalls = localStorage.getItem('roll_call_records') || localStorage.getItem('munyaka_attendance_records') || '{}';
      const parsedRollCalls = JSON.parse(rawRollCalls);
      
      if (Array.isArray(parsedRollCalls)) {
        setHistoricalRecords(parsedRollCalls);
      } else if (typeof parsedRollCalls === 'object' && parsedRollCalls !== null) {
        const list = Object.entries(parsedRollCalls).map(([key, val]: [string, any]) => ({
          key,
          ...val
        }));
        setHistoricalRecords(list);
      }

      const activeKey = `${selectedDate}_${selectedGrade}_${selectedStream}`;
      const existingRecord = parsedRollCalls[activeKey] || parsedRollCalls[`${selectedGrade}_${selectedStream}_${selectedDate}`];

      const initialMap: Record<string, { morning: string; afternoon: string; remarks: string }> = {};
      const targetLearners = getFilteredLearners();

      targetLearners.forEach((learner) => {
        const id = learner.id || learner.admissionNo || learner.admissionNumber || Math.random().toString();
        const studentRecord = existingRecord?.students?.[id] || existingRecord?.learners?.[id];
        
        initialMap[id] = {
          morning: studentRecord?.morning || studentRecord?.status || '',
          afternoon: studentRecord?.afternoon || studentRecord?.status || '',
          remarks: studentRecord?.remarks || ''
        };
      });

      setAttendanceMap(initialMap);
    } catch (e) {
      console.error('Error loading roll call records:', e);
    }
  };

  // 2 & 3. Case-Insensitive String Normalization & All Grades/Streams Fallback (Displaying all learners)
  const getFilteredLearners = () => {
    if (!learners || learners.length === 0) return [];

    const filtered = learners.filter(l => {
      const g = String(l.grade || l.classLevel || '').trim().toUpperCase();
      const s = String(l.stream || '').trim().toLowerCase();
      
      const targetGrade = String(selectedGrade).trim().toUpperCase();
      const targetStream = String(selectedStream).trim().toLowerCase();

      const matchesGrade = targetGrade === 'ALL' || g === targetGrade;
      const matchesStream = targetStream === 'all' || s === targetStream;

      return matchesGrade && matchesStream;
    });

    return filtered;
  };

  const cleanAdmissionNo = (adm: string = '') => {
    if (!adm) return 'N/A';
    return adm.replace(/-G\d+-/gi, '-').replace(/\s+/g, '');
  };

  const handleStatusChange = (id: string, session: 'morning' | 'afternoon', status: string) => {
    if (session === 'morning' && morningLocked && (!isAdmin || !bypassCutoff)) {
      toast.error('Morning attendance is locked after 9:40 AM.');
      return;
    }
    if (session === 'afternoon' && afternoonLocked && (!isAdmin || !bypassCutoff)) {
      toast.error('Afternoon attendance is locked after 15:00.');
      return;
    }
    setAttendanceMap(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || { morning: 'Present', afternoon: 'Present', remarks: '' }),
        [session]: status
      }
    }));
  };

  const handleRemarksChange = (id: string, remarks: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || { morning: 'Present', afternoon: 'Present', remarks: '' }),
        remarks
      }
    }));
  };

  const markAll = (session: 'morning' | 'afternoon', status: string) => {
    if (session === 'morning' && morningLocked && (!isAdmin || !bypassCutoff)) {
      toast.error('Morning attendance is locked after 9:40 AM.');
      return;
    }
    if (session === 'afternoon' && afternoonLocked && (!isAdmin || !bypassCutoff)) {
      toast.error('Afternoon attendance is locked after 15:00.');
      return;
    }
    const targetLearners = getFilteredLearners();
    setAttendanceMap(prev => {
      const next = { ...prev };
      targetLearners.forEach(l => {
        const id = l.id || l.admissionNo || l.admissionNumber || '';
        if (id) {
          next[id] = {
            ...(next[id] || { morning: 'Present', afternoon: 'Present', remarks: '' }),
            [session]: status
          };
        }
      });
      return next;
    });
    toast.success(`Marked all filtered learners as ${status} for ${session}`);
  };

  const handleSaveAttendance = () => {
    setIsSaving(true);
    try {
      const targetLearners = getFilteredLearners();
      const activeKey = `${selectedDate}_${selectedGrade}_${selectedStream}`;

      const rawMaster = localStorage.getItem('roll_call_records') || '{}';
      let masterParsed: any = {};
      try {
        masterParsed = JSON.parse(rawMaster);
        if (Array.isArray(masterParsed)) {
          const mapObj: Record<string, any> = {};
          masterParsed.forEach((item, idx) => {
            mapObj[item.key || `record_${idx}`] = item;
          });
          masterParsed = mapObj;
        }
      } catch (err) {
        masterParsed = {};
      }

      const existingRecord = masterParsed[activeKey] || masterParsed[`${selectedGrade}_${selectedStream}_${selectedDate}`] || {};
      const existingStudents = existingRecord.students || existingRecord.learners || {};

      const updatedStudents = Object.fromEntries(
        targetLearners.map(l => {
          const id = l.id || l.admissionNo || l.admissionNumber || '';
          const currentData = attendanceMap[id] || { morning: '', afternoon: '', remarks: '' };
          const existingStudent = existingStudents[id] || {};
          const cleanAdm = cleanAdmissionNo(l.admissionNo || l.admissionNumber || id);

          if (activeSession === 'morning') {
            return [id, {
              id,
              admissionNo: cleanAdm,
              name: l.name || l.fullName || l.learnerName || '',
              morning: currentData.morning,
              afternoon: existingStudent.afternoon || '',
              status: currentData.morning,
              remarks: currentData.remarks || existingStudent.remarks || ''
            }];
          } else {
            return [id, {
              id,
              admissionNo: cleanAdm,
              name: l.name || l.fullName || l.learnerName || '',
              morning: existingStudent.morning || '',
              afternoon: currentData.afternoon,
              status: existingStudent.status || existingStudent.morning || '',
              remarks: currentData.remarks || existingStudent.remarks || ''
            }];
          }
        })
      );

      const recordPayload = {
        date: selectedDate,
        grade: selectedGrade,
        stream: selectedStream,
        updatedAt: new Date().toISOString(),
        markedBy: `Teacher Portal (${activeSession.toUpperCase()} Session)`,
        bypassCutoffUsed: bypassCutoff,
        activeSessionSaved: activeSession,
        students: updatedStudents
      };

      masterParsed[activeKey] = recordPayload;
      masterParsed[`${selectedGrade}_${selectedStream}_${selectedDate}`] = recordPayload;

      localStorage.setItem('roll_call_records', JSON.stringify(masterParsed));
      localStorage.setItem('munyaka_roll_call', JSON.stringify(masterParsed));

      const munyakaRaw = localStorage.getItem('munyaka_attendance_records') || '[]';
      let munyakaList = [];
      try { munyakaList = JSON.parse(munyakaRaw); } catch(e) {}
      if (!Array.isArray(munyakaList)) munyakaList = [];
      
      munyakaList.push(recordPayload);
      localStorage.setItem('munyaka_attendance_records', JSON.stringify(munyakaList));
      localStorage.setItem('school_attendance_v1', JSON.stringify(masterParsed));

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      toast.success(`${activeSession === 'morning' ? 'Morning' : 'Afternoon'} roll call saved successfully!`);
      loadRollCallRecords();
    } catch (e) {
      console.error('Error saving attendance:', e);
      toast.error('Failed to save attendance records.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredLearners = getFilteredLearners().filter(l => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = (l.name || l.fullName || l.learnerName || '').toLowerCase();
    const adm = cleanAdmissionNo(l.admissionNo || l.admissionNumber || '').toLowerCase();
    return name.includes(q) || adm.includes(q);
  });

  const totalLearnersCount = filteredLearners.length;
  const masterTotalCount = learners.length;
  const presentMorningCount = filteredLearners.filter(l => {
    const id = l.id || l.admissionNo || l.admissionNumber || '';
    return attendanceMap[id]?.morning === 'Present';
  }).length;
  const absentMorningCount = filteredLearners.filter(l => {
    const id = l.id || l.admissionNo || l.admissionNumber || '';
    return attendanceMap[id]?.morning === 'Absent';
  }).length;
  const presentAfternoonCount = filteredLearners.filter(l => {
    const id = l.id || l.admissionNo || l.admissionNumber || '';
    return attendanceMap[id]?.afternoon === 'Present';
  }).length;
  const absentAfternoonCount = filteredLearners.filter(l => {
    const id = l.id || l.admissionNo || l.admissionNumber || '';
    return attendanceMap[id]?.afternoon === 'Absent';
  }).length;

  const getFilterBannerDescription = () => {
    const gText = selectedGrade === 'all' ? 'All Grades' : selectedGrade;
    const sText = selectedStream === 'all' ? 'All Streams' : selectedStream;
    return `${gText}, ${sText}`;
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-xs px-2.5 py-0.5 whitespace-nowrap">
              {isAdmin ? 'Admin Portal' : 'Teacher Portal'}
            </Badge>
            <Badge variant="outline" className="bg-emerald-500/30 text-emerald-100 border-emerald-400/40 text-xs flex items-center gap-1 whitespace-nowrap">
              <Sparkles className="w-3 h-3" /> Master Directory Synced
            </Badge>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Learner Attendance & Roll Call</h1>
          <p className="text-emerald-100 text-sm mt-1">
            Directly synchronized with the primary master learners database and Admin Roll Call records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <>
              <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-xl border border-white/10">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-100">
                  {bypassCutoff ? <Unlock className="w-4 h-4 text-emerald-300" /> : <Lock className="w-4 h-4 text-amber-300" />}
                  <span>Admin Schedule Override:</span>
                </div>
                <Button
                  size="sm"
                  variant={bypassCutoff ? 'default' : 'outline'}
                  className={`h-7 text-xs px-3 ${bypassCutoff ? 'bg-emerald-500 text-white hover:bg-emerald-600 border-none' : 'bg-white/10 text-white hover:bg-white/20 border-white/20'}`}
                  onClick={() => {
                    setBypassCutoff(!bypassCutoff);
                    toast.success(bypassCutoff ? 'Admin Schedule Override turned off (enforcing cutoff times).' : 'Admin Schedule Override Active (bypassing time cutoffs)!');
                  }}
                >
                  {bypassCutoff ? 'Active' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-xl border border-white/10">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-100">
                  {morningLocked ? <Lock className="w-4 h-4 text-rose-300" /> : <Unlock className="w-4 h-4 text-emerald-300" />}
                  <span>Manual Morning:</span>
                </div>
                <Button
                  size="sm"
                  variant={morningLocked ? 'destructive' : 'outline'}
                  className={`h-7 text-xs px-3 ${morningLocked ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-emerald-500/80 text-white hover:bg-emerald-600 border-none'}`}
                  onClick={toggleManualMorningLock}
                >
                  {morningLocked ? 'Locked' : 'Unlocked'}
                </Button>
              </div>

              <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-xl border border-white/10">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-100">
                  {afternoonLocked ? <Lock className="w-4 h-4 text-rose-300" /> : <Unlock className="w-4 h-4 text-emerald-300" />}
                  <span>Manual Afternoon:</span>
                </div>
                <Button
                  size="sm"
                  variant={afternoonLocked ? 'destructive' : 'outline'}
                  className={`h-7 text-xs px-3 ${afternoonLocked ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-emerald-500/80 text-white hover:bg-emerald-600 border-none'}`}
                  onClick={toggleManualAfternoonLock}
                >
                  {afternoonLocked ? 'Locked' : 'Unlocked'}
                </Button>
              </div>
            </>
          )}

          <Button
            onClick={() => {
              loadMasterLearners();
              loadRollCallRecords();
              toast.success('Refreshed learners & attendance data');
            }}
            variant="outline"
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 gap-2 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
          </Button>
        </div>
      </div>

  {/* Status Indicators & Helper Message */}
      <div className="space-y-4">
        {/* Status Indicators */}
        <div className="flex gap-3">
          <span className={`px-3 py-1 rounded-lg text-xs font-bold text-white ${isMorningOpen ? 'bg-emerald-600' : 'bg-rose-600'}`}>
            Morning Session: {isMorningOpen ? 'Unlocked (Active)' : 'Locked'}
          </span>
          <span className={`px-3 py-1 rounded-lg text-xs font-bold text-white ${isAfternoonOpen ? 'bg-emerald-600' : 'bg-rose-600'}`}>
            Afternoon Session: {isAfternoonOpen ? 'Unlocked (Active)' : 'Locked'}
          </span>
        </div>

        {/* Helper Message */}
        <p className="text-xs text-slate-500">
          * Morning marking active {morningFromTime} – {morningCutoffTime}. Afternoon marking active {afternoonFromTime} – {afternoonCutoffTime}.
        </p>
      </div>

  {/* Time Lock Status Banners */}
  {morningLocked && (!isAdmin || !bypassCutoff) && (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 text-amber-600" />
        <div>
          <p className="text-sm font-bold text-amber-900">Morning attendance is locked after {morningCutoffTime}.</p>
          <p className="text-xs text-amber-700">Submissions and status updates for morning sessions are restricted. {isAdmin ? 'Administrators can bypass using the toggle above or adjust cutoff time.' : ''}</p>
        </div>
      </div>
      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Morning Locked</Badge>
    </div>
  )}

  {afternoonLocked && (!isAdmin || !bypassCutoff) && (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 text-amber-600" />
        <div>
          <p className="text-sm font-bold text-amber-900">Afternoon attendance is locked after {afternoonCutoffTime}.</p>
          <p className="text-xs text-amber-700">Submissions and status updates for afternoon sessions are restricted. {isAdmin ? 'Administrators can bypass using the toggle above or adjust cutoff time.' : ''}</p>
        </div>
      </div>
      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Afternoon Locked</Badge>
    </div>
  )}

  {/* Admin Cutoff Settings Box */}
  {isAdmin && (
    <Card className="border-indigo-100 bg-indigo-50/40 shadow-sm">
      <CardContent className="p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-indigo-950">Configurable Attendance Cutoff Times</h4>
            <p className="text-xs text-indigo-700">Customize the exact locking hours and time ranges for morning and afternoon sessions across the school.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-indigo-200">
            <span className="text-xs font-semibold text-slate-700">Morning From:</span>
            <input
              type="time"
              value={morningFromTime}
              onChange={(e) => handleMorningFromChange(e.target.value)}
              className="text-xs font-mono font-bold text-indigo-900 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-indigo-200">
            <span className="text-xs font-semibold text-slate-700">Morning To:</span>
            <input
              type="time"
              value={morningCutoffTime}
              onChange={(e) => handleMorningCutoffChange(e.target.value)}
              className="text-xs font-mono font-bold text-indigo-900 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-indigo-200">
            <span className="text-xs font-semibold text-slate-700">Afternoon From:</span>
            <input
              type="time"
              value={afternoonFromTime}
              onChange={(e) => handleAfternoonFromChange(e.target.value)}
              className="text-xs font-mono font-bold text-indigo-900 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-indigo-200">
            <span className="text-xs font-semibold text-slate-700">Afternoon To:</span>
            <input
              type="time"
              value={afternoonCutoffTime}
              onChange={(e) => handleAfternoonCutoffChange(e.target.value)}
              className="text-xs font-mono font-bold text-indigo-900 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )}

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem', width: '100%' }}>
        <Card className="border-emerald-100 shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Learners</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{totalLearnersCount}</h3>
              <p className="text-[10px] text-emerald-600 font-medium mt-1">Master DB: {masterTotalCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Present (Morning)</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-1">{presentMorningCount}</h3>
              <p className="text-[10px] text-slate-500 mt-1">
                {totalLearnersCount > 0 ? `${Math.round((presentMorningCount / totalLearnersCount) * 100)}% rate` : '0%'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 shadow-sm bg-gradient-to-br from-white to-amber-50/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Absent (Morning)</p>
              <h3 className="text-xl font-bold text-amber-600 mt-1">{absentMorningCount}</h3>
              <p className="text-[10px] text-amber-600 font-medium mt-1">Follow-up needed</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
              <XCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-100 shadow-sm bg-gradient-to-br from-white to-indigo-50/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Present (Afternoon)</p>
              <h3 className="text-xl font-bold text-indigo-600 mt-1">{presentAfternoonCount}</h3>
              <p className="text-[10px] text-slate-500 mt-1">
                {totalLearnersCount > 0 ? `${Math.round((presentAfternoonCount / totalLearnersCount) * 100)}% rate` : '0%'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 shadow-sm bg-gradient-to-br from-white to-orange-50/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Absent (Afternoon)</p>
              <h3 className="text-xl font-bold text-orange-600 mt-1">{absentAfternoonCount}</h3>
              <p className="text-[10px] text-orange-600 font-medium mt-1">Follow-up needed</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-inner">
              <XCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-cyan-100 shadow-sm bg-gradient-to-br from-white to-cyan-50/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Roll Storage</p>
              <h3 className="text-sm font-bold text-cyan-700 mt-1 truncate">roll_call</h3>
              <p className="text-[10px] text-cyan-600 font-medium mt-1">Synced</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-700 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="border-slate-200/80 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
                Roll Call Completion Register
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Mark morning and afternoon attendance. Writes directly to shared admin storage keys.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleSaveAttendance}
                disabled={isSaving || totalLearnersCount === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md gap-2"
              >
                <Save className="w-4 h-4" />
                {savedSuccess ? 'Saved Successfully!' : 'Save Roll Call'}
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200/60">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Grade / Class</label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="bg-white border-slate-200 h-9 text-xs">
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Stream</label>
              <Select value={selectedStream} onValueChange={setSelectedStream}>
                <SelectTrigger className="bg-white border-slate-200 h-9 text-xs">
                  <SelectValue placeholder="Select Stream" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Streams</SelectItem>
                  {streams.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Active Session</label>
              <div className="inline-flex rounded-lg p-1 bg-slate-200/80 border border-slate-300 w-full h-9">
                <button
                  type="button"
                  onClick={() => {
                    const parseTimeToMinutes = (timeStr: string) => {
                      const [hours, minutes] = (timeStr || '09:40').split(':').map(Number);
                      return (isNaN(hours) ? 9 : hours) * 60 + (isNaN(minutes) ? 40 : minutes);
                    };
                    const now = new Date();
                    const currentMinutes = now.getHours() * 60 + now.getMinutes();
                    const morningCutoffMins = parseTimeToMinutes(morningCutoffTime);
                    const isMorningLocked = currentMinutes >= morningCutoffMins && !bypassCutoff && !manualMorningLock;
                    if (isMorningLocked && (!isAdmin || !bypassCutoff)) {
                      toast.error(`Session is locked based on the configured cutoff time (${morningCutoffTime})`);
                      return;
                    }
                    setActiveSession('morning');
                  }}
                  className={`flex-1 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeSession === 'morning'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  } ${morningLocked && (!isAdmin || !bypassCutoff) ? 'opacity-60 cursor-not-allowed' : ''}`}
                  title={morningLocked && (!isAdmin || !bypassCutoff) ? `Session is locked based on the configured cutoff time (${morningCutoffTime})` : ''}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {morningLocked && (!isAdmin || !bypassCutoff) ? <Lock className="w-3 h-3 ml-1" /> : null}
                  Morning Roll Call
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const parseTimeToMinutes = (timeStr: string) => {
                      const [hours, minutes] = (timeStr || '15:00').split(':').map(Number);
                      return (isNaN(hours) ? 15 : hours) * 60 + (isNaN(minutes) ? 0 : minutes);
                    };
                    const now = new Date();
                    const currentMinutes = now.getHours() * 60 + now.getMinutes();
                    const afternoonCutoffMins = parseTimeToMinutes(afternoonCutoffTime);
                    const isAfternoonLocked = currentMinutes >= afternoonCutoffMins && !bypassCutoff && !manualAfternoonLock;
                    if (isAfternoonLocked && (!isAdmin || !bypassCutoff)) {
                      toast.error(`Session is locked based on the configured cutoff time (${afternoonCutoffTime})`);
                      return;
                    }
                    setActiveSession('afternoon');
                  }}
                  className={`flex-1 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeSession === 'afternoon'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  } ${afternoonLocked && (!isAdmin || !bypassCutoff) ? 'opacity-60 cursor-not-allowed' : ''}`}
                  title={afternoonLocked && (!isAdmin || !bypassCutoff) ? `Session is locked based on the configured cutoff time (${afternoonCutoffTime})` : ''}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {afternoonLocked && (!isAdmin || !bypassCutoff) ? <Lock className="w-3 h-3 ml-1" /> : null}
                  Afternoon Roll Call
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Search Learner</label>
              <div className="relative">
                <Input
                  placeholder="Name or Admission No..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border-slate-200 h-9 text-xs pl-8"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Banner Message */}
          <div className="bg-emerald-50/50 px-6 py-3 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-medium">
              <AlertCircle className="w-4 h-4 text-emerald-600" />
              <span>Showing <strong>{totalLearnersCount}</strong> learners — Active Session: <strong className="uppercase text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded">{activeSession}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Quick Mark All ({activeSession}):</span>
              <Button size="sm" variant="outline" className="h-7 text-xs bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-100" onClick={() => markAll(activeSession, 'Present')}>
                All {activeSession} Present
              </Button>
            </div>
          </div>

          {/* Learners Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap text-[10px]">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200 text-[10px] uppercase tracking-tight">
                  <th className="py-1.5 px-2 w-8 text-center whitespace-nowrap">#</th>
                  <th className="py-1.5 px-2 whitespace-nowrap">Admission No</th>
                  <th className="py-1.5 px-2 whitespace-nowrap">Learner Name</th>
                  <th className="py-1.5 px-2 whitespace-nowrap">Grade / Stream</th>
                  <th className="py-1.5 px-2 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold leading-tight whitespace-nowrap ${activeSession === 'morning' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-200 text-slate-700'}`}>
                      Morning Roll Call {activeSession === 'morning' && '• Active'}
                    </span>
                  </th>
                  <th className="py-1.5 px-2 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold leading-tight whitespace-nowrap ${activeSession === 'afternoon' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-200 text-slate-700'}`}>
                      Afternoon Roll Call {activeSession === 'afternoon' && '• Active'}
                    </span>
                  </th>
                  <th className="py-1.5 px-2 whitespace-nowrap">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLearners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="w-10 h-10 text-slate-300" />
                        <p className="font-medium text-slate-600">No learners found in master database matching this filter.</p>
                        <p className="text-slate-400 text-xs">Select "All Grades" and "All Streams" to view all registered master learners.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLearners.map((learner, idx) => {
                    const id = learner.id || learner.admissionNo || learner.admissionNumber || `learner_${idx}`;
                    const adm = cleanAdmissionNo(learner.admissionNo || learner.admissionNumber);
                    const name = learner.name || learner.fullName || learner.learnerName || 'Unnamed Learner';
                    const grade = learner.grade || learner.classLevel || '-';
                    const stream = learner.stream || '-';
                    
                    const currentData = attendanceMap[id] || { morning: 'Present', afternoon: 'Present', remarks: '' };

                    return (
                      <tr key={id} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                        <td className="py-1.5 px-2 text-center font-medium text-slate-400 text-[10px] whitespace-nowrap">{idx + 1}</td>
                        <td className="py-1.5 px-2 font-mono font-medium text-slate-700 text-[10px] whitespace-nowrap">{adm}</td>
                        <td className="py-1.5 px-2 font-semibold text-slate-900 text-[11px] whitespace-nowrap">{name}</td>
                        <td className="py-1.5 px-2 text-slate-600 whitespace-nowrap">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 whitespace-nowrap">
                            {grade} {stream && stream !== '-' ? `• ${stream}` : ''}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-center whitespace-nowrap">
                          <div className={`inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 ${morningLocked && (!isAdmin || !bypassCutoff) ? 'opacity-60 cursor-not-allowed' : ''}`}>
                            {['Present', 'Absent', 'Late', 'Excused'].map(status => {
                              const active = currentData.morning === status;
                              const isLocked = morningLocked && (!isAdmin || !bypassCutoff);
                              return (
                                <button
                                  key={status}
                                  type="button"
                                  disabled={isLocked}
                                  onClick={() => handleStatusChange(id, 'morning', status)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition-all ${
                                    isLocked ? 'cursor-not-allowed' : ''
                                  } ${
                                    active
                                      ? status === 'Present' ? 'bg-emerald-600 text-white shadow-sm'
                                        : status === 'Absent' ? 'bg-rose-600 text-white shadow-sm'
                                        : status === 'Late' ? 'bg-amber-500 text-white shadow-sm'
                                        : 'bg-cyan-600 text-white shadow-sm'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  {status.charAt(0)}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-center whitespace-nowrap">
                          <div className={`inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 ${afternoonLocked && (!isAdmin || !bypassCutoff) ? 'opacity-60 cursor-not-allowed' : ''}`}>
                            {['Present', 'Absent', 'Late', 'Excused'].map(status => {
                              const active = currentData.afternoon === status;
                              const isLocked = afternoonLocked && (!isAdmin || !bypassCutoff);
                              return (
                                <button
                                  key={status}
                                  type="button"
                                  disabled={isLocked}
                                  onClick={() => handleStatusChange(id, 'afternoon', status)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition-all ${
                                    isLocked ? 'cursor-not-allowed' : ''
                                  } ${
                                    active
                                      ? status === 'Present' ? 'bg-indigo-600 text-white shadow-sm'
                                        : status === 'Absent' ? 'bg-rose-600 text-white shadow-sm'
                                        : status === 'Late' ? 'bg-amber-500 text-white shadow-sm'
                                        : 'bg-cyan-600 text-white shadow-sm'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  {status.charAt(0)}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-1.5 px-2 whitespace-nowrap">
                          <Input
                            placeholder="Optional remarks..."
                            value={currentData.remarks}
                            onChange={(e) => handleRemarksChange(id, e.target.value)}
                            className="h-7 text-[10px] bg-white border-slate-200 px-2"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Legend: <strong>P</strong> = Present, <strong>A</strong> = Absent, <strong>L</strong> = Late, <strong>E</strong> = Excused
            </p>
            <Button
              onClick={handleSaveAttendance}
              disabled={isSaving || totalLearnersCount === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md gap-2"
            >
              <Save className="w-4 h-4" />
              {savedSuccess ? 'Saved Successfully!' : 'Save Roll Call'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
