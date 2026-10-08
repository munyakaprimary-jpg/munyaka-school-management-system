/**
 * Global Grade-Specific Teacher Permission Guard Helper
 * Enforces that teachers can only view/modify records for their explicitly assigned grade and stream.
 */
import { normalizeGradeStr } from '@/utils/gradeUtils';

export interface UserContextType {
  role?: string;
  assignedClass?: string;
  assignedStream?: string;
  grade?: string;
  stream?: string;
}

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

/**
 * Helper to normalize grade strings consistently across the app.
 */
export { normalizeGradeStr };
