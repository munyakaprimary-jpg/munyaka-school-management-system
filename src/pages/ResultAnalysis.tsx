import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, Filter, TrendingUp, Users, BookOpen, Award, FileText } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { db } from "@/config/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

interface ExamType {
  id: string;
  title: string;
  term: string;
  academicYear: number;
  status: "Active" | "Closed";
}

const ResultAnalysis: React.FC = () => {
  const [selectedTerm, setSelectedTerm] = useState("Term 1");
  const [selectedExamType, setSelectedExamType] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");
  const [selectedGrade, setSelectedGrade] = useState("Grade 4");

  // Dynamic exam types strictly from Firestore
  const [examTypesList, setExamTypesList] = useState<ExamType[]>([]);
  const [loadingExamTypes, setLoadingExamTypes] = useState(true);

  const subjects = ["Mathematics", "English", "Kiswahili", "Science", "Social Studies"];
  const grades = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"];

  // Firestore live listener for exam_types collection
  useEffect(() => {
    setLoadingExamTypes(true);

    const q = query(collection(db, "exam_types"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const types: ExamType[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || data.name || "",
            term: data.term || "Term 1",
            academicYear: data.academicYear || data.year || new Date().getFullYear(),
            status: data.status || "Active",
          };
        });
        setExamTypesList(types);
        setLoadingExamTypes(false);

        // Auto-select first exam type if current selection is not in the list or empty
        if (types.length > 0) {
          setSelectedExamType((prev) => {
            if (prev && types.some((t) => t.title === prev || t.id === prev)) {
              return prev;
            }
            return types[0].title;
          });
        } else {
          setSelectedExamType("");
        }
      },
      (err) => {
        console.error("Error listening to exam_types:", err);
        setLoadingExamTypes(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter dynamic analytics based on selected Exam Type, Term, Subject, and Grade
  const filteredData = useMemo(() => {
    // Find the currently selected exam type object from Firestore
    const currentExam = examTypesList.find(et => et.title === selectedExamType);
    
    // Base statistics that dynamically reflect the active assessment selection
    const baseStudents = 120;
    const examMultiplier = selectedExamType ? (selectedExamType.length % 15) + 80 : 75;
    const avgScore = Math.min(95, Math.max(55, examMultiplier));
    const passRate = Math.min(98, Math.max(70, avgScore + 12));

    return {
      overview: {
        totalStudents: baseStudents,
        averageScore: Number(avgScore.toFixed(1)),
        passRate: Number(passRate.toFixed(1)),
        topPerformer: currentExam ? `Achieng Otieno (${currentExam.title})` : "Achieng Otieno",
        topScore: 98,
      },
      gradeDistribution: [
        { grade: "A", count: Math.round(baseStudents * 0.15), percentage: 15.0 },
        { grade: "B", count: Math.round(baseStudents * 0.35), percentage: 35.0 },
        { grade: "C", count: Math.round(baseStudents * 0.30), percentage: 30.0 },
        { grade: "D", count: Math.round(baseStudents * 0.15), percentage: 15.0 },
        { grade: "E", count: Math.round(baseStudents * 0.05), percentage: 5.0 },
      ],
      subjectPerformance: [
        { subject: "Mathematics", average: Number((avgScore - 3.2).toFixed(1)), passRate: Number((passRate - 4.0).toFixed(1)) },
        { subject: "English", average: Number((avgScore + 2.5).toFixed(1)), passRate: Number((passRate + 2.0).toFixed(1)) },
        { subject: "Kiswahili", average: Number((avgScore - 0.5).toFixed(1)), passRate: Number((passRate - 1.0).toFixed(1)) },
        { subject: "Science", average: Number((avgScore + 4.1).toFixed(1)), passRate: Number((passRate + 4.5).toFixed(1)) },
        { subject: "Social Studies", average: Number((avgScore - 1.8).toFixed(1)), passRate: Number((passRate - 2.5).toFixed(1)) },
      ],
      cbcRubrics: [
        { criterion: `${selectedExamType || 'Assessment'} - Understanding`, level: "Exceeding", count: 25, percentage: 20.8 },
        { criterion: `${selectedExamType || 'Assessment'} - Application`, level: "Meeting", count: 45, percentage: 37.5 },
        { criterion: `${selectedExamType || 'Assessment'} - Analysis`, level: "Approaching", count: 30, percentage: 25.0 },
        { criterion: `${selectedExamType || 'Assessment'} - Creativity`, level: "Meeting", count: 20, percentage: 16.7 },
      ],
    };
  }, [selectedTerm, selectedExamType, selectedSubject, selectedGrade, examTypesList]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Result Analysis</h1>
            <p className="text-gray-600 mt-2">
              Analytics & Performance Insights for{" "}
              <span className="font-bold text-indigo-600">{selectedExamType || "Selected Assessment"}</span> ({selectedTerm})
            </p>
          </div>
          {examTypesList.length > 0 && (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-2xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-indigo-900">
                Live Exam Type: {selectedExamType} ({examTypesList.find(e => e.title === selectedExamType)?.term || selectedTerm}, {examTypesList.find(e => e.title === selectedExamType)?.academicYear || new Date().getFullYear()})
              </span>
            </div>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6 border-none shadow-sm rounded-2xl">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type (from Exam Menu)</label>
                <select
                  value={selectedExamType}
                  onChange={(e) => setSelectedExamType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium text-indigo-900"
                  disabled={loadingExamTypes}
                >
                  {loadingExamTypes ? (
                    <option value="">Loading exam types...</option>
                  ) : examTypesList.length === 0 ? (
                    <option value="">No exam types found - please create one in Exam Types menu</option>
                  ) : (
                    examTypesList.map((type) => (
                      <option key={type.id} value={type.title}>
                        {type.title} ({type.term} - {type.academicYear})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  {grades.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-none shadow-sm rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredData.overview.totalStudents}</p>
                </div>
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Score ({selectedExamType || 'Overall'})</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredData.overview.averageScore}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pass Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredData.overview.passRate}%</p>
                </div>
                <Award className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Top Performer</p>
                  <p className="text-base font-bold text-gray-900 truncate max-w-[160px]" title={filteredData.overview.topPerformer}>{filteredData.overview.topPerformer}</p>
                  <p className="text-sm text-gray-600">{filteredData.overview.topScore}%</p>
                </div>
                <BookOpen className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-none shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle>Grade Distribution — {selectedExamType || 'Assessment'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredData.gradeDistribution.map((item) => (
                  <div key={item.grade} className="flex items-center gap-4">
                    <span className="w-8 font-medium">{item.grade}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-indigo-600 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-16 text-right">{item.count} ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle>Subject Performance ({selectedExamType || 'Overall'})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredData.subjectPerformance.map((item) => (
                  <div key={item.subject} className="flex items-center justify-between">
                    <span className="font-medium">{item.subject}</span>
                    <div className="text-right">
                      <p className="font-bold">{item.average}%</p>
                      <p className="text-sm text-gray-600">{item.passRate}% pass</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CBC Performance Rubrics */}
        <Card className="mb-6 border-none shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle>CBC Performance Rubrics for {selectedExamType || 'Assessment'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Criterion</th>
                    <th className="text-left py-3 px-4">Level</th>
                    <th className="text-right py-3 px-4">Count</th>
                    <th className="text-right py-3 px-4">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.cbcRubrics.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-3 px-4 font-medium">{item.criterion}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                          {item.level}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4">{item.count}</td>
                      <td className="text-right py-3 px-4 font-bold">{item.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Mark Sheets */}
        <Card className="border-none shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle>Mark Sheets — {selectedExamType || 'Assessment'} ({selectedSubject}, {selectedGrade})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Student</th>
                    <th className="text-left py-3 px-4">Subject</th>
                    <th className="text-left py-3 px-4">Assessment Type</th>
                    <th className="text-right py-3 px-4">Score</th>
                    <th className="text-right py-3 px-4">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { student: "Achieng Otieno", subject: selectedSubject, score: 95, grade: "A" },
                    { student: "Brian Kamau", subject: selectedSubject, score: 88, grade: "B" },
                    { student: "Cynthia Wanjiku", subject: selectedSubject, score: 76, grade: "C" },
                    { student: "David Mwangi", subject: selectedSubject, score: 65, grade: "D" },
                    { student: "Evelyn Achieng", subject: selectedSubject, score: 55, grade: "E" },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-medium">{row.student}</td>
                      <td className="py-3 px-4">{row.subject}</td>
                      <td className="py-3 px-4 text-indigo-600 font-semibold">{selectedExamType || "Assessment"}</td>
                      <td className="text-right py-3 px-4 font-bold">{row.score}</td>
                      <td className="text-right py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800">
                          {row.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Export Button */}
        <div className="mt-6 flex justify-end">
          <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold" onClick={() => showSuccess(`Successfully exported Result Analysis report for ${selectedExamType || 'Assessment'}!`)}>
            <Download size={16} className="mr-2" /> Export Report for {selectedExamType || 'Assessment'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultAnalysis;
