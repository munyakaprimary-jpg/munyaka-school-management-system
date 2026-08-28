import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { School, Plus, Edit, Trash2, Mail, Calendar, Users, Search, Building2, RefreshCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { School as SchoolType } from '@/types/auth-roles';
import { getSchools, saveSchool, deleteSchool, getUsersDatabase, getMonthlyCodes } from '@/services/AccessDatabaseService';

const SchoolsManagement = () => {
  const { user } = useAuth();
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [search, setSearch] = useState('');
  const [editingSchool, setEditingSchool] = useState<SchoolType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const refreshData = () => {
    setSchools(getSchools());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const allUsers = getUsersDatabase();
  const allCodes = getMonthlyCodes();

  const filteredSchools = schools.filter(s =>
    s.school_name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const schoolName = (formData.get('school_name') as string).trim();
    const contactEmail = (formData.get('contact_email') as string).trim();
    const subscriptionStatus = formData.get('subscription_status') as 'active' | 'expired' | 'unpaid';

    if (!schoolName || !contactEmail) {
      showError("School name and contact email are required.");
      return;
    }

    const newSchool: SchoolType = {
      id: editingSchool?.id || `school-${Date.now()}`,
      school_name: schoolName,
      contact_email: contactEmail,
      subscription_status: subscriptionStatus,
      created_at: editingSchool?.created_at || new Date().toISOString()
    };

    saveSchool(newSchool);
    showSuccess(editingSchool ? `School "${schoolName}" updated.` : `School "${schoolName}" created.`);
    setIsDialogOpen(false);
    setEditingSchool(null);
    refreshData();
  };

  const handleEdit = (school: SchoolType) => {
    setEditingSchool(school);
    setIsDialogOpen(true);
  };

  const handleDelete = (schoolId: string) => {
    if (window.confirm('Are you sure you want to delete this school? This action cannot be undone.')) {
      deleteSchool(schoolId);
      showSuccess('School deleted.');
      refreshData();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-emerald-500/20 text-emerald-700 border-emerald-300 dark:text-emerald-300',
      expired: 'bg-rose-500/20 text-rose-700 border-rose-300 dark:text-rose-300',
      unpaid: 'bg-amber-500/20 text-amber-700 border-amber-300 dark:text-amber-300'
    };
    const icons: Record<string, React.ReactNode> = {
      active: <CheckCircle2 className="w-3 h-3 mr-1" />,
      expired: <AlertCircle className="w-3 h-3 mr-1" />,
      unpaid: <AlertCircle className="w-3 h-3 mr-1" />
    };
    return (
      <Badge variant="outline" className={variants[status] || ''}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getUserCountForSchool = (schoolId: string) => {
    return Object.values(allUsers).filter(u => u.school_id === schoolId).length;
  };

  const getActiveCodeForSchool = (schoolId: string) => {
    const now = new Date();
    return allCodes.find(c => c.school_id === schoolId && new Date(c.expires_at) > now);
  };

  if (user?.role !== 'owner' && user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-slate-600 dark:text-slate-400">Only owners and school administrators can manage schools.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/50 rounded-2xl">
              <Building2 className="text-indigo-600 dark:text-indigo-400" size={24} />
            </div>
            Schools Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1.5 text-sm">
            Manage all registered schools in the system ({schools.length} total)
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" className="rounded-2xl">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingSchool(null); }}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl">
                <Plus className="w-4 h-4 mr-2" />
                New School
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingSchool ? 'Edit School' : 'Create New School'}</DialogTitle>
                  <DialogDescription>
                    {editingSchool ? 'Update the school details below.' : 'Add a new school to the system.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="school_name">School Name</Label>
                    <Input
                      id="school_name"
                      name="school_name"
                      defaultValue={editingSchool?.school_name}
                      placeholder="e.g. Munyaka Primary & JS"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      name="contact_email"
                      type="email"
                      defaultValue={editingSchool?.contact_email}
                      placeholder="contact@school.ac.ke"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subscription_status">Subscription Status</Label>
                    <Select name="subscription_status" defaultValue={editingSchool?.subscription_status || 'active'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    {editingSchool ? 'Save Changes' : 'Create School'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-950/50 rounded-2xl">
                <Building2 className="text-indigo-600 dark:text-indigo-400" size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Schools</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{schools.length}</p>
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
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {schools.filter(s => s.subscription_status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-950/50 rounded-2xl">
                <AlertCircle className="text-amber-600 dark:text-amber-400" size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unpaid / Expired</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {schools.filter(s => s.subscription_status !== 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <Input
          placeholder="Search schools by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-2xl"
        />
      </div>

      {/* Schools Table */}
      <Card className="rounded-3xl border-slate-200 dark:border-slate-800 overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-lg">All Registered Schools</CardTitle>
          <CardDescription>Each school has its own monthly access codes for its users.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Users</TableHead>
                  <TableHead>Active Code</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchools.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No schools found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSchools.map(school => {
                    const activeCode = getActiveCodeForSchool(school.id);
                    return (
                      <TableRow key={school.id}>
                        <TableCell className="font-bold">
                          <div className="flex items-center gap-2">
                            <School className="w-4 h-4 text-indigo-500" />
                            {school.school_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                            <Mail className="w-3.5 h-3.5" />
                            {school.contact_email}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(school.subscription_status)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="rounded-full">
                            <Users className="w-3 h-3 mr-1" />
                            {getUserCountForSchool(school.id)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {activeCode ? (
                            <code className="text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-lg font-mono">
                              {activeCode.code}
                            </code>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No active code</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {school.created_at ? new Date(school.created_at).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(school)}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(school.id)} className="text-rose-600 hover:text-rose-700">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchoolsManagement;
