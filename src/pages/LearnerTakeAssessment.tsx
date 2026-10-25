"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, CheckCircle2, Clock, Award, ArrowRight, Play, AlertCircle, RotateCcw } from "lucide-react";
import { showSuccess, showError } from '@/utils/toast';

interface Assessment {
  id: string;
  title: string;
  subject: string;
  grade: string;
  durationMinutes: number;
  questionsCount: number;
  questions: {
    id: string;
    text: string;
    options: string[];
    correctAnswer: number;
    points: number;
  }[];
}

const SAMPLE_ASSESSMENTS: Assessment[] = [
  {
    id: 'asm-1',
    title: 'Grade 5 Mathematics - Term 1 End Assessment',
    subject: 'Mathematics',
    grade: 'Grade 5',
    durationMinutes: 15,
    questionsCount: 5,
    questions: [
      {
        id: 'q1',
        text: 'What is the place value of digit 7 in the number 478,321?',
        options: ['Thousands', 'Ten Thousands', 'Hundreds', 'Millions'],
        correctAnswer: 1,
        points: 20
      },
      {
        id: 'q2',
        text: 'Evaluate: 456 + 289 - 145',
        options: ['590', '600', '612', '585'],
        correctAnswer: 1,
        points: 20
      },
      {
        id: 'q3',
        text: 'What is 3/4 expressed as a percentage?',
        options: ['25%', '50%', '75%', '100%'],
        correctAnswer: 2,
        points: 20
      },
      {
        id: 'q4',
        text: 'Calculate the perimeter of a square with side length 12 cm.',
        options: ['24 cm', '48 cm', '144 cm', '36 cm'],
        correctAnswer: 1,
        points: 20
      },
      {
        id: 'q5',
        text: 'If a pen costs Ksh 45, how much will 6 such pens cost?',
        options: ['Ksh 250', 'Ksh 270', 'Ksh 300', 'Ksh 240'],
        correctAnswer: 1,
        points: 20
      }
    ]
  },
  {
    id: 'asm-2',
    title: 'Integrated Science & Environment - CBC Quiz',
    subject: 'Science',
    grade: 'Grade 5',
    durationMinutes: 10,
    questionsCount: 4,
    questions: [
      {
        id: 'sq1',
        text: 'Which of the following is a non-flowering plant?',
        options: ['Maize', 'Pine tree', 'Bean plant', 'Rose flower'],
        correctAnswer: 1,
        points: 25
      },
      {
        id: 'sq2',
        text: 'What gas do plants absorb from the atmosphere during photosynthesis?',
        options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'],
        correctAnswer: 1,
        points: 25
      },
      {
        id: 'sq3',
        text: 'Which part of the digestive system absorbs water and mineral salts?',
        options: ['Stomach', 'Small intestine', 'Large intestine', 'Mouth'],
        correctAnswer: 2,
        points: 25
      },
      {
        id: 'sq4',
        text: 'Which of these is a renewable source of energy?',
        options: ['Coal', 'Petroleum', 'Solar energy', 'Natural gas'],
        correctAnswer: 2,
        points: 25
      }
    ]
  },
  {
    id: 'asm-3',
    title: 'English Language & Grammar Mastery',
    subject: 'English',
    grade: 'Grade 5',
    durationMinutes: 10,
    questionsCount: 3,
    questions: [
      {
        id: 'eq1',
        text: 'Choose the correct plural form of "child":',
        options: ['Childs', 'Children', 'Childes', 'Childrens'],
        correctAnswer: 1,
        points: 33
      },
      {
        id: 'eq2',
        text: 'Identify the adverb in the sentence: "The diligent learner wrote neatly."',
        options: ['learner', 'wrote', 'diligent', 'neatly'],
        correctAnswer: 3,
        points: 33
      },
      {
        id: 'eq3',
        text: 'What is the past tense of "run"?',
        options: ['ran', 'running', 'runs', 'runned'],
        correctAnswer: 0,
        points: 34
      }
    ]
  }
];

export default function LearnerTakeAssessment({ studentName }: { studentName?: string }) {
  const [assessments, setAssessments] = useState<Assessment[]>(SAMPLE_ASSESSMENTS);
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState<{ score: number; total: number; percentage: number } | null>(null);

  // Load any created exams from localStorage if available
  useEffect(() => {
    try {
      const savedExams = localStorage.getItem('munyaka_set_exams');
      if (savedExams) {
        const parsed = JSON.parse(savedExams);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Map to format if needed
          const formatted = parsed.map((e: any, i: number) => ({
            id: e.id || `custom-${i}`,
            title: e.title || e.examName || 'Custom Assessment',
            subject: e.subject || 'General',
            grade: e.grade || 'Grade 5',
            durationMinutes: 15,
            questionsCount: e.questions?.length || 3,
            questions: (e.questions || [
              { id: 'q1', text: e.description || 'Sample Question', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 0, points: 100 }
            ]).map((q: any, qIdx: number) => ({
              id: q.id || `q-${qIdx}`,
              text: q.text || q.question || 'Sample Question',
              options: q.options || ['A', 'B', 'C', 'D'],
              correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
              points: Math.round(100 / (e.questions?.length || 1))
            }))
          }));
          setAssessments([...SAMPLE_ASSESSMENTS, ...formatted]);
        }
      }
    } catch {}
  }, []);

  const handleStartAssessment = (asm: Assessment) => {
    setActiveAssessment(asm);
    setCurrentQuestionIdx(0);
    setAnswers({});
    setIsSubmitted(false);
    setScoreResult(null);
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = () => {
    if (!activeAssessment) return;

    let earnedPoints = 0;
    let totalPoints = 0;

    activeAssessment.questions.forEach((q) => {
      totalPoints += q.points;
      if (answers[q.id] === q.correctAnswer) {
        earnedPoints += q.points;
      }
    });

    const percentage = Math.round((earnedPoints / (totalPoints || 1)) * 100);
    setScoreResult({ score: earnedPoints, total: totalPoints, percentage });
    setIsSubmitted(true);
    showSuccess(`Assessment completed! Score: ${percentage}%`);

    // Save to student assessment records in storage
    try {
      const history = JSON.parse(localStorage.getItem('munyaka_assessment_submissions') || '[]');
      history.unshift({
        id: 'sub-' + Date.now(),
        studentName: studentName || 'Learner',
        assessmentTitle: activeAssessment.title,
        subject: activeAssessment.subject,
        score: percentage,
        submittedAt: new Date().toISOString()
      });
      localStorage.setItem('munyaka_assessment_submissions', JSON.stringify(history));
    } catch {}
  };

  if (activeAssessment && !isSubmitted) {
    const q = activeAssessment.questions[currentQuestionIdx];
    return (
      <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-700 to-indigo-800 rounded-[2.5rem] p-6 md:p-8 text-white shadow-xl flex items-center justify-between">
          <div>
            <Badge className="bg-white/20 text-white border-transparent font-bold mb-2">{activeAssessment.subject} • {activeAssessment.grade}</Badge>
            <h1 className="text-xl md:text-2xl font-black">{activeAssessment.title}</h1>
          </div>
          <Button
            variant="outline"
            className="rounded-2xl border-white/30 text-white bg-white/10 hover:bg-white/20 font-bold"
            onClick={() => setActiveAssessment(null)}
          >
            Exit Assessment
          </Button>
        </div>

        <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-500">
            <span>Question {currentQuestionIdx + 1} of {activeAssessment.questions.length}</span>
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full">
              <Clock size={14} /> Active Timed Quiz
            </span>
          </div>

          <div className="space-y-6 mb-8">
            <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-snug">
              {q.text}
            </h3>

            <div className="space-y-3">
              {q.options.map((opt, optIdx) => {
                const isSelected = answers[q.id] === optIdx;
                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(q.id, optIdx)}
                    className={`w-full text-left p-4 rounded-2xl border-2 font-bold text-sm transition-all flex items-center gap-4 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              disabled={currentQuestionIdx === 0}
              onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
              className="rounded-2xl font-bold px-6"
            >
              Previous
            </Button>

            {currentQuestionIdx < activeAssessment.questions.length - 1 ? (
              <Button
                onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-600/25 gap-2"
              >
                Next Question <ArrowRight size={16} />
              </Button>
            ) : (
              <Button
                onClick={handleSubmitQuiz}
                className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 shadow-lg shadow-emerald-600/25 gap-2"
              >
                Submit Assessment <CheckCircle2 size={16} />
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (isSubmitted && scoreResult && activeAssessment) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl mx-auto text-center">
        <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-10 space-y-6">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Award size={40} />
          </div>

          <div>
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-4 py-1 mb-2">Assessment Completed Successfully</Badge>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{activeAssessment.title}</h1>
            <p className="text-slate-500 text-sm mt-1">Great effort, {studentName || 'Learner'}!</p>
          </div>

          <div className="grid grid-cols-3 gap-4 p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 max-w-lg mx-auto">
            <div>
              <div className="text-xs font-bold uppercase text-slate-400">Total Score</div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{scoreResult.score} / {scoreResult.total}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase text-slate-400">Percentage</div>
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{scoreResult.percentage}%</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase text-slate-400">Grade</div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {scoreResult.percentage >= 80 ? 'Exceeding' : scoreResult.percentage >= 60 ? 'Meeting' : 'Approaching'}
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <Button
              onClick={() => setActiveAssessment(null)}
              className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-600/25 gap-2"
            >
              <RotateCcw size={16} /> Return to Assessments List
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-700 to-indigo-800 rounded-[2.5rem] p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-md">
            <ClipboardList size={14} />
            CBC Learner Assessments
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">Interactive Quiz & Assessment Center</h1>
          <p className="text-indigo-100 text-sm max-w-xl">
            Test your knowledge with teacher-assigned quizzes, formative assessments, and practice exams for {studentName || 'Learner'}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assessments.map((asm) => (
          <Card key={asm.id} className="rounded-[2rem] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">{asm.subject}</Badge>
                <span className="text-xs font-bold text-slate-400">{asm.grade}</span>
              </div>
              <h3 className="font-black text-slate-900 dark:text-white text-lg leading-snug">{asm.title}</h3>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1"><Clock size={14} /> {asm.durationMinutes} mins</span>
                <span className="flex items-center gap-1"><ClipboardList size={14} /> {asm.questionsCount} Questions</span>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
              <Button
                onClick={() => handleStartAssessment(asm)}
                className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/20 gap-2"
              >
                <Play size={16} /> Take Assessment Now
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
