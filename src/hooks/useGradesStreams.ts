/**
 * Centralized hook for accessing grades and streams configuration.
 * 
 * This hook reads from the GradesStreamsConfig stored in localStorage
 * and provides reactive updates when the configuration changes.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { readGradesAndStreams, getStreamsForGrade, GradesStreamsConfig } from '@/services/gradesStreamsConfig';

const STORAGE_KEYS = [
  'configured_streams',
  'munyaka_grades',
  'munyaka_grades_streams',
  'munyaka_grades_streams_data',
  'gradeStreamSettings',
  'school_grades_streams_data',
  'school_classes',
];

/**
 * Hook to access the grades/streams configuration with automatic refresh
 * when the configuration changes (cross-tab or same-tab updates).
 */
export function useGradesStreamsConfig() {
  const [config, setConfig] = useState<GradesStreamsConfig>(() => readGradesAndStreams());

  // Refresh config when storage changes
  useEffect(() => {
    const refreshConfig = () => {
      setConfig(readGradesAndStreams());
    };

    // Listen for storage events (cross-tab updates)
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || STORAGE_KEYS.includes(e.key)) {
        refreshConfig();
      }
    };

    // Listen for custom event (same-tab updates from GradesStreams.tsx)
    const handleCustom = () => refreshConfig();
    
    // Listen for focus events (same-tab, e.g., returning from another page)
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

  return config;
}

/**
 * Hook to get available streams for a given grade with automatic reset handling.
 * 
 * @param selectedGrade - The currently selected grade name
 * @param selectedStream - The currently selected stream value
 * @param onStreamChange - Callback to reset stream when grade changes
 * @returns Object containing available streams and a boolean indicating if grade is selected
 */
export function useGradeStreams(
  selectedGrade: string,
  selectedStream: string,
  onStreamChange: (stream: string) => void
) {
  const config = useGradesStreamsConfig();
  const [hasGrade, setHasGrade] = useState(false);

  // Compute available streams based on selected grade
  const availableStreams = useMemo(() => {
    if (!selectedGrade || selectedGrade === 'all' || selectedGrade === 'All') {
      setHasGrade(false);
      // When no specific grade is selected, return all unique streams
      return config.streams.slice().sort((a, b) => a.localeCompare(b));
    }
    
    setHasGrade(true);
    // Get streams for the specific grade
    const gradeStreams = getStreamsForGrade(selectedGrade, config);
    
    // If no streams configured for this grade, return empty array
    // (let the UI show "No streams available" state)
    return gradeStreams;
  }, [selectedGrade, config]);

  // Reset stream selection when grade changes
  useEffect(() => {
    if (!selectedGrade || selectedGrade === 'all') {
      // When "All Grades" is selected, reset to "all" streams
      if (selectedStream !== 'all') {
        onStreamChange('all');
      }
      return;
    }

    // Check if the current stream is still valid for the selected grade
    const normalizedCurrent = selectedStream?.toLowerCase().trim();
    const isValidStream = availableStreams.some(
      s => s.toLowerCase() === normalizedCurrent
    );

    // Reset if stream doesn't exist in the new grade's streams
    if (selectedStream && !isValidStream && availableStreams.length > 0) {
      onStreamChange(availableStreams[0]);
    } else if (availableStreams.length === 0 && selectedStream && selectedStream !== 'all') {
      // No streams for this grade, reset to "all"
      onStreamChange('all');
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
 * Returns streams for a specific grade, with "All Streams" as the first option.
 * 
 * @param selectedGrade - The currently selected grade (empty string means no grade selected)
 * @returns Array of stream names with "all" prepended, or empty array if no streams
 */
export function useStreamsForGrade(selectedGrade: string): string[] {
  const config = useGradesStreamsConfig();

  return useMemo(() => {
    if (!selectedGrade || selectedGrade === 'all' || selectedGrade === 'All') {
      // No specific grade selected - return all unique streams
      return config.streams.slice().sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }

    // Get grade-specific streams
    const gradeStreams = getStreamsForGrade(selectedGrade, config);
    return gradeStreams;
  }, [selectedGrade, config]);
}
