import React, { useState, useEffect, useMemo } from 'react';
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
  Loader2,
  Trash
} from 'lucide-react';
import { db } from '@/config/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { showSuccess, showError } from '@/utils/toast';
import { formatLearnerDoc } from '@/services/learnerService';
import { purgeLearnerPermanently, toRawLearnerId } from '@/services/purgeLearnerService';
import AddLearnerModal from '@/components/learners/AddLearnerModal';
import Modal from '@/components/ui/Modal';
import BackButton from '@/components/ui/BackButton';

const LEARNER_ID_PREFIX = 'learner-';

const isDeletedRecord = (item: any, deletedIds: Set<string>) => {
  if (!item) return true;
  const id = String(item.id || item._id || '').trim();
  const rawId = toRawLearnerId(id);
  const adm = String(item.admissionNo || item.admissionNumber || item.admNo || '').trim();
  const assess = String(item.assessmentNo || item.assessmentNumber || item.upi || '').trim();

  if (id && deletedIds.has(id)) return true;
  if (rawId && deletedIds.has(rawId)) return true;
  if (rawId && deletedIds.has(LEARNER_ID_PREFIX + rawId)) return true;
  if (adm && deletedIds.has(adm)) return true;
  if (assess && deletedIds.has(assess)) return true;
  return false;
};

export default function LearnersDirectory() {
  const navigate = useNavigate();

  const [learnersList, setLearnersList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('munyaka_learners_v2') || localStorage.getItem('munyaka_learners') || localStorage.getItem('munyaka_students');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((l: any) => {
            if (!l) return false;
            const fullName = String(l.fullName || l.name || '').trim();
            const admNo = String(l.admissionNo || l.admissionNumber || l.admNo || '').trim();
            const isUnnamed = !fullName || fullName === 'Unnamed Learner' || fullName === 'Unknown Learner' || fullName.includes('Unnamed');
            const isSeedPattern = admNo.startsWith('MUN-00') || admNo.startsWith('MUN-01') || admNo.startsWith('MUN-02');
            return !(isUnnamed || isSeedPattern);
          });
          if (cleaned.length > 0) return cleaned.map(formatLearnerDoc);
        }
      }
    } catch (e) {}
    return [];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [streamFilter, setStreamFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Row Checkbox & Selected IDs State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const requestDelete = (learner: any) => {
    setPendingDelete(learner);
    setIsAuthOpen(true);
  };

  const [learners, setLearners] = useState<any[]>([]);
  const [displayedLearners, setDisplayedLearners] = useState<any[]>([]);

  // Filter out auto-generated ghost placeholders and seed patterns entirely
  const displayLearners = useMemo(() => {
    return (displayedLearners || []).filter((l: any) => {
      const fullName = String(l?.fullName || l?.name || '').trim();
      const admNo = String(l?.admissionNo || l?.admissionNumber || l?.admNo || '').trim();
      const isUnnamed = !fullName || fullName === 'Unnamed Learner' || fullName === 'Unknown Learner' || fullName.includes('Unnamed');
      const isSeedPattern = admNo.startsWith('MUN-00') || admNo.startsWith('MUN-01') || admNo.startsWith('MUN-02');
      return !(isUnnamed || isSeedPattern);
    });
  }, [displayedLearners]);

  // Handle master select all checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = displayLearners.map((l: any) => l.id || l._id || l.admissionNo || l.admissionNumber || l.upi).filter(Boolean);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Handle Delete Selected Button
  const handleDeleteSelected = () => {
    try {
      const remaining = learners.filter((l: any) => {
        const lId = l.id || l._id || l.admissionNo || l.admissionNumber || l.upi;
        return !selectedIds.includes(lId);
      });
      setLearners(remaining);
      setLearnersList(remaining);
      setDisplayedLearners(remaining);
      localStorage.setItem('munyaka_central_db', JSON.stringify({ learners: remaining, staff: [] }));
      localStorage.setItem('munyaka_learners_v2', JSON.stringify(remaining));
      localStorage.setItem('munyaka_learners', JSON.stringify(remaining));
      setSelectedIds([]);
      showSuccess("Selected learners deleted successfully.");
    } catch (err) {
      showError("Failed to delete selected learners.");
    }
  };

  useEffect(() => {
    const UNIFIED_KEY = 'munyaka_learners_v2';
    const DELETED_KEY = 'deleted_learner_ids';

    const applyList = (raw: any[]) => {
      const formatted = raw.map(formatLearnerDoc);
      setLearnersList(formatted);
      setLearners(formatted);
    };

    const loadFromStorage = () => {
      try {
        const deletedIds = new Set<string>(JSON.parse(localStorage.getItem(DELETED_KEY) || '[]'));
        const unified = localStorage.getItem(UNIFIED_KEY) || localStorage.getItem('munyaka_learners');
        if (unified) {
          const parsed = JSON.parse(unified);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((item: any) => !isDeletedRecord(item, deletedIds));
            applyList(filtered);
            return;
          }
        }
      } catch {}
      applyList([]);
    };

    loadFromStorage();

    let unsubscribe: (() => void) | undefined;
    if (db) {
      try {
        unsubscribe = onSnapshot(collection(db, "learners"), (snapshot) => {
          const deletedIds = new Set<string>(JSON.parse(localStorage.getItem(DELETED_KEY) || '[]'));

          const cloudLearners = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          }));

          const cleanCloudList = cloudLearners.filter((item: any) => !isDeletedRecord(item, deletedIds));

          const currentLocal = JSON.parse(localStorage.getItem(UNIFIED_KEY) || '[]');
          const localMap = new Map();

          currentLocal.forEach((l: any) => {
            if (isDeletedRecord(l, deletedIds)) return;
            const lId = String(l.id || l._id || '').trim();
            const lAdm = String(l.admissionNo || l.admissionNumber || l.admNo || '').trim();
            localMap.set(lId || lAdm, l);
          });

          cleanCloudList.forEach((l: any) => {
            const lId = String(l.id || l._id || '').trim();
            const lAdm = String(l.admissionNo || l.admissionNumber || l.admNo || '').trim();
            const key = lId || lAdm;
            if (key && !localMap.has(key)) {
              localMap.set(key, l);
            }
          });

          const unifiedList = Array.from(localMap.values()).filter(
            (item: any) => !isDeletedRecord(item, deletedIds)
          );

          localStorage.setItem(UNIFIED_KEY, JSON.stringify(unifiedList));
          applyList(unifiedList);
        }, (error) => {
          console.warn("[Firestore Listener] Offline or sync error, using local fallback:", error);
        });
      } catch (e) {
        console.warn("[Firestore Listener] Init error:", e);
      }
    }

    window.addEventListener('learners_updated', loadFromStorage);
    window.addEventListener('students-updated', loadFromStorage);
    window.addEventListener('storage', loadFromStorage);
    window.addEventListener('munyaka:data-changed', loadFromStorage);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('learners_updated', loadFromStorage);
      window.removeEventListener('students-updated', loadFromStorage);
      window.removeEventListener('storage', loadFromStorage);
      window.removeEventListener('munyaka:data-changed', loadFromStorage);
    };
  }, []);

  // Derive filtered learners whenever the source list or filters change
  useEffect(() => {
    const searchClean = searchTerm.toLowerCase().replace(/\s+/g, '').trim();
    const next = (learnersList || []).filter(learner => {
      const name = (learner.fullName || learner.name || '').toLowerCase();
      const adm = (learner.admissionNo || learner.admissionNumber || learner.admNo || '').toLowerCase();
      const upi = (learner.assessmentNo || learner.upi || '').toLowerCase();
      const grade = (learner.grade || learner.gradeLevel || learner.class || '').toLowerCase();
      const stream = (learner.stream || '').toLowerCase();

      const nameMatch = !searchClean || name.includes(searchClean) || adm.includes(searchClean) || upi.includes(searchClean);
      const gradeMatch = gradeFilter === 'all' || grade.includes(gradeFilter.toLowerCase());
      const streamMatch = streamFilter === 'all' || stream === streamFilter.toLowerCase();

      return nameMatch && gradeMatch && streamMatch;
    });
    setDisplayedLearners(next);
  }, [learnersList, searchTerm, gradeFilter, streamFilter]);

  const handleLearnerAdded = (newLearner: any) => {
    const formatted = formatLearnerDoc(newLearner);
    setLearnersList(prev => [formatted, ...prev]);
    setLearners(prev => [formatted, ...prev]);
    setDisplayedLearners(prev => [formatted, ...prev]);
    const addedGrade = newLearner.gradeLevel || newLearner.grade || 'all';
    setGradeFilter(addedGrade);
  };

  const handleDeleteLearner = async (learnerToDelete: any) => {
    if (!learnerToDelete) return;

    const sourceId = learnerToDelete.id || learnerToDelete._id || learnerToDelete.learnerId || '';
    const targetRawId = toRawLearnerId(sourceId);
    const targetPrefixedId = targetRawId ? LEARNER_ID_PREFIX + targetRawId : '';
    const targetAdm = String(learnerToDelete.admissionNo || learnerToDelete.admissionNumber || '').trim();

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
      const itemAdm = String(item.admissionNo || item.admissionNumber || '').trim();

      const matches =
        (targetRawId && itemRawId === targetRawId) ||
        (targetPrefixedId && String(itemSourceId).trim() === targetPrefixedId) ||
        (targetAdm && itemAdm === targetAdm);

      return !matches;
    };

    setLearnersList((prev: any[]) => prev.filter(isNotTarget));
    setLearners((prev: any[]) => prev.filter(isNotTarget));
    setDisplayedLearners((prev: any[]) => prev.filter(isNotTarget));
  };

  const handleVerifyAuth = async () => {
    setIsVerifying(true);
    await new Response(r => setTimeout(r, 200));

    try {
      if (pendingDelete) {
        await handleDeleteLearner(pendingDelete);
        showSuccess("Learner deleted successfully.");
      }
    } catch (e) {
      showError("Failed to delete learner.");
    } finally {
      setIsAuthOpen(false);
      setPendingDelete(null);
      setIsVerifying(false);
    }
  };

  const gradesList = useMemo(() => {
    const set = new Set<string>();
    (learnersList || []).forEach(l => {
      const g = l.grade || l.gradeLevel || l.class;
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
          <p className="text-xs text-slate-500 font-medium mt-0.5">Manage school enrollment, student records, and profiles matching registration specifications</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {selectedIds.length > 0 && (
            <Button
              onClick={handleDeleteSelected}
              variant="destructive"
              className="rounded-2xl font-bold bg-rose-600 hover:bg-rose-700 text-white h-12 px-5 shadow-lg shadow-rose-100 flex items-center gap-2"
            >
              <Trash2 size={18} /> Delete Selected ({selectedIds.length})
            </Button>
          )}
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
              placeholder="Search by full name, admission no or UPI..."
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

      {/* Rebuilt Table Matrix matching Registration Modal Structure 1:1 */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-4 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                    onChange={handleSelectAll}
                    checked={displayLearners.length > 0 && selectedIds.length === displayLearners.length}
                  />
                </th>
                <th className="py-4 px-5">Admission No</th>
                <th className="py-4 px-5">Assessment No / UPI</th>
                <th className="py-4 px-5">Full Name</th>
                <th className="py-4 px-5">Grade / Stream</th>
                <th className="py-4 px-5">Gender</th>
                <th className="py-4 px-5">Parent / Guardian</th>
                <th className="py-4 px-5">Contact Phone</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {displayLearners.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="text-slate-300" size={40} />
                      <p className="text-sm font-bold text-slate-600">No registered learners found.</p>
                      <p className="text-xs text-slate-400">Click "Register New Learner" to add students to this directory.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayLearners.map(learner => {
                  const admissionNo = learner.admissionNo || learner.admissionNumber || learner.admNo || '—';
                  const upiNo = learner.assessmentNo || learner.upi || learner.assessmentNumber || '—';
                  const fullName = learner.fullName || learner.name || 'Unnamed Learner';
                  const grade = learner.grade || learner.gradeLevel || learner.class || '—';
                  const stream = learner.stream ? `(${learner.stream})` : '';
                  const gradeStream = `${grade} ${stream}`.trim();
                  const gender = learner.gender || '—';
                  const guardian = learner.guardian || learner.parentName || '—';
                  const contact = learner.parentPhone || learner.guardianPhone || learner.phone || '—';
                  const lId = learner.id || learner._id || admissionNo;
                  const isChecked = selectedIds.includes(lId);

                  return (
                    <tr key={lId} className={`hover:bg-slate-50/60 transition-colors ${isChecked ? 'bg-indigo-50/50' : ''}`}>
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                          checked={isChecked}
                          onChange={() => handleSelectOne(lId)}
                        />
                      </td>
                      <td className="py-4 px-5 font-mono font-bold text-slate-900">{admissionNo}</td>
                      <td className="py-4 px-5 font-mono text-xs font-semibold text-slate-600">{upiNo}</td>
                      <td className="py-4 px-5 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                            {fullName.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-900">{fullName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 font-bold text-slate-700">{gradeStream}</td>
                      <td className="py-4 px-5 font-medium text-slate-600">{gender}</td>
                      <td className="py-4 px-5 font-medium text-slate-700">{guardian}</td>
                      <td className="py-4 px-5 font-mono text-xs font-medium text-slate-600">{contact}</td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLearner(learner);
                              setIsDetailModalOpen(true);
                            }}
                            className="h-8 w-8 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => requestDelete(learner)}
                            className="h-8 w-8 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            title="Delete Learner"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {/* Confirmation Modal */}
      <Modal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        title="Confirm Deletion"
        description={`Are you sure you want to permanently delete ${pendingDelete?.fullName || pendingDelete?.name || 'this learner'}? This action cannot be undone.`}
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
          This record will be purged immediately from local storage, legacy caches, and Firestore.
        </div>
      </Modal>
    </div>
  );
}
