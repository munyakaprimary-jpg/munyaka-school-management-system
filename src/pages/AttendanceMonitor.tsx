import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  UserX, 
  Search, 
  RefreshCw, 
  Activity,
  CheckCircle2,
  Calendar,
  ShieldAlert,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface AttendanceRecord {
  id: string;
  teacherName: string;
  department: string;
  date: string;
  arrival: string;
  departure: string;
  status: 'Present' | 'Departed' | 'Early Departure' | 'Absent';
  earlyDepartureReason?: string;
  avatarUrl?: string;
}

const INITIAL_RECORDS: AttendanceRecord[] = [
  {
    id: '1',
    teacherName: 'Dr. Margaret Akoth',
    department: 'Mathematics',
    date: new Date().toISOString().split('T')[0],
    arrival: '07:15 AM',
    departure: '-',
    status: 'Present',
  },
  {
    id: '2',
    teacherName: 'John Kamau',
    department: 'Sciences',
    date: new Date().toISOString().split('T')[0],
    arrival: '07:30 AM',
    departure: '01:15 PM',
    status: 'Departed',
  },
  {
    id: '3',
    teacherName: 'Sarah Ochieng',
    department: 'Languages',
    date: new Date().toISOString().split('T')[0],
    arrival: '07:22 AM',
    departure: '11:30 AM',
    status: 'Early Departure',
    earlyDepartureReason: 'Medical appointment at County Referral Hospital',
  },
  {
    id: '4',
    teacherName: 'David Njoroge',
    department: 'Humanities',
    date: new Date().toISOString().split('T')[0],
    arrival: '-',
    departure: '-',
    status: 'Absent',
    earlyDepartureReason: 'Unexcused / Sick leave pending approval',
  },
  {
    id: '5',
    teacherName: 'Grace Wanjiku',
    department: 'Creative Arts',
    date: new Date().toISOString().split('T')[0],
    arrival: '07:05 AM',
    departure: '-',
    status: 'Present',
  },
  {
    id: '6',
    teacherName: 'Patrick Omondi',
    department: 'ICT & Computer Studies',
    date: new Date().toISOString().split('T')[0],
    arrival: '07:45 AM',
    departure: '02:00 PM',
    status: 'Departed',
  },
  {
    id: '7',
    teacherName: 'Beatrice Mutua',
    department: 'Primary Section',
    date: new Date().toISOString().split('T')[0],
    arrival: '07:12 AM',
    departure: '12:00 PM',
    status: 'Early Departure',
    earlyDepartureReason: 'Family bereavement emergency',
  },
  {
    id: '8',
    teacherName: 'Hassan Juma',
    department: 'Physical Education',
    date: new Date().toISOString().split('T')[0],
    arrival: '07:20 AM',
    departure: '-',
    status: 'Present',
  },
];

export default function AttendanceMonitor() {
  const [isLive, setIsLive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>(INITIAL_RECORDS);
  const [lastRefresh, setLastRefresh] = useState<string>(
    new Date().toLocaleTimeString('en-US', { hour12: false })
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastRefresh(new Date().toLocaleTimeString('en-US', { hour12: false }));
      setIsRefreshing(false);
    }, 600);
  };

  // Auto refresh every 8s when live is enabled
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setLastRefresh(new Date().toLocaleTimeString('en-US', { hour12: false }));
      // Optional simulation of slight live update if needed
    }, 8000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Compute stats
  const presentCount = records.filter(r => r.status === 'Present').length;
  const departedCount = records.filter(r => r.status === 'Departed').length;
  const earlyDepartureCount = records.filter(r => r.status === 'Early Departure').length;
  const absentCount = records.filter(r => r.status === 'Absent').length;
  const totalActiveTeachers = records.length;

  // Filter records in real time
  const filteredRecords = records.filter(r => 
    r.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.earlyDepartureReason && r.earlyDepartureReason.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Attendance Monitor
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-950">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              (•) LIVE
            </span>
          </div>
          <p className="text-sm font-medium text-slate-400">
            Principal&apos;s real-time tracking dashboard <span className="mx-1.5 opacity-60">•</span> Last refresh: {lastRefresh}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live</span>
            <Switch 
              checked={isLive} 
              onCheckedChange={setIsLive} 
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white rounded-xl gap-2 font-semibold transition-all shadow-sm"
          >
            <RefreshCw size={15} className={cn(isRefreshing && "animate-spin text-emerald-400")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Present Card */}
        <Card className="bg-slate-900/80 border-slate-800/80 rounded-2xl shadow-xl overflow-hidden relative group hover:border-emerald-500/30 transition-all">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Present</p>
              <h3 className="text-3xl font-black text-white tracking-tight">{presentCount}</h3>
              <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <span>Active on campus</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
          </CardContent>
        </Card>

        {/* Departed Card */}
        <Card className="bg-slate-900/80 border-slate-800/80 rounded-2xl shadow-xl overflow-hidden relative group hover:border-blue-500/30 transition-all">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Departed</p>
              <h3 className="text-3xl font-black text-white tracking-tight">{departedCount}</h3>
              <p className="text-[11px] font-semibold text-blue-400 flex items-center gap-1">
                <span>Checked out normally</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Clock size={24} />
            </div>
          </CardContent>
        </Card>

        {/* Early Departure Card */}
        <Card className="bg-slate-900/80 border-slate-800/80 rounded-2xl shadow-xl overflow-hidden relative group hover:border-amber-500/30 transition-all">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Early Departure</p>
              <h3 className="text-3xl font-black text-white tracking-tight">{earlyDepartureCount}</h3>
              <p className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                <span>Left before shift end</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <AlertTriangle size={24} />
            </div>
          </CardContent>
        </Card>

        {/* Absent Card */}
        <Card className="bg-slate-900/80 border-slate-800/80 rounded-2xl shadow-xl overflow-hidden relative group hover:border-rose-500/30 transition-all">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Absent</p>
              <h3 className="text-3xl font-black text-white tracking-tight">{absentCount}</h3>
              <p className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                <span>Not checked in</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
              <UserX size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar & Controls */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            type="text"
            placeholder="Search teacher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border-slate-800 text-slate-100 placeholder:text-slate-500 pl-10 pr-4 py-2.5 rounded-xl font-medium focus-visible:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-xs font-bold text-slate-400">
            Showing <strong className="text-white">{filteredRecords.length}</strong> of <strong className="text-white">{records.length}</strong> teachers
          </span>
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSearchQuery('')}
              className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-slate-800"
            >
              Clear filter
            </Button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">Teacher Name</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Arrival</th>
                <th className="py-4 px-6">Departure</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Early Departure Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-400">
                        <Users size={26} />
                      </div>
                      <p className="text-base font-bold text-slate-300">No attendance records for today yet</p>
                      <p className="text-xs text-slate-500 max-w-sm">
                        {searchQuery ? 'No teachers match your search criteria.' : 'Attendance check-ins will appear here automatically as teachers clock in.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  // Badge styling based on status
                  let statusBadge = null;
                  if (record.status === 'Present') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Present
                      </span>
                    );
                  } else if (record.status === 'Departed') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Departed
                      </span>
                    );
                  } else if (record.status === 'Early Departure') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Early Departure
                      </span>
                    );
                  } else {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Absent
                      </span>
                    );
                  }

                  return (
                    <tr 
                      key={record.id} 
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-xs shadow-md">
                            {record.teacherName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                              {record.teacherName}
                            </div>
                            <div className="text-xs font-medium text-slate-400">
                              {record.department}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-mono text-xs">
                        {record.date}
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-mono text-xs">
                        {record.arrival}
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-mono text-xs">
                        {record.departure}
                      </td>
                      <td className="py-4 px-6">
                        {statusBadge}
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-xs italic">
                        {record.earlyDepartureReason || <span className="text-slate-600 not-italic">-</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-slate-950/60 border-t border-slate-800/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs font-medium text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-emerald-400" />
            <span>Auto-refreshes every 8s when live</span>
          </div>
          <div>
            <span className="text-white font-bold">{totalActiveTeachers}</span> active teachers on register
          </div>
        </div>
      </div>
    </div>
  );
}
