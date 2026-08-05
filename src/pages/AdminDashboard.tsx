"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import BackButton from '@/components/ui/BackButton';
import { 
  Wifi, 
  Users, 
  AlertTriangle, 
  Database, 
  Activity, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  Server, 
  Shield, 
  Search,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';

interface SyncLogEntry {
  teacher_id: string;
  payload_type: string;
  status: string;
  created_at: string;
}

interface Conflict {
  id: number;
  table_name: string;
  record_key: string;
  local_data: string;
  incoming_data: string;
  resolution: string;
  created_at: string;
}

interface AuditEntry {
  id: number;
  table_name: string;
  record_id: string;
  action: string;
  old_data: string;
  new_data: string;
  teacher_id: string;
  device_id: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalSyncedToday: 0,
    activeTeachers: 0,
    pendingConflicts: 0,
    recentSyncs: [] as SyncLogEntry[],
    serverIPs: [] as string[],
    port: 3000
  });
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'conflicts' | 'audit' | 'settings'>('overview');
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [resolutionMode, setResolutionMode] = useState<'LOCAL' | 'INCOMING' | 'MERGE'>('INCOMING');
  const [mergedData, setMergedData] = useState<any>(null);

  const API_BASE = 'http://192.168.1.100:3000'; // Should be configurable

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchConflicts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/conflicts`);
      if (response.ok) {
        const data = await response.json();
        setConflicts(data);
      }
    } catch (error) {
      console.error('Failed to fetch conflicts:', error);
    }
  };

  const fetchAuditTrail = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/audit?limit=200`);
      if (response.ok) {
        const data = await response.json();
        setAuditTrail(data);
      }
    } catch (error) {
      console.error('Failed to fetch audit trail:', error);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchConflicts(), fetchAuditTrail()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const resolveConflict = async (conflict: Conflict, resolution: 'LOCAL' | 'INCOMING') => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/conflicts/${conflict.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution })
      });
      if (response.ok) {
        showSuccess(`Conflict resolved: ${resolution}`);
        fetchConflicts();
        fetchStats();
      } else {
        showError('Failed to resolve conflict');
      }
    } catch (error) {
      showError('Error resolving conflict');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatPayloadType = (type: string) => {
    const icons: Record<string, string> = {
      marks: '📝',
      attendance: '📋',
      staff_checkin: '👨‍🏫',
      student_registration: '👨‍🎓',
      fee_payment: '💰'
    };
    return `${icons[type] || '📦'} ${type}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Sync Dashboard</h1>
            <p className="text-muted-foreground">Monitor offline-first synchronization across teacher devices.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAll} disabled={loading} className="rounded-xl gap-2">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>
      </div>

      {/* Server Network Info */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-gradient-to-r from-indigo-600 to-indigo-700 text-white overflow-hidden">
        <CardHeader className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-2xl">
                <Server size={24} />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Sync Server Network Info</CardTitle>
                <p className="text-indigo-100">Teacher devices connect to this address</p>
              </div>
            </div>
            <Badge className="bg-emerald-500 text-white font-bold px-3 py-1 rounded-xl">
              <Activity className="w-4 h-4 mr-1 animate-pulse" /> Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-2xl p-6">
              <p className="text-indigo-100 text-sm font-medium mb-1">Primary URL</p>
              {stats.serverIPs.map((ip, i) => (
                <div key={i} className="font-mono text-lg bg-white/5 px-3 py-1.5 rounded-xl mb-2 break-all">
                  http://{ip}:{stats.port}
                </div>
              ))}
              <div className="font-mono text-lg bg-white/5 px-3 py-1.5 rounded-xl break-all">
                http://localhost:{stats.port}
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-6">
              <p className="text-indigo-100 text-sm font-medium mb-1">QR Code for Mobile</p>
              <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center mx-auto">
                {/* QR code would be generated here */}
                <div className="text-center text-xs text-slate-500">
                  QR Code<br/>for {stats.serverIPs[0] || 'localhost'}
                </div>
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-6 text-center">
              <p className="text-indigo-100 text-sm font-medium mb-2">Status</p>
              <Badge className="bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-lg">
                <Activity className="w-4 h-4 mr-1 animate-pulse" /> Server Running
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm rounded-[2rem] bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Database size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Synced Today</p>
              <h3 className="text-3xl font-black text-slate-900">{stats.totalSyncedToday.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-[2rem] bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Teachers</p>
              <h3 className="text-3xl font-black text-slate-900">{stats.activeTeachers}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-[2rem] bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Conflicts</p>
              <h3 className="text-3xl font-black text-amber-700">{stats.pendingConflicts}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-12 mb-8">
          <TabsTrigger value="overview" className="rounded-xl px-6 h-full font-bold text-xs">Live Sync Feed</TabsTrigger>
          <TabsTrigger value="conflicts" className="rounded-xl px-6 h-full font-bold text-xs flex items-center gap-1">
            <AlertTriangle size={14} /> Conflicts ({stats.pendingConflicts})
          </TabsTrigger>
          <TabsTrigger value="audit" className="rounded-xl px-6 h-full font-bold text-xs">Audit Trail</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl px-6 h-full font-bold text-xs">Settings</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB - Live Sync Feed */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="p-6 border-b flex items-center justify-between">
              <CardTitle className="text-lg">Real-time Sync Feed</CardTitle>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                <Activity className="w-3 h-3 mr-1 animate-pulse" /> Live
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center">
                  <Activity className="animate-spin text-indigo-600 mx-auto mb-2" size={32} />
                  <p className="text-slate-500">Loading sync feed...</p>
                </div>
              ) : stats.recentSyncs.length === 0 ? (
                <div className="p-8 text-center">
                  <Database size={48} className="text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No sync activity yet</p>
                  <p className="text-sm text-slate-400 mt-1">Teacher devices will appear here when they sync</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                  {stats.recentSyncs.map((sync, i) => (
                    <div key={i} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between border-b border-slate-50/50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                          <Activity size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{sync.teacher_id}</p>
                          <p className="text-xs text-slate-400 font-medium">{formatPayloadType(sync.payload_type)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <Badge className={cn(
                          "rounded-lg font-bold text-xs",
                          sync.status === 'RECEIVED' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        )}>
                          {sync.status}
                        </Badge>
                        <span className="text-xs text-slate-400 font-mono">{formatDate(sync.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONFLICTS TAB */}
        <TabsContent value="conflicts" className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="p-6 border-b flex items-center justify-between">
              <CardTitle className="text-lg">Conflict Resolution Center</CardTitle>
              <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-bold">
                {conflicts.length} Pending
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {conflicts.length === 0 ? (
                <div className="p-12 text-center">
                  <Shield size={48} className="text-emerald-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2">No Conflicts</h3>
                  <p className="text-slate-500">All data synchronized successfully with Last-Write-Wins resolution</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/50 border-b">
                      <tr>
                        <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Table</th>
                        <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Record Key</th>
                        <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Local (Server)</th>
                        <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Incoming (Device)</th>
                        <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                        <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {conflicts.map((conflict) => (
                        <tr key={conflict.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-600 font-bold text-xs">
                              {conflict.table_name}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-600 max-w-[200px] truncate">
                            {conflict.record_key}
                          </td>
                          <td className="px-6 py-4">
                            <pre className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg max-h-24 overflow-auto max-w-[250px]">
                              {JSON.stringify(JSON.parse(conflict.local_data), null, 2)}
                            </pre>
                          </td>
                          <td className="px-6 py-4">
                            <pre className="text-xs text-slate-600 bg-amber-50 p-2 rounded-lg max-h-24 overflow-auto max-w-[250px]">
                              {JSON.stringify(JSON.parse(conflict.incoming_data), null, 2)}
                            </pre>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="rounded-lg border-amber-200 bg-amber-50 text-amber-700 font-bold text-xs">
                              {conflict.resolution}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="rounded-lg text-emerald-600 hover:bg-emerald-50"
                                onClick={() => resolveConflict(conflict, 'LOCAL')}
                              >
                                <CheckCircle2 size={14} className="mr-1" /> Keep Local
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="rounded-lg text-indigo-600 hover:bg-indigo-50"
                                onClick={() => resolveConflict(conflict, 'INCOMING')}
                              >
                                <Upload size={14} className="mr-1" /> Accept Incoming
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="rounded-lg text-slate-400 hover:text-slate-600"
                                onClick={() => setSelectedConflict(conflict)}
                              >
                                <Eye size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUDIT TAB */}
        <TabsContent value="audit" className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="p-6 border-b">
              <CardTitle className="text-lg">System Audit Trail</CardTitle>
              <p className="text-sm text-slate-500">Immutable log of all data modifications</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[1000px]">
                  <thead className="bg-slate-50/50 border-b">
                    <tr>
                      <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Time</th>
                      <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Table</th>
                      <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Action</th>
                      <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Record</th>
                      <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Teacher</th>
                      <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Device</th>
                      <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Changes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditTrail.slice(0, 100).map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3 font-mono text-xs text-slate-500">{formatDate(entry.created_at)}</td>
                        <td className="px-6 py-3">
                          <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-600 font-bold text-xs">
                            {entry.table_name}
                          </Badge>
                        </td>
                        <td className="px-6 py-3">
                          <Badge className={cn(
                            "rounded-lg font-bold text-xs",
                            entry.action === 'INSERT' ? "bg-emerald-50 text-emerald-700" :
                            entry.action === 'UPDATE' ? "bg-blue-50 text-blue-700" :
                            "bg-rose-50 text-rose-700"
                          )}>
                            {entry.action}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 font-mono text-xs text-slate-600">{entry.record_id}</td>
                        <td className="px-6 py-3 font-medium text-slate-700">{entry.teacher_id}</td>
                        <td className="px-6 py-3 text-xs text-slate-500">{entry.device_id}</td>
                        <td className="px-6 py-3">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-lg text-slate-400 hover:text-indigo-600"
                            onClick={() => alert(`Old: ${entry.old_data}\n\nNew: ${entry.new_data}`)}
                          >
                            <Eye size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b">
              <CardTitle className="text-2xl font-black text-slate-900">Sync Server Configuration</CardTitle>
              <CardDescription>Manage server settings and network configuration</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Server Port</label>
                  <input 
                    type="number" 
                    value={stats.port} 
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold text-center text-xl"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Bound Interface</label>
                  <input 
                    type="text" 
                    value="0.0.0.0 (All Interfaces)" 
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold text-center"
                    readOnly
                  />
                </div>
              </div>

              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-2">Teacher Device Configuration</h4>
                <p className="text-sm text-indigo-700 mb-4">
                  Configure each teacher device with the sync endpoint:
                </p>
                <div className="bg-white p-4 rounded-xl border border-slate-200 font-mono text-sm overflow-x-auto">
                  {stats.serverIPs.map(ip => (
                    <div key={ip} className="mb-2">
                      <code>SYNC_ENDPOINT=http://{ip}:{stats.port}/api/sync</code>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100">
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Conflict Resolution Modal */}
      {selectedConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Resolve Conflict: {selectedConflict.table_name}</h3>
              <button onClick={() => setSelectedConflict(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Local (Server)</label>
                  <pre className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl max-h-64 overflow-auto">
                    {JSON.stringify(JSON.parse(selectedConflict.local_data), null, 2)}
                  </pre>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Incoming (Device)</label>
                  <pre className="text-xs text-slate-600 bg-amber-50 p-4 rounded-xl max-h-64 overflow-auto">
                    {JSON.stringify(JSON.parse(selectedConflict.incoming_data), null, 2)}
                  </pre>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Resolution</label>
                <div className="flex gap-3">
                  <Button 
                    variant={resolutionMode === 'LOCAL' ? 'default' : 'outline'}
                    onClick={() => setResolutionMode('LOCAL')}
                    className="flex-1 rounded-xl h-12 font-bold"
                  >
                    <CheckCircle2 size={16} className="mr-2" /> Keep Local
                  </Button>
                  <Button 
                    variant={resolutionMode === 'INCOMING' ? 'default' : 'outline'}
                    onClick={() => setResolutionMode('INCOMING')}
                    className="flex-1 rounded-xl h-12 font-bold"
                  >
                    <Upload size={16} className="mr-2" /> Accept Incoming
                  </Button>
                  <Button 
                    variant={resolutionMode === 'MERGE' ? 'default' : 'outline'}
                    onClick={() => setResolutionMode('MERGE')}
                    className="flex-1 rounded-xl h-12 font-bold"
                  >
                    <Edit size={16} className="mr-2" /> Manual Merge
                  </Button>
                </div>

                {resolutionMode === 'MERGE' && (
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Merged Data (JSON)</label>
                    <textarea
                      value={JSON.stringify(mergedData || JSON.parse(selectedConflict.local_data), null, 2)}
                      onChange={(e) => {
                        try {
                          setMergedData(JSON.parse(e.target.value));
                        } catch {}
                      }}
                      className="h-48 rounded-xl bg-slate-50 border-none font-mono text-xs p-3"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="ghost" onClick={() => setSelectedConflict(null)} className="flex-1 rounded-xl h-11 font-bold">
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => resolveConflict(selectedConflict, resolutionMode === 'MERGE' ? 'INCOMING' : resolutionMode)}
                    className="flex-1 rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100"
                  >
                    Apply Resolution
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;