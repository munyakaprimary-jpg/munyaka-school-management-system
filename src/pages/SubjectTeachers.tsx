import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckSquare, Square, Search, BookOpen } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import { showSuccess, showError } from '@/utils/toast';
import { getStaffMaster, updateStaffMaster, type MasterStaffRecord } from '@/services/staffMasterService';

const PRIMARY_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Kiswahili Language',
  'Integrated Science',
  'Social Studies',
  'Creative Arts & Sports',
  'Religious Education (CRE/IRE/HRE)',
  'Pre-Technical Studies',
  'Agriculture & Nutrition',
  'Computer Science / ICT'
];

export default function SubjectTeachersPage() {
  const [staffList, setStaffList] = useState<MasterStaffRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<MasterStaffRecord | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>([]);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = () => {
    const list = getStaffMaster();
    setStaffList(list);
  };

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm)
  );

  const handleOpenAssign = (staff: MasterStaffRecord) => {
    setSelectedStaff(staff);
    setAssignedSubjects(staff.assignedSubjects || []);
    setIsAssignModalOpen(true);
  };

  const handleToggleSubject = (subject: string) => {
    if (assignedSubjects.includes(subject)) {
      setAssignedSubjects(assignedSubjects.filter(s => s !== subject));
    } else {
      setAssignedSubjects([...assignedSubjects, subject]);
    }
  };

  const handleSaveSubjects = () => {
    if (!selectedStaff) return;
    try {
      updateStaffMaster(selectedStaff.id, {
        assignedSubjects
      });
      showSuccess(`Successfully assigned ${assignedSubjects.length} subjects to ${selectedStaff.name}!`);
      setIsAssignModalOpen(false);
      loadStaff();
    } catch (err) {
      showError('Failed to save subject assignments.');
    }
  };

  const handleDeleteStaff = (id: string) => {
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      try {
        const raw = localStorage.getItem('munyaka_staff_master_v1') || localStorage.getItem('staff') || '[]';
        const parsed = JSON.parse(raw);
        const filtered = parsed.filter((s: any) => s.id !== id);
        localStorage.setItem('munyaka_staff_master_v1', JSON.stringify(filtered));
        localStorage.setItem('staff', JSON.stringify(filtered));
        showSuccess('Staff member removed successfully.');
        loadStaff();
      } catch (err) {
        showError('Failed to delete staff member.');
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <BackButton />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            Subject Teachers & Subject Assignment Hub
          </h1>
          <p className="text-sm text-slate-500">Manage teaching staff rosters, subject allocations, and role-based teacher portal filtering.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold px-3 py-1.5 text-xs">
            {staffList.length} Total Staff Members
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border shadow-sm rounded-2xl bg-white">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by name, role, or phone..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-slate-50 border-none font-medium text-xs sm:text-sm"
            />
          </div>
          <div className="text-xs text-slate-400 font-semibold">
            Teachers only see assigned subjects across grading, lesson plans, and grade books.
          </div>
        </CardContent>
      </Card>

      {/* Staff & Subject Assignment Table with Optimized Padding & Typography */}
      <Card className="border shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b py-3.5 px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg font-bold">Staff Directory & Subject Allocations</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-100/70 text-slate-600 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3 sm:px-4">Name & Details</th>
                <th className="py-2.5 px-3 sm:px-4">Phone</th>
                <th className="py-2.5 px-3 sm:px-4 text-center">Active Status</th>
                <th className="py-2.5 px-3 sm:px-4 text-center">Created Date</th>
                <th className="py-2.5 px-3 sm:px-4 text-center">Subjects Count</th>
                <th className="py-2.5 px-3 sm:px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                    No staff records found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2 px-3 sm:px-4">
                      <div className="font-bold text-slate-900 text-xs">{staff.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {staff.role} {staff.tscNumber ? `• TSC: ${staff.tscNumber}` : ''}
                      </div>
                    </td>
                    <td className="py-2 px-3 sm:px-4 font-mono text-slate-600 text-[11px]">
                      {staff.phone || 'N/A'}
                    </td>
                    <td className="py-2 px-3 sm:px-4 text-center">
                      <Badge className={staff.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border-none font-bold text-[10px] px-2 py-0.5' : 'bg-amber-100 text-amber-800 border-none font-bold text-[10px] px-2 py-0.5'}>
                        {staff.status || 'Active'}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 sm:px-4 text-center text-slate-500 text-[11px] font-medium">
                      {staff.joinedDate || new Date().toISOString().split('T')[0]}
                    </td>
                    <td className="py-2 px-3 sm:px-4 text-center">
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-black text-[10px] px-2 py-0.5">
                        {(staff.assignedSubjects || []).length} Subjects
                      </Badge>
                    </td>
                    <td className="py-2 px-3 sm:px-4 text-right space-x-1.5 whitespace-nowrap">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleOpenAssign(staff)}
                        className="rounded-lg h-7 px-2.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-bold text-xs"
                      >
                        Assign Subjects
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDeleteStaff(staff.id)}
                        className="rounded-lg h-7 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold text-xs"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Assign Subjects Modal */}
      {isAssignModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border animate-in fade-in zoom-in-95 duration-200 space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">Assign Subjects to {selectedStaff.name}</h2>
              <p className="text-xs text-slate-500 mt-1">Select the subjects this teacher is authorized to teach and grade.</p>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
              {PRIMARY_SUBJECTS.map((subj) => {
                const isChecked = assignedSubjects.includes(subj);
                return (
                  <div 
                    key={subj} 
                    onClick={() => handleToggleSubject(subj)}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${isChecked ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900 font-bold' : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-100'}`}
                  >
                    <span className="text-sm">{subj}</span>
                    <div className="w-5 h-5 flex items-center justify-center rounded-lg">
                      {isChecked ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5 text-slate-300" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setIsAssignModalOpen(false)}
                className="rounded-xl h-11 px-6 font-bold"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveSubjects}
                className="rounded-xl h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100"
              >
                Save Subject Assignments
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
