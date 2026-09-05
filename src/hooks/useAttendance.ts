import { useState, useEffect, useMemo } from 'react';
import { format } from "date-fns";
import { downloadCSV } from '@/utils/downloadHelper';

interface SessionAttendance {
  status: string;
  time: string;
}

interface StudentAttendance {
  morning?: SessionAttendance;
  afternoon?: SessionAttendance;
}

const STORAGE_KEY = 'munyaka_attendance_records';
const STUDENTS_KEY = 'school_learners_data';
const SELECTED_CLASS_KEY = 'munyaka_selected_class';
const SELECTED_STREAM_KEY = 'munyaka_selected_stream';
const SELECTED_DATE_KEY = 'munyaka_selected_date';
const GRADES_KEY = 'munyaka_grades';
const SUBMISSION_STATUS_KEY = 'munyaka_attendance_submission_status';

interface UseAttendanceOptions {
  selectedGrade?: string;
  selectedStream?: string;
  selectedDate?: string;
}

export const useAttendance = (options: UseAttendanceOptions = {}) => {
  const { selectedGrade: propSelectedGrade, selectedStream: propSelectedStream, selectedDate: propSelectedDate } = options;

  // Initialize filters from localStorage or props
  const [selectedClass, setSelectedClass] = useState(() => 
    propSelectedGrade || localStorage.getItem(SELECTED_CLASS_KEY) || 'Grade 6'
  );
  const [selectedStream, setSelectedStream] = useState(() => 
    propSelectedStream || localStorage.getItem(SELECTED_STREAM_KEY) || 'all'
  );
  const [selectedDate, setSelectedDate] = useState(() => 
    propSelectedDate || localStorage.getItem(SELECTED_DATE_KEY) || format(new Date(), "yyyy-MM-dd")
  );

  // Sync with props when they change
  useEffect(() => {
    if (propSelectedGrade && propSelectedGrade !== selectedClass) {
      setSelectedClass(propSelectedGrade);
    }
  }, [propSelectedGrade, selectedClass]);

  useEffect(() => {
    if (propSelectedStream && propSelectedStream !== selectedStream) {
      setSelectedStream(propSelectedStream);
    }
  }, [propSelectedStream, selectedStream]);

  useEffect(() => {
    if (propSelectedDate && propSelectedDate !== selectedDate) {
      setSelectedDate(propSelectedDate);
    }
  }, [propSelectedDate, selectedDate]);

  // Load grades/streams from localStorage
  const [gradesData, setGradesData] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem(GRADES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error loading munyaka_grades:", e);
    }
    return [];
  });

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem(GRADES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setGradesData(parsed);
          }
        }
      } catch (e) {
        console.error("Error parsing munyaka_grades:", e);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Persist filter changes
  useEffect(() => {
    localStorage.setItem(SELECTED_CLASS_KEY, selectedClass);
  }, [selectedClass]);

  useEffect(() => {
    localStorage.setItem(SELECTED_STREAM_KEY, selectedStream);
  }, [selectedStream]);

  useEffect(() => {
    localStorage.setItem(SELECTED_DATE_KEY, selectedDate);
  }, [selectedDate]);

  // Check if attendance has been submitted globally
  const [isRegisterSubmitted, setIsRegisterSubmitted] = useState(false);
  
  useEffect(() => {
    const stored = localStorage.getItem(SUBMISSION_STATUS_KEY);
    if (stored) {
      try {
        const submissionData = JSON.parse(stored);
        const key = `${selectedClass}_${selectedStream}_${selectedDate}`;
        if (submissionData[key]) {
          setIsRegisterSubmitted(true);
        }
      } catch (e) {
        console.error("Error parsing submission status:", e);
      }
    }
    setIsRegisterSubmitted(false);
  }, [selectedClass, selectedStream, selectedDate]);

  useEffect(() => {
    const submissionData = {};
    submissionData[`${selectedClass}_${selectedStream}_${selectedDate}`] = isRegisterSubmitted;
    localStorage.setItem(SUBMISSION_STATUS_KEY, JSON.stringify(submissionData));
  }, [isRegisterSubmitted, selectedClass, selectedStream, selectedDate]);

  // Get available streams for the selected class
  const getAvailableStreams = (): string[] => {
    try {
      const rawGrades = localStorage.getItem('munyaka_grades');
      if (!rawGrades) return ['All Streams'];

      const grades = JSON.parse(rawGrades);
      const currentGradeObj = grades.find(
        (g: any) => g.name === selectedClass || g.id === selectedClass || g.code === selectedClass
      );

      if (currentGradeObj && Array.isArray(currentGradeObj.streams) && currentGradeObj.streams.length > 0) {
        const extractedStreams = currentGradeObj.streams.map((s: any) =>
          typeof s === 'string' ? s : s.name || s.label || s.streamName
        );
        return ['All Streams', ...extractedStreams];
      }

      const allUniqueStreams = new Set<string>();
      grades.forEach((g: any) => {
        if (Array.isArray(g.streams)) {
          g.streams.forEach((s: any) => {
            const streamName = typeof s === 'string' ? s : s.name || s.label;
            if (streamName) allUniqueStreams.add(streamName);
          });
        }
      });

      return allUniqueStreams.size > 0 ? ['All Streams', ...Array.from(allUniqueStreams)] : ['All Streams'];
    } catch (err) {
      console.error('Error loading streams from munyaka_grades:', err);
      return ['All Streams'];
    }
  };

  const availableStreams = getAvailableStreams();

  // Reset stream to "all" if previously selected stream doesn't exist for new class
  useEffect(() => {
    if (selectedStream !== 'all' && availableStreams.length > 0) {
      const streamExists = availableStreams.some(s => s === selectedStream);
      if (!streamExists) {
        setSelectedStream('all');
      }
    }
  }, [selectedClass, availableStreams, selectedStream]);

  // Source of truth: Students filtered by class and stream
  const learnersInGrade = useMemo(() => {
    let students = [];
    
    const storedStudents = localStorage.getItem(STUDENTS_KEY);
    if (storedStudents) {
      try {
        const parsed = JSON.parse(storedStudents);
        // Filter to plain objects so downstream .name / .grade accesses don't crash.
        students = Array.isArray(parsed)
          ? parsed.filter((item): item is Record<string, unknown> => item !== null && typeof item === "object")
          : [];
      } catch (e) {
        console.error("Error parsing students:", e);
        students = [];
      }
    } else {
      students = [];
    }

    // Normalize the selected class for comparison
    const normalizeGrade = (grade: string) => {
      return grade.replace(/^Grade\s*/i, '').trim();
    };

    const selectedGradeNormalized = normalizeGrade(selectedClass);
    
    // Filter by class (grade) - handle both "Grade 6" and "6" formats
    const classStudents = students.filter(s => {
      const studentGrade = s.grade || s.class || '';
      const studentGradeNormalized = normalizeGrade(studentGrade);
      return studentGradeNormalized === selectedGradeNormalized;
    });

    // Filter by stream - handle case-insensitive matching
    if (selectedStream !== 'all' && selectedStream !== 'All Streams') {
      return classStudents.filter(s => 
        s.stream?.toLowerCase() === selectedStream.toLowerCase()
      ).map(s => ({
        id: parseInt(s.id) || Math.random(),
        name: s.name,
        assessment: s.assessment
      }));
    }
    
    return classStudents.map(s => ({
      id: parseInt(s.id) || Math.random(),
      name: s.name,
      assessment: s.assessment
    }));
  }, [selectedClass, selectedStream]);

  const [markedStudents, setMarkedStudents] = useState<Record<number, StudentAttendance>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  const currentStorageKey = `${STORAGE_KEY}_${selectedClass}_${selectedStream}_${selectedDate}`;

  useEffect(() => {
    setIsInitialized(false);
    const saved = localStorage.getItem(currentStorageKey);
    
    if (saved) {
      try {
        setMarkedStudents(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading attendance:", e);
        initializeDefaults();
      }
    } else {
      initializeDefaults();
    }
    setIsInitialized(true);
  }, [currentStorageKey, learnersInGrade]);

  const initializeDefaults = () => {
    const defaultRecord: Record<number, StudentAttendance> = {};
    const timestamp = format(new Date(), "HH:mm");
    
    learnersInGrade.forEach(learner => {
      defaultRecord[learner.id] = {
        morning: { status: 'P', time: timestamp },
        afternoon: { status: 'P', time: timestamp }
      };
    });
    setMarkedStudents(defaultRecord);
  };

  useEffect(() => {
    if (isInitialized && Object.keys(markedStudents).length > 0) {
      localStorage.setItem(currentStorageKey, JSON.stringify(markedStudents));
    }
  }, [markedStudents, isInitialized, currentStorageKey]);

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

  const submitRegister = () => {
    setIsRegisterSubmitted(true);
  };

  const exportToCSV = () => {
    const currentDateStr = format(new Date(selectedDate), "PP");
    
    const row1 = "MUNYAKA PRIMARY AND JUNIOR SCHOOL";
    const row2 = "P.O. BOX 5239-30100, ELDORET";
    const row3 = "MOTTO: KNOWLEDGE POWER";
    const row4 = `CLASS ATTENDANCE REGISTER - ${selectedClass.toUpperCase()} - ${selectedStream !== 'all' ? selectedStream.toUpperCase() : 'ALL STREAMS'} - DATE: ${currentDateStr}`;

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
        `"${learner.name.replace(/"/g, '""')}"`,
        `"${learner.assessment.replace(/"/g, '""')}"`,
        `"${getStatusLabel(record.morning?.status)}"`,
        `"${record.morning?.time || '—'}"`,
        `"${getStatusLabel(record.afternoon?.status)}"`,
        `"${record.afternoon?.time || '—'}"`
      ];
    });

    const csvContent = [row1, row2, row3, row4, "", headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    downloadCSV(csvContent, `attendance_${selectedClass.replace(/\s+/g, '_')}_${selectedStream}_${selectedDate}.csv`);
  };

  return {
    students: learnersInGrade,
    markedStudents,
    markAttendance,
    submitRegister,
    isRegisterSubmitted,
    exportToCSV,
    selectedClass,
    setSelectedClass,
    selectedStream,
    setSelectedStream,
    selectedDate,
    setSelectedDate,
    availableStreams
  };
};