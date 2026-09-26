import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSchoolStore } from '@/store/useSchoolStore';
import { showSuccess, showError } from '@/utils/toast';
import { ArrowRight, CheckCircle2, Users, GraduationCap, RefreshCw } from 'lucide-react';
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

  const statsData = {
    totalStudents: learners.length,
    eligibleForPromotion: learners.filter(l => calculateNextGrade(l.grade || l.class) !== 'Graduated').length,
    graduating: learners.filter(l => calculateNextGrade(l.grade || l.class) === 'Graduated').length,
    retained: 0
  };

  const handleExecutePromotions = () => {
    try {
      setIsProcessing(true);
      const updated = learners.map(l => {
        const current = l.grade || l.class || 'Grade 1';
        const next = calculateNextGrade(current);
        return {
          ...l,
          grade: next === 'Graduated' ? current : next,
          status: next === 'Graduated' ? 'Graduated' : 'Active',
          academicYear: targetYear,
          year: targetYear,
          enrollmentYear: targetYear
        };
      });

      saveLearners(updated);
      showSuccess(`Successfully promoted all students to academic year ${targetYear}!`);
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
            onClick={handleExecutePromotions}
            disabled={isProcessing}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-900/20"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Execute Promotions for {targetYear}
          </Button>
        </div>
      </div>

      <PromotionStats stats={statsData} />

      <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Promotion Preview Table</CardTitle>
              <CardDescription>Review projected grade advancement for all registered students.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Year:</span>
              <select
                value={targetYear}
                onChange={(e) => setTargetYear(e.target.value)}
                className="bg-white dark:bg-slate-800 border rounded-xl px-3 py-1.5 text-sm font-bold"
              >
                <option value="2027">2027</option>
                <option value="2028">2028</option>
                <option value="2029">2029</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[650px]">
              <TableHeader className="bg-slate-100/70 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3 px-3 min-w-[150px]">STUDENT NAME</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3 px-3 min-w-[110px]">ADMISSION NO</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3 px-3 min-w-[110px]">CURRENT GRADE</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3 px-3 min-w-[160px]">NEXT GRADE (PREVIEW)</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3 px-3 min-w-[100px]">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {learners.map((learner: any, idx: number) => {
                  const currentGrade = learner.grade || learner.class || 'Grade 1';
                  const nextGrade = calculateNextGrade(currentGrade);
                  const isGraduated = nextGrade === 'Graduated';

                  return (
                    <TableRow key={learner.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <TableCell className="text-xs md:text-sm font-bold text-slate-900 dark:text-white py-2.5 px-3 whitespace-nowrap">{learner.name || learner.fullName || 'Student'}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground py-2.5 px-3 whitespace-nowrap">{learner.admissionNumber || learner.admNo || 'MUN-000'}</TableCell>
                      <TableCell className="text-xs md:text-sm py-2.5 px-3 font-medium whitespace-nowrap">{currentGrade}</TableCell>
                      <TableCell className="text-xs md:text-sm py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{nextGrade}</span>
                          {!isGraduated && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs py-2.5 px-3 whitespace-nowrap">
                        <Badge variant={isGraduated ? 'secondary' : 'default'} className={isGraduated ? 'bg-amber-100 text-amber-800 font-bold text-[10px]' : 'bg-emerald-100 text-emerald-800 font-bold text-[10px]'}>
                          {isGraduated ? 'Graduated' : 'Active'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
