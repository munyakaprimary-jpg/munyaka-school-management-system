/**
 * Strict Class Lock & Matching Utilities for Teachers
 * 
 * Provides robust parsing and matching for bound class strings like
 * "Grade 8 Jupiter" or "Grade 8 (Jupiter)" against learner records.
 */

export interface ParsedClass {
  grade: string;
  stream: string;
}

/**
 * Parses a class string like "Grade 8 Jupiter", "Grade 8 (Jupiter)", or "Grade 8"
 * into a normalized { grade, stream } object.
 * - Case-insensitive
 * - Ignores parentheses
 * - Strips "Grade" keyword
 */
export function parseBoundClass(boundClass: string | null | undefined): ParsedClass {
  if (!boundClass) return { grade: '', stream: '' };

  const raw = String(boundClass).trim();
  if (!raw) return { grade: '', stream: '' };

  // Remove parentheses and their contents if they contain the stream
  let cleaned = raw.replace(/\([^)]*\)/g, '').trim();
  // If parentheses contained the stream, extract it
  const parenMatch = raw.match(/\(([^)]+)\)/);
  const parenStream = parenMatch ? parenMatch[1].trim() : '';

  const parts = cleaned.split(/\s+/);
  let grade = '';
  let stream = '';

  if (parts.length >= 2) {
    stream = parts[parts.length - 1];
    grade = parts.slice(0, parts.length - 1).join(' ');
  } else {
    grade = raw;
  }

  // Normalize grade: strip "Grade" keyword, keep numbers/letters
  const normalizedGrade = grade.replace(/grade/gi, '').replace(/[^a-zA-Z0-9]/g, '').trim();
  const normalizedStream = (stream || parenStream).replace(/[^a-zA-Z0-9]/g, '').trim();

  return {
    grade: normalizedGrade,
    stream: normalizedStream
  };
}

/**
 * Checks if a learner record matches a bound class string.
 * Matches against learner's grade, gradeLevel, class, and stream fields.
 * Case-insensitive, ignores parentheses and extra whitespace.
 */
export function matchesBoundClass(learner: any, boundClass: string | null | undefined): boolean {
  if (!boundClass) return true; // No lock = see all
  if (!learner) return false;

  const target = parseBoundClass(boundClass);
  if (!target.grade && !target.stream) return true;

  // Gather candidate grade strings from the learner record
  const learnerGradeRaw = String(
    learner?.grade || learner?.gradeLevel || learner?.class || learner?.currentGrade || ''
  ).trim();
  const learnerStreamRaw = String(learner?.stream || '').trim();

  // Parse learner's class similarly
  const learnerParsed = parseBoundClass(
    learnerGradeRaw + (learnerStreamRaw ? ' ' + learnerStreamRaw : '')
  );

  // Grade matching: exact or substring inclusion
  const gradeMatches = !target.grade ||
    learnerParsed.grade === target.grade ||
    learnerParsed.grade.includes(target.grade) ||
    target.grade.includes(learnerParsed.grade);

  // Stream matching: exact or substring inclusion (if target stream is specified)
  const streamMatches = !target.stream ||
    !learnerParsed.stream ||
    learnerParsed.stream === target.stream ||
    learnerParsed.stream.includes(target.stream) ||
    target.stream.includes(learnerParsed.stream);

  return gradeMatches && streamMatches;
}

/**
 * Extracts the bound class info from a teacher's session/localStorage record.
 * Checks multiple sources: user object, matchedStaffRecord, localStorage.
 */
export function getTeacherBoundClass(user: any, staffRecord: any): string | null {
  // Priority order for bound class sources
  const sources = [
    user?.lockedClass,
    staffRecord?.lockedClass,
    user?.assignedClass,
    staffRecord?.assignedClass,
    user?.homeroomGrade && user?.homeroomStream ? `${user.homeroomGrade} ${user.homeroomStream}` : null,
    staffRecord?.homeroomGrade && staffRecord?.homeroomStream ? `${staffRecord.homeroomGrade} ${staffRecord.homeroomStream}` : null,
    Array.isArray(user?.assignedClasses) && user.assignedClasses.length > 0 ? user.assignedClasses[0] : null,
    Array.isArray(staffRecord?.assignedClasses) && staffRecord.assignedClasses.length > 0 ? staffRecord.assignedClasses[0] : null
  ].filter(Boolean) as string[];

  // Ignore generic placeholders
  const placeholders = ['Grade 1 Blue', 'Grade 1', 'All Grades', 'all', ''];
  for (const src of sources) {
    if (!placeholders.includes(src)) return src;
  }

  return null;
}