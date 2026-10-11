import type { User } from '@/context/AuthContext';

/**
 * Filter data array based on teacher's assigned class/stream scope
 * @param dataArray Array of data items to filter
 * @param user Current user object from AuthContext
 * @returns Filtered array based on user's role and scope
 */
export const filterByTeacherScope = (dataArray: any[], user: User | null): any[] => {
  if (!Array.isArray(dataArray)) return [];
  if (!user) return dataArray;

  const role = String(user.role || '').toUpperCase();
  const designation = String((user as any).designation || (user as any).specificRole || '').toUpperCase();

  // Global operational roles see all data
  if (
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN' ||
    role === 'OWNER' ||
    role === 'LIBRARIAN' ||
    designation.includes('ADMIN') ||
    designation.includes('HOI') ||
    designation.includes('DHOI') ||
    designation.includes('BURSAR') ||
    designation.includes('HEAD OF INSTITUTION') ||
    designation.includes('DEPUTY') ||
    designation.includes('ACCOUNTANT')
  ) {
    return dataArray;
  }

  // Class Teacher or assignedClass restriction
  if (
    role === 'CLASS_TEACHER' ||
    designation.includes('CLASS TEACHER') ||
    role === 'TEACHER' ||
    designation.includes('TEACHER') ||
    Boolean(user.assignedClass) ||
    Boolean(user.grade)
  ) {
    const targetClass = String(user.assignedClass || user.grade || '').trim().toLowerCase();
    const targetStream = String(user.assignedStream || user.stream || '').trim().toLowerCase();

    return dataArray.filter(item => {
      if (!item) return false;

      // Get item's class/grade and stream
      const itemClass = String(item.assignedClass || item.grade || item.classLevel || item.class || '').trim().toLowerCase();
      const itemStream = String(item.assignedStream || item.stream || '').trim().toLowerCase();

      // Normalize grade strings for comparison (handles "Grade 1" vs "1" etc.)
      const normalizeGrade = (gradeStr: string): string => {
        if (!gradeStr) return '';
        const numMatch = gradeStr.match(/(\d+)/);
        return numMatch ? `grade${numMatch[1]}` : gradeStr.toLowerCase().replace(/\s+/g, '');
      };

      const normalizedItemClass = normalizeGrade(itemClass);
      const normalizedTargetClass = normalizeGrade(targetClass);

      // Check if item matches user's assigned class/grade
      const classMatch = 
        normalizedItemClass === normalizedTargetClass ||
        itemClass.includes(targetClass) ||
        targetClass.includes(itemClass) ||
        // Handle cases like "Grade 1" vs "1"
        (targetClass && itemClass && 
         ((targetClass.includes('grade') && !itemClass.includes('grade') && itemClass === targetClass.replace('grade', '')) ||
          (!targetClass.includes('grade') && itemClass.includes('grade') && targetClass === itemClass.replace('grade', ''))));

      // Check if item matches user's assigned stream (if specified)
      const streamMatch = !targetStream || itemStream === targetStream || itemStream.includes(targetStream) || targetStream.includes(itemStream);

      return classMatch && streamMatch;
    });
  }

  return dataArray;
};

/**
 * Check if user has global role (can see all data)
 * @param user Current user object
 * @returns Boolean indicating if user has global access
 */
export const isGlobalRole = (user: User | null): boolean => {
  if (!user) return false;
  const role = String(user.role || '').toUpperCase();
  const designation = String((user as any).designation || (user as any).specificRole || '').toUpperCase();

  return (
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN' ||
    role === 'OWNER' ||
    role === 'LIBRARIAN' ||
    designation.includes('ADMIN') ||
    designation.includes('HOI') ||
    designation.includes('DHOI') ||
    designation.includes('BURSAR') ||
    designation.includes('HEAD OF INSTITUTION') ||
    designation.includes('DEPUTY') ||
    designation.includes('ACCOUNTANT')
  );
};

/**
 * Get teacher's assigned class/grade
 * @param user Current user object
 * @returns Assigned class/grade string or default
 */
export const getTeacherAssignedClass = (user: User | null): string => {
  if (!user) return 'Grade 1';
  return user.assignedClass || user.grade || 'Grade 1';
};

/**
 * Get teacher's assigned stream
 * @param user Current user object
 * @returns Assigned stream string or default
 */
export const getTeacherAssignedStream = (user: User | null): string => {
  if (!user) return 'BLUE';
  return user.assignedStream || user.stream || 'BLUE';
};