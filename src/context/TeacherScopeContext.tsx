import React, { createContext, useContext } from 'react';
import { useTeacherScope, TeacherScope } from '@/hooks/useTeacherScope';

const TeacherScopeContext = createContext<TeacherScope | undefined>(undefined);

export const TeacherScopeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scope = useTeacherScope();

  return (
    <TeacherScopeContext.Provider value={scope}>
      {children}
    </TeacherScopeContext.Provider>
  );
};

export const useGlobalTeacherScope = () => {
  const context = useContext(TeacherScopeContext);
  if (!context) {
    throw new Error('useGlobalTeacherScope must be used within a TeacherScopeProvider');
  }
  return context;
};
