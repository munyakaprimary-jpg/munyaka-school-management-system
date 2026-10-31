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
  Download,
  ArrowRightLeft,
  Lock,
  AlertCircle,
  Loader2,
  RefreshCw,
  Trash
} from 'lucide-react';
import { db } from '@/config/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { showSuccess, showError } from '@/utils/toast';
import { getStoredLearners, Learner } from '../../utils/centralStorage';
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
  const assess = String(item.assessmentNo || item.assessmentNumber || '').trim();

  if (id && deletedIds.has(id)) return true;
  if (rawId && deletedIds.has(rawId)) return true;
  if (rawId && deletedIds.has(LEARNER_ID_PREFIX + rawId)) return true;
  if (adm && deletedIds.has(adm)) return true;
  if (assess && deletedIds.has(assess)) return true;
  return false;
};

export default function LearnersDirectory() {
  const navigate = useNavigate();

  const [learners, setLearners] = useState<Learner[]>(getStoredLearners);
  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null);

  // Reactive state update when data changes anywhere in the app
  useEffect(() => {
    const syncData = () => setLearners(getStoredLearners());
    window.addEventListener('munyaka_storage_update', syncData);
    window.addEventListener('storage', syncData);
    window.addEventListener('learners_updated', syncData);
    window.addEventListener('students-updated', syncData);
    window.addEventListener('munyaka:data-changed', syncData);
    return () => {
      window.removeEventListener('munyaka_storage_update', syncData);
      window.removeEventListener('storage', syncData);
      window.removeEventListener('learners_updated', syncData);
      window.removeEventListener('students-updated', syncData);
      window.removeEventListener('munyaka:data-changed', syncData);
    };
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [streamFilter, setStreamFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const requestDelete = (learner: any) => {
    setPendingDelete(learner);
    setIsAuthOpen(true);
  };

  const handleDeleteLearner = async (learnerToDelete: any) => {
    if (!learnerToDelete) return;
    const sourceId = learnerToDelete.id || learnerToDelete._id || learnerToDelete.learnerId || '';
    const targetRawId = toRawLearnerId(sourceId);
    const targetPrefixedId = targetRawId ? LEARNER_ID_PREFIX + targetRawId : '';
    const targetAdm = String(learnerToDelete.admissionNo || learnerToDelete.admissionNumber || learner.admNo || '').trim();

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

    const updated = learners.filter(isNotTarget);
    setLearners(updated);
    localStorage.setItem('munyaka_learners_v2', JSON.stringify(updated));
    localStorage.setItem('munyaka_learners', JSON.stringify(updated));
    window.dispatchEvent(new Event('munyaka_storage_update'));
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

  const purgeAllLearnersDataCompletely = async () => {
    if (window.confirm("Are you sure you want to completely purge and reset the learners directory?")) {
      const legacyKeys = [
        'munyaka_learners_v2',
        'munyaka_learners_db',
        'school_learners_data',
        'school_learners_master',
        'munyaka_students',
        'munyaka_students_master',
        'students',
        'learners',
        'cached_learners',
        'school_learners',
        'deleted_learner_ids',
        'munyaka_learners'
      ];

      for (const key of legacyKeys) {
        localStorage.removeItem(key);
      }

      localStorage.setItem('munyaka_learners_v2', JSON.stringify([]));
      setLearners([]);
      window.dispatchEvent(new Event('munyaka_storage_update'));
      showSuccess("All learners purged successfully.");
    }
  };

  const gradesList = useMemo(() => {
    const set = new Set<string>();
    (learners || []).forEach(l => {
      const g = l.grade;
      if (g) set.add(g);
    });
    return Array.from(set).sort();
  }, [learners]);

  const filteredLearners = useMemo(() => {
    const searchClean = searchTerm.toLowerCase().replace(/\s+/g, '').trim();
    return (learners || []).filter(learner => {
      const name = (learner.name || '').toLowerCase();
      const adm = (learner.admNo || '').toLowerCase();
      const grade = (learner.grade || '').toLowerCase();
      const stream = (learner.stream || '').toLowerCase();

      const nameMatch = !searchClean || name.includes(searchClean) || adm.includes(searchClean);
      const gradeMatch = gradeFilter === 'all' || grade.includes(gradeFilter.toLowerCase());
      const streamMatch = streamFilter === 'all' || stream === streamFilter.toLowerCase();

      return nameMatch && gradeMatch && streamMatch;
    });
  }, [learners, searchTerm, gradeFilter, streamFilter]);

  const handleLearnerAdded = (newLearner: any) => {
    const updated = getStoredLearners();
    setLearners(updated);
  };

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
                <th className="py-4 px-6">Identifier (Assessment / Birth Cert)</th>
                <th className="py-4 px-6">Grade / Stream</th>
                <th className="py-4 px-6">Parent Contact</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLearners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 font-medium">
                    No learners found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLearners.map(learner => {
                  const name = learner.name || 'Unnamed Learner';
                  const adm = learner.admNo || '-';
                  const grade = learner.grade || '-';
                  const stream = learner.stream || '-';
                  const contact = learner.phone || '-';
                  const lId = learner.id || adm;

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
                      <td className="px-4 py-3 text-sm text-slate-700 font-mono font-bold">
                        {learner.assessmentNo && learner.assessmentNo !== '—' && learner.assessmentNo !== ''
                          ? learner.assessmentNo
                          : learner.birthCertNo || '—'}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-700">{grade}</td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                          {stream}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-600">{contact}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedLearner(learner)}
                            title="View Learner Profile"
                            className="h-9 w-9 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 inline-flex items-center justify-center transition-colors"
                          >
                            <Eye className="w-4 h-4 text-indigo-600" />
                          </button>
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

      {/* Learner Profile Modal */}
      {selectedLearner && (
        <Modal
          isOpen={!!selectedLearner}
          onClose={() => setSelectedLearner(null)}
          title="Learner Profile"
          description={`Detailed profile and information for ${selectedLearner.name}`}
        >
          <div className="space-y-6 py-2">
            <div className="flex items-center gap-4 bg-indigo-50/50 p-4 rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
                {selectedLearner.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">{selectedLearner.name}</h3>
                <p className="text-sm font-bold text-indigo-600">Admission No: {selectedLearner.admNo}</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Grade: {selectedLearner.grade} • Stream: {selectedLearner.stream}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 p-4 rounded-2xl">
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Assessment / Birth Cert No</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedLearner.assessmentNo && selectedLearner.assessmentNo !== '—' && selectedLearner.assessmentNo !== ''
                    ? selectedLearner.assessmentNo
                    : selectedLearner.birthCertNo || '—'}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Gender & DOB</span>
                <span className="font-bold text-slate-800">{selectedLearner.gender || '—'} • {selectedLearner.dob || '—'}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Parent / Guardian Name</span>
                <span className="font-bold text-slate-800">{selectedLearner.parentName || '—'}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Phone Contact</span>
                <span className="font-mono font-bold text-slate-800">{selectedLearner.phone || '—'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setSelectedLearner(null)}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 h-11"
              >
                Close Profile
              </Button>
            </div>
          </div>
        </Modal>
      )}

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
          This record will be purged immediately from local storage and central storage.
        </div>
      </Modal>
    </div>
  );
}
