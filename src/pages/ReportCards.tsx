import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getStudents } from '@/services/persistentStore';
import { Search, UserCheck, Eye, Download, Calendar, MessageSquare } from 'lucide-react';

const GRADES = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
const STREAMS = ['Green', 'Blue', 'Red', 'Gold', 'East', 'West', 'All'];

interface Learner {
  id?: string;
  name?: string;
  fullName?: string;
  admissionNumber?: string;
  assessmentNumber?: string;
  assessmentNo?: string;
  grade?: string;
  stream?: string;
}

export default function ReportCards() {
  const [selectedGrade, setSelectedGrade] = useState('Grade 6');
  const [selectedStream, setSelectedStream] = useState('Green');
  
  // Stored students from persistentStore
  const [allStudents, setAllStudents] = useState<Learner[]>([]);
  
  // Search & Selected Student State
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [selectedLearner, setSelectedLearner] = useState<Learner>({
    fullName: 'NICOLE WAITHIRA MUHORO',
    admissionNumber: 'ADM/2026/001',
    assessmentNumber: 'B004991382',
    grade: 'Grade 6',
    stream: 'Green'
  });

  // Remarks & Dates state
  const [teacherRemarks, setTeacherRemarks] = useState('Excellent performance and strong grasp of core concepts. Very disciplined learner. Maintain the same effort in Term 2.');
  const [hoiRemarks, setHoiRemarks] = useState('A commendable term! Keep aiming higher.');
  const [closingDate, setClosingDate] = useState('2026-04-10');
  const [openingDate, setOpeningDate] = useState('2026-05-04');

  // Load students on mount
  useEffect(() => {
    try {
      const loaded = getStudents();
      if (loaded && loaded.length > 0) {
        setAllStudents(loaded);
        const first = loaded[0];
        setSelectedLearner({
          fullName: first.fullName || first.name || 'Learner',
          admissionNumber: first.admissionNumber || first.id || 'N/A',
          assessmentNumber: first.assessmentNumber || first.assessmentNo || 'B004991382',
          grade: first.grade || 'Grade 6',
          stream: first.stream || 'Green'
        });
        if (first.grade) setSelectedGrade(first.grade);
        if (first.stream) setSelectedStream(first.stream);
      }
    } catch (err) {
      console.error("Failed to load students:", err);
    }
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return allStudents.slice(0, 8);
    const term = searchTerm.toLowerCase();
    return allStudents.filter(s => {
      const name = (s.fullName || s.name || '').toLowerCase();
      const adm = (s.admissionNumber || '').toLowerCase();
      const asm = (s.assessmentNumber || s.assessmentNo || '').toLowerCase();
      return name.includes(term) || adm.includes(term) || asm.includes(term);
    }).slice(0, 10);
  }, [allStudents, searchTerm]);

  const handleSelectLearner = (student: Learner) => {
    setSelectedLearner({
      fullName: student.fullName || student.name || 'Learner',
      admissionNumber: student.admissionNumber || student.id || 'N/A',
      assessmentNumber: student.assessmentNumber || student.assessmentNo || 'B004991382',
      grade: student.grade || selectedGrade,
      stream: student.stream || selectedStream
    });
    if (student.grade) setSelectedGrade(student.grade);
    if (student.stream) setSelectedStream(student.stream);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${d}/${m}/${y}`;
    }
    return dateStr;
  };

  const buildReportHtml = () => {
    const studentName = selectedLearner.fullName || 'Learner';
    const admNo = selectedLearner.admissionNumber || 'N/A';
    const asmNo = selectedLearner.assessmentNumber || 'N/A';
    const grade = selectedLearner.grade || selectedGrade;
    const stream = selectedLearner.stream || selectedStream;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>CBC Report Card - ${studentName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 25px; color: #111; max-width: 800px; margin: auto; line-height: 1.4; background: #fff; }
            .header { text-align: center; border-bottom: 3px solid #111; padding-bottom: 12px; margin-bottom: 20px; }
            .school { font-size: 20px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
            .address { font-size: 12px; margin-bottom: 2px; }
            .motto { font-size: 12px; font-style: italic; margin-bottom: 8px; }
            .title { font-size: 13px; font-weight: bold; text-transform: uppercase; background: #e2e8f0; padding: 6px; margin-top: 8px; }
            
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .info-table td { padding: 6px 10px; border: 1px solid #94a3b8; font-size: 12px; width: 50%; }
            
            .marks-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .marks-table th, .marks-table td { border: 1px solid #94a3b8; padding: 6px 8px; text-align: left; font-size: 12px; }
            .marks-table th { background-color: #f1f5f9; font-weight: bold; }
            
            .remarks-box { border: 1px solid #94a3b8; padding: 10px; margin-bottom: 15px; font-size: 12px; background: #f8fafc; }
            .remarks-title { font-weight: bold; margin-bottom: 2px; color: #1e3a8a; }
            
            .footer { display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; margin-top: 25px; }
            .closing-footer { font-size: 11px; text-align: center; color: #555; margin-top: 20px; border-top: 1px solid #cbd5e1; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school">Munyaka Primary and Junior School</div>
            <div class="address">P.O. BOX 5239-30100, ELDORET</div>
            <div class="motto">MOTTO: Knowledge is Power</div>
            <div class="title">Competency Based Curriculum Progress Report — Term 1, 2026</div>
          </div>

          <table class="info-table">
            <tr>
              <td><strong>Learner Name:</strong> ${studentName}</td>
              <td><strong>Assessment No / Adm:</strong> ${asmNo} (${admNo})</td>
            </tr>
            <tr>
              <td><strong>Grade / Stream:</strong> ${grade} — ${stream}</td>
              <td><strong>Overall Rank:</strong> 1 of ${allStudents.length || 8}</td>
            </tr>
          </table>

          <table class="marks-table">
            <thead>
              <tr>
                <th>Subject / Learning Area</th>
                <th>Mid Term</th>
                <th>End Term</th>
                <th>Average</th>
                <th>Rubric</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>English</td><td>78</td><td>82</td><td>80</td><td>EE</td></tr>
              <tr><td>Kiswahili</td><td>74</td><td>76</td><td>75</td><td>ME</td></tr>
              <tr><td>Mathematics</td><td>85</td><td>88</td><td>86.5</td><td>EE</td></tr>
              <tr><td>Science & Tech</td><td>80</td><td>82</td><td>81</td><td>EE</td></tr>
              <tr><td>Social Studies</td><td>72</td><td>75</td><td>73.5</td><td>ME</td></tr>
              <tr><td>Agriculture & Nutrition</td><td>76</td><td>78</td><td>77</td><td>ME</td></tr>
              <tr><td>Creative Arts</td><td>82</td><td>85</td><td>83.5</td><td>EE</td></tr>
              <tr><td>Religious Education</td><td>80</td><td>84</td><td>82</td><td>EE</td></tr>
            </tbody>
          </table>

          <div class="remarks-box">
            <div class="remarks-title">Class Teacher Remarks:</div>
            <div>${teacherRemarks}</div>
          </div>

          <div class="remarks-box">
            <div class="remarks-title">Head Teacher Remarks:</div>
            <div>${hoiRemarks}</div>
          </div>

          <div class="footer">
            <div>Class Teacher Sign: .......................................</div>
            <div>Headteacher Sign & Stamp: .......................................</div>
          </div>

          <div class="closing-footer">
            Closing Date: <strong>${formatDateDisplay(closingDate)}</strong> | Opening Date: <strong>${formatDateDisplay(openingDate)}</strong> | System Powered by Jamlyan Analytics
          </div>
        </body>
      </html>
    `;
  };

  const handleDownloadReport = () => {
    const studentName = selectedLearner.fullName || 'Learner';
    const htmlContent = buildReportHtml();

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CBC_Report_${studentName.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">CBC Report Card Generator</h2>
          <p className="text-sm text-slate-600 mt-0.5">Search learners, customize remarks and term dates, and export or preview formal report cards.</p>
        </div>
        <button 
          onClick={handleDownloadReport}
          className="bg-[#112A56] hover:bg-[#0d1f42] text-[#CCFF00] font-bold px-6 py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
        >
          <Download className="h-4 w-4" /> Download Report Card (.html)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Controls & Search */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Search className="h-4 w-4 text-blue-600" /> Learner & Class Configuration
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Grade</label>
              <select 
                value={selectedGrade} 
                onChange={(e) => setSelectedGrade(e.target.value)} 
                className="w-full p-2.5 border rounded-xl bg-white text-slate-800 font-medium text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                {GRADES.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Stream</label>
              <select 
                value={selectedStream} 
                onChange={(e) => setSelectedStream(e.target.value)} 
                className="w-full p-2.5 border rounded-xl bg-white text-slate-800 font-medium text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STREAMS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Live Learner Search Box */}
          <div className="relative" ref={searchRef}>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Search Learner (Name, Adm No, Assessment No)</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Type student name or admission number..."
                className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {showSuggestions && filteredStudents.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                {filteredStudents.map((student, idx) => {
                  const name = student.fullName || student.name || 'Unnamed Learner';
                  const adm = student.admissionNumber || student.id || 'N/A';
                  const asm = student.assessmentNumber || student.assessmentNo || 'N/A';
                  return (
                    <div
                      key={student.id || idx}
                      onClick={() => handleSelectLearner(student)}
                      className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{name}</div>
                        <div className="text-xs text-slate-500">Adm: {adm} | Assessment: {asm}</div>
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-semibold">
                        {student.grade || selectedGrade}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5" /> Active Learner
            </div>
            <div className="font-bold text-slate-900 text-base">{selectedLearner.fullName}</div>
            <div className="text-xs text-slate-600">
              Adm: <span className="font-medium">{selectedLearner.admissionNumber}</span> | 
              Assessment No: <span className="font-medium">{selectedLearner.assessmentNumber}</span>
            </div>
          </div>

          {/* Remarks & Dates Customization */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" /> Remarks & Term Calendar
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Class Teacher Remarks</label>
              <textarea 
                value={teacherRemarks}
                onChange={(e) => setTeacherRemarks(e.target.value)}
                rows={2}
                className="w-full p-2.5 border rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Head Teacher Remarks</label>
              <textarea 
                value={hoiRemarks}
                onChange={(e) => setHoiRemarks(e.target.value)}
                rows={2}
                className="w-full p-2.5 border rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Closing Date</label>
                <input 
                  type="date"
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                  className="w-full p-2 border rounded-xl text-xs text-slate-800 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Opening Date</label>
                <input 
                  type="date"
                  value={openingDate}
                  onChange={(e) => setOpeningDate(e.target.value)}
                  className="w-full p-2 border rounded-xl text-xs text-slate-800 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Preview Window */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" /> Live Report Card Preview
            </h3>
            <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-semibold">
              Live Updates Enabled
            </span>
          </div>

          {/* Preview Container / Iframe */}
          <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-100 shadow-inner p-4 min-h-[650px] flex items-center justify-center">
            <iframe 
              srcDoc={buildReportHtml()}
              title="Report Card Preview"
              className="w-full h-[620px] bg-white rounded-lg shadow-md border border-slate-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
