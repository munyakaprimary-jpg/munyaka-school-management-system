import React, { useState, useEffect, useMemo } from 'react';
import { 
  Save, 
  Search, 
  Award, 
  AlertCircle, 
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { showSuccess, showError } from '@/utils/toast';
import { CentralDataService } from '@/services/centralDataService';

interface Learner {
  id: string;
  name: string;
  admissionNumber?: string;
  admNo?: string;
  grade?: string;
  stream?: string;
}

interface ExamMarksEntryProps {
  learners?: Learner[];
  selectedExamPeriod?: string;
  onSubmit?: (marksData: Record<string, any>) => void;
}

const ExamMarksEntry: React.FC<ExamMarksEntryProps> = ({
  learners = [],
  selectedExamPeriod = 'Term 1',
  onSubmit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [marks, setMarks] = useState<Record<string, Record<string, string>>>({});
  const [subjects] = useState<string[]>([
    'Mathematics',
    'English',
    'Kiswahili',
    'Science & Technology',
    'Social Studies',
    'Creative Arts',
  ]);

  // Load term locks
  const [lockedTermsMap, setLockedTermsMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('munyaka_term_locks');
      if (stored) {
        setLockedTermsMap(JSON.parse(stored));
      }
    } catch { /* ignore */ }

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'munyaka_term_locks' && e.newValue) {
        try { setLockedTermsMap(JSON.parse(e.newValue)); } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Determine current academic year & active term for lock check
  let academicYear = new Date().getFullYear().toString();
  let activeTerm = selectedExamPeriod || 'Term 1';
  try {
    const settingsRaw = localStorage.getItem("munyaka_system_settings_v3") || localStorage.getItem("munyaka_system_settings");
    if (settingsRaw) {
      const settings = JSON.parse(settingsRaw);
      academicYear = settings.academic?.activeYear || settings.academicYear || academicYear;
      if (!selectedExamPeriod) {
        activeTerm = settings.academic?.activeTerm || settings.term || 'Term 1';
      }
    }
  } catch { /* ignore */ }

  const termKey = `${activeTerm}_${academicYear}`;
  const termKeyLegacy = `${activeTerm} ${academicYear}`;
  const isLocked = Boolean(
    lockedTermsMap[termKey] ||
    lockedTermsMap[termKeyLegacy] ||
    lockedTermsMap[selectedExamPeriod] ||
    CentralDataService.isTermLocked(termKey) ||
    CentralDataService.isTermLocked(termKeyLegacy) ||
    CentralDataService.isTermLocked(selectedExamPeriod)
  );

  const handleMarkChange = (learnerId: string, subject: string, value: string) => {
    if (isLocked) return;
    setMarks(prev => ({
      ...prev,
      [learnerId]: {
        ...(prev[learnerId] || {}),
        [subject]: value
      }
    }));
  };

  const handleSaveAll = () => {
    if (isLocked) {
      showError(`Term "${selectedExamPeriod}" is locked and archived. Mark entries are read-only.`);
      return;
    }
    if (onSubmit) {
      onSubmit(marks);
    }
    showSuccess("All marks saved successfully!");
  };

  const filteredLearners = useMemo(() => {
    if (!searchTerm.trim()) return learners;
    const q = searchTerm.toLowerCase();
    return learners.filter(l => 
      (l.name && l.name.toLowerCase().includes(q)) ||
      (l.admissionNumber && l.admissionNumber.toLowerCase().includes(q)) ||
      (l.admNo && l.admNo.toLowerCase().includes(q))
    );
  }, [learners, searchTerm]);

  return (
    <div className="space-y-6">
      {/* 3. Prominent warning banner when term is locked */}
      {isLocked && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 shadow-sm" data-testid="locked-term-banner">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="font-bold text-amber-900 text-sm">Archived & Locked Term ({selectedExamPeriod || termKeyLegacy})</h4>
              <p className="text-xs text-amber-700 mt-0.5">This term has been archived. Grading inputs are locked and read-only.</p>
            </div>
            <span className="bg-amber-100 text-amber-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Lock size={12} /> Locked / Read-Only
            </span>
          </div>
        </div>
      )}
            <p className="text-xs text-amber-700 mt-0.5">
              This academic term has been locked in settings. Saving changes and editing marks are disabled.
            </p>
          </div>
        </div>
      )}

      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-800">Marks Entry — {selectedExamPeriod}</h2>
              {isLocked && (
                <span className="bg-slate-100 text-slate-600 border border-slate-200 text-xs font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-xs" data-testid="header-locked-badge">
                  <Lock size={11} /> Locked / Read-Only
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">Enter and manage subject scores for learners</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search learner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-xl border-slate-200 text-sm"
            />
          </div>

          {!isLocked && (
            <Button
              onClick={handleSaveAll}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-sm gap-2 shrink-0"
              data-testid="save-all-marks-btn"
            >
              <Save className="w-4 h-4" />
              Save All Marks
            </Button>
          )}

          {isLocked && (
            <Button
              disabled
              className="h-10 px-5 rounded-xl bg-slate-200 text-slate-500 font-semibold gap-2 shrink-0 cursor-not-allowed"
              data-testid="save-all-marks-btn-disabled"
            >
              <Lock className="w-4 h-4" />
              Term Locked
            </Button>
          )}
        </div>
      </div>

      {/* Table of marks */}
      <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Adm No</th>
                <th className="py-3.5 px-4">Learner Name</th>
                {subjects.map(subj => (
                  <th key={subj} className="py-3.5 px-3 text-center">{subj}</th>
                ))}
                <th className="py-3.5 px-4 text-center">Total / Avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLearners.map((learner) => {
                const learnerId = learner.id;
                const adm = learner.admissionNumber || learner.admNo || learner.id;
                const learnerMarks = marks[learnerId] || {};
                
                // Calculate total / average
                let sum = 0;
                let count = 0;
                subjects.forEach(subj => {
                  const val = parseFloat(learnerMarks[subj] || '0');
                  if (!isNaN(val) && learnerMarks[subj] !== '') {
                    sum += val;
                    count++;
                  }
                });
                const avg = count > 0 ? Math.round(sum / count) : 0;

                return (
                  <tr key={learnerId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">{adm}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{learner.name}</td>
                    {subjects.map(subj => {
                      const val = learnerMarks[subj] ?? '';
                      return (
                        <td key={subj} className="py-2 px-2 text-center">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={val}
                            disabled={isLocked}
                            readOnly={isLocked}
                            onChange={(e) => handleMarkChange(learnerId, subj, e.target.value)}
                            placeholder="—"
                            className={`w-16 h-9 text-center font-bold text-sm mx-auto rounded-lg ${
                              isLocked 
                                ? "bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed opacity-80" 
                                : "bg-white border-slate-200 focus:border-indigo-400"
                            }`}
                            data-testid={`mark-input-${learnerId}-${subj}`}
                          />
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 text-center font-bold text-indigo-600">
                      {count > 0 ? `${sum} (${avg}%)` : '—'}
                    </td>
                  </tr>
                );
              })}
              {filteredLearners.length === 0 && (
                <tr>
                  <td colSpan={subjects.length + 3} className="text-center py-12 text-slate-400">
                    No learners found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ExamMarksEntry;
