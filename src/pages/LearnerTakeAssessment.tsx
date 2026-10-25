"use client";

import React, { useState, useEffect } from 'react';

export default function LearnerTakeAssessment() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [scoreResult, setScoreResult] = useState<{ score: number; total: number } | null>(null);

  const activeLearner = JSON.parse(localStorage.getItem('active_learner_session') || '{}');
  const learnerGrade = activeLearner.gradeLevel || activeLearner.grade || 'Grade 6';

  const loadAssessments = () => {
    // Pull strictly from real created exam bank storage (NO mock fallbacks)
    const savedExams = JSON.parse(localStorage.getItem('munyaka_assessments') || localStorage.getItem('munyaka_exams_bank') || '[]');

    const filtered = savedExams.filter((exam: any) => {
      const targetGrade = (exam.grade || exam.targetGrade || '').trim().toLowerCase();
      const currentGrade = learnerGrade.trim().toLowerCase();
      return !targetGrade || targetGrade === 'all' || targetGrade === currentGrade || targetGrade.includes(currentGrade);
    });

    setAssessments(filtered);
  };

  useEffect(() => {
    loadAssessments();
    window.addEventListener('storage', loadAssessments);
    return () => window.removeEventListener('storage', loadAssessments);
  }, [learnerGrade]);

  const handleOptionSelect = (qIdx: number, option: string) => {
    setAnswers(prev => ({ ...prev, [qIdx]: option }));
  };

  const handleSubmitAssessment = () => {
    if (!selectedExam) return;

    let correctScore = 0;
    selectedExam.questions?.forEach((q: any, idx: number) => {
      if (answers[idx] === q.correctAnswer || (q.options && typeof q.correctAnswer === 'number' && answers[idx] === q.options[q.correctAnswer])) {
        correctScore++;
      }
    });

    const resultRecord = {
      examId: selectedExam.id,
      title: selectedExam.title,
      learnerName: activeLearner.fullName || 'Learner',
      grade: learnerGrade,
      score: correctScore,
      total: selectedExam.questions?.length || 0,
      submittedAt: new Date().toISOString()
    };

    const history = JSON.parse(localStorage.getItem('munyaka_completed_assessments') || '[]');
    localStorage.setItem('munyaka_completed_assessments', JSON.stringify([resultRecord, ...history]));

    setScoreResult({ score: correctScore, total: selectedExam.questions?.length || 0 });
    setIsSubmitted(true);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Portal Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
          {activeLearner.fullName || 'Learner Portal'} • {learnerGrade}
        </span>
        <h1 className="text-2xl font-bold mt-1">Take Assessment & Exams</h1>
        <p className="text-indigo-200 text-sm mt-1">
          Complete exams assigned by your teachers.
        </p>
      </div>

      {selectedExam ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-4">
            <div>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-full">
                {selectedExam.subject || 'CBC Assessment'}
              </span>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{selectedExam.title}</h2>
            </div>
            <button
              onClick={() => { setSelectedExam(null); setIsSubmitted(false); setScoreResult(null); setAnswers({}); }}
              className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors"
            >
              Back to List
            </button>
          </div>

          {isSubmitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                ✓
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Assessment Submitted!</h3>
              <p className="text-gray-600 dark:text-slate-300 text-base">
                Your score: <strong className="text-indigo-600 dark:text-indigo-400">{scoreResult?.score}</strong> / <strong className="text-gray-900 dark:text-white">{scoreResult?.total}</strong>
              </p>
              <button
                onClick={() => { setSelectedExam(null); setIsSubmitted(false); setScoreResult(null); setAnswers({}); }}
                className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm"
              >
                Return to Assessments
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {selectedExam.questions?.map((q: any, qIdx: number) => (
                <div key={qIdx} className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 space-y-3">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {qIdx + 1}. {q.questionText || q.text}
                  </p>
                  <div className="space-y-2">
                    {q.options?.map((opt: string, optIdx: number) => (
                      <label key={optIdx} className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30">
                        <input
                          type="radio"
                          name={`question-${qIdx}`}
                          checked={answers[qIdx] === opt}
                          onChange={() => handleOptionSelect(qIdx, opt)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-slate-300">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={handleSubmitAssessment}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-colors"
              >
                Submit Assessment
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Render strictly real exams, or display NOTHING if empty */
        <div className="space-y-4">
          {assessments.length === 0 ? null : (
            assessments.map((exam) => (
              <div key={exam.id || Math.random()} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-full">
                    {exam.subject || 'Assessment'} • {exam.grade || learnerGrade}
                  </span>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">{exam.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{exam.questions?.length || 0} Questions</p>
                </div>
                <button
                  onClick={() => setSelectedExam(exam)}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 shadow-sm transition-colors"
                >
                  Take Assessment
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
