import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  UserPlus, 
  Trash2, 
  GraduationCap, 
  Filter,
  Users,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import AddLearnerModal from '@/components/learners/AddLearnerModal';
import AdminPinModal from '@/components/learners/AdminPinModal';
import { STORAGE_KEYS } from '@/utils/storageKeys';
import { CentralDataService } from '@/services/centralDataService';
import { formatLearnerDoc } from '@/services/learnerService';
import { downloadCSV, generateCSVHeader } from '@/utils/downloadHelper';

const AVAILABLE_GRADES = [
  'Playgroup', 'PP1', 'PP2', 
  'Grade 1', 'Grade 2', 'Grade 3', 
  'Grade 4', 'Grade 5', 'Grade 6', 
  'Grade 7', 'Grade 8', 'Grade 9', 'Junior Secondary'
];

const AVAILABLE_STREAMS = ['East', 'West', 'North', 'South', 'Red', 'Blue', 'Green', 'Gold'];

export default function LearnersDirectory() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [learners, setLearners] = useState<any[]>(() => {
    try {
      const loaded = CentralDataService.getLearners() || [];
      if (Array.isArray(loaded) && loaded.length > 0) {
        return loaded.map(formatLearnerDoc);
      }
    } catch (e) {
      console.error('Error loading learners from storage:', e);
    }
    return [];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [streamFilter, setStreamFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any>(null);

  // Live Sync Effect
  useEffect(() => {
    const reloadData = () => {
      try {
        const loaded = CentralDataService.getLearners() || [];
        setLearners(loaded.map(formatLearnerDoc));
      } catch (e) {
        console.error('Error reloading learners:', e);
      }
    };

    window.addEventListener('learners-updated', reloadData);
    window.addEventListener('students-updated', reloadData);
    window.addEventListener('munyaka:data-changed', reloadData);
    window.addEventListener('storage', reloadData);

    return () => {
      window.removeEventListener('learners-updated', reloadData);
      window.removeEventListener('students-updated', reloadData);
      window.removeEventListener('munyaka:data-changed', reloadData);
      window.removeEventListener('storage', reloadData);
    };
  }, []);

  // Filtered & Searched Learners
  const filteredLearners = useMemo(() => {
    const searchClean = (searchTerm || '').toString().toLowerCase().trim();
    return (learners || []).filter(learner => {
      if (!learner) return false;
      const name = (learner.fullName || learner.name || learner.studentName || '').toString().toLowerCase();
      const adm = (learner.admissionNo || learner.admissionNumber || learner.admNo || learner.id || '').toString().toLowerCase();
      const identifier = (learner.idValue || learner.assessmentNo || learner.assessmentNumber || learner.birthCertNo || learner.birthCertificateNo || '').toString().toLowerCase();
      const grade = (learner.gradeLevel || learner.grade || learner.class || '').toString().toLowerCase();
      const stream = (learner.stream || learner.stream_name || '').toString().toLowerCase();
      const gender = (learner.gender || learner.sex || '').toString().toLowerCase();

      const nameMatch = !searchClean || name.includes(searchClean) || adm.includes(searchClean) || identifier.includes(searchClean);
      const gradeMatch = gradeFilter === 'all' || grade.includes((gradeFilter || '').toString().toLowerCase());
      const streamMatch = streamFilter === 'all' || stream.includes((streamFilter || '').toString().toLowerCase());
      const genderMatch = genderFilter === 'all' || gender.includes((genderFilter || '').toString().toLowerCase());

      return nameMatch && gradeMatch && streamMatch && genderMatch;
    });
  }, [learners, searchTerm, gradeFilter, streamFilter, genderFilter]);

  const handleLearnerAdded = (newLearner: any) => {
    const formatted = formatLearnerDoc(newLearner);
    setLearners(prev => {
      const updated = [formatted, ...prev];
      CentralDataService.saveLearners(updated);
      return updated;
    });
    toast({
      title: "Learner Added",
      description: `${formatted.fullName || 'Learner'} was successfully registered.`,
    });
  };

  const handleDeleteLearner = (learnerToDelete: any) => {
    if (!learnerToDelete) return;
    const targetId = learnerToDelete.id || learnerToDelete.admissionNo || learnerToDelete.admissionNumber;

    setLearners(prev => {
      const updated = prev.filter(l => (l.id !== targetId && l.admissionNo !== targetId && l.admissionNumber !== targetId));
      CentralDataService.saveLearners(updated);
      window.dispatchEvent(new CustomEvent('learners-updated', { detail: updated }));
      window.dispatchEvent(new Event('storage'));
      return updated;
    });

    toast({
      title: "Learner Removed",
      description: "Learner record deleted successfully.",
    });
  };

  const requestDelete = (learner: any) => {
    setPendingDelete(learner);
    setIsAuthOpen(true);
  };

  const handleVerifyAuth = () => {
    if (pendingDelete) {
      handleDeleteLearner(pendingDelete);
    }
    setIsAuthOpen(false);
    setPendingDelete(null);
  };

  const handleExportCSV = () => {
    try {
      const headers = ["Admission No", "Assessment No / Birth Cert No", "Full Name", "Grade & Stream", "Gender", "Date of Birth", "Parent / Guardian", "Phone Number"];
      const rows = filteredLearners.map(s => [
        s.admissionNo || s.admissionNumber || '',
        s.idValue || s.assessmentNo || s.assessmentNumber || s.birthCertNo || s.birthCertificateNo || '',
        s.fullName || s.name || '',
        s.gradeAndStream || `${s.gradeLevel || s.grade || ''} (${s.stream || ''})`,
        s.gender || s.sex || '',
        s.dateOfBirth || s.dob || '',
        s.parentName || s.parentGuardian || '',
        s.phoneNumber || s.phone || ''
      ]);
      const csvContent = generateCSVHeader(headers) + rows.map(e => e.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(",")).join("\n");
      downloadCSV(csvContent, `Learners_Directory_${Date.now()}.csv`);
      toast({ title: "Export Successful", description: "Learners list downloaded as CSV." });
    } catch (e) {
      toast({ title: "Export Failed", description: "Could not download CSV export.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" /> Student Management System
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Learners Directory</h1>
          <p className="text-sm text-slate-500 font-medium">Manage student profiles, assessment/birth certificate identifiers, and grade allocations.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="rounded-2xl border-slate-200 text-slate-700 font-bold hover:bg-slate-50 px-4 py-6"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" /> Export CSV
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 px-5 py-6"
          >
            <UserPlus className="w-5 h-5 mr-2" /> Register New Learner
          </Button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, adm no, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 rounded-2xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 font-medium h-12"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-full sm:w-[170px] rounded-2xl border-slate-200 h-12 font-medium">
              <SelectValue placeholder="Filter Grade" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Grades</SelectItem>
              {AVAILABLE_GRADES.map(grade => (
                <SelectItem key={grade} value={grade}>{grade}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={streamFilter} onValueChange={setStreamFilter}>
            <SelectTrigger className="w-full sm:w-[150px] rounded-2xl border-slate-200 h-12 font-medium">
              <SelectValue placeholder="Filter Stream" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Streams</SelectItem>
              {AVAILABLE_STREAMS.map(stream => (
                <SelectItem key={stream} value={stream}>{stream}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-full sm:w-[150px] rounded-2xl border-slate-200 h-12 font-medium">
              <SelectValue placeholder="Filter Gender" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Enrolled Students</h2>
            <span className="ml-2 px-3 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
              {filteredLearners.length} active
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-4 px-6">Admission No</th>
                <th className="py-4 px-6">Assessment No / Birth Certificate No</th>
                <th className="py-4 px-6">Student Full Name</th>
                <th className="py-4 px-6">Grade & Stream</th>
                <th className="py-4 px-6">Gender</th>
                <th className="py-4 px-6">Parent / Guardian</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLearners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-slate-400 font-medium">
                    No learners registered yet. Click "Register New Learner" above to add students.
                  </td>
                </tr>
              ) : (
                filteredLearners.map((learner, idx) => (
                  <tr key={learner.id || learner.admissionNo || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-xs text-indigo-600">
                      {learner.admissionNo || learner.admissionNumber || learner.admNo || '—'}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-700 font-semibold">
                      {learner.idValue || learner.birthCertificateNo || learner.birthCertNo || learner.assessmentNo || learner.assessmentNumber || '—'}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {learner.fullName || learner.name || learner.studentName || '—'}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                        {learner.gradeAndStream || `${learner.gradeLevel || learner.grade || ''} (${learner.stream || ''})`.trim() || '—'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs font-medium text-slate-600">
                      {learner.gender || learner.sex || '—'}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-700 font-medium">
                      {learner.parentName || learner.parentGuardian || learner.guardian || '—'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => requestDelete(learner)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Learner Modal */}
      <AddLearnerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLearnerAdded={handleLearnerAdded}
      />

      {/* Admin PIN Verification Modal for Deletion */}
      <AdminPinModal
        open={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleVerifyAuth}
        title="Admin Authorization Required"
        description="Enter admin PIN to confirm deletion of this learner record."
      />
    </div>
  );
}
