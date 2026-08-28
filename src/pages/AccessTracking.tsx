import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users as UsersIcon, Search, RefreshCcw, ShieldCheck, Clock, Building2, AlertCircle, CheckCircle2, KeyRound, Calendar } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { UserAccount, UserRole } from '@/types/auth-roles';
import { getUsersDatabase, saveUsersDatabase, getSchools } from '@/services/AccessDatabaseService';

const AccessTracking = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<Array<UserAccount & { password?: string }>>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const schools = getSchools();

  const refreshData = () => {
    setUsers(Object.values(getUsersDatabase()));
  };

  useEffect(() => {
    refreshData();
  }, []);

  const getSchoolName = (schoolId: string) => {
    return schools.find(s => s.id === schoolId)?.school_name || 'Unknown School';
  };

  const isAccessExpired = (validUntil: string) => {
    return new Date() > new Date(validUntil);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && u.isActive) ||
      (statusFilter === 'inactive' && !u.isActive) ||
      (statusFilter === 'expired' && isAccessExpired(u.access_valid_until));
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleToggleActive = (email: string) => {
    const allUsers = getUsersDatabase();
    const u = allUsers[email];
    if (u) {
      u.isActive = !u.isActive;
      allUsers[email] = u;
      saveUsersDatabase(allUsers);
      showSuccess(`${u.name} is now ${u.isActive ? 'active' : 'inactive'}.`);
      refreshData();
    }
  };

  const handleExtendAccess = (email: string, days: number) => {
    const allUsers = getUsersDatabase();
    const u = allUsers[email];
    if (u) {
      const newValidUntil = new Date();
      newValidUntil.setDate(newValidUntil.getDate() + days);
      u.access_valid_until = newValidUntil.toISOString();
      allUsers[email] = u;
      saveUsersDatabase(allUsers);
      showSuccess(`Access for ${u.name} extended by ${days} days.`);
      refreshData();
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      owner: 'bg-purple-500/20 text-purple-700 border-purple-300 dark:text-purple-300',
      admin: 'bg-indigo-500/20 text-indigo-700 border-indigo-300 dark:text-indigo-300',
      teacher: 'bg-blue-500/20 text-blue-700 border-blue-300 dark:text-blue-300',
      bursar: 'bg-amber-500/20 text-amber-700 border-amber-300 dark:text-amber-300',
      librarian: 'bg-teal-500/20 text-teal-700 border-teal-300 dark:text-teal-300',
      storekeeper: 'bg-pink-500/20 text-pink-700 border-pink-300 dark:text-pink-300'
    };
    return <Badge variant="outline" className={colors[role]}>{role.toUpperCase()}</Badge>;
  };

  const getAccessBadge = (validUntil: string) => {
    if (isAccessExpired(validUntil)) {
      return <Badge variant="outline" className="bg-rose-500/20 text-rose-700 border-rose-300 dark:text-rose-300">
        <AlertCircle className="w-3 h-3 mr-1" />Expired
      </Badge>;
    }
    return <Badge variant="outline" className="bg-emerald-500/20 text-emerald-700 border-emerald-300 dark:text-emerald-300">
      <CheckCircle2 className="w-3 h-3 mr-1" />Active
    </Badge>;
  };

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const expiredUsers = users.filter(u => isAccessExpired(u.access_valid_until)).length;
  const roleCount = users.filter(u => u.role === 'owner').length;

  if (user?.role !== 'owner' && user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-slate-600 dark:text-slate-400">Only owners and school administrators can track user access.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/50 rounded-2xl">
              <ShieldCheck className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            User Access Tracking
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1.5 text-sm">
            Monitor role distribution, individual activation status, and school assignments.
          </p>
        </div>
        <Button onClick={refreshData} variant="outline" className="rounded-2xl">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-950/50 rounded-2xl">
                <UsersIcon className="text-indigo-600 dark:text-indigo-400" size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Users</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/50 rounded-2xl">
                <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/50 rounded-2xl">
                <AlertCircle className="text-rose-600 dark:text-rose-400" size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expired Access</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{expiredUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-950/50 rounded-2xl">
                <KeyRound className="text-purple-600 dark:text-purple-400" size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Owners</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{roleCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-2xl"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="rounded-2xl">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="bursar">Bursar</SelectItem>
            <SelectItem value="librarian">Librarian</SelectItem>
            <SelectItem value="storekeeper">Storekeeper</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="rounded-2xl">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="expired">Expired Access</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card className="rounded-3xl border-slate-200 dark:border-slate-800 overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-lg">All Users & Access Status</CardTitle>
          <CardDescription>Track each user's role, school assignment, and access expiration.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Access Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map(u => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                            {u.avatar || u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {getSchoolName(u.school_id)}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-col">
                          <span className={`font-semibold ${isAccessExpired(u.access_valid_until) ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                            {new Date(u.access_valid_until).toLocaleDateString()}
                          </span>
                          <span className="text-slate-500">
                            {new Date(u.access_valid_until).toLocaleTimeString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getAccessBadge(u.access_valid_until)}
                          {!u.isActive && (
                            <Badge variant="outline" className="bg-slate-500/20 text-slate-700 border-slate-300">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleExtendAccess(u.email, 30)}
                            title="Extend access by 30 days"
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActive(u.email)}
                            title={u.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {u.isActive ? (
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessTracking;
