/**
 * Global Grade-Specific Teacher Permission Guard Helper
 * Enforces that teachers can only view/modify records for their explicitly assigned grade and stream.
 */

export interface UserContextType {
  role?: string;
  assignedClass?: string;
  assignedStream?: string;
  grade?: string;
  stream?: string;
}

/**
 * Harmonized grade matcher (supports "1", "Grade 1", "Grade One", etc.)
 */
export const normalizeGradeStr = (val: string): string => {
  if (!val) return '';
  const lower = val.toLowerCase().trim();
  const match = lower.match(/(\d+)/);
  if (match) return match[1];
  if (lower.includes('one') || lower.includes('1')) return '1';
  if (lower.includes('two') || lower.includes('2')) return '2';
  if (lower.includes('three') || lower.includes('3')) return '3';
  if (lower.includes('four') || lower.includes('4')) return '4';
  if (lower.includes('five') || lower.includes('5')) return '5';
  if (lower.includes('six') || lower.includes('6')) return '6';
  if (lower.includes('seven') || lower.includes('7')) return '7';
  if (lower.includes('eight') || lower.includes('8')) return '8';
  if (lower.includes('nine') || lower.includes('9')) return '9';
  return lower;
};

/**
 * Checks if the user is authorized to access a specific student/record based on grade and stream.
 * Admins have full access. Teachers are restricted to their assigned grade and stream.
 */
export const checkGradePermission = (
  user: UserContextType | null,
  recordGrade?: string,
  recordStream?: string
): { isAuthorized: boolean; isGradeMatch: boolean; isStreamMatch: boolean } => {
  if (!user) {
    return { isAuthorized: false, isGradeMatch: false, isStreamMatch: false };
  }

  const role = String(user.role || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'owner' || role === 'super_admin' || role === 'librarian';

  if (isAdmin) {
    return { isAuthorized: true, isGradeMatch: true, isStreamMatch: true };
  }

  const assignedGrade = user.assignedClass || user.grade || 'Grade 1';
  const assignedStream = user.assignedStream || user.stream || '';

  const recGrade = recordGrade || '';
  const recStream = recordStream || '';

  const normAssignedGrade = normalizeGradeStr(assignedGrade);
  const normRecGrade = normalizeGradeStr(recGrade);

  const gradeMatch =
    !recGrade ||
    !assignedGrade ||
    normRecGrade === normAssignedGrade ||
    recGrade.toLowerCase().includes(assignedGrade.toLowerCase()) ||
    assignedGrade.toLowerCase().includes(recGrade.toLowerCase());

  const streamMatch =
    !assignedStream ||
    !recStream ||
    recStream.toLowerCase().trim() === assignedStream.toLowerCase().trim() ||
    recStream.toLowerCase().includes(assignedStream.toLowerCase()) ||
    assignedStream.toLowerCase().includes(recStream.toLowerCase());

  const isAuthorized = gradeMatch && streamMatch;

  return {
    isAuthorized,
    isGradeMatch: gradeMatch,
    isStreamMatch: streamMatch,
  };
};
