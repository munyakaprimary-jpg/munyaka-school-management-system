import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Eye, Edit3, Trash2, SlidersHorizontal, X, UserPlus, Upload } from 'lucide-react';

export default function Students() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState(() => localStorage.getItem('munyaka_selected_class') || 'all');
  const [filterStream, setFilterStream] = useState(() => localStorage.getItem('munyaka_selected_stream') || 'all');

  // Form toggle states
  const [activeForm, setActiveForm] = useState<'none' | 'single' | 'bulk'>('none');

  // Load Grades and Classes setting data dynamically from LocalStorage
  const [gradesList] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('munyaka_grades') || localStorage.getItem('munyaka_classes');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  // Default initial grade selection based on stored grades
  const initialGradeName = useMemo(() => {
    if (gradesList.length > 0) {
      return gradesList[0].name || gradesList[0].label || 'Grade 4';
    }
    return 'Grade 4';
  }, [gradesList]);

  // Form Fields State
  const [uliNo, setUliNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [grade, setGrade] = useState(initialGradeName);
  const [stream, setStream] = useState('');
  const [bulkText, setBulkText] = useState('');

  // Dynamically compute available streams for the selected registration grade
  const formAvailableStreams = useMemo(() => {
    const selectedObj = gradesList.find((g: any) => (g.name || g.label || g.id) === grade);
    if (selectedObj && Array.isArray(selectedObj.streams)) {
      return selectedObj.streams.map((s: any) => (typeof s === 'string' ? s : s.name));
    }
    return [];
  }, [grade, gradesList]);

  // Auto-set default stream when Grade selection changes
  useEffect(() => {
    if (formAvailableStreams.length > 0) {
      setStream(formAvailableStreams[0]);
    } else {
      setStream('Yellow');
    }
  }, [grade, formAvailableStreams]);

  // 1. READ FROM LOCALSTORAGE
  const [students, setStudents] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('munyaka_students') || localStorage.getItem('munyaka_learners');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  // 2. WRITE TO LOCALSTORAGE
  const saveStudentsToLocalStorage = (updated: any[]) => {
    setStudents(updated);
    localStorage.setItem('munyaka_students', JSON.stringify(updated));
    localStorage.setItem('munyaka_learners', JSON.stringify(updated));
  };

  // Add Single Learner
  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const newLearner = {
      id: Date.now().toString(),
      uliNo: uliNo.trim() || `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
      name: fullName.trim(),
      fullName: fullName.trim(),
      grade: grade,
      class: grade,
      stream: stream
    };

    const updated = [newLearner, ...students];
    saveStudentsToLocalStorage(updated);

    // Reset Form
    setUliNo('');
    setFullName('');
    setActiveForm('none');
  };

  // Add Bulk Learners
  const handleAddBulk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n').filter(l => l.trim().length > 0);
    const createdList = lines.map((line, index) => {
      const parts = line.split(',').map(p => p.trim());
      return {
        id: (Date.now() + index).toString(),
        uliNo: parts[0] || `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
        name: parts[1] || parts[0] || 'Learner',
        fullName: parts[1] || parts[0] || 'Learner',
        grade: parts[2] || grade,
        class: parts[2] || grade,
        stream: parts[3] || stream
      };
    });

    const updated = [...createdList, ...students];
    saveStudentsToLocalStorage(updated);

    setBulkText('');
    setActiveForm('none');
  };

  // Delete Learner
  const handleDelete = (id: string | number) => {
    const updated = students.filter(s => (s.id || s.admNo || s.uliNo) !== id);
    saveStudentsToLocalStorage(updated);
  };

  // Extract Dynamic Streams for Filter Bar
  const filterAvailableStreams = useMemo(() => {
    if (filterGrade === 'all') {
      const streamsSet = new Set<string>();
      gradesList.forEach((g: any) => {
        if (Array.isArray(g.streams)) {
          g.streams.forEach((s: any) => streamsSet.add(typeof s === 'string' ? s : s.name));
        }
      });
      return ['all', ...Array.from(streamsSet)];
    }
    const matchObj = gradesList.find((g: any) => (g.name || g.id) === filterGrade);
    if (matchObj && Array.isArray(matchObj.streams)) {
      return ['all', ...matchObj.streams.map((s: any) => (typeof s === 'string' ? s : s.name))];
    }
    return ['all'];
  }, [filterGrade, gradesList]);

  // Filter List
  const filteredStudents = useMemo(() => {
    return students.filter((student: any) => {
      const idNo = student.uliNo || student.admNo || student.id || '';
      const name = student.name || student.fullName || '';
      const matchesSearch = !searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase()) || idNo.toString().toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = filterGrade === 'all' || student.class === filterGrade || student.grade === filterGrade;
      const matchesStream = filterStream === 'all' || student.stream === filterStream;
      return matchesSearch && matchesGrade && matchesStream;
    });
  }, [students, searchTerm, filterGrade, filterStream]);

  return (
    <div className="p-8 bg-[#FAF8F5] min-h-screen text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Students</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">{filteredStudents.length} total</p>
        </div>
        
        {/* Trigger Buttons */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setActiveForm(activeForm === 'bulk' ? 'none' : 'bulk')}
            className={`flex items-center gap-2 px-5 py-2.5 border rounded-full font-medium shadow-sm transition-all text-sm ${
              activeForm === 'bulk' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Bulk Add
          </button>
          
          <button 
            type="button"
            onClick={() => setActiveForm(activeForm === 'single' ? 'none' : 'single')}
            className={`flex items-center gap-2 px-5 py-2.5 font-semibold text-slate-900 rounded-full shadow-sm transition-all text-sm ${
              activeForm === 'single' ? 'bg-slate-900 text-white' : 'bg-[#C5F251] hover:bg-[#B7E642]'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Add Student
          </button>
        </div>
      </div>

      {/* INLINE REGISTRATION FORM: SINGLE LEARNER */}
      {activeForm === 'single' && (
        <div className="mb-6 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm transition-all">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-slate-700" /> Register New Learner
            </h3>
            <button type="button" onClick={() => setActiveForm('none')} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleAddSingle} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">ULI / ADMISSION NO</label>
              <input
                type="text"
                placeholder="e.g. 1024"
                value={uliNo}
                onChange={(e) => setUliNo(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">FULL NAME *</label>
              <input
                type="text"
                required
                placeholder="e.g. Joy Chebet"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            {/* DYNAMIC GRADE SELECT DROPDOWN */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">GRADE / CLASS</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer"
              >
                {gradesList.length > 0 ? (
                  gradesList.map((g: any) => {
                    const val = g.name || g.label || g.id;
                    return (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    );
                  })
                ) : (
                  <>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                  </>
                )}
              </select>
            </div>

            {/* DYNAMIC STREAM SELECT DROPDOWN */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">STREAM</label>
              <select
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer"
              >
                {formAvailableStreams.length > 0 ? (
                  formAvailableStreams.map((st: string) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Yellow">Yellow</option>
                    <option value="Red">Red</option>
                    <option value="Blue">Blue</option>
                    <option value="Green">Green</option>
                  </>
                )}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveForm('none')}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#C5F251] hover:bg-[#B7E642] text-slate-900 font-semibold rounded-xl text-sm shadow-sm"
              >
                Save to Local Storage
              </button>
            </div>
          </form>
        </div>
      )}

      {/* INLINE REGISTRATION FORM: BULK ADD */}
      {activeForm === 'bulk' && (
        <div className="mb-6 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm transition-all">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-slate-700" /> Bulk Import Learners
            </h3>
            <button type="button" onClick={() => setActiveForm('none')} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Enter each learner on a new line. Format: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono">AdmissionNo, Full Name, Grade, Stream</code>
          </p>
          <form onSubmit={handleAddBulk} className="space-y-4">
            <textarea
              rows={5}
              placeholder="1001, Kiprono Koech, Grade 4, Yellow&#10;1002, Faith Akoth, Grade 4, Blue"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setActiveForm('none')}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#C5F251] hover:bg-[#B7E642] text-slate-900 font-semibold rounded-xl text-sm shadow-sm"
              >
                Import & Save All
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or admission no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-sm"
          />
        </div>

        <select
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
          className="bg-white border border-slate-200 rounded-full px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm focus:outline-none cursor-pointer min-w-[140px]"
        >
          <option value="all">All Grades</option>
          {gradesList.map((g: any) => (
            <option key={g.id || g.name} value={g.name || g.id}>
              {g.name || g.label}
            </option>
          ))}
        </select>

        <select
          value={filterStream}
          onChange={(e) => setFilterStream(e.target.value)}
          className="bg-white border border-slate-200 rounded-full px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm focus:outline-none cursor-pointer min-w-[140px]"
        >
          {filterAvailableStreams.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All Streams' : s}
            </option>
          ))}
        </select>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-white">
              <th className="py-4 px-6">ULI NO</th>
              <th className="py-4 px-6">NAME</th>
              <th className="py-4 px-6">GRADE</th>
              <th className="py-4 px-6">STREAM</th>
              <th className="py-4 px-6 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-medium">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student: any, idx: number) => {
                const sId = student.id || student.admNo || student.uliNo || idx;
                return (
                  <tr key={sId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 text-slate-400 font-mono text-xs">
                      {student.uliNo || student.admNo || student.id || 'N/A'}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {student.name || student.fullName}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-[#F1EFE9] text-slate-800">
                        {student.class || student.grade || 'Grade 4'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-[#EFF8CF] text-[#4A6400]">
                        {student.stream || 'Yellow'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-3 text-slate-400">
                        <button type="button" className="hover:text-slate-700 p-1">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button type="button" className="hover:text-slate-700 p-1">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleDelete(sId)}
                          className="hover:text-red-500 p-1 text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                  No students found. Click "+ Add Student" or "Bulk Add" above to register learners into Local Storage.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}