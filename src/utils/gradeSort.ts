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
 *
 * All comparisons are done against this array's index to guarantee a
 * strict, predictable ascending sequence. Grades not in this list
 * (e.g. user-created "Special Class") are pushed to the end and
 * sorted alphabetically among themselves.
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
 * Lookup map for the canonical grade order. PP1 → 1, PP2 → 2,
 * Grade 1 → 3, … Grade 9 → 11. Used by `sortGradesAscending` for
 * strict, case-insensitive ordering.
 */
export const GRADE_ORDER_MAP: Record<string, number> = {
  'PP1': 1,
  'PP2': 2,
  'GRADE 1': 3,
  'GRADE 2': 4,
  'GRADE 3': 5,
  'GRADE 4': 6,
  'GRADE 5': 7,
  'GRADE 6': 8,
  'GRADE 7': 9,
  'GRADE 8': 10,
  'GRADE 9': 11,
};

/**
 * Sort an array of plain grade names (e.g. `["Grade 2", "PP1", "Grade 1"]`)
 * in canonical ascending order: PP1 → PP2 → Grade 1 → … → Grade 9.
 *
 * Unknown / non-canonical grades are pushed to the end and sorted
 * alphabetically among themselves. The input is never mutated.
 */
export const sortGradesAscending = (grades: string[]): string[] => {
  const canonical: string[] = [];
  const others: string[] = [];

  for (const raw of grades) {
    if (!raw) continue;
    const key = (raw ?? '').toUpperCase().trim();
    if (key in GRADE_ORDER_MAP) {
      canonical.push(raw);
    } else {
      others.push(raw);
    }
  }

  canonical.sort(
    (a, b) =>
      (GRADE_ORDER_MAP[(a ?? '').toUpperCase().trim()] ?? Number.MAX_SAFE_INTEGER) -
      (GRADE_ORDER_MAP[(b ?? '').toUpperCase().trim()] ?? Number.MAX_SAFE_INTEGER),
  );

  others.sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );

  return [...canonical, ...others];
};

/**
 * Stable list of all canonical grade names in ascending order.
 * Synonym for GRADE_ORDER — useful for dropdowns and defaults.
 */
export const CANONICAL_GRADE_NAMES_IN_ORDER: string[] = [...GRADE_ORDER];

/**
 * Map of canonical grade names → { rank, category }.
 * Rank = index in GRADE_ORDER + 1 so Pre-Primary = 1-2, Primary = 3-8,
 * Junior School = 9-11.
 */
const CANONICAL_GRADE_RANKS: Record<string, GradeRank> = {
  PP1:       { rank: 1,  category: 'Pre-Primary' },
  PP2:       { rank: 2,  category: 'Pre-Primary' },
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
 *
 *   "grade 5", "GRADE 5", "Grade 5 " → "Grade 5"
 *   "pp1", "PP1"                    → "PP1"
 *   "pp2"                            → "PP2"
 *   Anything unrecognised             → original trimmed value
 */
function normalise(name: string): string {
  if (!name) return '';
  const t = (name ?? '').trim();
  const upper = t.toUpperCase();

  if (upper === 'PP1') return 'PP1';
  if (upper === 'PP2') return 'PP2';

  // "Grade N" / "grade N" / "GRADE N" → "Grade N"
  const match = t.match(/^([A-Za-z]+)\s*(\d+)$/);
  if (match) {
    const word = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    return `${word} ${match[2]}`;
  }

  return t;
}

/**
 * Resolve a grade name to its numeric rank (position in GRADE_ORDER + 1).
 * Returns `null` for grades not in the canonical list.
 */
export function getGradeRank(name: string): number | null {
  const key = normalise(name);
  return CANONICAL_GRADE_RANKS[key]?.rank ?? null;
}

/**
 * Resolve a grade name to its canonical category.
 */
export function getGradeCategory(name: string): GradeCategory | null {
  const key = normalise(name);
  return CANONICAL_GRADE_RANKS[key]?.category ?? null;
}

/**
 * Sort an array of grade-like objects using GRADE_ORDER index lookup.
 *
 *   sortGrades(grades)   // items have a .name property
 *
 * Canonical grades (PP1–Grade 9) appear in strict GRADE_ORDER sequence.
 * Grades not in GRADE_ORDER are pushed to the end and sorted
 * alphabetically among themselves.  Returns a new array — the input
 * is never mutated.
 *
 * Algorithm:
 *   1. Split input into [canonical grades] and [others]
 *   2. Sort canonical by GRADE_ORDER index: aRank - bRank
 *   3. Sort others alphabetically
 *   4. Concatenate: canonical (first) + others (last)
 */
export const sortGrades = <T extends { name: string }>(
  grades: T[],
): T[] => {
  // Step 1 — partition
  const canonical = grades.filter((g) => GRADE_ORDER.includes(normalise(g.name)));
  const others    = grades.filter((g) => !GRADE_ORDER.includes(normalise(g.name)));

  // Step 2 — strict PP1 → Grade 9 sequence via index lookup
  const sortedCanonical = [...canonical].sort((a, b) => {
    return GRADE_ORDER.indexOf(normalise(a.name))
         - GRADE_ORDER.indexOf(normalise(b.name));
  });

  // Step 3 — alphabetical fallback for unknown grades
  const sortedOthers = [...others].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );

  // Step 4 — canonical first, then others
  return [...sortedCanonical, ...sortedOthers];
};

/**
 * Format a grade name into the canonical display form.
 *
 *   "grade 5" → "Grade 5"
 *   "pp1"     → "PP1"
 *   "PP2"     → "PP2"
 */
export const formatGradeName = (name: string): string => {
  return normalise(name);
};
