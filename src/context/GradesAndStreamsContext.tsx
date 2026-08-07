import { createContext, useContext, useEffect, useState } from 'react';

type Grade = {
  id: string;
  name: string;
};

type Stream = {
  id: string;
  gradeId: string;
  name: string;
};

interface GradesAndStreamsContextType {
  grades: Grade[];
  streams: Stream[];
  setGrades: (grades: Grade[]) => void;
  setStreams: (streams: Stream[]) => void;
}

const GradesAndStreamsContext = createContext<GradesAndStreamsContextType | undefined>(undefined);

export const useGradesAndStreams = () => {
  const context = useContext(GradesAndStreamsContext);
  if (!context) {
    throw new Error('useGradesAndStreams must be used within a GradesAndStreamsProvider');
  }
  return context;
};

interface GradesAndStreamsProviderProps {
  children: React.ReactNode;
}

export const GradesAndStreamsProvider: React.FC<GradesAndStreamsProviderProps> = ({ children }) => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);

  useEffect(() => {
    // Load grades and streams from local storage
    const savedGrades = localStorage.getItem('grades');
    const savedStreams = localStorage.getItem('streams');

    if (savedGrades) {
      setGrades(JSON.parse(savedGrades));
    }
    if (savedStreams) {
      setStreams(JSON.parse(savedStreams));
    }
  }, []);

  useEffect(() => {
    // Save grades and streams to local storage
    localStorage.setItem('grades', JSON.stringify(grades));
    localStorage.setItem('streams', JSON.stringify(streams));
  }, [grades, streams]);

  return (
    <GradesAndStreamsContext.Provider value={{ grades, streams, setGrades, setStreams }}>
      {children}
    </GradesAndStreamsContext.Provider>
  );
};