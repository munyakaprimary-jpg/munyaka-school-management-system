import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit, 
  Search, 
  Shield, 
  GraduationCap, 
  Briefcase, 
  CheckCircle2,
  X,
  Plus
} from 'lucide-react';
import { CentralDataService } from '@/services/centralDataService';
import { calculateStaffMetrics } from '@/utils/staffMetrics';
import { toast } from 'sonner';

export default function StaffRegistry() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    role: 'Subject Teacher',
    tscNo: '',
    accessCode: '',
    assignedClass: 'Grade 7',
    email: ''
  });

  const loadStaff = () => {
    try {
      const list = CentralDataService.getStaff();
      setStaffList(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("Failed to load staff list:", e);
      setStaffList([]);
    }
  };

  useEffect(() => {
    loadStaff();

    const handleDataChanged = () => {
      loadStaff();
    };

    window.addEventListener('munyaka_data_changed', handleDataChanged);
    window.addEventListener('munyaka:data-changed', handleDataChanged);

    return () => {
      window.removeEventListener('munyaka_data_changed', handleDataChanged);
      window.removeEventListener('munyaka:data-changed', handleDataChanged);
    };
  }, []);

  const handleDeleteStaff = (id: string | number) => {
    if (confirm("Are you sure you want to permanently delete this staff member?")) {
      try {
        const currentStaff = CentralDataService.getStaff();
        const filtered = currentStaff.filter(s => 
          String(s.id) !== String(id) && 
          String(s.tscNo) !== String(id) && 
          String(s.accessCode) !== String(id)
        );
        CentralDataService.saveStaff(filtered);
        setStaffList(filtered);
        toast.success("Staff member successfully deleted.");
      } catch (e) {
        console.error("Error deleting staff:", e);
        toast.error("Failed to delete staff member.");
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      role: 'Subject Teacher',
      tscNo: '',
      accessCode: '',
      assignedClass: 'Grade 7',
      email: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: any) => {
    setEditingStaff(member);
    setFormData({
      name: member.name || '',
      role: member.role || 'Subject Teacher',
      tscNo: member.tscNo || '',
      accessCode: member.accessCode || '',
      assignedClass: member.assignedClass || (isNonTeachingRole(member.role) ? 'Unassigned' : 'Grade 7'),
      email: member.email || ''
    });
    setIsModalOpen(true);
  };

  const isNonTeachingRole = (role: string) => {
    const r = String(role || '').toLowerCase();
    return r.includes('bursar') || r.includes('store') || r.includes('support') || r.includes('secretary') || r.includes('cook');
  };

  const handleRoleChange = (newRole: string) => {
    const nonTeaching = isNonTeachingRole(newRole);
    setFormData(prev => ({
      ...prev,
      role: newRole,
      assignedClass: nonTeaching ? 'Unassigned' : (prev.assignedClass === 'Unassigned' ? 'Grade 7' : prev.assignedClass)
    }));
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter staff name.");
      return;
    }

    try {
      const currentStaff = CentralDataService.getStaff();
      const nonTeaching = isNonTeachingRole(formData.role);
      const assignedClassFinal = nonTeaching ? 'Unassigned' : (formData.assignedClass || 'Grade 7');
      const assignedClassesArray = [assignedClassFinal];

      let updatedList = [];
      if (editingStaff) {
        updatedList = currentStaff.map(s => {
          if (String(s.id) === String(editingStaff.id) || String(s.tscNo) === String(editingStaff.tscNo)) {
            return {
              ...s,
              ...formData,
              assignedClass: assignedClassFinal,
              assignedClasses: assignedClassesArray
            };
          }
          return s;
        });
      } else {
        const newMember = {
          id: 'staff_' + Date.now(),
          ...formData,
          assignedClass: assignedClassFinal,
          assignedClasses: assignedClassesArray
        };
        updatedList = [...currentStaff, newMember];
      }

      CentralDataService.saveStaff(updatedList);
      setStaffList(updatedList);
      setIsModalOpen(false);
      toast.success(editingStaff ? "Staff member updated successfully." : "New staff member added successfully.");
    } catch (err) {
      console.error("Error saving staff:", err);
      toast.error("Failed to save staff member.");
    }
  };

  const metrics = calculateStaffMetrics(staffList);

  const filteredStaff = staffList.filter(s => 
    String(s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(s.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(s.tscNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(s.assignedClass || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" /> Staff Registry & Role Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage school teaching and non-teaching personnel synced directly with <span className="font-mono text-indigo-600">munyaka_central_db</span>.
          </p>
        </div>
        <Button
          onClick={handleOpenAddModal}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> Add New Staff
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase text-slate-500">Total Staff</CardTitle>
            <Users className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{metrics.total}</div>
            <p className="text-xs text-slate-500 mt-1">Active personnel</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase text-slate-500">Teaching Staff</CardTitle>
            <GraduationCap className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{metrics.teachingCount}</div>
            <p className="text-xs text-slate-500 mt-1">Teachers & HOI/DHOI</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase text-slate-500">Non-Teaching Staff</CardTitle>
            <Briefcase className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{metrics.nonTeachingCount}</div>
            <p className="text-xs text-slate-500 mt-1">Support & administration</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & List */}
      <Card className="border shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold">Staff Directory ({filteredStaff.length})</CardTitle>
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              placeholder="Search staff by name, role, TSC..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b bg-slate-50/80 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-6">Staff Member</th>
                  <th className="py-3 px-6">Role / Designation</th>
                  <th className="py-3 px-6">TSC Number</th>
                  <th className="py-3 px-6">Access Code</th>
                  <th className="py-3 px-6">Assigned Class</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No staff members found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map(member => {
                    const nonTeaching = isNonTeachingRole(member.role);
                    return (
                      <tr key={member.id || member.tscNo} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6 font-medium text-slate-900">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                              {(member.name || 'S').charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{member.name}</div>
                              <div className="text-xs text-slate-500">{member.email || 'No email provided'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant="outline" className={`rounded-lg px-2.5 py-1 text-xs font-medium ${nonTeaching ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                            {member.role || 'Staff'}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-600 text-xs">{member.tscNo || 'N/A'}</td>
                        <td className="py-4 px-6 font-mono text-slate-600 text-xs">{member.accessCode || 'N/A'}</td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-slate-800 text-xs bg-slate-100 px-2.5 py-1 rounded-lg">
                            {member.assignedClass || (nonTeaching ? 'Unassigned' : 'Grade 7')}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(member)}
                            className="h-8 w-8 p-0 rounded-lg text-slate-600 hover:text-indigo-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStaff(member.id || member.tscNo)}
                            className="h-8 w-8 p-0 rounded-lg text-slate-600 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900">
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 p-0 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSaveStaff} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Full Name</label>
                <Input
                  placeholder="e.g. Jane Doe"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Role / Designation</label>
                <select
                  value={formData.role}
                  onChange={e => handleRoleChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <optgroup label="Teaching & Academic Leadership">
                    <option value="Head Teacher (HOI)">Head Teacher (HOI)</option>
                    <option value="Deputy Head Teacher (DHOI)">Deputy Head Teacher (DHOI)</option>
                    <option value="Class Teacher">Class Teacher</option>
                    <option value="Subject Teacher">Subject Teacher</option>
                    <option value="ICT Teacher">ICT Teacher</option>
                    <option value="Lab Teacher">Lab Teacher</option>
                  </optgroup>
                  <optgroup label="Non-Teaching & Support">
                    <option value="School Bursar">School Bursar</option>
                    <option value="Store Keeper">Store Keeper</option>
                    <option value="Support Staff">Support Staff</option>
                    <option value="Secretary">Secretary</option>
                    <option value="Cook">Cook</option>
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">TSC Number</label>
                  <Input
                    placeholder="e.g. TSC12345"
                    value={formData.tscNo}
                    onChange={e => setFormData({...formData, tscNo: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Access Code</label>
                  <Input
                    placeholder="e.g. TEACH001"
                    value={formData.accessCode}
                    onChange={e => setFormData({...formData, accessCode: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Assigned Class / Stream</label>
                {isNonTeachingRole(formData.role) ? (
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500">
                    Unassigned (Non-Teaching Role)
                  </div>
                ) : (
                  <select
                    value={formData.assignedClass}
                    onChange={e => setFormData({...formData, assignedClass: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Administration">Administration</option>
                  </select>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  {isNonTeachingRole(formData.role) 
                    ? 'Class assignment is automatically set to Unassigned for non-teaching roles.' 
                    : 'Saved directly to both assignedClass and assignedClasses.'}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Email Address</label>
                <Input
                  type="email"
                  placeholder="e.g. staff@munyaka.ac.ke"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {editingStaff ? 'Save Changes' : 'Add Staff Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
