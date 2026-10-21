import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Download,
  ArrowRightLeft,
  Lock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { db } from '@/config/firebase';
import { collection, onSnapshot, addDoc, setDoc, doc } from 'firebase/firestore';
import { showSuccess, showError } from '@/utils/toast';
import { CentralDataService } from '@/services/centralDataService';
import { generateLearnerId, formatLearnerDoc, findExistingLearner } from '@/services/learnerService';
import { verifyDeleteAdminPassword } from '@/services/deletePasswordService';
import { purgeLearnerRecord } from '@/services/purgeLearnerService';
import AddLearnerModal from '@/components/students/AddLearnerModal';
import Modal from '@/components/ui/Modal';
import BackButton from '@/components/ui/BackButton';

interface StudentsDirectoryProps {
  isAdmin?: boolean;
  assignedTeacherGrade?: string;
  assignedTeacherStream?: string;
}

const normalizeGradeStr = (val: string) => {
  if (!val) return '';
  const lower = val.toLowerCase().trim();
  const match = lower.match(/(\d+)/);
  if (match) return match[1];
  if (lower.includes('one') || lower.includes('1')) return '1';
  if (lower.includes('two') || lower.includes('2')) return '2';
  if (lower.includes('three') || lower.includes('3')) return '3';
  if (lower.includes('four') || lower.includes('4')) return '4';
  if (lower.includes('five') || lower.includes('5')) return '5';
  if (lower.includes('six') || lower.includes('6')) return '6';
  if (lower.includes('seven') || lower.includes('7')) return '7';
  if (lower.includes('eight') || lower.includes('8')) return '8';
  if (lower.includes('nine') || lower.includes('9')) return '9';
  return lower;
};

export default function StudentsDirectory({
  isAdmin = true,
  assignedTeacherGrade = 'all',
  assignedTeacherStream = 'all'
}: StudentsDirectoryProps) {
  const navigate = useNavigate();
  const [learnersList, setLearnersList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [streamFilter, setStreamFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Direct Real-Time Listener in LearnersDirectory reacting to 'learners_updated'
  useEffect(() => {
    const refreshLearners = () => {
      const cached = localStorage.getItem('cached_learners');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLearnersList(parsed);
          }
        } catch {}
      } else {
        try {
          const central = CentralDataService.getLearners() || [];
          if (central.length > 0) {
            setLearnersList(central);
            localStorage.setItem('cached_learners', JSON.stringify(central));
          }
        } catch {}
      }
    };

    // Initial load
    refreshLearners();

    // Event listeners for immediate UI updates
    window.addEventListener('learners_updated', refreshLearners);
    window.addEventListener('learners-updated', refreshLearners);
    window.addEventListener('students-updated', refreshLearners);
    window.addEventListener('munyaka:data-changed', refreshLearners);
    window.addEventListener('storage', refreshLearners);

    return () => {
      window.removeEventListener('learners_updated', refreshLearners);
      window.removeEventListener('learners-updated', refreshLearners);
      window.removeEventListener('students-updated', refreshLearners);
      window.removeEventListener('munyaka:data-changed', refreshLearners);
      window.removeEventListener('storage', refreshLearners);
    };
  }, []);

  // Also sync with Firestore snapshot or fallback
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onSnapshot(collection(db, "learners"), (snapshot) => {
        const firestoreList = snapshot.docs.map(formatLearnerDoc);
        if (firestoreList.length > 0) {
          const localRaw = JSON.parse(localStorage.getItem('cached_learners') || localStorage.getItem('learners') || '[]');
          const mergedMap = new Map();
          [...firestoreList, ...localRaw].forEach(item => {
            const key = item.admissionNumber || item.admNo || item.id;
            if (key) mergedMap.set(key, item);
          });
          const merged = Array.from(mergedMap.values());
          setLearnersList(merged);
          try {
            localStorage.setItem('cached_learners', JSON.stringify(merged));
            localStorage.setItem('learners', JSON.stringify(merged));
          } catch {}
        }
      }, () => {});
    } catch {}

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleLearnerAdded = (newLearner: any) => {
    setLearnersList(prev => [newLearner, ...prev]);
    const addedGrade = newLearner.gradeLevel || newLearner.grade || 'all';
    setGradeFilter(addedGrade);
  };

  const requestDelete = (learner: any) => {
    setPendingDelete(learner);
    setAuthPassword('');
    setAuthError('');
    setIsAuthOpen(true);
  };

  const handleVerifyAuth = async () => {
    setIsVerifying(true);
    await new Promise(r => setTimeout(r, 200));

    if (pendingDelete) {
      await purgeLearnerRecord(pendingDelete, setLearnersList);
      showSuccess("Learner deleted successfully.");
    }
    setIsAuthOpen(false);
    setPendingDelete(null);
    setAuthPassword('');
    setAuthError('');
    setIsVerifying(false);
  };

  const filteredLearners = useMemo(() => {
    const searchClean = searchTerm.toLowerCase().replace(/\s+/g, '').trim();

    return learnersList.filter((learner) => {
      if (!learner) return false;
      // Combine all possible name fields into a single searchable string
      const fullName = `
        ${learner.firstName || ''}
        ${learner.middleName || ''}
        ${learner.lastName || ''}
        ${learner.name || ''}
        ${learner.fullName || ''}
        ${learner.assessmentNo || ''}
        ${learner.assessmentNumber || ''}
        ${learner.admissionNo || ''}
        ${learner.admissionNumber || ''}
      `.toLowerCase().replace(/\s+/g, '');

      // Check if search query matches the combined name or IDs
      const matchesSearch = !searchClean || fullName.includes(searchClean);

      const sGrade = learner.grade || learner.gradeLevel || learner.class || '';
      const sStream = learner.stream || learner.assignedStream || '';
      const sGender = learner.gender || '';

      const sGradeNorm = normalizeGradeStr(sGrade);
      const filterGradeNorm = normalizeGradeStr(gradeFilter);

      const matchesGrade = gradeFilter === 'all' || !sGrade || sGradeNorm === filterGradeNorm || sGrade.toLowerCase() === gradeFilter.toLowerCase();
      const matchesStream = streamFilter === 'all' || !sStream || sStream.toLowerCase() === streamFilter.toLowerCase();
      const matchesGender = genderFilter === 'all' || !sGender || sGender.toLowerCase() === genderFilter.toLowerCase();

      return matchesSearch && matchesGrade && matchesStream && matchesGender;
    });
  }, [learnersList, searchTerm, gradeFilter, streamFilter, genderFilter]);

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-3 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header action bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton parentPath="/" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Learners Directory</h1>
            <p className="text-xs sm:text-sm text-slate-500">Manage student enrollment, personal details, and records in real-time.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 gap-2 font-bold text-xs sm:text-sm"
          >
            <Plus size={18} /> Add Learner
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <Card className="border-none shadow-sm rounded-2xl bg-white p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, admission, assessment..."
              className="pl-10 rounded-xl h-11 text-xs font-medium border-slate-200 w-full"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="rounded-xl h-11 text-xs font-medium border-slate-200">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'].map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={streamFilter} onValueChange={setStreamFilter}>
              <SelectTrigger className="rounded-xl h-11 text-xs font-medium border-slate-200">
                <SelectValue placeholder="All Streams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Streams</SelectItem>
                {['BLUE', 'RED', 'GREEN', 'YELLOW'].map(st => (
                  <SelectItem key={st} value={st}>{st}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="rounded-xl h-11 text-xs font-medium border-slate-200">
                <SelectValue placeholder="All Genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setGradeFilter('all');
                setStreamFilter('all');
                setGenderFilter('all');
              }}
              className="rounded-xl h-11 text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Learners Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredLearners.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-700 text-base">No learner records found.</p>
            <p className="text-xs text-slate-400 mt-1">Click <strong>+ Add Learner</strong> to register a new student.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-tight">
                  <th className="px-3.5 py-3 text-left whitespace-nowrap">ADMISSION NO.</th>
                  <th className="px-3.5 py-3 text-left whitespace-nowrap">ASSESSMENT NO.</th>
                  <th className="px-3.5 py-3 text-left">FULL NAME</th>
                  <th className="px-3.5 py-3 text-left whitespace-nowrap">GRADE & STREAM</th>
                  <th className="px-3.5 py-3 text-left whitespace-nowrap">GENDER</th>
                  <th className="px-3.5 py-3 text-left whitespace-nowrap">DOB</th>
                  <th className="px-3.5 py-3 text-left">PARENT / GUARDIAN</th>
                  <th className="px-3.5 py-3 text-left whitespace-nowrap">PHONE NUMBER</th>
                  <th className="px-3.5 py-3 text-right whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLearners.map((learner, idx) => {
                  const sId = learner.id || learner.admissionNumber || idx;
                  const sName = learner.fullName || learner.name || 'Unnamed Learner';
                  const sAdm = learner.admissionNumber || learner.admNo || '—';
                  const sAss = learner.assessmentNumber || learner.assessmentNo || '—';
                  const sGrade = learner.gradeLevel || learner.grade || learner.class || '—';
                  const sStream = learner.stream || 'BLUE';
                  const sGender = learner.gender || 'Female';
                  const sDob = learner.dateOfBirth || '—';
                  const sParent = learner.parentName || '—';
                  const sPhone = learner.phoneNumber || '—';

                  return (
                    <tr key={sId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3.5 py-3 font-mono text-[11px] font-semibold text-indigo-600 whitespace-nowrap">{sAdm}</td>
                      <td className="px-3.5 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">{sAss}</td>
                      <td className="px-3.5 py-3 font-bold text-slate-900 truncate max-w-[180px]">
                        {sName}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {sGrade} ({sStream})
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-slate-700 whitespace-nowrap">{sGender}</td>
                      <td className="px-3.5 py-3 font-mono text-slate-600 whitespace-nowrap">{sDob}</td>
                      <td className="px-3.5 py-3 text-slate-700 truncate max-w-[150px]">{sParent}</td>
                      <td className="px-3.5 py-3 font-mono text-slate-700 whitespace-nowrap">{sPhone}</td>
                      <td className="px-3.5 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => requestDelete(learner)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete Learner"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Learner Modal with Dual-Write */}
      <AddLearnerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLearnerAdded={handleLearnerAdded}
      />

      {/* Admin Password Verification Modal for Deletion */}
      <Modal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        title="Admin Verification"
        description="Please enter the admin password to confirm deletion of this learner record."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAuthOpen(false)} className="rounded-xl font-bold flex-1">Cancel</Button>
            <Button
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex-1"
              onClick={handleVerifyAuth}
              disabled={isVerifying}
            >
              {isVerifying ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Confirm Delete
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {authError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold">
              <AlertCircle size={14} /> {authError}
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Admin Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                type="password"
                value={authPassword}
                onChange={(e) => { setAuthPassword(e.target.value); if (authError) setAuthError(''); }}
                placeholder="••••••••"
                className="pl-10 rounded-xl h-12 bg-slate-50 border-none font-bold"
                autoFocus
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
