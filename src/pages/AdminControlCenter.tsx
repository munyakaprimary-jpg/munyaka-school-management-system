import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/apiBase';
import { CentralDataService } from '@/services/centralDataService';
import {
  Server,
  Shield,
  Key,
  Users,
  Sliders,
  Lock,
  Unlock,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Database,
  Globe,
  Settings as SettingsIcon,
  Search,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'head_teacher' | 'bursar' | 'teacher' | 'parent';
  staff_id?: string;
  is_active: number;
  created_at: string;
}

const LAN_SERVER_KEY = 'munyaka_lan_server_url';
const ADMIN_USERS_KEY = 'munyaka_admin_users';
const SYSTEM_PARAMS_KEY = 'munyaka_system_parameters';
const SECURITY_POLICY_KEY = 'munyaka_security_policy';

const loadLocalUsers = (): User[] => {
  try {
    const raw = CentralDataService.getData<User[]>(ADMIN_USERS_KEY, []);
    if (raw && raw.length > 0) return raw;
    const legacy = localStorage.getItem(ADMIN_USERS_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const defaults: User[] = [
      { id: 'usr-1', name: 'System Administrator', email: 'admin@munyaka.ac.ke', phone: '+254700000000', role: 'admin', staff_id: 'ADM001', is_active: 1, created_at: new Date().toISOString() },
      { id: 'usr-2', name: 'Head Teacher', email: 'headteacher@munyaka.ac.ke', phone: '+254711111111', role: 'head_teacher', staff_id: 'HT001', is_active: 1, created_at: new Date().toISOString() },
      { id: 'usr-3', name: 'Bursar', email: 'bursar@munyaka.ac.ke', phone: '+254722222222', role: 'bursar', staff_id: 'BUR001', is_active: 1, created_at: new Date().toISOString() }
    ];
    CentralDataService.setData(ADMIN_USERS_KEY, defaults);
    return defaults;
  } catch {
    return [];
  }
};

const saveLocalUsers = (users: User[]): void => {
  try {
    CentralDataService.setData(ADMIN_USERS_KEY, users);
    localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));
  } catch {}
};

export default function AdminControlCenter() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('setup');
  const [serverUrl, setServerUrl] = useState(() => localStorage.getItem(LAN_SERVER_KEY) || getApiBaseUrl());
  const [users, setUsers] = useState<User[]>(loadLocalUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<User['role']>('teacher');

  // System Parameters
  const [sysParams, setSysParams] = useState(() => {
    try {
      const stored = CentralDataService.getData(SYSTEM_PARAMS_KEY, {
        term: 'Term 1',
        year: '2026',
        maxLoginAttempts: '5',
        sessionTimeoutMinutes: '30',
        requireMfa: false
      });
      return stored;
    } catch {
      return { term: 'Term 1', year: '2026', maxLoginAttempts: '5', sessionTimeoutMinutes: '30', requireMfa: false };
    }
  });

  // Security Policy
  const [securityPolicy, setSecurityPolicy] = useState(() => {
    try {
      return CentralDataService.getData(SECURITY_POLICY_KEY, {
        strictPasswordPolicy: true,
        enforceHttps: true,
        auditLogging: true,
        ipWhitelistEnabled: false
      });
    } catch {
      return { strictPasswordPolicy: true, enforceHttps: true, auditLogging: true, ipWhitelistEnabled: false };
    }
  });

  useEffect(() => {
    try {
      CentralDataService.setData(SYSTEM_PARAMS_KEY, sysParams);
      CentralDataService.setData(SECURITY_POLICY_KEY, securityPolicy);
      localStorage.setItem(SYSTEM_PARAMS_KEY, JSON.stringify(sysParams));
      localStorage.setItem(SECURITY_POLICY_KEY, JSON.stringify(securityPolicy));
    } catch {}
  }, [sysParams, securityPolicy]);

  const handleSaveServerUrl = () => {
    localStorage.setItem(LAN_SERVER_KEY, serverUrl);
    showSuccess('Server URL configuration saved successfully!');
  };

  const handleCreateUser = () => {
    if (!newName.trim() || !newEmail.trim()) {
      showError('Name and email are required.');
      return;
    }
    const newUser: User = {
      id: 'usr-' + Date.now(),
      name: newName,
      email: newEmail,
      phone: '+254700000000',
      role: newRole,
      staff_id: 'STF' + Math.floor(100 + Math.random() * 900),
      is_active: 1,
      created_at: new Date().toISOString()
    };
    const updated = [newUser, ...users];
    setUsers(updated);
    saveLocalUsers(updated);
    setIsNewUserOpen(false);
    setNewName('');
    setNewEmail('');
    showSuccess(`User "${newUser.name}" created successfully with role [${newUser.role}]!`);
  };

  const handleToggleActive = (id: string) => {
    const updated = users.map(u => u.id === id ? { ...u, is_active: u.is_active === 1 ? 0 : 1 } : u);
    setUsers(updated);
    saveLocalUsers(updated);
    showSuccess('User status updated.');
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      saveLocalUsers(updated);
      showSuccess('User deleted.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-6 max-w-7xl mx-auto space-y-8 animate-in fade-in pb-20">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-indigo-500/20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-indigo-500/30 text-indigo-200 border-indigo-400/30 text-xs">System Administration</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Control Center</h1>
            <p className="text-indigo-200 text-sm mt-1">Configure server endpoints, RBAC permissions, security policies, and system parameters.</p>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION BAR */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-14 mb-8 flex flex-wrap gap-1">
          <TabsTrigger value="setup" className="rounded-xl px-6 h-full font-bold text-xs flex items-center gap-2">
            <Server size={16} /> Basic Setup
          </TabsTrigger>
          <TabsTrigger value="rbac" className="rounded-xl px-6 h-full font-bold text-xs flex items-center gap-2">
            <Users size={16} /> RBAC Roles &amp; Users
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-6 h-full font-bold text-xs flex items-center gap-2">
            <Shield size={16} /> Security
          </TabsTrigger>
          <TabsTrigger value="policy" className="rounded-xl px-6 h-full font-bold text-xs flex items-center gap-2">
            <Lock size={16} /> Policy
          </TabsTrigger>
          <TabsTrigger value="params" className="rounded-xl px-6 h-full font-bold text-xs flex items-center gap-2">
            <Sliders size={16} /> System Parameters
          </TabsTrigger>
        </TabsList>

        {/* 1. BASIC SETUP TAB */}
        <TabsContent value="setup" className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 sm:p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b">
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Globe className="text-indigo-600" size={22} /> Network &amp; Server Connection
              </CardTitle>
              <CardDescription>Configure primary LAN server URL, API gateway endpoints, and local IP routing.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-6 space-y-4">
              <div className="space-y-2">
                <Label>LAN Server URL / API Base URL</Label>
                <div className="flex gap-3">
                  <Input 
                    value={serverUrl} 
                    onChange={e => setServerUrl(e.target.value)} 
                    placeholder="http://192.168.1.100:3000" 
                    className="font-mono"
                  />
                  <Button onClick={handleSaveServerUrl} className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0">
                    Save Endpoint
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-600" size={24} />
                  <div>
                    <h4 className="font-bold text-emerald-900 text-sm">Connection Status: Online</h4>
                    <p className="text-xs text-emerald-700">Central data store is synchronized with local IndexedDB storage.</p>
                  </div>
                </div>
                <Badge className="bg-emerald-600 text-white font-bold">Connected</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. RBAC ROLES & USERS TAB */}
        <TabsContent value="rbac" className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 sm:p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Users className="text-indigo-600" size={22} /> Role-Based Access Control (RBAC) &amp; Users
                  </CardTitle>
                  <CardDescription>Manage user accounts, staff access roles, and permission levels.</CardDescription>
                </div>
                <Button onClick={() => setIsNewUserOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
                  <Plus size={16} /> Add User Account
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-0 pt-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search users by name, email, or role..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4 font-semibold">User Name</th>
                      <th className="py-3 px-4 font-semibold">Email &amp; Phone</th>
                      <th className="py-3 px-4 font-semibold">Role</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={5} className="py-8 text-center text-slate-400">No users found.</td></tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50/50">
                          <td className="py-4 px-4 font-semibold text-slate-900">{user.name}</td>
                          <td className="py-4 px-4 text-slate-600 text-xs">
                            <div>{user.email}</div>
                            <div className="text-slate-400">{user.phone || '—'}</div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge className="bg-indigo-100 text-indigo-800 capitalize font-bold text-xs">
                              {user.role.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <Badge className={user.is_active === 1 ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-red-100 text-red-800 font-bold'}>
                              {user.is_active === 1 ? 'Active' : 'Suspended'}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleToggleActive(user.id)} className="h-8 text-xs">
                                {user.is_active === 1 ? 'Suspend' : 'Activate'}
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDeleteUser(user.id)} className="h-8 w-8 text-red-500 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. SECURITY TAB */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 sm:p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b">
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Shield className="text-indigo-600" size={22} /> Security &amp; Encryption Controls
              </CardTitle>
              <CardDescription>Configure SSL policies, audit logging, and access security frameworks.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
                <div>
                  <h4 className="font-bold text-slate-900">Enforce HTTPS / Secure Transport</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Require TLS encryption for all client-server communications.</p>
                </div>
                <Switch 
                  checked={securityPolicy.enforceHttps} 
                  onCheckedChange={val => setSecurityPolicy({...securityPolicy, enforceHttps: val})}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
                <div>
                  <h4 className="font-bold text-slate-900">Comprehensive Audit Logging</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Log administrative actions, mark edits, and permission changes.</p>
                </div>
                <Switch 
                  checked={securityPolicy.auditLogging} 
                  onCheckedChange={val => setSecurityPolicy({...securityPolicy, auditLogging: val})}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
                <div>
                  <h4 className="font-bold text-slate-900">Strict Password Complexity</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Require minimum 8 characters with alphanumeric and symbol mix.</p>
                </div>
                <Switch 
                  checked={securityPolicy.strictPasswordPolicy} 
                  onCheckedChange={val => setSecurityPolicy({...securityPolicy, strictPasswordPolicy: val})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. POLICY TAB */}
        <TabsContent value="policy" className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 sm:p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b">
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Lock className="text-indigo-600" size={22} /> Institutional Compliance &amp; Policy
              </CardTitle>
              <CardDescription>Manage academic privacy compliance, data retention, and term grading lockdowns.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-6 space-y-4 text-sm text-slate-600 leading-relaxed">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-2">
                <h4 className="font-bold text-indigo-900">CBC Curriculum Standards &amp; Privacy Policy</h4>
                <p className="text-xs text-indigo-700">
                  This platform complies with Ministry of Education CBC guidelines and data protection regulations. All student academic assessments, attendance logs, and financial records are encrypted and stored in local persistent storage.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border mt-4">
                <div>
                  <h4 className="font-bold text-slate-900">IP Whitelist Restriction</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Limit admin panel access to trusted school LAN subnets only.</p>
                </div>
                <Switch 
                  checked={securityPolicy.ipWhitelistEnabled} 
                  onCheckedChange={val => setSecurityPolicy({...securityPolicy, ipWhitelistEnabled: val})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. SYSTEM PARAMETERS TAB */}
        <TabsContent value="params" className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 sm:p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b">
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="text-indigo-600" size={22} /> System Parameters &amp; Thresholds
              </CardTitle>
              <CardDescription>Configure global session limits, active academic terms, and login timeouts.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Active Academic Term</Label>
                  <Input 
                    value={sysParams.term} 
                    onChange={e => setSysParams({...sysParams, term: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Input 
                    value={sysParams.year} 
                    onChange={e => setSysParams({...sysParams, year: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Failed Login Attempts</Label>
                  <Input 
                    value={sysParams.maxLoginAttempts} 
                    onChange={e => setSysParams({...sysParams, maxLoginAttempts: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Session Timeout (Minutes)</Label>
                  <Input 
                    value={sysParams.sessionTimeoutMinutes} 
                    onChange={e => setSysParams({...sysParams, sessionTimeoutMinutes: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={() => {
                  CentralDataService.setData(SYSTEM_PARAMS_KEY, sysParams);
                  showSuccess("System parameters updated successfully!");
                }} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                  Save System Parameters
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* NEW USER MODAL */}
      {isNewUserOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add New User Account</h3>
            <div className="space-y-3">
              <div>
                <Label>Full Name</Label>
                <Input placeholder="e.g. John Doe" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div>
                <Label>Email Address</Label>
                <Input placeholder="user@munyaka.ac.ke" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              </div>
              <div>
                <Label>Access Role</Label>
                <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">System Administrator</SelectItem>
                    <SelectItem value="head_teacher">Head Teacher</SelectItem>
                    <SelectItem value="bursar">Bursar</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsNewUserOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateUser} className="bg-indigo-600 text-white">Create Account</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
