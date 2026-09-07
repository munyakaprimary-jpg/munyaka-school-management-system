"use client";

import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showSuccess } from '@/utils/toast';
import PromoteStudentsModal from '@/components/ui/PromoteStudentsModal';

// Modular Components
import PromotionHeader from '@/components/promote/PromotionHeader';
import WarningBanner from '@/components/promote/WarningBanner';
import PromotionStats from '@/components/promote/PromotionStats';
import PromotionFilters from '@/components/promote/PromotionFilters';
import PromotionPreviewTable, { StudentPreview } from '@/components/promote/PromotionPreviewTable';
import PromotionHistoryTable, { PromotionRecord } from '@/components/promote/PromotionHistoryTable';
import SuccessMessage from '@/components/promote/SuccessMessage';

// Types
interface Student {
  id: string;
  name: string;
  grade: string;
  stream: string;
  status: 'Active' | 'Graduated' | 'Archived';
}

// Mock data for students
const MOCK_STUDENTS: Student[] = [
  { id: "1", name: "Brian Kiptoo", grade: "Grade 6", stream: "Blue", status: "Active" },
  { id: "2", name: "Mary Atieno", grade: "Grade 6", stream: "Blue", status: "Active" },
  { id: "3", name: "Emmanuel Maina", grade: "Grade 6", stream: "Green", status: "Active" },
  { id: "4", name: "Sheila Chepkoech", grade: "Grade 5", stream: "Alpha", status: "Active" },
  { id: "5", name: "David Mutua", grade: "Grade 5", stream: "Alpha", status: "Active" },
  { id: "6", name: "Grace Wanjiku", grade: "Grade 4", stream: "Beta", status: "Active" },
  { id: "7", name: "Joseph Kariuki", grade: "Grade 4", stream: "Beta", status: "Active" },
  { id: "8", name: "Faith Njeri", grade: "Grade 3", stream: "Alpha", status: "Active" },
  { id: "9", name: "George Ochieng", grade: "Grade 3", stream: "Beta", status: "Active" },
  { id: "10", name: "Helen Moraa", grade: "Grade 2", stream: "Alpha", status: "Active" },
  { id: "11", name: "Samuel Kamau", grade: "Grade 2", stream: "Beta", status: "Active" },
  { id: "12", name: "Winnie Achieng", grade: "Grade 1", stream: "Blue", status: "Active" },
  { id: "13", name: "Peter Odhiambo", grade: "Grade 1", stream: "Green", status: "Active" },
  { id: "14", name: "Jane Mwangi", grade: "Grade PP2", stream: "Yellow", status: "Active" },
  { id: "15", name: "David Maina", grade: "Grade PP1", stream: "Yellow", status: "Active" },
];

const MOCK_STATS = {
  totalStudents: 15,
  activeStudents: 15,
  graduatedStudents: 0,
  studentsByGrade: [
    { grade: "Grade PP1", count: 1 },
    { grade: "Grade PP2", count: 1 },
    { grade: "Grade 1", count: 2 },
    { grade: "Grade 2", count: 2 },
    { grade: "Grade 3", count: 2 },
    { grade: "Grade 4", count: 2 },
    { grade: "Grade 5", count: 2 },
    { grade: "Grade 6", count: 2 },
  ],
  studentsByStream: [
    { stream: "Blue", count: 3 },
    { stream: "Green", count: 2 },
    { stream: "Alpha", count: 3 },
    { stream: "Beta", count: 2 },
    { stream: "Yellow", count: 2 },
  ]
};

const Promote = () => {
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStream, setFilterStream] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [promotionHistory, setPromotionHistory] = useState<PromotionRecord[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Filter students based on search and filters
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = !filterGrade || student.grade === filterGrade;
      const matchesStream = !filterStream || student.stream === filterStream;
      const matchesStatus = !filterStatus || student.status === filterStatus;
      return matchesSearch && matchesGrade && matchesStream && matchesStatus;
    });
  }, [students, searchTerm, filterGrade, filterStream, filterStatus]);

  // Helper functions
  const getNextGrade = (currentGrade: string): string => {
    const gradeMatch = currentGrade.match(/Grade (\d+)/);
    if (gradeMatch) {
      const currentNum = parseInt(gradeMatch[1]);
      return `Grade ${currentNum + 1}`;
    }
    if (currentGrade === "Grade PP2") return "Grade 1";
    if (currentGrade === "Grade PP1") return "Grade PP2";
    return currentGrade;
  };

  const isHighestGrade = (grade: string, highestGrade: string): boolean => {
    const gradeMatch = grade.match(/Grade (\d+)/);
    const highestMatch = highestGrade.match(/Grade (\d+)/);
    
    if (gradeMatch && highestMatch) {
      const currentNum = parseInt(gradeMatch[1]);
      const highestNum = parseInt(highestMatch[1]);
      return currentNum >= highestNum;
    }
    return false;
  };

  const getHighestGrade = (): string => {
    const maxGrade = Math.max(...students.map(s => {
      const match = s.grade.match(/Grade (\d+)/);
      return match ? parseInt(match[1]) : 0;
    }));
    return `Grade ${maxGrade}`;
  };

  // Generate promotion preview
  const getPromotionPreview = (): StudentPreview[] => {
    const highestGrade = getHighestGrade();
    return students.map(student => {
      const nextGrade = getNextGrade(student.grade);
      const isHighest = isHighestGrade(student.grade, highestGrade);
      return {
        ...student,
        nextGrade,
        isHighest,
        status: isHighest ? 'Graduated' : student.status
      };
    });
  };

  // Handle promotion execution
  const handlePromoteStudents = (promotedStudents: Student[]) => {
    setStudents(promotedStudents);
    
    // Add to promotion history
    const promotionRecord: PromotionRecord = {
      id: `PROM-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      promotedBy: "System Admin",
      totalPromoted: promotedStudents.length,
      newGrades: promotedStudents.map(s => ({
        student: s.name,
        from: s.grade,
        to: getNextGrade(s.grade)
      }))
    };
    
    setPromotionHistory([promotionRecord, ...promotionHistory]);
    setShowSuccessMessage(true);
    
    // Hide success message after 5 seconds
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  // Get promotion preview data
  const promotionPreview = getPromotionPreview();

  // Prepare stats data
  const statsData = {
    totalStudents: MOCK_STATS.totalStudents,
    activeStudents: MOCK_STATS.activeStudents,
    graduatedStudents: MOCK_STATS.graduatedStudents,
    highestGrade: getHighestGrade()
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-3 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Success Message */}
      <SuccessMessage visible={showSuccessMessage} />

      {/* Header */}
      <PromotionHeader onPromoteClick={() => setIsPromoteModalOpen(true)} />

      {/* Warning Banner */}
      <WarningBanner />

      {/* Tabs for Preview and History */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-full overflow-x-hidden">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-12 mb-8 flex-wrap">
          <TabsTrigger value="preview" className="rounded-xl px-8 h-full font-bold text-xs">Promotion Preview</TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl px-8 h-full font-bold text-xs">Promotion History</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-8">
          {/* Statistics Cards */}
          <PromotionStats stats={statsData} />

          {/* Filters */}
          <PromotionFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterGrade={filterGrade}
            onGradeChange={setFilterGrade}
            filterStream={filterStream}
            onStreamChange={setFilterStream}
            filterStatus={filterStatus}
            onStatusChange={setFilterStatus}
            grades={MOCK_STATS.studentsByGrade}
            streams={MOCK_STATS.studentsByStream}
          />

          {/* Promotion Preview Table */}
          <PromotionPreviewTable students={promotionPreview} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <PromotionHistoryTable history={promotionHistory} />
        </TabsContent>
      </Tabs>

      {/* Promote Students Modal */}
      <PromoteStudentsModal
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        students={filteredStudents}
        onPromote={handlePromoteStudents}
        highestGrade={getHighestGrade()}
      />
    </div>
  );
};

export default Promote;