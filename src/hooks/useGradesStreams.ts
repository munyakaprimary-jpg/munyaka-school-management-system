/**
 * Centralized hook and Context for accessing grades and streams configuration.
 * 
 * Provides dynamic `grades`, `streams`, `gradeStreamMap`, and helper getters 
 * like `getStreamsForGrade(grade)` which strip any extra noise or prefixes.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { readGradesAndStreams, getStreamsForGrade as getStreamsForGradeService, GradesStreamsConfig } from '@/services/gradesStreamsConfig';

const STORAGE_KEYS = [
  'configured_streams',
  'munyaka_grades',
  'munyaka_grades_streams',
  'munyaka_grades_streams_data',
  'gradeStreamSettings',
  'school_grades_streams_data',
  'school_classes',
];

export interface GradesAndStreamsContextType {
  config: GradesStreamsConfig;
  grades: string[];
  streams: string[];
  gradeStreamMap: Record<string, string[]>;
  getStreamsForGrade: (gradeName: string) => string[];
  getCleanStreamsForGrade: (gradeName: string) => string[];
  refreshConfig: () => void;
}

const GradesAndStreamsContext = createContext<GradesAndStreamsContextType | null>(null);

/** Clean helper to format stream names cleanly (e.g. "Green Stream" -> "Green") */
export function cleanStreamLabel(streamName: string): string {
  if (!streamName) return '';
  const cleaned = streamName.replace(/\bstream\b/gi, '').trim();
  return cleaned || streamName;
}

/**
 * Hook to access normalized grades & streams configuration dynamically.
 */
export function useGradesAndStreams(): GradesAndStreamsContextType {
  const context = useContext(GradesAndStreamsContext);
  const [localConfig, setLocalConfig] = useState<GradesStreamsConfig>(() => readGradesAndStreams());

  const refreshConfig = useCallback(() => {
    setLocalConfig(readGradesAndStreams());
  }, []);

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
  }, [refreshConfig]);

  const activeConfig = context ? context.config : localConfig;

  const getStreams = useCallback((gradeName: string) => {
    return getStreamsForGradeService(gradeName, activeConfig);
  }, [activeConfig]);

  const getCleanStreams = useCallback((gradeName: string) => {
    const raw = getStreamsForGradeService(gradeName, activeConfig);
    return raw.map((s) => cleanStreamLabel(s));
  }, [activeConfig]);

  return {
    config: activeConfig,
    grades: activeConfig.grades,
    streams: activeConfig.streams,
    gradeStreamMap: activeConfig.gradeStreamMap,
    getStreamsForGrade: getStreams,
    getCleanStreamsForGrade: getCleanStreams,
    refreshConfig: context ? context.refreshConfig : refreshConfig,
  };
}

/** Alias for backward compatibility */
export const useGradesStreamsConfig = useGradesAndStreams;

/**
 * Provider wrapper in case app prefers React Context root binding.
 */
export const GradesAndStreamsProvider = ({ children }: { children: React.ReactNode }) => {
  const [config, setConfig] = useState<GradesStreamsConfig>(() => readGradesAndStreams());

  const refreshConfig = useCallback(() => {
    setConfig(readGradesAndStreams());
  }, []);

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
  }, [refreshConfig]);

  const getStreams = useCallback((gradeName: string) => {
    return getStreamsForGradeService(gradeName, config);
  }, [config]);

  const getCleanStreams = useCallback((gradeName: string) => {
    const raw = getStreamsForGradeService(gradeName, config);
    return raw.map((s) => cleanStreamLabel(s));
  }, [config]);

  const value = useMemo(() => ({
    config,
    grades: config.grades,
    streams: config.streams,
    gradeStreamMap: config.gradeStreamMap,
    getStreamsForGrade: getStreams,
    getCleanStreamsForGrade: getCleanStreams,
    refreshConfig,
  }), [config, getStreams, getCleanStreams, refreshConfig]);

  return React.createElement(GradesAndStreamsContext.Provider, { value }, children);
};

/**
 * Hook to get available streams for a given grade with automatic reset handling.
 */
export function useGradeStreams(
  selectedGrade: string,
  selectedStream: string,
  onStreamChange: (stream: string) => void
) {
  const { config, getStreamsForGrade } = useGradesAndStreams();
  const [hasGrade, setHasGrade] = useState(false);

  const availableStreams = useMemo(() => {
    if (!selectedGrade || selectedGrade === 'all' || selectedGrade === 'All') {
      setHasGrade(false);
      return config.streams.slice().sort((a, b) => a.localeCompare(b));
    }
    
    setHasGrade(true);
    return getStreamsForGrade(selectedGrade);
  }, [selectedGrade, config.streams, getStreamsForGrade]);

  useEffect(() => {
    if (!selectedGrade || selectedGrade === 'all') {
      if (selectedStream !== 'all') {
        onStreamChange('all');
      }
      return;
    }

    const normalizedCurrent = selectedStream?.toLowerCase().trim();
    const isValidStream = availableStreams.some(
      (s) => s.toLowerCase() === normalizedCurrent
    );

    if (selectedStream && !isValidStream && availableStreams.length > 0) {
      onStreamChange(availableStreams[0]);
    } else if (availableStreams.length === 0 && selectedStream && selectedStream !== 'all') {
      onStreamChange('');
    }
  }, [selectedGrade, availableStreams, selectedStream, onStreamChange]);

  return {
    availableStreams,
    hasGrade,
    hasStreams: availableStreams.length > 0,
  };
}

/**
 * Hook to get grade-specific streams for dropdown display.
 */
export function useStreamsForGrade(selectedGrade: string): string[] {
  const { config, getStreamsForGrade } = useGradesAndStreams();

  return useMemo(() => {
    if (!selectedGrade || selectedGrade === 'all' || selectedGrade === 'All') {
      return config.streams.slice().sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }

    return getStreamsForGrade(selectedGrade);
  }, [selectedGrade, config.streams, getStreamsForGrade]);
}
