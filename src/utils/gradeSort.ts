import React from 'react';

// Natural grade sorting and formatting helper
// Order: PP1, PP2, Grade 1 ... Grade 9 (or any alphanumeric grades)
export const sortGrades = <T extends { name: string }>(grades: T[]): T[] => {
  return [...grades].sort((a, b) => {
    const parseGradeWeight = (name: string) => {
      const upper = name.toUpperCase().trim();
      if (upper === 'PP1') return 10;
      if (upper === 'PP2') return 20;
      if (upper.includes('PP')) return 15;
      
      // Extract numbers for natural sorting e.g. "Grade 1" -> 1, "Grade 10" -> 10
      const match = upper.match(/(\d+)/);
      if (match) {
        return 100 + parseInt(match[1], 10);
      }
      return 1000;
    };

    const weightA = parseGradeWeight(a.name);
    const weightB = parseGradeWeight(b.name);

    if (weightA !== weightB) {
      return weightA - weightB;
    }
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });
};

export const formatGradeName = (name: string): string => {
  if (!name) return '';
  const trimmed = name.trim();
  const upper = trimmed.toUpperCase();
  if (upper === 'PP1' || upper === 'PP2') return upper;
  
  // Ensure "grade 5" -> "Grade 5"
  if (/^grade\s*\d+/i.test(trimmed)) {
    const numMatch = trimmed.match(/\d+/);
    return numMatch ? `Grade ${numMatch[0]}` : trimmed;
  }
  return trimmed;
};
