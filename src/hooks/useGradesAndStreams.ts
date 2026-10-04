/**
 * Comprehensive Unified Grades and Streams Hook & Context Provider (`useGradesAndStreams`)
 * 
 * Implements the CRITICAL ARCHITECTURAL BINDING:
 * 1. Reads directly from the database table / local store where Grades & Streams configuration is saved.
 * 2. Exposes normalized `grades` and `streams` arrays dynamically, plus helper functions and mapping.
 * 3. Handles clean stream label formatting (stripping the word "stream" if present, e.g. "Green Stream" -> "Green").
 * 4. Provides fallback for grades with no configured streams ("(No streams configured)").
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { readGradesAndStreams, getStreamsForGrade, GradesStreamsConfig } from '@/services/gradesStreamsConfig';

export interface GradeItem {
  id: string;
  name: string;
  category: string;
  streams: { id?: string; name: string }[];
}

export interface UnifiedGradesStreamsContextType {
  grades: string[]; // Normalized grade names (e.g. "Grade 1", "PP1")
  rawGrades: GradeItem[]; // Full grade objects with categories and stream objects
  streams: string[]; // All unique stream names normalized (stripped of word "stream")
  gradeStreamMap: Record<string, string[]>;
  getStreamsForGrade: (gradeName: string) => string[];
  cleanStreamLabel: (streamName: string) => string;
  refreshConfig: () => void;
}

const UnifiedGradesStreamsContext = createContext<UnifiedGradesStreamsContextType | null>(null);

export function cleanStreamName(name: string): string {
  if (!name) return '';
  // Strip out the word "stream" case-insensitively with surrounding whitespace
  const cleaned = name.replace(/\bstream\b/gi, '').trim();
  // Capitalize first letter properly
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : name.trim();
}

const STORAGE_KEYS = [
  'configured_streams',
  'munyaka_grades',
  'munyaka_grades_streams',
  'munyaka_grades_streams_data',
  'gradeStreamSettings',
  'school_grades_streams_data',
  'school_classes',
];

export const UnifiedGradesStreamsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rawConfig, setRawConfig] = useState<GradesStreamsConfig>(() => readGradesAndStreams());
  const [rawGradesList, setRawGradesList] = useState<GradeItem[]>(() => {
    try {
      for (const key of STORAGE_KEYS) {
        const val = localStorage.getItem(key);
        if (val) {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((item: any, idx: number) => ({
              id: item.id || String(idx),
              name: item.name || item.grade || item.label || '',
              category: item.category || 'Primary',
              streams: Array.isArray(item.streams || item.classes)
                ? (item.streams || item.classes).map((s: any, sIdx: number) => ({
                    id: s?.id || String(sIdx),
                    name: cleanStreamName(typeof s === 'string' ? s : (s?.name || s?.label || ''))
                  })).filter((s: any) => s.name)
                : []
            })).filter((g: any) => g.name);
          }
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  const refreshConfig = () => {
    const config = readGradesAndStreams();
    setRawConfig(config);
    try {
      for (const key of STORAGE_KEYS) {
        const val = localStorage.getItem(key);
        if (val) {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRawGradesList(
              parsed.map((item: any, idx: number) => ({
                id: item.id || String(idx),
                name: item.name || item.grade || item.label || '',
                category: item.category || 'Primary',
                streams: Array.isArray(item.streams || item.classes)
                  ? (item.streams || item.classes).map((s: any, sIdx: number) => ({
                      id: s?.id || String(sIdx),
                      name: cleanStreamName(typeof s === 'string' ? s : (s?.name || s?.label || ''))
                    })).filter((s: any) => s.name)
                  : []
              })).filter((g: any) => g.name)
            );
            break;
          }
        }
      }
    } catch {}
  };

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || STORAGE_KEYS.includes(e.key)) {
        refreshConfig();
      }
    };
    const handleCustom = () => refreshConfig();
    const handleFocus = () => refreshConfig();

    window.addEventListener('storage', handleStorage);
    window.addEventListener('munyaka_grades_updated', handleCustom);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('munyaka_grades_updated', handleCustom);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const value = useMemo<UnifiedGradesStreamsContextType>(() => {
    const grades = rawConfig.grades;
    const streamsSet = new Set<string>();
    
    // Clean all streams
    const cleanedMap: Record<string, string[]> = {};
    Object.entries(rawConfig.gradeStreamMap).forEach(([gKey, streamList]) => {
      const cleanedList = streamList.map(s => cleanStreamName(s)).filter(Boolean);
      cleanedMap[gKey] = cleanedList;
      cleanedList.forEach(s => streamsSet.add(s));
    });

    // Also check rawGradesList if map is empty
    rawGradesList.forEach(g => {
      g.streams.forEach(s => {
        if (s.name) streamsSet.add(cleanStreamName(s.name));
      });
    });

    const streams = Array.from(streamsSet).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }));

    return {
      grades,
      rawGrades: rawGradesList,
      streams,
      gradeStreamMap: cleanedMap,
      getStreamsForGrade: (gradeName: string) => {
        if (!gradeName) return [];
        // Check rawGradesList first for exact matches
        const found = rawGradesList.find(
          g => g.name.toLowerCase() === gradeName.toLowerCase() || g.id === gradeName
        );
        if (found && found.streams.length > 0) {
          return found.streams.map(s => s.name).filter(Boolean);
        }
        // Fallback to helper
        const list = getStreamsForGrade(gradeName, rawConfig);
        return list.map(s => cleanStreamName(s)).filter(Boolean);
      },
      cleanStreamLabel: cleanStreamName,
      refreshConfig,
    };
  }, [rawConfig, rawGradesList]);

  return (
    <UnifiedGradesStreamsContext.Provider value={value}>
      {children}
    </UnifiedGradesStreamsContext.Provider>
  );
};

export function useGradesAndStreams(): UnifiedGradesStreamsContextType {
  const context = useContext(UnifiedGradesStreamsContext);
  if (!context) {
    // If used outside provider, return a fallback object that reads live storage directly
    const config = readGradesAndStreams();
    const grades = config.grades;
    const streams = config.streams.map(cleanStreamName).filter(Boolean);
    return {
      grades,
      rawGrades: [],
      streams,
      gradeStreamMap: config.gradeStreamMap,
      getStreamsForGrade: (gradeName: string) => {
        const list = getStreamsForGrade(gradeName, config);
        return list.map(cleanStreamName).filter(Boolean);
      },
      cleanStreamLabel: cleanStreamName,
      refreshConfig: () => {},
    };
  }
  return context;
}
