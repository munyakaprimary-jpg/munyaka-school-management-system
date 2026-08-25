import { useState, useEffect, useMemo } from 'react';
import { format } from "date-fns";
import { STUDENTS, GRADES_DATA } from '@/lib/mock-data';
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

// New key for global submission tracking
const SUBMISSION_STATUS_KEY = 'munyaka_attendance_submission_status';

export const useAttendance = (selectedGradeId?: string) => {
  // Initialize filters from localStorage
  const [selectedClass, setSelectedClass] = useState(() => 
    localStorage.getItem(SELECTED_CLASS_KEY) || 'PP2'
  );
  const [selectedStream, setSelectedStream] = useState(() => 
    localStorage.getItem(SELECTED_STREAM_KEY) || 'all'
  );
  const [selectedDate, setSelectedDate] = useState(() => 
    localStorage.getItem(SELECTED_DATE_KEY) || format(new Date(), "yyyy-MM-dd")
  );

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
    return GRADES_DATA;
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

  // --- NEW: Check if attendance has been submitted globally ---
  const [isRegisterSubmitted, setIsRegisterSubmitted] = useState(false);
  
  useEffect(() => {
    // Check global submission status
    const stored = localStorage.getItem(SUBMISSION_STATUS_KEY);
    if (stored) {
      try {
        const submissionData = JSON.parse(stored);
        // Check if submission exists for current class/stream/date
        const key = `${selectedClass}_${selectedStream}_${selectedDate}`;
        if (submissionData[key]) {
          setIsRegisterSubmitted(true);
        }
      } catch (e) {
        console.error("Error parsing submission status:", e);
      }
    }
    setIsRegisterSubmitted(false); // Default if no data
  }, [selectedClass, selectedStream, selectedDate]);

  // Persist submission status when it changes
  useEffect(() => {
    const submissionData = {};
    submissionData[`${selectedClass}_${selectedStream}_${selectedDate}`] = isRegisterSubmitted;
    localStorage.setItem(SUBMISSION_STATUS_KEY, JSON.stringify(submissionData));
  }, [isRegisterSubmitted, selectedClass, selectedStream, selectedDate]);

  // --- EXACT getAvailableStreams IMPLEMENTATION ---
  const getAvailableStreams = (): string[] => {
    try {
      const rawGrades = localStorage.getItem('munyaka_grades');
      if (!rawGrades) return ['All Streams'];

      const grades = JSON.parse(rawGrades);
      // Find the currently selected class object in munyaka_grades
      const currentGradeObj = grades.find(
        (g: any) => g.name === selectedClass || g.id === selectedClass || g.code === selectedClass
      );

      if (currentGradeObj && Array.isArray(currentGradeObj.streams) && currentGradeObj.streams.length > 0) {
        const extractedStreams = currentGradeObj.streams.map((s: any) =>
          typeof s === 'string' ? s : s.name || s.label || s.streamName
        );
        return ['All Streams', ...extractedStreams];
      }

      // Fallback: If no class-specific match, flatten streams across ALL grades in munyaka_grades
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

  // Use the exact getAvailableStreams function
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
    
    // Try to load from munyaka_students first
    const storedStudents = localStorage.getItem(STUDENTS_KEY);
    if (storedStudents) {
      try {
        students = JSON.parse(storedStudents);
      } catch (e) {
        console.error("Error parsing students:", e);
        students = STUDENTS;
      }
    } else {
      students = STUDENTS;
    }

    // Filter by class (grade)
    const classStudents = students.filter(s => {
      const studentGrade = s.grade || s.class || '';
      return studentGrade === selectedClass || `Grade ${studentGrade}` === selectedClass;
    });

    // Filter by stream
    if (selectedStream !== 'all') {
      return classStudents.filter(s => s.stream === selectedStream);
    }
    
    return classStudents.map(s => ({
      id: parseInt(s.id) || Math.random(),
      name: s.name,
      assessment: s.assessment
    }));
  }, [selectedClass, selectedStream]);

  const [markedStudents, setMarkedStudents] = useState<Record<number, StudentAttendance>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Storage key is specific to the class, stream, and date
  const currentStorageKey = `${STORAGE_KEY}_${selectedClass}_${selectedStream}_${selectedDate}`;

  // Load/Initialize attendance for the current filters
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

  // Persist changes
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

  // NEW: Function to mark register as submitted
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