"use client";

import React from 'react';
import { createContext, useContext, useState } from 'react';

// Define the context
export const GradesAndStreamsContext = createContext<any>(null);

// Create a custom hook for accessing the GradesAndStreamsContext
export const useGradesAndStreams = () => {
  return useContext(GradesAndStreamsContext);
};

const GradesAndStreamsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state for grades and streams (you can replace with actual data fetching logic)
  const [grades, setGrades] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);

  // Helper functions
  const fetchGrades = async () => {
    // Fetch grades implementation here
  };

  const fetchStreams = async () => {
    // Fetch streams implementation here
  };

  // Create value object containing state and helper functions
  const value = {
    grades,
    setGrades,
    streams,
    setStreams,
    fetchGrades,
    fetchStreams,
  };

  return (
    <GradesAndStreamsContext.Provider value={value}>
      {children}
    </GradesAndStreamsContext.Provider>
  );
};

export default GradesAndStreamsProvider;