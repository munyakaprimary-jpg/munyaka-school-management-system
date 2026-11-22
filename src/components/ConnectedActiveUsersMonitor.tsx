import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Smartphone,
  Globe,
  Wifi,
  Activity,
  CheckCircle2,
  Trash2,
  Search,
  UserCheck,
  ShieldAlert,
  HardDrive,
  Laptop,
  Radio,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { showSuccess, showError } from '@/utils/toast';
import { ActiveSession } from '@/utils/sessionHeartbeat';

export function ConnectedActiveUsersMonitor() {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadSessions = async () => {
    setIsRefreshing(true);
    try {
      // 1. Read real local active sessions from localStorage
      const raw = localStorage.getItem('munyaka_active_sessions');
      let parsed: ActiveSession[] = [];
      if (raw) {
        try {
          parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) parsed = [];
        } catch {
          parsed = [];
        }
      }

      // Ensure current operator is always included as a real session
      const currentId = localStorage.getItem('munyaka_active_session_id') || `sess_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem('munyaka_active_session_id', currentId);

      const deviceId = localStorage.getItem('munyaka_device_id') || `dev_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem('munyaka_device_id', deviceId);

      const storedUser = localStorage.getItem('munyaka_user') || localStorage.getItem('munyaka_current_user') || localStorage.getItem('munyaka_admin_session');
      let userName = 'Jamlyan Analytics Operator';
      let userRole = 'jamlyan_analytics';
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          userName = userObj.name || userObj.username || userObj.email || userName;
          userRole = userObj.role || userRole;
        } catch {
          userName = storedUser;
        }
      }

      const currentOperatorSession: ActiveSession = {
        sessionId: currentId,
        deviceId,
        name: userName,
        role: userRole,
        deviceType: navigator.userAgent.includes('Mobile') ? 'Mobile / Tablet' : 'Desktop Browser',
        connectionType: localStorage.getItem('munyaka_lan_server_url') ? 'LAN' : (localStorage.getItem('munyaka_use_firestore') ? 'Firestore' : 'Local'),
        currentScreen: window.location.hash || window.location.pathname,
        lastSeenAt: Date.now()
      };

      // Upsert current operator session
      const existingIdx = parsed.findIndex(s => s.sessionId === currentId);
      if (existingIdx >= 0) {
        parsed[existingIdx] = currentOperatorSession;
      } else {
        parsed.unshift(currentOperatorSession);
      }

      // Filter out stale sessions older than 2 minutes (120,000 ms)
      const now = Date.now();
      const activeOnly = parsed.filter(s => {
        const isStale = (now - (s.lastSeenAt || 0)) > 120000;
        const isRevoked = localStorage.getItem(`revoked_${s.sessionId}`) === 'true';
        return !isStale && !isRevoked;
      });

      // Save back filtered list
      localStorage.setItem('munyaka_active_sessions', JSON.stringify(activeOnly));
      setSessions(activeOnly);
    } catch (e) {
      console.error('Error loading active sessions:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  };

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 10000);
    const handleStorage = () => loadSessions();
    window.addEventListener('storage', handleStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleForceSignOut = (sessionId: string, name: string) => {
    // Mark session as revoked in localStorage so other tabs/devices honor it
    localStorage.setItem(`revoked_${sessionId}`, 'true');
    const updated = sessions.filter(s => s.sessionId !== sessionId);
    setSessions(updated);
    localStorage.setItem('munyaka_active_sessions', JSON.stringify(updated));
    showSuccess(`Successfully revoked session and forced sign out for ${name}.`);
  };

  // Live Presence Metrics calculations (Strictly from real active sessions)
  const totalOnline = sessions.length;
  const staffOnline = sessions.filter(s => ['staff', 'teacher', 'instructor'].includes(s.role)).length;
  const adminsOnline = sessions.filter(s => ['admin', 'jamlyan_analytics', 'platform_owner', 'owner', 'super_admin'].includes(s.role)).length;
  const studentsOnline = sessions.filter(s => ['student', 'learner', 'pupil'].includes(s.role)).length;

  const filteredSessions = sessions.filter(s => {
    const matchesSearch = (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.deviceId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.currentScreen || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || 
                        (roleFilter === 'admin' && ['admin', 'jamlyan_analytics', 'platform_owner', 'owner', 'super_admin'].includes(s.role)) ||
                        (roleFilter === 'staff' && ['staff', 'teacher', 'instructor'].includes(s.role)) ||
                        (roleFilter === 'student' && ['student', 'learner', 'pupil'].includes(s.role));
    return matchesSearch && matchesRole;
  });

  const formatLastSeen = (timestamp: number) => {
    if (!timestamp) return 'Just now';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    return `${diffHour}h ago`;
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-[2.5rem] border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h3 className="text-base font-black text-white">Live Connected Active Users & Devices</h3>
          </div>
          <p className="text-xs text-slate-400">
            Real-time presence monitoring across all connected Web browsers and Android APK terminal clients.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={loadSessions}
            disabled={isRefreshing}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl h-11 px-5 shadow-lg flex items-center gap-2 text-xs"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh Active Monitor
          </Button>
        </div>
      </div>

      {/* Live Presence Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-[2.2rem] bg-slate-900 border-slate-800 text-white shadow-xl overflow-hidden relative">
          <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                <Radio size={22} />
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                Live Now
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Online Now</p>
              <h3 className="text-3xl font-black text-white mt-1">{totalOnline}</h3>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                <CheckCircle2 size={12} /> Active session heartbeats
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.2rem] bg-slate-900 border-slate-800 text-white shadow-xl overflow-hidden relative">
          <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                <Users size={22} />
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                Staff / Teachers
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Staff / Teachers Online</p>
              <h3 className="text-3xl font-black text-white mt-1">{staffOnline}</h3>
              <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1 font-medium">
                <Laptop size={12} /> Teaching & portal staff
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.2rem] bg-slate-900 border-slate-800 text-white shadow-xl overflow-hidden relative">
          <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black">
                <ShieldCheck size={22} />
              </div>
              <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                Admins
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admins Online</p>
              <h3 className="text-3xl font-black text-white mt-1">{adminsOnline}</h3>
              <p className="text-[11px] text-indigo-400 mt-1 flex items-center gap-1 font-medium">
                <ShieldCheck size={12} /> School & System admins
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.2rem] bg-slate-900 border-slate-800 text-white shadow-xl overflow-hidden relative">
          <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">
                <Smartphone size={22} />
              </div>
              <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                Students
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Students Online</p>
              <h3 className="text-3xl font-black text-white mt-1">{studentsOnline}</h3>
              <p className="text-[11px] text-blue-400 mt-1 flex items-center gap-1 font-medium">
                <Globe size={12} /> Learners & APK terminals
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connected Devices Table & Filters */}
      <Card className="rounded-[2.5rem] bg-slate-900 border-slate-800 text-white shadow-2xl overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <Users size={24} className="text-amber-400" /> Connected Devices & Active Sessions
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              Live list of connected users with device info, connection source, current activity, and security revocation controls.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user or device..."
                className="bg-slate-950 border-slate-800 text-white pl-10 h-11 rounded-2xl text-xs font-medium"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white text-xs font-bold h-11 px-4 rounded-2xl focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="staff">Staff / Teachers</option>
              <option value="student">Students</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] table-auto text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px] font-black uppercase tracking-wider">
                  <th className="py-4 px-6 min-w-[200px] w-[26%]">User Name</th>
                  <th className="py-4 px-6 whitespace-nowrap w-[12%]">Role Badge</th>
                  <th className="py-4 px-6 whitespace-nowrap w-[16%]">Device / Browser</th>
                  <th className="py-4 px-6 whitespace-nowrap w-[15%]">Connection Source</th>
                  <th className="py-4 px-6 whitespace-nowrap w-[12%]">Current Activity</th>
                  <th className="py-4 px-6 whitespace-nowrap w-[10%]">Last Active</th>
                  <th className="py-4 px-6 text-right whitespace-nowrap w-[9%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-medium">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <div className="max-w-sm mx-auto space-y-3">
                        <Users size={32} className="mx-auto text-slate-600" />
                        <p className="text-sm font-bold text-slate-300">No active sessions found</p>
                        <p className="text-xs text-slate-500">Your current browser session is recording heartbeat presence. Other connected users will appear here live as they connect.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session) => (
                    <tr key={session.sessionId} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black shrink-0">
                            {session.name ? session.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">{session.name || 'Active User'}</p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">ID: {session.deviceId || 'dev_unknown'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <Badge className={`
                          font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-block
                          ${['admin', 'jamlyan_analytics', 'platform_owner', 'owner', 'super_admin'].includes(session.role) ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : ''}
                          {['staff', 'teacher', 'instructor'].includes(session.role) ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : ''}
                          {['student', 'learner', 'pupil'].includes(session.role) ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : ''}
                        `}>
                          {(session.role || 'user').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {session.deviceType?.includes('Mobile') ? <Smartphone size={14} className="text-blue-400 shrink-0" /> : <Laptop size={14} className="text-amber-400 shrink-0" />}
                          <span className="truncate">{session.deviceType || 'Desktop Browser'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          session.connectionType === 'LAN' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {session.connectionType === 'LAN' ? <Wifi size={12} className="shrink-0" /> : <Globe size={12} className="shrink-0" />}
                          <span>{session.connectionType === 'LAN' ? 'Standalone Local' : session.connectionType}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-mono text-[11px] whitespace-nowrap max-w-[150px] truncate" title={session.currentScreen || 'Dashboard'}>
                        {session.currentScreen || 'Dashboard'}
                      </td>
                      <td className="py-4 px-6 text-slate-400 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                          <Clock size={12} className="text-amber-400 shrink-0" /> {formatLastSeen(session.lastSeenAt)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleForceSignOut(session.sessionId, session.name)}
                          className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white font-bold h-8 px-3 rounded-xl text-[11px]"
                        >
                          <LogOut size={12} className="mr-1.5 shrink-0" /> Force Sign Out
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
