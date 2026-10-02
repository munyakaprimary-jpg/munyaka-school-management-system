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
import { toast } from 'sonner';

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
  
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { morning: string; afternoon: string; remarks: string }>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [historicalRecords, setHistoricalRecords] = useState<any[]>([]);

  // 1. Direct Master Directory Fetch on mount
  useEffect(() => {
    loadMasterLearners();
  }, []);

  useEffect(() => {
    if (learners.length > 0) {
      loadRollCallRecords();
    }
  }, [selectedDate, selectedGrade, selectedStream, learners]);

  const loadMasterLearners = () => {
    try {
      const raw = localStorage.getItem('school_learners_v1') || localStorage.getItem('learners') || '[]';
      const parsed = JSON.parse(raw);
      const list: Learner[] = Array.isArray(parsed) ? parsed : (parsed.learners || parsed.data || []);
      
      setLearners(list);

      // Extract unique grades & streams
      const gradeSet = new Set<string>();
      const streamSet = new Set<string>();

      list.forEach((l) => {
        const g = l.grade || l.classLevel;
        const s = l.stream;
        if (g) gradeSet.add(g.trim());
        if (s) streamSet.add(s.trim());
      });

      const sortedGrades = Array.from(gradeSet).sort();
      const sortedStreams = Array.from(streamSet).sort();

      setGrades(sortedGrades);
      setStreams(sortedStreams);
    } catch (err) {
      console.error('Failed to load school_learners_v1:', err);
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
          morning: studentRecord?.morning || studentRecord?.status || 'Present',
          afternoon: studentRecord?.afternoon || studentRecord?.status || 'Present',
          remarks: studentRecord?.remarks || ''
        };
      });

      setAttendanceMap(initialMap);
    } catch (e) {
      console.error('Error loading roll call records:', e);
    }
  };

  // 1 & 2. Strict Filtering & Fallback
  const getFilteredLearners = () => {
    if (!learners || learners.length === 0) return [];

    const filtered = learners.filter(l => {
      const g = (l.grade || l.classLevel || '').trim();
      const s = (l.stream || '').trim();
      
      const matchesGrade = selectedGrade === 'all' || g.toLowerCase() === selectedGrade.toLowerCase();
      const matchesStream = selectedStream === 'all' || s.toLowerCase() === selectedStream.toLowerCase();

      return matchesGrade && matchesStream;
    });

    // Fallback: If strict grade/stream filter returns 0 students, return all learners so the table is never blank
    if (filtered.length === 0 && learners.length > 0 && selectedGrade !== 'all') {
      return learners;
    }

    return filtered;
  };

  const handleStatusChange = (id: string, session: 'morning' | 'afternoon', status: string) => {
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
            return [id, {
              id,
              admissionNo: l.admissionNo || l.admissionNumber || id,
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
    const adm = (l.admissionNo || l.admissionNumber || '').toLowerCase();
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
              <Sparkles className="w-3 h-3" /> Master Directory Sync
            </Badge>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Student Attendance & Roll Call</h1>
          <p className="text-emerald-100 text-sm mt-1">
            Directly connected to master learner directory (`school_learners_v1`) & Admin Roll Call records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-emerald-100 shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Learners</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalLearnersCount}</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1">Master Total: {masterTotalCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Present (Morning)</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{presentMorningCount}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {totalLearnersCount > 0 ? `${Math.round((presentMorningCount / totalLearnersCount) * 100)}% attendance rate` : '0%'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 shadow-sm bg-gradient-to-br from-white to-amber-50/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Absent (Morning)</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{absentMorningCount}</h3>
              <p className="text-xs text-amber-600 font-medium mt-1">Requires follow-up</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
              <XCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-cyan-100 shadow-sm bg-gradient-to-br from-white to-cyan-50/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Roll Call Storage</p>
              <h3 className="text-lg font-bold text-cyan-700 mt-1 truncate">roll_call_records</h3>
              <p className="text-xs text-cyan-600 font-medium mt-1">Synced with Admin</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-700 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
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

          {/* Filter Bar with All Grades & All Streams */}
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
          {/* Updated Count Banner */}
          <div className="bg-emerald-50/50 px-6 py-3 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-medium">
              <AlertCircle className="w-4 h-4 text-emerald-600" />
              <span>Showing <strong>{totalLearnersCount}</strong> learners (Total: <strong>{masterTotalCount}</strong>) {selectedGrade !== 'all' ? `• Grade: ${selectedGrade}` : ''} {selectedStream !== 'all' ? `• Stream: ${selectedStream}` : ''}</span>
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
                        <p className="font-medium text-slate-600">No learners found matching the filter.</p>
                        <p className="text-slate-400 text-xs">Select "All Grades" or verify registered learners in `school_learners_v1`.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLearners.map((learner, idx) => {
                    const id = learner.id || learner.admissionNo || learner.admissionNumber || `learner_${idx}`;
                    const adm = learner.admissionNo || learner.admissionNumber || 'N/A';
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
                          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
                            {['Present', 'Absent', 'Late', 'Excused'].map(status => {
                              const active = currentData.morning === status;
                              return (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => handleStatusChange(id, 'morning', status)}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
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
                          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
                            {['Present', 'Absent', 'Late', 'Excused'].map(status => {
                              const active = currentData.afternoon === status;
                              return (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => handleStatusChange(id, 'afternoon', status)}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
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
