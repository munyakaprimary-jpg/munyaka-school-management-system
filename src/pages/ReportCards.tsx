import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getStudents } from '@/services/persistentStore';
import { Search, UserCheck } from 'lucide-react';

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

  // Load students on mount
  useEffect(() => {
    try {
      const loaded = getStudents();
      if (loaded && loaded.length > 0) {
        setAllStudents(loaded);
        // Default to first student if available
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

  // Filtered student suggestions based on searchTerm (name, admission number, assessment number)
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

  const handleDownloadReport = () => {
    const studentName = selectedLearner.fullName || 'Learner';
    const admNo = selectedLearner.admissionNumber || 'N/A';
    const asmNo = selectedLearner.assessmentNumber || 'N/A';
    const grade = selectedLearner.grade || selectedGrade;
    const stream = selectedLearner.stream || selectedStream;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>CBC Report Card - ${studentName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #111; max-width: 800px; margin: auto; line-height: 1.5; }
            .header { text-align: center; border-bottom: 3px solid #111; padding-bottom: 15px; margin-bottom: 25px; }
            .school { font-size: 22px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
            .address { font-size: 13px; margin-bottom: 2px; }
            .motto { font-size: 13px; font-style: italic; margin-bottom: 10px; }
            .title { font-size: 14px; font-weight: bold; text-transform: uppercase; background: #e2e8f0; padding: 6px; margin-top: 10px; }
            
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .info-table td { padding: 8px 12px; border: 1px solid #94a3b8; font-size: 13px; width: 50%; }
            
            .marks-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .marks-table th, .marks-table td { border: 1px solid #94a3b8; padding: 8px 12px; text-align: left; font-size: 13px; }
            .marks-table th { background-color: #f1f5f9; font-weight: bold; }
            
            .remarks { border: 1px solid #94a3b8; padding: 12px; margin-bottom: 30px; font-size: 13px; background: #f8fafc; }
            .footer { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin-top: 40px; }
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

          <div class="remarks">
            <strong>Class Teacher Remarks:</strong> Excellent performance and strong grasp of core concepts. Very disciplined learner. Maintain the same effort in Term 2.
          </div>

          <div class="footer">
            <div>Class Teacher Sign: .......................................</div>
            <div>Headteacher Sign & Stamp: .......................................</div>
          </div>
        </body>
      </html>
    `;

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
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">CBC Report Card Generator</h2>
        <p className="text-sm text-slate-600">Search learners by name, admission number, or assessment number to export report cards.</p>
      </div>
      
      <div className="space-y-4 pt-1">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Select Grade</label>
            <select 
              value={selectedGrade} 
              onChange={(e) => setSelectedGrade(e.target.value)} 
              className="w-full p-2.5 border rounded-lg bg-white text-slate-800 font-medium text-sm"
            >
              {GRADES.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Select Stream</label>
            <select 
              value={selectedStream} 
              onChange={(e) => setSelectedStream(e.target.value)} 
              className="w-full p-2.5 border rounded-lg bg-white text-slate-800 font-medium text-sm"
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
              className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {showSuggestions && filteredStudents.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium">
                      {student.grade || selectedGrade}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Learner Card Preview */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5" /> Selected Learner for Export
            </div>
            <div className="font-bold text-slate-900 text-base">{selectedLearner.fullName}</div>
            <div className="text-xs text-slate-600">
              Adm: <span className="font-medium">{selectedLearner.admissionNumber}</span> | 
              Assessment No: <span className="font-medium">{selectedLearner.assessmentNumber}</span> | 
              Grade: <span className="font-medium">{selectedLearner.grade} {selectedLearner.stream}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={handleDownloadReport}
          className="w-full bg-[#112A56] hover:bg-[#0d1f42] text-[#CCFF00] font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2"
        >
          Download Report Card (.html)
        </button>
      </div>
    </div>
  );
}
