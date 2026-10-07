import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, BookOpen, Plus, Trash2 } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import { showSuccess, showError } from '@/utils/toast';
import { getStaffMaster, updateStaffMaster, type MasterStaffRecord } from '@/services/staffMasterService';

const LEVEL_SUBJECTS_MAP: Record<string, string[]> = {
  'Pre-Primary': [
    'Language Activities',
    'Mathematical Activities',
    'Environmental Activities',
    'Psychomotor & Creative Activities',
    'Religious Education (CRE/IRE/HRE)'
  ],
  'Lower Primary': [
    'Mathematics',
    'English Language',
    'Kiswahili Language',
    'Environmental Activities',
    'Religious Education (CRE/IRE/HRE)',
    'Creative Arts & Sports'
  ],
  'Upper Primary': [
    'Mathematics',
    'English Language',
    'Kiswahili Language',
    'Science and Technology',
    'Social Studies',
    'Agriculture and Nutrition',
    'Creative Arts & Sports',
    'Religious Education (CRE/IRE/HRE)'
  ],
  'Junior School': [
    'Mathematics',
    'English Language',
    'Kiswahili Language',
    'Integrated Science',
    'Health Education',
    'Social Studies',
    'Pre-Technical Studies',
    'Agriculture and Nutrition',
    'Creative Arts & Sports',
    'Religious Education (CRE/IRE/HRE)',
    'Computer Science / ICT'
  ]
};

const GRADES = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
const STREAMS = ['North', 'South', 'East', 'West', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Green', 'Blue', 'Red', 'Yellow'];

export interface AllocationItem {
  subject: string;
  grade: string;
  stream: string;
}

export default function SubjectTeachersPage() {
  const [staffList, setStaffList] = useState<MasterStaffRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<MasterStaffRecord | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);

  const [newGrade, setNewGrade] = useState('Grade 7');
  const [newStream, setNewStream] = useState('Mercury');
  const [newSubj, setNewSubj] = useState('');

  const getLevelForGrade = (grade: string): string => {
    const g = grade.toLowerCase();
    if (g.includes('pp1') || g.includes('pp2')) return 'Pre-Primary';
    if (g.includes('grade 1') || g.includes('grade 2') || g.includes('grade 3')) return 'Lower Primary';
    if (g.includes('grade 4') || g.includes('grade 5') || g.includes('grade 6')) return 'Upper Primary';
    return 'Junior School';
  };

  const availableSubjectsForGrade = LEVEL_SUBJECTS_MAP[getLevelForGrade(newGrade)] || LEVEL_SUBJECTS_MAP['Junior School'];

  useEffect(() => {
    const validSubs = LEVEL_SUBJECTS_MAP[getLevelForGrade(newGrade)] || [];
    if (!validSubs.includes(newSubj)) {
      setNewSubj(validSubs[0] || 'Mathematics');
    }
  }, [newGrade]);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = () => {
    const list = getStaffMaster();
    try {
      const raw = localStorage.getItem('munyaka_staff_master_v1') || localStorage.getItem('staff') || '[]';
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const merged = list.map(s => {
          const found = parsed.find((p: any) => p.id === s.id || p.staffId === s.staffId || p.phone === s.phone);
          if (found) {
            const listAllocations = found.allocations || found.detailedAssignments || found.subjectAllocations || found.assignedStreams || s.allocations || [];
            return { 
              ...s, 
              allocations: listAllocations,
              detailedAssignments: listAllocations,
              subjectAllocations: listAllocations,
              assignedStreams: listAllocations,
              assignedSubjects: found.assignedSubjects || s.assignedSubjects 
            };
          }
          return s;
        });
        setStaffList(merged);
        return;
      }
    } catch {}
    setStaffList(list);
  };

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm)
  );

  const handleOpenAssign = (staff: MasterStaffRecord) => {
    setSelectedStaff(staff);
    const existing = (staff as any).allocations || (staff as any).detailedAssignments || (staff as any).subjectAllocations || (staff as any).assignedStreams || staff.assignedSubjects || [];
    const normalized: AllocationItem[] = existing.map((item: any) => {
      if (typeof item === 'string') {
        return { subject: item, grade: staff.assignedGrade || 'Grade 7', stream: staff.assignedStream || 'Mercury' };
      }
      return {
        subject: item.subject || 'Mathematics',
        grade: item.grade || 'Grade 7',
        stream: item.stream || 'Mercury'
      };
    });
    setAllocations(normalized);
    setNewGrade('Grade 7');
    setNewSubj('Mathematics');
    setIsAssignModalOpen(true);
  };

  const handleAddAllocation = () => {
    const exists = allocations.some(d => d.subject === newSubj && d.grade === newGrade && d.stream === newStream);
    if (exists) {
      showError('This exact subject, grade, and stream combination is already assigned.');
      return;
    }
    setAllocations([
      ...allocations,
      { subject: newSubj, grade: newGrade, stream: newStream }
    ]);
    showSuccess('Added subject allocation.');
  };

  const handleRemoveAllocation = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const handleSaveAssignments = () => {
    if (!selectedStaff) return;
    try {
      const legacySubjects = Array.from(new Set(allocations.map(d => d.subject)));
      
      const updatePayload = {
        allocations,
        detailedAssignments: allocations,
        subjectAllocations: allocations,
        assignedStreams: allocations,
        assignedSubjects: legacySubjects,
        assignedGrade: allocations[0]?.grade || selectedStaff.assignedGrade || 'Grade 7',
        assignedStream: allocations[0]?.stream || selectedStaff.assignedStream || 'Mercury'
      };

      // 1. Update master store service
      updateStaffMaster(selectedStaff.id, updatePayload);

      // 2. Commit directly across localStorage keys
      try {
        const keys = ['munyaka_staff_master_v1', 'munyaka_staff_directory', 'munyaka_master_staff_list', 'munyaka_staff', 'staff_members', 'staff'];
        for (const k of keys) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const updated = parsed.map((s: any) => {
                if (s.id === selectedStaff.id || s.staffId === selectedStaff.staffId || s.phone === selectedStaff.phone) {
                  return { ...s, ...updatePayload };
                }
                return s;
              });
              localStorage.setItem(k, JSON.stringify(updated));
            }
          }
        }
      } catch (lsErr) {
        console.error('Direct localStorage persistence error:', lsErr);
      }

      // 3. Immediately update React state for instant UI re-render without page refresh
      const updatedStaffList = staffList.map(st => {
        if (st.id === selectedStaff.id || st.staffId === selectedStaff.staffId) {
          return { ...st, ...updatePayload };
        }
        return st;
      });
      setStaffList(updatedStaffList);

      showSuccess(`Successfully saved ${allocations.length} subject stream allocations for ${selectedStaff.name}!`);
      setIsAssignModalOpen(false);
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
          <p className="text-sm text-slate-500">Manage teaching staff rosters, level-filtered subject allocations, and role-based portal filtering.</p>
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
            Subjects are dynamically filtered based on the selected educational level (Pre-Primary, Lower/Upper Primary, Junior School).
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
                  const teacherAllocations: AllocationItem[] = (staff as any).allocations || (staff as any).detailedAssignments || (staff as any).subjectAllocations || (staff.assignedSubjects || []).map((s: string) => ({ subject: s, grade: staff.assignedGrade || 'Grade 7', stream: staff.assignedStream || 'Mercury' }));
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
                          {teacherAllocations.length === 0 ? (
                            <span className="text-slate-400 italic text-[11px]">No streams assigned</span>
                          ) : (
                            teacherAllocations.slice(0, 2).map((a, i) => (
                              <Badge key={i} variant="outline" className="bg-slate-50 text-slate-700 text-[10px] font-medium">
                                {a.subject} ({a.grade} - {a.stream})
                              </Badge>
                            ))
                          )}
                          {teacherAllocations.length > 2 && (
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                              +{teacherAllocations.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 sm:px-4 text-center">
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-black text-[10px] px-2 py-0.5">
                          {teacherAllocations.length} Allocations
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

      {/* Assign Subjects Modal with Level-Filtered Subject Selection */}
      {isAssignModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl border animate-in fade-in zoom-in-95 duration-200 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Assign Subjects, Grades & Streams</h2>
                <p className="text-xs text-slate-500 mt-1">Configure level-filtered subjects for <span className="font-bold text-indigo-600">{selectedStaff.name}</span>.</p>
              </div>
              <Badge className="bg-indigo-100 text-indigo-800 font-bold">
                {allocations.length} Assigned
              </Badge>
            </div>

            {/* Add new allocation builder */}
            <Card className="border bg-slate-50/50 rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Grade Level</label>
                    <span className="text-[10px] text-indigo-600 font-semibold">({getLevelForGrade(newGrade)})</span>
                  </div>
                  <Select value={newGrade} onValueChange={setNewGrade}>
                    <SelectTrigger className="h-10 rounded-xl bg-white text-xs font-semibold">
                      <SelectValue placeholder="Select Grade" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl max-h-60">
                      {GRADES.map(g => (
                        <SelectItem key={g} value={g}>{g} <span className="text-[10px] text-slate-400">({getLevelForGrade(g)})</span></SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Subject ({getLevelForGrade(newGrade)})</label>
                  <Select value={newSubj} onValueChange={setNewSubj}>
                    <SelectTrigger className="h-10 rounded-xl bg-white text-xs font-semibold">
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl max-h-60">
                      {availableSubjectsForGrade.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
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
                    <SelectContent className="rounded-2xl max-h-60">
                      {STREAMS.map(st => (
                        <SelectItem key={st} value={st}>{st}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button 
                  onClick={handleAddAllocation}
                  className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 shadow-sm"
                >
                  <Plus size={14} /> Add Allocation
                </Button>
              </div>
            </Card>

            {/* List of current assignments */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Current Assigned Allocations</h3>
              {allocations.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-dashed">
                  No subject stream allocations added yet. Use the builder above to add assignments.
                </div>
              ) : (
                allocations.map((item, idx) => (
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
                      onClick={() => handleRemoveAllocation(idx)}
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
