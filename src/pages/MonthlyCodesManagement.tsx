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
import { KeyRound, Plus, Trash2, Calendar, RefreshCcw, Copy, AlertCircle, CheckCircle2, Clock, Building2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { MonthlyCode as MonthlyCodeType } from '@/types/auth-roles';
import { getMonthlyCodes, getSchools, createMonthlyCode, deleteMonthlyCode, computeMonthExpiration } from '@/services/AccessDatabaseService';

const MonthlyCodesManagement = () => {
  const { user } = useAuth();
  const [codes, setCodes] = useState<MonthlyCodeType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedMonthYear, setSelectedMonthYear] = useState(() => {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  });

  const schools = getSchools();

  const refreshData = () => {
    setCodes(getMonthlyCodes().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleCreateCode = () => {
    if (!selectedSchoolId) {
      showError('Please select a school.');
      return;
    }
    if (!/^\d{2}-\d{4}$/.test(selectedMonthYear)) {
      showError('Month-Year must be in format MM-YYYY (e.g., 08-2026).');
      return;
    }

    const newCode = createMonthlyCode(selectedSchoolId, selectedMonthYear);
    showSuccess(`Code ${newCode.code} created. Expires ${new Date(newCode.expires_at).toLocaleString()}.`);
    setIsDialogOpen(false);
    refreshData();
  };

  const handleDelete = (codeId: string) => {
    if (window.confirm('Delete this monthly code? Users with this code will lose access.')) {
      deleteMonthlyCode(codeId);
      showSuccess('Code deleted.');
      refreshData();
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    showSuccess('Code copied to clipboard!');
  };

  const isExpired = (expiresAt: string) => new Date() > new Date(expiresAt);

  const getStatusBadge = (code: MonthlyCodeType) => {
    if (isExpired(code.expires_at)) {
      return <Badge variant="outline" className="bg-rose-500/20 text-rose-700 border-rose-300 dark:text-rose-300">
        <AlertCircle className="w-3 h-3 mr-1" />Expired
      </Badge>;
    }
    return <Badge variant="outline" className="bg-emerald-500/20 text-emerald-700 border-emerald-300 dark:text-emerald-300">
      <CheckCircle2 className="w-3 h-3 mr-1" />Active
    </Badge>;
  };

  const getSchoolName = (schoolId: string) => {
    return schools.find(s => s.id === schoolId)?.school_name || 'Unknown School';
  };

  const activeCount = codes.filter(c => !isExpired(c.expires_at)).length;
  const expiredCount = codes.length - activeCount;

  if (user?.role !== 'owner' && user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-slate-600 dark:text-slate-400">Only owners and school administrators can manage monthly codes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/50 rounded-2xl">
              <KeyRound className="text-emerald-600 dark:text-emerald-400" size={24} />
            </div>
            Monthly Access Codes
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1.5 text-sm">
            Generate and manage monthly access codes. Each code expires at <strong>11:59:59 PM</strong> on the last day of the month.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" className="rounded-2xl">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl">
                <Plus className="w-4 h-4 mr-2" />
                Generate Code
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Generate Monthly Code</DialogTitle>
                <DialogDescription>
                  Create a new access code valid until 11:59:59 PM on the last day of the selected month.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="school">School</Label>
                  <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.school_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="month_year">Month & Year</Label>
                  <Input
                    id="month_year"
                    value={selectedMonthYear}
                    onChange={(e) => setSelectedMonthYear(e.target.value)}
                    placeholder="MM-YYYY"
                    className="font-mono"
                  />
                  {/^\d{2}-\d{4}$/.test(selectedMonthYear) && (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Expires: {new Date(computeMonthExpiration(selectedMonthYear)).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="button" onClick={handleCreateCode} className="bg-emerald-600 hover:bg-emerald-700">
                  Generate Code
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-950/50 rounded-2xl">
                <KeyRound className="text-indigo-600 dark:text-indigo-400" size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Codes</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{codes.length}</p>
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
                <p className="text-2xl font-black text-slate-900 dark:text-white">{activeCount}</p>
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
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expired</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{expiredCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Codes Table */}
      <Card className="rounded-3xl border-slate-200 dark:border-slate-800 overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-lg">All Monthly Codes</CardTitle>
          <CardDescription>Codes are case-insensitive. Users can use them to activate or extend their access.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No monthly codes yet. Click "Generate Code" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  codes.map(code => (
                    <TableRow key={code.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-lg">
                            {code.code}
                          </code>
                          <Button size="sm" variant="ghost" onClick={() => handleCopy(code.code)} className="h-7 w-7 p-0">
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {getSchoolName(code.school_id)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono">{code.month_year}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(code.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {new Date(code.expires_at).toLocaleDateString()}
                          </span>
                          <span className="text-slate-500">
                            {new Date(code.expires_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(code)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(code.id)} className="text-rose-600 hover:text-rose-700">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
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

export default MonthlyCodesManagement;
