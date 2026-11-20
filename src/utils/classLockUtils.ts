/**
 * Strict Class Lock & Matching Utilities for Teachers
 * 
 * Provides robust parsing and matching for bound class strings like
 * "Grade 8 Jupiter" or "Grade 8 (Jupiter)" against learner records.
 */

export interface ParsedClass {
  grade: string;
  stream: string;
  displayGrade?: string;
  displayStream?: string;
  isLocked: boolean;
}

/**
 * Parses a class string like "Grade 4 Yellow", "Grade 4 (Yellow)", or "Grade 4"
 * into a normalized { grade, stream, displayGrade, displayStream, isLocked } object.
 * Strips parentheses, normalizes whitespace and case.
 */
export function parseBoundClass(boundClass: string | null | undefined): ParsedClass {
  if (!boundClass || boundClass === 'No Class Assigned' || boundClass === 'All Grades' || boundClass === 'all') {
    return { grade: '', stream: '', displayGrade: '', displayStream: '', isLocked: false };
  }

  const raw = String(boundClass).trim();
  if (!raw) return { grade: '', stream: '', displayGrade: '', displayStream: '', isLocked: false };

  // Remove parentheses and their contents if they contain the stream
  let cleaned = raw.replace(/\([^)]*\)/g, '').trim();
  const parenMatch = raw.match(/\(([^)]+)\)/);
  const parenStream = parenMatch ? parenMatch[1].trim() : '';

  const parts = cleaned.split(/\s+/);
  let gradePart = '';
  let streamPart = '';

  if (parts.length >= 2) {
    streamPart = parts[parts.length - 1];
    gradePart = parts.slice(0, parts.length - 1).join(' ');
  } else {
    gradePart = raw;
  }

  const finalStream = streamPart || parenStream;

  // Normalized strings for comparison (e.g. "Grade 4" -> "Grade 4", "Yellow" -> "Yellow")
  const normGrade = gradePart.toLowerCase().includes('grade') ? gradePart : `Grade ${gradePart}`.trim();
  const normStream = finalStream;

  return {
    grade: normGrade,
    stream: normStream,
    displayGrade: normGrade,
    displayStream: normStream,
    isLocked: true
  };
}

/**
 * Checks if a learner record matches a bound class string or normalized filter.
 */
export function matchesBoundClass(learner: any, boundClass: string | null | undefined): boolean {
  if (!boundClass) return true;
  const target = parseBoundClass(boundClass);
  if (!target.isLocked) return true;
  if (!learner) return false;

  const learnerGrade = String(learner?.grade || learner?.gradeLevel || learner?.class || learner?.currentGrade || '').trim();
  const learnerStream = String(learner?.stream || '').trim();

  const targetGradeNum = target.grade.replace(/grade/gi, '').trim().toLowerCase();
  const learnerGradeNum = learnerGrade.replace(/grade/gi, '').trim().toLowerCase();
  const gradeMatches = !targetGradeNum || learnerGradeNum === targetGradeNum || learnerGrade.toLowerCase().includes(target.grade.toLowerCase());

  const targetStreamLower = target.stream.toLowerCase();
  const learnerStreamLower = learnerStream.toLowerCase();
  const streamMatches = !targetStreamLower || learnerStreamLower === targetStreamLower || learnerStreamLower.includes(targetStreamLower) || targetStreamLower.includes(learnerStreamLower);

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