"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import type {
  Stream,
  Grade,
} from "@/lib/supabase/types";

const GradesContext = createContext<Grade[]>([]);
export const GradesAndStreamsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Safe state initialization
  const [grades, setGrades] = useState<Grade[]>([]);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        let { data } = await supabaseClient.from("grades").select();
        if (data) {
          setGrades(data as Grade[]);
        } else {
          useToast({ variant: "destructive", title: "Failed to load grades." });
        }
      } catch (error) {
        useToast({ variant: "destructive", title: "An error occurred." });
      }
    };

    fetchGrades();
  }, []);

  // Safe default values for context functions
  const getStreamsForGrade = (gradeId?: string): Stream[] => {
    return [];
  };
  
  return (
    <GradesContext.Provider value={{ grades, getStreamsForGrade }}>
      {children}
    </GradesContext.Provider>
  );
};

export const useGrades = () => useContext(GradesContext);