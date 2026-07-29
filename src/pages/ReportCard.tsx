"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, UserPlus, X } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import BackButton from '@/components/ui/BackButton';
import FilterBar from '@/components/reportcard/FilterBar';
import LearnerCard from '@/components/reportcard/LearnerCard';
import ReportCardModal from '@/components/reportcard/ReportCardModal';
import { GRADES, STREAMS, LEARNERS, Grade, Stream, Learner } from '@/lib/reportcard-data';

const ReportCard = () => {
  const [students, setStudents] = useState<Learner[]>(LEARNERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedStream, setSelectedStream] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Learner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter students based on search, grade, and stream
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = !selectedGrade || student.gradeId === selectedGrade;
      const matchesStream = !selectedStream || student.streamId === selectedStream;
      return matchesSearch && matchesGrade && matchesStream;
    });
  }, [students, searchTerm, selectedGrade, selectedStream]);

  const handleGenerateReport = (student: Learner) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const handleGradeChange = (gradeId: string) => {
    setSelectedGrade(gradeId);
    setSelectedStream('');
  };

  const handleStreamChange = (streamId: string) => {
    setSelectedStream(streamId);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Report Card Generator</h1>
            <p className="text-muted-foreground">Generate and manage learner report cards</p>
          </div>
        </div>
      </div>

      <FilterBar
        onGradeChange={handleGradeChange}
        onStreamChange={handleStreamChange}
        onSearchChange={handleSearchChange}
        selectedGrade={selectedGrade}
        selectedStream={selectedStream}
        searchTerm={searchTerm}
      />

      <Card className="border-none shadow-sm rounded-3xl bg-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <LearnerCard
                key={student.id}
                learner={student}
                onGenerateReport={() => handleGenerateReport(student)}
                onViewReport={() => handleGenerateReport(student)}
              />
            ))
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                <Plus size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No learners found</h3>
              <p className="text-slate-400 max-w-xs mx-auto">
                Adjust filters or search to find learners.
              </p>
            </div>
          )}
        </div>
      </Card>

      {selectedStudent && (
        <ReportCardModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          learner={selectedStudent}
        />
      )}
    </div>
  );
};

export default ReportCard;