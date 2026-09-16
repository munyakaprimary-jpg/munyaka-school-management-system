"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showSuccess } from '@/utils/toast';
import PromoteStudentsModal from '@/components/ui/PromoteStudentsModal';
import { getStudents, setStudents as saveStudentsToStore } from '@/services/persistentStore';
import { CentralDataService } from '@/services/centralDataService';

// Modular Components
import PromotionHeader from '@/components/promote/PromotionHeader';
import WarningBanner from '@/components/promote/WarningBanner';
import PromotionStats from '@/components/promote/PromotionStats';
import PromotionFilters from '@/components/promote/PromotionFilters';
import PromotionPreviewTable, { StudentPreview } from '@/components/promote/PromotionPreviewTable';
import PromotionHistoryTable, { PromotionRecord } from '@/components/promote/PromotionHistoryTable';
import SuccessMessage from '@/components/promote/SuccessMessage';

interface Student {
  id: string;
  name: string;
  grade: string;
  stream: string;
  status: 'Active' | 'Graduated' | 'Archived';
  [key: string]: any;
}

const HISTORY_STORAGE_KEY = 'munyaka_promotion_history';

const Promote = () => {
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const raw = getStudents();
      if (Array.isArray(raw) && raw.length > 0) {
        return raw.map((s: any) => ({
          id: s.id || String(Math.random()),
          name: s.name || 'Unnamed Learner',
          grade: s.grade || 'Grade 1',
          stream: s.stream || 'Blue',
          status: s.status || 'Active'
        }));
      }
    } catch {}
    return [];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStream, setFilterStream] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  
  const [promotionHistory, setPromotionHistory] = useState<PromotionRecord[]>(() => {
    try {
      const central = CentralDataService.getData<PromotionRecord[]>(HISTORY_STORAGE_KEY, []);
      if (central && Array.isArray(central)) return central;
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    try {
      CentralDataService.setData(HISTORY_STORAGE_KEY, promotionHistory);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(promotionHistory));
    } catch {}
  }, [promotionHistory]);

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
    if (students.length === 0) return 'Grade 6';
    const maxGrade = Math.max(...students.map(s => {
      const match = s.grade.match(/Grade (\d+)/);
      return match ? parseInt(match[1]) : 0;
    }));
    return `Grade ${maxGrade > 0 ? maxGrade : 6}`;
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
    try {
      saveStudentsToStore(promotedStudents);
    } catch {}
    
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
    
    const updatedHistory = [promotionRecord, ...promotionHistory];
    setPromotionHistory(updatedHistory);
    setShowSuccessMessage(true);
    showSuccess("Students promoted successfully in permanent storage!");
    
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const promotionPreview = getPromotionPreview();

  const statsData = useMemo(() => {
    const active = students.filter(s => s.status === 'Active').length;
    const graduated = students.filter(s => s.status === 'Graduated').length;
    return {
      totalStudents: students.length,
      activeStudents: active,
      graduatedStudents: graduated,
      highestGrade: getHighestGrade()
    };
  }, [students]);

  const gradeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    students.forEach(s => {
      map[s.grade] = (map[s.grade] || 0) + 1;
    });
    return Object.keys(map).map(grade => ({ grade, count: map[grade] }));
  }, [students]);

  const streamCounts = useMemo(() => {
    const map: Record<string, number> = {};
    students.forEach(s => {
      if (s.stream) map[s.stream] = (map[s.stream] || 0) + 1;
    });
    return Object.keys(map).map(stream => ({ stream, count: map[stream] }));
  }, [students]);

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-3 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <SuccessMessage visible={showSuccessMessage} />

      <PromotionHeader onPromoteClick={() => setIsPromoteModalOpen(true)} />

      <WarningBanner />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-full overflow-x-hidden">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-12 mb-8 flex-wrap">
          <TabsTrigger value="preview" className="rounded-xl px-8 h-full font-bold text-xs">Promotion Preview</TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl px-8 h-full font-bold text-xs">Promotion History</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-8">
          <PromotionStats stats={statsData} />

          <PromotionFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterGrade={filterGrade}
            onGradeChange={setFilterGrade}
            filterStream={filterStream}
            onStreamChange={setFilterStream}
            filterStatus={filterStatus}
            onStatusChange={setFilterStatus}
            grades={gradeCounts}
            streams={streamCounts}
          />

          <PromotionPreviewTable students={promotionPreview} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <PromotionHistoryTable history={promotionHistory} />
        </TabsContent>
      </Tabs>

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