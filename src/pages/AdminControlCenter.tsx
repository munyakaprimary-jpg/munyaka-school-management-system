import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Shield, Trash2, RefreshCw, Upload, Download } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

export const AdminControlCenter: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'teacher',
    staff_id: '',
    password: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    try {
      const raw = localStorage.getItem('munyaka_user_accounts') || localStorage.getItem('munyaka_users') || '[]';
      const parsed = JSON.parse(raw);
      setUsers(Array.isArray(parsed) ? parsed : Object.values(parsed));
    } catch {
      setUsers([]);
    }
  };

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email) {
      showError('Please fill in name and email.');
      return;
    }
    const created = {
      id: `usr-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role.toUpperCase(),
      staffId: newUser.staff_id || `STF-${Math.floor(Math.random() * 9000 + 1000)}`,
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    const updated = [...users, created];
    setUsers(updated);
    localStorage.setItem('munyaka_user_accounts', JSON.stringify(updated));
    localStorage.setItem('munyaka_users', JSON.stringify(updated));
    setShowAddUser(false);
    setNewUser({ name: '', email: '', phone: '', role: 'teacher', staff_id: '', password: '' });
    showSuccess('User account created successfully.');
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to delete this user account?')) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      localStorage.setItem('munyaka_user_accounts', JSON.stringify(updated));
      localStorage.setItem('munyaka_users', JSON.stringify(updated));
      showSuccess('User account removed.');
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (data.users) {
          localStorage.setItem('munyaka_user_accounts', JSON.stringify(data.users));
          localStorage.setItem('munyaka_users', JSON.stringify(data.users));
          loadUsers();
          showSuccess('Backup restored successfully.');
        }
      } catch (err) {
        showError('Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Control Center</h1>
          <p className="text-slate-500 font-medium">Manage user accounts, authentication access, and system backups.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Backup & Restore Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-lg">System Backup & Recovery</CardTitle>
            </div>
            <CardDescription>Export or import secure local database backups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Download className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-bold">Export Backup</p>
                  <p className="text-sm text-slate-500">Download system users & settings</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  const data = { users, exportDate: new Date().toISOString() };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `munyaka-backup-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  showSuccess('Backup exported successfully.');
                }}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
              >
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-bold">Restore Backup</p>
                  <p className="text-sm text-slate-500">Import data from a backup file</p>
                </div>
              </div>
              <label>
                <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                <Button asChild className="rounded-xl bg-amber-600 hover:bg-amber-700 cursor-pointer">
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to reset all registered user accounts? This will restore only the default System Admin account.")) {
                      const defaultAdmin = [{
                        id: 'user-admin-default',
                        name: 'System Admin',
                        email: 'admin@munyaka.sc.ke',
                        username: 'admin',
                        role: 'SYSTEM ADMINISTRATOR',
                        status: 'Active'
                      }];
                      localStorage.setItem('munyaka_user_accounts', JSON.stringify(defaultAdmin));
                      localStorage.setItem('munyaka_users', JSON.stringify(defaultAdmin));
                      loadUsers();
                      showSuccess('User accounts reset to default System Admin.');
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 text-xs transition-all"
                >
                  Reset Accounts
                </button>
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
            </div>
            <CardDescription>Manage staff access to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {users.map((u) => (
                <div
                  key={u.id || u.email}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-sm">
                      {String(u?.name || 'U').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{u?.name || 'Unnamed User'}</p>
                      <p className="text-xs text-slate-500 truncate">{u?.email || 'No Email'} • <span className="uppercase font-mono text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">{u?.role || 'Staff'}</span></p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteUser(u.id)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl self-end sm:self-center"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-center text-slate-400 py-6 text-sm font-medium">No registered user accounts found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminControlCenter;
