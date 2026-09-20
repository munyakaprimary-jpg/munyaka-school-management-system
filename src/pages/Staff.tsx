import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Filter, MoreVertical, Edit, Trash2, 
  FileText, Download, Upload, CheckCircle2, XCircle, ShieldAlert,
  ChevronRight, ArrowUpDown, RefreshCw, Eye, Award, Sparkles, Loader2, Briefcase, GraduationCap
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showSuccess, showError } from '@/utils/toast';
import staffService, { StaffMember } from '@/services/staffService';

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'teaching' | 'non-teaching'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Teacher');
  const [category, setCategory] = useState('Teaching');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tscNumber, setTscNumber] = useState('');

  const loadStaffData = () => {
    try {
      const data = staffService.getStaff();
      setStaffList(data);
    } catch (err) {
      console.error("Failed to load staff list:", err);
    }
  };

  useEffect(() => {
    loadStaffData();
    window.addEventListener('storage', loadStaffData);
    window.addEventListener('munyaka:data-changed', loadStaffData);
    return () => {
      window.removeEventListener('storage', loadStaffData);
      window.removeEventListener('munyaka:data-changed', loadStaffData);
    };
  }, []);

  const stats = useMemo(() => {
    return staffService.getStaffStats();
  }, [staffList]);

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const name = (s.name || s.fullName || '').toLowerCase();
      const sEmail = (s.email || '').toLowerCase();
      const sPhone = (s.phone || '').toLowerCase();
      const sRole = (s.role || '').toLowerCase();

      const matchesSearch = 
        name.includes(searchTerm.toLowerCase()) || 
        sEmail.includes(searchTerm.toLowerCase()) || 
        sPhone.includes(searchTerm.toLowerCase()) || 
        sRole.includes(searchTerm.toLowerCase());

      const roleStr = `${s.role || ''} ${s.type || ''} ${s.category || ''} ${s.position || ''}`.toLowerCase();
      const isTeaching = roleStr.includes('teach') || roleStr.includes('educator');

      if (activeTab === 'teaching') return matchesSearch && isTeaching;
      if (activeTab === 'non-teaching') return matchesSearch && !isTeaching;
      return matchesSearch;
    });
  }, [staffList, searchTerm, activeTab]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFullName('');
    setRole('Teacher');
    setCategory('Teaching');
    setEmail('');
    setPhone('');
    setTscNumber('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (staff: StaffMember) => {
    setEditingId(staff.id);
    setFullName(staff.name || staff.fullName || '');
    setRole(staff.role || staff.position || 'Teacher');
    setCategory(staff.category || staff.type || 'Teaching');
    setEmail(staff.email || '');
    setPhone(staff.phone || '');
    setTscNumber(staff.tscNumber || '');
    setIsModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!fullName.trim()) {
      showError("Please enter staff member name");
      return;
    }

    setIsSaving(true);
    try {
      const staffData = {
        name: fullName.trim(),
        fullName: fullName.trim(),
        role,
        category,
        type: category,
        email: email.trim(),
        phone: phone.trim(),
        tscNumber: tscNumber.trim(),
        status: 'Active',
      };

      if (editingId) {
        staffService.updateStaffMember(editingId, staffData);
        showSuccess("Staff record updated successfully");
      } else {
        staffService.addStaffMember(staffData);
        showSuccess("Staff member added successfully");
      }

      loadStaffData();
      setIsModalOpen(false);
    } catch (err) {
      showError("Failed to save staff record");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      const success = staffService.deleteStaffMember(id);
      if (success) {
        showSuccess("Staff member deleted");
        loadStaffData();
      } else {
        showError("Failed to delete record");
      }
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 mb-2">
            STAFF & PERSONNEL DIRECTORY
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-sm text-indigo-200 mt-1 max-w-2xl">
            Manage teaching faculty, administrative staff, and support personnel with unified data persistence.
          </p>
        </div>
        <Button onClick={handleOpenAddModal} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 rounded-2xl px-5 py-3 font-bold flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Add Staff Member
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Staff Records</CardTitle>
            <Users className="w-5 h-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Fully synchronized
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Teaching Staff</CardTitle>
            <GraduationCap className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.teachingCount}</div>
            <p className="text-xs text-gray-500 mt-1">Active faculty & educators</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Non-Teaching Staff</CardTitle>
            <Briefcase className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.nonTeachingCount}</div>
            <p className="text-xs text-gray-500 mt-1">Admin, support & operations</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Accounts</CardTitle>
            <ShieldAlert className="w-5 h-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.activeCount}</div>
            <p className="text-xs text-emerald-600 mt-1">Operational & verified</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, role, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              All Staff ({staffList.length})
            </button>
            <button
              onClick={() => setActiveTab('teaching')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'teaching' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Teaching
            </button>
            <button
              onClick={() => setActiveTab('non-teaching')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'non-teaching' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Non-Teaching
            </button>
          </div>
        </div>

        {/* Staff Table / Cards */}
        <div className="overflow-x-auto">
          {filteredStaff.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-gray-600">No staff members found.</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search query or tab filter.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-xs font-bold text-gray-400 uppercase bg-slate-50/70">
                  <th className="py-3.5 px-4 rounded-l-xl">Name / Staff ID</th>
                  <th className="py-3.5 px-4">Role / Category</th>
                  <th className="py-3.5 px-4">TSC / ID No.</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredStaff.map((staff) => {
                  const name = staff.name || staff.fullName || 'Unnamed Staff';
                  const roleTitle = staff.role || staff.position || 'Staff';
                  const categoryName = staff.category || staff.type || 'General';
                  const isTeach = categoryName.toLowerCase().includes('teach');

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 font-semibold text-gray-900">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${isTeach ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{name}</div>
                            <div className="text-xs text-slate-400 font-mono">ID: {staff.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-800">{roleTitle}</div>
                        <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${isTeach ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                          {categoryName}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-slate-600">
                        {staff.tscNumber || staff.idNumber || '—'}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-600">
                        <div>{staff.phone || '—'}</div>
                        <div className="text-slate-400">{staff.email || '—'}</div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[11px]">
                          Active
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenEditModal(staff)} className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(staff.id)} className="h-8 w-8 p-0 text-slate-500 hover:text-rose-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Role / Position</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Mathematics Teacher"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Teaching">Teaching</option>
                    <option value="Non-Teaching">Non-Teaching</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">TSC No. / ID No.</label>
                  <input
                    type="text"
                    placeholder="e.g. TSC-123456"
                    value={tscNumber}
                    onChange={(e) => setTscNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 0712345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. staff@munyaka.ac.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold px-5 shadow-lg shadow-indigo-600/20">
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Save Staff Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
