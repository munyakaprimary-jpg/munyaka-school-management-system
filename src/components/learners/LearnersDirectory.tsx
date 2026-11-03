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
  Trash2,
  Eye,
  Loader2,
  Trash
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import AddLearnerModal from '@/components/learners/AddLearnerModal';
import Modal from '@/components/ui/Modal';
import BackButton from '@/components/ui/BackButton';
import { getLearners, saveLearners } from '@/utils/storage';
import { Learner } from '@/types/learners';

export default function LearnersDirectory() {
  const navigate = useNavigate();

  // Initialize strictly from localStorage with zero mock data fallbacks
  const [learnersList, setLearnersList] = useState<Learner[]>(() => {
    try {
      const unified = localStorage.getItem('munyaka_app_learners_v1');
      if (unified) {
        const parsed = JSON.parse(unified);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load learners", e);
    }
    return [];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [streamFilter, setStreamFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [learnerToDelete, setLearnerToDelete] = useState<Learner | null>(null);

  // Row Checkbox & Selected IDs State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Reload learners when storage or window focus updates
  useEffect(() => {
    let isMounted = true;
    const handleStorageChange = () => {
      if (isMounted) {
        const loaded = getLearners();
        setLearnersList(loaded || []);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('munyaka:learners-updated', handleStorageChange);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('munyaka:learners-updated', handleStorageChange);
    };
  }, []);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = learnersList.map((l) => l.id).filter(Boolean);
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

  const handleDeleteSelected = () => {
    try {
      const remaining = learnersList.filter(l => !selectedIds.includes(l.id));
      setLearnersList(remaining);
      saveLearners(remaining);
      setSelectedIds([]);
      showSuccess("Selected learners deleted successfully.");
    } catch (err) {
      showError("Failed to delete selected learners.");
    }
  };

  const confirmDeleteLearner = (learner: Learner) => {
    setLearnerToDelete(learner);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = () => {
    if (!learnerToDelete) return;
    try {
      const remaining = learnersList.filter(l => l.id !== learnerToDelete.id);
      setLearnersList(remaining);
      saveLearners(remaining);
      showSuccess(`Learner ${learnerToDelete.fullName} removed successfully.`);
      setIsDeleteModalOpen(false);
      setLearnerToDelete(null);
    } catch (err) {
      showError("Failed to remove learner.");
    }
  };

  const filteredLearners = useMemo(() => {
    return learnersList.filter(learner => {
      const name = (learner.fullName || '').toLowerCase();
      const adm = (learner.admissionNo || '').toLowerCase();
      const guardian = (learner.guardian || '').toLowerCase();
      const query = searchTerm.toLowerCase();

      const matchesSearch = !query || name.includes(query) || adm.includes(query) || guardian.includes(query);
      const matchesGrade = gradeFilter === 'all' || learner.grade === gradeFilter;
      const matchesStream = streamFilter === 'all' || learner.stream === streamFilter;

      return matchesSearch && matchesGrade && matchesStream;
    });
  }, [learnersList, searchTerm, gradeFilter, streamFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <BackButton />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mt-2 flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            Learners Directory
          </h1>
          <p className="text-sm text-gray-500">
            Manage registered learners, admission records, guardians, and locations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedIds.length})
            </Button>
          )}
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Register Student
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 bg-white shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, admission no, guardian..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="PP1">PP1</SelectItem>
                <SelectItem value="PP2">PP2</SelectItem>
                <SelectItem value="Grade 1">Grade 1</SelectItem>
                <SelectItem value="Grade 2">Grade 2</SelectItem>
                <SelectItem value="Grade 3">Grade 3</SelectItem>
                <SelectItem value="Grade 4">Grade 4</SelectItem>
                <SelectItem value="Grade 5">Grade 5</SelectItem>
                <SelectItem value="Grade 6">Grade 6</SelectItem>
                <SelectItem value="Junior Secondary">Junior Secondary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={streamFilter} onValueChange={setStreamFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Stream" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Streams</SelectItem>
                <SelectItem value="Blue">Blue</SelectItem>
                <SelectItem value="Red">Red</SelectItem>
                <SelectItem value="Green">Green</SelectItem>
                <SelectItem value="Yellow">Yellow</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table Card */}
      <Card className="bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all learners"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={learnersList.length > 0 && selectedIds.length === learnersList.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="py-3.5 px-4">Admission No.</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">IDENTIFIER / UPI</th>
                <th className="py-3.5 px-4">Grade & Stream</th>
                <th className="py-3.5 px-4">Guardian & Phone</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {filteredLearners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <Users className="h-6 w-6" />
                      </div>
                      <p className="font-medium text-gray-600">No learners registered yet.</p>
                      <p className="text-xs text-gray-400 max-w-sm">
                        Click "Register Student" above to add learners to the directory. Clean slate with no fallback mock records.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLearners.map((learner) => {
                  const isChecked = selectedIds.includes(learner.id);
                  const identifierVal = learner.identifierValue || learner.assessmentNo || learner.birthCertNo;
                  return (
                    <tr key={learner.id || learner.admissionNo} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          aria-label={`Select ${learner.fullName}`}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          checked={isChecked}
                          onChange={() => handleSelectOne(learner.id)}
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-indigo-600">
                        {learner.admissionNo}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {learner.fullName || learner.name || 'Unnamed'}
                      </td>
                      <td className="py-3 px-4">
                        {identifierVal ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 font-mono text-xs">
                              {identifierVal}
                            </span>
                            <span className="text-[10px] uppercase text-gray-400 font-semibold">
                              {learner.identifierType === 'birth_cert' ? 'Birth Cert' : 'Assessment UPI'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {learner.grade} ({learner.stream})
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-900 font-medium">{learner.guardian || '—'}</div>
                        <span className="text-xs text-gray-500">{learner.phone}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {learner.location || 'Eldoret'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedLearner(learner);
                              setIsDetailModalOpen(true);
                            }}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDeleteLearner(learner)}
                            title="Delete Learner"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
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
      </Card>

      {/* Add Learner Modal */}
      <AddLearnerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLearnerAdded={(newLearner) => {
          setLearnersList(getLearners());
        }}
      />

      {/* View Learner Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Learner Profile & Details"
      >
        {selectedLearner && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <span className="text-xs text-gray-500 block">Full Name</span>
                <span className="font-semibold text-gray-900">{selectedLearner.fullName}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Admission Number</span>
                <span className="font-mono font-medium text-indigo-600">{selectedLearner.admissionNo}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Grade & Stream</span>
                <span className="font-medium text-gray-900">{selectedLearner.grade} — {selectedLearner.stream} Stream</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Location</span>
                <span className="font-medium text-gray-900">{selectedLearner.location}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Guardian Name</span>
                <span className="font-medium text-gray-900">{selectedLearner.guardian}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Guardian Phone</span>
                <span className="font-mono font-medium text-gray-900">{selectedLearner.phone}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setIsDetailModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Learner Deletion"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-gray-600">
            Are you sure you want to remove <span className="font-semibold text-gray-900">{learnerToDelete?.fullName}</span> (Admission No: <span className="font-mono">{learnerToDelete?.admissionNo}</span>) from the directory? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={executeDelete}>Delete Learner</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
