import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, Square, Search, BookOpen, Plus, Trash2, Layers } from 'lucide-react';
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

const GRADES = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
const STREAMS = ['North', 'South', 'East', 'West', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Green', 'Blue', 'Red', 'Yellow'];

export interface DetailedSubjectAssignment {
  subject: string;
  grade: string;
  stream: string;
}

export default function SubjectTeachersPage() {
  const [staffList, setStaffList] = useState<MasterStaffRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<MasterStaffRecord | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [detailedAssignments, setDetailedAssignments] = useState<DetailedSubjectAssignment[]>([]);

  // New row builder state
  const [newSubj, setNewSubj] = useState(PRIMARY_SUBJECTS[0]);
  const [newGrade, setNewGrade] = useState('Grade 7');
  const [newStream, setNewStream] = useState('Mercury');

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
    // Support migration from string array or object array
    const existing = staff.detailedAssignments || staff.assignedSubjects || [];
    const normalized: DetailedSubjectAssignment[] = existing.map((item: any) => {
      if (typeof item === 'string') {
        return { subject: item, grade: staff.assignedGrade || 'Grade 7', stream: staff.assignedStream || 'Mercury' };
      }
      return {
        subject: item.subject || PRIMARY_SUBJECTS[0],
        grade: item.grade || 'Grade 7',
        stream: item.stream || 'Mercury'
      };
    });
    setDetailedAssignments(normalized);
    setIsAssignModalOpen(true);
  };

  const handleAddAssignment = () => {
    // Check if duplicate
    const exists = detailedAssignments.some(d => d.subject === newSubj && d.grade === newGrade && d.stream === newStream);
    if (exists) {
      showError('This exact subject, grade, and stream combination is already assigned.');
      return;
    }
    setDetailedAssignments([
      ...detailedAssignments,
      { subject: newSubj, grade: newGrade, stream: newStream }
    ]);
    showSuccess('Added subject allocation.');
  };

  const handleRemoveAssignment = (index: number) => {
    setDetailedAssignments(detailedAssignments.filter((_, i) => i !== index));
  };

  const handleSaveAssignments = () => {
    if (!selectedStaff) return;
    try {
      // Also derive legacy assignedSubjects array for backwards compatibility
      const legacySubjects = Array.from(new Set(detailedAssignments.map(d => d.subject)));
      
      updateStaffMaster(selectedStaff.id, {
        detailedAssignments,
        assignedSubjects: legacySubjects,
        assignedGrade: detailedAssignments[0]?.grade || selectedStaff.assignedGrade,
        assignedStream: detailedAssignments[0]?.stream || selectedStaff.assignedStream
      });
      showSuccess(`Successfully saved ${detailedAssignments.length} subject stream allocations for ${selectedStaff.name}!`);
      setIsAssignModalOpen(false);
      loadStaff();
    } catch (err) {
      showError('Failed to save subject allocations.');
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
          <p className="text-sm text-slate-500">Manage teaching staff rosters, precise grade & stream subject allocations, and role-based portal filtering.</p>
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
            Teachers only see assigned subjects and streams across grading, lesson plans, and grade books.
          </div>
        </CardContent>
      </Card>

      {/* Staff & Subject Assignment Table */}
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
                <th className="py-2.5 px-3 sm:px-4 text-center">Assigned Grade & Streams</th>
                <th className="py-2.5 px-3 sm:px-4 text-center">Allocations</th>
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
                filteredStaff.map((staff) => {
                  const allocations: DetailedSubjectAssignment[] = staff.detailedAssignments || (staff.assignedSubjects || []).map((s: string) => ({ subject: s, grade: staff.assignedGrade || 'Grade 7', stream: staff.assignedStream || 'Mercury' }));
                  return (
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
                      <td className="py-2 px-3 sm:px-4 text-center">
                        <div className="flex flex-wrap gap-1 justify-center max-w-xs">
                          {allocations.length === 0 ? (
                            <span className="text-slate-400 italic text-[11px]">No streams assigned</span>
                          ) : (
                            allocations.slice(0, 2).map((a, i) => (
                              <Badge key={i} variant="outline" className="bg-slate-50 text-slate-700 text-[10px] font-medium">
                                {a.subject} ({a.grade} - {a.stream})
                              </Badge>
                            ))
                          )}
                          {allocations.length > 2 && (
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                              +{allocations.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 sm:px-4 text-center">
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-black text-[10px] px-2 py-0.5">
                          {allocations.length} Allocations
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
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Assign Subjects Modal with Grade & Stream Selectors */}
      {isAssignModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl border animate-in fade-in zoom-in-95 duration-200 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Assign Subjects, Grades & Streams</h2>
                <p className="text-xs text-slate-500 mt-1">Configure precise subject and class stream allocations for <span className="font-bold text-indigo-600">{selectedStaff.name}</span>.</p>
              </div>
              <Badge className="bg-indigo-100 text-indigo-800 font-bold">
                {detailedAssignments.length} Assigned
              </Badge>
            </div>

            {/* Add new allocation builder */}
            <Card className="border bg-slate-50/50 rounded-2xl p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Subject</label>
                  <Select value={newSubj} onValueChange={setNewSubj}>
                    <SelectTrigger className="h-10 rounded-xl bg-white text-xs font-semibold">
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {PRIMARY_SUBJECTS.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Grade</label>
                  <Select value={newGrade} onValueChange={setNewGrade}>
                    <SelectTrigger className="h-10 rounded-xl bg-white text-xs font-semibold">
                      <SelectValue placeholder="Select Grade" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {GRADES.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Stream</label>
                  <Select value={newStream} onValueChange={setNewStream}>
                    <SelectTrigger className="h-10 rounded-xl bg-white text-xs font-semibold">
                      <SelectValue placeholder="Select Stream" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {STREAMS.map(st => (
                        <SelectItem key={st} value={st}>{st}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <Button 
                  onClick={handleAddAssignment}
                  className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 shadow-sm"
                >
                  <Plus size={14} /> Add Allocation
                </Button>
              </div>
            </Card>

            {/* List of current assignments */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Current Assigned Allocations</h3>
              {detailedAssignments.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-dashed">
                  No subject stream allocations added yet. Use the builder above to add assignments.
                </div>
              ) : (
                detailedAssignments.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl border bg-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{item.subject}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Grade: <span className="font-bold text-indigo-600">{item.grade}</span> • Stream: <span className="font-bold text-indigo-600">{item.stream}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleRemoveAssignment(idx)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 w-8 p-0 rounded-xl"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                ))
              )}
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
                onClick={handleSaveAssignments}
                className="rounded-xl h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100"
              >
                Save Subject Allocations
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
