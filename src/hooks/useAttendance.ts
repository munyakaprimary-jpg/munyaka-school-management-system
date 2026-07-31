import { useState, useEffect } from 'react';
import { format } from "date-fns";

interface SessionAttendance {
  status: string;
  time: string;
}

interface StudentAttendance {
  morning?: SessionAttendance;
  afternoon?: SessionAttendance;
}

interface Student {
  id: number;
  name: string;
  assessment: string;
}

const STORAGE_KEY = 'munyaka_attendance_records';
const DEFAULT_STUDENTS: Student[] = [
  { id: 1, name: "Brian Kiptoo", assessment: "A827361" },
  { id: 2, name: "Mary Atieno", assessment: "A827362" },
  { id: 3, name: "Emmanuel Maina", assessment: "A827363" },
  { id: 4, name: "Sheila Chepkoech", assessment: "A827364" },
  { id: 5, name: "David Mutua", assessment: "A827365" },
];

// Generate default attendance with all students marked as Present
const generateDefaultAttendance = (): Record<number, StudentAttendance> => {
  const defaultRecord: Record<number, StudentAttendance> = {};
  const timestamp = format(new Date(), "HH:mm");
  
  DEFAULT_STUDENTS.forEach(student => {
    defaultRecord[student.id] = {
      morning: { status: 'P', time: timestamp },
      afternoon: { status: 'P', time: timestamp }
    };
  });
  
  return defaultRecord;
};

export const useAttendance = () => {
  const [markedStudents, setMarkedStudents] = useState<Record<number, StudentAttendance>>({});
  const [students] = useState<Student[]>(DEFAULT_STUDENTS);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved attendance from localStorage on mount, or initialize with defaults
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setMarkedStudents(parsed);
        } else {
          // If parsed data is invalid, use defaults
          setMarkedStudents(generateDefaultAttendance());
        }
      } catch (e) {
        console.error("Error loading saved attendance:", e);
        setMarkedStudents(generateDefaultAttendance());
      }
    } else {
      // No saved data - initialize with all students present
      setMarkedStudents(generateDefaultAttendance());
    }
    setIsInitialized(true);
  }, []);

  // Persist attendance to localStorage whenever it changes (after initialization)
  useEffect(() => {
    if (isInitialized && Object.keys(markedStudents).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(markedStudents));
    }
  }, [markedStudents, isInitialized]);

  const markAttendance = (id: number, session: 'morning' | 'afternoon', status: string) => {
    const timestamp = format(new Date(), "HH:mm");
    setMarkedStudents(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [session]: { status, time: timestamp }
      }
    }));
  };

  const exportToCSV = (selectedGrade: string) => {
    const gradeLabel = selectedGrade === "grade4" ? "Grade 4 - Blue" : "Grade 5 - Green";
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

    const rows = students.map(student => {
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
    students,
    markedStudents,
    markAttendance,
    exportToCSV,
  };
};