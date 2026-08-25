import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Edit3, Trash2, SlidersHorizontal, X, UserPlus,
  Printer, Download, ShieldCheck, Phone, User, Check, AlertCircle, Sparkles, ChevronDown, FileText, Users
} from 'lucide-react';

interface Learner {
  id: string;
  admNo: string;
  name: string;
  grade: string;
  stream: string;
  gender: 'Male' | 'Female' | 'Other';
  guardian: string;
  phone: string;
}

const DEFAULT_LEARNERS: Learner[] = [
  {
    id: '1',
    admNo: 'REG/MPS/2025/001',
    name: 'Esther Njeri Mwangi',
    grade: 'Grade 4',
    stream: 'North',
    gender: 'Female',
    guardian: 'Grace Mwangi',
    phone: '+254 712 345 678',
  },
  {
    id: '2',
    admNo: 'REG/MPS/2025/002',
    name: 'Felix Mutua Kioko',
    grade: 'Grade 5',
    stream: 'South',
    gender: 'Male',
    guardian: 'David Kioko',
    phone: '+254 722 987 654',
  },
  {
    id: '3',
    admNo: 'REG/2025/003',
    name: 'Gloria Nekesa Wafula',
    grade: 'Grade 3',
    stream: 'East',
    gender: 'Female',
    guardian: 'Christine Wafula',
    phone: '+254 733 456 789',
  },
  {
    id: '4',
    admNo: 'REG/2025/004',
    name: 'Hassan Abdi Omar',
    grade: 'Grade 6',
    stream: 'West',
    gender: 'Male',
    guardian: 'Fatuma Omar',
    phone: '+254 701 112 233',
  },
  {
    id: '5',
    admNo: 'REG/2025/005',
    name: 'Irene Chebet Langat',
    grade: 'Grade 4',
    stream: 'North',
    gender: 'Female',
    guardian: 'Kiprono Langat',
    phone: '+254 755 667 889',
  },
];

// Keys for persisting filter state in localStorage
const FILTER_STATE_KEY = 'learners_filter_state';

export default function Students() {
  // 1. LocalStorage Persistence Setup for Learners
  const [learners, setLearners] = useState<Learner[]>(() => {
    try {
      const saved = localStorage.getItem('school_learners_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading learners from localStorage', e);
    }
    localStorage.setItem('school_learners_data', JSON.stringify(DEFAULT_LEARNERS));
    return DEFAULT_LEARNERS;
  });

  // 1. Dynamic Reader Function for Active Term & Year
  const getActiveTermLabel = () => {
    try {
      const configKeys = ['system_config', 'academic_setup', 'school_settings', 'active_term', 'current_academic_term', 'school_term', 'academic_session'];
      for (const key of configKeys) {
        const val = localStorage.getItem(key);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (parsed && typeof parsed === 'object') {
              const termVal = parsed.activeTerm || parsed.currentTerm || parsed.term || parsed.name;
              const yearVal = parsed.activeAcademicYear || parsed.currentYear || parsed.year || parsed.academicYear;
              if (termVal && yearVal) {
                return `${String(termVal).toUpperCase()}, ${yearVal}`;
              }
              if (termVal) {
                return String(termVal).toUpperCase();
              }
            } else if (typeof parsed === 'string' && parsed.trim().length > 0) {
              return parsed.trim().toUpperCase();
            }
          } catch {
            if (val.trim().length > 0) {
              return val.trim().toUpperCase();
            }
          }
        }
      }
    } catch (e) {
      console.error('Error reading academic config from localStorage', e);
    }
    return 'TERM 2, 2026';
  };

  const [termBadge, setTermBadge] = useState<string>(getActiveTermLabel);

  // 2. Real-Time LocalStorage Event Listener
  useEffect(() => {
    const updateTerm = () => setTermBadge(getActiveTermLabel());
    updateTerm();
    window.addEventListener('storage', updateTerm);
    // Also poll/listen to custom storage events if dispatched within the same app
    const interval = setInterval(updateTerm, 1000);
    return () => {
      window.removeEventListener('storage', updateTerm);
      clearInterval(interval);
    };
  }, []);

  // Automatically sync learners back to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('school_learners_data', JSON.stringify(learners));
    } catch (e) {
      console.error('Error saving learners to localStorage', e);
    }
  }, [learners]);

  // 2. Dynamic Grades & Streams Reader from LocalStorage
  // Reads the grade-stream mapping from 'gradeStreamSettings' or the school setup configuration keys.
  const getDynamicGradesAndStreams = () => {
    try {
      // Check multiple keys as specified: 'gradeStreamSettings', 'school_grades_streams_data', 'school_streams', 'cbc_structure', 'munyaka_grades'
      const keys = ['gradeStreamSettings', 'school_grades_streams_data', 'school_streams', 'cbc_structure', 'munyaka_grades'];
      let rawData: any = null;
      for (const key of keys) {
        const val = localStorage.getItem(key);
        if (val) {
          rawData = JSON.parse(val);
          break;
        }
      }

      let gradesSet = new Set<string>();
      let streamsSet = new Set<string>();
      // Map of grade name -> array of stream names
      const gradeStreamMap: Record<string, string[]> = {};

      if (Array.isArray(rawData)) {
        rawData.forEach((item: any) => {
          if (item && typeof item === 'object') {
            const gName = item.name || item.grade || item.label;
            if (gName) {
              gradesSet.add(gName);
              const streams = item.streams || item.classes;
              const streamNames: string[] = [];
              if (Array.isArray(streams)) {
                streams.forEach((s: any) => {
                  const sName = typeof s === 'string' ? s : (s.name || s.label);
                  if (sName) {
                    streamsSet.add(sName);
                    streamNames.push(sName);
                  }
                });
              }
              gradeStreamMap[gName] = streamNames;
            }
          }
        });
      }

      // Fallback if empty or not found in LS: extract from learners records or defaults
      if (gradesSet.size === 0) {
        ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'].forEach(g => gradesSet.add(g));
      }
      if (streamsSet.size === 0) {
        ['North', 'South', 'East', 'West'].forEach(s => streamsSet.add(s));
        learners.forEach(l => {
          if (l.stream) streamsSet.add(l.stream);
        });
      }

      return {
        grades: Array.from(gradesSet),
        streams: Array.from(streamsSet),
        gradeStreamMap,
      };
    } catch (e) {
      return {
        grades: ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'],
        streams: ['North', 'South', 'East', 'West'],
        gradeStreamMap: {},
      };
    }
  };

  const dynamicData = useMemo(() => {
    return getDynamicGradesAndStreams();
  }, [learners]);

  const GRADES_LIST = dynamicData.grades;
  const ALL_STREAMS_LIST = dynamicData.streams;
  const GRADE_STREAM_MAP = dynamicData.gradeStreamMap;

  // Filters state — initialized from localStorage if available
  const [searchTerm, setSearchTerm] = useState(() => {
    try {
      const saved = localStorage.getItem(FILTER_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.searchTerm || '';
      }
    } catch (e) {
      console.error('Error loading searchTerm from localStorage', e);
    }
    return '';
  });

  const [gradeFilter, setGradeFilter] = useState(() => {
    try {
      const saved = localStorage.getItem(FILTER_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.gradeFilter || 'All';
      }
    } catch (e) {
      console.error('Error loading gradeFilter from localStorage', e);
    }
    return 'All';
  });

  const [streamFilter, setStreamFilter] = useState(() => {
    try {
      const saved = localStorage.getItem(FILTER_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.streamFilter || 'All';
      }
    } catch (e) {
      console.error('Error loading streamFilter from localStorage', e);
    }
    return 'All';
  });

  // Persist filter states to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(FILTER_STATE_KEY, JSON.stringify({
        searchTerm,
        gradeFilter,
        streamFilter,
      }));
    } catch (e) {
      console.error('Error saving filter state to localStorage', e);
    }
  }, [searchTerm, gradeFilter, streamFilter]);

  // Computed list of streams available for the currently selected grade.
  // If "All Grades" or no grade is selected, show all unique streams in the school.
  const availableStreams = useMemo(() => {
    if (gradeFilter === 'All' || !gradeFilter) {
      return ALL_STREAMS_LIST;
    }
    const mapped = GRADE_STREAM_MAP[gradeFilter];
    if (mapped && mapped.length > 0) {
      return mapped;
    }
    // Fallback: derive streams from learners that belong to the selected grade
    const streamsForGrade = new Set<string>();
    learners.forEach((l) => {
      if (l.grade === gradeFilter && l.stream) {
        streamsForGrade.add(l.stream);
      }
    });
    return Array.from(streamsForGrade);
  }, [gradeFilter, ALL_STREAMS_LIST, GRADE_STREAM_MAP, learners]);

  // When the grade filter changes, automatically reset the stream filter to "All Streams"
  const handleGradeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGrade = e.target.value;
    setGradeFilter(newGrade);
    setStreamFilter('All');
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLearnerId, setEditingLearnerId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    admNo: 'REG/2025/0' + Math.floor(10 + Math.random() * 90),
    name: '',
    grade: GRADES_LIST[0] || 'Grade 4',
    stream: ALL_STREAMS_LIST[0] || 'North',
    gender: 'Female' as 'Male' | 'Female' | 'Other',
    guardian: '',
    phone: '',
  });

  const [formError, setFormError] = useState('');

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filtered learners
  const filteredLearners = useMemo(() => {
    return learners.filter((learner) => {
      const matchesSearch =
        learner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        learner.admNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        learner.guardian.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGrade = gradeFilter === 'All' || learner.grade === gradeFilter;
      const matchesStream = streamFilter === 'All' || learner.stream === streamFilter;

      return matchesSearch && matchesGrade && matchesStream;
    });
  }, [learners, searchTerm, gradeFilter, streamFilter]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingLearnerId(null);
    setFormData({
      admNo: `MPS/2025/0${Math.floor(10 + Math.random() * 90)}`,
      name: '',
      grade: GRADES_LIST[0] || 'Grade 4',
      stream: ALL_STREAMS_LIST[0] || 'North',
      gender: 'Female',
      guardian: '',
      phone: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (learner: Learner) => {
    setEditingLearnerId(learner.id);
    setFormData({
      admNo: learner.admNo,
      name: learner.name,
      grade: learner.grade,
      stream: learner.stream,
      gender: learner.gender,
      guardian: learner.guardian,
      phone: learner.phone,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleSaveLearner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.admNo.trim() || !formData.name.trim() || !formData.guardian.trim()) {
      setFormError('Please fill in all required fields (Admission No, Full Name, Parent/Guardian).');
      return;
    }

    if (editingLearnerId) {
      // Update existing
      setLearners((prev) =>
        prev.map((item) =>
          item.id === editingLearnerId
            ? { ...item, ...formData }
            : item
        )
      );
    } else {
      // Create new
      const newLearner: Learner = {
        id: Date.now().toString(),
        ...formData,
      };
      setLearners((prev) => [newLearner, ...prev]);
    }

    setIsModalOpen(false);
  };

  // Close & Reset Modal Handler
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormError('');
    setEditingLearnerId(null);
    setFormData({
      admNo: `MPS/2025/0${Math.floor(10 + Math.random() * 90)}`,
      name: '',
      grade: GRADES_LIST[0] || 'Grade 4',
      stream: ALL_STREAMS_LIST[0] || 'North',
      gender: 'Female',
      guardian: '',
      phone: '',
    });
  };

  // Handle Delete Confirmation
  const confirmDelete = (id: string) => {
    setLearners((prev) => prev.filter((item) => item.id !== id));
    setDeleteId(null);
  };

  // Export CSV with options ("All Learners" vs "Current View")
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const exportToCSV = (datasetToExport: Learner[]) => {
    const headers = ['Adm No', 'Name', 'Grade', 'Stream', 'Gender', 'Parent/Guardian', 'Phone'];
    const rows = datasetToExport.map((l) => [
      l.admNo,
      `"${l.name}"`,
      l.grade,
      l.stream,
      l.gender,
      `"${l.guardian}"`,
      `"${l.phone}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `learners_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  const handleExportAll = () => {
    try {
      const fullDataset = JSON.parse(localStorage.getItem('school_learners_data') || '[]');
      const targetDataset = Array.isArray(fullDataset) && fullDataset.length > 0 ? fullDataset : learners;
      exportToCSV(targetDataset);
    } catch {
      exportToCSV(learners);
    }
  };

  const handleExportCurrentView = () => {
    // Current view exports filteredLearners (which respects cleared/active filters without hardcoded stale filters like "Grade 4")
    exportToCSV(filteredLearners);
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 md:p-10 bg-[#FBFBFA] min-h-screen text-slate-800">
      
      {/* 2. Top Header & Action Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Learners Management</h1>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full shadow-2xs">
              {termBadge}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500">
            {filteredLearners.length} learners found {learners.length !== filteredLearners.length && `(filtered from ${learners.length} total)`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl shadow-2xs transition-all"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Export CSV
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={handleExportAll}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center gap-2"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  All Learners
                </button>
                <button
                  type="button"
                  onClick={handleExportCurrentView}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center gap-2 border-t border-slate-100"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Current View ({filteredLearners.length})
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl shadow-2xs transition-all"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            + Add Learner
          </button>
        </div>
      </div>

      {/* 3. Filters Bar (Dynamic Grades & Streams from LocalStorage) */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs mb-6 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by learner Name or Adm No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Grade Dropdown */}
          <div className="w-full md:w-48">
            <select
              value={gradeFilter}
              onChange={handleGradeFilterChange}
              className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Grades</option>
              {GRADES_LIST.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          {/* Stream Dropdown (Dynamically populated based on selected Grade) */}
          <div className="w-full md:w-48">
            <select
              value={streamFilter}
              onChange={(e) => setStreamFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Streams</option>
              {availableStreams.map((stream) => (
                <option key={stream} value={stream}>{stream}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Table Layout & Styling */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">ADM NO.</th>
                <th className="py-4 px-6">NAME</th>
                <th className="py-4 px-6">GRADE</th>
                <th className="py-4 px-6">STREAM</th>
                <th className="py-4 px-6">GENDER</th>
                <th className="py-4 px-6">PARENT/GUARDIAN</th>
                <th className="py-4 px-6">PHONE</th>
                <th className="py-4 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLearners.length > 0 ? (
                filteredLearners.map((learner) => (
                  <tr key={learner.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-indigo-600">
                      {learner.admNo}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {learner.name}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                        {learner.grade}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {learner.stream}
                    </td>
                    <td className="py-4 px-6">
                      {learner.gender === 'Female' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200">
                          Female
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {learner.gender}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-700 font-medium">
                      {learner.guardian}
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-mono text-xs">
                      {learner.phone}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(learner)}
                          title="Edit learner"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(learner.id)}
                          title="Delete learner"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <p className="font-medium text-slate-600">No learners found matching your filter criteria.</p>
                      <p className="text-xs text-slate-400">Try adjusting your search query or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal Dialog for Add / Edit Learner (Dynamic Grades & Streams) */}
      {isModalOpen && (
        <div
          onClick={handleCloseModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    {editingLearnerId ? 'Edit Learner Details' : 'Register New Learner'}
                  </h3>
                  <p className="text-xs text-slate-500">Fill in student bio and guardian details below</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg text-xl transition-all"
                title="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLearner} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Admission Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.admNo}
                      onChange={(e) => setFormData({ ...formData, admNo: e.target.value })}
                      placeholder="e.g. REG/2025/006"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Brian Kiprop"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Grade *
                    </label>
                    <select
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      {GRADES_LIST.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Stream *
                    </label>
                    <select
                      value={formData.stream}
                      onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      {ALL_STREAMS_LIST.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Gender *
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Parent / Guardian Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.guardian}
                      onChange={(e) => setFormData({ ...formData, guardian: e.target.value })}
                      placeholder="e.g. Mary Kiprop"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +254 711 223 344"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t shrink-0 bg-gray-50">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-sm font-medium text-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all active:scale-95"
                >
                  {editingLearnerId ? 'Update Learner' : 'Save Learner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Prompt Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Remove Learner?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to remove this learner from LocalStorage? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDelete(deleteId)}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}