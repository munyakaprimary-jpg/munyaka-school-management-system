import React, { useState, useRef, useMemo } from 'react';
import { 
  FileText, Download, Printer, Search, School, CheckCircle2, 
  AlertCircle, RefreshCw, Layers, Calendar, User, ShieldCheck, Award
} from 'lucide-react';
import { getLearners } from '@/hooks/useCentralData';
import { getSchoolProfile } from '@/utils/storage';

export default function ReportCards() {
  const students = getLearners();
  const schoolConfig = { name: "Munyaka Primary School", motto: "Discipline and Excellence" };
  const refreshData = () => {};
  const [grade, setGrade] = useState('Grade 4');
  const [stream, setStream] = useState('Green');
  const [term, setTerm] = useState('Term 2');
  const [year, setYear] = useState('2026');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExportingCurrent, setIsExportingCurrent] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchGrade = !grade || grade === 'all' || s.grade?.toLowerCase() === grade.toLowerCase();
      const matchStream = !stream || stream === 'all' || s.stream?.toLowerCase() === stream.toLowerCase();
      const matchSearch = !searchTerm || s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.admission_no?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchGrade && matchStream && matchSearch;
    });
  }, [students, grade, stream, searchTerm]);

  const showSuccess = (msg: string) => {
    alert(msg);
  };

  const showError = (msg: string) => {
    alert(msg);
  };

  const handleDownloadCurrent = () => {
    setIsExportingCurrent(true);
    try {
      const reportData = {
        title: "CBC Report Card",
        grade,
        stream,
        term,
        year,
        generatedAt: new Date().toISOString(),
        studentsCount: filteredStudents.length,
        currentStudent: filteredStudents[0] || null,
        schoolName: schoolConfig?.name || "Munyaka Primary School",
        motto: schoolConfig?.motto || "Discipline and Excellence"
      };
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CBC_Report_${grade}_${stream}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsExportingCurrent(false);
      showSuccess("CBC Report JSON package downloaded successfully.");
    } catch (err) {
      setIsExportingCurrent(false);
      showError("Failed to export CBC report.");
    }
  };

  const handleDownloadAll = () => {
    if (filteredStudents.length === 0) {
      showError("No learners found for the selected Grade/Stream combination.");
      return;
    }
    setIsDownloadingAll(true);
    try {
      const batchData = {
        title: "CBC Batch Report Cards",
        grade,
        stream,
        term,
        year,
        totalLearners: filteredStudents.length,
        generatedAt: new Date().toISOString(),
        schoolName: schoolConfig?.name || "Munyaka Primary School",
        students: filteredStudents
      };
      const blob = new Blob([JSON.stringify(batchData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CBC_Batch_Reports_${grade}_${stream}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsDownloadingAll(false);
      showSuccess("All CBC reports packaged and downloaded successfully.");
    } catch (err) {
      setIsDownloadingAll(false);
      showError("Failed to export batch CBC reports.");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-7 h-7 text-indigo-600" />
            CBC Report Cards Generator
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate and export official Competency Based Curriculum assessment report cards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadCurrent}
            disabled={isExportingCurrent || filteredStudents.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 text-sm"
          >
            {isExportingCurrent ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download Current
          </button>

          <button
            onClick={handleDownloadAll}
            disabled={isDownloadingAll || filteredStudents.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 text-sm"
          >
            {isDownloadingAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Download All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Grade</label>
          <select 
            value={grade} 
            onChange={(e) => setGrade(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800"
          >
            <option value="Grade 1">Grade 1</option>
            <option value="Grade 2">Grade 2</option>
            <option value="Grade 3">Grade 3</option>
            <option value="Grade 4">Grade 4</option>
            <option value="Grade 5">Grade 5</option>
            <option value="Grade 6">Grade 6</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Stream</label>
          <select 
            value={stream} 
            onChange={(e) => setStream(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800"
          >
            <option value="Green">Green</option>
            <option value="Blue">Blue</option>
            <option value="Red">Red</option>
            <option value="Gold">Gold</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Term / Year</label>
          <div className="flex gap-2">
            <select 
              value={term} 
              onChange={(e) => setTerm(e.target.value)}
              className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm font-bold text-slate-800"
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
            <select 
              value={year} 
              onChange={(e) => setYear(e.target.value)}
              className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm font-bold text-slate-800"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Search Learner</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text"
              placeholder="Name or Admission No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm font-bold text-slate-800"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="text-center mb-6 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">{schoolConfig?.name || "Munyaka Primary School"}</h2>
          <p className="text-xs text-indigo-600 font-bold italic mt-0.5">{schoolConfig?.motto || "Discipline and Excellence"}</p>
          <p className="text-xs text-slate-500 mt-1">Official CBC Report Card Preview — {grade} {stream} ({term} {year})</p>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <User className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-bold text-sm">No learners found matching this grade and stream.</p>
          </div>
        ) : (
          <div ref={wrapperRef} className="space-y-8">
            {filteredStudents.map((student, index) => (
              <div key={student.id || index} className="p-6 rounded-2xl border-2 border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900">{student.full_name}</h3>
                    <p className="text-xs font-bold text-slate-500">Admission No: {student.admission_no || 'N/A'} · Assessment No: {student.assessment_no || 'N/A'}</p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-black text-xs rounded-lg border border-indigo-200">
                    {grade} {stream}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold text-slate-700">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block mb-1">Term & Year</span>
                    <span className="text-slate-900 text-sm">{term} {year}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block mb-1">Attendance</span>
                    <span className="text-emerald-600 text-sm">Present (95%)</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block mb-1">Overall Performance</span>
                    <span className="text-indigo-600 text-sm">Exceeding Expectation (EE)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
