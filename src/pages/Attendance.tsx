"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { showSuccess } from '@/utils/toast';
import AttendanceHeader from '@/components/attendance/AttendanceHeader';
import AttendanceStats from '@/components/attendance/AttendanceStats';
import AttendanceTable from '@/components/attendance/AttendanceTable';
import { useAttendance } from '@/hooks/useAttendance';

const Attendance = () => {
  const [selectedGrade, setSelectedGrade] = useState("grade4");
  const [isExporting, setIsExporting] = useState(false);
  
  const { students, markedStudents, markAttendance, exportToCSV } = useAttendance();

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      exportToCSV(selectedGrade);
      setIsExporting(false);
      showSuccess(`Attendance register exported successfully!`);
    }, 500);
  };

  const handleSave = () => {
    showSuccess("Attendance register saved successfully!");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <AttendanceHeader 
        selectedGrade={selectedGrade}
        setSelectedGrade={setSelectedGrade}
        isExporting={isExporting}
        onExport={handleExport}
      />

      <AttendanceStats 
        students={students}
        markedStudents={markedStudents}
      />

      <AttendanceTable 
        students={students}
        markedStudents={markedStudents}
        onMarkAttendance={markAttendance}
      />
      
      <div className="flex justify-end">
        <Button size="lg" className="rounded-2xl px-12 h-14 font-black shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700" onClick={handleSave}>
          Save Register
        </Button>
      </div>
    </div>
  );
};

export default Attendance;