"use client";

import React, { createContext, useContext } from 'react';

const GradesAndStreamsContext = createContext<{ /* Context value here */ } | undefined>(undefined);

export const useGradesAndStreams = () => {
  const context = useContext(GradesAndStreamsContext);
  if (context === undefined) {
    throw new Error('useGradesAndStreams must be used within a GradesAndStreamsProvider');
  }
  return context;
};

const GradesAndStreamsProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const value {/* Provide the initial value here, or dynamically load it */ };

  return (
    <GradesAndStreamsContext.Provider value={value}>
      {children}
    </GradesAndStreamsContext.Provider>
  );
};

export default GradesAndStreamsProvider;