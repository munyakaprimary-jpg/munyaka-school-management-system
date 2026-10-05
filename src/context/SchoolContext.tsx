import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { showSuccess, showError } from '@/utils/toast';

interface SchoolContextType {
  data: {
    learners: any[];
    staff: any[];
    fees: any[];
    attendance: any[];
    exams: any[];
    marks: any[];
    timetable: any[];
    library: any[];
    inventory: any[];
    streams: any[];
    settings: Record<string, any>;
    [key: string]: any;
  };
  updateData: (section: string, payload: any) => void;
  refreshState: () => void;
  exportMasterJSON: () => void;
  importMasterJSON: (file: File) => Promise<boolean>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('munyaka_master_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.error('Failed to load munyaka_master_state:', e);
    }

    // Fallback: collect from localStorage keys or initial defaults
    const allData: Record<string, any> = {
      learners: [],
      staff: [],
      fees: [],
      attendance: [],
      exams: [],
      marks: [],
      timetable: [],
      library: [],
      inventory: [],
      streams: [],
      settings: { schoolName: "Munyaka Primary and Junior School" }
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const rawValue = localStorage.getItem(key);
        try {
          allData[key] = rawValue ? JSON.parse(rawValue) : null;
        } catch {
          allData[key] = rawValue;
        }
      }
    }
    return allData;
  });

  const refreshState = () => {
    try {
      const allData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const rawValue = localStorage.getItem(key);
          try {
            allData[key] = rawValue ? JSON.parse(rawValue) : null;
          } catch {
            allData[key] = rawValue;
          }
        }
      }
      setData(prev => ({ ...prev, ...allData }));
    } catch (err) {
      console.error('Failed to refresh school state:', err);
    }
  };

  // Auto-save master state on change
  useEffect(() => {
    try {
      localStorage.setItem('munyaka_master_state', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save munyaka_master_state:', err);
    }
  }, [data]);

  useEffect(() => {
    refreshState();
    const handleStorageChange = () => {
      refreshState();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('munyaka:data-changed', handleStorageChange);
    window.addEventListener('storage-updated', handleStorageChange);
    window.addEventListener('students-updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('munyaka:data-changed', handleStorageChange);
      window.removeEventListener('storage-updated', handleStorageChange);
      window.removeEventListener('students-updated', handleStorageChange);
    };
  }, []);

  const updateData = (section: string, payload: any) => {
    setData(prev => {
      const next = { ...prev, [section]: payload };
      try {
        localStorage.setItem(section, typeof payload === 'string' ? payload : JSON.stringify(payload));
      } catch (err) {
        console.error(`Failed to persist section ${section} to localStorage:`, err);
      }
      return next;
    });
  };

  const exportMasterJSON = () => {
    try {
      const allData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const rawValue = localStorage.getItem(key);
          try {
            allData[key] = rawValue ? JSON.parse(rawValue) : null;
          } catch {
            allData[key] = rawValue;
          }
        }
      }

      const masterPayload = {
        version: "4.0",
        timestamp: new Date().toISOString(),
        school: "Munyaka Primary and Junior School",
        totalKeysCaptured: Object.keys(allData).length,
        state: {
          ...data,
          ...allData
        }
      };

      const jsonString = JSON.stringify(masterPayload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `Munyaka_Master_Export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showSuccess("Master full backup exported successfully!");
    } catch (error: any) {
      console.error("Master export failed:", error);
      showError("Failed to generate master backup file.");
    }
  };

  const importMasterJSON = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const parsed = JSON.parse(text);
          const targetState = parsed.state || parsed.data || parsed;

          if (!targetState || typeof targetState !== 'object') {
            showError('Invalid master backup file format.');
            resolve(false);
            return;
          }

          // Save every key into localStorage
          Object.keys(targetState).forEach(key => {
            const val = targetState[key];
            try {
              localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
            } catch (err) {
              console.error(`Failed to store key ${key}:`, err);
            }
          });

          setData(targetState);
          refreshState();
          showSuccess('Master backup imported successfully! Refreshing app...');
          
          setTimeout(() => {
            window.location.reload();
          }, 1000);

          resolve(true);
        } catch (err: any) {
          console.error('Failed to parse master backup:', err);
          showError('Error importing backup. Invalid JSON file format.');
          resolve(false);
        }
      };
      reader.onerror = () => {
        showError('Failed to read uploaded file.');
        resolve(false);
      };
      reader.readAsText(file);
    });
  };

  return (
    <SchoolContext.Provider value={{ data, updateData, refreshState, exportMasterJSON, importMasterJSON }}>
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};

export const useSchoolContext = useSchool;
