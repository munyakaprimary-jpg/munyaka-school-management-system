import { useState, useEffect, useMemo } from 'react';
import { format } from "date-fns";
import { STUDENTS, GRADES_DATA } from '@/lib/mock-data';

interface SessionAttendance {
  status: string;
  time: string;
}

interface StudentAttendance {
  morning?: SessionAttendance;
  afternoon?: SessionAttendance;
}

interface Student {
  id: string;
  name: string;
  assessment: string;
  grade: string;
  stream: string;
}

const STORAGE_KEY = 'munyaka_attendance_records';

// Generate default attendance with all students marked as Present
const generateDefaultAttendance = (students: Student[]): Record<string, StudentAttendance> => {
  const defaultRecord: Record<string, StudentAttendance> = {};
  const timestamp = format(new Date(), "HH:mm");
  
  students.forEach(student => {
    defaultRecord[student.id] = {
      morning: { status: 'P', time: timestamp },
      afternoon: { status: 'P', time: timestamp }
    };
  });
  
  return defaultRecord;
};

export const useAttendance = (selectedGrade: string, selectedStream: string) => {
  const [markedStudents, setMarkedStudents] = useState<Record<string, StudentAttendance>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Get filtered students based on selected grade and stream
  const filteredStudents = useMemo(() => {
    return STUDENTS.filter(s => {
      const matchesGrade = !selectedGrade || s.grade === selectedGrade.replace(/[^0-9]/g, '');
      const matchesStream = !selectedStream || s.stream === selectedStream;
      return matchesGrade && matchesStream;
    });
  }, [selectedGrade, selectedStream]);

  // Load saved attendance from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setMarkedStudents(parsed);
        } else {
          setMarkedStudents(generateDefaultAttendance(filteredStudents));
        }
      } catch (e) {
        console.error("Error loading saved attendance:", e);
        setMarkedStudents(generateDefaultAttendance(filteredStudents));
      }
    } else {
      setMarkedStudents(generateDefaultAttendance(filteredStudents));
    }
    setIsInitialized(true);
  }, [filteredStudents]);

  // Persist attendance to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized && Object.keys(markedStudents).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(markedStudents));
    }
  }, [markedStudents, isInitialized]);

  const markAttendance = (id: string, session: 'morning' | 'afternoon', status: string) => {
    const timestamp = format(new Date(), "HH:mm");
    setMarkedStudents(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [session]: { status, time: timestamp }
      }
    }));
  };

  const exportToCSV = () => {
    const gradeObj = GRADES_DATA.find(g => g.id === selectedGrade);
    const streamObj = gradeObj?.streams.find(s => s.id === selectedStream);
    const gradeLabel = gradeObj ? `${gradeObj.name} - ${streamObj?.name || 'All Streams'}` : "All Grades";
    const currentDateStr = format(new Date(), "PP");
    
    const row1 = "MUNYAKA PRIMARY AND JUNIOR SCHOOL";
    const row2 = "P.O. BOX 5239-30100, ELDORET";
    const row3 = "MOTTO: KNOWLEDGE POWER";
    const row4 = `CLASS ATTENDANCE REGISTER - ${gradeLabel.toUpperCase()} - DATE: ${currentDateStr}`;

    const headers = ["Learner Name", "Assessment ID", "Morning Session", "Morning Time", "Afternoon Session", "Afternoon Time"];

    const getStatusLabel = (status?: string) => {
      if (status === 'P') return "Present";
      if (status === 'A') return "Absent";
      if (status === 'L') return "Late";
      return "Not Marked";
    };

    const rows = filteredStudents.map(student => {
      const record = markedStudents[student.id] || {};
      return [
        `"${student.name.replace(/"/g, '""')}"`,
        `"${student.assessment.replace(/"/g, '""')}"`,
        `"${getStatusLabel(record.morning?.status)}"`,
        `"${record.morning?.time || '—'}"`,
        `"${getStatusLabel(record.afternoon?.status)}"`,
        `"${record.afternoon?.time || '—'}"`
      ];
    });

    const csvContent = [
      row1,
      row2,
      row3,
      row4,
      "",
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    // Auto-download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${gradeLabel.replace(/\s+/g, '_').replace(/-/g, '')}_${format(new Date(), "yyyy_MM_dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    students: filteredStudents,
    markedStudents,
    markAttendance,
    exportToCSV,
  };
};