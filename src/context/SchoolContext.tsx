import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { showSuccess, showError } from '@/utils/toast';

interface SchoolContextType {
  state: Record<string, any>;
  refreshState: () => void;
  exportMasterJSON: () => void;
  importMasterJSON: (file: File) => Promise<boolean>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<Record<string, any>>({});

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
      setState(allData);
    } catch (err) {
      console.error('Failed to load school state from localStorage:', err);
    }
  };

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
        version: "3.0",
        timestamp: new Date().toISOString(),
        institution: "Munyaka Primary and Junior School",
        totalKeysCaptured: Object.keys(allData).length,
        data: allData
      };

      const jsonString = JSON.stringify(masterPayload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `Munyaka_Master_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
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
          const targetData = parsed.data || parsed;

          if (!targetData || typeof targetData !== 'object') {
            showError('Invalid master backup file format.');
            resolve(false);
            return;
          }

          // Save every key into localStorage
          Object.keys(targetData).forEach(key => {
            const val = targetData[key];
            try {
              localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
            } catch (err) {
              console.error(`Failed to store key ${key}:`, err);
            }
          });

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
    <SchoolContext.Provider value={{ state, refreshState, exportMasterJSON, importMasterJSON }}>
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchoolContext = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchoolContext must be used within a SchoolProvider');
  }
  return context;
};
