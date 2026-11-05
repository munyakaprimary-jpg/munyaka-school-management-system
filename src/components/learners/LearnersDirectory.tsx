import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Plus,
  Eye,
  Trash2,
  Trash,
  Loader2
} from 'lucide-react';
import { db } from '@/config/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { showSuccess } from '@/utils/toast';
import { formatLearnerDoc } from '@/services/learnerService';
import { purgeLearnerPermanently, toRawLearnerId } from '@/services/purgeLearnerService';
import AddLearnerModal from '@/components/learners/AddLearnerModal';
import Modal from '@/components/ui/Modal';
import BackButton from '@/components/ui/BackButton';
import { addPendingSyncItem } from '@/utils/storage';

const LEARNER_ID_PREFIX = 'learner-';

const isDeletedRecord = (item: any, deletedIds: Set<string>) => {
  if (!item) return true;
  const id = String(item.id || item._id || '').trim();
  const rawId = toRawLearnerId(id);
  const adm = String(item.admissionNo || item.admissionNumber || item.admNo || '').trim();
  const assess = String(item.identifierValue || item.assessmentNo || item.assessmentNumber || item.birthCertNo || item.birthCertificateNo || '').trim();

  if (id && deletedIds.has(id)) return true;
  if (rawId && deletedIds.has(rawId)) return true;
  if (rawId && deletedIds.has(LEARNER_ID_PREFIX + rawId)) return true;
  if (adm && deletedIds.has(adm)) return true;
  if (assess && deletedIds.has(assess)) return true;
  return false;
};

export default function LearnersDirectory() {
  const navigate = useNavigate();
  const [learnersList, setLearnersList] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [streamFilter, setStreamFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [learners, setLearners] = useState<any[]>([]);
  const [filteredLearners, setFilteredLearners] = useState<any[]>([]);
  const [displayedLearners, setDisplayedLearners] = useState<any[]>([]);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const loadLearners = () => {
      try {
        const deletedIds = new Set<string>(JSON.parse(localStorage.getItem('deleted_learner_ids') || '[]'));
        const saved = localStorage.getItem('munyaka_learners');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((item: any) => !isDeletedRecord(item, deletedIds));
            const formatted = filtered.map(formatLearnerDoc);
            setLearnersList(formatted);
            setLearners(formatted);
            setFilteredLearners(formatted);
            setDisplayedLearners(formatted);
            return;
          }
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
      window.removeEventListener('learners_updated', loadLearners);
      window.removeEventListener('storage', loadLearners);
      window.removeEventListener('sync-queue-updated', loadLearners);
      window.removeEventListener('munyaka:data-changed', loadLearners);
    };
  }, []);

  useEffect(() => {
    const searchClean = searchTerm.toLowerCase().replace(/\s+/g, '').trim();
    const next = (learnersList || []).filter(learner => {
      const name = (learner.fullName || learner.name || learner.studentName || `${learner.firstName || ''} ${learner.lastName || ''}`).toLowerCase();
      const adm = (learner.admissionNumber || learner.admissionNo || learner.admNo || learner.id || '').toLowerCase();
      const identifier = (learner.identifierValue || learner.assessmentNo || learner.birthCertNo || '').toLowerCase();
      const grade = (learner.gradeLevel || learner.grade || '').toLowerCase();
      const stream = (learner.stream || '').toLowerCase();

      const nameMatch = !searchClean || name.includes(searchClean) || adm.includes(searchClean) || identifier.includes(searchClean);
      const gradeMatch = gradeFilter === 'all' || grade.includes(gradeFilter.toLowerCase());
      const streamMatch = streamFilter === 'all' || stream === streamFilter.toLowerCase();

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
      showSuccess("Learner deleted successfully.");
    }
    setIsAuthOpen(false);
    setPendingDelete(null);
    setIsVerifying(false);
  };

  const purgeAllLearnersDataCompletely = () => {
    if (window.confirm("Are you sure you want to completely purge all learners data? This action cannot be undone.")) {
      const keysToPurge = [
        'munyaka_learners',
        'munyaka_learners_v2',
        'school_learners_data',
        'munyaka_students',
        'cached_learners',
        'munyaka_master_learner_list'
      ];
      for (const k of keysToPurge) {
        localStorage.removeItem(k);
      }
      localStorage.setItem('munyaka_learners', JSON.stringify([]));
      window.location.reload();
    }
  };

  const gradesList = useMemo(() => {
    const set = new Set<string>();
    (learnersList || []).forEach(l => {
      const g = l.gradeLevel || l.grade;
      if (g) set.add(g);
    });
    return Array.from(set).sort();
  }, [learnersList]);

  return (
    <div className="space-y-6 pb-16 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm">
        <div>
          <BackButton />
          <h1 className="text-2xl font-black text-slate-900 mt-2">Learners Directory</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Manage school enrollment, student records, and profiles</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={purgeAllLearnersDataCompletely}
            variant="destructive"
            className="rounded-2xl font-bold bg-rose-600 hover:bg-rose-700 text-white h-12 px-5 shadow-lg shadow-rose-100 flex items-center gap-2"
          >
            <Trash size={18} /> Purge All Data
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-6 shadow-lg shadow-indigo-100"
          >
            <Plus size={18} className="mr-2" /> Register New Learner
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Search by name, adm no, or assessment no..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-11 rounded-2xl h-12 bg-slate-50 border-none font-medium"
            />
          </div>

          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none font-medium">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Grades</SelectItem>
              {gradesList.map(g => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={streamFilter} onValueChange={setStreamFilter}>
            <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none font-medium">
              <SelectValue placeholder="All Streams" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Streams</SelectItem>
              <SelectItem value="North">North</SelectItem>
              <SelectItem value="South">South</SelectItem>
              <SelectItem value="East">East</SelectItem>
              <SelectItem value="West">West</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Clean Learner Directory Table Container */}
      <div className="w-full overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">ADMISSION NO.</th>
              <th className="p-3">ASSESSMENT / BIRTH CERT. NO.</th>
              <th className="p-3">FULL NAME</th>
              <th className="p-3">GRADE & STREAM</th>
              <th className="p-3">GENDER</th>
              <th className="p-3">DOB</th>
              <th className="p-3">PARENT / GUARDIAN</th>
              <th className="p-3">PHONE NUMBER</th>
              <th className="p-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {displayedLearners && displayedLearners.length > 0 ? (
              displayedLearners.map((learner: any, index: number) => {
                const lId = learner.id || learner.admissionNumber || learner.admissionNo || index;
                return (
                  <tr key={lId} className="hover:bg-muted/30 transition-colors">
                    {/* Admission No */}
                    <td className="p-3 font-medium whitespace-nowrap">
                      {learner.admissionNumber || learner.admissionNo || learner.admNo || learner.id || '—'}
                    </td>

                    {/* Assessment / Birth Cert No */}
                    <td className="p-3 whitespace-nowrap font-mono text-xs">
                      {learner.identifierValue || learner.assessmentNo || learner.assessmentNumber || learner.birthCertNo || learner.birthCertificateNo || '—'}
                    </td>

                    {/* Full Name */}
                    <td className="p-3 font-semibold text-foreground whitespace-nowrap">
                      {learner.fullName || learner.name || learner.studentName || `${learner.firstName || ''} ${learner.lastName || ''}`.trim() || '—'}
                    </td>

                    {/* Grade & Stream */}
                    <td className="p-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                        {learner.gradeLevel || learner.grade || ''} {learner.stream ? `(${learner.stream})` : ''}
                      </span>
                    </td>

                    {/* Gender */}
                    <td className="p-3 whitespace-nowrap capitalize">{learner.gender || learner.sex || '—'}</td>

                    {/* DOB */}
                    <td className="p-3 whitespace-nowrap">{learner.dateOfBirth || learner.dob || '—'}</td>

                    {/* Parent / Guardian */}
                    <td className="p-3 whitespace-nowrap">{learner.parentName || learner.parentGuardian || learner.guardian || '—'}</td>

                    {/* Phone Number */}
                    <td className="p-3 whitespace-nowrap">{learner.phoneNumber || learner.phone || learner.parentPhone || '—'}</td>

                    {/* Actions */}
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          className="h-8 w-8"
                          size="icon"
                          variant="ghost"
                          onClick={() => navigate(`/student/${learner.id || learner.admissionNumber || learner.admissionNo}`)}
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4"/>
                        </Button>
                        <Button
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          size="icon"
                          variant="ghost"
                          onClick={() => requestDelete(learner)}
                          title="Delete Learner"
                        >
                          <Trash2 className="h-4 w-4"/>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground">
                  No learners found. Register a new learner to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Learner Modal */}
      <AddLearnerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLearnerAdded={handleLearnerAdded}
      />

      {/* Confirmation Modal */}
      <Modal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        title="Confirm Deletion"
        description={`Are you sure you want to permanently delete ${pendingDelete?.fullName || pendingDelete?.name || pendingDelete?.firstName || 'this learner'}? This action cannot be undone.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAuthOpen(false)} className="rounded-xl font-bold flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleVerifyAuth}
              disabled={isVerifying}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-6 flex-1 shadow-lg shadow-red-100"
            >
              {isVerifying ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Confirm Delete
            </Button>
          </>
        }
      >
        <div className="py-2 text-sm text-slate-600 font-medium">
          This record will be purged immediately from local storage and Firestore.
        </div>
      </Modal>
    </div>
  );
}
