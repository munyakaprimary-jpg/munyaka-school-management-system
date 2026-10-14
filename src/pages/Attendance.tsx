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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bypassCutoff, setBypassCutoff] = useState<boolean>(true);
  
  // Independent Manual Attendance Locks
  const [manualMorningLock, setManualMorningLock] = useState<boolean>(() => {
    return localStorage.getItem('manual_morning_lock') === 'true';
  });
  const [manualAfternoonLock, setManualAfternoonLock] = useState<boolean>(() => {
    return localStorage.getItem('manual_afternoon_lock') === 'true';
  });

  // Configurable Cutoff Time Settings
  const [morningCutoffTime, setMorningCutoffTime] = useState<string>(() => {
    return localStorage.getItem('attendance_morning_cutoff') || '09:40';
  });
  const [afternoonCutoffTime, setAfternoonCutoffTime] = useState<string>(() => {
    return localStorage.getItem('attendance_afternoon_cutoff') || '15:00';
  });
  
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { morning: string; afternoon: string; remarks: string }>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [historicalRecords, setHistoricalRecords] = useState<any[]>([]);

  // Time Lock & Role check helper
  const { user } = useAuth();
  const roleStr = String((user as any)?.role || '');
  const isAdmin = roleStr === 'admin' || roleStr === 'head_teacher' || roleStr === 'owner' || user?.email?.includes('admin');

  const checkIsLocked = (session: 'morning' | 'afternoon') => {
    if (session === 'morning' && manualMorningLock) return true;
    if (session === 'afternoon' && manualAfternoonLock) return true;

    if (isAdmin && bypassCutoff) return false;
    
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeMinutes = currentHours * 60 + currentMinutes;

    if (session === 'morning') {
      const [mHours, mMinutes] = morningCutoffTime.split(':').map(Number);
      const cutoffMinutes = (isNaN(mHours) ? 9 : mHours) * 60 + (isNaN(mMinutes) ? 40 : mMinutes);
      return currentTimeMinutes > cutoffMinutes;
    } else {
      const [aHours, aMinutes] = afternoonCutoffTime.split(':').map(Number);
      const cutoffMinutes = (isNaN(aHours) ? 15 : aHours) * 60 + (isNaN(aMinutes) ? 0 : aMinutes);
      return currentTimeMinutes >= cutoffMinutes;
    }
  };

  const morningLocked = checkIsLocked('morning');
  const afternoonLocked = checkIsLocked('afternoon');

  const handleMorningCutoffChange = (newVal: string) => {
    setMorningCutoffTime(newVal);
    localStorage.setItem('attendance_morning_cutoff', newVal);
    toast.success(`Morning attendance cutoff updated to ${newVal}`);
  };

  const handleAfternoonCutoffChange = (newVal: string) => {
    setAfternoonCutoffTime(newVal);
    localStorage.setItem('attendance_afternoon_cutoff', newVal);
    toast.success(`Afternoon attendance cutoff updated to ${newVal}`);
  };

  const toggleManualMorningLock = () => {
    const nextVal = !manualMorningLock;
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
      // 1. Try unified getStoredLearners from learnersStore
      let list: Learner[] = [];
      try {
        const storedFromHelper = getStoredLearners();
        if (Array.isArray(storedFromHelper) && storedFromHelper.length > 0) {
          list = storedFromHelper;
        }
      } catch (err) {}

      // 2. Fallback to direct keys if needed
      if (list.length === 0) {
        const keys = ['munyaka_learners_db', 'munyaka_central_db', 'munyaka_learners', 'school_learners_v1', 'school_learners_data', 'learners'];
        for (const key of keys) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              const items = Array.isArray(parsed) ? parsed : (parsed.learners || parsed.students || parsed.data || []);
              if (Array.isArray(items) && items.length > 0) {
                list = items;
                break;
              }
            } catch (e) {}
          }
        }
      }

      setLearners(list);

      // Extract unique grades & streams with case-insensitivity & normalization
      const gradeSet = new Set<string>();
      const streamSet = new Set<string>();

      list.forEach((l) => {
        const g = l.grade || l.classLevel;
        const s = l.stream;
        if (g && String(g).trim()) {
          // Normalize: uppercase and trimmed
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
      
      const recordPayload = {
        date: selectedDate,
        grade: selectedGrade,
        stream: selectedStream,
        updatedAt: new Date().toISOString(),
        markedBy: 'Teacher Portal',
        bypassCutoffUsed: bypassCutoff,
        students: Object.fromEntries(
          targetLearners.map(l => {
            const id = l.id || l.admissionNo || l.admissionNumber || '';
            const data = attendanceMap[id] || { morning: 'Present', afternoon: 'Present', remarks: '' };
            const cleanAdm = cleanAdmissionNo(l.admissionNo || l.admissionNumber || id);
            return [id, {
              id,
              admissionNo: cleanAdm,
              name: l.name || l.fullName || l.learnerName || 'Unknown Learner',
              morning: data.morning,
              afternoon: data.afternoon,
              status: data.morning,
              remarks: data.remarks
            }];
          })
        )
      };

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

      masterParsed[activeKey] = recordPayload;
      masterParsed[`${selectedGrade}_${selectedStream}_${selectedDate}`] = recordPayload;

      localStorage.setItem('roll_call_records', JSON.stringify(masterParsed));

      const munyakaRaw = localStorage.getItem('munyaka_attendance_records') || '[]';
      let munyakaList = [];
      try { munyakaList = JSON.parse(munyakaRaw); } catch(e) {}
      if (!Array.isArray(munyakaList)) munyakaList = [];
      
      munyakaList.push(recordPayload);
      localStorage.setItem('munyaka_attendance_records', JSON.stringify(munyakaList));
      localStorage.setItem('school_attendance_v1', JSON.stringify(masterParsed));

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      toast.success('Roll call saved successfully and synchronized with Admin Attendance records!');
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
      <div className="flex items-center gap-2 mb-1">
        <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-xs px-2.5 py-0.5">
          Teacher Portal
        </Badge>
        <Badge variant="outline" className="bg-emerald-500/30 text-emerald-100 border-emerald-400/40 text-xs flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Master Directory Sync (`munyaka_learners_db`)
        </Badge>
      </div>
      <h1 className="text-2xl font-black tracking-tight">Student Attendance & Roll Call</h1>
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
              <span>Time-Lock Bypass:</span>
            </div>
            <Button
              size="sm"
              variant={bypassCutoff ? 'default' : 'outline'}
              className={`h-7 text-xs px-3 ${bypassCutoff ? 'bg-emerald-500 text-white hover:bg-emerald-600 border-none' : 'bg-white/10 text-white hover:bg-white/20 border-white/20'}`}
              onClick={() => {
                setBypassCutoff(!bypassCutoff);
                toast.success(bypassCutoff ? 'Time cutoff lock active.' : 'Time cutoff restrictions bypassed for testing!');
              }}
            >
              {bypassCutoff ? 'Bypassed (Dev/Testing)' : 'Enforced'}
            </Button>
          </div>

          <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-xl border border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-100">
              {manualMorningLock ? <Lock className="w-4 h-4 text-rose-300" /> : <Unlock className="w-4 h-4 text-emerald-300" />}
              <span>Manual Morning:</span>
            </div>
            <Button
              size="sm"
              variant={manualMorningLock ? 'destructive' : 'outline'}
              className={`h-7 text-xs px-3 ${manualMorningLock ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-white/10 text-white hover:bg-white/25 border-white/20'}`}
              onClick={toggleManualMorningLock}
            >
              {manualMorningLock ? 'Locked' : 'Unlocked'}
            </Button>
          </div>

          <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-xl border border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-100">
              {manualAfternoonLock ? <Lock className="w-4 h-4 text-rose-300" /> : <Unlock className="w-4 h-4 text-emerald-300" />}
              <span>Manual Afternoon:</span>
            </div>
            <Button
              size="sm"
              variant={manualAfternoonLock ? 'destructive' : 'outline'}
              className={`h-7 text-xs px-3 ${manualAfternoonLock ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-white/10 text-white hover:bg-white/25 border-white/20'}`}
              onClick={toggleManualAfternoonLock}
            >
              {manualAfternoonLock ? 'Locked' : 'Unlocked'}
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
      <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-indigo-950">Configurable Attendance Cutoff Times</h4>
            <p className="text-xs text-indigo-700">Customize the exact locking hours for morning and afternoon sessions across the school.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-indigo-200">
            <span className="text-xs font-semibold text-slate-700">Morning Cutoff:</span>
            <input
              type="time"
              value={morningCutoffTime}
              onChange={(e) => handleMorningCutoffChange(e.target.value)}
              className="text-xs font-mono font-bold text-indigo-900 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-indigo-200">
            <span className="text-xs font-semibold text-slate-700">Afternoon Cutoff:</span>
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
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Attendance Date</label>
              <div className="relative">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-white border-slate-200 h-9 text-xs pl-8"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
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
              <span>Showing <strong>{totalLearnersCount}</strong> learners ({getFilterBannerDescription()}) — Master DB Total: <strong>{masterTotalCount}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Quick Mark All:</span>
              <Button size="sm" variant="outline" className="h-7 text-xs bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-100" onClick={() => markAll('morning', 'Present')}>
                All Morning Present
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-100" onClick={() => markAll('afternoon', 'Present')}>
                All Afternoon Present
              </Button>
            </div>
          </div>

          {/* Learners Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Admission No</th>
                  <th className="py-3 px-4">Learner Name</th>
                  <th className="py-3 px-4">Grade / Stream</th>
                  <th className="py-3 px-4 text-center">Morning Roll Call</th>
                  <th className="py-3 px-4 text-center">Afternoon Roll Call</th>
                  <th className="py-3 px-4">Remarks</th>
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
                      <tr key={id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">{adm}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{name}</td>
                        <td className="py-3 px-4 text-slate-600">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
                            {grade} {stream && stream !== '-' ? `• ${stream}` : ''}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
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
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
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
                        <td className="py-3 px-4 text-center">
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
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
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
                        <td className="py-3 px-4">
                          <Input
                            placeholder="Optional remarks..."
                            value={currentData.remarks}
                            onChange={(e) => handleRemarksChange(id, e.target.value)}
                            className="h-8 text-xs bg-white border-slate-200"
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
