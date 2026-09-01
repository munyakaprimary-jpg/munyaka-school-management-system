// ─────────────────────────────────────────────────────────────────────────────
// Exact Grade Order — PP1 through Grade 9
// ─────────────────────────────────────────────────────────────────────────────
// Strict sequential ordering enforced by index lookup against GRADE_ORDER.
// Any grade not in the canonical list is pushed to the end alphabetically.
// ─────────────────────────────────────────────────────────────────────────────

export type GradeCategory = 'Pre-Primary' | 'Primary' | 'Junior School';

export interface GradeRank {
  rank: number;
  category: GradeCategory;
}

/**
 * Canonical grade ordering: PP1 → PP2 → Grade 1 → … → Grade 9.
 * All comparisons are done against this array's index to guarantee a
 * strict, predictable ascending sequence.
 */
export const GRADE_ORDER: string[] = [
  'PP1',
  'PP2',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
];

/**
 * Map of canonical grade names → { rank, category }.
 * Rank = index in GRADE_ORDER + 1 so Pre-Primary = 1-2, Primary = 3-8, Junior School = 9-11.
 */
const CANONICAL_GRADE_RANKS: Record<string, GradeRank> = {
  PP1:      { rank: 1,  category: 'Pre-Primary' },
  PP2:      { rank: 2,  category: 'Pre-Primary' },
  'Grade 1': { rank: 3,  category: 'Primary' },
  'Grade 2': { rank: 4,  category: 'Primary' },
  'Grade 3': { rank: 5,  category: 'Primary' },
  'Grade 4': { rank: 6,  category: 'Primary' },
  'Grade 5': { rank: 7,  category: 'Primary' },
  'Grade 6': { rank: 8,  category: 'Primary' },
  'Grade 7': { rank: 9,  category: 'Junior School' },
  'Grade 8': { rank: 10, category: 'Junior School' },
  'Grade 9': { rank: 11, category: 'Junior School' },
};

/**
 * Normalise a raw grade name to one that matches a key in GRADE_ORDER.
 * "grade 5", "GRADE 5", "Grade 5 " → "Grade 5"
 * "pp1", "PP1"                   → "PP1"
 * "pp2"                           → "PP2"
 * Anything unrecognised            → original trimmed value
 */
function normalise(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  const upper = trimmed.toUpperCase();

  // Match "Grade N" variants (any whitespace, any capitalisation)
  const gradeMatch = trimmed.match(/^([A-Za-z]+\s*\d+)$/);
  if (gradeMatch) {
    const inner = gradeMatch[1];
    const parts = inner.match(/^([A-Za-z]+)\s*(\d+)$/);
    if (parts) {
      const word = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
      return `${word} ${parts[2]}`; // "Grade 5", "grade 5" → "Grade 5"
    }
  }

  // PP1 / PP2 normalisation
  if (upper === 'PP1') return 'PP1';
  if (upper === 'PP2') return 'PP2';

  return trimmed;
}

/**
 * Resolve a grade name to its numeric rank.
 * Returns `null` for unrecognised names.
 */
export function getGradeRank(name: string): number | null {
  const key = normalise(name);
  const match = CANONICAL_GRADE_RANKS[key];
  return match ? match.rank : null;
}

/**
 * Resolve a grade name to its canonical category.
 */
export function getGradeCategory(name: string): GradeCategory | null {
  const key = normalise(name);
  const match = CANONICAL_GRADE_RANKS[key];
  return match ? match.category : null;
}

/**
 * Sort an array of grade-like objects using GRADE_ORDER index lookup.
 *
 *   sortGrades(grades)  // grades items have a .name property
 *
 * Canonical grades (PP1–Grade 9) appear in strict sequential order.
 * Any grade not in GRADE_ORDER is pushed to the end and sorted
 * alphabetically among themselves.
 *
 * Not mutated — returns a new sorted array.
 */
export const sortGrades = <T extends { name: string }>(
  grades: T[],
): T[] => {
  const canonical = grades.filter((g) => GRADE_ORDER.includes(normalise(g.name)));
  const others = grades.filter((g) => !GRADE_ORDER.includes(normalise(g.name)));

  const sortedCanonical = [...canonical].sort((a, b) => {
    return GRADE_ORDER.indexOf(normalise(a.name)) - GRADE_ORDER.indexOf(normalise(b.name));
  });

  const sortedOthers = [...others].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );

  return [...sortedCanonical, ...sortedOthers];
};

/**
 * Stable list of all canonical grade names in ascending order.
 * Useful for dropdown options and defaults.
 */
export const CANONICAL_GRADE_NAMES_IN_ORDER: string[] = [...GRADE_ORDER];

/**
 * Format a grade name into the canonical display form.
 * "grade 5"  → "Grade 5"
 * "pp1"      → "PP1"
 * "PP2"      → "PP2"
 */
export const formatGradeName = (name: string): string => {
  return normalise(name);
};