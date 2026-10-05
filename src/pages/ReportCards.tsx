import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getStudents } from '@/services/persistentStore';
import { Search, UserCheck, Eye, Download, MessageSquare, Calendar } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const GRADES = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
const STREAMS = ['Green', 'Blue', 'Red', 'Gold', 'East', 'West', 'All'];
const ACADEMIC_YEARS = ['2026', '2025', '2024'];
const TERMS = ['Term 1', 'Term 2', 'Term 3'];
const EXAM_TYPES = ['End Term Assessment', 'Mid Term Assessment', 'Opener Assessment'];

const SUBJECTS_BY_CATEGORY: Record<string, string[]> = {
  'PP': ['Language Activities', 'Mathematical Activities', 'Environmental Activities', 'Psychomotor & Creative', 'Religious Education'],
  'Lower': ['Literacy', 'English', 'Kiswahili', 'Mathematical Activities', 'Environmental Activities', 'Creative Arts', 'Religious Education'],
  'Upper': ['English', 'Kiswahili', 'Mathematics', 'Science & Tech', 'Social Studies', 'Agriculture & Nutrition', 'Creative Arts', 'Religious Education'],
  'Junior': ['English', 'Kiswahili', 'Mathematics', 'Integrated Science', 'Pre-Technical Studies', 'Social Studies', 'Agriculture & Nutrition', 'Creative Arts & Sports', 'Religious Education']
};

const getCategory = (grade: string) => {
  const g = grade.toUpperCase();
  if (g.includes('PP') || g.includes('PLAYGROUP')) return 'PP';
  const num = parseInt(g.replace(/[^0-9]/g, '')) || 4;
  if (num <= 3) return 'Lower';
  if (num <= 6) return 'Upper';
  return 'Junior';
};

interface Learner {
  id?: string;
  name?: string;
  fullName?: string;
  admissionNumber?: string;
  assessmentNumber?: string;
  assessmentNo?: string;
  grade?: string;
  stream?: string;
  marks?: Record<string, { mid?: number | string; end?: number | string; avg?: number | string; rubric?: string } | number>;
}

export default function ReportCards() {
  const [selectedGrade, setSelectedGrade] = useState('Grade 6');
  const [selectedStream, setSelectedStream] = useState('Green');
  const [academicYear, setAcademicYear] = useState('2026');
  const [term, setTerm] = useState('Term 1');
  const [examType, setExamType] = useState('End Term Assessment');
  
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
  const [teacherRemarks, setTeacherRemarks] = useState('Excellent performance and strong grasp of core concepts. Very disciplined learner. Maintain the same effort in the next term.');
  const [hoiRemarks, setHoiRemarks] = useState('A commendable term! Keep aiming higher.');
  const [closingDate, setClosingDate] = useState('2026-04-10');
  const [openingDate, setOpeningDate] = useState('2026-05-04');
  const [isExporting, setIsExporting] = useState(false);

  // Load students on mount
  useEffect(() => {
    try {
      const loaded = getStudents();
      if (loaded && loaded.length > 0) {
        setAllStudents(loaded);
        const firstMatch = loaded.find(s => {
          const gMatch = !selectedGrade || String(s.grade || '').toLowerCase().includes(selectedGrade.toLowerCase().replace('grade ', ''));
          return gMatch;
        }) || loaded[0];

        setSelectedLearner(firstMatch);
        if (firstMatch.grade) setSelectedGrade(firstMatch.grade);
        if (firstMatch.stream) setSelectedStream(firstMatch.stream);
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

  // Filter students strictly by Grade and Stream
  const filteredStudents = useMemo(() => {
    return allStudents.filter(s => {
      const studentGrade = String(s.grade || '').toLowerCase().trim();
      const targetGrade = selectedGrade.toLowerCase().trim();
      const gradeMatches = !selectedGrade || studentGrade.includes(targetGrade) || targetGrade.includes(studentGrade);

      const studentStream = String(s.stream || '').toLowerCase().trim();
      const targetStream = selectedStream.toLowerCase().trim();
      const streamMatches = selectedStream === 'All' || !selectedStream || studentStream.includes(targetStream) || targetStream.includes(studentStream);

      return gradeMatches && streamMatches;
    });
  }, [allStudents, selectedGrade, selectedStream]);

  // Search filtered suggestions within the grade/stream filtered list
  const searchFilteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return filteredStudents.slice(0, 10);
    const termStr = searchTerm.toLowerCase().trim();
    return filteredStudents.filter(s => {
      const name = (s.fullName || s.name || '').toLowerCase();
      const adm = (s.admissionNumber || '').toLowerCase();
      const asm = (s.assessmentNumber || s.assessmentNo || '').toLowerCase();
      return name.includes(termStr) || adm.includes(termStr) || asm.includes(termStr);
    }).slice(0, 10);
  }, [filteredStudents, searchTerm]);

  // When Grade or Stream changes, verify if current active learner belongs to the new class
  useEffect(() => {
    if (filteredStudents.length > 0) {
      const isCurrentValid = filteredStudents.some(s => 
        (s.admissionNumber && s.admissionNumber === selectedLearner.admissionNumber) ||
        (s.fullName && s.fullName === selectedLearner.fullName) ||
        (s.id && s.id === selectedLearner.admissionNumber)
      );
      if (!isCurrentValid) {
        setSelectedLearner(filteredStudents[0]);
      }
    } else {
      setSelectedLearner({
        fullName: 'No student in this class',
        admissionNumber: 'N/A',
        assessmentNumber: 'N/A',
        grade: selectedGrade,
        stream: selectedStream,
        marks: {}
      });
    }
  }, [selectedGrade, selectedStream, filteredStudents]);

  const handleSelectLearner = (student: Learner) => {
    setSelectedLearner(student);
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

  const getRubric = (score: number) => {
    if (score >= 80) return 'EE';
    if (score >= 65) return 'ME';
    if (score >= 50) return 'AE';
    return 'BE';
  };

  const buildReportHtml = () => {
    const studentName = selectedLearner.fullName || selectedLearner.name || 'Learner';
    const admNo = selectedLearner.admissionNumber || selectedLearner.id || 'N/A';
    const asmNo = selectedLearner.assessmentNumber || selectedLearner.assessmentNo || 'N/A';
    const grade = selectedLearner.grade || selectedGrade;
    const stream = selectedLearner.stream || selectedStream;

    const cat = getCategory(grade);
    const subjects = SUBJECTS_BY_CATEGORY[cat] || SUBJECTS_BY_CATEGORY['Upper'];
    const learnerMarks = selectedLearner.marks || {};

    const rowsHtml = subjects.map(subj => {
      const subjData = (learnerMarks as any)[subj];
      let mid = '-';
      let end = '-';
      let avg = '-';
      let rubric = '-';

      if (subjData !== undefined && subjData !== null) {
        if (typeof subjData === 'object') {
          mid = subjData.mid !== undefined && subjData.mid !== '' ? subjData.mid : '-';
          end = subjData.end !== undefined && subjData.end !== '' ? subjData.end : '-';
          avg = subjData.avg !== undefined && subjData.avg !== '' ? subjData.avg : '-';
          if (avg !== '-' && !isNaN(Number(avg))) {
            rubric = getRubric(Number(avg));
          } else if (subjData.rubric) {
            rubric = subjData.rubric;
          }
        } else if (typeof subjData === 'number' || !isNaN(Number(subjData))) {
          mid = '-';
          end = String(subjData);
          avg = String(subjData);
          rubric = getRubric(Number(subjData));
        }
      }

      return `
        <tr>
          <td>${subj}</td>
          <td style="text-align: center;">${mid}</td>
          <td style="text-align: center;">${end}</td>
          <td style="text-align: center;">${avg}</td>
          <td style="text-align: center; font-weight: bold;">${rubric}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>CBC Report Card - ${studentName}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { font-family: Arial, sans-serif; padding: 15px; color: #111; max-width: 800px; margin: auto; line-height: 1.4; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
            <div class="title">Competency Based Curriculum ${examType} — ${term}, ${academicYear}</div>
          </div>

          <table class="info-table">
            <tr>
              <td><strong>Learner Name:</strong> ${studentName}</td>
              <td><strong>Assessment No / Adm:</strong> ${asmNo} (${admNo})</td>
            </tr>
            <tr>
              <td><strong>Grade / Stream:</strong> ${grade} — ${stream}</td>
              <td><strong>Class Rank:</strong> 1 of ${filteredStudents.length || 1}</td>
            </tr>
          </table>

          <table class="marks-table">
            <thead>
              <tr>
                <th>Subject / Learning Area</th>
                <th style="text-align: center;">Mid Term</th>
                <th style="text-align: center;">End Term</th>
                <th style="text-align: center;">Average</th>
                <th style="text-align: center;">Rubric</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
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
    setIsExporting(true);
    try {
      const studentName = selectedLearner.fullName || selectedLearner.name || 'Learner';
      const htmlContent = buildReportHtml();

      // Create a hidden print iframe to trigger standard PDF print dialog / save as PDF
      let pdfFrame = document.getElementById('report-pdf-print-frame') as HTMLIFrameElement;
      if (!pdfFrame) {
        pdfFrame = document.createElement('iframe');
        pdfFrame.id = 'report-pdf-print-frame';
        pdfFrame.style.position = 'fixed';
        pdfFrame.style.right = '0';
        pdfFrame.style.bottom = '0';
        pdfFrame.style.width = '0';
        pdfFrame.style.height = '0';
        pdfFrame.style.border = '0';
        document.body.appendChild(pdfFrame);
      }

      const pw = pdfFrame.contentWindow;
      const frameDoc = pw?.document;
      if (!frameDoc) {
        // Fallback to Blob download if iframe is unavailable
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CBC_Report_${studentName.replace(/\s+/g, '_')}_${academicYear}.pdf.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExporting(false);
        showSuccess("Report card exported successfully.");
        return;
      }

      frameDoc.open();
      frameDoc.write(htmlContent);
      frameDoc.close();

      setTimeout(() => {
        pw?.focus();
        pw?.print();
        setIsExporting(false);
        showSuccess("PDF export dialog opened successfully.");
      }, 500);
    } catch (err) {
      setIsExporting(false);
      showError("Failed to export PDF report card.");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">CBC Report Card PDF Generator</h2>
          <p className="text-sm text-slate-600 mt-0.5">Filter learners by grade & stream, customize remarks, and export formal PDF report cards.</p>
        </div>
        <button 
          onClick={handleDownloadReport}
          disabled={isExporting}
          className="bg-[#112A56] hover:bg-[#0d1f42] text-[#CCFF00] font-bold px-6 py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> {isExporting ? 'Preparing PDF...' : 'Download / Save PDF Report'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Controls & Search */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" /> Exam & Academic Period
          </h3>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Year</label>
              <select 
                value={academicYear} 
                onChange={(e) => setAcademicYear(e.target.value)} 
                className="w-full p-2 border rounded-xl bg-white text-slate-800 font-medium text-xs outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ACADEMIC_YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Term</label>
              <select 
                value={term} 
                onChange={(e) => setTerm(e.target.value)} 
                className="w-full p-2 border rounded-xl bg-white text-slate-800 font-medium text-xs outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TERMS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Exam Type</label>
              <select 
                value={examType} 
                onChange={(e) => setExamType(e.target.value)} 
                className="w-full p-2 border rounded-xl bg-white text-slate-800 font-medium text-xs outline-none focus:ring-2 focus:ring-blue-500"
              >
                {EXAM_TYPES.map(et => (
                  <option key={et} value={et}>{et}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
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
          
          {/* Live Learner Search Box (Restricted to selected Grade & Stream) */}
          <div className="relative" ref={searchRef}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase text-slate-500">
                Search Learner in {selectedGrade} ({filteredStudents.length} available)
              </label>
            </div>
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
                placeholder="Type name or admission number..."
                className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {showSuggestions && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                {searchFilteredStudents.length > 0 ? (
                  searchFilteredStudents.map((student, idx) => {
                    const name = student.fullName || student.name || 'Unnamed Learner';
                    const adm = student.admissionNumber || student.id || 'N/A';
                    const asm = student.assessmentNumber || student.assessmentNo || 'N/A';
                    return (
                      <div
                        key={student.id || idx}
                        onClick={() => handleSelectLearner(student)}
                        className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 flex items-center justify-between transition"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">{name}</div>
                          <div className="text-xs text-slate-500">Adm: {adm} | Assessment: {asm}</div>
                        </div>
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-semibold">
                          {student.stream || selectedStream}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-4 py-3 text-xs text-slate-500 text-center">
                    No matching learners found in {selectedGrade}.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5" /> Active Learner
            </div>
            <div className="font-bold text-slate-900 text-base">{selectedLearner.fullName || selectedLearner.name || '—'}</div>
            <div className="text-xs text-slate-600">
              Adm: <span className="font-medium">{selectedLearner.admissionNumber || selectedLearner.id || 'N/A'}</span> | 
              Grade: <span className="font-medium">{selectedLearner.grade || selectedGrade} {selectedLearner.stream || selectedStream}</span>
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
