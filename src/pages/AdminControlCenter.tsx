import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Plus, 
  Shield, 
  Trash2, 
  RefreshCw, 
  Upload, 
  Download, 
  ExternalLink,
  MoreVertical,
  Key,
  Lock,
  RotateCcw,
  Mail,
  Bell,
  BellOff,
  UserX
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { getStaffMaster } from '@/services/staffMasterService';

export const AdminControlCenter: React.FC = () => {
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = () => {
    try {
      const staffList = getStaffMaster();
      setStaff(staffList);
      const registryList = localStorage.getItem('munyaka_staff_registry') || localStorage.getItem('munyaka_staff') || localStorage.getItem('munyaka_staff_directory');
      if (registryList) {
        try {
          const parsed = JSON.parse(registryList);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStaff(parsed);
          }
        } catch {}
      }
    } catch {
      setStaff([]);
    }
  };

  const persistStaffList = (updatedList: any[]) => {
    setStaff(updatedList);
    localStorage.setItem('munyaka_staff', JSON.stringify(updatedList));
    localStorage.setItem('munyaka_staff_db', JSON.stringify(updatedList));
    localStorage.setItem('munyaka_staff_directory', JSON.stringify(updatedList));
    localStorage.setItem('munyaka_staff_registry', JSON.stringify(updatedList));
  };

  const handleCopyCode = (code: string) => {
    if (!code) {
      showError('No access code available.');
      return;
    }
    navigator.clipboard.writeText(code);
    showSuccess(`Copied access code: ${code}`);
  };

  const handleCopyPassword = (u: any) => {
    const pwd = u.password || 'Munyaka2025!';
    navigator.clipboard.writeText(pwd);
    showSuccess(`Copied password for ${u.name}`);
  };

  const handleResetPassword = (u: any) => {
    const newPwd = 'Munyaka' + Math.floor(1000 + Math.random() * 9000) + '!';
    const updated = staff.map(item => {
      if ((item.id && item.id === u.id) || item.email === u.email) {
        return { ...item, password: newPwd, lastPasswordChange: new Date().toISOString() };
      }
      return item;
    });
    persistStaffList(updated);
    showSuccess(`Password reset for ${u.name}. New password: ${newPwd}`);
  };

  const handleUpdateEmail = (u: any, newEmailPrefix: string) => {
    if (!newEmailPrefix) return;
    const cleanPrefix = newEmailPrefix.split('@')[0].trim().toLowerCase();
    const finalEmail = `${cleanPrefix}@munyaka.sc.ke`;
    const updated = staff.map(item => {
      if ((item.id && item.id === u.id) || item.email === u.email) {
        return { ...item, email: finalEmail };
      }
      return item;
    });
    persistStaffList(updated);
    showSuccess(`Email updated to ${finalEmail}`);
  };

  const handleToggleLoginAccess = (u: any) => {
    const currentEnabled = u.loginEnabled !== false;
    const nextState = !currentEnabled;
    const updated = staff.map(item => {
      if ((item.id && item.id === u.id) || item.email === u.email) {
        return { ...item, loginEnabled: nextState };
      }
      return item;
    });
    persistStaffList(updated);
    showSuccess(`Login access for ${u.name} is now ${nextState ? 'Enabled' : 'Disabled'}`);
  };

  const handleDeleteStaff = (id: string) => {
    if (confirm('Are you sure you want to remove this staff record & revoke authentication access?')) {
      const updated = staff.filter(u => u.id !== id);
      persistStaffList(updated);
      showSuccess('Staff record and auth access successfully revoked.');
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (data.staff) {
          persistStaffList(data.staff);
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
          <p className="text-slate-500 font-medium">Manage staff records, authentication access, and system backups.</p>
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
                  <p className="text-sm text-slate-500">Download system staff & settings</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  const data = { staff, exportDate: new Date().toISOString() };
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

        {/* Staff Account Management / Unified Auth Cards */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-lg">Staff Records (Unified Auth)</CardTitle>
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="rounded-xl text-xs gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200 cursor-pointer"
                >
                  <Link to="/staff-registry">
                    Go to Staff Registry <ExternalLink size={12} />
                  </Link>
                </Button>
              </div>
            </div>
            <CardDescription>
              Unified authentication source. Manage login access badges and security credentials directly from each card.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {staff.map((u) => {
                const loginEnabled = u.loginEnabled !== false;
                const accessCode = u.accessCode || u.teacherCode || u.code || u.tempAccessCode || u.id || '—';
                return (
                  <div
                    key={u.id || u.email}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 gap-3 hover:border-indigo-200 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-sm">
                        {String(u?.name || 'U').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{u?.name || 'Unnamed Staff'}</p>
                          {/* Login Access Status Badge */}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${loginEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full bg-current mr-1 ${loginEnabled ? 'animate-pulse' : ''}`}></span>
                            {loginEnabled ? 'Login Enabled' : 'Login Disabled'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {u?.email || 'No Email'} •{' '}
                          <span className="uppercase font-mono text-[10px] bg-slate-200/70 text-slate-700 dark:bg-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-bold">
                            {u?.designation || u?.assignedRole || u?.role || u?.systemRole || 'Subject Teacher'}
                          </span>{' '}
                          • Code: <span className="font-mono font-bold text-indigo-600">{accessCode}</span>
                        </p>
                      </div>
                    </div>

                    {/* Unified Auth Card Actions Menu */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 border-slate-200 bg-white hover:bg-slate-100">
                            <MoreVertical className="w-4 h-4 text-slate-500" /> Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem 
                            className="flex items-center gap-2 text-indigo-600 cursor-pointer"
                            onClick={() => handleCopyCode(accessCode)}
                          >
                            <Key className="w-4 h-4" />
                            Copy Access Code
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => handleCopyPassword(u)}
                          >
                            <Lock className="w-4 h-4" />
                            Copy Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="flex items-center gap-2 text-amber-600 cursor-pointer"
                            onClick={() => handleResetPassword(u)}
                          >
                            <RotateCcw className="w-4 h-4" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center gap-2 text-blue-600 cursor-pointer"
                            onClick={() => {
                              const newEmail = prompt('Enter new email (username only, @munyaka.sc.ke will be added):', u.email ? u.email.split('@')[0] : '');
                              if (newEmail && newEmail.trim()) {
                                handleUpdateEmail(u, newEmail.trim());
                              }
                            }}
                          >
                            <Mail className="w-4 h-4" />
                            Update Email
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => handleToggleLoginAccess(u)}
                          >
                            {loginEnabled ? (
                              <>
                                <BellOff className="w-4 h-4 text-rose-600" />
                                Disable Login Access
                              </>
                            ) : (
                              <>
                                <Bell className="w-4 h-4 text-emerald-600" />
                                Enable Login Access
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="flex items-center gap-2 text-rose-600 cursor-pointer"
                            onClick={() => handleDeleteStaff(u.id)}
                          >
                            <UserX className="w-4 h-4" />
                            Remove Staff & Revoke Access
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
              {staff.length === 0 && (
                <p className="text-center text-slate-400 py-6 text-sm font-medium">No staff records found. Use Staff & Teacher Registry to add staff.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminControlCenter;
