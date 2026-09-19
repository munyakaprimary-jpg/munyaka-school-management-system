import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit3, Trash2, X, Eye, ArrowRightLeft, Users, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { showSuccess } from '@/utils/toast';

const API_BASE_URL = 'http://10.53.221.196:5000/api';

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    admNo: '',
    grade: 'Grade 1',
    stream: 'North',
    gender: 'Female',
    guardian: '',
    phone: '',
  });

  // Fetch learners from API with fallback to localStorage
  useEffect(() => {
    let isMounted = true;
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);

        let fetched = [];
        try {
          const res = await fetch(`${API_BASE_URL}/students`, { signal: AbortSignal.timeout(3000) });
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json)) fetched = json;
          }
        } catch (netErr) {
          console.warn('Backend API unavailable, falling back to localStorage:', netErr);
        }

        if (fetched.length === 0) {
          const localData = localStorage.getItem('munyaka_students') || localStorage.getItem('school_learners_data') || localStorage.getItem('students');
          if (localData) {
            const parsed = JSON.parse(localData);
            if (Array.isArray(parsed)) fetched = parsed;
          }
        }

        if (isMounted) {
          setStudents(fetched);
        }
      } catch (err) {
        console.error("Failed to load student data", err);
        if (isMounted) setError("Could not load student list safely.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStudents();
    return () => { isMounted = false; };
  }, []);

  // Filtered students list
  const filteredStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    return students.filter(s => {
      const matchesSearch = !searchTerm ||
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.admNo || s.admissionNo || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGrade = gradeFilter === 'All' ||
        (s.grade || '').toLowerCase() === gradeFilter.toLowerCase();

      return matchesSearch && matchesGrade;
    });
  }, [students, searchTerm, gradeFilter]);

  // Save or Update student
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.admNo) {
      alert("Please provide at least Name and Admission Number.");
      return;
    }

    const payload = {
      id: editingId || `stu_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...formData,
      status: 'Active',
      updatedAt: new Date().toISOString(),
    };

    try {
      // Try posting/patching to backend API
      const endpoint = editingId ? `${API_BASE_URL}/students/${editingId}` : `${API_BASE_URL}/students`;
      const method = editingId ? 'PUT' : 'POST';
      await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch {}

    // Update local state and persistence
    let updated;
    if (editingId) {
      updated = students.map(s => (s.id === editingId || s.admNo === formData.admNo) ? { ...s, ...payload } : s);
      showSuccess("Learner updated successfully.");
    } else {
      updated = [payload, ...students];
      showSuccess("Learner registered successfully.");
    }

    setStudents(updated);
    localStorage.setItem('munyaka_students', JSON.stringify(updated));
    localStorage.setItem('school_learners_data', JSON.stringify(updated));

    // Reset & Close Modal
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      admNo: '',
      grade: 'Grade 1',
      stream: 'North',
      gender: 'Female',
      guardian: '',
      phone: '',
    });
  };

  const handleEdit = (student: any) => {
    setEditingId(student.id || student.admNo);
    setFormData({
      name: student.name || '',
      admNo: student.admNo || student.admissionNo || '',
      grade: student.grade || 'Grade 1',
      stream: student.stream || 'North',
      gender: student.gender || 'Female',
      guardian: student.guardian || '',
      phone: student.phone || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this learner record?")) return;
    const updated = students.filter(s => s.id !== id && s.admNo !== id);
    setStudents(updated);
    localStorage.setItem('munyaka_students', JSON.stringify(updated));
    localStorage.setItem('school_learners_data', JSON.stringify(updated));
    showSuccess("Learner deleted successfully.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-slate-600">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="font-semibold text-sm">Loading learner directory...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Learner Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage school enrolments, profiles, and backend synchronization ({filteredStudents.length} learners active)
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', admNo: `MUN-${Math.floor(1000 + Math.random() * 9000)}`, grade: 'Grade 1', stream: 'North', gender: 'Female', guardian: '', phone: '' });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-5 py-2.5 shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          + Add Learner
        </Button>
      </div>

      {error && <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-medium">{error}</div>}

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or admission no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="All">All Grades</option>
            <option value="Grade 1">Grade 1</option>
            <option value="Grade 2">Grade 2</option>
            <option value="Grade 3">Grade 3</option>
            <option value="Grade 4">Grade 4</option>
            <option value="Grade 5">Grade 5</option>
            <option value="Grade 6">Grade 6</option>
            <option value="Grade 7">Grade 7</option>
            <option value="Grade 8">Grade 8</option>
            <option value="Grade 9">Grade 9</option>
          </select>
        </div>
      </div>

      {/* Learners Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-700 text-base">No learner records found.</p>
            <p className="text-xs text-slate-400 mt-1">Click <strong>+ Add Learner</strong> to register a new student.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Admission No</th>
                  <th className="py-3.5 px-5">Full Name</th>
                  <th className="py-3.5 px-5">Grade & Stream</th>
                  <th className="py-3.5 px-5">Gender</th>
                  <th className="py-3.5 px-5">Guardian & Phone</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student, idx) => (
                  <tr key={student.id || student.admNo || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-xs font-semibold text-indigo-600">
                      {student.admNo || student.admissionNo || '—'}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-900">
                      <Link to={`/students/${student.id || student.admNo}`} className="hover:text-indigo-600 transition-colors">
                        {student.name || 'Unnamed Learner'}
                      </Link>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {student.grade || 'N/A'} {student.stream ? `(${student.stream})` : ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-medium">
                      {student.gender || '—'}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="text-slate-900 font-medium">{student.guardian || '—'}</div>
                      <div className="text-xs text-slate-500 font-mono">{student.phone || '—'}</div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/students/${student.id || student.admNo}`)}
                          title="View Profile"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(student)}
                          title="Edit Learner"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id || student.admNo)}
                          title="Delete / Archive"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit Learner Record' : 'Register New Learner'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brian Kipkorir"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Admission Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MUN-G4-001/2026"
                    value={formData.admNo}
                    onChange={(e) => setFormData(prev => ({ ...prev, admNo: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Grade / Class</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Stream</label>
                  <input
                    type="text"
                    placeholder="e.g. North, South, Blue"
                    value={formData.stream}
                    onChange={(e) => setFormData(prev => ({ ...prev, stream: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Mr. & Mrs. Kipkorir"
                    value={formData.guardian}
                    onChange={(e) => setFormData(prev => ({ ...prev, guardian: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 0712345678"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  {editingId ? 'Save Changes' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
