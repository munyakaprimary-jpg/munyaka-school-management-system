import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  UserPlus, 
  FileSpreadsheet, 
  Download, 
  Trash2, 
  ShieldAlert, 
  Filter, 
  UserCheck, 
  GraduationCap, 
  BookOpen, 
  Award,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  MoreVertical,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import AddLearnerModal from '@/components/learners/AddLearnerModal';
import { AdminPinModal } from '@/components/learners/AdminPinModal';
import { formatLearnerDoc, LEARNER_ID_PREFIX } from '@/services/learnerService';
import { purgeLearnerPermanently, toRawLearnerId } from '@/services/purgeLearnerService';
import { addPendingSyncItem } from '@/services/syncQueueService';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const AVAILABLE_GRADES = [
  'Playgroup', 'PP1', 'PP2', 
  'Grade 1', 'Grade 2', 'Grade 3', 
  'Grade 4', 'Grade 5', 'Grade 6', 
  'Grade 7', 'Grade 8', 'Grade 9'
];

const AVAILABLE_STREAMS = ['East', 'West', 'North', 'South', 'Red', 'Blue', 'Green', 'Gold'];

export default function LearnersDirectory() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [learnersList, setLearnersList] = useState<any[]>(() => {
    try {
      const keysToTry = ['munyaka_learners', 'munyaka_students', 'learners', 'students', 'munyaka_learners_backup'];
      for (const key of keysToTry) {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`Loaded ${parsed.length} records from storage key: ${key}`);
            return parsed;
          }
        }
      }
    } catch (e) {
      console.error('Error loading learners/students:', e);
    }
    return [];
  });

  const [learners, setLearners] = useState<any[]>([]);
  const [filteredLearners, setFilteredLearners] = useState<any[]>([]);
  const [displayedLearners, setDisplayedLearners] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [streamFilter, setStreamFilter] = useState('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const isDeletedRecord = (item: any, deletedIds: Set<string>) => {
    if (!item) return true;
    const rawId = toRawLearnerId(item.id || item._id || item.learnerId);
    const adm = String(item.admissionNo || item.admissionNumber || item.admNo || '').trim();
    if (rawId && deletedIds.has(rawId)) return true;
    if (adm && deletedIds.has(adm)) return true;
    if (item.isDeleted || item.deleted) return true;
    return false;
  };

  useEffect(() => {
    const loadLearners = () => {
      try {
        const deletedIds = new Set<string>(JSON.parse(localStorage.getItem('deleted_learner_ids') || '[]'));
        
        let parsed: any[] = [];
        const keysToTry = ['munyaka_learners', 'munyaka_students', 'learners', 'students', 'munyaka_learners_backup'];
        for (const key of keysToTry) {
          const data = localStorage.getItem(key);
          if (data) {
            const temp = JSON.parse(data);
            if (Array.isArray(temp) && temp.length > 0) {
              parsed = temp;
              break;
            }
          }
        }

        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((item: any) => !isDeletedRecord(item, deletedIds));
          const formatted = filtered.map(formatLearnerDoc);
          setLearnersList(formatted);
          setLearners(formatted);
          setFilteredLearners(formatted);
          setDisplayedLearners(formatted);
          return;
        }
      } catch (e) {
        console.error('Error loading learners:', e);
      }
      setLearnersList([]);
      setLearners([]);
      setFilteredLearners([]);
      setDisplayedLearners([]);
    };

    loadLearners();

    window.addEventListener('learners-updated', loadLearners);
    window.addEventListener('students-updated', loadLearners);
    window.addEventListener('learners_updated', loadLearners);
    window.addEventListener('storage', loadLearners);
    window.addEventListener('sync-queue-updated', loadLearners);
    window.addEventListener('munyaka:data-changed', loadLearners);

    let unsubscribe: (() => void) | undefined;
    if (db) {
      try {
        unsubscribe = onSnapshot(collection(db, "learners"), (snapshot) => {
          loadLearners();
        }, (error) => {
          console.warn("[Firestore Listener] Offline or sync error:", error);
        });
      } catch (e) {
        console.warn("[Firestore Listener] Init error:", e);
      }
    }

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('learners-updated', loadLearners);
      window.removeEventListener('students-updated', loadLearners);
      window.removeEventListener('learners_updated', loadLearners);
      window.removeEventListener('storage', loadLearners);
      window.removeEventListener('sync-queue-updated', loadLearners);
      window.removeEventListener('munyaka:data-changed', loadLearners);
    };
  }, []);

  useEffect(() => {
    const searchClean = (searchTerm || '').toString().toLowerCase().replace(/\s+/g, '').trim();
    const next = (learnersList || []).filter(learner => {
      if (!learner) return false;
      const name = (learner.fullName || learner.name || learner.studentName || `${learner.firstName || ''} ${learner.lastName || ''}` || '').toString().toLowerCase();
      const adm = (learner.admissionNumber || learner.admissionNo || learner.admNo || learner.id || '').toString().toLowerCase();
      const identifier = (learner.identifierValue || learner.assessmentNo || learner.birthCertNo || '').toString().toLowerCase();
      const grade = (learner.gradeLevel || learner.grade || '').toString().toLowerCase();
      const stream = (learner.stream || '').toString().toLowerCase();

      const nameMatch = !searchClean || name.includes(searchClean) || adm.includes(searchClean) || identifier.includes(searchClean);
      const gradeMatch = gradeFilter === 'all' || grade.includes((gradeFilter || '').toString().toLowerCase());
      const streamMatch = streamFilter === 'all' || stream === (streamFilter || '').toString().toLowerCase();

      return nameMatch && gradeMatch && streamMatch;
    });
    setFilteredLearners(next);
    setDisplayedLearners(next);
  }, [learnersList, searchTerm, gradeFilter, streamFilter]);

  const handleLearnerAdded = (newLearner: any) => {
    const formatted = formatLearnerDoc(newLearner);
    setLearnersList(prev => [formatted, ...prev]);
    setLearners(prev => [formatted, ...prev]);
    setFilteredLearners(prev => [formatted, ...prev]);
    setDisplayedLearners(prev => [formatted, ...prev]);
    const addedGrade = newLearner.gradeLevel || newLearner.grade || 'all';
    setGradeFilter(addedGrade);
  };

  const handleDeleteLearner = async (learnerToDelete: any) => {
    if (!learnerToDelete) return;

    const sourceId = learnerToDelete.id || learnerToDelete._id || learnerToDelete.learnerId || '';
    const targetRawId = toRawLearnerId(sourceId);
    const targetPrefixedId = targetRawId ? LEARNER_ID_PREFIX + targetRawId : '';
    const targetAdm = String(learnerToDelete.admissionNo || learnerToDelete.admissionNumber || learnerToDelete.admNo || '').trim();

    if (typeof purgeLearnerPermanently === 'function') {
      await purgeLearnerPermanently({
        ...learnerToDelete,
        id: targetRawId || String(sourceId).trim(),
        _id: targetRawId || String(sourceId).trim(),
        prefixedId: targetPrefixedId,
        admissionNo: targetAdm,
      });
    }

    const isNotTarget = (item: any) => {
      const itemSourceId = item.id || item._id || item.learnerId || '';
      const itemRawId = toRawLearnerId(itemSourceId);
      const itemAdm = String(item.admissionNo || item.admissionNumber || item.admNo || '').trim();

      const matches =
        (targetRawId && itemRawId === targetRawId) ||
        (targetPrefixedId && String(itemSourceId).trim() === targetPrefixedId) ||
        (targetAdm && itemAdm === targetAdm);

      return !matches;
    };

    setLearnersList((prev: any[]) => prev.filter(isNotTarget));
    setLearners((prev: any[]) => prev.filter(isNotTarget));
    setFilteredLearners((prev: any[]) => prev.filter(isNotTarget));
    setDisplayedLearners((prev: any[]) => prev.filter(isNotTarget));

    addPendingSyncItem({
      id: sourceId,
      type: 'learner',
      action: 'delete',
      payload: learnerToDelete,
    });
  };

  const requestDelete = (learner: any) => {
    setPendingDelete(learner);
    setIsAuthOpen(true);
  };

  const handleVerifyAuth = async () => {
    setIsVerifying(true);
    await new Promise(r => setTimeout(r, 200));

    if (pendingDelete) {
      await handleDeleteLearner(pendingDelete);
      toast({
        title: "Success",
        description: "Learner deleted successfully.",
      });
    }
    setIsAuthOpen(false);
    setPendingDelete(null);
    setIsVerifying(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" /> Student Management System
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Learners Directory</h1>
          <p className="text-sm text-slate-500 font-medium">Manage student profiles, admission numbers, and grade allocations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 px-5 py-6"
          >
            <UserPlus className="w-5 h-5 mr-2" /> Register New Learner
          </Button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, adm no, or assessment no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 rounded-2xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 font-medium h-12"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-2xl border-slate-200 h-12 font-medium">
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
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Enrolled Students</h2>
            <p className="text-xs text-slate-500 font-medium">Showing {displayedLearners.length} active records</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-4 px-6">Admission No</th>
                <th className="py-4 px-6">Student Full Name</th>
                <th className="py-4 px-6">Grade & Stream</th>
                <th className="py-4 px-6">Assessment No</th>
                <th className="py-4 px-6">Parent / Guardian</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedLearners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    No learners found matching your search criteria.
                  </td>
                </tr>
              ) : (
                displayedLearners.map((learner, idx) => (
                  <tr key={learner.id || learner.admissionNo || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-xs text-indigo-600">
                      {learner.admissionNo || learner.admissionNumber || learner.admNo || '—'}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {learner.fullName || learner.name || learner.studentName || '—'}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                        {learner.gradeAndStream || `${learner.gradeLevel || learner.grade || ''} (${learner.stream || ''})`.trim() || '—'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-600">
                      {learner.assessmentNo || learner.assessmentNumber || learner.identifierValue || '—'}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-700 font-medium">
                      {learner.parentGuardian || learner.parentName || learner.guardian || '—'}
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
