import React, { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Monitor,
  Smartphone,
  Database,
  Users,
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Plus,
  Edit2,
  Shield,
  Clock,
  Activity,
  HardDrive,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/utils/toast';
import { showSuccess, showError } from '@/utils/toast';
import { useAuth } from '@/context/AuthContext';

interface ServerInfo {
  ip: string;
  port: number;
  url: string;
  database: string;
  version: string;
  uptime: number;
  timestamp: string;
}

interface ConnectedDevice {
  id: string;
  device_id: string;
  device_name: string;
  device_type: string;
  last_seen: string;
  ip_address: string;
  current_status: 'online' | 'offline';
  created_at: string;
}

interface SyncQueueItem {
  id: string;
  device_id: string;
  data_type: string;
  data_json: string;
  synced_at: string | null;
  created_at: string;
}

interface DBStats {
  students: number;
  teachers: number;
  attendance_today: number;
  pending_fees: number;
  connected_devices: number;
  pending_sync: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  staff_id: string;
  is_active: number;
  created_at: string;
}

const LAN_SERVER_KEY = 'lan_server_url';
const getServerUrl = () => localStorage.getItem(LAN_SERVER_KEY) || 'http://localhost:5000';

const formatUptime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const formatLastSeen = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString();
};

export default function AdminControlCenter() {
  const { user } = useAuth();
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [stats, setStats] = useState<DBStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serverUrl, setServerUrl] = useState(getServerUrl());
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', role: 'teacher', password: '', staff_id: '' });
  const [showServerSettings, setShowServerSettings] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!isOnline) return;
    
    setRefreshing(true);
    const baseUrl = getServerUrl();
    
    try {
      const [infoRes, devicesRes, statsRes, usersRes] = await Promise.all([
        fetch(`${baseUrl}/api/server/info`).catch(() => null),
        fetch(`${baseUrl}/api/devices`).catch(() => null),
        fetch(`${baseUrl}/api/stats`).catch(() => null),
        fetch(`${baseUrl}/api/users`).catch(() => null)
      ]);

      if (infoRes?.ok) {
        const data = await infoRes.json();
        setServerInfo(data.data);
        setServerUrl(data.data.url);
      }
      
      if (devicesRes?.ok) {
        const data = await devicesRes.json();
        setDevices(data.data || []);
      }
      
      if (statsRes?.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }
      
      if (usersRes?.ok) {
        const data = await usersRes.json();
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch server data:', err);
    }
    
    setIsLoading(false);
    setRefreshing(false);
  }, [isOnline]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copied to clipboard');
  };

  const handleSaveServerUrl = () => {
    localStorage.setItem(LAN_SERVER_KEY, serverUrl);
    setShowServerSettings(false);
    fetchData();
    showSuccess('Server URL updated');
  };

  const handleBackup = async () => {
    try {
      const baseUrl = getServerUrl();
      const response = await fetch(`${baseUrl}/api/backup`);
      if (!response.ok) throw new Error('Backup failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `munyaka-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess('Database backup downloaded');
    } catch (err) {
      showError('Failed to download backup');
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const baseUrl = getServerUrl();
      const response = await fetch(`${baseUrl}/api/backup/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Restore failed');
      showSuccess('Database restored successfully');
      fetchData();
    } catch (err) {
      showError('Failed to restore database');
    }
    event.target.value = '';
  };

  const handleCreateUser = async () => {
    try {
      const baseUrl = getServerUrl();
      const response = await fetch(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      
      if (!response.ok) throw new Error('Failed to create user');
      showSuccess('User created successfully');
      setShowAddUser(false);
      setNewUser({ name: '', email: '', phone: '', role: 'teacher', password: '', staff_id: '' });
      fetchData();
    } catch (err) {
      showError('Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;
    try {
      const baseUrl = getServerUrl();
      const response = await fetch(`${baseUrl}/api/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUser)
      });
      
      if (!response.ok) throw new Error('Failed to update user');
      showSuccess('User updated successfully');
      setEditUser(null);
      fetchData();
    } catch (err) {
      showError('Failed to update user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const baseUrl = getServerUrl();
      const response = await fetch(`${baseUrl}/api/users/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete user');
      showSuccess('User deleted successfully');
      fetchData();
    } catch (err) {
      showError('Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      const baseUrl = getServerUrl();
      const response = await fetch(`${baseUrl}/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, is_active: user.is_active ? 0 : 1 })
      });
      
      if (!response.ok) throw new Error('Failed to update user');
      showSuccess(`User ${user.is_active ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (err) {
      showError('Failed to update user status');
    }
  };

  if (!['admin', 'owner', 'super_admin'].includes(user?.role || '')) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="w-16 h-16 mx-auto text-amber-500 mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Admin Access Required</h2>
            <p className="text-slate-600 dark:text-slate-400">You need administrator privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header with Server IP */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Server className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest opacity-80">Admin Control Center</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">LAN Server Connection</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={`${isOnline ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'} border-0`}>
              {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowServerSettings(true)}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-xl"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {serverInfo && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">Server Address (for Mobile APK)</p>
                <p className="text-xl font-black font-mono">{serverInfo.url}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(serverInfo.url)}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-xl"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-white/10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Port</p>
                <p className="font-bold">{serverInfo.port}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Version</p>
                <p className="font-bold">{serverInfo.version}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Uptime</p>
                <p className="font-bold">{formatUptime(serverInfo.uptime)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Connected</p>
                <p className="font-bold">{stats?.connected_devices || 0} devices</p>
              </div>
            </div>
          </div>
        )}
        
        {!serverInfo && !isLoading && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-70" />
            <p className="font-bold">Server Not Connected</p>
            <p className="text-sm opacity-70 mt-1">Make sure the LAN server is running on the Admin PC</p>
            <p className="text-xs font-mono mt-2 opacity-80">{getServerUrl()}</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
            <CardContent className="pt-4 pb-3">
              <Users className="w-6 h-6 mb-2 opacity-80" />
              <p className="text-2xl font-black">{stats.students}</p>
              <p className="text-xs font-bold opacity-80">Students</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 text-white">
            <CardContent className="pt-4 pb-3">
              <Activity className="w-6 h-6 mb-2 opacity-80" />
              <p className="text-2xl font-black">{stats.teachers}</p>
              <p className="text-xs font-bold opacity-80">Teachers</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-0 text-white">
            <CardContent className="pt-4 pb-3">
              <CheckCircle2 className="w-6 h-6 mb-2 opacity-80" />
              <p className="text-2xl font-black">{stats.attendance_today}</p>
              <p className="text-xs font-bold opacity-80">Attendance Today</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-rose-500 to-rose-600 border-0 text-white">
            <CardContent className="pt-4 pb-3">
              <HardDrive className="w-6 h-6 mb-2 opacity-80" />
              <p className="text-2xl font-black">{stats.pending_fees}</p>
              <p className="text-xs font-bold opacity-80">Pending Fees</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-violet-500 to-violet-600 border-0 text-white">
            <CardContent className="pt-4 pb-3">
              <Smartphone className="w-6 h-6 mb-2 opacity-80" />
              <p className="text-2xl font-black">{stats.connected_devices}</p>
              <p className="text-xs font-bold opacity-80">Online Devices</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 border-0 text-white">
            <CardContent className="pt-4 pb-3">
              <RefreshCw className="w-6 h-6 mb-2 opacity-80" />
              <p className="text-2xl font-black">{stats.pending_sync}</p>
              <p className="text-xs font-bold opacity-80">Pending Sync</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Connected Devices */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-lg">Connected Teacher Devices</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchData}
              disabled={refreshing}
              className="rounded-xl"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <CardDescription>Teachers currently connected to this server via mobile APK</CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No devices connected</p>
              <p className="text-sm">Teachers will appear here when they connect their mobile APK</p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      device.current_status === 'online'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}>
                      {device.device_type === 'mobile' ? (
                        <Smartphone className={`w-6 h-6 ${
                          device.current_status === 'online' ? 'text-green-600' : 'text-slate-400'
                        }`} />
                      ) : (
                        <Monitor className={`w-6 h-6 ${
                          device.current_status === 'online' ? 'text-green-600' : 'text-slate-400'
                        }`} />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {device.device_name || 'Unknown Device'}
                      </p>
                      <p className="text-sm text-slate-500 font-mono">{device.device_id}</p>
                      {device.ip_address && (
                        <p className="text-xs text-slate-400">IP: {device.ip_address}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={device.current_status === 'online' ? 'default' : 'secondary'}
                      className={`${
                        device.current_status === 'online'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {device.current_status === 'online' ? (
                        <><CheckCircle2 className="w-3 h-3 mr-1" /> Online</>
                      ) : (
                        <><XCircle className="w-3 h-3 mr-1" /> Offline</>
                      )}
                    </Badge>
                    <p className="text-xs text-slate-400 mt-1 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      {formatLastSeen(device.last_seen)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database & Backup */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-lg">Database Management</CardTitle>
            </div>
            <CardDescription>Backup and restore your school data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold">Export Backup</p>
                <p className="text-sm text-slate-500">Download complete database as JSON</p>
              </div>
              <Button onClick={handleBackup} className="rounded-xl bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Upload className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold">Restore Backup</p>
                <p className="text-sm text-slate-500">Import data from a backup file</p>
              </div>
              <label>
                <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                <Button asChild className="rounded-xl bg-amber-600 hover:bg-amber-700">
                  <span><Upload className="w-4 h-4 mr-2" />Import</span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* User Account Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-lg">User Accounts</CardTitle>
              </div>
              <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-1" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl">
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>Create a new user account for staff access</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder="John Kamau"
                        className="rounded-xl mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          placeholder="john@school.sc.ke"
                          className="rounded-xl mt-1"
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          value={newUser.phone}
                          onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                          placeholder="+254 700 000 000"
                          className="rounded-xl mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Role</Label>
                        <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                          <SelectTrigger className="rounded-xl mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="head_teacher">Head Teacher</SelectItem>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="bursar">Bursar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Staff ID</Label>
                        <Input
                          value={newUser.staff_id}
                          onChange={(e) => setNewUser({ ...newUser, staff_id: e.target.value })}
                          placeholder="T001"
                          className="rounded-xl mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="Enter password"
                        className="rounded-xl mt-1"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddUser(false)} className="rounded-xl">
                      Cancel
                    </Button>
                    <Button onClick={handleCreateUser} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                      Create User
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <CardDescription>Manage staff access to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-sm">
                      {u.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email || u.staff_id || 'No email'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="rounded-lg text-xs">
                      {u.role.replace('_', ' ')}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`rounded-lg text-xs cursor-pointer ${
                        u.is_active
                          ? 'border-green-200 text-green-600 hover:bg-green-50'
                          : 'border-red-200 text-red-600 hover:bg-red-50'
                      }`}
                      onClick={() => handleToggleUserStatus(u)}
                    >
                      {u.is_active ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                      {u.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl"
                        onClick={() => setEditUser(u)}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteUser(u.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user account details</DialogDescription>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  className="rounded-xl mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editUser.email}
                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={editUser.phone}
                    onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                    className="rounded-xl mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Role</Label>
                  <Select value={editUser.role} onValueChange={(v) => setEditUser({ ...editUser, role: v })}>
                    <SelectTrigger className="rounded-xl mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="head_teacher">Head Teacher</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="bursar">Bursar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Staff ID</Label>
                  <Input
                    value={editUser.staff_id}
                    onChange={(e) => setEditUser({ ...editUser, staff_id: e.target.value })}
                    className="rounded-xl mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>New Password (leave blank to keep current)</Label>
                <Input
                  type="password"
                  value={editUser.password || ''}
                  onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                  placeholder="Enter new password"
                  className="rounded-xl mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Server Settings Dialog */}
      <Dialog open={showServerSettings} onOpenChange={setShowServerSettings}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Server Connection Settings</DialogTitle>
            <DialogDescription>Configure the LAN server address for this device</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Server URL</Label>
              <Input
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://192.168.1.100:5000"
                className="rounded-xl mt-1 font-mono"
              />
              <p className="text-xs text-slate-500 mt-2">
                Enter the Admin PC's local network IP address with port 5000
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowServerSettings(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSaveServerUrl} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
              Save & Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
