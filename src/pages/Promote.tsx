import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Modal from '@/components/ui/Modal';
import { useSchoolStore } from '@/store/useSchoolStore';
import { showSuccess, showError } from '@/utils/toast';
import { ArrowRight, CheckCircle2, Users, GraduationCap, RefreshCw, Filter } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PromotionStats from '@/components/promote/PromotionStats';

const GRADE_SEQUENCE = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];

const calculateNextGrade = (currentGrade: string): string => {
  if (!currentGrade) return 'Grade 1';
  const clean = currentGrade.trim().toLowerCase();

  const index = GRADE_SEQUENCE.findIndex(g => g.toLowerCase() === clean);

  if (index !== -1 && index + 1 < GRADE_SEQUENCE.length) {
    return GRADE_SEQUENCE[index + 1];
  } else if (index === GRADE_SEQUENCE.length - 1 || clean.includes('grade 9') || clean.includes('g9')) {
    return 'Graduated';
  }

  if (clean === 'g1' || clean === 'class 1') return 'Grade 2';
  if (clean === 'g2' || clean === 'class 2') return 'Grade 3';
  if (clean === 'g3' || clean === 'class 3') return 'Grade 4';
  if (clean === 'g4' || clean === 'class 4') return 'Grade 5';
  if (clean === 'g5' || clean === 'class 5') return 'Grade 6';
  if (clean === 'g6' || clean === 'class 6') return 'Grade 7';
  if (clean === 'g7' || clean === 'class 7') return 'Grade 8';
  if (clean === 'g8' || clean === 'class 8') return 'Grade 9';
  if (clean === 'g9' || clean === 'class 9') return 'Graduated';

  return currentGrade;
};

export default function PromotePage() {
  const { learners, saveLearners } = useSchoolStore();
  const [targetYear, setTargetYear] = useState('2027');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter States
  const [sourceGrade, setSourceGrade] = useState('all');
  const [sourceStream, setSourceStream] = useState('all');
  
  // Target overrides
  const [targetGradeOverride, setTargetGradeOverride] = useState('');
  const [targetStreamOverride, setTargetStreamOverride] = useState('');

  // Confirmation modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [promotionMode, setPromotionMode] = useState<'all' | 'selected'>('all');

  // Selected student IDs for granular control
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Unique grades & streams from learners with dynamic counts
  const gradeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    learners.forEach(l => {
      const g = String(l.grade || l.class || '').trim();
      if (g) {
        counts[g] = (counts[g] || 0) + 1;
      }
    });
    return counts;
  }, [learners]);

  const availableGrades = useMemo(() => {
    return Object.keys(gradeCounts).sort((a, b) => {
      const idxA = GRADE_SEQUENCE.findIndex(g => g.toLowerCase() === a.toLowerCase());
      const idxB = GRADE_SEQUENCE.findIndex(g => g.toLowerCase() === b.toLowerCase());
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.localeCompare(b);
    });
  }, [gradeCounts]);

  const availableStreams = useMemo(() => {
    const set = new Set<string>();
    learners.forEach(l => {
      const g = String(l.grade || l.class || '').trim();
      const s = String(l.stream || l.classStream || '').trim();
      if (s) {
        if (sourceGrade === 'all' || g.toLowerCase() === sourceGrade.toLowerCase()) {
          set.add(s);
        }
      }
    });
    return Array.from(set).sort();
  }, [learners, sourceGrade]);

  // Filtered learners list with robust normalization
  const filteredLearners = useMemo(() => {
    return learners.filter(l => {
      const g = String(l.grade || l.class || '').trim().toLowerCase();
      const s = String(l.stream || l.classStream || '').trim().toLowerCase();

      const matchesGrade = sourceGrade === 'all' || g === sourceGrade.toLowerCase();
      const matchesStream = sourceStream === 'all' || s === sourceStream.toLowerCase();

      return matchesGrade && matchesStream;
    });
  }, [learners, sourceGrade, sourceStream]);

  // Sync selected IDs when filter changes
  useEffect(() => {
    setSelectedStudentIds(filteredLearners.map(l => l.id || l.admissionNumber));
  }, [filteredLearners]);

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === filteredLearners.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredLearners.map(l => l.id || l.admissionNumber));
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const statsData = {
    totalStudents: learners.length,
    activeStudents: learners.filter(l => calculateNextGrade(l.grade || l.class) !== 'Graduated').length,
    graduatedStudents: learners.filter(l => calculateNextGrade(l.grade || l.class) === 'Graduated').length,
    highestGrade: 'Grade 9',
    eligibleForPromotion: filteredLearners.length,
    graduating: filteredLearners.filter(l => calculateNextGrade(l.grade || l.class) === 'Graduated').length,
    retained: 0
  };

  const handleOpenConfirm = (mode: 'all' | 'selected') => {
    setPromotionMode(mode);
    if (mode === 'selected' && selectedStudentIds.length === 0) {
      showError('Please select at least one student to promote.');
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleExecutePromotions = () => {
    try {
      setIsProcessing(true);
      const targetIds = new Set(selectedStudentIds);

      const updated = learners.map(l => {
        const studentKey = l.id || l.admissionNumber;
        if (promotionMode === 'selected' && !targetIds.has(studentKey)) {
          return l;
        }

        const current = l.grade || l.class || 'Grade 1';
        const defaultNext = calculateNextGrade(current);
        const nextGrade = targetGradeOverride.trim() ? targetGradeOverride : defaultNext;
        const nextStream = targetStreamOverride.trim() ? targetStreamOverride : (l.stream || l.classStream || '');

        return {
          ...l,
          grade: nextGrade === 'Graduated' ? current : nextGrade,
          stream: nextStream || l.stream,
          status: nextGrade === 'Graduated' ? 'Graduated' : 'Active',
          academicYear: targetYear,
          year: targetYear,
          enrollmentYear: targetYear
        };
      });

      saveLearners(updated);
      setIsConfirmOpen(false);
      showSuccess(`Successfully promoted ${promotionMode === 'selected' ? selectedStudentIds.length : filteredLearners.length} students to academic year ${targetYear}!`);
    } catch (err: any) {
      showError('Promotion execution failed: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Student Promotion & Advancement</h1>
          <p className="text-sm text-muted-foreground mt-1">Advance active students to the next grade sequence for academic year {targetYear}.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => handleOpenConfirm('selected')}
            disabled={isProcessing || selectedStudentIds.length === 0}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-900/20"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Promote Selected Class ({selectedStudentIds.length})
          </Button>
          <Button
            onClick={() => handleOpenConfirm('all')}
            disabled={isProcessing}
            variant="outline"
            className="rounded-xl border-slate-300 font-semibold"
          >
            Promote All School
          </Button>
        </div>
      </div>

      <PromotionStats stats={statsData} />

      {/* Promotion Controls Bar */}
      <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm p-5 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Class & Stream Filters & Target Mapping</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500">Source Grade Level</Label>
            <select
              value={sourceGrade}
              onChange={(e) => {
                setSourceGrade(e.target.value);
                setSourceStream('all'); // reset stream when grade changes
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-2 text-sm font-bold"
            >
              <option value="all">All Grades ({learners.length} students)</option>
              {availableGrades.map(g => (
                <option key={g} value={g}>{g} ({gradeCounts[g]} students)</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500">Source Stream</Label>
            <select
              value={sourceStream}
              onChange={(e) => setSourceStream(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-2 text-sm font-bold"
            >
              <option value="all">All Streams</option>
              {availableStreams.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500">Target Grade Override</Label>
            <Input
              placeholder="Auto (Next Grade)"
              value={targetGradeOverride}
              onChange={(e) => setTargetGradeOverride(e.target.value)}
              className="rounded-xl h-10 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500">Target Year</Label>
            <select
              value={targetYear}
              onChange={(e) => setTargetYear(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-2 text-sm font-bold"
            >
              <option value="2027">2027</option>
              <option value="2028">2028</option>
              <option value="2029">2029</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Promotion Preview Table</CardTitle>
              <CardDescription>
                Showing {filteredLearners.length} student(s) matching grade "{sourceGrade}" and stream "{sourceStream}".
              </CardDescription>
            </div>
            <div className="text-sm font-bold text-indigo-600">
              {selectedStudentIds.length} Selected
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader className="bg-slate-100/70 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="w-12 py-3 px-3">
                    <Checkbox
                      checked={filteredLearners.length > 0 && selectedStudentIds.length === filteredLearners.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3 px-3">STUDENT NAME</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3 px-3">ADMISSION NO</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3 px-3">CURRENT GRADE/STREAM</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3 px-3">NEXT GRADE (PREVIEW)</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3 px-3">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLearners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                      No students found matching the selected Grade and Stream combination.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLearners.map((learner: any, idx: number) => {
                    const studentKey = learner.id || learner.admissionNumber;
                    const isChecked = selectedStudentIds.includes(studentKey);
                    const currentGrade = learner.grade || learner.class || 'Grade 1';
                    const defaultNext = calculateNextGrade(currentGrade);
                    const nextGrade = targetGradeOverride.trim() ? targetGradeOverride : defaultNext;
                    const isGraduated = nextGrade === 'Graduated';

                    return (
                      <TableRow key={studentKey || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <TableCell className="py-2.5 px-3">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleStudent(studentKey)}
                          />
                        </TableCell>
                        <TableCell className="text-xs md:text-sm font-bold text-slate-900 dark:text-white py-2.5 px-3 whitespace-nowrap">{learner.name || learner.fullName || 'Student'}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground py-2.5 px-3 whitespace-nowrap">{learner.admissionNumber || learner.admNo || 'MUN-000'}</TableCell>
                        <TableCell className="text-xs md:text-sm py-2.5 px-3 font-medium whitespace-nowrap">{currentGrade} {learner.stream ? `— ${learner.stream}` : ''}</TableCell>
                        <TableCell className="text-xs md:text-sm py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>{nextGrade}</span>
                            {!isGraduated && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs py-2.5 px-3 whitespace-nowrap">
                          <Badge variant={isGraduated ? 'secondary' : 'default'} className={isGraduated ? 'bg-amber-100 text-amber-800 font-bold text-[10px]' : 'bg-emerald-100 text-emerald-800 font-bold text-[10px]'}>
                            {isGraduated ? 'Graduated' : 'Eligible for Promotion'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Confirm Student Promotion">
        <div className="space-y-4 pt-2">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900 text-sm text-indigo-900 dark:text-indigo-200">
            You are about to advance <span className="font-bold">{promotionMode === 'selected' ? selectedStudentIds.length : filteredLearners.length}</span> students to academic year <span className="font-bold">{targetYear}</span>.
            {sourceGrade !== 'all' && <span> From grade <span className="font-bold">{sourceGrade}</span></span>}.
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleExecutePromotions}
              disabled={isProcessing}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              {isProcessing ? 'Processing...' : 'Confirm & Promote'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
