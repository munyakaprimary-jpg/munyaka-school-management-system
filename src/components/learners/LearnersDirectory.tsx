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
import { collection, onSnapshot, addDoc, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { showSuccess, showError } from '@/utils/toast';
import { CentralDataService } from '@/services/centralDataService';
import { generateLearnerId, formatLearnerDoc, findExistingLearner } from '@/services/learnerService';
import { verifyDeleteAdminPassword } from '@/services/deletePasswordService';
import { purgeLearnerPermanently } from '@/services/purgeLearnerService';
import AddLearnerModal from '@/components/students/AddLearnerModal';
import Modal from '@/components/ui/Modal';
import BackButton from '@/components/ui/BackButton';

export default function LearnersDirectory() {
  const navigate = useNavigate();
  const [learnersList, setLearnersList] = useState<any[]>(() => {
    try {
      const unified = localStorage.getItem('munyaka_learners_v2');
      if (unified) {
        const parsed = JSON.parse(unified);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(formatLearnerDoc);
      }
      const cached = localStorage.getItem('cached_learners') || localStorage.getItem('munyaka_students');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed.map(formatLearnerDoc);
      }
    } catch {}
    return [];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [streamFilter, setStreamFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Active table states kept in sync for immediate UI re-render
  const [learners, setLearners] = useState<any[]>([]);
  const [filteredLearners, setFilteredLearners] = useState<any[]>([]);
  const [displayedLearners, setDisplayedLearners] = useState<any[]>([]);

  // Deletion auth state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any | null>(null);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Direct Real-Time Listener reacting to 'learners_updated' and Firestore snapshot
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
        const deletedIds = new Set(JSON.parse(localStorage.getItem(DELETED_KEY) || '[]'));
        const unified = localStorage.getItem(UNIFIED_KEY);
        if (unified) {
          const parsed = JSON.parse(unified);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((item: any) => {
              const id = String(item.id || item._id || '').trim();
              const adm = String(item.admissionNo || item.admissionNumber || item.admNo || '').trim();
              return !deletedIds.has(id) && !deletedIds.has(adm);
            });
            applyList(filtered);
            return;
          }
        }
      } catch {}
    };

    loadFromStorage();

    let unsubscribe: (() => void) | undefined;
    if (db) {
      try {
        unsubscribe = onSnapshot(collection(db, "learners"), (snapshot) => {
          const deletedIds = new Set(JSON.parse(localStorage.getItem(DELETED_KEY) || '[]'));

          const cloudLearners = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          }));

          const cleanCloudList = cloudLearners.filter((item: any) => {
            const id = String(item.id || item._id || '').trim();
            const adm = String(item.admissionNo || item.admissionNumber || item.admNo || '').trim();
            return !deletedIds.has(id) && !deletedIds.has(adm);
          });

          const currentLocal = JSON.parse(localStorage.getItem(UNIFIED_KEY) || '[]');
          const localMap = new Map();

          currentLocal.forEach((l: any) => {
            const lId = String(l.id || l._id || '').trim();
            const lAdm = String(l.admissionNo || l.admissionNumber || l.admNo || '').trim();
            if (!deletedIds.has(lId) && !deletedIds.has(lAdm)) {
              localMap.set(lId || lAdm, l);
            }
          });

          cleanCloudList.forEach((l: any) => {
            const lId = String(l.id || l._id || '').trim();
            const lAdm = String(l.admissionNo || l.admissionNumber || l.admNo || '').trim();
            const key = lId || lAdm;
            if (key && !localMap.has(key) && !deletedIds.has(lId) && !deletedIds.has(lAdm)) {
              localMap.set(key, l);
            }
          });

          const unifiedList = Array.from(localMap.values()).filter(
            item => {
              const id = String(item.id || item._id || '').trim();
              const adm = String(item.admissionNo || item.admissionNumber || item.admNo || '').trim();
              return !deletedIds.has(id) && !deletedIds.has(adm);
            }
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
      const name = (learner.name || learner.fullName || '').toLowerCase();
      const adm = (learner.admissionNumber || learner.admissionNo || learner.admNo || '').toLowerCase();
      const grade = (learner.grade || learner.gradeLevel || learner.class || '').toLowerCase();
      const stream = (learner.stream || '').toLowerCase();

      const nameMatch = !searchClean || name.includes(searchClean) || adm.includes(searchClean);
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

  // Force immediate UI table re-render: synchronize filtered learners state upon deletion
  const handleDeleteLearner = async (learnerToDelete: any) => {
    if (!learnerToDelete) return;

    // Extract identifiers
    const targetId = String(learnerToDelete.id || learnerToDelete._id || '').trim();
    const targetAdm = String(learnerToDelete.admissionNo || learnerToDelete.admissionNumber || '').trim();

    // 1. Run Storage Purge Service
    if (typeof purgeLearnerPermanently === 'function') {
      await purgeLearnerPermanently(learnerToDelete);
    }

    // 2. Direct Filter Function
    const isNotTarget = (item: any) => {
      const itemId = String(item.id || item._id || '').trim();
      const itemAdm = String(item.admissionNo || item.admissionNumber || '').trim();

      const matches = 
        (targetId && itemId === targetId) || 
        (targetAdm && itemAdm === targetAdm);

      return !matches;
    };

    // 3. Mutate ALL Active Table States
    if (typeof setLearnersList === 'function') {
      setLearnersList((prev: any[]) => prev.filter(isNotTarget));
    }
    if (typeof setLearners === 'function') {
      setLearners((prev: any[]) => prev.filter(isNotTarget));
    }
    if (typeof setFilteredLearners === 'function') {
      setFilteredLearners((prev: any[]) => prev.filter(isNotTarget));
    }
    if (typeof setDisplayedLearners === 'function') {
      setDisplayedLearners((prev: any[]) => prev.filter(isNotTarget));
    }
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
      const learnerToDelete = pendingDelete;
      // 1. Execute permanent central purge
      await purgeLearnerPermanently(learnerToDelete);

      // 2. Force immediate UI table re-render by clearing all local states
      await handleDeleteLearner(learnerToDelete);

      showSuccess("Learner deleted successfully.");
    }
    setIsAuthOpen(false);
    setPendingDelete(null);
    setAuthPassword('');
    setAuthError('');
    setIsVerifying(false);
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
          <p className="text-xs text-slate-500 font-medium mt-0.5">Manage school enrollment, student records, and profiles</p>
        </div>
        <div className="flex items-center gap-3">
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
              placeholder="Search by name or admission no..."
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

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <th className="py-4 px-6">Learner Name</th>
                <th className="py-4 px-6">Adm No</th>
                <th className="py-4 px-6">Grade / Class</th>
                <th className="py-4 px-6">Stream</th>
                <th className="py-4 px-6">Parent Contact</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {displayedLearners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 font-medium">
                    No learners found matching your criteria.
                  </td>
                </tr>
              ) : (
                displayedLearners.map(learner => {
                  const name = learner.name || learner.fullName || 'Unnamed Learner';
                  const adm = learner.admissionNumber || learner.admissionNo || learner.admNo || '-';
                  const grade = learner.grade || learner.gradeLevel || learner.class || '-';
                  const stream = learner.stream || '-';
                  const contact = learner.parentPhone || learner.guardianPhone || learner.phone || '-';
                  const lId = learner.id || learner._id || adm;

                  return (
                    <tr key={lId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                            {name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{name}</div>
                            <div className="text-xs text-slate-400 font-medium">Gender: {learner.gender || 'Not specified'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono font-medium text-slate-600">{adm}</td>
                      <td className="py-4 px-6 font-bold text-slate-700">{grade}</td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                          {stream}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-600">{contact}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/student/${lId}`)}
                            className="h-9 w-9 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                            title="View Profile"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => requestDelete(learner)}
                            className="h-9 w-9 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            title="Delete Learner"
                          >
                            <Trash2 size={16} />
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
        description={`Are you sure you want to permanently delete ${pendingDelete?.name || 'this learner'}? This action cannot be undone.`}
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
