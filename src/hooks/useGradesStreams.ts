"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Grade, Stream } from '@/lib/mock-data';

interface GradesStreamsConfig {
  grades: Grade[];
  streams: Stream[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addGrade: (grade: Omit<Grade, 'id' | 'streams'>) => void;
  updateGrade: (gradeId: string, updates: Partial<Grade>) => void;
  deleteGrade: (gradeId: string) => void;
  addStream: (gradeId: string, stream: Omit<Stream, 'id'>) => void;
  updateStream: (gradeId: string, streamId: string, updates: Partial<Stream>) => void;
  deleteStream: (gradeId: string, streamId: string) => void;
}

// Central configuration store for Grades & Streams
const useGradesStreams = (): GradesStreamsConfig => {
  const [grades, setGrades] = useState<Grade[]>(() => {
    const saved = localStorage.getItem('munyaka_grades');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load streams from all grades
  const loadStreamsFromGrades = useCallback((gradesList: Grade[]) => {
    const allStreams: Stream[] = [];
    gradesList.forEach(grade => {
      grade.streams.forEach(stream => {
        allStreams.push(stream);
      });
    });
    setStreams(allStreams);
  }, []);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to load from localStorage first
      const saved = localStorage.getItem('munyaka_grades');
      if (saved) {
        const parsedGrades = JSON.parse(saved);
        setGrades(parsedGrades);
        loadStreamsFromGrades(parsedGrades);
      } else {
        // Load from API/database in production
        // For now, we'll use empty arrays
        setGrades([]);
        setStreams([]);
      }
    } catch (err) {
      console.error('Error loading grades and streams:', err);
      setError('Failed to load grades and streams configuration');
      // Fallback to empty arrays
      setGrades([]);
      setStreams([]);
    } finally {
      setIsLoading(false);
    }
  }, [loadStreamsFromGrades]);

  // Save grades to localStorage
  const saveGrades = useCallback((gradesList: Grade[]) => {
    try {
      localStorage.setItem('munyaka_grades', JSON.stringify(gradesList));
      setGrades(gradesList);
      loadStreamsFromGrades(gradesList);
    } catch (err) {
      console.error('Error saving grades:', err);
      setError('Failed to save grades configuration');
    }
  }, [loadStreamsFromGrades]);

  // CRUD Operations

  const addGrade = useCallback((gradeData: Omit<Grade, 'id' | 'streams'>) => {
    const newGrade: Grade = {
      ...gradeData,
      id: `g-${Date.now()}`,
      streams: []
    };
    saveGrades([...grades, newGrade]);
  }, [grades, saveGrades]);

  const updateGrade = useCallback((gradeId: string, updates: Partial<Grade>) => {
    const updatedGrades = grades.map(grade => 
      grade.id === gradeId ? { ...grade, ...updates } : grade
    );
    saveGrades(updatedGrades);
  }, [grades, saveGrades]);

  const deleteGrade = useCallback((gradeId: string) => {
    const updatedGrades = grades.filter(grade => grade.id !== gradeId);
    saveGrades(updatedGrades);
  }, [grades, saveGrades]);

  const addStream = useCallback((gradeId: string, streamData: Omit<Stream, 'id'>) => {
    const newStream: Stream = {
      ...streamData,
      id: `s-${Date.now()}`
    };
    
    const updatedGrades = grades.map(grade => {
      if (grade.id === gradeId) {
        return { ...grade, streams: [...grade.streams, newStream] };
      }
      return grade;
    });
    saveGrades(updatedGrades);
  }, [grades, saveGrades]);

  const updateStream = useCallback((gradeId: string, streamId: string, updates: Partial<Stream>) => {
    const updatedGrades = grades.map(grade => {
      if (grade.id === gradeId) {
        const updatedStreams = grade.streams.map(stream =>
          stream.id === streamId ? { ...stream, ...updates } : stream
        );
        return { ...grade, streams: updatedStreams };
      }
      return grade;
    });
    saveGrades(updatedGrades);
  }, [grades, saveGrades]);

  const deleteStream = useCallback((gradeId: string, streamId: string) => {
    const updatedGrades = grades.map(grade => {
      if (grade.id === gradeId) {
        return { ...grade, streams: grade.streams.filter(s => s.id !== streamId) };
      }
      return grade;
    });
    saveGrades(updatedGrades);
  }, [grades, saveGrades]);

  // Refresh data from storage
  const refresh = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  // Load data on mount
  useEffect(() => {
    if (grades.length === 0) {
      loadInitialData();
    } else {
      loadStreamsFromGrades(grades);
    }
  }, [grades.length, loadInitialData, loadStreamsFromGrades]);

  return {
    grades,
    streams,
    isLoading,
    error,
    refresh,
    addGrade,
    updateGrade,
    deleteGrade,
    addStream,
    updateStream,
    deleteStream
  };
};

export default useGradesStreams;