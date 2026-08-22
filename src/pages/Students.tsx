import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Eye, Edit3, Trash2, SlidersHorizontal } from 'lucide-react';

export default function Students() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState(() => localStorage.getItem('munyaka_selected_class') || 'all');
  const [filterStream, setFilterStream] = useState(() => localStorage.getItem('munyaka_selected_stream') || 'all');

  // 1. LOCAL STORAGE READ: Load Students
  const [students, setStudents] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('munyaka_students') || localStorage.getItem('munyaka_learners');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  // Load Grades from LocalStorage
  const [gradesList, setGradesList] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('munyaka_grades');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  // 2. LOCAL STORAGE WRITE: Auto-sync student modifications
  useEffect(() => {
    localStorage.setItem('munyaka_students', JSON.stringify(students));
  }, [students]);

  // Persist Filter Selections
  useEffect(() => {
    localStorage.setItem('munyaka_selected_class', filterGrade);
  }, [filterGrade]);

  useEffect(() => {
    localStorage.setItem('munyaka_selected_stream', filterStream);
  }, [filterStream]);

  // Extract Dynamic Streams based on Grade Selection
  const availableStreams = useMemo(() => {
    if (filterGrade === 'all') {
      const streamsSet = new Set<string>();
      gradesList.forEach((g: any) => {
        if (Array.isArray(g.streams)) {
          g.streams.forEach((s: any) => streamsSet.add(typeof s === 'string' ? s : s.name));
        }
      });
      return ['all', ...Array.from(streamsSet)];
    }
    const matchObj = gradesList.find((g: any) => g.name === filterGrade || g.id === filterGrade);
    if (matchObj && Array.isArray(matchObj.streams)) {
      return ['all', ...matchObj.streams.map((s: any) => typeof s === 'string' ? s : s.name)];
    }
    return ['all'];
  }, [filterGrade, gradesList]);

  // Filtered Students Array
  const filteredStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    return students.filter((student: any) => {
      const uliNo = student.uliNo || student.admNo || student.id || '';
      const name = student.name || student.fullName || '';
      
      const matchesSearch = !searchTerm || 
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        uliNo.toString().toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesGrade = filterGrade === 'all' || student.class === filterGrade || student.grade === filterGrade;
      const matchesStream = filterStream === 'all' || student.stream === filterStream;
      
      return matchesSearch && matchesGrade && matchesStream;
    });
  }, [students, searchTerm, filterGrade, filterStream]);

  // 3. LOCAL STORAGE DELETE & SAVE HANDLER
  const handleDeleteStudent = (id: string | number) => {
    const updated = students.filter((s: any) => (s.id || s.admNo || s.uliNo) !== id);
    setStudents(updated);
    localStorage.setItem('munyaka_students', JSON.stringify(updated));
  };

  return (
    <div className="p-8 bg-[#FAF8F5] min-h-screen text-slate-800">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Students</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">{filteredStudents.length} total</p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-all text-sm">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            Bulk Add
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#C5F251] hover:bg-[#B7E642] font-semibold text-slate-900 rounded-full shadow-sm transition-all text-sm">
            <Plus className="w-4 h-4 text-slate-900 stroke-[2.5]" />
            Add Student
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search Input */}
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

        {/* Grade Dropdown */}
        <select
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
          className="bg-white border border-slate-200 rounded-full px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer min-w-[140px]"
        >
          <option value="all">All Grades</option>
          {gradesList.map((g: any) => (
            <option key={g.id || g.name} value={g.name || g.id}>
              {g.name || g.label}
            </option>
          ))}
        </select>

        {/* Stream Dropdown */}
        <select
          value={filterStream}
          onChange={(e) => setFilterStream(e.target.value)}
          className="bg-white border border-slate-200 rounded-full px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer min-w-[140px]"
        >
          {availableStreams.map((stream) => (
            <option key={stream} value={stream}>
              {stream === 'all' ? 'All Streams' : stream}
            </option>
          ))}
        </select>
      </div>

      {/* Table Container */}
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
                const studentId = student.id || student.admNo || student.uliNo || idx;
                return (
                  <tr key={studentId} className="hover:bg-slate-50/60 transition-colors">
                    {/* ULI NO / ADM NO */}
                    <td className="py-4 px-6 text-slate-400 font-mono text-xs">
                      {student.uliNo || student.admNo || student.id || 'N/A'}
                    </td>

                    {/* NAME */}
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {student.name || student.fullName}
                    </td>

                    {/* GRADE BADGE */}
                    <td className="py-4 px-6">
                      <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-[#F1EFE9] text-slate-800">
                        {student.class || student.grade || 'Grade 4'}
                      </span>
                    </td>

                    {/* STREAM BADGE */}
                    <td className="py-4 px-6">
                      <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-[#EFF8CF] text-[#4A6400]">
                        {student.stream || 'Yellow'}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-3 text-slate-400">
                        <button className="hover:text-slate-700 transition-colors p-1">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="hover:text-slate-700 transition-colors p-1">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(studentId)}
                          className="hover:text-red-500 transition-colors p-1 text-red-400"
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
                  No students found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}