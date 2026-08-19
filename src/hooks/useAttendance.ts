import { useState, useEffect, useMemo } from 'react';
import { format } from "date-fns";
import { STUDENTS, GRADES_DATA } from '@/lib/mock-data';
import { downloadCSV } from '@/utils/downloadHelper';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface SessionAttendance {
  status: string;
  time: string;
}

interface StudentAttendance {
  morning?: SessionAttendance;
  afternoon?: SessionAttendance;
}

const STORAGE_KEY_PREFIX = 'munyaka_attendance_v2_';

export const useAttendance = (selectedGradeId: string) => {
  // Source of truth: Students filtered by grade
  const learnersInGrade = useMemo(() => {
    const gradeObj = GRADES_DATA.find(g => g.id === selectedGradeId);
    if (!gradeObj) return [];

    const gradeNum = gradeObj.name.replace(/[^0-9]/g, '');

    return STUDENTS.filter(s =>
      s.grade === gradeNum || s.grade === gradeObj.name
    ).map(s => ({
      id: parseInt(s.id),
      name: s.name,
      assessment: s.assessment
    }));
  }, [selectedGradeId]);

  // Storage key is specific to the grade to keep records separate
  const currentStorageKey = `${STORAGE_KEY_PREFIX}${selectedGradeId}`;

  // Use useLocalStorage for attendance persistence
  const [markedStudents, setMarkedStudents] = useLocalStorage<Record<number, StudentAttendance>>(
    currentStorageKey,
    {}
  );

  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize attendance for the current grade if empty
  useEffect(() => {
    if (Object.keys(markedStudents).length === 0 && learnersInGrade.length > 0) {
      const defaultRecord: Record<number, StudentAttendance> = {};
      const timestamp = format(new Date(), "HH:mm");

      learnersInGrade.forEach(learner => {
        defaultRecord[learner.id] = {
          morning: { status: 'P', time: timestamp },
          afternoon: { status: 'P', time: timestamp }
        };
      });
      setMarkedStudents(defaultRecord);
    }
    setIsInitialized(true);
  }, [selectedGradeId, learnersInGrade, markedStudents, setMarkedStudents]);

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

  const exportToCSV = () => {
    const gradeObj = GRADES_DATA.find(g => g.id === selectedGradeId);
    const gradeLabel = gradeObj ? gradeObj.name : "Selected Grade";
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

    const rows = learnersInGrade.map(learner => {
      const record = markedStudents[learner.id] || {};
      return [
        `"${learner.name.replace(/\"/g, '""')}"`,
        `"${learner.assessment.replace(/\"/g, '""')}"`,
        `"${getStatusLabel(record.morning?.status)}"`,
        `"${record.morning?.time || '—'}"`,
        `"${getStatusLabel(record.afternoon?.status)}"`,
        `"${record.afternoon?.time || '—'}"`
      ];
    });

    const csvContent = [row1, row2, row3, row4, "", headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    // Use global download helper
    downloadCSV(csvContent, `attendance_${gradeLabel.replace(/\s+/g, '_')}_${format(new Date(), "yyyy_MM_dd")}.csv`);
  };

  return {
    students: learnersInGrade,
    markedStudents,
    markAttendance,
    exportToCSV,
  };
};