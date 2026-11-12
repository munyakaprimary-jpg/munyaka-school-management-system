import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Eye, Edit, Trash2, Filter, X, Users,
  Download, Upload, CheckSquare, Square, MoreHorizontal, AlertCircle, ArrowRightLeft
} from 'lucide-react';
import TransferInModal from './TransferInModal';

interface Learner {
  id: string;
  admissionNo?: string;
  admissionNumber?: string;
  admNo?: string;
  assessmentNo?: string;
  assessmentNumber?: string;
  birthCertNo?: string;
  fullName?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  grade?: string;
  gradeLevel?: string;
  stream?: string;
  gender?: string;
  parentName?: string;
  phoneNumber?: string;
  parentPhone?: string;
  [key: string]: any;
}

// Helper to safely load learners from all possible storage keys without data loss
const getStoredLearnersList = (): Learner[] => {
  try {
    const keys = ['munyaka_learners', 'learners', 'school_students', 'munyaka_learners_directory'];
    for (const key of keys) {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error("Error reading stored learners", e);
  }
  return [];
};

export default function LearnersDirectory() {
  const [learners, setLearners] = useState<Learner[]>(() => {
    return getStoredLearnersList();
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedStream, setSelectedStream] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferInOpen, setIsTransferInOpen] = useState(false);
  const [viewingLearner, setViewingLearner] = useState<Learner | null>(null);
  const [editingLearner, setEditingLearner] = useState<Learner | null>(null);

  // Handle Export / Download List as CSV
  const handleDownloadList = () => {
    try {
      const recordsToExport = filteredLearners.length > 0 ? filteredLearners : learners;
      if (recordsToExport.length === 0) {
        alert("No learner records available to export.");
        return;
      }

      const headers = ['Admission Number', 'Assessment Number', 'Full Name', 'Grade', 'Stream', 'Gender', 'Date of Birth', 'Parent/Guardian Name', 'Phone Number'];
      const csvRows = [headers.join(',')];

      recordsToExport.forEach(l => {
        const adm = `"${(l.admissionNumber || l.admissionNo || l.admNo || '').replace(/"/g, '""')}"`;
        const assess = `"${(l.assessmentNumber || l.assessmentNo || l.birthCertNo || '').replace(/"/g, '""')}"`;
        const name = `"${(l.fullName || l.name || `${l.firstName || ''} ${l.lastName || ''}`).trim().replace(/"/g, '""')}"`;
        const grade = `"${(l.grade || l.gradeLevel || '').replace(/"/g, '""')}"`;
        const stream = `"${(l.stream || '').replace(/"/g, '""')}"`;
        const gender = `"${(l.gender || '').replace(/"/g, '""')}"`;
        const dob = `"${(l.dob || l.yearOfBirth || '').replace(/"/g, '""')}"`;
        const parent = `"${(l.parentName || l.guardianName || '').replace(/"/g, '""')}"`;
        const phone = `"${(l.phoneNumber || l.parentPhone || '').replace(/"/g, '""')}"`;

        csvRows.push([adm, assess, name, grade, stream, gender, dob, parent, phone].join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `munyaka_learners_directory_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to export CSV list", e);
      alert("Failed to export CSV list. Please try again.");
    }
  };

  // Sync with storage events & fallback keys
  useEffect(() => {
    const loadLearners = () => {
      const fresh = getStoredLearnersList();
      if (fresh.length > 0) {
        setLearners(fresh);
      }
    };

    window.addEventListener('storage', loadLearners);
    window.addEventListener('munyaka_learners_updated', loadLearners);

    return () => {
      window.removeEventListener('storage', loadLearners);
      window.removeEventListener('munyaka_learners_updated', loadLearners);
    };
  }, []);

  // Save learners to localStorage helper with backup keys
  const persistLearners = (updated: Learner[]) => {
    setLearners(updated);
    try {
      const dataStr = JSON.stringify(updated);
      localStorage.setItem('munyaka_learners', dataStr);
      localStorage.setItem('munyaka_learners_directory', dataStr);
      window.dispatchEvent(new Event('munyaka_learners_updated'));
    } catch (e) {
      console.error("Failed to save learners to storage", e);
    }
  };

  // Extract unique grades and streams for filters
  const gradesList = useMemo(() => {
    const set = new Set<string>();
    learners.forEach(l => {
      const g = l.grade || l.gradeLevel;
      if (g) set.add(g);
    });
    return Array.from(set).sort();
  }, [learners]);

  const streamsList = useMemo(() => {
    const set = new Set<string>();
    learners.forEach(l => {
      if (l.stream) set.add(l.stream);
    });
    return Array.from(set).sort();
  }, [learners]);

  // Filtered learners
  const filteredLearners = useMemo(() => {
    return learners.filter(l => {
      const fullName = (l.fullName || l.name || `${l.firstName || ''} ${l.lastName || ''}`).toLowerCase();
      const adm = (l.admissionNumber || l.admissionNo || l.admNo || '').toLowerCase();
      const assess = (l.assessmentNumber || l.assessmentNo || l.birthCertNo || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || fullName.includes(query) || adm.includes(query) || assess.includes(query);
      
      const gradeVal = l.grade || l.gradeLevel || '';
      const matchesGrade = selectedGrade === 'all' || gradeVal === selectedGrade;
      const matchesStream = selectedStream === 'all' || l.stream === selectedStream;
      const genderVal = (l.gender || '').toLowerCase();
      const matchesGender = selectedGender === 'all' || genderVal === selectedGender.toLowerCase();

      return matchesSearch && matchesGrade && matchesStream && matchesGender;
    });
  }, [learners, searchQuery, selectedGrade, selectedStream, selectedGender]);

  // Handle Selection
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLearners.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLearners.map(l => l.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Delete learner
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this learner record?")) {
      const updated = learners.filter(l => l.id !== id);
      persistLearners(updated);
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  // Bulk delete
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected learner(s)?`)) {
      const updated = learners.filter(l => !selectedIds.includes(l.id));
      persistLearners(updated);
      setSelectedIds([]);
    }
  };

  // Navigate to Profile View
  const handleViewProfile = (learner: Learner) => {
    try {
      localStorage.setItem('munyaka_selected_learner_id', learner.id);
      localStorage.setItem('munyaka_active_learner', JSON.stringify(learner));
    } catch (e) {}

    setViewingLearner(learner);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            Learners Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage student records, admissions, assessments, and profiles. ({learners.length} total)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadList}
            title="Download List as CSV"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl shadow-sm transition-all text-sm"
          >
            <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Download List
          </button>
          <button
            onClick={() => setIsTransferInOpen(true)}
            title="Transfer In Learner"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl shadow-sm transition-all text-sm"
          >
            <ArrowRightLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Transfer In Learner
          </button>
          <button
            onClick={() => {
              setEditingLearner(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-200 dark:shadow-none transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Register New Learner
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by full name, admission no., or assessment no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Grade Filter */}
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              aria-label="Filter by Grade"
              className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Grades</option>
              {gradesList.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            {/* Stream Filter */}
            <select
              value={selectedStream}
              onChange={(e) => setSelectedStream(e.target.value)}
              aria-label="Filter by Stream"
              className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Streams</option>
              {streamsList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Gender Filter */}
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              aria-label="Filter by Gender"
              className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>

            {/* Clear Filters Button */}
            {(selectedGrade !== 'all' || selectedStream !== 'all' || selectedGender !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedGrade('all');
                  setSelectedStream('all');
                  setSelectedGender('all');
                  setSearchQuery('');
                }}
                className="px-3 py-2.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Bulk Action Bar if selected */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/40 px-4 py-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900 animate-fadeIn">
            <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
              {selectedIds.length} learner(s) selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium shadow-sm transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {filteredLearners.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {learners.length === 0 ? "No learners registered yet" : "No matching learners found"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {learners.length === 0 
                  ? "Get started by adding your first student record to the offline directory."
                  : "Try adjusting your search query or filter criteria."}
              </p>
            </div>
            {learners.length === 0 && (
              <button
                onClick={() => {
                  setEditingLearner(null);
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md text-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Add First Learner
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-indigo-600 transition-colors"
                      aria-label="Select all learners"
                    >
                      {selectedIds.length === filteredLearners.length && filteredLearners.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3 font-semibold">Admission No.</th>
                  <th className="py-3 px-3 font-semibold">Assessment / Birth Cert No.</th>
                  <th className="py-3 px-3 font-semibold">Full Name</th>
                  <th className="py-3 px-3 font-semibold">Grade & Stream</th>
                  <th className="py-3 px-3 font-semibold">Gender</th>
                  <th className="py-3 px-3 font-semibold">DOB / Age</th>
                  <th className="py-3 px-3 font-semibold">Parent / Guardian & Phone</th>
                  <th className="py-3 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredLearners.map((learner) => {
                  const isSelected = selectedIds.includes(learner.id);
                  const fullName = learner.fullName || learner.name || `${learner.firstName || ''} ${learner.lastName || ''}`.trim() || 'Unnamed Learner';
                  const admissionNo = learner.admissionNumber || learner.admissionNo || learner.admNo || '—';
                  const assessmentNo = learner.assessmentNumber || learner.assessmentNo || learner.birthCertNo || '—';
                  const grade = learner.grade || learner.gradeLevel || '—';
                  const stream = learner.stream ? `(${learner.stream})` : '';
                  const gender = learner.gender || '—';
                  const dobVal = learner.dob || learner.yearOfBirth || '';
                  
                  // Calculate age if dobVal is present
                  let ageDisplay = '';
                  if (dobVal) {
                    const birthYear = parseInt(dobVal.substring(0, 4), 10);
                    if (!isNaN(birthYear)) {
                      const curY = new Date().getFullYear();
                      const calcAge = curY - birthYear;
                      if (calcAge >= 0 && calcAge < 30) {
                        ageDisplay = ` (${calcAge}y)`;
                      }
                    }
                  }

                  const parentName = learner.parentName || learner.guardianName || '—';
                  const phone = learner.phoneNumber || learner.parentPhone || '';

                  return (
                    <tr
                      key={learner.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''}`}
                    >
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => toggleSelectOne(learner.id)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                          aria-label={`Select ${fullName}`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap text-xs">
                        {admissionNo}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {assessmentNo}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap text-xs">
                        {fullName}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap text-xs">
                        {grade} {stream}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 capitalize whitespace-nowrap text-xs">
                        {gender}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono text-xs whitespace-nowrap">
                        {dobVal ? `${dobVal}${ageDisplay}` : '—'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-xs">
                        <span className="text-slate-800 dark:text-slate-200 font-medium">{parentName}</span>
                        {phone && <span className="text-slate-400 font-mono ml-1.5">({phone})</span>}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewProfile(learner)}
                            title="View Profile"
                            className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-xl transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingLearner(learner);
                              setIsAddModalOpen(true);
                            }}
                            title="Edit Learner"
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(learner.id)}
                            title="Delete Learner"
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Learner Modal */}
      {isAddModalOpen && (
        <LearnerFormModal
          learner={editingLearner}
          onClose={() => setIsAddModalOpen(false)}
          onSave={(savedLearner) => {
            if (editingLearner) {
              const updated = learners.map(l => l.id === savedLearner.id ? savedLearner : l);
              persistLearners(updated);
            } else {
              const updated = [savedLearner, ...learners];
              persistLearners(updated);
            }
            setIsAddModalOpen(false);
          }}
        />
      )}

      {/* Transfer In Learner Modal */}
      {isTransferInOpen && (
        <TransferInModal
          isOpen={isTransferInOpen}
          onClose={() => setIsTransferInOpen(false)}
          onTransferInComplete={(newLearner) => {
            const fresh = getStoredLearnersList();
            setLearners(fresh);
          }}
        />
      )}

      {/* Learner Profile Modal */}
      {viewingLearner && (
        <LearnerProfileModal
          learner={viewingLearner}
          onClose={() => setViewingLearner(null)}
          onEdit={(l) => {
            setViewingLearner(null);
            setEditingLearner(l);
            setIsAddModalOpen(true);
          }}
        />
      )}
    </div>
  );
}

// Learner Profile Modal component
function LearnerProfileModal({ learner, onClose, onEdit }: { learner: Learner; onClose: () => void; onEdit: (l: Learner) => void }) {
  const fullName = learner.fullName || learner.name || `${learner.firstName || ''} ${learner.lastName || ''}`.trim() || 'Unnamed Learner';
  const admissionNo = learner.admissionNumber || learner.admissionNo || learner.admNo || '—';
  const assessmentNo = learner.assessmentNumber || learner.assessmentNo || learner.birthCertNo || '—';
  const grade = learner.grade || learner.gradeLevel || '—';
  const stream = learner.stream || '—';
  const gender = learner.gender || '—';
  const dobVal = learner.dob || learner.yearOfBirth || '';

  let ageDisplay = '—';
  if (dobVal) {
    const birthYear = parseInt(dobVal.substring(0, 4), 10);
    if (!isNaN(birthYear)) {
      const curY = new Date().getFullYear();
      const calcAge = curY - birthYear;
      if (calcAge >= 0 && calcAge < 30) {
        ageDisplay = `${calcAge} years old (${dobVal})`;
      } else {
        ageDisplay = dobVal;
      }
    } else {
      ageDisplay = dobVal;
    }
  }

  const parentName = learner.parentName || learner.guardianName || learner.guardian || '—';
  const phone = learner.phoneNumber || learner.parentPhone || learner.phone || '—';
  const admissionDate = learner.dateOfAdmission || learner.dateAdmitted || '—';
  const nemisUpi = learner.nemisUpi || learner.assessmentNumber || '—';
  const previousSchool = learner.previousSchool || '—';
  const transferReason = learner.transferReason || learner.reason || '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-xl overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"
            aria-label="Close profile"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl font-black text-white shadow-inner">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/20 rounded-full text-[11px] font-bold tracking-wide uppercase mb-1">
                {grade} {stream !== '—' && `• ${stream}`}
              </div>
              <h2 className="text-xl font-black tracking-tight">{fullName}</h2>
              <p className="text-xs text-indigo-100 font-mono mt-0.5">Adm No: {admissionNo}</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Admission Number</span>
              <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">{admissionNo}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assessment / Birth Cert No.</span>
              <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">{assessmentNo}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Grade & Stream</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{grade} {stream !== '—' && `(${stream})`}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Gender</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{gender}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Date of Birth & Age</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{ageDisplay}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">NEMIS / UPI</span>
              <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">{nemisUpi}</p>
            </div>
          </div>

          <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300">Parent / Guardian Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Guardian Name</span>
                <p className="font-bold text-slate-900 dark:text-white">{parentName}</p>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Phone Number</span>
                <p className="font-mono font-bold text-slate-900 dark:text-white">{phone}</p>
              </div>
            </div>
          </div>

          {(previousSchool !== '—' || transferReason !== '—') && (
            <div className="bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/50 space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">Transfer & History Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Previous School</span>
                  <p className="font-bold text-slate-900 dark:text-white">{previousSchool}</p>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Transfer Reason</span>
                  <p className="font-bold text-slate-900 dark:text-white">{transferReason}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 px-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Admission Date: {admissionDate}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(learner)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit Profile
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline Form Modal for Adding / Editing Learner
function LearnerFormModal({ learner, onClose, onSave }: { learner: Learner | null; onClose: () => void; onSave: (l: Learner) => void }) {
  const [availableGrades, setAvailableGrades] = useState<string[]>([
    'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'
  ]);
  const [gradeStreamsMap, setGradeStreamsMap] = useState<Record<string, string[]>>({});

  // Helper to compute cohort joining year and next continuous admission number
  const computeNextAdmissionNo = (targetGrade: string) => {
    const currentYear = new Date().getFullYear();
    
    // Determine cohort joining year based on grade
    // Grade 1 = currentYear (2026), Grade 2 = currentYear - 1 (2025), etc.
    let joiningYear = currentYear;
    const lowerGrade = targetGrade.toLowerCase();
    if (lowerGrade.includes('grade 1')) joiningYear = currentYear;
    else if (lowerGrade.includes('grade 2')) joiningYear = currentYear - 1;
    else if (lowerGrade.includes('grade 3')) joiningYear = currentYear - 2;
    else if (lowerGrade.includes('grade 4')) joiningYear = currentYear - 3;
    else if (lowerGrade.includes('grade 5')) joiningYear = currentYear - 4;
    else if (lowerGrade.includes('grade 6')) joiningYear = currentYear - 5;
    else if (lowerGrade.includes('grade 7')) joiningYear = currentYear - 6;
    else if (lowerGrade.includes('grade 8')) joiningYear = currentYear - 7;
    else if (lowerGrade.includes('grade 9')) joiningYear = currentYear - 8;
    else if (lowerGrade.includes('pp1') || lowerGrade.includes('pp2')) joiningYear = currentYear + 1; // Kindergarten entry

    try {
      const stored = localStorage.getItem('munyaka_learners');
      const allLearners: Learner[] = stored ? JSON.parse(stored) : [];
      
      const gradeOrder = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
      const targetIdx = gradeOrder.indexOf(targetGrade);
      
      let maxSeq = 0;
      let totalCount = 0;

      allLearners.forEach(l => {
        totalCount++;
        const g = l.grade || l.gradeLevel || '';
        const gIdx = gradeOrder.indexOf(g);
        
        if (targetIdx === -1 || gIdx === -1 || gIdx <= targetIdx) {
          const adm = String(l.admissionNumber || l.admissionNo || l.admNo || '');
          const match = adm.match(/MUN-(?:G\d+\-)?(\d+)(?:\/\d{4})?/i);
          if (match && match[1]) {
            const seq = parseInt(match[1], 10);
            if (!isNaN(seq) && seq > maxSeq) {
              maxSeq = seq;
            }
          }
        }
      });

      const nextSeq = Math.max(maxSeq + 1, totalCount + 1);
      const padded = String(nextSeq).padStart(3, '0');
      return `MUN-${padded}-${joiningYear}`;
    } catch (e) {
      return `MUN-001-${joiningYear}`;
    }
  };

  const [formData, setFormData] = useState<Learner>(() => {
    const initialGrade = learner?.grade || learner?.gradeLevel || 'Grade 4';
    return {
      id: learner?.id || `MUN-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`,
      admissionNumber: learner?.admissionNumber || learner?.admissionNo || (learner ? '' : computeNextAdmissionNo(initialGrade)),
      assessmentNumber: learner?.assessmentNumber || learner?.assessmentNo || `ASSESS-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: learner?.fullName || learner?.name || '',
      grade: initialGrade,
      stream: learner?.stream || 'East',
      gender: learner?.gender || 'Female',
      parentName: learner?.parentName || '',
      phoneNumber: learner?.phoneNumber || '',
      dob: learner?.dob || '2016-01-01',
      location: learner?.location || 'Eldoret'
    };
  });

  // When grade changes for a new learner, auto-update admission number if not edited
  useEffect(() => {
    if (!learner) {
      const newAdm = computeNextAdmissionNo(formData.grade || 'Grade 4');
      setFormData(prev => ({ ...prev, admissionNumber: newAdm }));
    }
  }, [formData.grade, learner]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('munyaka_grades_streams') || localStorage.getItem('munyaka_grades');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const gradesSet: string[] = [];
          const map: Record<string, string[]> = {};
          parsed.forEach((item: any) => {
            const gName = item.name || item.grade || item.title;
            if (gName) {
              gradesSet.push(gName);
              const streamsArr = item.streams || item.streamList || item.streamNames || ['East', 'West', 'North', 'South'];
              map[gName] = Array.isArray(streamsArr) ? streamsArr.map((s: any) => typeof s === 'string' ? s : (s.name || s.stream)) : ['East', 'West'];
            }
          });
          if (gradesSet.length > 0) {
            setAvailableGrades(gradesSet);
            setGradeStreamsMap(map);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load grades & streams", e);
    }
  }, []);

  const currentStreams = useMemo(() => {
    const gradeKey = formData.grade || '';
    if (gradeStreamsMap[gradeKey] && gradeStreamsMap[gradeKey].length > 0) {
      return gradeStreamsMap[gradeKey];
    }
    return ['East', 'West', 'North', 'South', 'Green', 'Blue', 'Red'];
  }, [formData.grade, gradeStreamsMap]);

  useEffect(() => {
    if (currentStreams.length > 0 && !currentStreams.includes(formData.stream || '')) {
      setFormData(prev => ({ ...prev, stream: currentStreams[0] }));
    }
  }, [formData.grade, currentStreams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName?.trim()) {
      alert("Please enter the learner's full name.");
      return;
    }
    onSave({
      ...formData,
      name: formData.fullName,
      admissionNo: formData.admissionNumber,
      assessmentNo: formData.assessmentNumber
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full border border-slate-100 dark:border-slate-800 overflow-hidden animate-scaleUp">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {learner ? "Edit Learner Record" : "Register New Learner"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Amina Kiprop"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Admission Number</label>
              <input
                type="text"
                value={formData.admissionNumber}
                onChange={e => setFormData({ ...formData, admissionNumber: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Assessment / Birth Cert No.</label>
              <input
                type="text"
                value={formData.assessmentNumber}
                onChange={e => setFormData({ ...formData, assessmentNumber: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Grade</label>
              <select
                value={formData.grade}
                onChange={e => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
              >
                {availableGrades.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Stream</label>
              <select
                value={formData.stream}
                onChange={e => setFormData({ ...formData, stream: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
              >
                {currentStreams.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Date of Birth / Year of Birth *</label>
            <input
              type="date"
              required
              value={formData.dob}
              onChange={e => setFormData({ ...formData, dob: e.target.value, yearOfBirth: e.target.value.substring(0, 4) })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Parent / Guardian Name</label>
              <input
                type="text"
                placeholder="e.g. David Kiprop"
                value={formData.parentName}
                onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +254712345678"
                value={formData.phoneNumber}
                onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md text-sm transition-all"
            >
              {learner ? "Update Record" : "Save Learner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
