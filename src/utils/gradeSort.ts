import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Custom Ascending Grade Rank
// ─────────────────────────────────────────────────────────────────────────────
// Implements the school's canonical grade progression:
//   Pre-Primary tier     : Playgroup / PP → 1
//                           PP1              → 2
//                           PP2              → 3
//   Primary tier         : Grade 1 → 4, Grade 2 → 5, ... Grade 6 → 9
//   Junior School tier   : Grade 7 → 10, Grade 8 → 11, Grade 9 → 12
//
// Anything else falls back to a numeric-extraction algorithm so unknown
// labels still sort in a sensible order rather than alphabetically.
// ─────────────────────────────────────────────────────────────────────────────

export type GradeCategory = 'Pre-Primary' | 'Primary' | 'Junior School';

export interface GradeRank {
  rank: number;
  category: GradeCategory;
}

// Map of canonical grade names → numeric rank.
// The keys are matched after `.toUpperCase().trim()` so case-insensitive.
const CANONICAL_GRADE_RANKS: Record<string, GradeRank> = {
  // Pre-Primary
  'PLAYGROUP':    { rank: 1, category: 'Pre-Primary' },
  'PP':          { rank: 1, category: 'Pre-Primary' },
  'PP1':         { rank: 2, category: 'Pre-Primary' },
  'PP2':         { rank: 3, category: 'Pre-Primary' },
  // Primary
  'GRADE 1':     { rank: 4,  category: 'Primary' },
  'GRADE 2':     { rank: 5,  category: 'Primary' },
  'GRADE 3':     { rank: 6,  category: 'Primary' },
  'GRADE 4':     { rank: 7,  category: 'Primary' },
  'GRADE 5':     { rank: 8,  category: 'Primary' },
  'GRADE 6':     { rank: 9,  category: 'Primary' },
  // Junior School
  'GRADE 7':     { rank: 10, category: 'Junior School' },
  'GRADE 8':     { rank: 11, category: 'Junior School' },
  'GRADE 9':     { rank: 12, category: 'Junior School' },
};

/**
 * Resolve a grade name to its numeric rank in the school's progression.
 * Returns `null` when the name doesn't match a canonical grade.
 */
export function getGradeRank(name: string): number | null {
  if (!name) return null;
  const key = name.toUpperCase().trim();
  const match = CANONICAL_GRADE_RANKS[key];
  return match ? match.rank : null;
}

/**
 * Resolve a grade name to its canonical category
 * (Pre-Primary, Primary, Junior School).
 * Returns `null` for unrecognised names.
 */
export function getGradeCategory(name: string): GradeCategory | null {
  if (!name) return null;
  const key = name.toUpperCase().trim();
  const match = CANONICAL_GRADE_RANKS[key];
  return match ? match.category : null;
}

/**
 * Fallback resolver — used when the grade name isn't in the canonical table
 * (e.g. a user-added "Grade 10"). It tries a numeric extraction so unknown
 * grades still sort by their numeric portion if present.
 */
function fallbackRank(name: string): number {
  const key = name.toUpperCase().trim();
  const match = key.match(/(\d+)/);
  if (match) {
    // Place any numerically-named grade after the canonical ranks (which top out at 12).
    return 100 + parseInt(match[1], 10);
  }
  return 1000;
}

/**
 * Resolve any grade name to a numeric rank for sorting.
 * Uses the canonical table first, then falls back to numeric extraction.
 */
function resolveRank(name: string): number {
  const canonical = getGradeRank(name);
  if (canonical !== null) return canonical;
  return fallbackRank(name);
}

/**
 * Sort an array of grade-like objects in the school's canonical ascending order.
 *
 *   sortGrades(grades)
 *   sortGrades(grades, (g) => g.label)
 *
 * @param grades  The array to sort. Not mutated — a new sorted array is returned.
 * @param getName Optional accessor — defaults to `.name`. Useful when the
 *                shape of the input doesn't expose `.name` directly.
 */
export const sortGrades = <T extends { name: string }>(
  grades: T[],
): T[] => {
  return [...grades].sort((a, b) => {
    const rankA = resolveRank(a.name);
    const rankB = resolveRank(b.name);

    if (rankA !== rankB) return rankA - rankB;
    // Stable tiebreaker: alphabetical, locale-aware
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
};

/**
 * Stable list of all canonical grade names in ascending order.
 * Useful for populating select dropdowns.
 */
export const CANONICAL_GRADE_NAMES_IN_ORDER: string[] = Object.entries(
  CANONICAL_GRADE_RANKS,
)
  .filter(([key]) => /^GRADE|^PLAYGROUP|^PP/.test(key))
  .sort(([, a], [, b]) => a.rank - b.rank)
  .map(([key]) => {
    // Convert canonical UPPERCASE keys back to the friendly display form
    if (key === 'PLAYGROUP') return 'Playgroup';
    if (key === 'PP') return 'PP';
    if (key === 'PP1') return 'PP1';
    if (key === 'PP2') return 'PP2';
    return key
      .split(' ')
      .map((part) =>
        /^\d+$/.test(part) ? part : part.charAt(0) + part.slice(1).toLowerCase(),
      )
      .join(' ');
  });

/**
 * Format a grade name into the school's preferred casing.
 * "grade 5" → "Grade 5", "pp1" → "PP1".
 */
export const formatGradeName = (name: string): string => {
  if (!name) return '';
  const trimmed = name.trim();
  const upper = trimmed.toUpperCase();

  if (upper === 'PLAYGROUP') return 'Playgroup';
  if (upper === 'PP') return 'PP';
  if (upper === 'PP1' || upper === 'PP2') return upper;

  // "grade 5" → "Grade 5"
  if (/^grade\s*\d+/i.test(trimmed)) {
    const numMatch = trimmed.match(/\d+/);
    return numMatch ? `Grade ${numMatch[0]}` : trimmed;
  }

  // Capitalize the first letter as a default
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};