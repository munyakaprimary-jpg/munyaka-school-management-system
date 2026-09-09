import React, { useState, useMemo } from 'react';
import { 
  Shield, KeyRound, UserCheck, UserX, Search, Filter, 
  CheckCircle2, XCircle, RefreshCw, Lock, Unlock, Users, ShieldAlert, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { useStaffData } from '@/hooks/useStaffData';
import { toTitleCase, toRoleTitleCase } from '@/utils/staffFormatting';
import { toast } from 'sonner';

export default function StaffPreRegistration() {
  const { staff, loading, refreshStaff, updateStaffMember } = useStaffData();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const name = member.name || '';
      const email = member.email || '';
      const tsc = member.tsc_number || member.staff_id || '';
      
      const matchesSearch = 
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tsc.toLowerCase().includes(searchTerm.toLowerCase());

      const memberRole = (member.system_role || member.role || '').toLowerCase();
      const matchesRole = roleFilter === 'all' || memberRole === roleFilter.toLowerCase();
      
      const isAccessActive = member.status === 'active';
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && isAccessActive) || 
        (statusFilter === 'inactive' && !isAccessActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staff, searchTerm, roleFilter, statusFilter]);

  const handleToggleAccess = async (id: string, currentStatus: string, name: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateStaffMember(id, { status: newStatus });
      toast.success(`System access ${newStatus === 'active' ? 'granted' : 'revoked'} for ${toTitleCase(name)}`);
      refreshStaff();
    } catch (err: any) {
      toast.error('Failed to update system access status');
    }
  };

  const handleQuickUnlock = async (id: string, name: string) => {
    try {
      await updateStaffMember(id, { status: 'active' });
      toast.success(`System access unlocked for ${toTitleCase(name)}`);
      refreshStaff();
    } catch (err: any) {
      toast.error('Failed to unlock system access');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-200">
              <Shield className="w-7 h-7" />
            </div>
            System Access Master
          </h1>
          <p className="text-slate-500 mt-1">
            Govern staff authentication privileges, role-based security clearance, and system portal access.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => refreshStaff()}
            className="border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Ledger
          </Button>
        </div>
      </div>

      {/* Metrics / Security Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-purple-50/50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Access Master Records</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{staff.length}</h3>
              </div>
              <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-emerald-50/50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active Access</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {staff.filter(s => s.status === 'active').length}
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
                <Unlock className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-amber-50/50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Locked / Inactive</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {staff.filter(s => s.status !== 'active').length}
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
                <Lock className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-blue-50/50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Administrators</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {staff.filter(s => (s.system_role || s.role || '').toLowerCase().includes('admin') || (s.system_role || s.role || '').toLowerCase().includes('head')).length}
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search staff, email, TSC No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200 bg-slate-50/50 focus-visible:bg-white"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[160px] border-slate-200 bg-slate-50/50">
                    <SelectValue placeholder="Filter Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="head_teacher">Head Teacher</SelectItem>
                    <SelectItem value="librarian">Librarian</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] border-slate-200 bg-slate-50/50">
                  <SelectValue placeholder="Access Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active Access</SelectItem>
                  <SelectItem value="inactive">Locked Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Master Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/75 border-b border-slate-200">
              <TableRow>
                <TableHead className="font-semibold text-slate-700 py-4 px-6">Staff Member</TableHead>
                <TableHead className="font-semibold text-slate-700 py-4 px-6">TSC No. / Staff ID</TableHead>
                <TableHead className="font-semibold text-slate-700 py-4 px-6">Assigned System Role</TableHead>
                <TableHead className="font-semibold text-slate-700 py-4 px-6">Department</TableHead>
                <TableHead className="font-semibold text-slate-700 py-4 px-6">Access Status</TableHead>
                <TableHead className="font-semibold text-slate-700 py-4 px-6 text-right">Access Controls</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                      <p>Loading system access records...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Shield className="w-10 h-10 text-slate-300" />
                      <p className="font-medium text-slate-700">No access records found</p>
                      <p className="text-sm text-slate-400">Try adjusting your filter criteria.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((member) => {
                  const formattedName = toTitleCase(member.name);
                  const normalizedRole = toRoleTitleCase(member.system_role || member.role);
                  const formattedDept = toTitleCase(member.department || 'Academics');
                  const tscDisplay = member.tsc_number || member.staff_id || 'TSC Pending';
                  const isActive = member.status === 'active';

                  return (
                    <TableRow key={member.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shadow-inner">
                            {formattedName ? formattedName.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{formattedName}</div>
                            <div className="text-xs text-slate-500">{member.email || 'No email recorded'}</div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-6">
                        <div className="font-mono text-xs font-semibold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md inline-block">
                          {tscDisplay}
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-6">
                        <Badge variant="outline" className="font-medium bg-purple-50/50 text-purple-700 border-purple-200">
                          {normalizedRole}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-4 px-6 text-slate-700 font-medium text-sm">
                        {formattedDept}
                      </TableCell>

                      <TableCell className="py-4 px-6">
                        <Badge 
                          variant={isActive ? 'default' : 'secondary'}
                          className={`font-medium ${
                            isActive 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                              : 'bg-rose-100 text-rose-800 border-rose-200'
                          }`}
                        >
                          {isActive ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Active Access
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Access Locked
                            </span>
                          )}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isActive ? (
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleAccess(member.id, member.status, formattedName)}
                              className="border-rose-200 text-rose-700 hover:bg-rose-50 h-8"
                            >
                              <Lock className="w-3.5 h-3.5 mr-1.5" />
                              Revoke
                            </Button>
                          ) : (
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickUnlock(member.id, formattedName)}
                              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-8"
                            >
                              <Unlock className="w-3.5 h-3.5 mr-1.5" />
                              Unlock
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
