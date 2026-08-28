"use client";

import React, { useState, useEffect, useMemo } from 'react';
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

type MonitorTheme = 'midnight' | 'light' | 'emerald';

interface ThemeConfig {
  // Outer page background
  pageBg: string;
  // Main card (outer container)
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  cardText: string;
  cardSubText: string;
  // Stat card variants
  statCard: {
    present: string;
    departed: string;
    earlyDeparture: string;
    absent: string;
  };
  // Accent border color (left side strip on each stat card)
  accentBorder: {
    present: string;
    departed: string;
    earlyDeparture: string;
    absent: string;
  };
  // Inner icon container styling
  iconBox: {
    present: string;
    departed: string;
    earlyDeparture: string;
    absent: string;
  };
  // Number text color (the big stat value)
  valueText: {
    present: string;
    departed: string;
    earlyDeparture: string;
    absent: string;
  };
  // Label/footer text color
  labelText: {
    present: string;
    departed: string;
    earlyDeparture: string;
    absent: string;
  };
  // Theme toggle group styling
  toggleGroup: string;
  toggleActive: string;
  toggleInactive: string;
  // Table styling
  tableHeadBg: string;
  tableHeadText: string;
  tableRowHover: string;
  tableRowText: string;
  tableSubText: string;
  tableBorder: string;
  tableContainerBg: string;
  tableContainerBorder: string;
  // Header text colors
  titleText: string;
  subtitleText: string;
  // Live pill
  livePillBg: string;
  livePillText: string;
  livePillBorder: string;
  liveDot: string;
  // Refresh button
  refreshBtn: string;
  refreshIconActive: string;
  // Empty state
  emptyIconBg: string;
  emptyText: string;
  emptySubText: string;
  // Footer
  footerText: string;
  // Count badge
  countBadgeBg: string;
  countBadgeText: string;
  // Search input
  searchBg: string;
  searchText: string;
  searchBorder: string;
}

const THEME_CONFIGS: Record<MonitorTheme, ThemeConfig> = {
  midnight: {
    pageBg: 'bg-slate-950',
    cardBg: 'bg-slate-900/90',
    cardBorder: 'border-slate-800',
    cardShadow: 'shadow-2xl shadow-indigo-950/20',
    cardText: 'text-slate-100',
    cardSubText: 'text-slate-400',
    statCard: {
      present: 'bg-[#0B132B] border-slate-800',
      departed: 'bg-[#0B132B] border-slate-800',
      earlyDeparture: 'bg-[#0B132B] border-slate-800',
      absent: 'bg-[#0B132B] border-slate-800',
    },
    accentBorder: {
      present: 'border-l-4 border-l-emerald-500',
      departed: 'border-l-4 border-l-blue-500',
      earlyDeparture: 'border-l-4 border-l-amber-500',
      absent: 'border-l-4 border-l-rose-500',
    },
    iconBox: {
      present: 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400',
      departed: 'bg-blue-500/15 border border-blue-500/30 text-blue-400',
      earlyDeparture: 'bg-amber-500/15 border border-amber-500/30 text-amber-400',
      absent: 'bg-rose-500/15 border border-rose-500/30 text-rose-400',
    },
    valueText: {
      present: 'text-emerald-300',
      departed: 'text-blue-300',
      earlyDeparture: 'text-amber-300',
      absent: 'text-rose-300',
    },
    labelText: {
      present: 'text-emerald-400/80',
      departed: 'text-blue-400/80',
      earlyDeparture: 'text-amber-400/80',
      absent: 'text-rose-400/80',
    },
    toggleGroup: 'bg-slate-900/80 border-slate-800',
    toggleActive: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30',
    toggleInactive: 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50',
    tableHeadBg: 'bg-slate-900/90',
    tableHeadText: 'text-slate-400',
    tableRowHover: 'hover:bg-slate-800/40',
    tableRowText: 'text-slate-200',
    tableSubText: 'text-slate-500',
    tableBorder: 'border-slate-800/60',
    tableContainerBg: 'bg-slate-900/80',
    tableContainerBorder: 'border-slate-800',
    titleText: 'text-white',
    subtitleText: 'text-slate-400',
    livePillBg: 'bg-emerald-500/10 border-emerald-500/30',
    livePillText: 'text-emerald-400',
    livePillBorder: '',
    liveDot: 'bg-emerald-500',
    refreshBtn: 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white',
    refreshIconActive: 'text-emerald-400',
    emptyIconBg: 'bg-slate-800/80 border-slate-700/50',
    emptyText: 'text-slate-300',
    emptySubText: 'text-slate-500',
    footerText: 'text-slate-400',
    countBadgeBg: 'bg-slate-800 text-slate-400',
    countBadgeText: 'text-slate-300',
    searchBg: 'bg-slate-800/80',
    searchText: 'text-slate-100 placeholder:text-slate-500',
    searchBorder: 'border-slate-700',
  },
  light: {
    pageBg: 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-200',
    cardShadow: 'shadow-sm shadow-slate-200/50',
    cardText: 'text-slate-900',
    cardSubText: 'text-slate-500',
    statCard: {
      present: 'bg-white border-slate-200 shadow-sm',
      departed: 'bg-white border-slate-200 shadow-sm',
      earlyDeparture: 'bg-white border-slate-200 shadow-sm',
      absent: 'bg-white border-slate-200 shadow-sm',
    },
    accentBorder: {
      present: 'border-l-4 border-l-emerald-500',
      departed: 'border-l-4 border-l-blue-500',
      earlyDeparture: 'border-l-4 border-l-amber-500',
      absent: 'border-l-4 border-l-rose-500',
    },
    iconBox: {
      present: 'bg-emerald-100 text-emerald-600',
      departed: 'bg-blue-100 text-blue-600',
      earlyDeparture: 'bg-amber-100 text-amber-600',
      absent: 'bg-rose-100 text-rose-600',
    },
    valueText: {
      present: 'text-emerald-700',
      departed: 'text-blue-700',
      earlyDeparture: 'text-amber-700',
      absent: 'text-rose-700',
    },
    labelText: {
      present: 'text-emerald-600/90',
      departed: 'text-blue-600/90',
      earlyDeparture: 'text-amber-600/90',
      absent: 'text-rose-600/90',
    },
    toggleGroup: 'bg-white border-slate-200 shadow-sm',
    toggleActive: 'bg-slate-900 text-white shadow-md',
    toggleInactive: 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200',
    tableHeadBg: 'bg-slate-50',
    tableHeadText: 'text-slate-500',
    tableRowHover: 'hover:bg-indigo-50/50',
    tableRowText: 'text-slate-800',
    tableSubText: 'text-slate-500',
    tableBorder: 'border-slate-200/80',
    tableContainerBg: 'bg-white',
    tableContainerBorder: 'border-slate-200 shadow-sm',
    titleText: 'text-slate-900',
    subtitleText: 'text-slate-500',
    livePillBg: 'bg-emerald-50 border-emerald-200',
    livePillText: 'text-emerald-700',
    livePillBorder: '',
    liveDot: 'bg-emerald-500',
    refreshBtn: 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm',
    refreshIconActive: 'text-indigo-600',
    emptyIconBg: 'bg-slate-100 border-slate-200',
    emptyText: 'text-slate-700',
    emptySubText: 'text-slate-500',
    footerText: 'text-slate-500',
    countBadgeBg: 'bg-slate-100 text-slate-600',
    countBadgeText: 'text-slate-600',
    searchBg: 'bg-white',
    searchText: 'text-slate-900 placeholder:text-slate-400',
    searchBorder: 'border-slate-200',
  },
  emerald: {
    pageBg: 'bg-gradient-to-br from-emerald-950 via-green-950 to-teal-950',
    cardBg: 'bg-emerald-950/30 backdrop-blur-md',
    cardBorder: 'border border-emerald-500/30',
    cardShadow: 'shadow-2xl shadow-emerald-500/10',
    cardText: 'text-white',
    cardSubText: 'text-emerald-200/70',
    statCard: {
      present: 'bg-emerald-950/30 backdrop-blur-md border-emerald-500/30 shadow-emerald-500/5',
      departed: 'bg-emerald-950/30 backdrop-blur-md border-emerald-500/30 shadow-emerald-500/5',
      earlyDeparture: 'bg-emerald-950/30 backdrop-blur-md border-emerald-500/30 shadow-emerald-500/5',
      absent: 'bg-emerald-950/30 backdrop-blur-md border-emerald-500/30 shadow-emerald-500/5',
    },
    accentBorder: {
      present: 'border-l-4 border-l-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]',
      departed: 'border-l-4 border-l-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]',
      earlyDeparture: 'border-l-4 border-l-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]',
      absent: 'border-l-4 border-l-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]',
    },
    iconBox: {
      present: 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]',
      departed: 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]',
      earlyDeparture: 'bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]',
      absent: 'bg-rose-500/20 border border-rose-400/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]',
    },
    valueText: {
      present: 'text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]',
      departed: 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]',
      earlyDeparture: 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]',
      absent: 'text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]',
    },
    labelText: {
      present: 'text-emerald-400/80',
      departed: 'text-cyan-400/80',
      earlyDeparture: 'text-amber-400/80',
      absent: 'text-rose-400/80',
    },
    toggleGroup: 'bg-emerald-950/40 backdrop-blur-md border-emerald-500/30',
    toggleActive: 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    toggleInactive: 'bg-emerald-950/30 text-emerald-200/70 hover:bg-emerald-900/30 hover:text-emerald-100 border border-emerald-500/20',
    tableHeadBg: 'bg-emerald-950/40 backdrop-blur-md',
    tableHeadText: 'text-emerald-300/70',
    tableRowHover: 'hover:bg-emerald-900/20',
    tableRowText: 'text-emerald-50',
    tableSubText: 'text-emerald-300/60',
    tableBorder: 'border-emerald-500/20',
    tableContainerBg: 'bg-emerald-950/30 backdrop-blur-md',
    tableContainerBorder: 'border border-emerald-500/30',
    titleText: 'text-white',
    subtitleText: 'text-emerald-200/80',
    livePillBg: 'bg-emerald-500/15 backdrop-blur-md border-emerald-400/30',
    livePillText: 'text-emerald-300',
    livePillBorder: '',
    liveDot: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
    refreshBtn: 'bg-emerald-950/30 backdrop-blur-md border-emerald-500/30 text-emerald-100 hover:bg-emerald-900/40',
    refreshIconActive: 'text-emerald-300',
    emptyIconBg: 'bg-emerald-950/40 backdrop-blur-md border-emerald-500/20',
    emptyText: 'text-emerald-100',
    emptySubText: 'text-emerald-300/60',
    footerText: 'text-emerald-300/70',
    countBadgeBg: 'bg-emerald-950/40 backdrop-blur-md text-emerald-200 border border-emerald-500/20',
    countBadgeText: 'text-emerald-200',
    searchBg: 'bg-emerald-950/30 backdrop-blur-md',
    searchText: 'text-emerald-50 placeholder:text-emerald-300/50',
    searchBorder: 'border-emerald-500/30',
  },
};

export default function AttendanceMonitor() {
  const [isLive, setIsLive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>(INITIAL_RECORDS);
  const [lastRefresh, setLastRefresh] = useState<string>(
    new Date().toLocaleTimeString('en-US', { hour12: false })
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [monitorTheme, setMonitorTheme] = useState<MonitorTheme>('midnight');

  const theme = THEME_CONFIGS[monitorTheme];

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

  const statusBadge = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'Present':
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            monitorTheme === 'light' 
              ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
              : monitorTheme === 'emerald'
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${monitorTheme === 'emerald' ? 'shadow-[0_0_6px_rgba(16,185,129,0.8)]' : ''}`} />
            Present
          </span>
        );
      case 'Departed':
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            monitorTheme === 'light'
              ? "bg-blue-50 text-blue-700 border border-blue-100"
              : monitorTheme === 'emerald'
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-[0_0_10px_rgba(34,211,238,0.3)]"
              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-blue-500 ${monitorTheme === 'emerald' ? 'shadow-[0_0_6px_rgba(34,211,238,0.8)]' : ''}`} />
            Departed
          </span>
        );
      case 'Early Departure':
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            monitorTheme === 'light'
              ? "bg-amber-50 text-amber-700 border border-amber-100"
              : monitorTheme === 'emerald'
              ? "bg-amber-500/20 text-amber-300 border border-amber-400/30 shadow-[0_0_10px_rgba(251,191,36,0.3)]"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-amber-500 ${monitorTheme === 'emerald' ? 'shadow-[0_0_6px_rgba(251,191,36,0.8)]' : ''}`} />
            Early Departure
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            monitorTheme === 'light'
              ? "bg-rose-50 text-rose-700 border border-rose-100"
              : monitorTheme === 'emerald'
              ? "bg-rose-500/20 text-rose-300 border border-rose-400/30 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-rose-500 ${monitorTheme === 'emerald' ? 'shadow-[0_0_6px_rgba(244,63,94,0.8)]' : ''}`} />
            Absent
          </span>
        );
    }
  };

  // Theme toggle group
  const ThemeToggle = () => (
    <div className={cn("inline-flex items-center gap-1.5 p-1.5 rounded-2xl", theme.toggleGroup)}>
      {([
        { id: 'midnight', label: 'Midnight Dark' },
        { id: 'light', label: 'Clean Light' },
        { id: 'emerald', label: 'Glass Emerald' },
      ] as { id: MonitorTheme; label: string }[]).map(opt => (
        <button
          key={opt.id}
          type="button"
          onClick={() => setMonitorTheme(opt.id)}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
            monitorTheme === opt.id ? theme.toggleActive : theme.toggleInactive
          )}
          aria-pressed={monitorTheme === opt.id}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className={cn("min-h-screen p-4 md:p-8 space-y-6 transition-all duration-300", theme.pageBg)}>
      {/* Header with Theme Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-opacity-30 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className={cn("text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3", theme.titleText)}>
              Attendance Monitor
            </h1>
            <span className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all duration-300",
              theme.livePillBg,
              theme.livePillText,
              theme.livePillBorder
            )}>
              <span className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                monitorTheme === 'emerald' 
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]' 
                  : 'bg-emerald-500'
              )} />
              (•) LIVE
            </span>
          </div>
          <p className={cn("text-sm font-medium", theme.subtitleText)}>
            Principal&apos;s real-time tracking dashboard <span className="mx-1.5 opacity-60">•</span> Last refresh: {lastRefresh}
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <ThemeToggle />
          <div className={cn("h-4 w-px hidden md:block", monitorTheme === 'light' ? 'bg-slate-200' : monitorTheme === 'emerald' ? 'bg-emerald-500/30' : 'bg-slate-700')} />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              "rounded-xl font-semibold gap-2 transition-all duration-300 shadow-sm",
              theme.refreshBtn
            )}
          >
            <RefreshCw size={15} className={cn(isRefreshing && "animate-spin", theme.refreshIconActive)} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards with Dynamic Theming */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Present Card */}
        <Card className={cn(
          "rounded-2xl overflow-hidden relative group hover:scale-[1.01] transition-all duration-300",
          theme.statCard.present,
          theme.accentBorder.present
        )}>
          <div className={cn(
            "absolute top-0 left-0 w-1.5 h-full bg-emerald-500 transition-all duration-300",
            monitorTheme === 'emerald' && "shadow-[0_0_8px_rgba(16,185,129,0.6)]"
          )} />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className={cn("text-[10px] font-black uppercase tracking-widest", theme.labelText.present)}>Present</p>
                <h3 className={cn("text-3xl font-black mt-1", theme.valueText.present)}>{presentCount}</h3>
                <p className={cn("text-[11px] font-semibold flex items-center gap-1", theme.labelText.present)}>
                  <span>Active on campus</span>
                </p>
              </div>
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                theme.iconBox.present
              )}>
                <Users size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Departed Card */}
        <Card className={cn(
          "rounded-2xl overflow-hidden relative group hover:scale-[1.01] transition-all duration-300",
          theme.statCard.departed,
          theme.accentBorder.departed
        )}>
          <div className={cn(
            "absolute top-0 left-0 w-1.5 h-full bg-blue-500 transition-all duration-300",
            monitorTheme === 'emerald' && "shadow-[0_0_8px_rgba(34,211,238,0.6)]"
          )} />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className={cn("text-[10px] font-black uppercase tracking-widest", theme.labelText.departed)}>Departed</p>
                <h3 className={cn("text-3xl font-black mt-1", theme.valueText.departed)}>{departedCount}</h3>
                <p className={cn("text-[11px] font-semibold flex items-center gap-1", theme.labelText.departed)}>
                  <span>Checked out normally</span>
                </p>
              </div>
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                theme.iconBox.departed
              )}>
                <Clock size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Early Departure Card */}
        <Card className={cn(
          "rounded-2xl overflow-hidden relative group hover:scale-[1.01] transition-all duration-300",
          theme.statCard.earlyDeparture,
          theme.accentBorder.earlyDeparture
        )}>
          <div className={cn(
            "absolute top-0 left-0 w-1.5 h-full bg-amber-500 transition-all duration-300",
            monitorTheme === 'emerald' && "shadow-[0_0_8px_rgba(251,191,36,0.6)]"
          )} />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className={cn("text-[10px] font-black uppercase tracking-widest", theme.labelText.earlyDeparture)}>Early Departure</p>
                <h3 className={cn("text-3xl font-black mt-1", theme.valueText.earlyDeparture)}>{earlyDepartureCount}</h3>
                <p className={cn("text-[11px] font-semibold flex items-center gap-1", theme.labelText.earlyDeparture)}>
                  <span>Left before shift end</span>
                </p>
              </div>
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                theme.iconBox.earlyDeparture
              )}>
                <AlertTriangle size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Absent Card */}
        <Card className={cn(
          "rounded-2xl overflow-hidden relative group hover:scale-[1.01] transition-all duration-300",
          theme.statCard.absent,
          theme.accentBorder.absent
        )}>
          <div className={cn(
            "absolute top-0 left-0 w-1.5 h-full bg-rose-500 transition-all duration-300",
            monitorTheme === 'emerald' && "shadow-[0_0_8px_rgba(244,63,94,0.6)]"
          )} />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className={cn("text-[10px] font-black uppercase tracking-widest", theme.labelText.absent)}>Absent</p>
                <h3 className={cn("text-3xl font-black mt-1", theme.valueText.absent)}>{absentCount}</h3>
                <p className={cn("text-[11px] font-semibold flex items-center gap-1", theme.labelText.absent)}>
                  <span>Not checked in</span>
                </p>
              </div>
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                theme.iconBox.absent
              )}>
                <UserX size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className={cn(
        "border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-4 transition-all duration-300",
        theme.searchBg,
        theme.searchBorder
      )}>
        <div className="relative w-full sm:w-96">
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2",
            monitorTheme === 'light' ? 'text-slate-400' : monitorTheme === 'emerald' ? 'text-emerald-300/60' : 'text-slate-400'
          )} size={18} />
          <Input
            type="text"
            placeholder="Search teacher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium focus-visible:ring-2",
              monitorTheme === 'light' 
                ? "bg-white border-slate-200" 
                : monitorTheme === 'emerald'
                ? "bg-emerald-950/40 border-emerald-500/30"
                : "bg-slate-800/80 border-slate-700 text-slate-100 placeholder:text-slate-500",
              monitorTheme === 'emerald' && "focus-visible:ring-emerald-400/50 focus-visible:border-emerald-400/50"
            )}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className={cn("text-xs font-bold", theme.subtitleText)}>
            Showing <strong className={theme.cardText}>{filteredRecords.length}</strong> of <strong className={theme.cardText}>{records.length}</strong> teachers
          </span>
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSearchQuery('')}
              className={cn(
                "text-xs hover:bg-transparent",
                monitorTheme === 'light' ? "text-indigo-600 hover:text-indigo-700" : 
                monitorTheme === 'emerald' ? "text-emerald-300 hover:text-emerald-200" :
                "text-emerald-400 hover:text-emerald-300"
              )}
            >
              Clear filter
            </Button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className={cn(
        "rounded-2xl shadow-2xl overflow-hidden transition-all duration-300",
        theme.tableContainerBg,
        theme.tableContainerBorder
      )}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={cn("border-b", theme.tableHeadBg, theme.tableBorder)}>
                <th className={cn("py-4 px-6 font-black text-[11px] uppercase tracking-widest", theme.tableHeadText)}>Teacher Name</th>
                <th className={cn("py-4 px-6 font-black text-[11px] uppercase tracking-widest", theme.tableHeadText)}>Date</th>
                <th className={cn("py-4 px-6 font-black text-[11px] uppercase tracking-widest", theme.tableHeadText)}>Arrival</th>
                <th className={cn("py-4 px-6 font-black text-[11px] uppercase tracking-widest", theme.tableHeadText)}>Departure</th>
                <th className={cn("py-4 px-6 font-black text-[11px] uppercase tracking-widest", theme.tableHeadText)}>Status</th>
                <th className={cn("py-4 px-6 font-black text-[11px] uppercase tracking-widest", theme.tableHeadText)}>Early Departure Reason</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", theme.tableBorder)}>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center",
                        theme.emptyIconBg
                      )}>
                        <Users size={26} />
                      </div>
                      <p className={cn("text-base font-bold", theme.emptyText)}>No attendance records for today yet</p>
                      <p className={cn("text-xs max-w-sm", theme.emptySubText)}>
                        {searchQuery ? 'No teachers match your search criteria.' : 'Attendance check-ins will appear here automatically as teachers clock in.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr 
                    key={record.id} 
                    className={cn("transition-colors duration-300", theme.tableRowHover)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-md",
                          monitorTheme === 'light'
                            ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white"
                            : monitorTheme === 'emerald'
                            ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                            : "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white"
                        )}>
                          {record.teacherName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className={cn("font-bold group-hover:text-emerald-400 transition-colors", theme.tableRowText)}>
                            {record.teacherName}
                          </div>
                          <div className={cn("text-xs font-medium", theme.tableSubText)}>
                            {record.department}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={cn("py-4 px-6 font-mono text-xs", theme.tableSubText)}>
                      {record.date}
                    </td>
                    <td className={cn("py-4 px-6 font-mono text-xs", theme.tableRowText)}>
                      {record.arrival}
                    </td>
                    <td className={cn("py-4 px-6 font-mono text-xs", theme.tableRowText)}>
                      {record.departure}
                    </td>
                    <td className="py-4 px-6">
                      {statusBadge(record.status)}
                    </td>
                    <td className={cn("py-4 px-6 text-xs italic", theme.tableSubText)}>
                      {record.earlyDepartureReason || <span className="not-italic opacity-60">-</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className={cn(
          "border-t px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs font-medium gap-2 transition-all duration-300",
          monitorTheme === 'light' ? "border-slate-200 bg-slate-50" : 
          monitorTheme === 'emerald' ? "border-emerald-500/20 bg-emerald-950/40" :
          "border-slate-800 bg-slate-950/60",
          theme.footerText
        )}>
          <div className="flex items-center gap-2">
            <Activity size={14} className={
              monitorTheme === 'light' ? "text-emerald-600" : 
              monitorTheme === 'emerald' ? "text-emerald-400" : "text-emerald-400"
            } />
            <span>Auto-refreshes every 8s when live</span>
          </div>
          <div>
            <span className={cn("font-bold", theme.cardText)}>{totalActiveTeachers}</span> active teachers on register
          </div>
        </div>
      </div>
    </div>
  );
}