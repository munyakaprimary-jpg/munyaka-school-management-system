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

  // Mock data for demonstration
  const mockData = useMemo(() => {
    return {
      overview: {
        totalStudents: 120,
        averageScore: 72.5,
        passRate: 85.0,
        topPerformer: "Achieng Otieno",
        topScore: 98,
      },
      gradeDistribution: [
        { grade: "A", count: 15, percentage: 12.5 },
        { grade: "B", count: 35, percentage: 29.2 },
        { grade: "C", count: 45, percentage: 37.5 },
        { grade: "D", count: 20, percentage: 16.7 },
        { grade: "E", count: 5, percentage: 4.2 },
      ],
      subjectPerformance: [
        { subject: "Mathematics", average: 68.5, passRate: 82.0 },
        { subject: "English", average: 75.2, passRate: 88.5 },
        { subject: "Kiswahili", average: 71.8, passRate: 85.0 },
        { subject: "Science", average: 78.3, passRate: 91.2 },
        { subject: "Social Studies", average: 69.4, passRate: 80.5 },
      ],
      cbcRubrics: [
        { criterion: "Understanding", level: "Exceeding", count: 25, percentage: 20.8 },
        { criterion: "Application", level: "Meeting", count: 45, percentage: 37.5 },
        { criterion: "Analysis", level: "Approaching", count: 30, percentage: 25.0 },
        { criterion: "Creativity", level: "Meeting", count: 20, percentage: 16.7 },
      ],
    };
  }, []);

  // Filter data based on selected exam type
  const filteredData = useMemo(() => {
    return mockData;
  }, [selectedTerm, selectedExamType, selectedSubject, selectedGrade, mockData]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Result Analysis</h1>
          <p className="text-gray-600 mt-2">Analyze student performance across assessments</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                <select
                  value={selectedExamType}
                  onChange={(e) => setSelectedExamType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={loadingExamTypes}
                >
                  {loadingExamTypes ? (
                    <option value="">Loading exam types...</option>
                  ) : examTypesList.length === 0 ? (
                    <option value="">No exam types found - please create one</option>
                  ) : (
                    examTypesList.map((type) => (
                      <option key={type.id} value={type.title}>
                        {type.title}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
          <Card>
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
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredData.overview.averageScore}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
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
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Top Performer</p>
                  <p className="text-lg font-bold text-gray-900">{filteredData.overview.topPerformer}</p>
                  <p className="text-sm text-gray-600">{filteredData.overview.topScore}%</p>
                </div>
                <BookOpen className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredData.gradeDistribution.map((item) => (
                  <div key={item.grade} className="flex items-center gap-4">
                    <span className="w-8 font-medium">{item.grade}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-indigo-600 h-4 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-16 text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance</CardTitle>
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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>CBC Performance Rubrics</CardTitle>
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
                  {filteredData.cbcRubrics.map((item) => (
                    <tr key={item.criterion} className="border-b">
                      <td className="py-3 px-4">{item.criterion}</td>
                      <td className="py-3 px-4">{item.level}</td>
                      <td className="text-right py-3 px-4">{item.count}</td>
                      <td className="text-right py-3 px-4">{item.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Mark Sheets */}
        <Card>
          <CardHeader>
            <CardTitle>Mark Sheets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Student</th>
                    <th className="text-left py-3 px-4">Subject</th>
                    <th className="text-right py-3 px-4">Score</th>
                    <th className="text-right py-3 px-4">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { student: "Achieng Otieno", subject: "Mathematics", score: 95, grade: "A" },
                    { student: "Brian Kamau", subject: "Mathematics", score: 88, grade: "B" },
                    { student: "Cynthia Wanjiku", subject: "Mathematics", score: 76, grade: "C" },
                    { student: "David Mwangi", subject: "Mathematics", score: 65, grade: "D" },
                    { student: "Evelyn Achieng", subject: "Mathematics", score: 55, grade: "E" },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-3 px-4">{row.student}</td>
                      <td className="py-3 px-4">{row.subject}</td>
                      <td className="text-right py-3 px-4">{row.score}</td>
                      <td className="text-right py-3 px-4">{row.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Export Button */}
        <div className="mt-6">
          <Button className="rounded-xl" onClick={() => showSuccess("Report exported successfully!")}>
            <Download size={16} className="mr-2" /> Export Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultAnalysis;
