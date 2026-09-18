/**
 * Role & Specialization Helpers for Munyaka LAN Portal
 * ===================================================
 */

export function normalizeRole(role?: string): string {
  if (!role) return '';
  return String(role).trim().toUpperCase();
}

export function isTeacherRole(role?: string, staffCategory?: string, specialties?: string[] | string): boolean {
  const normRole = normalizeRole(role);
  const normCat = normalizeRole(staffCategory);
  
  const teacherKeywords = [
    'TEACHER',
    'SUBJECT TEACHER',
    'CLASS TEACHER',
    'HEAD TEACHER',
    'DEPUTY HEAD TEACHER',
    'SENIOR TEACHER'
  ];

  const matchesKeyword = teacherKeywords.some(kw => normRole.includes(kw));
  const isTeachingCategory = normCat === 'TEACHING';

  // Check specialties
  let hasIct = false;
  let hasLibrary = false;
  if (Array.isArray(specialties)) {
    hasIct = specialties.some(s => String(s).toUpperCase().includes('ICT'));
    hasLibrary = specialties.some(s => String(s).toUpperCase().includes('LIB'));
  } else if (typeof specialties === 'string') {
    hasIct = specialties.toUpperCase().includes('ICT');
    hasLibrary = specialties.toUpperCase().includes('LIB');
  }

  if (normRole.includes('ICT') || hasIct) return false; // Handled by ICT role
  if (normRole.includes('LIBRARIAN') || hasLibrary) return false; // Handled by Library role

  return matchesKeyword || isTeachingCategory;
}

export function isIctRole(role?: string, specialties?: string[] | string): boolean {
  const normRole = normalizeRole(role);
  let hasIct = false;
  if (Array.isArray(specialties)) {
    hasIct = specialties.some(s => String(s).toUpperCase().includes('ICT'));
  } else if (typeof specialties === 'string') {
    hasIct = specialties.toUpperCase().includes('ICT');
  }
  return normRole.includes('ICT') || hasIct;
}

export function isLibrarianRole(role?: string, specialties?: string[] | string): boolean {
  const normRole = normalizeRole(role);
  let hasLib = false;
  if (Array.isArray(specialties)) {
    hasLib = specialties.some(s => String(s).toUpperCase().includes('LIB'));
  } else if (typeof specialties === 'string') {
    hasLib = specialties.toUpperCase().includes('LIB');
  }
  return normRole.includes('LIBRARIAN') || normRole.includes('LIBRARY') || hasLib;
}
