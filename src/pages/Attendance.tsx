"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { showSuccess } from '@/utils/toast';
import AttendanceHeader from '@/components/attendance/AttendanceHeader';
import AttendanceStats from '@/components/attendance/AttendanceStats';
import AttendanceTable from '@/components/attendance/AttendanceTable';
import { useAttendance } from '@/hooks/useAttendance';
import { useGradesStreams } from '@/hooks/useGradesStreams';
import { downloadCSV } from '@/utils/downloadHelper';

const Attendance = () => {
  const { grades, isLoading } = useGradesStreams();
  // Default to first grade
  const [selectedGradeId, setSelectedGradeId] = useState(grades[0]?.id || "");
  const [isExporting, setIsExporting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // The hook now handles dynamic filtering based on the selectedGradeId
  const { students, markedStudents, markAttendance, exportToCSV } = useAttendance(selectedGradeId);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      exportToCSV();
      setIsExporting(false);
      showSuccess(`Attendance register exported successfully!`);
    }, 500);
  };

  const handleSave = () => {
    setIsEditing(false);
    showSuccess("Attendance register saved successfully!");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 table-scroll-viewport">
      <AttendanceHeader 
        selectedGradeId={selectedGradeId}
        setSelectedGradeId={setSelectedGradeId}
        isExporting={isExporting}
        onExport={handleExport}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
      />

      {students.length > 0 ? (
        <>
          <AttendanceStats 
            students={students}
            markedStudents={markedStudents}
          />

          <AttendanceTable 
            students={students}
            markedStudents={markedStudents}
            onMarkAttendance={markAttendance}
            isEditing={isEditing}
          />
          
          <div className="flex justify-end">
            {isEditing && (
              <Button 
                size="lg" 
                className="rounded-2xl px-12 h-14 font-black shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-95" 
                onClick={handleSave}
              >
                Save Changes
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
          <p className="text-slate-400 font-bold">No learners registered for the selected grade level.</p>
        </div>
      )}
    </div>
  );
};

export default Attendance;